const pool = require("../config/db");

const lookupUserByEmail = async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const result = await pool.query(
      `SELECT id, name, email, role
       FROM users
       WHERE email = $1
         AND status = 'ACTIVE'
       LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error("User lookup error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  lookupUserByEmail,
};