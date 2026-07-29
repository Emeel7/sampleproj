// // ---- ENV VARIABLES
import dotenv from "dotenv";
dotenv.config({ quiet: true });
const PORT = process.env.PORT || 5000;

// // ---- IMPORTS
import express, { type Request, type Response } from "express";
import cors from "cors";
import corsOptions from "./config/corsOptions.js";

// // ---- APP
const app = express();

// // ---- MIDDLEWARE
import { logger } from "./middleware/EventLogger.js";
import connectDB from "./middleware/dbConn.js";

app.use(express.json());
app.use(logger);
app.use(cors(corsOptions));
app.use(connectDB);

// // ---- ROUTES
import authRoutes from "./routes/authRoutes.js";
import notesRoutes from "./routes/notesRoutes.js";
app.use("/auth", authRoutes);
app.use("/notes", notesRoutes);

// // ---- ERROR HANDLING
import errorLogger from "./middleware/ErrorLogger.js";
app.use(errorLogger);

app.all(/^\/.*/, (req: Request, res: Response) => {
  res.status(404);

  if (req.accepts("json")) {
    res.json({ error: "Invalid Request" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

// // ---- FOR DEVELOPMENT
if (process.env.NODE_ENV === "development") {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

// // ---- FOR DEAR VERCEL
export default app;
