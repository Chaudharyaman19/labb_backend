/**
 * @description : exports authentication strategy for google using passport.js
 * @params {Object} passport : passport object for authentication
 * @return {callback} : returns callback to be used in middleware
 */
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.model.js";
import {
  dbServiceCreate,
  dbServiceFindOne,
  dbServiceUpdateOne,
} from "../db/dbServices.js";
import { USER_TYPES } from "../constants.js";

export const googlePassportStrategy = (passport) => {
  passport.serializeUser(function (user, cb) {
    cb(null, user);
  });

  passport.deserializeUser(function (user, cb) {
    cb(null, user);
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENTID,
        clientSecret: process.env.GOOGLE_CLIENTSECRET,
        callbackURL: process.env.GOOGLE_CALLBACKURL,
      },
      async function (accessToken, refreshToken, profile, done) {
        if (profile) {
          let userObj = {
            ssoAuth: { googleId: profile.id },
            name:
              profile.displayName &&
              profile.displayName !== undefined &&
              profile.displayName,
            email: profile.emails !== undefined ? profile.emails[0].value : "",
            password: "",
            userType: USER_TYPES.User,
          };
          let found = await dbServiceFindOne(User, { email: userObj.email });
          if (found) {
            const id = found.id;
            await dbServiceUpdateOne(User, { _id: id }, userObj);
          } else {
            let result = await dbServiceCreate(User, userObj);
          }
          let user = await dbServiceFindOne(User, {
            "ssoAuth.googleId": profile.id,
          });
          return done(null, user);
        }
        return done(null, null);
      }
    )
  );
};
