const express = require("express");
const router = express.Router();
const axios = require("axios"); // axios इम्पोर्ट करें
const customerController = require("../controllers/customerController");

// --- CORRECT TRANSLITERATION ROUTE (Names stay as Names) ---
router.post("/translate-list", async (req, res) => {
  try {
    const { texts } = req.body;
    if (!texts || !Array.isArray(texts)) return res.status(400).json({ error: "Required" });

    const translationMap = {};

    await Promise.all(
      texts.map(async (text) => {
        try {
          // Google Input Tools API जो 'Honey' को 'हनी' बनाएगी, 'शहद' नहीं
          const response = await axios.get(
            `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=hi-t-i0-und&num=1`
          );
          
          if (response.data && response.data[0] === "SUCCESS") {
            // response.data[1][0][1][0] में असली हिंदी नाम होता है
            translationMap[text] = response.data[1][0][1][0];
          } else {
            translationMap[text] = text;
          }
        } catch (err) {
          translationMap[text] = text;
        }
      })
    );

    res.json(translationMap);
  } catch (error) {
    console.error("Transliteration Error:", error);
    res.status(500).json({ error: "failed" });
  }
});

// बाकी पुराने रूट्स
router.post("/add-customer", customerController.addCustomer);
router.delete("/delete-customer/:id", customerController.deleteCustomer);
router.put("/update-customer/:id", customerController.updateCustomer);
router.get("/customers", customerController.getAllCustomers);


// =============================
// CUSTOMER TODAY MILK
// =============================
router.get(
  "/customer/today-milk", customerController.getCustomerTodayMilk
);

// =============================
// CUSTOMER CURRENT MONTH LIST
// =============================
router.get(
  "/customer/current-month", customerController.getCustomerCurrentMonth
);


//=====================================================================
//customer side
//=======================================================
// Customer ki monthly list dekhne ka route
router.get("/monthly-bill/customer/:userId/milk", customerController.getMyMonthlyMilk);

module.exports = router;