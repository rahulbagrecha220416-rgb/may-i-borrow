-- migration_perf_advisors.sql — 5 Sep 2026
-- Clears the Supabase performance advisor findings without changing who can do what:
--   1. 12 foreign keys get a covering index.
--   2. Duplicate permissive policies are merged into one per (table, action).
--      Each merged expression is the OR of the policies it replaces.
--   3. Every remaining auth.uid()/auth.role() call is wrapped in (select …) so
--      Postgres evaluates it once per query instead of once per row.
-- Unused indexes are deliberately left alone: with 14 users the usage stats mean nothing.

-- 1. Covering indexes for foreign keys ------------------------------------
create index if not exists group_members_user_id_idx        on public.group_members (user_id);
create index if not exists group_proposals_created_by_idx   on public.group_proposals (created_by);
create index if not exists groups_created_by_idx            on public.groups (created_by);
create index if not exists item_inquiries_item_id_idx       on public.item_inquiries (item_id);
create index if not exists item_inquiries_lender_id_idx     on public.item_inquiries (lender_id);
create index if not exists items_group_id_idx               on public.items (group_id);
create index if not exists mediations_item_id_idx           on public.mediations (item_id);
create index if not exists mediations_mutual_friend_id_idx  on public.mediations (mutual_friend_id);
create index if not exists mediations_owner_id_idx          on public.mediations (owner_id);
create index if not exists mediations_requester_id_idx      on public.mediations (requester_id);
create index if not exists notifications_user_id_idx        on public.notifications (user_id);
create index if not exists proposal_votes_voter_id_idx      on public.proposal_votes (voter_id);

-- 2. Merge duplicate permissive policies ----------------------------------
-- group_members DELETE: "Admins can remove members" already allows a member to remove
-- themselves (auth.uid() = user_id OR admin), so the separate leave policy is redundant.
drop policy if exists "Users can leave groups" on public.group_members;

-- item_inquiries SELECT: inquirer / lender / mediator → one participant policy.
drop policy if exists "Inquirers can view own inquiries"            on public.item_inquiries;
drop policy if exists "Lenders can view inquiries about their items" on public.item_inquiries;
drop policy if exists "Mediators can view assigned inquiries"        on public.item_inquiries;
create policy "Participants can view inquiries" on public.item_inquiries
  for select using ((select auth.uid()) in (inquirer_id, lender_id, mediator_id));

-- items SELECT: signed-in users see everything, everyone sees public items.
drop policy if exists "Items viewable by authenticated users"  on public.items;
drop policy if exists "Items viewable by everyone if public"   on public.items;
create policy "Items viewable by members or if public" on public.items
  for select using (((select auth.role()) = 'authenticated') or (visibility = 'public'));

-- items UPDATE: owners edit freely; a borrower may only flip the row back to AVAILABLE.
drop policy if exists "Allow borrowers to return items"  on public.items;
drop policy if exists "Users can update their own items" on public.items;
create policy "Owners edit, borrowers return" on public.items
  for update
  using  (((select auth.uid()) = owner_id) or (borrowed_by = (select auth.uid())))
  with check (((select auth.uid()) = owner_id)
              or ((status = 'AVAILABLE') and (borrowed_by is null) and (borrowed_until is null)));

-- mediations SELECT: requester or the mutual friend it was sent to.
drop policy if exists "Mutual friends can view requests sent to them" on public.mediations;
drop policy if exists "Users can view own initiated mediations"      on public.mediations;
create policy "Participants can view mediations" on public.mediations
  for select using ((select auth.uid()) in (requester_id, mutual_friend_id));

-- requests UPDATE: the requester, or the owner of the item requested.
drop policy if exists "Item owners can update requests for their items" on public.requests;
drop policy if exists "Users can update their own requests"            on public.requests;
create policy "Requester or item owner can update" on public.requests
  for update using (
    ((select auth.uid()) = user_id)
    or exists (select 1 from public.items where items.id = requests.item_id and items.owner_id = (select auth.uid()))
  );

