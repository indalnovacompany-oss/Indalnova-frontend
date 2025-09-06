import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const CONNECTION_STRING = "mongodb+srv://indalnova:1LpW2CMG1MHEpuca@cluster0.05abfqy.mongodb.net/?retryWrites=true&w=majority";

let isConnected = false;

async function connectDB() {
  if (!isConnected) {
    await mongoose.connect(CONNECTION_STRING);
    isConnected = true;
  }
}

// Define schema inside API (no external model)
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  cart: { type: Array, default: [] },
  orders: { type: Array, default: [] },
});

let User;
try { User = mongoose.model("User"); } 
catch { User = mongoose.model("User", userSchema); }

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  await connectDB();

  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        cart: user.cart,
        orders: user.orders
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

