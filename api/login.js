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
  name: String,
  email: String,
  phone: String,
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

    let { step, identifier, otp } = req.body;
    if (!identifier) {
      return res.status(400).json({ success: false, message: "Phone or email required" });
    }

    // Find user
    let query = {};
    let phoneValue;
    if (identifier.includes("@")) {
      query.email = identifier.toLowerCase();
    } else {
      phoneValue = cleanPhone(identifier);
      if (!/^[0-9]{10}$/.test(phoneValue)) {
        return res.status(400).json({ success: false, message: "Invalid phone number" });
      }
      query.phone = phoneValue;
    }

    const user = await User.findOne(query).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found. Please signup first." });
    }

    // Step 1 → Send OTP
    if (step === "send") {
      await sendOTP(user.phone);
      return res.status(200).json({ success: true, message: "OTP sent successfully" });
    }

    // Step 2 → Verify OTP
    if (step === "verify") {
      const record = await OTP.findOne({ phone: user.phone, otp });
      if (!record || record.expires.getTime() < Date.now()) {
        return res.status(401).json({ success: false, message: "Invalid or expired OTP" });
      }
      await OTP.deleteOne({ _id: record._id });

      return res.status(200).json({
        success: true,
        message: "Login successful",
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
      });
    }

    return res.status(400).json({ success: false, message: "Invalid step" });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error.You have reached you otp limit Try after some time." });
  }
}

