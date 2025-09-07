// backend/api/saveOrder.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseServiceKey = "YOUR_SERVICE_ROLE_KEY"; // keep secret
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method === "POST") {
    const order = req.body;

    const { data, error } = await supabase
      .from('orders')
      .insert([{
        order_id: order.orderId,
        user_email: order.email,
        name: order.name,
        phone: order.phone,
        address: order.address,
        city: order.city || '',          // optional
        state: order.state || '',        // optional
        notes: order.notes,
        product_ids: order.productIds,
        quantities: order.quantities,
        prices: order.prices,
        total_price: order.totalPrice,
        payment_method: order.paymentMethod,
        payment_status: order.paymentMethod === "COD" ? "pending" : "paid",
        transaction_id: order.paymentId || null,
        payment_signature: order.paymentSignature || null,
        order_date: new Date()
      }]);

    if (error) return res.status(400).json({ success: false, message: error.message });
    return res.status(200).json({ success: true, data });
  }

  res.status(405).send("Method not allowed");
}
