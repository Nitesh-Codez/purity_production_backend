const db = require("../db");

// 1️⃣ Add Customer (Already Provided)
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
    res.status(500).json({ message: "Server Error" });
  }
};

// 2️⃣ Delete Customer
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `DELETE FROM users WHERE id = $1 RETURNING *`;
    const result = await db.query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Customer Not Found" });
    }

    res.json({ message: "Customer Deleted Successfully", data: result.rows[0] });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 3️⃣ Update Customer
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobile, address } = req.body;

    const sql = `
      UPDATE users
      SET name = $1, mobile = $2, address = $3
      WHERE id = $4
      RETURNING *
    `;

    const values = [name, mobile, address, id];
    const result = await db.query(sql, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Customer Not Found" });
    }

    res.json({ message: "Customer Updated Successfully", data: result.rows[0] });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// GET ALL CUSTOMERS//
// 4️⃣ Get All Customers
exports.getAllCustomers = async (req, res) => {
  try {
    const sql = `SELECT * FROM users WHERE role = 'customer' ORDER BY id DESC`;
    const result = await db.query(sql);

    res.json({ 
      message: "Customers Fetched Successfully", 
      data: result.rows 
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};