-- Allow authenticated users to manage their own file_manager rows.
drop policy if exists "Users can view their own files"
  on public.file_manager
  for select
  using (auth.uid() = owner_id);

drop policy if exists "Users can insert their own files"
  on public.file_manager
  for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Users can update their own files"
  on public.file_manager
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Users can delete their own files"
  on public.file_manager
  for delete
  using (auth.uid() = owner_id);

-- Allow authenticated users to manage their own file_shares rows.
drop policy if exists "Users can view their own shares"
  on public.file_shares
  for select
  using (auth.uid() = shared_by or auth.uid() = shared_to or shared_to is null);

drop policy if exists "Users can insert shares"
  on public.file_shares
  for insert
  with check (auth.uid() = shared_by);

drop policy if exists "Users can update shares"
  on public.file_shares
  for update
  using (auth.uid() = shared_by or auth.uid() = shared_to)
  with check (auth.uid() = shared_by or auth.uid() = shared_to);

-- Allow authenticated users to manage objects in the file-manager storage bucket.
drop policy if exists "Users can upload their own files"
  on storage.objects
  for insert
  with check (
    bucket_id = 'file-manager' and auth.role() = 'authenticated' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update their own files"
  on storage.objects
  for update
  using (
    bucket_id = 'file-manager' and auth.role() = 'authenticated' and
    (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'file-manager' and auth.role() = 'authenticated' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete their own files"
  on storage.objects
  for delete
  using (
    bucket_id = 'file-manager' and auth.role() = 'authenticated' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can read their own files"
  on storage.objects
  for select
  using (
    bucket_id = 'file-manager' and auth.role() = 'authenticated' and
    (storage.foldername(name))[1] = auth.uid()::text
  );
