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
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

// Connect MongoDB before handling requests
await connectDB();

// ❌ No app.listen() here
// ✅ Instead, export the Express app (Vercel will handle it)
export default app;
