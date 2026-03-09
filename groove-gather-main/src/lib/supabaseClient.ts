import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[supabaseClient] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
      "Set them in your .env file at the project root."
  );
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

