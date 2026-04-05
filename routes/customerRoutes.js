const express = require("express");
const router = express.Router();
const translate = require("google-translate-api-x"); // यहाँ इम्पोर्ट करें
const customerController = require("../controllers/customerController");

// --- TRANSLATION ROUTE ---
router.post("/translate-list", async (req, res) => {
  try {
    const { texts, targetLang } = req.body;
    if (!texts || !Array.isArray(texts)) return res.status(400).json({ error: "Required" });

    const translations = await Promise.all(
      texts.map(async (text) => {
        try {
          const result = await translate(text, { to: targetLang || "hi" });
          return { original: text, translated: result.text };
        } catch (err) {
          return { original: text, translated: text };
        }
      })
    );

    const translationMap = {};
    translations.forEach(item => translationMap[item.original] = item.translated);
    res.json(translationMap);
  } catch (error) {
    res.status(500).json({ error: "failed" });
  }
});

// Rest Ro
router.post("/add-customer", customerController.addCustomer);
router.delete("/delete-customer/:id", customerController.deleteCustomer);
router.put("/update-customer/:id", customerController.updateCustomer);
router.get("/customers", customerController.getAllCustomers);

module.exports = router;