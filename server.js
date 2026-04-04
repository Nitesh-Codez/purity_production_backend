const express = require("express");
const cors = require("cors");

const authRoute = require("./routes/authRoute");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/", authRoute);

const PORT = 5000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});