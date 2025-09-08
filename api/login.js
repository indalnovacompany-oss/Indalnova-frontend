import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const CONNECTION_STRING = "mongodb+srv://indalnova:1LpW2CMG1MHEpuca@cluster0.05abfqy.mongodb.net/?retryWrites=true&w=majority";
let isConnected = false;

// ---- Connect to DB (cached) ----
async function connectDB() {
  if (isConnected) return;
  if (mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }
  await mongoose.connect(CONNECTION_STRING, { maxPoolSize: 10 });
  isConnected = true;
}

// ---- User Schema ----
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: { type: String, required: true, unique: true },
  otp: String,
  otpExpiry: Date,
  address: String,
  cart: { type: Array, default: [] },
  orders: { type: Array, default: [] }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

// ---- Helper: normalize phone ----
function normalizePhone(phone) {
  phone = phone.replace(/\D/g, "");      // remove non-digits
  if (phone.startsWith("91") && phone.length > 10) phone = phone.slice(2);
  if (phone.startsWith("0") && phone.length > 10) phone = phone.slice(1);
  return phone;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await connectDB();

    let { phone, password, otp } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: "Phone is required" });

    // Normalize phone
    const cleanPhone = normalizePhone(phone);

    // Find user by normalized phone
    const user = await User.findOne({ phone: cleanPhone }).select("name email password phone otp otpExpiry address");
    if (!user) return res.status(401).json({ success: false, message: "User not found" });

    console.log("Login attempt:", { phone: cleanPhone, otp, password });

    // ===== OTP login =====
    if (otp) {
      otp = otp.toString().trim();
      if (!user.otp || !user.otpExpiry || user.otp.toString().trim() !== otp || user.otpExpiry.getTime() < Date.now()) {
        console.log("OTP mismatch or expired:", { storedOtp: user.otp, otpExpiry: user.otpExpiry });
        return res.status(401).json({ success: false, message: "Invalid or expired OTP" });
      }

      // Clear OTP after use
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Logged in successfully with OTP",
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address }
      });
    }

    // ===== Password login =====
    if (password) {
      if (!user.password) return res.status(401).json({ success: false, message: "No password set for this user" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ success: false, message: "Invalid password" });

      return res.status(200).json({
        success: true,
        message: "Logged in successfully with password",
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address }
      });
    }

    return res.status(400).json({ success: false, message: "Provide OTP or password to login" });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error, please try again later" });
  }
}

