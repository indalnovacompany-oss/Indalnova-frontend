import mongoose from "mongoose";

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
  try {
    await mongoose.connect(CONNECTION_STRING, { maxPoolSize: 10 });
    isConnected = true;
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw new Error("DB connection failed");
  }
}

// Clean phone number to match DB format
function cleanPhone(phone) {
  phone = phone.replace(/\D/g, "");
  if (phone.startsWith("91") && phone.length > 10) phone = phone.slice(2);
  if (phone.startsWith("0") && phone.length > 10) phone = phone.slice(1);
  return phone;
}

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

// API Handler
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await connectDB();

    const { identifier } = req.query;
    if (!identifier) {
      return res.status(400).json({ success: false, message: "Identifier is required" });
    }

    let query = {};

    if (identifier.includes("@")) {
      // Email lookup
      query.email = identifier.toLowerCase();
    } else {
      // Phone lookup
      const cleaned = cleanPhone(identifier);
      if (!/^[0-9]{10}$/.test(cleaned)) {
        return res.status(400).json({ success: false, message: "Invalid phone number" });
      }
      query.phone = cleaned;
    }

    const user = await User.findOne(query).lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Success response
    return res.status(200).json({ success: true, user });

  } catch (err) {
    console.error("CheckUser error:", err);
    return res.status(500).json({ success: false, message: "Server error. Try again later." });
  }
}
