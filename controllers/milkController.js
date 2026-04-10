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
// Controller: monthly totals
exports.saveMonthlyTotals = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: "Month/Year missing" });
    }

    // SQL: All customers, sum milk, handle missing entries
    const sql = `
      INSERT INTO monthly_totals (user_id, month, year, total_quantity)
      SELECT 
        u.id AS user_id,
        $1 AS month,
        $2 AS year,
        COALESCE(SUM(me.milk_quantity), 0) AS total_quantity
      FROM users u
      LEFT JOIN milk_entries me 
        ON u.id = me.user_id
        AND EXTRACT(MONTH FROM me.delivery_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = $1
        AND EXTRACT(YEAR FROM me.delivery_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = $2
      WHERE u.role = 'customer'
      GROUP BY u.id
      ON CONFLICT (user_id, month, year)
      DO UPDATE SET
        total_quantity = EXCLUDED.total_quantity,
        updated_at = NOW()
      RETURNING *;
    `;

    const result = await db.query(sql, [month, year]);

    res.json({
      success: true,
      message: "Monthly totals synced successfully",
      data: result.rows
    });

  } catch (error) {
    console.error("Error saving monthly totals:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};






//===================================================================================
//=================================================================

// ==========================
// GET TODAY MILK
// ==========================
exports.getTodayMilk = async (req, res) => {
  try {
    const { customer_id } = req.params;

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const sql = `
      SELECT *
      FROM milk_entries
      WHERE user_id = $1
      AND delivery_date = $2
    `;

    const result = await db.query(sql, [customer_id, today]);

    return res.json({
      success: true,
      date: today,
      data: result.rows,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching today's milk",
      error: error.message,
    });
  }
};
// ==========================
// GET MONTHLY MILK
// ==========================
exports.getMonthlyMilk = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "month and year are required",
      });
    }

    const sql = `
      SELECT *
      FROM milk_entries
      WHERE customer_id = $1
      AND EXTRACT(MONTH FROM date) = $2
      AND EXTRACT(YEAR FROM date) = $3
      ORDER BY date ASC
    `;

    const result = await db.query(sql, [
      customer_id,
      month,
      year,
    ]);

    return res.json({
      success: true,
      month,
      year,
      data: result.rows,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching monthly milk",
      error: error.message,
    });
  }
};