import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { pool } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4002;
const SERVICE = process.env.SERVICE_NAME || "products-api";
const USERS_API_URL = process.env.USERS_API_URL || "http://users-api:4001";

// Health service (general)
app.get("/health", (_req, res) => res.json({ status: "ok", service: SERVICE }));

// Health DB - prueba conexión a PostgreSQL
app.get("/db/health", async (_req, res) => {
  try {
    const r = await pool.query("SELECT 1 AS ok");
    res.json({ ok: r.rows[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Crear producto
app.post("/products", async (req, res) => {
  const { name, price } = req.body ?? {};
  if (!name || !price) return res.status(400).json({ error: "name & price required" });

  try {
    const r = await pool.query(
      "INSERT INTO products_schema.products(name, price) VALUES($1, $2) RETURNING id, name, price",
      [name, price]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "insert failed", detail: String(e) });
  }
});

// Listar productos
app.get("/products", async (_req, res) => {
  try {
    const r = await pool.query("SELECT id, name, price FROM products_schema.products ORDER BY id ASC");
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: "query failed", detail: String(e) });
  }
});

// Obtener un producto por ID
app.get("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const r = await pool.query("SELECT id, name, price FROM products_schema.products WHERE id = $1", [id]);
    if (r.rows.length === 0) return res.status(404).json({ error: "Product not found" });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "query failed", detail: String(e) });
  }
});

// Editar producto
app.put("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, price } = req.body ?? {};
  if (!name && !price) return res.status(400).json({ error: "nothing to update" });

  try {
    const r = await pool.query(
      "UPDATE products_schema.products SET name = COALESCE($1, name), price = COALESCE($2, price) WHERE id = $3 RETURNING id, name, price",
      [name, price, id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: "Product not found" });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "update failed", detail: String(e) });
  }
});

// Eliminar producto
app.delete("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const r = await pool.query(
      "DELETE FROM products_schema.products WHERE id = $1 RETURNING id, name, price",
      [id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted", product: r.rows[0] });
  } catch (e) {
    res.status(500).json({ error: "delete failed", detail: String(e) });
  }
});

// Endpoint combinado: productos + cantidad de usuarios desde users-api
app.get("/products/with-users", async (_req, res) => {
  try {
    const products = await pool.query("SELECT id, name, price FROM products_schema.products ORDER BY id ASC");
    const r = await fetch(`${USERS_API_URL}/users`);
    const users = await r.json();

    res.json({
      products: products.rows,
      usersCount: Array.isArray(users) ? users.length : 0
    });
  } catch (e) {
    res.status(502).json({ error: "No se pudo consultar users-api", detail: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`✅ ${SERVICE} listening on http://localhost:${PORT}`);
  console.log(`↔️  USERS_API_URL=${USERS_API_URL}`);
});