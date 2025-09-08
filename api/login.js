import mongoose from "mongoose";
import fetch from "node-fetch"; // for Fast2SMS API

const CONNECTION_STRING = process.env.MONGO_URI;
let isConnected = false;
let otpStore = {}; // Temporary OTP storage

async function connectDB() {
  if (isConnected) return;
  if (mongoose.connection.readyState >= 1) { isConnected = true; return; }
  await mongoose.connect(CONNECTION_STRING, { maxPoolSize: 10 });
  isConnected = true;
}

// User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: { type: String, unique: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

// Clean phone number
function cleanPhone(phone) {
  phone = phone.replace(/\D/g, "");
  if (phone.startsWith("91") && phone.length > 10) phone = phone.slice(2);
  if (phone.startsWith("0") && phone.length > 10) phone = phone.slice(1);
  return phone;
}

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send SMS via Fast2SMS
async function sendSMS(phone, message) {
  const API_KEY = process.env.FAST2SMS_KEY;
  const url = `https://www.fast2sms.com/dev/bulkV2`;
  const body = {
    route: "v3",
    sender_id: "FSTSMS",
    message: message,
    language: "english",
    flash: 0,
    numbers: phone
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "authorization": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body)
  });
  return res.json();
}

// Handler
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  try {
    await connectDB();
    let { identifier } = req.body;
    if (!identifier) return res.status(400).json({ success: false, message: "Enter email or phone" });

    let user;
    let phone = "";

    // Check if email
    if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(identifier)) {
      user = await User.findOne({ email: identifier.toLowerCase() });
      if (!user) return res.status(200).json({ success: false, message: "Email not registered. Please signup first." });
      phone = cleanPhone(user.phone);
    }
    // Else assume phone
    else if (/^\d{10,12}$/.test(identifier.replace(/\D/g,''))) {
      phone = cleanPhone(identifier);
      user = await User.findOne({ phone });
      if (!user) return res.status(200).json({ success: false, message: "Phone not registered. Please signup first." });
    }
    else return res.status(400).json({ success: false, message: "Enter valid email or phone" });

    // Generate OTP
    const otp = generateOTP();
    otpStore[phone] = { otp, expires: Date.now() + 5*60*1000 }; // 5 min expiry

    // Send SMS
    const smsRes = await sendSMS(phone, `Your INDALNOVA OTP is ${otp}`);
    if (!smsRes.return) return res.status(500).json({ success: false, message: "Failed to send OTP" });

    return res.status(200).json({ success: true, message: "OTP sent successfully" });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
