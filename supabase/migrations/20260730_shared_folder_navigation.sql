-- Let a recipient read a directly shared item and every descendant of a
-- shared folder. A SECURITY DEFINER function avoids recursively applying the
-- file_manager policy while looking up the shared root.
create or replace function public.can_access_shared_file(
  p_owner_id uuid,
  p_file_id uuid,
  p_folder_path text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.file_shares as share
    join public.file_manager as shared_item on shared_item.id = share.file_id
    where (share.shared_to = auth.uid() or share.shared_to is null)
      and shared_item.owner_id = p_owner_id
      and (
        p_file_id = shared_item.id
        or (
          shared_item.is_folder = true
          and p_folder_path like (shared_item.folder_path || shared_item.name || '/%')
        )
      )
  );
$$;

revoke all on function public.can_access_shared_file(uuid, uuid, text) from public;
grant execute on function public.can_access_shared_file(uuid, uuid, text) to authenticated;

drop policy if exists "Users can view shared files and folder descendants"
  on public.file_manager;

create policy "Users can view shared files and folder descendants"
  on public.file_manager
  for select
  using (public.can_access_shared_file(owner_id, id, folder_path));

-- Signed URLs should only be created for objects the current user can reach
-- through file_manager. Remove the broad policy from the manual workaround.
drop policy if exists "authenticated read file-manager" on storage.objects;
drop policy if exists "Users can read shared file-manager objects" on storage.objects;

create policy "Users can read shared file-manager objects"
  on storage.objects
  for select
  using (
    bucket_id = 'file-manager'
    and exists (
      select 1
      from public.file_manager
      where file_manager.storage_path = storage.objects.name
    )
  );
