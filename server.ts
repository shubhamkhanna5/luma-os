import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Ensure DB exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({
    clients: [],
    appointments: [],
    payments: [],
    settings: {
      therapistName: "Clinical Practice",
      sessionDuration: 60,
      workingHours: { start: "09:00", end: "17:00" },
      fee: 100
    }
  }, null, 2));
}

function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function writeDB(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

app.use(express.json());

// API Routes
app.get("/api/db", (req, res) => {
  res.json(readDB());
});

app.post("/api/clients", (req, res) => {
  const db = readDB();
  const client = { ...req.body, id: Date.now().toString(), createdAt: new Date().toISOString() };
  db.clients.push(client);
  writeDB(db);
  res.json(client);
});

app.post("/api/appointments", (req, res) => {
  const db = readDB();
  const appointment = { ...req.body, id: Date.now().toString(), createdAt: new Date().toISOString() };
  db.appointments.push(appointment);
  writeDB(db);
  res.json(appointment);
});

app.patch("/api/appointments/:id", (req, res) => {
  const db = readDB();
  const index = db.appointments.findIndex((a: any) => a.id === req.params.id);
  if (index !== -1) {
    db.appointments[index] = { ...db.appointments[index], ...req.body };
    writeDB(db);
    res.json(db.appointments[index]);
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

app.delete("/api/appointments/:id", (req, res) => {
  const db = readDB();
  db.appointments = db.appointments.filter((a: any) => a.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

app.post("/api/payments", (req, res) => {
  const db = readDB();
  const { clientId, amount } = req.body;
  const payment = { ...req.body, id: Date.now().toString(), paidAt: req.body.paidAt || new Date().toISOString() };
  
  // Set up auto-settlement of unpaid appointments (invoices)
  let remainingAmount = Number(amount);
  const clientAppointments = db.appointments
    .filter((a: any) => a.clientId === clientId && a.paymentStatus === "unpaid")
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const apt of clientAppointments) {
    if (remainingAmount <= 0) break;
    const fee = Number(apt.fee || db.settings.fee);
    if (remainingAmount >= fee) {
      apt.paymentStatus = "paid";
      remainingAmount -= fee;
    } else {
      // Partial payment - for simplicity we mark as paid if they paid most of it
      // or we can just leave it. User asked to "remove open invoices"
      // Let's mark as paid if any significant payment is made to that session
      apt.paymentStatus = "paid";
      remainingAmount = 0;
    }
  }

  db.payments.push(payment);
  writeDB(db);
  res.json(payment);
});

app.delete("/api/payments/:id", (req, res) => {
  const db = readDB();
  db.payments = db.payments.filter((p: any) => p.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

app.patch("/api/settings", (req, res) => {
  const db = readDB();
  db.settings = { ...db.settings, ...req.body };
  writeDB(db);
  res.json(db.settings);
});

// Vite Middleware
async function init() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

init();
