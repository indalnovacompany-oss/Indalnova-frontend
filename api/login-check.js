import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const CONNECTION_STRING = process.env.MONGO_URI;
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  if (mongoose.connection.readyState >= 1) { isConnected = true; return; }
  await mongoose.connect(CONNECTION_STRING, { maxPoolSize: 10 });
  isConnected = true;
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  password: { type: String }, // optional for OTP-only users
  phone: { type: String, required: true },
  address: { type: String },
  cart: { type: Array, default: [] },
  orders: { type: Array, default: [] },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await connectDB();

    let { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: "Phone and password required" });
    }

    phone = phone.replace(/\D/g, "");
    if (phone.startsWith("91") && phone.length > 10) phone = phone.slice(2);
    if (phone.startsWith("0") && phone.length > 10) phone = phone.slice(1);

    const user = await User.findOne({ phone });
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      }
    });

  } catch (err) {
    console.error("Login-check error:", err);
    return res.status(500).json({ success: false, message: "Server error, please try again later" });
  }
}
