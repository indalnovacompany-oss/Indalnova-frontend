import { MongoClient } from "mongodb";

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
      return res.status(200).json({ exists: false });
    }

    const client = await clientPromise;
    const db = client.db("test");           // DB name
    const users = db.collection("users");   // collection name

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


