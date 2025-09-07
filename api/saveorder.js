export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const data = req.body; // JSON payload from frontend

    // Google Apps Script URL
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzPF9dvBDcCjJW2tcaUG6dCJpVbGGq-Ssf_eqNpGTDCF_UnzVbzHs2KGFLcl5gG5wJt/exec";

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    });

    const result = await response.json();
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("Error saving order:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
