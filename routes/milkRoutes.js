const express = require("express");
const router = express.Router();

const milkController = require("../controllers/milkController");


// GET CUSTOMERS
router.get("/customers", milkController.getCustomers);


// ADD MILK ENTRY
router.post("/milk-entry", milkController.addMilkEntry);


// DAILY REPORT
router.get("/daily-report", milkController.getDailyMilkReport);

//
router.post("/save-entry", milkController.addMilkEntry);
//monthly Entries 

// MONTHLY REPORT
router.get("/monthly-entries", milkController.getMonthlyEntries);

//
router.post("/save-monthly-total", milkController.saveMonthlyTotals);



router.get("/today/:customer_id", milkController.getTodayMilk);

// 📌 Monthly milk (filter via query)
router.get("/monthly/:customer_id", milkController.getMonthlyMilk);


module.exports = router;