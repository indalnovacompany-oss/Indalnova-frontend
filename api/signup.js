import mongoose from "mongoose";
import OTP from "./otpmodel.js";
import { sendOTP } from "./sendsms.js";

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

// User schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
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
    let { step, name, email, phone, otp } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: "Name, email and phone required" });
    }

    phone = cleanPhone(phone);
    email = email.toLowerCase();

    // Step 1 → Send OTP
    if (step === "send") {
      const existing = await User.findOne({ $or: [{ email }, { phone }] });
      if (existing) {
        return res.status(400).json({ success: false, message: "Email or phone already registered" });
      }

      await sendOTP(phone);
      return res.status(200).json({ success: true, message: "OTP sent successfully" });
    }

    // Step 2 → Verify OTP
    if (step === "verify") {
      const record = await OTP.findOne({ phone, otp });
      if (!record || record.expires.getTime() < Date.now()) {
        return res.status(401).json({ success: false, message: "Invalid or expired OTP" });
      }
      await OTP.deleteOne({ _id: record._id });

      const newUser = await User.create({ name, email, phone });
      return res.status(201).json({
        success: true,
        message: "Signup successful",
        user: { id: newUser._id, name: newUser.name, email: newUser.email, phone: newUser.phone },
      });
    }

    return res.status(400).json({ success: false, message: "Invalid step" });

  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
