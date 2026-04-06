const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getPool } = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret";

function splitName(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || "Customer";
  const lastName = parts.join(" ") || "Account";

  return { firstName, lastName };
}

function signToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name || `${user.first_name} ${user.last_name}`.trim(),
    email: user.email
  };
}

async function register(req, res) {
  const pool = getPool();
  const { name, email, password } = req.body;
  const normalizedEmail = email.toLowerCase();
  const { firstName, lastName } = splitName(name);

  const [existingRows] = await pool.query(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [normalizedEmail]
  );

  if (existingRows.length) {
    return res.status(409).json({ message: "An account with that email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    "INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)",
    [firstName, lastName, normalizedEmail, passwordHash]
  );

  const user = publicUser({
    id: result.insertId,
    first_name: firstName,
    last_name: lastName,
    email: normalizedEmail
  });

  req.session.userId = user.id;

  res.status(201).json({
    message: "Account created successfully.",
    token: signToken(user),
    user
  });
}

async function login(req, res) {
  const pool = getPool();
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase();

  const [rows] = await pool.query(
    "SELECT id, first_name, last_name, email, password_hash FROM users WHERE email = ? LIMIT 1",
    [normalizedEmail]
  );

  if (!rows.length) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const userRecord = rows[0];
  const validPassword = await bcrypt.compare(password, userRecord.password_hash);

  if (!validPassword) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  req.session.userId = userRecord.id;

  res.json({
    message: "Logged in successfully.",
    token: signToken(userRecord),
    user: publicUser(userRecord)
  });
}

function logout(req, res) {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({ message: "Unable to log out right now." });
    }

    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully." });
  });
}

module.exports = {
  register,
  login,
  logout
};
