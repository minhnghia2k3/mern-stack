import dotenv from "dotenv";
import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { json } from "body-parser";
import mongoose from "mongoose";
import auth from "./routes/auth";
import { connectDB } from "./config/db";
// import errorHandler from "./middleware/error";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to DB
connectDB();

app.use(express.json());
app.get("/ping", (req, res) => {
  return res.status(200).json("pong");
});
app.use("/api/auth", auth);
// app.use("/api/private", () => {});

// Errorhandler should be last piece of middlewares
// app.use(errorHandler)

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on("unhandledRejection", (error, promise) => {
  console.log(`Logged error: ${error}`);
  server.close(() => process.exit(1));
});
