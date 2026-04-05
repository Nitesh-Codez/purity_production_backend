require("dotenv").config();
const express = require("express");
const cors = require("cors");
const translate = require("google-translate-api-x");

const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// --- TRANSLATION ROUTE ---
app.post("/api/translate-list", async (req, res) => {
    try {
        const { texts, targetLang } = req.body;
        if (!texts || !Array.isArray(texts)) {
            return res.status(400).json({ error: "Texts array is required" });
        }

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
        translations.forEach((item) => {
            translationMap[item.original] = item.translated;
        });

        res.json(translationMap);
    } catch (error) {
        console.error("Translation Error:", error);
        res.status(500).json({ error: "Translation failed" });
    }
});

// --- OTHER ROUTES ---
app.use("/", authRoutes);
app.use("/api", customerRoutes);

app.get("/", (req, res) => {
    res.send("Purity Production API Running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});