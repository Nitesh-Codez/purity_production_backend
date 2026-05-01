const db = require("../db");

// 1️⃣ Add Customer (Already Provided)
exports.addCustomer = async (req, res) => {
  try {
    const { name, mobile,daily_milk, address, joining_date } = req.body;

    const sql = `
      INSERT INTO users (name, role, mobile,daily_milk, address, joining_date)
      VALUES ($1, $2, $3, $4, $5,$6)
      RETURNING *
    `;

    const values = [name, "customer", mobile,daily_milk, address, joining_date];

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
    const { name, mobile,daily_milk, address } = req.body;

    const sql = `
      UPDATE users
      SET name = $1, mobile = $2, daily_milk = $3, address = $4
      WHERE id = $5
      RETURNING *
    `;

    const values = [name, mobile,daily_milk, address, id];
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



//================================================================//
//Customer controllers//
//=================================================================================//

// ===============================
// CUSTOMER TODAY MILK
// ===============================
exports.getCustomerTodayMilk = async (req, res) => {

  try {

    const userId = req.user.id;

    const sql = `
      SELECT 
        u.name,
        CURRENT_DATE AS delivery_date,
        COALESCE(m.milk_quantity, u.daily_milk) AS milk_quantity
      FROM users u
      LEFT JOIN milk_entries m
        ON u.id = m.user_id
        AND m.delivery_date = CURRENT_DATE
      WHERE u.id = $1
    `;

    const result = await db.query(sql,[userId]);

    res.json({
      success:true,
      data:result.rows[0]
    });

  } catch (error) {

    res.status(500).json({
      success:false,
      message:"Server error"
    });

  }

};

// ===============================
// CUSTOMER CURRENT MONTH MILK LIST
// ===============================
exports.getCustomerCurrentMonth = async (req, res) => {

  try {

    const userId = req.user.id;

    const sql = `
      SELECT 
        delivery_date,
        milk_quantity
      FROM milk_entries
      WHERE user_id = $1
      AND DATE_TRUNC('month', delivery_date) = DATE_TRUNC('month', CURRENT_DATE)
      ORDER BY delivery_date ASC
    `;

    const result = await db.query(sql, [userId]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }

};




//=====================================================================
//CUSTOMER SIDE 
//======================================================================
// =============================
// GET SINGLE CUSTOMER MONTHLY LIST (DATE + MILK)
// =============================
exports.getMyMonthlyMilk = async (req, res) => {
  try {
    let { userId } = req.params;
    let { month, year } = req.query;

    // Strict number conversion
    const uId = Number(userId);
    const m = Number(month);
    const y = Number(year);

    if (!uId || !m || !y || isNaN(uId) || isNaN(m) || isNaN(y)) {
      return res.status(400).json({
        success: false,
        message: "Valid userId, month aur year required hain"
      });
    }

    // Direct Date filter for high performance
    const sql = `
      SELECT 
        delivery_date AS date,
        COALESCE(milk_quantity, 0) AS milk_quantity
      FROM milk_entries
      WHERE user_id = $1
        AND EXTRACT(MONTH FROM delivery_date) = $2
        AND EXTRACT(YEAR FROM delivery_date) = $3
      ORDER BY delivery_date ASC
    `;

    const result = await db.query(sql, [uId, m, y]);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error("Customer Monthly Milk Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};