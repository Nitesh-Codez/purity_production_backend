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




//=======================================================================
//CHECK MILK AND BILL
//=======================================================================

/// ======================================================
// GET MONTHLY MILK RECORD
// GET /api/milk/monthly/:userId?month=5&year=2026
// ======================================================
exports.getMonthlyMilkRecord = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      });
    }

    const selectedMonth = Number(month);
    const selectedYear = Number(year);

    if (
      isNaN(selectedMonth) ||
      selectedMonth < 1 ||
      selectedMonth > 12
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid month",
      });
    }

    if (isNaN(selectedYear)) {
      return res.status(400).json({
        success: false,
        message: "Invalid year",
      });
    }

    const sql = `
      SELECT
        id,
        user_id,
        milk_quantity,
        delivery_date,
        created_at
      FROM milk_entries
      WHERE user_id = $1
        AND EXTRACT(MONTH FROM delivery_date) = $2
        AND EXTRACT(YEAR FROM delivery_date) = $3
      ORDER BY delivery_date ASC
    `;

    const result = await db.query(sql, [
      userId,
      selectedMonth,
      selectedYear
    ]);

    return res.status(200).json({
      success: true,
      user_id: Number(userId),
      month: selectedMonth,
      year: selectedYear,
      total_entries: result.rows.length,
      data: result.rows,
    });

  } catch (error) {
    console.error("Monthly milk record error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch monthly milk record",
      error: error.message,
    });
  }
};


// ======================================================
// GET MONTHLY BILL
// GET /api/milk/bill/:userId?month=5&year=2026
// ======================================================
exports.getMonthlyBill = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      });
    }

    const selectedMonth = Number(month);
    const selectedYear = Number(year);

    if (
      isNaN(selectedMonth) ||
      selectedMonth < 1 ||
      selectedMonth > 12
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid month",
      });
    }

    if (isNaN(selectedYear)) {
      return res.status(400).json({
        success: false,
        message: "Invalid year",
      });
    }

    // ---------------------------------------------
    // Get customer details
    // ---------------------------------------------

    const customerSql = `
      SELECT
        id,
        name,
        mobile,
        address,
        joining_date,
        default_milk_quantity,
        daily_milk,
        shift
      FROM users
      WHERE id = $1
        AND role = 'customer'
    `;

    const customerResult = await db.query(customerSql, [userId]);

    if (customerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const customer = customerResult.rows[0];

    // ---------------------------------------------
    // Get monthly total
    // ---------------------------------------------

    const totalSql = `
      SELECT
        id,
        user_id,
        month,
        year,
        total_quantity,
        money,
        updated_at
      FROM monthly_totals
      WHERE user_id = $1
        AND month = $2
        AND year = $3
      LIMIT 1
    `;

    const totalResult = await db.query(totalSql, [
      userId,
      selectedMonth,
      selectedYear
    ]);

    // ---------------------------------------------
    // If monthly total exists
    // ---------------------------------------------

    if (totalResult.rows.length > 0) {
      const bill = totalResult.rows[0];

      return res.status(200).json({
        success: true,

        customer: {
          id: customer.id,
          name: customer.name,
          mobile: customer.mobile,
          address: customer.address,
          joining_date: customer.joining_date,
          shift: customer.shift,
          default_milk_quantity: customer.default_milk_quantity,
          daily_milk: customer.daily_milk,
        },

        bill: {
          month: bill.month,
          year: bill.year,
          total_milk: Number(bill.total_quantity || 0),
          total_bill: Number(bill.money || 0),
          updated_at: bill.updated_at,
        },
      });
    }

    // ---------------------------------------------
    // If monthly total doesn't exist
    // Calculate total directly from milk_entries
    // ---------------------------------------------

    const milkSql = `
      SELECT
        COALESCE(SUM(milk_quantity), 0) AS total_quantity
      FROM milk_entries
      WHERE user_id = $1
        AND EXTRACT(MONTH FROM delivery_date) = $2
        AND EXTRACT(YEAR FROM delivery_date) = $3
    `;

    const milkResult = await db.query(milkSql, [
      userId,
      selectedMonth,
      selectedYear
    ]);

    const totalMilk = Number(
      milkResult.rows[0]?.total_quantity || 0
    );

    return res.status(200).json({
      success: true,

      customer: {
        id: customer.id,
        name: customer.name,
        mobile: customer.mobile,
        address: customer.address,
        joining_date: customer.joining_date,
        shift: customer.shift,
        default_milk_quantity: customer.default_milk_quantity,
        daily_milk: customer.daily_milk,
      },

      bill: {
        month: selectedMonth,
        year: selectedYear,
        total_milk: totalMilk,
        total_bill: 0,
        source: "milk_entries",
        message:
          "Monthly total found from milk entries. Bill amount is not available in monthly_totals.",
      },
    });

  } catch (error) {
    console.error("Monthly bill error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch monthly bill",
      error: error.message,
    });
  }
};