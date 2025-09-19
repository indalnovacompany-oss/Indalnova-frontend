import mongoose from "mongoose";

const CONNECTION_STRING =
  process.env.MONGO_URI ||
  "mongodb+srv://indalnova:1LpW2CMG1MHEpuca@cluster0.05abfqy.mongodb.net/?retryWrites=true&w=majority";

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  if (mongoose.connection.readyState >= 1) { isConnected = true; return; }
  await mongoose.connect(CONNECTION_STRING, { maxPoolSize: 10 });
  isConnected = true;
}

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await connectDB();

    const { identifier } = req.query;
    if (!identifier) {
      return res.status(400).json({ success: false, message: "Identifier required" });
    }

    let query = {};
    if (identifier.includes("@")) {
      query.email = identifier.toLowerCase();
    } else {
      query.phone = identifier;
    }

    const user = await User.findOne(query).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user });

  } catch (err) {
    console.error("CheckUser error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
