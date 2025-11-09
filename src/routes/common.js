/**
 * googleLogin.js
 * @description :: routes of google authentication
 */

import { Router } from "express";
const router = Router();

import passport from "passport";
import { socialLogin } from "../services/auth.services.js";

router.get("/auth/google/error", (req, res) => {
  res.loginFailed({ message: "Login Failed" });
});

router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get("/auth/google/callback", (req, res, next) => {
  passport.authenticate(
    "google",
    { failureRedirect: process.env.GOOGLE_ERRORURL },
    async (error, user, info) => {
      if (error) {
        return res.internalServerError({ message: error.message });
      }
      if (user) {
        console.log("user2", user);
        try {
          let result = await socialLogin(user.email);
          if (result.flag) {
            return res.failure({ message: result.data });
          }
          res.cookie("authCookie", result.data.token);
          res.redirect(process.env.GOOGLE_REDIRECTURL);
          // return res.success({
          //   data: result.data,
          //   message:'Login Successful'
          // });
        } catch (error) {
          return res.internalServerError({ message: error.message });
        }
      }
    }
  )(req, res, next);
});

router.get("/auth/facebook/error", (req, res) => {
  res.loginFailed({ message: "Login Failed" });
});

router.get(
  "/auth/facebook",
  passport.authenticate("facebook", {
    scope: ["email"],
    session: false,
  })
);

router.get("/auth/facebook/callback", (req, res, next) => {
  passport.authenticate(
    "facebook",
    { failureRedirect: process.env.FACEBOOK_ERRORURL },
    async (error, user, info) => {
      console.log("error facebook", error);
      if (error) {
        return res.internalServerError({ message: error.message });
      }
      if (user) {
        console.log("user2 fb", user);
        //   try {
        //     let result = await socialLogin(user.email);
        //     if (result.flag) {
        //       return res.failure({ message: result.data });
        //     }
        //     res.cookie("authCookie",result.data.token)
        //     res.redirect(process.env.GOOGLE_REDIRECTURL)
        //     // return res.success({
        //     //   data: result.data,
        //     //   message:'Login Successful'
        //     // });
        //   } catch (error) {
        //     return res.internalServerError({ message: error.message });
        //   }
      }
    }
  )(req, res, next);
});
export default router;
