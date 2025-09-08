import mongoose from "mongoose";
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
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  isVerified: { type: Boolean, default: false },
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
    let { step, name, identifier, otp } = req.body;

    if (!identifier) return res.status(400).json({ success: false, message: "Phone or email required" });

    // -------- STEP 1: SEND OTP --------
    if (step === "send") {
      if (!name) return res.status(400).json({ success: false, message: "Name required for signup" });

      let phone = "";
      let email = "";

      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
        email = identifier.toLowerCase();
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ success: false, message: "Email already registered" });
      } else {
        phone = cleanPhone(identifier);
        const exists = await User.findOne({ phone });
        if (exists) return res.status(400).json({ success: false, message: "Phone already registered" });
      }

      // here call your sendSMS() or sendEmail() function
      // and save OTP in OTP collection
      return res.status(200).json({ success: true, message: "OTP sent" });
    }

    // -------- STEP 2: VERIFY OTP --------
    if (step === "verify") {
      if (!otp || !name) return res.status(400).json({ success: false, message: "Name and OTP required" });

      let phone = "";
      let email = "";

      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
        email = identifier.toLowerCase();
      } else {
        phone = cleanPhone(identifier);
      }

      const record = await OTP.findOne({ phone, otp });
      if (!record || record.expires.getTime() < Date.now()) {
        return res.status(401).json({ success: false, message: "Invalid or expired OTP" });
      }
      await OTP.deleteOne({ _id: record._id });

      const newUser = new User({ name, email, phone, isVerified: true });
      await newUser.save();

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

