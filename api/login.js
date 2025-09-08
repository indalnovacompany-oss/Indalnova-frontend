import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import OTP from "./otpmodel.js";

const CONNECTION_STRING =
  process.env.MONGO_URI ||
  "mongodb+srv://indalnova:1LpW2CMG1MHEpuca@cluster0.05abfqy.mongodb.net/?retryWrites=true&w=majority";

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  if (mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }
  await mongoose.connect(CONNECTION_STRING, { maxPoolSize: 10 });
  isConnected = true;
}

// User schema
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    phone: { type: String, required: true, unique: true },
    address: String,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    await connectDB();
    let { phone, password, otp } = req.body;

    if (!phone)
      return res
        .status(400)
        .json({ success: false, message: "Phone required" });

    // Clean phone
    phone = phone.replace(/\D/g, "");
    if (phone.startsWith("91") && phone.length > 10) phone = phone.slice(2);
    if (phone.startsWith("0") && phone.length > 10) phone = phone.slice(1);

    // Find user
    const user = await User.findOne({ phone }).select(
      "name email password phone address"
    );
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    // OTP login
    if (otp) {
      const record = await OTP.findOne({ phone, otp });
      if (!record || record.expires.getTime() < Date.now()) {
        return res
          .status(401)
          .json({ success: false, message: "OTP mismatch or expired" });
      }
      await OTP.deleteOne({ _id: record._id });

      return res.status(200).json({
        success: true,
        message: "Logged in with OTP successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
        },
      });
    }

    // Password login
    if (password) {
      if (!user.password)
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });

      const match = await bcrypt.compare(password, user.password);
      if (!match)
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });

      return res.status(200).json({
        success: true,
        message: "Logged in with password successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
        },
      });
    }

    return res
      .status(400)
      .json({ success: false, message: "Provide OTP or password" });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
