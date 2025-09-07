import Razorpay from "razorpay";

// ---- Checkout API ----
export default async function handler(req, res) {
  // ---- CORS ----
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { cart, shippingDetails, paymentMethod } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty." });
    }

    if (!shippingDetails || !shippingDetails.name || !shippingDetails.phone || !shippingDetails.addr1 || !shippingDetails.pincode) {
      return res.status(400).json({ success: false, message: "Shipping details are incomplete." });
    }

    // Calculate total amount
    let total = 0;
    cart.forEach(item => total += item.price * item.qty);

    if (total <= 0) return res.status(400).json({ success: false, message: "Total amount is invalid." });

    // Only ONLINE payment is handled here
    if (paymentMethod !== "ONLINE") {
      return res.status(400).json({ success: false, message: "Only ONLINE payment is supported in this API." });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ success: false, message: "Razorpay keys not set." });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(total * 100), // Amount in paise
      currency: "INR",
      payment_capture: 1
    });

    return res.status(200).json({
      success: true,
      message: "Proceed to payment",
      orderId: order.id,       // Razorpay Order ID
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (err) {
    console.error("Checkout error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
