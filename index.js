const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("level-2");
    const collection = db.collection("relief-users");
    const reliefData = db.collection("relief-management");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await collection.insertOne({ name, email, password: hashedPassword });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await collection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      console.log(user);
      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.EXPIRES_IN,
      });

      res.json({
        success: true,
        message: "Login successful",
        token,
        email,
      });
    });

    // donation data
    app.get("/api/v1", async (req, res) => {
      res.send("Server is running..");
    });

    app.get("/api/v1/reliefs", async (req, res) => {
      const query = {};
      const result = await reliefData.find().limit(6).toArray(query);
      res.send(result);
    });

    app.get("/api/v1/relief-goods", async (req, res) => {
      const query = {};
      const result = await reliefData.find().toArray(query);
      res.send(result);
    });

    app.get("/api/v1/relief-goods/:id", async (req, res) => {
      const ids = req.params.id;
      const query = { _id: new ObjectId(ids) };
      const result = await reliefData.findOne(query);
      res.send(result);
    });

    app.post("/api/v1/relief-goods", async (req, res) => {
      const query = req.body;
      const result = await reliefData.insertOne(query);
      res.send(result);
    });

    app.put("/api/v1/relief-goods/:id", async (req, res) => {
      const ids = req.params.id;
      const query = { _id: new ObjectId(ids) };
      const data = req.body;
      const options = { upsert: true };
      const updateData = {
        $set: {
          title: data.title,
          categori: data.categori,
          amount: data.amount,
          image: data.image,
          description: data.description,
        },
      };
      const result = await reliefData.updateOne(query, updateData, options);
      res.send(result);
    });

    app.delete("/api/v1/relief-goods/:id", async (req, res) => {
      const ids = req.params.id;
      const query = { _id: new ObjectId(ids) };
      const result = await reliefData.deleteOne(query);
      res.send(result);
    });

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
