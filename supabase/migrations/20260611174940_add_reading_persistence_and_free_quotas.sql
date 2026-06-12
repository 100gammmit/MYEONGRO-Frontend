insert into public.profiles (id, display_name)
select users.id,
  coalesce(users.raw_user_meta_data ->> 'name', users.raw_user_meta_data ->> 'full_name')
from auth.users as users
on conflict (id) do nothing;

alter table public.readings
  add column if not exists deleted_at timestamptz;

alter table public.readings
  add column if not exists request_id uuid;

update public.readings
set request_id = id
where request_id is null;

alter table public.readings
  alter column request_id set default gen_random_uuid();

alter table public.readings
  alter column request_id set not null;

alter table public.readings
  add column if not exists input_hash text;

update public.readings
set input_hash = encode(digest(coalesce(input::text, '{}'::jsonb::text), 'sha256'), 'hex')
where input_hash is null;

update public.readings
set input_hash = encode(digest(coalesce(input::text, '{}'::jsonb::text), 'sha256'), 'hex')
where length(btrim(input_hash)) = 0;

alter table public.readings
  alter column input_hash set not null;

alter table public.readings
  drop constraint if exists readings_input_hash_nonempty;

alter table public.readings
  add constraint readings_input_hash_nonempty
  check (length(btrim(input_hash)) > 0);

create unique index readings_user_request_id_key
  on public.readings (user_id, request_id)
  where user_id is not null;

create unique index readings_guest_request_id_key
  on public.readings (guest_session_id, request_id)
  where guest_session_id is not null;

create index readings_active_user_created_idx
  on public.readings (user_id, created_at desc)
  where deleted_at is null;

create index readings_active_guest_created_idx
  on public.readings (guest_session_id, created_at desc)
  where deleted_at is null;

create table public.free_reading_quota_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  guest_session_id uuid,
  ip_hash text not null check (length(btrim(ip_hash)) > 0),
  reading_id uuid references public.readings(id) on delete set null,
  request_id uuid not null,
  created_at timestamptz not null default now(),
  constraint free_reading_quota_events_exactly_one_subject check (
    (user_id is not null)::integer + (guest_session_id is not null)::integer = 1
  )
);

create unique index free_reading_quota_events_reading_id_key
  on public.free_reading_quota_events (reading_id)
  where reading_id is not null;

create unique index free_reading_quota_events_user_request_id_key
  on public.free_reading_quota_events (user_id, request_id)
  where user_id is not null and request_id is not null;

create unique index free_reading_quota_events_guest_request_id_key
  on public.free_reading_quota_events (guest_session_id, request_id)
  where guest_session_id is not null and request_id is not null;

create or replace function public.reserve_free_reading_quota(
  requested_user_id uuid,
  requested_guest_session_id uuid,
  requested_ip_hash text,
  requested_reading_id uuid,
  requested_request_id uuid
)
returns table (
  quota_event_id uuid,
  user_id uuid,
  guest_session_id uuid,
  reading_id uuid,
  request_id uuid,
  already_reserved boolean
)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  normalized_ip_hash text := btrim(coalesce(requested_ip_hash, ''));
  normalized_request_id uuid;
  existing_event public.free_reading_quota_events%rowtype;
  inserted_event public.free_reading_quota_events%rowtype;
  guest_hourly_count integer := 0;
  guest_daily_count integer := 0;
  user_daily_count integer := 0;
