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
      do nothing;
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
      do nothing;
    end if;
  end loop;
end;
$$;

revoke all on function public.record_required_consents(
  uuid, uuid, public.consent_document_type[], text[], timestamptz
) from public;
grant execute on function public.record_required_consents(
  uuid, uuid, public.consent_document_type[], text[], timestamptz
) to service_role;
