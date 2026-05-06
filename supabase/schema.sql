-- UrbanVault Chats - Supabase Schema
-- Run this in Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  location text,
  interests text[],
  is_premium boolean default false,
  is_admin boolean default false,
  is_banned boolean default false,
  is_muted boolean default false,
  mute_until timestamptz,
  violation_count int default 0,
  profile_color text default '#00ff88',
  joined_at timestamptz default now(),
  last_seen timestamptz default now(),
  language text default 'es',
  created_at timestamptz default now()
);

-- Chat rooms
create table if not exists chat_rooms (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  category text not null default 'general',
  banner_url text,
  icon text,
  is_public boolean default true,
  is_premium_only boolean default false,
  owner_id uuid references profiles(id),
  member_count int default 0,
  message_count int default 0,
  is_featured boolean default false,
  is_locked boolean default false,
  rules text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Room members
create table if not exists room_members (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references chat_rooms(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member', -- member, moderator, admin
  joined_at timestamptz default now(),
  unique(room_id, user_id)
);

-- Room messages
create table if not exists room_messages (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references chat_rooms(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  content text not null,
  original_content text, -- before filtering
  reply_to uuid references room_messages(id),
  image_url text,
  reactions jsonb default '{}',
  is_blocked boolean default false,
  block_reason text,
  is_pinned boolean default false,
  is_deleted boolean default false,
  created_at timestamptz default now()
);

-- Private messages (DMs)
create table if not exists private_messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references profiles(id) on delete cascade,
  receiver_id uuid references profiles(id) on delete cascade,
  content text not null,
  image_url text,
  is_read boolean default false,
  is_deleted_sender boolean default false,
  is_deleted_receiver boolean default false,
  created_at timestamptz default now()
);

-- Groups
create table if not exists groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  icon_url text,
  banner_url text,
  owner_id uuid references profiles(id) on delete cascade,
  is_private boolean default true,
  member_count int default 1,
  created_at timestamptz default now()
);

-- Group members
create table if not exists group_members (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member',
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

-- Group messages
create table if not exists group_messages (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  content text not null,
  image_url text,
  reply_to uuid references group_messages(id),
  is_pinned boolean default false,
  is_deleted boolean default false,
  created_at timestamptz default now()
);

-- Premium subscriptions
create table if not exists premium_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade unique,
  plan text default 'premium',
  started_at timestamptz default now(),
  expires_at timestamptz,
  is_active boolean default true
);

-- Notifications
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  type text not null, -- message, mention, room_invite, group_invite, system
  title text not null,
  body text,
  data jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Reports
create table if not exists reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references profiles(id),
  reported_user_id uuid references profiles(id),
  message_id uuid,
  room_id uuid,
  reason text not null,
  description text,
  status text default 'pending', -- pending, reviewed, resolved, dismissed
  reviewed_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Moderation logs
create table if not exists moderation_logs (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid references profiles(id),
  target_user_id uuid references profiles(id),
  action text not null, -- ban, mute, warn, delete_message, etc.
  reason text,
  duration_hours int,
  created_at timestamptz default now()
);

-- Blocked users
create table if not exists blocked_users (
  id uuid default uuid_generate_v4() primary key,
  blocker_id uuid references profiles(id) on delete cascade,
  blocked_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(blocker_id, blocked_id)
);

-- Insert default rooms
insert into chat_rooms (name, description, category, icon, is_public, is_featured) values
  ('General', 'Sala general para todos', 'general', '💬', true, true),
  ('Sneakers', 'Habla sobre tus sneakers favoritos', 'sneakers', '👟', true, true),
  ('Gaming', 'Para los gamers de LATAM', 'gaming', '🎮', true, true),
  ('Música', 'Comparte y descubre música', 'music', '🎵', true, true),
  ('Ciudad de México', 'Para los chilangos', 'mexico', '🌮', true, true),
  ('Relaciones', 'Consejos y experiencias', 'relationships', '❤️', true, false),
  ('Tech', 'Tecnología y startups', 'tech', '💻', true, true),
  ('Streetwear', 'Moda urbana y tendencias', 'streetwear', '🧥', true, true),
  ('Creadores', 'Creadores de contenido', 'creators', '🎨', true, false),
  ('Memes', 'Los mejores memes en español', 'memes', '😂', true, true),
  ('Anime', 'Comunidad anime en español', 'anime', '⛩️', true, false),
  ('LATAM', 'Toda América Latina', 'latam', '🌎', true, true),
  ('Moda', 'Tendencias de moda y estilo', 'fashion', '👗', true, false)
on conflict do nothing;

-- RLS Policies
alter table profiles enable row level security;
alter table chat_rooms enable row level security;
alter table room_members enable row level security;
alter table room_messages enable row level security;
alter table private_messages enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table group_messages enable row level security;
alter table notifications enable row level security;
alter table reports enable row level security;
alter table blocked_users enable row level security;

-- Profiles: anyone can read, only owner can update
create policy "Profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Rooms: public rooms visible to all
create policy "Public rooms visible to all" on chat_rooms for select using (is_public = true);
create policy "Authenticated users can create rooms" on chat_rooms for insert with check (auth.role() = 'authenticated');
create policy "Room owners can update" on chat_rooms for update using (owner_id = auth.uid());

-- Room messages
create policy "Room messages visible to members" on room_messages for select using (is_deleted = false and is_blocked = false);
create policy "Authenticated users can send messages" on room_messages for insert with check (auth.role() = 'authenticated');
create policy "Users can delete own messages" on room_messages for update using (user_id = auth.uid());

-- Private messages
create policy "Users see their own DMs" on private_messages for select using (sender_id = auth.uid() or receiver_id = auth.uid());
create policy "Users can send DMs" on private_messages for insert with check (sender_id = auth.uid());

-- Notifications
create policy "Users see own notifications" on notifications for select using (user_id = auth.uid());
create policy "System can insert notifications" on notifications for insert with check (true);

-- Enable realtime for key tables
alter publication supabase_realtime add table room_messages;
alter publication supabase_realtime add table private_messages;
alter publication supabase_realtime add table group_messages;
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table notifications;
