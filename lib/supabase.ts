import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hsmdviobvrixmjgqadaj.supabase.co";
const supabasePublishableKey = "sb_publishable_YXyVtnPLfrgEfw_UlLnNSA_lGXP5i5H";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
