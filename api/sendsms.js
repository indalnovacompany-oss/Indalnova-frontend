// /api/sendsms.js
import mongoose from "mongoose";
import User from "./userModel"; // adjust path if needed

const CONNECTION_STRING = "mongodb+srv://indalnova:1LpW2CMG1MHEpuca@cluster0.05abfqy.mongodb.net/?retryWrites=true&w=majority";
let isConnected = false;

// ---- Connect to DB ----
async function connectDB() {
  if (isConnected) return;
  if (mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }
  await mongoose.connect(CONNECTION_STRING, { maxPoolSize: 10 });
  isConnected = true;
}

// Helper: clean phone number
function cleanPhone(phone) {
  phone = phone.replace(/\D/g, "");      // remove non-digits
  if (phone.startsWith("91") && phone.length > 10) phone = phone.slice(2);
  if (phone.startsWith("0") && phone.length > 10) phone = phone.slice(1);
  return phone;
}

// Exported function to verify OTP from user input
export async function verifyOTP(phone, inputOtp) {
  await connectDB();
  phone = cleanPhone(phone);
  const user = await User.findOne({ phone });
  if (!user || !user.otp || !user.otpExpiry) return false;
  if (new Date(user.otpExpiry).getTime() < Date.now()) {
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();
    return false;
  }
  if (user.otp.toString() === inputOtp.toString()) {
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();
    return true;
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await connectDB();

    let { phone, type } = req.body; // type = "login" or "signup"
    if (!phone) return res.status(400).json({ success: false, message: "Phone is required" });
    phone = cleanPhone(phone);

    // Validate 10-digit phone
    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: "Invalid 10-digit phone number" });
    }

    // Find user
    let user = await User.findOne({ phone });
    if (!user) return res.status(401).json({ success: false, message: "User not found" });

    // Generate OTP & expiry
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save OTP in DB
    user.otp = otp.toString();
    user.otpExpiry = expiry;
    await user.save();

    // Send SMS via Fast2SMS
    if (!process.env.FAST2SMS_API_KEY) {
      console.error("FAST2SMS_API_KEY not set in environment variables!");
      return res.status(500).json({ success: false, message: "Server configuration error" });
    }

    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: process.env.FAST2SMS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "otp",                // OTP route (normal SMS)
        sender_id: "TXTIND",
        message: `Your OTP for ${type} is ${otp}. Valid for 5 minutes.`,
        language: "english",
        flash: 0,
        numbers: phone,
      }),
    });

    const data = await response.json();

    if (data.return) {
      console.log(`OTP sent to ${phone}: ${otp}`);
      return res.status(200).json({ success: true, message: "OTP sent successfully" });
    } else {
      console.error("Fast2SMS error:", data);
      return res.status(500).json({ success: false, message: "Failed to send OTP" });
    }

  } catch (error) {
    console.error("SendSMS error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
