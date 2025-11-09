// import dotenv from "dotenv";
// import connectDB from "./db/index.js";
// import { app } from "./app.js";

// dotenv.config({
//   path: "./.env",
// });
// let port = process.env.PORT || 5000;
// connectDB()
//   .then(() => {
//     app.listen(port, () => {
//       console.log(`Server is running at port : ${port}`);
//     });
//   })
//   .catch((error) => {
//     console.log("MongoDb connection failed !!", error);
//   });
import serverless from "serverless-http";
import dotenv from "dotenv";
import { app } from "../src/app.js"; // app is a named export in src/app.js
import connectDB from "../src/db/index.js";

dotenv.config(); // Vercel will supply env vars; dotenv helps local dev when present

let dbPromise = null;
async function ensureDB() {
  if (!dbPromise) dbPromise = connectDB();
  return dbPromise;
}

const handler = serverless(app);

export default async function (req, res) {
  try {
    await ensureDB();
  } catch (err) {
    console.error("DB connection failed", err);
    res.statusCode = 500;
    return res.end("Database connection error");
  }
  return handler(req, res);
}
