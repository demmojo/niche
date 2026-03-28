import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("No Supabase credentials");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: assets, error: err1 } = await supabase
    .from("raw_data_assets")
    .select("*")
    .limit(10);
  console.log("raw_data_assets:", assets, err1);

  const { data: versions, error: err2 } = await supabase
    .from("raw_data_versions")
    .select("*")
    .limit(10);
  console.log("raw_data_versions:", versions, err2);
}
main().catch(console.error);
