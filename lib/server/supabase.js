import { createClient } from "@supabase/supabase-js";

export function hasSupabaseEnv() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function hasSupabasePublicEnv() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
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

export function createSupabasePublicClient() {
  if (!hasSupabasePublicEnv()) {
    throw new Error("Supabase public environment variables are not configured.");
  }

  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function isMissingSchemaError(error, tableName = "") {
  const text = `${error?.code || ""} ${error?.message || ""} ${tableName}`.toLowerCase();
  return text.includes("42p01")
    || text.includes("pgrst205")
    || text.includes("schema cache")
    || text.includes("does not exist");
}

export function publicBackendConfig() {
  return {
    configured: hasSupabaseEnv(),
    publicAuthConfigured: hasSupabasePublicEnv(),
    publicUrl: process.env.PHOTOSCHOOL_PUBLIC_URL || "https://photoschool-demo.vercel.app",
    timezone: process.env.PHOTOSCHOOL_TIMEZONE || "America/Mexico_City",
    galleryValidityMonths: Number(process.env.PHOTOSCHOOL_GALLERY_VALIDITY_MONTHS || 2),
    downloadValidityDays: Number(process.env.PHOTOSCHOOL_DOWNLOAD_VALIDITY_DAYS || 7),
  };
}
