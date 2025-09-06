// server.cjs
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Replace with your actual MongoDB connection string
const CONNECTION_STRING = "mongodb+srv://indalnova:1LpW2CMG1MHEpuca@cluster0.05abfqy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

mongoose.connect(CONNECTION_STRING)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection error:", err));

// Example login API
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    // Replace this with actual DB check
    if(email === "test@example.com" && password === "mypassword") {
        return res.json({ success: true, message: "Logged in!" });
    }
    res.status(401).json({ success: false, message: "Invalid credentials" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
