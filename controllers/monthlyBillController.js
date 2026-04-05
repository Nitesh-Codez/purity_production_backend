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