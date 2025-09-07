import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const CONNECTION_STRING = "mongodb+srv://indalnova:1LpW2CMG1MHEpuca@cluster0.05abfqy.mongodb.net/?retryWrites=true&w=majority";
let isConnected = false;

// ---- Connect DB ----
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(CONNECTION_STRING);
  isConnected = true;
}

// ---- Schema outside handler ----
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

    // Normalize input
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }
    email = email.trim().toLowerCase();

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    // Build response user object
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      cart: user.cart,
      orders: user.orders
    };

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: userResponse
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error, please try again later" });
  }
}
