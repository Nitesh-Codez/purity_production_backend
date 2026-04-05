// server.js (Clean Version)
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const milkRoutes = require("./routes/milkRoutes");
const monthlyBillRoutes = require("./routes/monthlyBillRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/", authRoutes);
app.use("/api", customerRoutes); 
app.use("/api", milkRoutes);
app.use("/api",monthlyBillRoutes);

app.get("/", (req, res) => res.send("API Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Port ${PORT}`));