begin
  if (requested_user_id is not null)::integer
    + (requested_guest_session_id is not null)::integer <> 1 then
    raise exception 'Exactly one quota subject is required';
  end if;

  if (requested_reading_id is not null)::integer
    + (requested_request_id is not null)::integer <> 1 then
    raise exception 'Exactly one reservation key is required';
  end if;

  if normalized_ip_hash = '' then
    raise exception 'IP hash is required';
  end if;

  if requested_reading_id is not null then
    select readings.request_id into normalized_request_id
    from public.readings
    where readings.id = requested_reading_id
      and (
        (requested_user_id is not null and readings.user_id = requested_user_id)
        or (
          requested_guest_session_id is not null
          and readings.guest_session_id = requested_guest_session_id
        )
      );

    if normalized_request_id is null then
      raise exception 'Reading not found for quota subject';
    end if;
  else
    normalized_request_id := requested_request_id;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      coalesce('user:' || requested_user_id::text, 'guest:' || requested_guest_session_id::text),
      0
    )
  );

  if requested_guest_session_id is not null then
    perform pg_advisory_xact_lock(
      hashtextextended('ip:' || normalized_ip_hash, 0)
    );
  end if;

  select * into existing_event
  from public.free_reading_quota_events
  where (
    (free_reading_quota_events.reading_id = requested_reading_id)
    or (
      (
          requested_user_id is not null
          and free_reading_quota_events.user_id = requested_user_id
        )
        or (
          requested_guest_session_id is not null
          and free_reading_quota_events.guest_session_id = requested_guest_session_id
        )
      )
      and free_reading_quota_events.request_id = normalized_request_id
    )
  )
  order by free_reading_quota_events.created_at asc
  limit 1
  for update;

  if found then
    if requested_reading_id is not null and existing_event.reading_id is null then
      update public.free_reading_quota_events
      set reading_id = requested_reading_id
      where free_reading_quota_events.id = existing_event.id
      returning * into existing_event;
    end if;

    return query select
      existing_event.id,
      existing_event.user_id,
      existing_event.guest_session_id,
      existing_event.reading_id,
      existing_event.request_id,
      true;
    return;
  end if;

  if requested_guest_session_id is not null then
    select count(*)::integer into guest_hourly_count
    from public.free_reading_quota_events
    where (
        free_reading_quota_events.guest_session_id = requested_guest_session_id
        or free_reading_quota_events.ip_hash = normalized_ip_hash
      )
      and created_at >= statement_timestamp() - interval '1 hour';

    if guest_hourly_count >= 3 then
      raise exception 'FREE_READING_QUOTA_EXCEEDED'
        using errcode = 'RL101',
          detail = 'guest_hourly_limit',
          hint = 'Guests can reserve at most 3 free readings per rolling hour.';
    end if;

    select count(*)::integer into guest_daily_count
    from public.free_reading_quota_events
    where (
        free_reading_quota_events.guest_session_id = requested_guest_session_id
        or free_reading_quota_events.ip_hash = normalized_ip_hash
      )
      and timezone('Asia/Seoul', created_at)::date
        = timezone('Asia/Seoul', statement_timestamp())::date;

    if guest_daily_count >= 5 then
      raise exception 'FREE_READING_QUOTA_EXCEEDED'
        using errcode = 'RL102',
          detail = 'guest_daily_limit_seoul',
          hint = 'Guests can reserve at most 5 free readings per Asia/Seoul calendar day.';
    end if;
  else
    select count(*)::integer into user_daily_count
    from public.free_reading_quota_events
    where free_reading_quota_events.user_id = requested_user_id
      and timezone('Asia/Seoul', created_at)::date
        = timezone('Asia/Seoul', statement_timestamp())::date;

    if user_daily_count >= 10 then
      raise exception 'FREE_READING_QUOTA_EXCEEDED'
        using errcode = 'RL103',
          detail = 'user_daily_limit_seoul',
          hint = 'Users can reserve at most 10 free readings per Asia/Seoul calendar day.';
    end if;
  end if;

  insert into public.free_reading_quota_events (
    user_id,
    guest_session_id,
    ip_hash,
    reading_id,
    request_id
  ) values (
    requested_user_id,
    requested_guest_session_id,
    normalized_ip_hash,
    requested_reading_id,
    normalized_request_id
  )
  returning * into inserted_event;

  return query select
    inserted_event.id,
    inserted_event.user_id,
    inserted_event.guest_session_id,
    inserted_event.reading_id,
    inserted_event.request_id,
    false;
