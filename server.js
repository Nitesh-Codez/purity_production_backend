// server.js (Clean Version)

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const milkRoutes = require("./routes/milkRoutes");
const monthlyBillRoutes = require("./routes/monthlyBillRoutes");

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://purity-production.vercel.app"
  ],
  credentials: true
}));

app.use(express.json());

// Routes
app.use("/", authRoutes);
app.use("/api", customerRoutes);
app.use("/api", milkRoutes);
app.use("/api/monthly-bill", monthlyBillRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});