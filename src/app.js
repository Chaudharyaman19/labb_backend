import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "passport";
import { responseHandler } from "./utils/response/responseHandler.js";
import { apiKeyMiddleware } from "./middlewares/apiKey.middleware.js";

import userRouter from "./routes/USERAPP/user.routes.js";
import dsaRouter from "./routes/USERAPP/dsa.routes.js";
import commonRoute from "./routes/common.js";

import adminRouter from "./routes/ADMINAPP/admin.routes.js";

import { userappPassportStrategy } from "../src/config/userappPassportStrategy.js";
import { adminappPassportStrategy } from "../src/config/adminappPassportStrategy.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credential: true,
  })
);
app.use(responseHandler);

app.use(passport.initialize());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

userappPassportStrategy(passport);
adminappPassportStrategy(passport);

app.use("/api/v1/userapp/auth", userRouter);
app.use("/api/v1/dsa", dsaRouter);

app.use("/api/v1/admin", adminRouter);

app.use(commonRoute);

export { app };
