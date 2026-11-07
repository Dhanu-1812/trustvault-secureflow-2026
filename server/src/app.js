require("dotenv").config();
const userRoutes = require("./routes/userRoutes");
const express = require("express");
const cors = require("cors");

const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");
const permissionRoutes = require("./routes/permissionRoutes");
const auditRoutes = require("./routes/auditRoutes");
const helmet = require("helmet");
const app = express();
app.use(helmet());
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/users", userRoutes);
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "TrustVault API is running",
  });
});

app.get("/db-health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "ok",
      database: "connected",
      time: result.rows[0].now,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "not connected",
    });
  }
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;