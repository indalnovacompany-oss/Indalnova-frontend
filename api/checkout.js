import Razorpay from "razorpay";
import fetch from "node-fetch";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ---- MongoDB connection ----
const CONNECTION_STRING = "mongodb+srv://indalnova:1LpW2CMG1MHEpuca@cluster0.05abfqy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(CONNECTION_STRING);
  isConnected = true;
}

// ---- User Schema ----
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  address: String,
  landmark: String,
  city: String,
  state: String,
  pincode: String,
  isGuest: { type: Boolean, default: false }
});
const User = mongoose.models.User || mongoose.model("User", userSchema);

// ---- Checkout handler ----
export default async function handler(req, res) {
  // ---- CORS ----
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
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ success: false, message: "Razorpay keys not set" });
  }
  if (!process.env.SHEET_URL) {
    return res.status(500).json({ success: false, message: "SHEET_URL not set" });
  }

  try {
    await connectDB();

    const { cart, user: userData } = req.body;
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty or invalid" });
    }

    // ---- Check if user exists ----
    let user = await User.findOne({ email: userData.email });

    if (!user) {
      // ---- New guest user → create account ----
      const password = userData.password || "default123";
      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({ ...userData, password: hashedPassword, isGuest: true });
      await user.save();
    } else {
      // ---- Existing user → update only address fields ----
      const addressFields = ["address", "landmark", "city", "state", "pincode"];
      let updated = false;
      addressFields.forEach(field => {
        if (userData[field] && user[field] !== userData[field]) {
          user[field] = userData[field];
          updated = true;
        }
      });
      if (updated) await user.save();
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
    if (total <= 0) return res.status(400).json({ success: false, message: "Total amount is zero or invalid" });

    // ---- Create Razorpay order ----
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    const order = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: "INR",
      payment_capture: 1
    });

    // ---- Return order + user info ----
    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        landmark: user.landmark,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        isGuest: user.isGuest || false
      }
    });

  } catch (err) {
    console.error("Checkout error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
