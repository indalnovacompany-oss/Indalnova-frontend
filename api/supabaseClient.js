// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bkvwgcqgkfzynmsfqyds.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdndnY3Fna2Z6eW5tc2ZxeWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNTQzMTEsImV4cCI6MjA3MjgzMDMxMX0.1oLV7T-RoaYD1VcgKH-xNPvgHJWPKgMa6FDJViSA0eE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
