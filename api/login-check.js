import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const CONNECTION_STRING = "mongodb+srv://indalnova:1LpW2CMG1MHEpuca@cluster0.05abfqy.mongodb.net/?retryWrites=true&w=majority";
let isConnected = false;

// Connect to DB (cached)
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(CONNECTION_STRING);
  isConnected = true;
}

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String },
  cart: { type: Array, default: [] },
  orders: { type: Array, default: [] }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await connectDB();

    let { phone, pass } = req.body;
    if (!phone || !pass) {
      return res.status(400).json({ success: false, message: "Phone and password required" });
    }

    // Normalize phone: remove +91 or leading 0
    phone = phone.replace(/\D/g, "");
    if (phone.startsWith("91") && phone.length > 10) phone = phone.slice(2);
    if (phone.startsWith("0") && phone.length > 10) phone = phone.slice(1);

    // Find user by phone
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(200).json({ exists: false });
    }

    // Compare password
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      return res.status(200).json({ exists: false });
    }

    // Phone + password exists
    return res.status(200).json({ exists: true });

  } catch (err) {
    console.error("Login-check error:", err);
    return res.status(500).json({ success: false, message: "Server error, please try again later" });
  }
}
