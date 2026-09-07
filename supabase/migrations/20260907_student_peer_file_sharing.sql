-- Students can now share files individually with each other from the UI.
-- Broadcasting a file to the whole club (shared_to is null) stays admin-only.
-- This mirrors the existing front-end convention (see e.g. FileManagerPage.jsx,
-- Navbar.jsx, usePermissions.js) of treating fezaclub@gmail.com as the admin
-- account, and enforces it at the database layer too so the restriction can't
-- be bypassed by calling the API directly.

drop policy if exists "Users can insert shares" on public.file_shares;

create policy "Users can insert shares"
  on public.file_shares
  for insert
  with check (
    auth.uid() = shared_by
    and (
      shared_to is not null
      or (auth.jwt() ->> 'email') = 'fezaclub@gmail.com'
    )
  );
