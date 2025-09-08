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
  name: { type: String, required: true },
  email: { type: String, unique: true },
  phone: { type: String, unique: true },
  password: String,
  address: {
    addr1: String,
    addr2: String,
    pincode: String,
    district: String,
    state: String,
    notes: String,
  },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

function cleanPhone(phone) {
  phone = phone.replace(/\D/g, "");
  if (phone.startsWith("91") && phone.length > 10) phone = phone.slice(2);
  if (phone.startsWith("0") && phone.length > 10) phone = phone.slice(1);
  return phone;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  try {
    await connectDB();
    let { step, name, email, phone, otp, password, address } = req.body;

    if (!step) return res.status(400).json({ success: false, message: "Step required" });

    // -------- STEP 1: SEND OTP --------
    if (step === "send") {
      if (!name || !email || !phone) {
        return res.status(400).json({ success: false, message: "Name, email & phone are required" });
      }

      phone = cleanPhone(phone);

      const exists = await User.findOne({ $or: [{ email }, { phone }] });
      if (exists) return res.status(400).json({ success: false, message: "Email or phone already registered" });

      // Generate and save OTP
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      await OTP.create({ phone, otp: newOtp, expires: new Date(Date.now() + 5 * 60 * 1000) });

      // send SMS/email here
      return res.status(200).json({ success: true, message: "OTP sent" });
    }

    // -------- STEP 2: VERIFY & REGISTER --------
    if (step === "verify") {
      if (!otp || !phone || !email || !name || !password || !address) {
        return res.status(400).json({ success: false, message: "All fields & OTP required" });
      }

      phone = cleanPhone(phone);

      // Check OTP
      const record = await OTP.findOne({ phone, otp });
      if (!record || record.expires.getTime() < Date.now()) {
        return res.status(401).json({ success: false, message: "Invalid or expired OTP" });
      }
      await OTP.deleteOne({ _id: record._id });

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await User.create({ name, email, phone, password: hashedPassword, address });

      return res.status(201).json({
        success: true,
        message: "Signup successful",
        user: { id: newUser._id, name: newUser.name, email: newUser.email, phone: newUser.phone }
      });
    }

    return res.status(400).json({ success: false, message: "Invalid step" });

  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

