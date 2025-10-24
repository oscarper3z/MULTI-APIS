import express from "express";
import cors from "cors";
import { pool } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4001;

// Health DB
app.get("/db/health", async (_req, res) => {
  try {
    const r = await pool.query("SELECT 1 AS ok");
    res.json({ ok: r.rows[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Crear usuario
app.post("/users", async (req, res) => {
  const { name, email } = req.body ?? {};
  if (!name || !email) return res.status(400).json({ error: "name & email required" });

  try {
    const r = await pool.query(
      "INSERT INTO users_schema.users(name, email) VALUES($1, $2) RETURNING id, name, email",
      [name, email]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "insert failed", detail: String(e) });
  }
});

// Listar usuarios
app.get("/users", async (_req, res) => {
  try {
    const r = await pool.query("SELECT id, name, email FROM users_schema.users ORDER BY id ASC");
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: "query failed", detail: String(e) });
  }
});

// Obtener un usuario por ID
app.get("/users/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const r = await pool.query("SELECT id, name, email FROM users_schema.users WHERE id = $1", [id]);
    if (r.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "query failed", detail: String(e) });
  }
});

// Editar usuario por ID
app.put("/users/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, email } = req.body ?? {};
  if (!name && !email) return res.status(400).json({ error: "nothing to update" });

  try {
    const r = await pool.query(
      "UPDATE users_schema.users SET name = COALESCE($1, name), email = COALESCE($2, email) WHERE id = $3 RETURNING id, name, email",
      [name, email, id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "update failed", detail: String(e) });
  }
});

// Eliminar usuario por ID
app.delete("/users/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const r = await pool.query(
      "DELETE FROM users_schema.users WHERE id = $1 RETURNING id, name, email",
      [id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted", user: r.rows[0] });
  } catch (e) {
    res.status(500).json({ error: "delete failed", detail: String(e) });
  }
});

// Health service
app.get("/health", (_req, res) => res.json({ status: "Ok", service: "users-api v3" }));

app.listen(PORT, () => console.log(`✅ users-api on http://localhost:${PORT}`));

