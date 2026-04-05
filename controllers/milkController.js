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