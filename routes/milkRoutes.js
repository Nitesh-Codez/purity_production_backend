const express = require("express");
const router = express.Router();
const milkController = require("../controllers/milkController");

router.get("/customers", milkController.getCustomers);

//daily milk status 
router.get("/daily-report", milkController.getDailyMilkReport);
router.post("/save-entry", milkController.addMilkEntry);

module.exports = router;