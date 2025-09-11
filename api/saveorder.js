

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const order = req.body;
    if (!order) throw new Error("No order data provided");

    // ✅ Validate required fields
    if (
      !order.email ||
      !order.name ||
      !order.phone ||
      !order.address1 ||
      !order.city ||
      !order.state ||
      !order.pin ||                // now required
      !order.productIds?.length ||
      !order.quantities?.length ||
      !order.prices?.length ||
      !order.totalPrice ||
      !order.paymentMethod
    ) {
      throw new Error("Incomplete order data");
    }

    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          order_id: order.orderId,
          email: order.email,
          name: order.name,
          phone: order.phone,
          address1: order.address1,
          address2: order.address2 || "",
          city: order.city,
          state: order.state,
          pin: order.pin,   // ✅ saving pin code
          notes: order.notes || "",
          product_ids: order.productIds, // ✅ text[]
          quantities: order.quantities,  // ✅ int[]
          prices: order.prices,          // ✅ numeric[]
          total_price: order.totalPrice,
          payment_method: order.paymentMethod,
          payment_status: order.paymentMethod === "COD" ? "pending" : "paid",
          payment_id: order.paymentId || null,
          payment_signature: order.paymentSignature || null,
          created_at: new Date()
        }
      ]);

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Save order error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
