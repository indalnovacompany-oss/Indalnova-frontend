// /api/sendsms.js
let otpStore = {}; // temporary OTP storage

// Helper: clean phone number
function cleanPhone(phone) {
  phone = phone.replace(/\D/g, "");      // remove non-digits
  if (phone.startsWith("91") && phone.length > 10) phone = phone.slice(2);
  if (phone.startsWith("0") && phone.length > 10) phone = phone.slice(1);
  return phone;
}

// Exported function to verify OTP
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  let { phone, type } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: "Phone is required" });
  phone = cleanPhone(phone);

  // Validate phone length
  if (!/^[0-9]{10}$/.test(phone)) {
    return res.status(400).json({ success: false, message: "Invalid 10-digit phone number" });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000);

  // Store OTP in memory for 5 minutes
  otpStore[phone] = { otp, expires: Date.now() + 5 * 60 * 1000 };

  // Check if API key exists
  if (!process.env.FAST2SMS_API_KEY) {
    console.error("FAST2SMS_API_KEY not set in environment variables!");
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
        route: "v3",
        sender_id: "TXTIND",
        message: `Your OTP for ${type} is ${otp}. It is valid for 5 minutes.`,
        language: "english",
        flash: 0,
        numbers: phone,
      }),
    });

    let data;
    try {
      data = await response.json();
    } catch (err) {
      const text = await response.text();
      console.error("Fast2SMS invalid response:", text);
      return res.status(500).json({ success: false, message: "Invalid response from Fast2SMS" });
    }

    if (data.return) {
      console.log(`OTP sent to ${phone}: ${otp}`);
      return res.status(200).json({ success: true, message: "OTP sent successfully" });
    } else {
      console.error("Fast2SMS error:", data);
      return res.status(500).json({ success: false, message: "Failed to send OTP" });
    }

  } catch (error) {
    console.error("Fast2SMS fetch error:", error);
    return res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
}

