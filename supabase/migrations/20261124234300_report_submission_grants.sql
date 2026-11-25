-- Allow the submission payload while keeping server-managed columns protected.
grant insert (
  user_id, client_submission_id, category, description, risk_level, status,
  latitude, longitude, address, district, is_demo
) on table public.reports to authenticated;
grant usage on sequence public.report_tracking_seq to authenticated;

grant select on table public.report_photos to authenticated;
grant insert (
  report_id, storage_path, mime_type, file_size_bytes, uploaded_by
) on table public.report_photos to authenticated;

-- A retry can overwrite a photo uploaded before its metadata was saved.
create policy "report_photos_storage_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'report-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'report-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
