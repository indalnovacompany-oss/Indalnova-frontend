import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const CONNECTION_STRING = "mongodb+srv://indalnova:1LpW2CMG1MHEpuca@cluster0.05abfqy.mongodb.net/?retryWrites=true&w=majority";
let isConnected = false;

async function connectDB() {
    if (isConnected) return;
    await mongoose.connect(CONNECTION_STRING);
    isConnected = true;
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    try {
        await connectDB();

        // Normalize email to lowercase
        const email = req.body.email?.toLowerCase();
        const password = req.body.password;

        if (!email || !password) 
            return res.status(400).json({ success: false, message: "Email and password required" });

        const userSchema = new mongoose.Schema({
            name: String,
            email: { type: String, unique: true },
            password: String,
            phone: String,
            address: String,
            cart: { type: Array, default: [] },
            orders: { type: Array, default: [] }
        });

        const User = mongoose.models.User || mongoose.model("User", userSchema);

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ success: false, message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: "Invalid password" });

        return res.status(200).json({ success: true, message: "Logged in successfully", user });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}
