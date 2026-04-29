const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({
    message: "TUC ICT Help Desk API is running...",
    version: "1.0.0",
    university: "Turkana University College",
  });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/tickets", require("./routes/ticketRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/knowledge", require("./routes/knowledgeBaseRoutes"));
app.use("/api/assets", require("./routes/assetRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
  });
});
