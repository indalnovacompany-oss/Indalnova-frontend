import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const CONNECTION_STRING = "mongodb+srv://indalnova:1LpW2CMG1MHEpuca@cluster0.05abfqy.mongodb.net/?retryWrites=true&w=majority";
let isConnected = false;

// ---- Connect to DB (cached + optimized) ----
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
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String },
  otp: { type: String }, // for OTP login
  otpExpiry: { type: Date },
  cart: { type: Array, default: [] },
  orders: { type: Array, default: [] }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await connectDB();

    let { name, email, password, phone, address } = req.body;
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Normalize email
    email = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists with this email" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save new user (fast insert)
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address
    });

    // Response user object (no password)
    const userResponse = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      address: newUser.address
    };

    // Auto-login simulation → return success + redirect info
    return res.status(201).json({
      success: true,
      message: "User created & logged in successfully",
      user: userResponse,
      redirect: "/index.html" // 👈 frontend will use this
    });

  } catch (err) {
    console.error("Signup error:", err);

    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    return res.status(500).json({ success: false, message: "Server error, please try again later" });
  }
}
