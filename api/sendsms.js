// /api/sendsms.js
let otpStore = {}; // temporary in-memory OTP storage

// Helper: clean phone number
function cleanPhone(phone) {
  phone = phone.replace(/\D/g, ""); // remove non-digits
  if (phone.startsWith("91") && phone.length > 10) phone = phone.slice(2);
  if (phone.startsWith("0") && phone.length > 10) phone = phone.slice(1);
  return phone;
}

// Exported helper to verify OTP in login/signup
export function verifyOTP(phone, inputOtp) {
  phone = cleanPhone(phone);
  const record = otpStore[phone];
  if (!record) return false;
  if (Date.now() > record.expires) {
    delete otpStore[phone];
    return false;
  }
  if (record.otp.toString() === inputOtp.toString()) {
    delete otpStore[phone]; // OTP used only once
    return true;
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { phone, type } = req.body; // type = "login" or "signup"
    if (!phone) return res.status(400).json({ success: false, message: "Phone is required" });

    const clean = cleanPhone(phone);
    if (!/^[0-9]{10}$/.test(clean)) {
      return res.status(400).json({ success: false, message: "Invalid 10-digit phone number" });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Store OTP in memory for 5 minutes
    otpStore[clean] = { otp, expires: Date.now() + 5 * 60 * 1000 };

    // Send via Fast2SMS (numeric-only)
  const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
  method: "POST",
  headers: {
    authorization: process.env.FAST2SMS_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    route: "otp",
    sender_id: "TXTIND",
    message: otp.toString(),      // numeric OTP
    language: "english",
    flash: 0,
    numbers: phone,
    variables_values: otp.toString(),  // THIS MUST BE numeric
  }),
});


    const data = await response.json();
    if (data.return) {
      console.log(`OTP sent to ${clean}: ${otp}`);
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

