create extension if not exists pgcrypto;

create type public.reading_kind as enum ('tarot', 'saju');
create type public.reading_tier as enum ('free', 'paid');
create type public.reading_status as enum ('draft', 'generating', 'completed', 'failed');
create type public.consent_document_type as enum ('terms', 'privacy', 'sensitive-data');
create type public.purchase_status as enum ('pending', 'confirming', 'paid', 'cancelled', 'failed');
create type public.followup_status as enum ('pending', 'completed', 'failed');
create type public.generation_status as enum ('pending', 'completed', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  guest_session_id uuid,
  kind public.reading_kind not null,
  tier public.reading_tier not null default 'free',
  status public.reading_status not null default 'draft',
  title text not null,
  input jsonb not null default '{}'::jsonb,
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint readings_exactly_one_owner check (
    (user_id is not null)::integer + (guest_session_id is not null)::integer = 1
  )
);

alter table public.readings add constraint readings_id_user_key unique (id, user_id);

create index readings_user_created_idx on public.readings (user_id, created_at desc);
create index readings_guest_created_idx on public.readings (guest_session_id, created_at desc);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  guest_session_id uuid,
  document_type public.consent_document_type not null,
  document_version text not null check (length(trim(document_version)) > 0),
  accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint consents_exactly_one_subject check (
    (user_id is not null)::integer + (guest_session_id is not null)::integer = 1
  )
);

create unique index consents_user_document_version_key
  on public.consents (user_id, document_type, document_version)
  where user_id is not null;
create unique index consents_guest_document_version_key
  on public.consents (guest_session_id, document_type, document_version)
  where guest_session_id is not null;

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  reading_id uuid not null references public.readings(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  order_id text not null unique check (length(trim(order_id)) > 0),
  payment_key text unique,
  amount integer not null default 3900 check (amount = 3900),
  currency text not null default 'KRW' check (currency = 'KRW'),
  status public.purchase_status not null default 'pending',
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchases_paid_fields check (
    status <> 'paid' or (payment_key is not null and approved_at is not null)
  ),
  constraint purchases_reading_owner_fk
    foreign key (reading_id, user_id)
    references public.readings(id, user_id)
    on delete restrict
);

create unique index purchases_one_paid_reading_key
  on public.purchases (reading_id)
  where status = 'paid';

create table public.followups (
  id uuid primary key default gen_random_uuid(),
  reading_id uuid not null references public.readings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  question text not null check (length(trim(question)) > 0),
  answer text,
  sequence smallint not null check (sequence between 1 and 2),
  status public.followup_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reading_id, sequence)
);

