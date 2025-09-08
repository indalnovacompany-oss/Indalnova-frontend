// /api/signup.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import OTP from "./otpmodel.js";

const CONNECTION_STRING = process.env.MONGO_URI;
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  if (mongoose.connection.readyState >= 1) { isConnected = true; return; }
  await mongoose.connect(CONNECTION_STRING, { maxPoolSize: 10 });
  isConnected = true;
}

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: { type: String, unique: true },
  password: String,
  address: Object,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

function cleanPhone(phone) {
  phone = phone.replace(/\D/g, "");
  if (phone.startsWith("91") && phone.length > 10) phone = phone.slice(2);
  if (phone.startsWith("0") && phone.length > 10) phone = phone.slice(1);
  return phone;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await connectDB();
    let { name, email, phone, otp } = req.body;
    phone = cleanPhone(phone || "");

    if (!name || !email || !phone || !otp) {
      return res.status(400).json({ success: false, message: "Name, email, phone & OTP required" });
    }

    // Verify OTP from DB
    const record = await OTP.findOne({ phone, otp });
    if (!record || record.expires.getTime() < Date.now()) {
      return res.status(401).json({ success: false, message: "Invalid or expired OTP" });
    }
    await OTP.deleteOne({ _id: record._id }); // consume OTP

    // Check if already registered
    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email/Phone already registered" });
    }

    // Default password & address (if you don’t need them)
    const hashedPassword = await bcrypt.hash("defaultpass", 10);
    const address = { addr1: "Not set", pincode: "000000", district: "NA" };

    const newUser = await User.create({ name, email, phone, password: hashedPassword, address });

    return res.json({ success: true, message: "User created successfully", user: newUser });

  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
