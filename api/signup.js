// /api/signup.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { verifyOTP } from "./sendsms"; // memory OTP

const CONNECTION_STRING = "mongodb+srv://indalnova:1LpW2CMG1MHEpuca@cluster0.05abfqy.mongodb.net/?retryWrites=true&w=majority";
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
  password: String,
  phone: { type: String, required: true, unique: true },
  address: String,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  try {
    await connectDB();
    const { name, email, phone, password, otp, address } = req.body;

    if (!name || !email || !phone || !password || !otp) 
      return res.status(400).json({ success: false, message: "All fields including OTP are required" });

    if (!verifyOTP(phone, otp)) 
      return res.status(401).json({ success: false, message: "Invalid or expired OTP" });

    // Check existing user
    const existing = await User.findOne({ email }).lean();
    if (existing) return res.status(400).json({ success: false, message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({ name, email, phone, password: hashedPassword, address });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: { id: newUser._id, name: newUser.name, email: newUser.email, phone: newUser.phone, address: newUser.address }
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
