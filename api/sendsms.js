// /api/sendsms.js
import mongoose from "mongoose";
import OTP from "./otpmodel.js";

const CONNECTION_STRING = process.env.MONGO_URI;
let isConnected = false;

// Connect to MongoDB
async function connectDB() {
  if (isConnected) return;
  if (mongoose.connection.readyState >= 1) { isConnected = true; return; }
  await mongoose.connect(CONNECTION_STRING, { maxPoolSize: 10 });
  isConnected = true;
}

// Clean phone number to 10 digits
function cleanPhone(phone) {
  phone = phone.replace(/\D/g, ""); // remove non-digits
  if (phone.startsWith("91") && phone.length > 10) phone = phone.slice(2);
  if (phone.startsWith("0") && phone.length > 10) phone = phone.slice(1);
  return phone;
}

// API handler
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await connectDB();

    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: "Phone is required" });

    const clean = cleanPhone(phone);
    if (!/^[0-9]{10}$/.test(clean)) {
      return res.status(400).json({ success: false, message: "Invalid 10-digit phone number" });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove any old OTPs for this number
    await OTP.deleteMany({ phone: clean });

    // Save new OTP
    await OTP.create({
      phone: clean,
      otp,
      expires: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    });

    // Fast2SMS request
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: process.env.FAST2SMS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "otp",
        numbers: clean,           // 10-digit numeric
        variables_values: otp,    // numeric only
      }),
    });

    const data = await response.json();
    console.log("Fast2SMS response:", data);

    if (data.return) {
      console.log(`OTP sent to ${clean}: ${otp}`);
      return res.status(200).json({ success: true, message: "OTP sent successfully" });
    } else {
      return res.status(500).json({ success: false, message: data.message || "Failed to send OTP" });
    }

  } catch (error) {
    console.error("SendSMS error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
