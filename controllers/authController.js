const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getPool } = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret";

/**
 * Generate JWT token
 */
function signToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
}

/**
 * Convert DB user to safe response object
 */
function publicUser(user) {
  return {
    id: user.id,
    name: user.name || `${user.first_name || ""} ${user.last_name || ""}`.trim(),
    email: user.email,
  };
}

/**
 * Register user
 */
async function register(req, res) {
  try {
    const pool = getPool();
    const { name, email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    // check if user exists
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (existing.length) {
      return res.status(409).json({
        message: "An account with that email already exists.",
      });
    }

    // hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // split name safely
    const parts = name.trim().split(" ");
    const firstName = parts.shift();
    const lastName = parts.join(" ") || "";

    // insert user
    const [result] = await pool.query(
      "INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)",
      [firstName, lastName, normalizedEmail, passwordHash]
    );

    const user = {
      id: result.insertId,
      first_name: firstName,
      last_name: lastName,
      email: normalizedEmail,
    };

    // session support (if used)
    if (req.session) {
      req.session.userId = user.id;
    }

    return res.status(201).json({
      message: "Account created successfully.",
      token: signToken(user),
      user: publicUser(user),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error during registration" });
  }
}

/**
 * Login user
 */
async function login(req, res) {
  try {
    const pool = getPool();
    const { email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    const [rows] = await pool.query(
      "SELECT id, first_name, last_name, email, password_hash FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = rows[0];

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (req.session) {
      req.session.userId = user.id;
    }

    return res.json({
      message: "Logged in successfully.",
      token: signToken(user),
      user: publicUser(user),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error during login" });
  }
}

/**
 * Logout user
 */
function logout(req, res) {
  if (!req.session) {
    return res.status(200).json({ message: "Logged out successfully." });
  }

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Unable to log out." });
    }

    res.clearCookie("connect.sid");
    return res.json({ message: "Logged out successfully." });
  });
}

module.exports = {
  register,
  login,
  logout,
};