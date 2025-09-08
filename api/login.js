import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const CONNECTION_STRING = "mongodb+srv://indalnova:1LpW2CMG1MHEpuca@cluster0.05abfqy.mongodb.net/?retryWrites=true&w=majority";
let isConnected = false;

// ---- Connect DB ----
async function connectDB() {
  if (isConnected) return;
  if (mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }
  await mongoose.connect(CONNECTION_STRING, { maxPoolSize: 10 });
  isConnected = true;
}

// ---- Schema ----
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String },
  phone: { type: String, required: true },
  otp: { type: String }, // temporary OTP storage
  otpExpiry: { type: Date }, // OTP expiry time
  address: String,
  cart: { type: Array, default: [] },
  orders: { type: Array, default: [] }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default async function handler(req, res) {
  try {
    await connectDB();

    const { email, password, otp } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email }).select("name email password phone otp otpExpiry address").lean();
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // 1. If OTP login
    if (otp) {
      if (!user.otp || !user.otpExpiry || user.otp !== otp || user.otpExpiry < Date.now()) {
        return res.status(401).json({ success: false, message: "Invalid or expired OTP" });
      }

      // OTP is valid → clear it
      await User.updateOne({ email }, { $unset: { otp: "", otpExpiry: "" } });

      return res.status(200).json({
        success: true,
        message: "Logged in successfully with OTP",
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address }
      });
    }

    // 2. If Password login
    if (password) {
      const isMatch = await bcrypt.compare(password, user.password || "");
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid password" });
      }

      return res.status(200).json({
        success: true,
        message: "Logged in successfully with password",
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address }
      });
    }

    return res.status(400).json({ success: false, message: "Provide OTP or password to login" });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
