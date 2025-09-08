import mongoose from "mongoose";
import OTP from "./otpmodel.js";

const CONNECTION_STRING =
  process.env.MONGO_URI ||
  "mongodb+srv://indalnova:1LpW2CMG1MHEpuca@cluster0.05abfqy.mongodb.net/?retryWrites=true&w=majority";

let isConnected = false;

// Connect to MongoDB
async function connectDB() {
  if (isConnected) return;
  if (mongoose.connection.readyState >= 1) { isConnected = true; return; }
  await mongoose.connect(CONNECTION_STRING, { maxPoolSize: 10 });
  isConnected = true;
}

// User schema
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    phone: { type: String, unique: true },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

// Clean phone
function cleanPhone(phone) {
  phone = phone.replace(/\D/g, "");
  if (phone.startsWith("91") && phone.length > 10) phone = phone.slice(2);
  if (phone.startsWith("0") && phone.length > 10) phone = phone.slice(1);
  return phone;
}

// API handler
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  try {
    await connectDB();
    let { identifier, otp } = req.body;
    if (!identifier || !otp) return res.status(400).json({ success: false, message: "Identifier & OTP required" });

    let user;
    let phone = "";

    // Determine if email or phone
    if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(identifier)) {
      user = await User.findOne({ email: identifier.toLowerCase() });
      if (!user) return res.status(401).json({ success: false, message: "Email not registered" });
      phone = cleanPhone(user.phone);
    } else if (/^\d{10,12}$/.test(identifier.replace(/\D/g,''))) {
      phone = cleanPhone(identifier);
      user = await User.findOne({ phone });
      if (!user) return res.status(401).json({ success: false, message: "Phone not registered" });
    } else return res.status(400).json({ success: false, message: "Invalid identifier" });

    // Verify OTP
    const record = await OTP.findOne({ phone, otp });
    if (!record || record.expires.getTime() < Date.now()) {
      return res.status(401).json({ success: false, message: "Invalid or expired OTP" });
    }
    await OTP.deleteOne({ _id: record._id });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      phone: user.phone,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
