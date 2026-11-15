-- MinhasMilhas: esquema inicial. Execute no SQL Editor do Supabase.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  seeded boolean not null default false
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#0b7a75',
  icon text not null default 'plane',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#0b7a75',
  icon text not null default 'tag',
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  type text not null check (type in ('entrada','bonus','saida','transf_entrada','transf_saida')),
  date date not null,
  description text not null default '',
  points integer not null check (points > 0),
  cost numeric(14,2) not null default 0 check (cost >= 0),
  transfer_group_id uuid,
  created_at timestamptz not null default now()
);
create index transactions_account_idx on public.transactions (account_id, date);
create index transactions_group_idx on public.transactions (transfer_group_id);

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

create policy "own profile" on public.profiles for all
  using (id = auth.uid()) with check (id = auth.uid());
create policy "own accounts" on public.accounts for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own categories" on public.categories for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own transactions" on public.transactions for all
  using (user_id = auth.uid()) with check (
    user_id = auth.uid()
    and exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
  );

-- Transferência atômica: saída na origem, entrada no destino e bônus opcional.
create or replace function public.create_transfer(
  p_from uuid, p_to uuid, p_date date, p_description text, p_category uuid,
  p_points_out integer, p_cost_out numeric,
  p_points_in integer, p_cost_in numeric, p_bonus integer
) returns uuid
language plpgsql security invoker as $$
declare g uuid := gen_random_uuid();
begin
  insert into public.transactions (account_id, category_id, type, date, description, points, cost, transfer_group_id)
  values (p_from, p_category, 'transf_saida', p_date, p_description, p_points_out, p_cost_out, g);
  insert into public.transactions (account_id, category_id, type, date, description, points, cost, transfer_group_id)
  values (p_to, p_category, 'transf_entrada', p_date, p_description, p_points_in, p_cost_in, g);
  if coalesce(p_bonus, 0) > 0 then
    insert into public.transactions (account_id, category_id, type, date, description, points, cost, transfer_group_id)
    values (p_to, p_category, 'bonus', p_date, 'Bônus: ' || p_description, p_bonus, 0, g);
  end if;
  return g;
end $$;
