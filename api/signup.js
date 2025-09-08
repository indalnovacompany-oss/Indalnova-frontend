// /api/signup.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import OTP from "./otpmodel.js";

const CONNECTION_STRING =
  process.env.MONGO_URI ||
  "mongodb+srv://indalnova:1LpW2CMG1MHEpuca@cluster0.05abfqy.mongodb.net/?retryWrites=true&w=majority";

let isConnected = false;

// Connect to MongoDB
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
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    address: {
      addr1: { type: String, required: true },
      addr2: String,
      pincode: { type: String, required: true },
      district: { type: String, required: true },
      state: String,
      notes: String,
    },
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
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await connectDB();

    let { name, email, phone, password, otp, address } = req.body;

    if (!name || !email || !phone || !password || !otp || !address) {
      return res.status(400).json({ success: false, message: "All fields including OTP and address are required" });
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
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] }).lean();
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email or phone already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save new user
    let newUser;
    try {
      newUser = await User.create({
        name,
        email,
        phone,
        password: hashedPassword,
        address,
      });
    } catch (e) {
      if (e.code === 11000) {
        return res.status(400).json({ success: false, message: "Email or phone already exists" });
      }
      throw e;
    }

    return res.status(201).json({
      success: true,
      message: "User created successfully & ready to login",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        address: newUser.address,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
