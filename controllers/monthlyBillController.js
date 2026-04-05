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

    // Fetch monthly totals
    const sql = `
      SELECT 
        u.id AS user_id,
        u.name,
        COALESCE(mt.total_quantity, 0) AS total_milk,
        ROUND(COALESCE(mt.total_quantity, 0) * $3, 2) AS total_money
      FROM users u
      LEFT JOIN monthly_totals mt
        ON u.id = mt.user_id
        AND mt.month = $1
        AND mt.year = $2
      WHERE u.role = 'customer'
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

    const resData = await db.query(
      `SELECT u.id, u.name,
              SUM(m.daily_milk) AS total_milk,
              COUNT(*) FILTER (WHERE m.daily_milk = 0) AS total_naga,
              COALESCE(mt.money, SUM(m.daily_milk) * 80) AS total_money
       FROM users u
       LEFT JOIN milk_entries m
         ON u.id = m.user_id
         AND EXTRACT(MONTH FROM m.delivery_date) = $1
         AND EXTRACT(YEAR FROM m.delivery_date) = $2
       LEFT JOIN monthly_totals mt
         ON u.id = mt.user_id AND mt.month = $1 AND mt.year = $2
       WHERE u.role = 'customer'
       GROUP BY u.id, u.name, mt.money
       ORDER BY u.name`,
      [month, year]
    );

    return res.json(resData.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// DETAILED VIEW FOR A CUSTOMER
exports.getMonthlyDetails = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { month, year } = req.query;

    // fetch user info
    const userRes = await db.query(
      "SELECT id, name, default_milk_quantity FROM users WHERE id=$1",
      [userId]
    );
    if (userRes.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    // fetch milk entries
    const milkRes = await db.query(
      `SELECT delivery_date, daily_milk, default_milk_quantity,
              CASE WHEN daily_milk < default_milk_quantity THEN TRUE ELSE FALSE END AS is_naga
       FROM milk_entries
       WHERE user_id=$1 AND EXTRACT(MONTH FROM delivery_date) = $2 AND EXTRACT(YEAR FROM delivery_date) = $3
       ORDER BY delivery_date`,
      [userId, month, year]
    );

    return res.json({
      user: userRes.rows[0],
      entries: milkRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};