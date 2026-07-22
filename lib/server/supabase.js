import { createClient } from "@supabase/supabase-js";

export function hasSupabaseEnv() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createSupabaseAdminClient() {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function publicBackendConfig() {
  return {
    configured: hasSupabaseEnv(),
    publicUrl: process.env.PHOTOSCHOOL_PUBLIC_URL || "https://photoschool-demo.vercel.app",
    timezone: process.env.PHOTOSCHOOL_TIMEZONE || "America/Mexico_City",
    galleryValidityMonths: Number(process.env.PHOTOSCHOOL_GALLERY_VALIDITY_MONTHS || 2),
    downloadValidityDays: Number(process.env.PHOTOSCHOOL_DOWNLOAD_VALIDITY_DAYS || 7),
  };
}
