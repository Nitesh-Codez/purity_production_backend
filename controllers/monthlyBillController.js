const db = require("../db");

// =============================
// GET ALL CUSTOMERS MONTHLY BILL
// =============================
exports.getMonthlyBill = async (req, res) => {
  try {
    const { month, year, price_per_kg } = req.query;

    if (!month || !year || !price_per_kg) {
      return res.status(400).json({
        success: false,
        message: "month, year और price_per_kg जरूरी हैं"
      });
    }

    const sql = `
      SELECT 
        u.id AS user_id,
        u.name,

        COALESCE(SUM(m.milk_quantity),0) AS total_milk,

        ROUND(COALESCE(SUM(m.milk_quantity),0) * $3,2) AS total_money

      FROM users u

      LEFT JOIN milk_entries m
        ON u.id = m.user_id
        AND EXTRACT(MONTH FROM m.delivery_date) = $1
        AND EXTRACT(YEAR FROM m.delivery_date) = $2

      WHERE u.role = 'customer'

      GROUP BY u.id, u.name

      ORDER BY u.name
    `;

    const result = await db.query(sql, [month, year, price_per_kg]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error("Get Monthly Bill Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};
// =============================
// SAVE MONEY INTO MONTHLY TOTALS
// =============================
exports.saveMonthlyBillMoney = async (req, res) => {
  try {
    const { month, year, price_per_kg } = req.body;

    if (!month || !year || !price_per_kg) {
      return res.status(400).json({
        success: false,
        message: "month, year और price_per_kg missing हैं"
      });
    }

    // Update money column for each customer in monthly_totals
    const sql = `
      UPDATE monthly_totals mt
      SET money = ROUND(mt.total_quantity * $3, 2),
          updated_at = NOW()
      FROM users u
      WHERE mt.user_id = u.id
        AND mt.month = $1
        AND mt.year = $2
        AND u.role = 'customer'
      RETURNING mt.user_id, u.name, mt.total_quantity, mt.money;
    `;

    const result = await db.query(sql, [month, year, price_per_kg]);

    res.json({
      success: true,
      message: "Monthly bill money updated successfully",
      data: result.rows
    });

  } catch (error) {
    console.error("Save Monthly Bill Money Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};



// SUMMARY CARD DATA
exports.getMonthlySummary = async (req, res) => {
  try {

    const { month, year } = req.query;

    const sql = `
      SELECT 
        u.id,
        u.name,

        COALESCE(SUM(m.milk_quantity),0) AS total_milk,

        COUNT(
          CASE WHEN m.milk_quantity = 0 THEN 1 END
        ) AS total_naga,

        ROUND(COALESCE(SUM(m.milk_quantity),0) * 80,2) AS total_money

      FROM users u

      LEFT JOIN milk_entries m
        ON u.id = m.user_id
        AND EXTRACT(MONTH FROM m.delivery_date) = $1
        AND EXTRACT(YEAR FROM m.delivery_date) = $2

      WHERE u.role = 'customer'

      GROUP BY u.id, u.name

      ORDER BY u.name
    `;

    const result = await db.query(sql, [month, year]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
//Get monthly details for a single customer
// Get monthly details for a single customer
exports.getMonthlyDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    // यहाँ हमने GROUP BY का उपयोग किया है ताकि एक तारीख की एक ही रो आए
    const result = await db.query(
      `SELECT 
          me.delivery_date, 
          u.name, 
          u.daily_milk as daily_limit,
          SUM(me.daily_milk) AS milk_quantity -- यहाँ सारा दूध जोड़ दिया
       FROM milk_entries me
       JOIN users u ON u.id = me.user_id
       WHERE me.user_id = $1
         AND EXTRACT(MONTH FROM me.delivery_date) = $2
         AND EXTRACT(YEAR FROM me.delivery_date) = $3
       GROUP BY me.delivery_date, u.name, u.daily_milk
       ORDER BY me.delivery_date ASC`,
      [userId, month, year]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Detail Fetch Error:", err);
    res.status(500).json({ error: "Server Error" });
  }
};

// controllers/dashboardController.js
exports.getMilkCards = async (req, res) => {
  try {
    const { month, year } = req.query;

    // Validate inputs to prevent crashes
    if (!month || !year) {
      return res.status(400).json({ message: "Month and Year are required" });
    }

    const result = await pool.query(
      `
      SELECT 
        u.name,
        u.id as user_id,
        $1::integer AS month,
        $2::integer AS year,
        COALESCE(SUM(me.milk_quantity), 0) AS total_milk,
        COUNT(CASE WHEN me.milk_quantity = 0 THEN 1 END) AS naga_days,
        COALESCE(MAX(mt.money), 0) AS total_money,
        COALESCE(MAX(mt.money), 0) AS bill_total
      FROM users u
      LEFT JOIN milk_entries me 
        ON u.id = me.user_id 
        AND EXTRACT(MONTH FROM me.delivery_date) = $1
        AND EXTRACT(YEAR FROM me.delivery_date) = $2
      LEFT JOIN monthly_totals mt 
        ON u.id = mt.user_id 
        AND mt.month = $1 
        AND mt.year = $2
      WHERE u.role = 'customer'
      -- Yahan sirf u.name aur u.id kafi hai agar aggregates sahi lage ho
      GROUP BY u.id, u.name
      ORDER BY u.name
      `,
      [parseInt(month), parseInt(year)]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Query Error Details:", error); // Check your Render/Terminal logs for this!
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};