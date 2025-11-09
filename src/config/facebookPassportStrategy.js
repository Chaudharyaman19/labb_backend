/**
 * @description : exports authentication strategy for facebook using passport.js
 * @params {Object} passport : passport object for authentication
 * @return {callback} : returns callback to be used in middleware
 */
import { Strategy as FacebookStrategy } from "passport-facebook";
import { User } from "../models/user.model.js";
import {
  dbServiceCreate,
  dbServiceFindOne,
  dbServiceUpdateOne,
} from "../db/dbServices.js";
import { USER_TYPES } from "../constants.js";

export const facebookPassportStrategy = (passport) => {
  passport.serializeUser(function (user, cb) {
    cb(null, user);
  });

  passport.deserializeUser(function (user, cb) {
    cb(null, user);
  });

  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACKURL,
        profileFields: ["id", "displayName", "emails"],
      },
      async function (accessToken, refreshToken, profile, done) {
        if (profile) {
          console.log("fb pro", profile);
          //   let userObj = {
          //     'ssoAuth': { 'facebookId': profile.id },
          //     'name': profile.displayName && profile.displayName !== undefined && profile.displayName,
          //     'email': profile.emails !== undefined ? profile.emails[0].value : '',
          //     'password':'',
          //     'userType':USER_TYPES.User
          //   };
          //   let found = await dbServiceFindOne(User,{ 'email': userObj.email });
          //   if (found) {
          //     const id = found.id;
          //     await dbServiceUpdateOne(User, { _id :id }, userObj);
          //   }
          //   else {
          //     let result = await dbServiceCreate(User, userObj);
          //     console.log(result,'google srtaegy')

          //   }
          //   let user = await dbServiceFindOne(User,{ 'ssoAuth.googleId':profile.id });
          //   console.log("user",user)
          //   return done(null, user);
        }
        return done(null, null);
      }
    )
  );
};
