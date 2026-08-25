const express = require("express");
const { MongoClient } = require("mongodb");

const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/notes";

const app = express();
app.use(express.json());

let notes;

async function connectDb() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  notes = client.db().collection("notes");
  console.log("Connected to MongoDB");
}

app.get("/", (_req, res) => {
  res.json({
    message: "Notes API is running",
    endpoints: {
      "GET /health": "Health check",
      "GET /notes": "List notes",
      "POST /notes": "Create a note { text }",
    },
  });
});

app.get("/health", async (_req, res) => {
  try {
    await notes.estimatedDocumentCount();
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(503).json({ status: "error", db: err.message });
  }
});

app.get("/notes", async (_req, res) => {
  const items = await notes.find({}).sort({ createdAt: -1 }).toArray();
  res.json(items);
});

app.post("/notes", async (req, res) => {
  const text = req.body?.text;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Body must include string field 'text'" });
  }

  const doc = { text, createdAt: new Date() };
  const result = await notes.insertOne(doc);
  res.status(201).json({ _id: result.insertedId, ...doc });
});

async function start() {
  await connectDb();
  app.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
