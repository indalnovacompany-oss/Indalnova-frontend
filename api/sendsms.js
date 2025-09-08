// /api/sendsms.js
let otpStore = {}; // temporary OTP storage

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { phone, type } = req.body; // type = "login" or "signup"
  if (!phone) return res.status(400).json({ success: false, message: "Phone is required" });

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000);

  // Save OTP in memory (valid for 5 minutes)
  otpStore[phone] = { otp, expires: Date.now() + 5 * 60 * 1000 };

  try {
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: process.env.FAST2SMS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "v3",
        sender_id: "TXTIND",
        message: `Your OTP for ${type} is ${otp}. It is valid for 5 minutes.`,
        language: "english",
        flash: 0,
        numbers: phone,
      }),
    });

    const data = await response.json();

    if (data.return) {
      return res.status(200).json({ success: true, message: "OTP sent successfully" });
    } else {
      return res.status(500).json({ success: false, message: "Failed to send OTP" });
    }

  } catch (error) {
    console.error("Fast2SMS error:", error);
    return res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
}

// Optional: helper to verify OTP
export function verifyOTP(phone, inputOtp) {
  const record = otpStore[phone];
  if (!record) return false;
  if (Date.now() > record.expires) {
    delete otpStore[phone];
    return false;
  }
  if (record.otp.toString() === inputOtp.toString()) {
    delete otpStore[phone]; // OTP can be used only once
    return true;
  }
  return false;
}
