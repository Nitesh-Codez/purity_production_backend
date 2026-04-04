const db = require("../db");

exports.addCustomer = async (req, res) => {
  try {

    const { name, mobile, address, joining_date } = req.body;

    const sql = `
      INSERT INTO users (name, role, mobile, address, joining_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [name, "customer", mobile, address, joining_date];

    const result = await db.query(sql, values);

    res.json({
      message: "Customer Added Successfully",
      data: result.rows[0]
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server Error"
    });

  }
};