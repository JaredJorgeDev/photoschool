-- PhotoSchool initial backend schema.
-- Run this in Supabase only after creating the production project.

create extension if not exists pgcrypto;

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  access_code_hash text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  logo_path text,
  cover_image_path text,
  contact_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  name text not null,
  slug text not null unique,
  access_code_hash text not null,
  event_type text not null,
  event_date date not null,
  publication_mode text not null default 'draft' check (publication_mode in ('draft', 'immediate', 'scheduled')),
  publish_at timestamptz,
  expires_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'active', 'expiring_soon', 'expired', 'reactivated', 'disabled', 'deleting', 'deleted')),
  public_visibility boolean not null default false,
  files_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.galleries (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  event_id uuid references public.events(id) on delete restrict,
  type text not null check (type in ('public', 'private')),
  title text not null,
  slug text not null unique,
  description text,
  category text,
  status text not null default 'draft',
  featured boolean not null default false,
  publish_at timestamptz,
  expires_at timestamptz,
  files_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete restrict,
  identifier text not null,
  category text,
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished', 'deleted')),
  original_path text,
  protected_view_path text,
  thumbnail_path text,
  watermark_status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gallery_id, identifier)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  notification_email boolean not null default false,
  notification_whatsapp boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_gallery_access (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete restrict,
  event_id uuid not null references public.events(id) on delete restrict,
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  access_source text not null,
  revoked_at timestamptz,
  unique (customer_id, event_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  school_id uuid not null references public.schools(id) on delete restrict,
  event_id uuid not null references public.events(id) on delete restrict,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  photo_count int not null default 0,
  delivery_type text not null,
  total_mxn numeric(10,2) not null,
  payment_method text not null,
  payment_status text not null default 'Pendiente',
  preparation_status text not null default 'Nuevo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  photo_id uuid references public.photos(id) on delete set null,
  photo_identifier text not null,
  product_type text not null check (product_type in ('digital', 'print_5x7')),
  unit_price_mxn numeric(10,2) not null,
  print_copies int not null default 0,
  print_addon_mxn numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null check (provider in ('mercado_pago', 'transferencia')),
  provider_reference text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'refunded')),
  amount_mxn numeric(10,2) not null,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.downloads (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  photo_id uuid references public.photos(id) on delete set null,
  available_at timestamptz,
  expires_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'available', 'expired')),
  created_at timestamptz not null default now()
);

create table if not exists public.print_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null default 'received' check (status in ('received', 'preparing', 'ready_for_pickup', 'delivered', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.schools enable row level security;
alter table public.events enable row level security;
alter table public.galleries enable row level security;
alter table public.photos enable row level security;
alter table public.customers enable row level security;
alter table public.user_gallery_access enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.downloads enable row level security;
alter table public.print_jobs enable row level security;
alter table public.platform_settings enable row level security;
alter table public.audit_logs enable row level security;

-- Service role bypasses RLS. Browser clients must never receive service role keys.
-- Public/customer/admin policies should be added after real authentication is selected.

insert into public.platform_settings (key, value)
values (
  'commerce',
  '{
    "brand": {
      "plannedDomain": "photoschool.com.mx"
    },
    "access": {
      "type": "escuela_y_evento"
    },
    "timezone": "America/Mexico_City",
    "pricing": {
      "currency": "MXN",
      "volumeRules": [
        { "min": 1, "max": 5, "unitPrice": 45 },
        { "min": 6, "max": 10, "unitPrice": 40 },
        { "min": 11, "max": null, "unitPrice": 35 }
      ],
      "printAddonPerCopy": 5
    },
    "lifecycle": {
      "galleryValidityMonths": 2,
      "downloadAvailabilityDays": 7
    },
    "delivery": {
      "printDeliveryType": "recoleccion_personal",
      "printDeliveryLabel": "Recolección personal",
      "printDeliveryNote": "Alberto se pondra en contacto contigo para coordinar la entrega."
    },
    "payments": {
      "primary": "mercado_pago",
      "alternative": "transferencia",
      "methods": [
        { "id": "mercado_pago", "label": "Mercado Pago", "statusAfterConfirm": "Pago aprobado" },
        { "id": "transferencia", "label": "Transferencia bancaria", "statusAfterConfirm": "Pago pendiente" }
      ]
    }
  }'::jsonb
)
on conflict (key) do nothing;
