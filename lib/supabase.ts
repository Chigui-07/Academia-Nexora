import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hsmdviobvrixmjgqadaj.supabase.co";
const supabasePublishableKey = "sb_publishable_YXyVtnPLfrgEfw_UlLnNSA_lGXP5i5H";

const sessionStorageAdapter = {
  getItem(key: string) {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(key);
  },
  setItem(key: string, value: string) {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(key, value);
  },
  removeItem(key: string) {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    storage: sessionStorageAdapter,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
