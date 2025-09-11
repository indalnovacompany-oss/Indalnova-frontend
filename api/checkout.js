import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

// ---- Supabase ----
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ---- Razorpay ----
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { cart, shippingDetails, paymentMethod, email, paymentId, paymentSignature } = req.body;

    if (!email) return res.status(401).json({ success: false, message: "User not logged in." });
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty." });
    }

    if (!shippingDetails?.name || !shippingDetails?.phone || !shippingDetails?.address1 || !shippingDetails?.city || !shippingDetails?.state || !shippingDetails?.pin) {
      return res.status(400).json({ success: false, message: "Shipping details are incomplete." });
    }

    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    if (totalAmount <= 0) return res.status(400).json({ success: false, message: "Total amount is invalid." });

    // ---- Step 1: Create Razorpay Order (ONLINE only) ----
    if (paymentMethod === "ONLINE" && !paymentId) {
      const order = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: "ORD" + Math.floor(100000 + Math.random() * 900000),
        payment_capture: 1,
      });

      return res.status(200).json({
        success: true,
        step: "checkout",
        message: "Proceed to payment",
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
      });
    }

    // ---- Step 2: Save Order in Supabase after payment ----
    if ((paymentMethod === "ONLINE" && paymentId && paymentSignature) || paymentMethod === "COD") {
      const { data, error } = await supabase.from("orders").insert([
        {
          order_id: "ORD" + Math.floor(100000 + Math.random() * 900000),
          email,
          name: shippingDetails.name,
          phone: shippingDetails.phone,
          address1: shippingDetails.address1,
          address2: shippingDetails.address2 || "",
          city: shippingDetails.city,
          state: shippingDetails.state,
          pin: shippingDetails.pin,
          notes: shippingDetails.notes || "",
          product_ids: cart.map((p) => p.id),
          quantities: cart.map((p) => p.qty),
          prices: cart.map((p) => p.price),
          total_price: totalAmount,
          payment_method: paymentMethod,
          payment_status: paymentMethod === "COD" ? "pending" : "paid",
          payment_id: paymentId || null,
          payment_signature: paymentSignature || null,
          created_at: new Date(),
        },
      ]);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        step: "saved",
        message: "Order saved successfully",
        data,
      });
    }

    return res.status(400).json({ success: false, message: "Invalid request flow" });
  } catch (err) {
    console.error("Checkout error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
