const express = require("express");
const router = express.Router();
const monthlyBillController = require("../controllers/monthlyBillController");

// GET monthly bill (calculate total_money on fly using price_per_kg)
router.get("/", monthlyBillController.getMonthlyBill);

// POST to save money column in DB
router.post("/save", monthlyBillController.saveMonthlyBillMoney);

router.get("/details/:userId", getMonthlyDetails);




module.exports = router;