/**
 * @description : login user.
 * @param {string} username : username of user.
 * @param {string} password : password of user.
 * @param {string} platform : platform.
 * @param {boolean} roleAccess: a flag to request user`s role access
 * @return {Object} : returns authentication status. {flag, data}
 */

import dayjs from "dayjs";
import {
  LOGIN_ACCESS,
  LOGIN_REACTIVE_TIME,
  MAX_LOGIN_RETRY_LIMIT,
  PLATFORM,
  JWT,
} from "../constants.js";
import {
  dbServiceCreate,
  dbServiceFindOne,
  dbServiceUpdateOne,
} from "../db/dbServices.js";
import { User } from "../models/user.model.js";
import { UserTokens } from "../models/userToken.model.js";
import { generateOTP } from "../utils/index.js";
import { OTP } from "../models/otp.model.js";
import bcrypt from "bcrypt";

export const loginUser = async (username, password, platform, roleAccess,type) => {
  try {
    let where;
    if (Number(username)) {
      where = { phone: username };
    } else {
      where = { phone: username };
    }

    where.isActive = true;
    where.isDeleted = false;

    let user = await dbServiceFindOne(User, where);
    console.log(user);
    if (user) {
      if (user.loginRetryLimit >= MAX_LOGIN_RETRY_LIMIT) {
        let now = dayjs();
        if (user.loginReactiveTime) {
          let limitTime = dayjs(user.loginReactiveTime);
          if (limitTime > now) {
            let expireTime = dayjs().add(LOGIN_REACTIVE_TIME, "minute");
            if (!(limitTime > expireTime)) {
              return {
                flag: true,
                data: `you have exceed the number of limit.you can login after ${common.getDifferenceOfTwoDatesInTime(now, limitTime)}.`,
              };
            }

            await dbServiceUpdateOne(
              User,
              { _id: user.id },
              {
                loginReactiveTime: expireTime.toISOString(),
                loginRetryLimit: user.loginRetryLimit + 1,
              }
            );

            return {
              flag: true,
              data: `you have exceed the number of limit.you can login after ${common.getDifferenceOfTwoDatesInTime(now, expireTime)}.`,
            };
          } else {
            user = await dbServiceUpdateOne(
              User,
              { _id: user.id },
              {
                loginReactiveTime: "",
                loginRetryLimit: 0,
              },
              { new: true }
            );
          }
        } else {
          // send error
          let expireTime = dayjs().add(LOGIN_REACTIVE_TIME, "minute");

          await dbServiceUpdateOne(
            User,
            {
              _id: user.id,
              isActive: true,
              isDeleted: false,
            },
            {
              loginReactiveTime: expireTime.toISOString(),
              loginRetryLimit: user.loginRetryLimit + 1,
            }
          );

          return {
            flag: true,
            data: `you have exceed the number of limit.you can login after ${common.getDifferenceOfTwoDatesInTime(now, expireTime)}.`,
          };
        }
      }
    }
    console.log("user", user,password,type,type === "LOGIN" && password);
    // otp send
    if (user && type === "FORGOT_PASSWORD") {
      const generate_otp = await generateOTP();
      // console.log("otp", generate_otp, username);
      const updatedPhone = username && typeof username === "string" && username && username.startsWith("91")
        ? username
        : `91${username}`;
      await OTP.create({ phone: updatedPhone, otp: generate_otp });
      return { flag: false, data: "OTP sent to your registered phone number." };
    }
    console.log("user", user,password,type,type === "LOGIN" && password);
    if (!!(type === "LOGIN" && password)) {
      const isPasswordMatch = await user.isPasswordMatch(password);
      console.log("is password", isPasswordMatch);
      if (!isPasswordMatch) {
        await dbServiceUpdateOne(
          User,
          { _id: user.id, isActive: true, isDeleted: false },
          { loginRetryLimit: user.loginRetryLimit + 1 }
        );
        return { flag: true, data: "Incorrect Password" };
      }

      const userData = user.toJSON();
      let token;
      if (!user.userType) {
        return { flag: true, data: "You have not been assigned any role" };
      }
      if (platform == PLATFORM.USERAPP) {
        if (!LOGIN_ACCESS[user.userType].includes(PLATFORM.USERAPP)) {
          return { flag: true, data: "you are unable to access this platform" };
        }
        token = await user.generateAccessToken(JWT.USERAPP_SECRET);
      } else if (platform == PLATFORM.ADMINAPP) {
        if (!LOGIN_ACCESS[user.userType].includes(PLATFORM.ADMINAPP)) {
          return { flag: true, data: "you are unable to access this platform" };
        }
        token = await user.generateAccessToken(JWT.ADMINAPP_SECRET);
      }

      let expire = dayjs().add(JWT.EXPIRES_IN, "second").toISOString();
      await dbServiceCreate(UserTokens, {
        userId: user.id,
        token: token,
        tokenExpiredTime: expire,
      });

      let userToReturn = { ...userData, token };
      return { flag: false, data: userToReturn };
    } else {
      return { flag: true, data: "User not exists" };
    }
  } catch (error) {
    return { flag: true, data: "User not exists" };
    console.log(
      "Error in auth services functions",
      error.message ? error.message : error
    );
  }
};

export const socialLogin = async (email, platform = "userapp") => {
  try {
    const user = await dbServiceFindOne(User, { email });
    if (user && user.email) {
      const { ...userData } = user.toJSON();
      if (!user.userType) {
        return { flag: true, data: "You have not been assigned any role" };
      }
      if (platform === undefined) {
        return { flag: true, data: "Please login through Platform" };
      }
      if (
        !PLATFORM[platform.toUpperCase()] ||
        !JWT[`${platform.toUpperCase()}_SECRET`]
      ) {
        return {
          flag: true,
          data: "Platform not exists",
        };
      }
      if (
        !LOGIN_ACCESS[user.userType].includes(PLATFORM[platform.toUpperCase()])
      ) {
        return {
          flag: true,
          data: "you are unable to access this platform",
        };
      }
      let token = await user.generateAccessToken(JWT.USERAPP_SECRET);
      let expire = dayjs().add(JWT.EXPIRES_IN, "second").toISOString();
      await dbServiceCreate(UserTokens, {
        userId: user.id,
        token: token,
        tokenExpiredTime: expire,
      });
      const userToReturn = { ...userData, token };
      return { flag: false, data: userToReturn };
    } else {
      return { flag: true, data: "User/Email not exists" };
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

export const resetPassword = async (user, newPassword) => {
  try {
      let where = {
          _id: user.id,
          isActive: true, isDeleted: false,
      }
      const dbUser = await dbServiceFindOne(User, where);
      if (!dbUser) {
          return {
              flag: true,
              data: "User not found",
          };
      }
      newPassword = await bcrypt.hash(newPassword, 10);
      await dbServiceUpdateOne(User, where, {
          "password": newPassword,
          resetPasswordLink: {},
          loginRetryLimit: 0
      });
   
      return {
          flag: false,
          data: "Password reset successfully",
      };
  } catch (error) {
      throw new Error(error.message)
  }
};
