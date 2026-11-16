-- Viagens: destinos favoritos, inscrições de notificação e promoções coletadas.
-- Execute no SQL Editor do Supabase.

create table public.favorite_destinations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  iata text not null,
  city text not null,
  country text not null default '',
  notify boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, iata)
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table public.promo_items (
  guid text primary key,
  title text not null,
  link text not null,
  source text not null,
  published_at timestamptz not null default now()
);
create index promo_items_published_idx on public.promo_items (published_at desc);

create table public.promo_notifications (
  user_id uuid not null references auth.users(id) on delete cascade,
  guid text not null references public.promo_items(guid) on delete cascade,
  sent_at timestamptz not null default now(),
  primary key (user_id, guid)
);

-- Guarda as chaves de notificação geradas pela função (nenhum usuário acessa).
create table public.app_secrets (
  name text primary key,
  value text not null
);

alter table public.favorite_destinations enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.promo_items enable row level security;
alter table public.promo_notifications enable row level security;
alter table public.app_secrets enable row level security;

create policy "own favorites" on public.favorite_destinations for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own push subscriptions" on public.push_subscriptions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "read promos" on public.promo_items for select to authenticated using (true);

grant select, insert, update, delete on public.favorite_destinations to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant select on public.promo_items to authenticated;

-- A função (service_role) precisa de acesso a tudo.
grant all on public.favorite_destinations, public.push_subscriptions, public.promo_items,
  public.promo_notifications, public.app_secrets to service_role;
