
update public.activities set title='Man Crush Monday (MCM)', description='Ladies post the men who inspire them. Highest reactions wins.' where day=1;
update public.activities set title='Debate Tuesday', description='Pick a side and defend it. Respectful arguments only.' where day=2;
update public.activities set title='Woman Crush Wednesday (WCW)', description='Ladies post their pictures. Highest reactions wins.' where day=3;
update public.activities set title='Throwback Thursday', description='Share old and new pictures. Celebrate your growth.' where day=4;
update public.activities set title='Freaky Friday', description='Get freaky. Wild. Free. But with respect.' where day=5;
update public.activities set title='Anonymous Saturday', description='Send anonymous compliments, confessions, encouragement or appreciation.' where day=6;
update public.activities set title='Prayer & Thanksgiving Sunday', description='Share prayer requests and testimonies. Evening group call.' where day=0;

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  date date not null default (now() at time zone 'Africa/Lagos')::date,
  created_at timestamptz not null default now(),
  unique (member_id, date)
);
grant select, insert, update, delete on public.attendance to authenticated;
grant all on public.attendance to service_role;
alter table public.attendance enable row level security;
create policy "Admins manage attendance" on public.attendance for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  status text not null default 'not_paid' check (status in ('paid','pending','not_paid')),
  amount numeric(12,2),
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, year, month)
);
grant select, insert, update, delete on public.contributions to authenticated;
grant all on public.contributions to service_role;
alter table public.contributions enable row level security;
create policy "Admins manage contributions" on public.contributions for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create index if not exists attendance_date_idx on public.attendance(date);
create index if not exists contributions_period_idx on public.contributions(year, month);

create or replace function public.claim_first_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  uemail text;
begin
  if uid is null then return false; end if;
  if exists (select 1 from public.user_roles where user_id = uid and role = 'admin') then
    return true;
  end if;
  select email into uemail from auth.users where id = uid;
  if lower(coalesce(uemail,'')) in ('josiahbenmoshe@gmail.com','janedan732@gmail.com')
     or not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (uid, 'admin')
      on conflict (user_id, role) do nothing;
    return true;
  end if;
  return false;
end;
$$;
revoke execute on function public.claim_first_admin() from public, anon;
grant execute on function public.claim_first_admin() to authenticated;
