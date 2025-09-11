import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const order = req.body;
    if (!order) throw new Error("No order data provided");

    // 🔹 Validate required fields
    if (
      !order.email ||
      !order.name ||
      !order.phone ||
      !order.address || // ✅ match frontend (address1+address2 combined)
      !order.city ||
      !order.state ||
      !order.productIds?.length ||
      !order.quantities?.length ||
      !order.prices?.length ||
      !order.paymentMethod
    ) {
      throw new Error("Incomplete order data");
    }

    // 🔹 Secure total price (recalculate)
    const prices = order.prices.map(Number);
    const quantities = order.quantities.map(Number);
    const verifiedTotal = prices.reduce(
      (sum, p, i) => sum + p * quantities[i],
      0
    );

    const { data, error } = await supabase.from("orders").insert([
      {
        order_id: order.orderId,
        email: order.email,
        name: order.name,
        phone: order.phone,
        address: order.address, // ✅ save combined address
        city: order.city,
        state: order.state,
        notes: order.notes || "",
        product_ids: order.productIds,
        quantities: order.quantities,
        prices: order.prices,
        total_price: verifiedTotal, // ✅ safe total
        payment_method: order.paymentMethod,
        payment_status:
          order.paymentMethod === "COD" ? "pending" : "paid",
        payment_id: order.paymentId || null,
        payment_signature: order.paymentSignature || null,
        created_at: new Date(),
      },
    ]);

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Save order error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
