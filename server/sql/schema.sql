-- =========================================================
--  LOST & FOUND · Neon (PostgreSQL) schema
--  รันไฟล์นี้ได้ทั้งใน Neon SQL Editor หรือผ่าน npm run db:push
-- =========================================================

create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  display_name  text not null,
  avatar_emoji  text not null default '🫥',
  campus        text,
  bio           text not null default '',
  role          text not null default 'user' check (role in ('user', 'admin')),
  points        integer not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists categories (
  id     text primary key,
  label  text not null,
  emoji  text not null,
  color  text not null default 'violet'
);

create table if not exists items (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('lost', 'found')),
  title        text not null,
  description  text not null default '',
  category_id  text references categories (id) on delete set null,
  location     text not null default '',
  occurred_at  date,
  contact_name text not null default '',
  contact_line text not null default '',
  image_url    text,
  reward       integer not null default 0,
  status       text not null default 'open' check (status in ('open', 'claimed', 'returned', 'closed')),
  owner_id     uuid not null references users (id) on delete cascade,
  created_at   timestamptz not null default now()
);

create index if not exists items_created_at_idx on items (created_at desc);
create index if not exists items_kind_idx on items (kind);
create index if not exists items_status_idx on items (status);
create index if not exists items_owner_idx on items (owner_id);

create table if not exists claims (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references items (id) on delete cascade,
  claimant_id uuid not null references users (id) on delete cascade,
  message     text not null default '',
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at  timestamptz not null default now(),
  unique (item_id, claimant_id)
);

create index if not exists claims_item_idx on claims (item_id);
create index if not exists claims_claimant_idx on claims (claimant_id);

create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users (id) on delete cascade,
  item_id    uuid references items (id) on delete cascade,
  kind       text not null default 'info',
  message    text not null,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on notifications (user_id, created_at desc);
