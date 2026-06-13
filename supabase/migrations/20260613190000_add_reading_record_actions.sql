create or replace function public.start_failed_reading_retry(
  requested_user_id uuid,
  requested_reading_id uuid,
  requested_provider text,
  requested_model text,
  requested_prompt_version text
)
returns table (
  generation_id uuid
)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  owned_reading public.readings%rowtype;
  inserted_generation_id uuid;
begin
  select * into owned_reading
  from public.readings
  where readings.id = requested_reading_id
    and readings.user_id = requested_user_id
    and readings.status = 'failed'
    and readings.deleted_at is null
  for update;

  if not found then
    raise exception 'READING_NOT_RETRYABLE'
      using errcode = 'RL109';
  end if;

  insert into public.generation_records (
    reading_id,
    provider,
    model,
    prompt_version,
    idempotency_key,
    status
  ) values (
    owned_reading.id,
    requested_provider,
    requested_model,
    requested_prompt_version,
    'free-reading-retry:' || owned_reading.id::text || ':' || gen_random_uuid()::text,
    'pending'
  )
  returning generation_records.id into inserted_generation_id;

  update public.readings
  set status = 'generating',
    title = 'Generating...',
    result = null
  where readings.id = owned_reading.id;

  return query select inserted_generation_id;
end;
$$;

revoke all on function public.start_failed_reading_retry(
  uuid, uuid, text, text, text
) from public;
revoke all on function public.start_failed_reading_retry(
  uuid, uuid, text, text, text
) from anon;
revoke all on function public.start_failed_reading_retry(
  uuid, uuid, text, text, text
) from authenticated;
grant execute on function public.start_failed_reading_retry(
  uuid, uuid, text, text, text
) to service_role;