-- 3. Wrap auth.* calls in the remaining policies --------------------------
alter policy "Admins can remove members" on public.group_members
  using (((select auth.uid()) = user_id) or exists (
    select 1 from public.group_members admin_check
    where admin_check.group_id = group_members.group_id
      and admin_check.user_id = (select auth.uid()) and admin_check.role = 'admin'));
alter policy "Users can join groups" on public.group_members
  with check ((select auth.uid()) = user_id);
alter policy "Admins can update member roles" on public.group_members
  using (exists (
    select 1 from public.group_members admin_check
    where admin_check.group_id = group_members.group_id
      and admin_check.user_id = (select auth.uid()) and admin_check.role = 'admin'));

alter policy "members create proposals" on public.group_proposals
  with check ((created_by = (select auth.uid())) and exists (
    select 1 from public.group_members gm
    where gm.group_id = group_proposals.group_id and gm.user_id = (select auth.uid())));
alter policy "members read group proposals" on public.group_proposals
  using (exists (
    select 1 from public.group_members gm
    where gm.group_id = group_proposals.group_id and gm.user_id = (select auth.uid())));
alter policy "proposer or admin closes" on public.group_proposals
  using ((created_by = (select auth.uid())) or exists (
    select 1 from public.group_members gm
    where gm.group_id = group_proposals.group_id and gm.user_id = (select auth.uid()) and gm.role = 'admin'));

alter policy "Authenticated users can create groups" on public.groups
  with check ((select auth.role()) = 'authenticated');
alter policy "Group creators can update their groups" on public.groups
  using ((select auth.uid()) = created_by);

alter policy "Users can create inquiries" on public.item_inquiries
  with check ((select auth.uid()) = inquirer_id);
alter policy "Mediators can update inquiries" on public.item_inquiries
  using ((select auth.uid()) = mediator_id) with check ((select auth.uid()) = mediator_id);

alter policy "Users can delete their own items" on public.items
  using ((select auth.uid()) = owner_id);
alter policy "Users can create items" on public.items
  with check ((select auth.uid()) = owner_id);

alter policy "Users can create mediation requests" on public.mediations
  with check ((select auth.uid()) = requester_id);
alter policy "Mutual friend can update status" on public.mediations
  using ((select auth.uid()) = mutual_friend_id);

alter policy "System/functions can insert notifications" on public.notifications
  with check ((select auth.role()) = 'authenticated');
alter policy "Users can view own notifications" on public.notifications
  using ((select auth.uid()) = user_id);
alter policy "Users can update own notifications" on public.notifications
  using ((select auth.uid()) = user_id);

alter policy "Users can insert their own profile" on public.profiles
  with check ((select auth.uid()) = id);
alter policy "Users can update own profile" on public.profiles
  using ((select auth.uid()) = id);

alter policy "voter deletes own vote" on public.proposal_votes
  using (voter_id = (select auth.uid()));
alter policy "members cast vote" on public.proposal_votes
  with check ((voter_id = (select auth.uid())) and exists (
    select 1 from public.group_proposals p
    join public.group_members gm on gm.group_id = p.group_id
    where p.id = proposal_votes.proposal_id and gm.user_id = (select auth.uid()) and p.status = 'OPEN'));
alter policy "members read proposal votes" on public.proposal_votes
  using (exists (
    select 1 from public.group_proposals p
    join public.group_members gm on gm.group_id = p.group_id
    where p.id = proposal_votes.proposal_id and gm.user_id = (select auth.uid())));
alter policy "voter changes own vote" on public.proposal_votes
  using (voter_id = (select auth.uid()));

alter policy "Users can insert their own requests" on public.requests
  with check ((select auth.uid()) = user_id);

alter policy "Users can insert/update own settings" on public.user_settings
  with check ((select auth.uid()) = user_id);
alter policy "Users can view own settings" on public.user_settings
  using ((select auth.uid()) = user_id);
alter policy "Users can update own settings" on public.user_settings
  using ((select auth.uid()) = user_id);
