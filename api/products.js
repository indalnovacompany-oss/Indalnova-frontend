// api/products.js

export default async function handler(req, res) {
  // ✅ Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    // 🔹 Your Google Sheet CSV link
    const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAwmqC5oIsKW8ES__N5PGXP1ASwLbFBaqXyghnTs1MWbo9ZiFIXV4IjJMVtLSif0xChAkFjwRdEu3A/pub?gid=0&single=true&output=csv";

    // Fetch CSV
    const response = await fetch(sheetUrl);
    const csvText = await response.text();

    // Convert CSV → JSON
    const lines = csvText.split("\n");
    const headers = lines[0].split(",");
    const products = lines.slice(1).map(line => {
      const values = line.split(",");
      let obj = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = values[index] ? values[index].trim() : "";
      });
      return obj;
    });

    res.status(200).json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