create table public.generation_records (
  id uuid primary key default gen_random_uuid(),
  reading_id uuid not null references public.readings(id) on delete cascade,
  provider text not null,
  model text not null,
  prompt_version text not null,
  idempotency_key text not null unique,
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  status public.generation_status not null default 'pending',
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.guest_ownership_transfers (
  guest_session_id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  transferred_reading_count integer not null default 0,
  transferred_consent_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.payment_webhook_events (
  event_id text primary key,
  order_id text not null references public.purchases(order_id) on delete cascade,
  payment_key text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger readings_set_updated_at before update on public.readings
for each row execute function public.set_updated_at();
create trigger purchases_set_updated_at before update on public.purchases
for each row execute function public.set_updated_at();
create trigger followups_set_updated_at before update on public.followups
for each row execute function public.set_updated_at();
create trigger generation_records_set_updated_at before update on public.generation_records
for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

create or replace function public.record_required_consents(
  requested_user_id uuid,
  requested_guest_session_id uuid,
  requested_document_types public.consent_document_type[],
  requested_document_versions text[],
  requested_accepted_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item_index integer;
begin
  if (requested_user_id is not null)::integer
    + (requested_guest_session_id is not null)::integer <> 1 then
    raise exception 'Exactly one consent subject is required';
  end if;
  if cardinality(requested_document_types) <> 3
    or cardinality(requested_document_versions) <> 3
    or not requested_document_types @> array[
      'terms', 'privacy', 'sensitive-data'
    ]::public.consent_document_type[] then
    raise exception 'All required consent documents are required';
  end if;

  for item_index in 1..3 loop
    if requested_user_id is not null then
      insert into public.consents (
        user_id, document_type, document_version, accepted_at
      ) values (
        requested_user_id,
        requested_document_types[item_index],
        requested_document_versions[item_index],
        requested_accepted_at
      )
      on conflict (user_id, document_type, document_version)
        where user_id is not null
      do update set accepted_at = excluded.accepted_at;
    else
      insert into public.consents (
        guest_session_id, document_type, document_version, accepted_at
      ) values (
        requested_guest_session_id,
        requested_document_types[item_index],
        requested_document_versions[item_index],
        requested_accepted_at
      )
      on conflict (guest_session_id, document_type, document_version)
        where guest_session_id is not null
      do update set accepted_at = excluded.accepted_at;
    end if;
  end loop;
end;
$$;

create or replace function public.transfer_guest_ownership(
  requested_guest_session_id uuid
)
returns table (
  guest_session_id uuid,
  user_id uuid,
  transferred_reading_count integer,
  transferred_consent_count integer,
  already_transferred boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  reading_count integer := 0;
  consent_count integer := 0;
  prior public.guest_ownership_transfers%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(requested_guest_session_id::text, 0));
  select * into prior
  from public.guest_ownership_transfers
  where guest_ownership_transfers.guest_session_id = requested_guest_session_id;

  if found then
    if prior.user_id <> current_user_id then
      raise exception 'Guest session was transferred to another user';
    end if;
    return query select prior.guest_session_id, prior.user_id,
      prior.transferred_reading_count, prior.transferred_consent_count, true;
    return;
  end if;

  update public.readings
  set user_id = current_user_id, guest_session_id = null
  where readings.guest_session_id = requested_guest_session_id
    and readings.user_id is null;
  get diagnostics reading_count = row_count;

  insert into public.consents (
    user_id, document_type, document_version, accepted_at, created_at
  )
  select current_user_id, document_type, document_version, accepted_at, created_at
  from public.consents
  where consents.guest_session_id = requested_guest_session_id
  on conflict (user_id, document_type, document_version)
    where user_id is not null
  do nothing;
  get diagnostics consent_count = row_count;

  delete from public.consents
  where consents.guest_session_id = requested_guest_session_id;

  insert into public.guest_ownership_transfers (
    guest_session_id, user_id, transferred_reading_count, transferred_consent_count
  ) values (
    requested_guest_session_id, current_user_id, reading_count, consent_count
  );

  return query select requested_guest_session_id, current_user_id,
    reading_count, consent_count, false;
end;
$$;

create or replace function public.claim_payment_confirmation(
  requested_order_id text,
  requested_payment_key text,
  requested_reading_id uuid,
  requested_user_id uuid,
  requested_amount integer
)
returns table (
  claim_state text,
  id uuid,
  reading_id uuid,
  user_id uuid,
  order_id text,
  payment_key text,
  amount integer,
  status public.purchase_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  purchase public.purchases%rowtype;
begin
  perform pg_advisory_xact_lock(hashtextextended(requested_order_id, 0));
  select * into purchase
  from public.purchases
  where purchases.order_id = requested_order_id
  for update;

  if not found then
    raise exception 'Payment order not found';
  end if;
  if purchase.reading_id <> requested_reading_id
    or purchase.user_id <> requested_user_id
    or purchase.amount <> requested_amount then
    raise exception 'Payment confirmation does not match the order';
  end if;
  if purchase.status = 'paid' then
    if purchase.payment_key <> requested_payment_key then
      raise exception 'Order was paid with a different payment key';
    end if;
    return query select 'paid', purchase.id, purchase.reading_id, purchase.user_id,
      purchase.order_id, purchase.payment_key, purchase.amount, purchase.status;
    return;
  end if;
  if purchase.status = 'confirming' then
    if purchase.payment_key <> requested_payment_key then
      raise exception 'Order is confirming with a different payment key';
    end if;
    return query select 'processing', purchase.id, purchase.reading_id, purchase.user_id,
      purchase.order_id, purchase.payment_key, purchase.amount, purchase.status;
    return;
  end if;
  if purchase.status <> 'pending' then
    raise exception 'Payment order cannot be confirmed from status %', purchase.status;
  end if;

  update public.purchases
  set status = 'confirming', payment_key = requested_payment_key
  where purchases.id = purchase.id
  returning * into purchase;

  return query select 'claimed', purchase.id, purchase.reading_id, purchase.user_id,
    purchase.order_id, purchase.payment_key, purchase.amount, purchase.status;
end;
$$;

create or replace function public.complete_payment_confirmation(
  requested_order_id text,
  requested_payment_key text,
  requested_approved_at timestamptz
)
returns table (
  id uuid,
  reading_id uuid,
  user_id uuid,
  order_id text,
  payment_key text,
  amount integer,
  status public.purchase_status
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.purchases
  set status = 'paid', approved_at = requested_approved_at
  where purchases.order_id = requested_order_id
    and purchases.payment_key = requested_payment_key
    and purchases.status in ('confirming', 'paid')
  returning purchases.id, purchases.reading_id, purchases.user_id,
    purchases.order_id, purchases.payment_key, purchases.amount, purchases.status;

  if not found then
    raise exception 'Payment confirmation claim not found';
  end if;
end;
$$;

create or replace function public.release_payment_confirmation(
  requested_order_id text,
  requested_payment_key text
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.purchases
  set status = 'pending', payment_key = null
  where purchases.order_id = requested_order_id
    and purchases.payment_key = requested_payment_key
    and purchases.status = 'confirming';
$$;

create or replace function public.record_payment_webhook(
  requested_event_id text,
  requested_event_type text,
  requested_order_id text,
  requested_payment_key text,
  requested_payload jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  event_count integer;
  purchase public.purchases%rowtype;
begin
  insert into public.payment_webhook_events (
    event_id, order_id, payment_key, event_type, payload
  ) values (
    requested_event_id,
    requested_order_id,
    requested_payment_key,
    requested_event_type,
    requested_payload
  )
  on conflict (event_id) do nothing;
  get diagnostics event_count = row_count;

  if event_count = 0 then
    return false;
  end if;

  select * into purchase
  from public.purchases
  where purchases.order_id = requested_order_id
  for update;
  if not found then
    raise exception 'Payment order not found';
  end if;
  if purchase.payment_key is not null
    and purchase.payment_key <> requested_payment_key then
    raise exception 'Webhook payment key does not match the order';
  end if;

  update public.purchases
  set status = 'paid',
    payment_key = requested_payment_key,
    approved_at = coalesce(approved_at, now())
  where purchases.id = purchase.id;
  return true;
end;
$$;

alter table public.profiles enable row level security;
alter table public.readings enable row level security;
alter table public.consents enable row level security;
alter table public.purchases enable row level security;
alter table public.followups enable row level security;
alter table public.generation_records enable row level security;
alter table public.guest_ownership_transfers enable row level security;
alter table public.payment_webhook_events enable row level security;

create policy profiles_select_own on public.profiles
for select using (id = auth.uid());
create policy profiles_update_own on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

create policy readings_select_own on public.readings
for select using (user_id = auth.uid());
create policy readings_insert_own on public.readings
for insert with check (user_id = auth.uid() and guest_session_id is null);
create policy readings_update_own on public.readings
for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy readings_delete_own on public.readings
for delete using (user_id = auth.uid());

create policy consents_select_own on public.consents
for select using (user_id = auth.uid());
create policy consents_insert_own on public.consents
for insert with check (user_id = auth.uid() and guest_session_id is null);

create policy purchases_select_own on public.purchases
for select using (user_id = auth.uid());

create policy followups_select_own on public.followups
for select using (user_id = auth.uid());
create policy followups_insert_own on public.followups
for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.readings
    where readings.id = reading_id and readings.user_id = auth.uid()
  )
);

create policy generation_records_select_own on public.generation_records
for select using (
  exists (
    select 1 from public.readings
    where readings.id = reading_id and readings.user_id = auth.uid()
  )
);

create policy guest_transfers_select_own on public.guest_ownership_transfers
for select using (user_id = auth.uid());

revoke all on function public.transfer_guest_ownership(uuid) from public;
grant execute on function public.transfer_guest_ownership(uuid) to authenticated;
revoke all on function public.record_required_consents(
  uuid, uuid, public.consent_document_type[], text[], timestamptz
) from public;
grant execute on function public.record_required_consents(
  uuid, uuid, public.consent_document_type[], text[], timestamptz
) to service_role;
revoke all on function public.claim_payment_confirmation(
  text, text, uuid, uuid, integer
) from public;
grant execute on function public.claim_payment_confirmation(
  text, text, uuid, uuid, integer
) to service_role;
revoke all on function public.complete_payment_confirmation(
  text, text, timestamptz
) from public;
grant execute on function public.complete_payment_confirmation(
  text, text, timestamptz
) to service_role;
revoke all on function public.release_payment_confirmation(text, text) from public;
grant execute on function public.release_payment_confirmation(text, text) to service_role;
revoke all on function public.record_payment_webhook(
  text, text, text, text, jsonb
) from public;
grant execute on function public.record_payment_webhook(
  text, text, text, text, jsonb
) to service_role;
