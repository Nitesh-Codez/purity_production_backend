const db = require("../db");

exports.login = async (req, res) => {

  try {

    const { name } = req.body;

    const query = `
      SELECT name, role
      FROM users
      WHERE name = $1
    `;

    const result = await db.query(query, [name]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const user = result.rows[0];

    res.json({
      name: user.name,
      role: user.role
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server error"
    });

  }

};