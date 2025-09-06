import express from "express";
import fetch from "node-fetch"; // or built-in fetch if Node 18+

const app = express();
app.use(express.json())

const VERCEL_BACKEND = "https://indalnova-nayp1dskj-indalnovas-projects.vercel.app/api/checkout";

app.post("/api/checkout", async (req, res) => {
  try {
    const response = await fetch(VERCEL_BACKEND, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ success: false, message: "Proxy error" });
  }
});

// Optional: handle preflight for frontend
app.options("/api/checkout", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(204);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
