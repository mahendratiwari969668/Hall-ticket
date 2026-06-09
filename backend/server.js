require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const HallTicket = require("./models/HallTicket");
const hallTicketRoutes = require("./routes/hallTicket");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is missing. Add it to backend/.env before starting the server.");
  process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", hallTicketRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

async function dropLegacySingleTicketIndex() {
  try {
    await HallTicket.collection.dropIndex("ticketKey_1");
  } catch (error) {
    const indexWasAlreadyAbsent = error.code === 27 || error.codeName === "IndexNotFound";

    if (!indexWasAlreadyAbsent) {
      console.warn("Could not remove legacy ticketKey index:", error.message);
    }
  }
}

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    await dropLegacySingleTicketIndex();

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await mongoose.connection.close();
  process.exit(0);
});

startServer();
