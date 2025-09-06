import Razorpay from "razorpay";
import fetch from "node-fetch";

export default async function handler(req, res) {
  // ---- Allowed origins ----

  console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID ? "SET" : "NOT SET");
  console.log("RAZORPAY_KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET ? "SET" : "NOT SET");

  const allowedOrigins = [
    "https://www.indalnova.in",
    "https://indalnova.in",
    "https://indalnova.vercel.app",
    "https://indalnova-new.vercel.app"
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    // fallback for testing – remove once .in works fine
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ---- Handle preflight OPTIONS ----
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // ---- Only allow POST ----
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  // ---- Check env vars ----
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ success: false, message: "Razorpay keys not set" });
  }
  if (!process.env.SHEET_URL) {
    return res.status(500).json({ success: false, message: "SHEET_URL not set" });
  }

  try {
    const { cart } = req.body;
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty or invalid" });
    }

    // ---- Fetch products from Google Sheet ----
    const sheetRes = await fetch(process.env.SHEET_URL);
    const csvText = await sheetRes.text();
    const lines = csvText.split("\n").filter(Boolean);
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const products = lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim());
      const obj = {};
      headers.forEach((h, i) => (obj[h] = values[i]));
      obj.id = parseInt(obj.id);
      obj.price = parseFloat(obj.price);
      return obj;
    });

    // ---- Calculate total ----
    let total = 0;
    for (const item of cart) {
      const product = products.find(p => p.id === Number(item.id));
      if (!product) throw new Error(`Product ID ${item.id} not found`);
      total += product.price * Number(item.qty);
    }
    if (total <= 0) {
      return res.status(400).json({ success: false, message: "Total amount is zero or invalid" });
    }

    // ---- Create Razorpay order ----
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(total * 100), // in paise
      currency: "INR",
      payment_capture: 1,
    });

    // ---- Return order ----
    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Checkout error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
