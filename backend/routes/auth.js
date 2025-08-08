// backend/routes/auth.js
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pg from "pg";

const router = Router();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const ROUNDS = 10;

/* ----------  SIGN‑UP  ---------- */
router.post("/signup", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Missing fields" });

  try {
    const hash = await bcrypt.hash(password, ROUNDS);
    const { rows } = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1,$2) RETURNING id",
      [email, hash]
    );
    const token = jwt.sign({ id: rows[0].id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.json({ token });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Email exists" });
    console.error(err);
    res.status(500).send("signup failed");
  }
});

/* ----------  LOGIN  ---------- */
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Missing fields" });

  const { rows } = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error: "Bad creds" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Bad creds" });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "30d" });
  res.json({ token });
});

export default router;