end;
$$;

create or replace function public.create_pending_free_reading(
  requested_user_id uuid,
  requested_guest_session_id uuid,
  requested_ip_hash text,
  requested_request_id uuid,
  requested_input_hash text,
  requested_kind public.reading_kind,
  requested_input jsonb,
  requested_provider text,
  requested_model text,
  requested_prompt_version text
)
returns table (
  reading_id uuid,
  generation_id uuid,
  created boolean
)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  existing_reading public.readings%rowtype;
  inserted_reading public.readings%rowtype;
  existing_generation_id uuid;
  inserted_generation_id uuid;
begin
  if length(btrim(coalesce(requested_input_hash, ''))) = 0 then
    raise exception 'Input hash is required';
  end if;

  perform *
  from public.reserve_free_reading_quota(
    requested_user_id,
    requested_guest_session_id,
    requested_ip_hash,
    null,
    requested_request_id
  );

  select * into existing_reading
  from public.readings
  where (
      requested_user_id is not null
      and readings.user_id = requested_user_id
      and readings.request_id = requested_request_id
    )
    or (
      requested_guest_session_id is not null
      and readings.guest_session_id = requested_guest_session_id
      and readings.request_id = requested_request_id
    )
  limit 1
  for update;

  if found then
    if existing_reading.deleted_at is not null then
      raise exception 'READING_DELETED'
        using errcode = 'RL105';
    end if;
    if existing_reading.input_hash <> requested_input_hash then
      raise exception 'IDEMPOTENCY_CONFLICT'
        using errcode = 'RL104';
    end if;

    select generation_records.id into existing_generation_id
    from public.generation_records
    where generation_records.reading_id = existing_reading.id
    order by generation_records.created_at desc
    limit 1;

    if existing_generation_id is null then
      raise exception 'GENERATION_RECORD_MISSING'
        using errcode = 'RL106';
    end if;

    return query select existing_reading.id, existing_generation_id, false;
    return;
  end if;

  insert into public.readings (
    user_id,
    guest_session_id,
    request_id,
    input_hash,
    kind,
    tier,
    status,
    title,
    input
  ) values (
    requested_user_id,
    requested_guest_session_id,
    requested_request_id,
    requested_input_hash,
    requested_kind,
    'free',
    'generating',
    'Generating...',
    requested_input
  )
  returning * into inserted_reading;

  insert into public.generation_records (
    reading_id,
    provider,
    model,
    prompt_version,
    idempotency_key,
    status
  ) values (
    inserted_reading.id,
    requested_provider,
    requested_model,
    requested_prompt_version,
    'free-reading:' || inserted_reading.id::text,
    'pending'
  )
  returning generation_records.id into inserted_generation_id;

  update public.free_reading_quota_events
  set reading_id = inserted_reading.id
  where free_reading_quota_events.request_id = requested_request_id
    and free_reading_quota_events.reading_id is null
    and (
      (
        requested_user_id is not null
        and free_reading_quota_events.user_id = requested_user_id
      )
      or (
        requested_guest_session_id is not null
        and free_reading_quota_events.guest_session_id = requested_guest_session_id
      )
    );

  return query select inserted_reading.id, inserted_generation_id, true;
end;
$$;

