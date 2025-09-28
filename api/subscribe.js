import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { phone } = req.body;

    // === Validate phone ===
    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone number required" });
    }

    // Basic 10-digit check (you can adjust)
    const phoneRegex = /^[1-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid phone number format" });
    }

    // === Insert into Supabase ===
    const { data, error } = await supabase
      .from("phone_numbers")
      .insert([{ phone_number: phone }])
      .select();

    if (error) {
      if (error.code === "23505") {
        // unique violation (duplicate number)
        return res.status(200).json({ success: true, message: "Already subscribed" });
      }
      throw error;
    }

    return res.status(200).json({ success: true, message: "Subscribed!", data });
  } catch (err) {
    console.error("Save phone error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
