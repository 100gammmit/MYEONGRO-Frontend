update public.free_reading_quota_events as quota
set user_id = transfer.user_id,
  guest_session_id = null
from public.guest_ownership_transfers as transfer
where quota.guest_session_id = transfer.guest_session_id
  and quota.user_id is null;

create or replace function public.transfer_guest_ownership(
  requested_guest_session_id uuid,
  requested_user_id uuid
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
set search_path = pg_catalog
as $$
declare
  reading_count integer := 0;
  consent_count integer := 0;
  prior public.guest_ownership_transfers%rowtype;
begin
  if requested_guest_session_id is null then
    raise exception 'Guest session is required';
  end if;

  if requested_user_id is null then
    raise exception 'User is required';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(requested_guest_session_id::text, 0)
  );

  select * into prior
  from public.guest_ownership_transfers
  where guest_ownership_transfers.guest_session_id = requested_guest_session_id;

  if found then
    if prior.user_id <> requested_user_id then
      raise exception 'Guest session was transferred to another user';
    end if;
  end if;

  update public.free_reading_quota_events
  set user_id = requested_user_id,
    guest_session_id = null
  where free_reading_quota_events.guest_session_id = requested_guest_session_id
    and free_reading_quota_events.user_id is null;

  if found then
    return query select
      prior.guest_session_id,
      prior.user_id,
      prior.transferred_reading_count,
      prior.transferred_consent_count,
      true;
    return;
  end if;

  update public.readings
  set user_id = requested_user_id,
    guest_session_id = null
  where readings.guest_session_id = requested_guest_session_id
    and readings.user_id is null;
  get diagnostics reading_count = row_count;

  insert into public.consents (
    user_id,
    document_type,
    document_version,
    accepted_at,
    created_at
  )
  select
    requested_user_id,
    document_type,
    document_version,
    accepted_at,
    created_at
  from public.consents
  where consents.guest_session_id = requested_guest_session_id
  on conflict (user_id, document_type, document_version)
    where user_id is not null
  do update
  set accepted_at = least(
        public.consents.accepted_at,
        excluded.accepted_at
      ),
      created_at = least(
        public.consents.created_at,
        excluded.created_at
      );
  get diagnostics consent_count = row_count;

  delete from public.consents
  where consents.guest_session_id = requested_guest_session_id;

  insert into public.guest_ownership_transfers (
    guest_session_id,
    user_id,
    transferred_reading_count,
    transferred_consent_count
  ) values (
    requested_guest_session_id,
    requested_user_id,
    reading_count,
    consent_count
  );

  return query select
    requested_guest_session_id,
    requested_user_id,
    reading_count,
    consent_count,
    false;
end;
$$;

revoke all on function public.transfer_guest_ownership(uuid, uuid) from public;
revoke all on function public.transfer_guest_ownership(uuid, uuid) from anon;
revoke all on function public.transfer_guest_ownership(uuid, uuid) from authenticated;
grant execute on function public.transfer_guest_ownership(uuid, uuid) to service_role;
