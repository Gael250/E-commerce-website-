require("dotenv").config();

const express = require("express");
const session = require("express-session");
const cors = require("cors");
const bcrypt = require("bcrypt");

const db = require("./config/db");

const app = express();
const port = process.env.PORT || 3000;

// =====================
// MIDDLEWARE
// =====================
app.use(cors());
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secretkey",
    resave: false,
    saveUninitialized: true,
  })
);

// =====================
// TEST ROUTE
// =====================
app.get("/", (req, res) => {
  res.send("WhatsApp Shop API is running...");
});

// =====================
// USERS ROUTES
// =====================

// ✅ CREATE USER (REGISTER)
app.post("/users", async (req, res) => {
  const { name, phone, email, password } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({ message: "Name, phone and password are required" });
  }

  try {
    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (name, phone, email, password) VALUES (?, ?, ?, ?)",
      [name, phone, email, hashedPassword],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.status(201).json({
          message: "User registered successfully",
          userId: result.insertId,
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ LOGIN USER
app.post("/login", (req, res) => {
  const { phone, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE phone = ?",
    [phone],
    async (err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = results[0];

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // store session
      req.session.user = user;

      res.status(200).json({
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
      });
    }
  );
});

// ✅ GET ALL USERS
app.get("/users", (req, res) => {
  db.query("SELECT id, name, phone, email, role, created_at FROM users", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    res.status(200).json(result);
  });
});

// ✅ GET SINGLE USER
app.get("/users/:id", (req, res) => {
  db.query(
    "SELECT id, name, phone, email, role, created_at FROM users WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      res.status(200).json(result[0]);
    }
  );
});

// ✅ UPDATE USER
app.put("/users/:id", (req, res) => {
  const { name, phone, email } = req.body;

  db.query(
    "UPDATE users SET name=?, phone=?, email=? WHERE id=?",
    [name, phone, email, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      res.status(200).json({ message: "User updated successfully" });
    }
  );
});

// ✅ DELETE USER
app.delete("/users/:id", (req, res) => {
  db.query(
    "DELETE FROM users WHERE id=?",
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      res.status(200).json({ message: "User deleted successfully" });
    }
  );
});

// =====================
// START SERVER
// =====================
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});