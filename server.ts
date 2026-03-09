import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import archiver from "archiver";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("finance.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ledgers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT CHECK(type IN ('TOPUP', 'EXPENSE', 'PURCHASE', 'VENDOR_PAYMENT')) NOT NULL,
    source_id INTEGER,
    ledger_id INTEGER,
    vendor_id INTEGER,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    is_credit BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES sources(id),
    FOREIGN KEY (ledger_id) REFERENCES ledgers(id),
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
  );
`);

// Seed initial data if empty
const sourceCount = db.prepare("SELECT COUNT(*) as count FROM sources").get() as { count: number };
if (sourceCount.count === 0) {
  db.prepare("INSERT INTO sources (name) VALUES ('Main Bank Account')").run();
  db.prepare("INSERT INTO sources (name) VALUES ('Corporate Card')").run();
}

const ledgerCount = db.prepare("SELECT COUNT(*) as count FROM ledgers").get() as { count: number };
if (ledgerCount.count === 0) {
  db.prepare("INSERT INTO ledgers (name) VALUES ('Software Subscriptions')").run();
  db.prepare("INSERT INTO ledgers (name) VALUES ('Travel & Meals')").run();
  db.prepare("INSERT INTO ledgers (name) VALUES ('Office Supplies')").run();
}

const vendorCount = db.prepare("SELECT COUNT(*) as count FROM vendors").get() as { count: number };
if (vendorCount.count === 0) {
  db.prepare("INSERT INTO vendors (name) VALUES ('AWS')").run();
  db.prepare("INSERT INTO vendors (name) VALUES ('WeWork')").run();
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Sources
  app.get("/api/sources", (req, res) => {
    const sources = db.prepare(`
      SELECT 
        s.*,
        (
          COALESCE((SELECT SUM(amount) FROM transactions WHERE source_id = s.id AND type = 'TOPUP'), 0) -
          COALESCE((SELECT SUM(amount) FROM transactions WHERE source_id = s.id AND type IN ('EXPENSE', 'PURCHASE', 'VENDOR_PAYMENT')), 0)
        ) as balance
      FROM sources s
    `).all();
    res.json(sources);
  });

  app.post("/api/sources", (req, res) => {
    const { name } = req.body;
    const stmt = db.prepare("INSERT INTO sources (name) VALUES (?)");
    const info = stmt.run(name);
    res.json({ id: info.lastInsertRowid, name });
  });

  app.put("/api/sources/:id", (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const stmt = db.prepare("UPDATE sources SET name = ? WHERE id = ?");
    stmt.run(name, id);
    res.json({ success: true });
  });

  app.delete("/api/sources/:id", (req, res) => {
    const { id } = req.params;
    // Optional: Check if source has transactions before deleting
    // For now, just delete
    db.prepare("DELETE FROM sources WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Ledgers
  app.get("/api/ledgers", (req, res) => {
    const ledgers = db.prepare("SELECT * FROM ledgers ORDER BY name").all();
    res.json(ledgers);
  });

  app.post("/api/ledgers", (req, res) => {
    const { name } = req.body;
    const stmt = db.prepare("INSERT INTO ledgers (name) VALUES (?)");
    const info = stmt.run(name);
    res.json({ id: info.lastInsertRowid, name });
  });

  app.put("/api/ledgers/:id", (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const stmt = db.prepare("UPDATE ledgers SET name = ? WHERE id = ?");
    stmt.run(name, id);
    res.json({ success: true });
  });

  app.delete("/api/ledgers/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM ledgers WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Vendors
  app.get("/api/vendors", (req, res) => {
    const vendors = db.prepare(`
      SELECT 
        v.*,
        (
          COALESCE((SELECT SUM(amount) FROM transactions WHERE vendor_id = v.id AND type = 'PURCHASE' AND is_credit = 1), 0) -
          COALESCE((SELECT SUM(amount) FROM transactions WHERE vendor_id = v.id AND type = 'VENDOR_PAYMENT'), 0)
        ) as pending_payable
      FROM vendors v
    `).all();
    res.json(vendors);
  });

  app.post("/api/vendors", (req, res) => {
    const { name } = req.body;
    const stmt = db.prepare("INSERT INTO vendors (name) VALUES (?)");
    const info = stmt.run(name);
    res.json({ id: info.lastInsertRowid, name });
  });

  app.put("/api/vendors/:id", (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const stmt = db.prepare("UPDATE vendors SET name = ? WHERE id = ?");
    stmt.run(name, id);
    res.json({ success: true });
  });

  app.delete("/api/vendors/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM vendors WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Transactions
  app.get("/api/transactions", (req, res) => {
    const transactions = db.prepare(`
      SELECT 
        t.*,
        s.name as source_name,
        l.name as ledger_name,
        v.name as vendor_name
      FROM transactions t
      LEFT JOIN sources s ON t.source_id = s.id
      LEFT JOIN ledgers l ON t.ledger_id = l.id
      LEFT JOIN vendors v ON t.vendor_id = v.id
      ORDER BY t.date DESC, t.id DESC
    `).all();
    res.json(transactions);
  });

  app.post("/api/transactions", (req, res) => {
    const { type, source_id, ledger_id, vendor_id, amount, date, description, is_credit } = req.body;
    const stmt = db.prepare(`
      INSERT INTO transactions (type, source_id, ledger_id, vendor_id, amount, date, description, is_credit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(type, source_id, ledger_id, vendor_id, amount, date, description, is_credit ? 1 : 0);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/transactions/:id", (req, res) => {
    const { id } = req.params;
    const { type, source_id, ledger_id, vendor_id, amount, date, description, is_credit } = req.body;
    const stmt = db.prepare(`
      UPDATE transactions 
      SET type = ?, source_id = ?, ledger_id = ?, vendor_id = ?, amount = ?, date = ?, description = ?, is_credit = ?
      WHERE id = ?
    `);
    stmt.run(type, source_id, ledger_id, vendor_id, amount, date, description, is_credit ? 1 : 0, id);
    res.json({ success: true });
  });

  app.delete("/api/transactions/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Expenses by Ledger (for Pie Chart)
  app.get("/api/expenses/stats", (req, res) => {
    const stats = db.prepare(`
      SELECT 
        l.name as name,
        SUM(t.amount) as value
      FROM transactions t
      JOIN ledgers l ON t.ledger_id = l.id
      WHERE t.type = 'EXPENSE'
      GROUP BY l.id
      HAVING value > 0
    `).all();
    res.json(stats);
  });

  // Download Code API
  app.get("/api/download-code", async (req, res) => {
    try {
      const archive = archiver("zip", { zlib: { level: 9 } });
      const chunks: Buffer[] = [];

      archive.on("data", (chunk) => chunks.push(chunk));
      archive.on("end", () => {
        const result = Buffer.concat(chunks);
        res.json({ base64: result.toString("base64") });
      });

      archive.on("error", (err) => {
        res.status(500).json({ error: err.message });
      });

      // Add files to zip, excluding node_modules, dist, .git, finance.db
      archive.glob("**/*", {
        cwd: process.cwd(),
        ignore: ["node_modules/**", "dist/**", ".git/**", "finance.db", "finance.db-journal"]
      });

      await archive.finalize();
    } catch (error) {
      res.status(500).json({ error: "Failed to create zip" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
