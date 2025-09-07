import mongoose from "mongoose";
import Razorpay from "razorpay";
import fetch from "node-fetch";

// ---- MongoDB connection ----
const CONNECTION_STRING = "mongodb+srv://indalnova:1LpW2CMG1MHEpuca@cluster0.05abfqy.mongodb.net/?retryWrites=true&w=majority";

let isConnected = false;
async function connectDB() {
  if (!isConnected) {
    await mongoose.connect(CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true });
    isConnected = true;
  }
}

// ---- User Schema ----
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  orders: { type: Array, default: [] }
});
const User = mongoose.models.User || mongoose.model("User", userSchema);

// ---- Checkout API ----
export default async function handler(req, res) {
  // ---- CORS ----
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  await connectDB();

  try {
    const { cart, email, shippingDetails, paymentMethod } = req.body;

    if (!email) return res.status(401).json({ success: false, message: "User not logged in." });

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty." });
    }

    if (!shippingDetails || !shippingDetails.name || !shippingDetails.phone || !shippingDetails.addr1 || !shippingDetails.pincode) {
      return res.status(400).json({ success: false, message: "Shipping details are incomplete." });
    }

    // Calculate total
    let total = 0;
    cart.forEach(item => {
      if (!item.price || !item.qty) throw new Error("Invalid cart item.");
      total += item.price * item.qty;
    });
    if (total <= 0) return res.status(400).json({ success: false, message: "Total amount is invalid." });

    // ---- COD Flow ----
    if (paymentMethod === "COD") {
      // Save order in user DB (optional) or send to Google Sheet
      const user = await User.findOne({ email });
      if (user) {
        user.orders.push({
          cart,
          shippingDetails,
          paymentMethod: "COD",
          status: "Placed",
          createdAt: new Date()
        });
        await user.save();
      }

      // TODO: Send order to Google Sheet API

      return res.status(200).json({ success: true, message: "Order placed with Cash on Delivery!" });
    }

    // ---- ONLINE Payment Flow ----
    if (paymentMethod === "ONLINE") {
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return res.status(500).json({ success: false, message: "Razorpay keys not set." });
      }

      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });

      const order = await razorpay.orders.create({
        amount: Math.round(total * 100), // in paise
        currency: "INR",
        payment_capture: 1
      });

      return res.status(200).json({
        success: true,
        message: "Proceed to payment",
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID
      });
    }

    // ---- Invalid Payment Method ----
    return res.status(400).json({ success: false, message: "Invalid payment method." });

  } catch (err) {
    console.error("Checkout error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
