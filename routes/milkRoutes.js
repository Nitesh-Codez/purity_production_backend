const express = require("express");
const router = express.Router();
const milkController = require("../controllers/milkController");

router.get("/customers", milkController.getCustomers);

router.post("/milk-entry", milkController.addMilkEntry);

module.exports = router;