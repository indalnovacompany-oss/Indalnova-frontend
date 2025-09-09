import mongoose from "mongoose";
import OTP from "./otpmodel.js";

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

// Clean phone number
function cleanPhone(phone) {
  phone = phone.replace(/\D/g, "");
  if (phone.startsWith("91") && phone.length > 10) phone = phone.slice(2);
  if (phone.startsWith("0") && phone.length > 10) phone = phone.slice(1);
  return phone;
}

// Helper → Generate & send OTP
export async function sendOTP(phone) {
  await connectDB();
  const clean = cleanPhone(phone);

  if (!/^[0-9]{10}$/.test(clean)) {
    throw new Error("Invalid phone number");
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Remove old OTPs
  await OTP.deleteMany({ phone: clean });

  // Save OTP
  await OTP.create({
    phone: clean,
    otp,
    expires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
  });

  // Call Fast2SMS API
  const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      authorization: process.env.FAST2SMS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      route: "otp",
      numbers: clean,
      variables_values: otp,
    }),
  });

  const data = await response.json();
  console.log("Fast2SMS response:", data);

  if (!data.return) throw new Error(data.message || "Failed to send OTP");

  console.log(`OTP sent to ${clean}: ${otp}`);
  return true;
}

// Optional direct API route (not required if imported in signup/login)
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: "Phone required" });

    await sendOTP(phone);
    return res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("SendSMS error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

