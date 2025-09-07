import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const CONNECTION_STRING = "mongodb+srv://indalnova:1LpW2CMG1MHEpuca@cluster0.05abfqy.mongodb.net/?retryWrites=true&w=majority";
let isConnected = false;

// Connect to DB (cached)
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(CONNECTION_STRING);
  isConnected = true;
}

// Define schema (outside handler)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String },
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

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists with this email" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({ name, email, password: hashedPassword, phone, address });
    await newUser.save();

    // Return user without password
    const userResponse = { 
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone
    };

    return res.status(201).json({ success: true, message: "User created successfully", user: userResponse });

  } catch (err) {
    console.error("Signup error:", err);

    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    return res.status(500).json({ success: false, message: "Server error, please try again later" });
  }
}
