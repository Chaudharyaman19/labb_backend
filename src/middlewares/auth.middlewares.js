/**
 * auth.js
 * @description :: middleware that checks authentication and authorization of user
 */

import passport from "passport";
import { LOGIN_ACCESS, PLATFORM } from "../constants.js";
import { dbServiceFindOne } from "../db/dbServices.js";
import { User } from "../models/user.model.js";
import { UserTokens } from "../models/userToken.model.js";

/**
 * @description : returns callback that verifies required rights and access
 * @param {Object} req : request of route.
 * @param {callback} resolve : resolve callback for succeeding method.
 * @param {callback} reject : reject callback for error.
 * @param {int} platform : platform
 */
const verifyCallback =
  (req, resolve, reject, platform) => async (error, user, info) => {
    if (error || info || !user) {
      return reject("Unauthorized User");
    }

    req.user = user;
    if (!user.isActive || user.isDeleted) {
      return reject("User is deactivated");
    }
    let userToken = await dbServiceFindOne(UserTokens, {
      token: req.headers.authorization.replace("Bearer ", ""),
      userId: user.id,
      isActive: true,
    });
    if (!userToken) {
      return reject("Token not found");
    }
    if (userToken.isTokenExpired) {
      return reject("Token is Expired");
    }
    if (user.userType) {
      let allowedPlatforms = LOGIN_ACCESS[user.userType]
        ? LOGIN_ACCESS[user.userType]
        : [];
      if (!allowedPlatforms.includes(platform)) {
        return reject("Unauthorized user");
      }
    }
    resolve();
  };

/**
 * @description : authentication middleware for request.
 * @param {Object} req : request of route.
 * @param {Object} res : response of route.
 * @param {callback} next : executes the next middleware succeeding the current middleware.
 * @param {int} platform : platform
 */
export const auth = (platform) => async (req, res, next) => {
  if (platform == PLATFORM.USERAPP) {
    return new Promise((resolve, reject) => {
      passport.authenticate(
        "userapp-rule",
        { session: false },
        verifyCallback(req, resolve, reject, platform)
      )(req, res, next);
    })
      .then(() => next())
      .catch((error) => {
        return res.unAuthorized({ message: error.message });
      });
  } else if (platform == PLATFORM.ADMINAPP) {
    return new Promise((resolve, reject) => {
      passport.authenticate(
        "adminapp-rule",
        { session: false },
        verifyCallback(req, resolve, reject, platform)
      )(req, res, next);
    })
      .then(() => next())
      .catch((error) => {
        return res.unAuthorized({ message: error.message });
      });
  }
};
