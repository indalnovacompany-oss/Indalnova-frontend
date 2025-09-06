import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../../models/User.js"; // Save the schema above in models/User.js

const CONNECTION_STRING = "mongodb+srv://indalnova:1LpW2CMG1MHEpuca@cluster0.05abfqy.mongodb.net/?retryWrites=true&w=majority";

let isConnected = false;

async function connectDB() {
  if (!isConnected) {
    await mongoose.connect(CONNECTION_STRING);
    isConnected = true;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  try {
    await connectDB();
    const { name, email, password, phone, address } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, phone, address, cart: [], orders: [] });
    await newUser.save();

    return res.status(200).json({ success: true, message: "User created successfully", cart: [], orders: [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
