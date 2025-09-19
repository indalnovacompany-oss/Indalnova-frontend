import { MongoClient } from "mongodb";

// Use your Vercel environment variable for MongoDB connection
const uri = process.env.MONGO_URI;

let client;
let clientPromise;

if (!clientPromise) {
  client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  clientPromise = client.connect();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      // If neither email nor phone is provided, return false
      return res.status(200).json({ exists: false });
    }

    const conn = await clientPromise;
    const db = conn.db("test");            // ✅ your DB name
    const users = db.collection("users");  // ✅ your collection

    // Build query dynamically
    const query = {};
    if (email) query.email = email;
    if (phone) query.phone = phone;

    const user = await users.findOne(query);

    return res.status(200).json({ exists: !!user });
  } catch (err) {
    console.error("MongoDB error:", err);
    return res.status(500).json({ error: "Database error" });
  }
}