create or replace function public.complete_free_reading_generation(
  requested_reading_id uuid,
  requested_generation_id uuid,
  requested_title text,
  requested_result jsonb
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  changed_rows integer;
begin
  update public.generation_records
  set status = 'completed',
    error_code = null
  where generation_records.id = requested_generation_id
    and generation_records.reading_id = requested_reading_id
    and generation_records.status = 'pending';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then
    raise exception 'GENERATION_STATE_CONFLICT'
      using errcode = 'RL107';
  end if;

  update public.readings
  set status = 'completed',
    title = requested_title,
    result = requested_result
  where readings.id = requested_reading_id
    and readings.status = 'generating'
    and readings.deleted_at is null;
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then
    raise exception 'READING_STATE_CONFLICT'
      using errcode = 'RL108';
  end if;
end;
$$;

create or replace function public.fail_free_reading_generation(
  requested_reading_id uuid,
  requested_generation_id uuid,
  requested_error_code text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  changed_rows integer;
begin
  update public.generation_records
  set status = 'failed',
    error_code = requested_error_code
  where generation_records.id = requested_generation_id
    and generation_records.reading_id = requested_reading_id
    and generation_records.status = 'pending';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then
    raise exception 'GENERATION_STATE_CONFLICT'
      using errcode = 'RL107';
  end if;

  update public.readings
  set status = 'failed'
  where readings.id = requested_reading_id
    and readings.status = 'generating'
    and readings.deleted_at is null;
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then
    raise exception 'READING_STATE_CONFLICT'
      using errcode = 'RL108';
  end if;
end;
$$;

alter table public.free_reading_quota_events enable row level security;

revoke all on table public.free_reading_quota_events from public;
revoke all on table public.free_reading_quota_events from anon;
revoke all on table public.free_reading_quota_events from authenticated;
grant select, insert on table public.free_reading_quota_events to service_role;

revoke all on table public.generation_records from public;
revoke all on table public.generation_records from anon;
revoke all on table public.generation_records from authenticated;
grant select, insert, update, delete on table public.generation_records to service_role;

revoke insert, update, delete on table public.readings from public;
revoke insert, update, delete on table public.readings from anon;
revoke insert, update, delete on table public.readings from authenticated;
grant select, insert, update, delete on table public.readings to service_role;

drop policy if exists readings_delete_own on public.readings;
drop policy if exists readings_insert_own on public.readings;
drop policy if exists readings_select_own on public.readings;
create policy readings_select_own on public.readings
for select using (user_id = auth.uid() and deleted_at is null);

drop policy if exists readings_update_own on public.readings;
drop policy if exists generation_records_select_own on public.generation_records;

revoke create on schema public from public;
revoke create on schema public from anon;
revoke create on schema public from authenticated;

revoke all on function public.reserve_free_reading_quota(
  uuid, uuid, text, uuid, uuid
) from public;
revoke all on function public.reserve_free_reading_quota(
  uuid, uuid, text, uuid, uuid
) from anon;
revoke all on function public.reserve_free_reading_quota(
  uuid, uuid, text, uuid, uuid
) from authenticated;
grant execute on function public.reserve_free_reading_quota(
  uuid, uuid, text, uuid, uuid
) to service_role;

revoke all on function public.create_pending_free_reading(
  uuid, uuid, text, uuid, text, public.reading_kind, jsonb, text, text, text
) from public;
revoke all on function public.create_pending_free_reading(
  uuid, uuid, text, uuid, text, public.reading_kind, jsonb, text, text, text
) from anon;
revoke all on function public.create_pending_free_reading(
  uuid, uuid, text, uuid, text, public.reading_kind, jsonb, text, text, text
) from authenticated;
grant execute on function public.create_pending_free_reading(
  uuid, uuid, text, uuid, text, public.reading_kind, jsonb, text, text, text
) to service_role;

revoke all on function public.complete_free_reading_generation(
  uuid, uuid, text, jsonb
) from public;
revoke all on function public.complete_free_reading_generation(
  uuid, uuid, text, jsonb
) from anon;
revoke all on function public.complete_free_reading_generation(
  uuid, uuid, text, jsonb
) from authenticated;
grant execute on function public.complete_free_reading_generation(
  uuid, uuid, text, jsonb
) to service_role;

revoke all on function public.fail_free_reading_generation(
  uuid, uuid, text
) from public;
revoke all on function public.fail_free_reading_generation(
  uuid, uuid, text
) from anon;
revoke all on function public.fail_free_reading_generation(
  uuid, uuid, text
) from authenticated;
grant execute on function public.fail_free_reading_generation(
  uuid, uuid, text
) to service_role;
