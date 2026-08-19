-- ======================================================
-- مخطط قاعدة البيانات الكامل (Supabase / PostgreSQL)
-- نظام المصادقة، التحقق بخطوتين 2FA، الجلسات، والشروط
-- ======================================================

-- 1. جدول المستخدمين (Users)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  phone_number text,
  is_2fa_enabled boolean default true,
  terms_accepted boolean default false not null,
  terms_accepted_at timestamptz,
  telegram_id bigint,
  username text,
  is_banned boolean default false,
  ban_reason text,
  banned_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. جدول الجلسات النشطة (Sessions)
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  session_token text unique not null,
  user_agent text,
  ip_address text,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- 3. جدول أكواد التحقق المؤقتة (Verification Codes / OTP)
create table if not exists verification_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  phone_number text not null,
  code text not null,
  purpose text default '2fa_login',
  expires_at timestamptz not null,
  is_used boolean default false,
  created_at timestamptz default now()
);

-- 4. الفهارس لتسريع الاستعلامات والأمان
create index if not exists idx_users_email on users(email);
create index if not exists idx_users_phone on users(phone_number);
create index if not exists idx_sessions_token on sessions(session_token);
create index if not exists idx_verification_codes_phone_code on verification_codes(phone_number, code);
