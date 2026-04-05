const db = require("../db");


// =============================
// GET ALL CUSTOMERS
// =============================
exports.getCustomers = async (req, res) => {
  try {

    const sql = `
      SELECT id, name, mobile, daily_milk
      FROM users
      WHERE role = 'customer'
      ORDER BY name
    `;

    const result = await db.query(sql);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error("Get Customers Error:", error);
    res.status(500).json({ success: false });
  }
};



// =============================
// ADD / UPDATE MILK ENTRY
// =============================
exports.addMilkEntry = async (req, res) => {
  try {

    const { user_id, milk_quantity, delivery_date } = req.body;

    // basic validation
    if (!user_id || milk_quantity === undefined || !delivery_date) {
      return res.status(400).json({
        success: false,
        message: "user_id, milk_quantity और delivery_date जरूरी हैं"
      });
    }

    const sql = `
      INSERT INTO milk_entries (user_id, milk_quantity, delivery_date)
      VALUES ($1,$2,$3)
      ON CONFLICT (user_id, delivery_date)
      DO UPDATE SET milk_quantity = EXCLUDED.milk_quantity
      RETURNING *
    `;

    const result = await db.query(sql, [
      user_id,
      milk_quantity,
      delivery_date
    ]);

    res.json({
      success: true,
      message: "Milk entry saved",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Milk Entry Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};



// =============================
// DAILY MILK REPORT
// =============================
exports.getDailyMilkReport = async (req, res) => {
  try {

    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date required"
      });
    }

    const sql = `
      SELECT 
        u.id,
        u.name,
        u.daily_milk AS default_milk,
        COALESCE(m.milk_quantity, u.daily_milk) AS actual_milk
      FROM users u
      LEFT JOIN milk_entries m
      ON u.id = m.user_id AND m.delivery_date = $1
      WHERE u.role = 'customer'
      ORDER BY u.name
    `;

    const result = await db.query(sql, [date]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error("Daily Report Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

//
// =============================
// MONTHLY MILK ENTRIES
// =============================
exports.getMonthlyEntries = async (req, res) => {
  try {

    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "month और year जरूरी हैं"
      });
    }

    const sql = `
      SELECT 
        u.name,
        m.delivery_date,
        m.milk_quantity
      FROM milk_entries m
      JOIN users u ON u.id = m.user_id
      WHERE u.role = 'customer'
      AND EXTRACT(MONTH FROM m.delivery_date) = $1
      AND EXTRACT(YEAR FROM m.delivery_date) = $2
      ORDER BY m.delivery_date
    `;

    const result = await db.query(sql, [month, year]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error("Monthly Entries Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

// ===========================================
// CALCULATE & SAVE MONTHLY TOTALS (FINAL)
// ===========================================
exports.saveMonthlyTotals = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: "Month/Year missing" });
    }

    const sql = `
      INSERT INTO monthly_totals (user_id, month, year, total_quantity)
      SELECT 
        user_id, 
        $1 AS month, 
        $2 AS year, 
        SUM(CAST(milk_quantity AS DECIMAL)) as total_quantity
      FROM milk_entries
      WHERE EXTRACT(MONTH FROM delivery_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = $1
        AND EXTRACT(YEAR FROM delivery_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = $2
      GROUP BY user_id
      ON CONFLICT (user_id, month, year)
      DO UPDATE SET 
        total_quantity = EXCLUDED.total_quantity,
        updated_at = NOW()
      RETURNING *;
    `;

    const result = await db.query(sql, [month, year]);

    res.json({
      success: true,
      message: "Data Synced",
      data: result.rows
    });

  } catch (error) {
    console.error("Mismatch Error:", error);
    res.status(500).json({ success: false, message: "Check if 'user_id' exists in milk_entries" });
  }
};