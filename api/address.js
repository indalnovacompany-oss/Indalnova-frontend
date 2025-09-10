import mongoose from "mongoose";

const CONNECTION_STRING =
  process.env.MONGO_URI ||
  "mongodb+srv://indalnova:1LpW2CMG1MHEpuca@cluster0.05abfqy.mongodb.net/?retryWrites=true&w=majority";

let isConnected = false;

// Connect DB
async function connectDB() {
  if (isConnected) return;
  if (mongoose.connection.readyState >= 1) { isConnected = true; return; }
  await mongoose.connect(CONNECTION_STRING, { maxPoolSize: 10 });
  isConnected = true;
}

// User schema (addresses inside user doc)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  addresses: [
    {
      id: String,
      name: String,
      phone: String,
      pin: String,
      address1: String,
      address2: String,
      city: String,
      state: String,
      saveAs: String,
    }
  ]
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default async function handler(req, res) {
  await connectDB();

  const { email, loginId } = req.query; // frontend may send email or loginId
  const identifier = loginId || email;
  if (!identifier) return res.status(400).json({ success: false, message: "User identifier required" });

  // Find by email or phone
  const user = await User.findOne({
    $or: [{ email: identifier }, { phone: identifier }]
  });
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  // ===== GET: fetch all addresses =====
  if (req.method === "GET") {
    return res.json({ success: true, addresses: user.addresses || [] });
  }

  // ===== POST: add new address =====
  if (req.method === "POST") {
    const { name, phone, pin, address1, address2, city, state, saveAs } = req.body;

    if (!name || !phone || !pin || !address1 || !city || !state || !saveAs) {
      return res.status(400).json({ success: false, message: "All address fields required" });
    }

    const addresses = user.addresses || [];
    if (addresses.length >= 3) {
      return res.status(400).json({ success: false, message: "Max 3 addresses allowed" });
    }

    const newAddress = {
      id: "a" + Date.now(),
      name, phone, pin, address1, address2, city, state, saveAs
    };

    addresses.push(newAddress);
    user.addresses = addresses;
    await user.save();

    return res.json({ success: true, address: newAddress });
  }

  // ===== DELETE: remove address =====
  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, message: "Address ID required" });

    const addresses = (user.addresses || []).filter(a => a.id !== id);
    user.addresses = addresses;
    await user.save();

    return res.json({ success: true, message: "Address deleted" });
  }

  // ===== PUT: validate coupon =====
  if (req.method === "PUT") {
    const { coupon } = req.body;
    if (!coupon) return res.status(400).json({ success: false, message: "Coupon required" });

    try {
      const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSH3bkZx3Z31-KSLmRYVq2-QMmExltelKKPiUKrqnwlpD7PHp31a4EkuqWuXbkQ-c5Tw7uVCYL0n4JC/pub?gid=0&single=true&output=csv";

      const response = await fetch(url);
      const csvText = await response.text();

      const lines = csvText.trim().split("\n");
      const headers = lines[0].split(",");
      const coupons = lines.slice(1).map(line => {
        const cols = line.split(",");
        return headers.reduce((obj, h, i) => {
          obj[h.trim()] = cols[i].trim();
          return obj;
        }, {});
      });

      const found = coupons.find(c => c.code.toUpperCase() === coupon.toUpperCase());

      if (found) {
        return res.json({ valid: true, amount: parseInt(found.amount) });
      } else {
        return res.json({ valid: false });
      }

    } catch (err) {
      console.error("Coupon backend error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
