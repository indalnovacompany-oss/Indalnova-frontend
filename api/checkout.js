import Razorpay from "razorpay";

// ---- Checkout API ----
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { cart, shippingDetails, paymentMethod, email } = req.body;

    if (!email) return res.status(401).json({ success: false, message: "User not logged in." });
    if (!cart || !Array.isArray(cart) || cart.length === 0) return res.status(400).json({ success: false, message: "Cart is empty." });

    // 🔹 Updated field checks
    if (!shippingDetails || !shippingDetails.name || !shippingDetails.phone || !shippingDetails.address1 || !shippingDetails.pin) {
      return res.status(400).json({ success: false, message: "Shipping details are incomplete." });
    }

    if (!paymentMethod || paymentMethod !== "ONLINE") {
      return res.status(400).json({ success: false, message: "Only ONLINE payment is supported in this API." });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ success: false, message: "Razorpay keys not set." });
    }

    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    if (totalAmount <= 0) return res.status(400).json({ success: false, message: "Total amount is invalid." });

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: "ORD" + Math.floor(100000 + Math.random() * 900000),
      payment_capture: 1,
    });

    return res.status(200).json({
      success: true,
      message: "Proceed to payment",
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

