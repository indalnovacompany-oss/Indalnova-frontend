// /api/sendsms.js
let otpStore = {}; // memory-based OTP storage

// Helper to clean phone
function cleanPhone(phone) {
  phone = phone.replace(/\D/g, "");
  if (phone.startsWith("91") && phone.length > 10) phone = phone.slice(2);
  if (phone.startsWith("0") && phone.length > 10) phone = phone.slice(1);
  return phone;
}

// Exported OTP verification
export function verifyOTP(phone, inputOtp) {
  phone = cleanPhone(phone);
  const record = otpStore[phone];
  if (!record) return false;
  if (Date.now() > record.expires) {
    delete otpStore[phone];
    return false;
  }
  if (record.otp.toString() === inputOtp.toString()) {
    delete otpStore[phone];
    return true;
  }
  return false;
}

// Send OTP
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  const { phone, type } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: "Phone is required" });

  const cleanedPhone = cleanPhone(phone);
  if (!/^[0-9]{10}$/.test(cleanedPhone)) return res.status(400).json({ success: false, message: "Invalid 10-digit phone number" });

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore[cleanedPhone] = { otp, expires: Date.now() + 5 * 60 * 1000 }; // 5 min

  // Fast2SMS API
  if (!process.env.FAST2SMS_API_KEY) {
    console.error("FAST2SMS_API_KEY missing!");
    return res.status(500).json({ success: false, message: "Server configuration error" });
  }

  try {
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: process.env.FAST2SMS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "otp", // normal SMS, cheaper
        sender_id: "TXTIND",
        message: `Your OTP for ${type} is ${otp}. Valid for 5 minutes.`,
        language: "english",
        flash: 0,
        numbers: cleanedPhone,
      }),
    });

    const data = await response.json();
    if (data.return) {
      console.log(`OTP sent to ${cleanedPhone}: ${otp}`);
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
