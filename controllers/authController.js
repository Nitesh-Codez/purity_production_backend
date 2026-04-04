const db = require("../db");

exports.login = async (req, res) => {
  const { name } = req.body;

  try {

    const result = await db.query(
      "SELECT * FROM users WHERE name = $1",
      [name]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      name: user.name,
      role: user.role
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
};