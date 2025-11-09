/**
 * @description : exports authentication strategy for userapp using passport.js
 * @params {Object} passport : passport object for authentication
 * @return {callback} : returns callback to be used in middleware
 */

import { Strategy, ExtractJwt } from "passport-jwt";
import { JWT } from "../constants.js";
import { User } from "../models/user.model.js";
import { dbServiceFindOne } from "../db/dbServices.js";

export const userappPassportStrategy = (passport) => {
  const options = {};
  options.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
  options.secretOrKey = JWT.USERAPP_SECRET;
  console.log(options);
  passport.use(
    "userapp-rule",
    new Strategy(options, async (payload, done) => {
      try {
        const result = await dbServiceFindOne(User, { _id: payload._id });
        if (result) {
          return done(null, result.toJSON());
        }
        return done("No User Found", {});
      } catch (error) {
        return done(error, {});
      }
    })
  );
};
