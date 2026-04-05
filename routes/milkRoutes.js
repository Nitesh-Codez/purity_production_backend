const express = require("express");
const router = express.Router();
const milkController = require("../controllers/milkController");

router.get("/customers", milkController.getCustomers);

router.post("/milk-entry", milkController.addMilkEntry);

//daily milk status 
router.get("/daily-report", milkController.getDailyMilkReport);

module.exports = router;