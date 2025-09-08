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
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

// Clean phone number to 10 digits
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
    let { name, email, phone, otp } = req.body;

    if (!name || !email || !phone || !otp) {
      return res.status(400).json({ success: false, message: "Name, email, phone, and OTP are required" });
    }

    // Clean phone
    phone = cleanPhone(phone);
    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: "Invalid 10-digit phone number" });
    }

    // OTP verification
    const record = await OTP.findOne({ phone, otp });
    if (!record || record.expires.getTime() < Date.now()) {
      return res.status(401).json({ success: false, message: "Invalid or expired OTP" });
    }
    await OTP.deleteOne({ _id: record._id }); // delete after use

    // Check existing user
    let user = await User.findOne({ $or: [{ email }, { phone }] });
    if (!user) {
      // Create new user
      user = await User.create({ name, email, phone, isVerified: true });
    } else {
      // Mark as verified
      user.isVerified = true;
      await user.save();
    }

    return res.status(201).json({
      success: true,
      message: "Signup successful & ready to login",
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
