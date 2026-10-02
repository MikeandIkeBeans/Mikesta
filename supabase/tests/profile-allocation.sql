-- The runner loads the migration's allocator into pg_temp, never public.
do $$
declare
  existing_id uuid := '11111111-1111-1111-1111-111111111111';
  second_id uuid := '22222222-2222-2222-2222-222222222222';
  third_id uuid := '33333333-3333-3333-3333-333333333333';
  fourth_id uuid := '44444444-4444-4444-4444-444444444444';
begin
  perform pg_temp.ensure_user_profile(existing_id, 'alex', 'Original profile');
  perform pg_temp.ensure_user_profile(second_id, 'alex', 'Second Alex');
  if (select count(*) from pg_temp.review_profiles) <> 2 then
    raise exception 'Duplicate requested usernames lost a profile';
  end if;
  if (select username from pg_temp.review_profiles where id = second_id) = 'alex' then
    raise exception 'Duplicate requested username did not get a fallback';
  end if;

  -- A legacy account may already occupy even the deterministic fallback.
  perform pg_temp.ensure_user_profile(third_id, 'alex_' || replace(fourth_id::text, '-', ''), 'Occupied fallback');
  perform pg_temp.ensure_user_profile(fourth_id, 'alex', 'Fourth Alex');
  if (select username from pg_temp.review_profiles where id = fourth_id) <> 'alex_' || replace(fourth_id::text, '-', '') || '_2' then
    raise exception 'Occupied fallback was not retried';
  end if;

  -- Re-running the backfill must preserve curated existing profile fields.
  perform pg_temp.ensure_user_profile(existing_id, 'replacement', 'Overwrite attempt');
  if (select display_name from pg_temp.review_profiles where id = existing_id) <> 'Original profile' then
    raise exception 'Backfill overwrote an existing profile';
  end if;
  if (select count(*) from pg_temp.review_profiles) <> 4 then
    raise exception 'Repeated backfill created extra profiles';
  end if;

  perform pg_temp.ensure_user_profile('55555555-5555-5555-5555-555555555555', '', null);
  if exists (select 1 from pg_temp.review_profiles where username = '' or username is null) then
    raise exception 'Empty requested username did not get a fallback';
  end if;
end;
$$;
