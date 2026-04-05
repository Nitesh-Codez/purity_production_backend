const db = require("../db");

// GET ALL CUSTOMERS
exports.getCustomers = async (req, res) => {
  try {

    const sql = `
      SELECT id, name
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
    console.error(error);
    res.status(500).json({ success: false });
  }
};


// ADD MILK ENTRY
exports.addMilkEntry = async (req, res) => {
  try {

    const { user_id, milk_quantity } = req.body;

    const sql = `
      INSERT INTO milk_entries (user_id, milk_quantity)
      VALUES ($1,$2)
      RETURNING *
    `;

    const result = await db.query(sql,[user_id,milk_quantity]);

    res.json({
      success:true,
      data:result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success:false });
  }
};



export const getDailyMilkReport = async (req, res) => {
  try {
    const { date } = req.query; // तारीख Query Params से आएगी (YYYY-MM-DD)

    if (!date) {
      return res.status(400).json({ success: false, message: "Date is required" });
    }

    // SQL Query: Users की डिटेल्स और उस Date का Milk Status
    // मान लेते हैं तुम्हारी अटेंडेंस/लॉग टेबल का नाम 'milk_records' है
    const query = `
      SELECT 
        u.id, 
        u.name, 
        u.daily_milk AS default_milk,
        COALESCE(m.quantity, u.daily_milk) AS actual_milk,
        COALESCE(m.status, 'pending') AS delivery_status
      FROM users u
      LEFT JOIN milk_records m ON u.id = m.user_id AND m.delivery_date = $1
      ORDER BY u.name ASC;
    `;

    const result = await pool.query(query, [date]);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    console.error("Error fetching daily report:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

//
exports.addMilkEntry = async (req, res) => {
  try {
    const { user_id, milk_quantity, delivery_date } = req.body;

    // बेसिक वैलिडेशन
    if (!user_id || milk_quantity === undefined || !delivery_date) {
      return res.status(400).json({ 
        success: false, 
        message: "user_id, quantity और date ज़रूरी हैं!" 
      });
    }
    const sql = `
      INSERT INTO milk_entries (user_id, milk_quantity, delivery_date)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, delivery_date) 
      DO UPDATE SET milk_quantity = EXCLUDED.milk_quantity
      RETURNING *
    `;

    const result = await db.query(sql, [user_id, milk_quantity, delivery_date]);

    res.status(200).json({
      success: true,
      message: "Entry Saved Successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Milk Entry Error:", error);
    res.status(500).json({ 
      success: false, 
      error: "सर्वर एरर: एंट्री सेव नहीं हो पाई" 
    });
  }
};