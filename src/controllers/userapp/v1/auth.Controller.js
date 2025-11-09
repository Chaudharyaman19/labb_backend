/**
 * auth.Controller.js
 * @description :: exports All authentication methods and controller for User
 */

import { USER_TYPES, PLATFORM } from "../../../constants.js";
import { User } from "../../../models/user.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { validateParamsWithJoi } from "../../../utils/validateRequest.js";
import { schemaKeys } from "../../../utils/validation/userValidation.js";
import {
  dbServiceCreate,
  dbServiceFindOne,
  dbServiceUpdateOne,
} from "../../../db/dbServices.js";
import * as common from "../../../utils/common.js";
import { loginUser, resetPassword } from "../../../services/auth.services.js";
import { isValidObjectId } from "mongoose";
import dayjs from "dayjs";
import { OTP } from "../../../models/otp.model.js";
import { UserTokens } from "../../../models/userToken.model.js";

/**
 *
 * @param {Object} req: request  for register and It have { phone,email,password}
 * @param {*} res : response for register and stored user's data in data with validation
 */
const register = asyncHandler(async (req, res) => {
  // Required Validation
  let { phone, email, password } = req.body;

  if (!(phone || email)) {
    return res.badRequest({
      message: "Insufficient request parameters! email or phone  is required.",
    });
  }
  if (!password) {
    return res.badRequest({
      message: "Insufficient request parameters! password is required.",
    });
  }

  // validation
  let validateRequest = validateParamsWithJoi(req.body, schemaKeys);

  if (!validateRequest.isValid) {
    return res.validationError({
      message: `Invalid values in parameters, ${validateRequest.message}`,
    });
  }

  const data = new User({
    ...req.body,
    userType: USER_TYPES.User,
  });
  // check data avaible in database or not
  if (req.body.email) {
    let checkUniqueFields = await common.checkUniqueFieldsInDatabase(
      User,
      ["email"],
      data,
      "REGISTER"
    );
    if (checkUniqueFields.isDuplicate) {
      return res.validationError({
        message: `${checkUniqueFields.value} already exists.Unique ${checkUniqueFields.field} are allowed.`,
      });
    }
  } else if (req.body.phone) {
    let checkUniqueFields = await common.checkUniqueFieldsInDatabase(
      User,
      ["phone"],
      data,
      "REGISTER"
    );
    if (checkUniqueFields.isDuplicate) {
      return res.validationError({
        message: `${checkUniqueFields.value} already exists.Unique ${checkUniqueFields.field} are allowed.`,
      });
    }
  }
  // create  User
  const result = await dbServiceCreate(User, data);
  return res.success({
    data: result,
    message: "register successfully",
  });
});

/**
 * @description : login with username and password
 * @param {Object} req : request for login
 * @param {Object} res : response for login
 * @return {Object} : response for login {status, message, data}
 */

const login = asyncHandler(async (req, res) => {
  let { phone, password } = req.body;

  if (!phone) {
    return res.badRequest({
      message: "Insufficient request parameters! phone is required.",
    });
  }

  let roleAccess = false;
  let result = await loginUser(
    phone,
    password,
    PLATFORM.USERAPP,
    roleAccess,
    "LOGIN"
  );
  if (result.flag) {
    return res.badRequest({ message: result.data });
  }
  return res.success({
    data: result.data,
    message: "Login Successful",
  });
});

/**
 * @description : find document of User from table by id;
 * @param {Object} req : request including id in request params.
 * @param {Object} res : response contains document retrieved from table.
 * @return {Object} : found User. {status, message, data}
 */
const getUser = asyncHandler(async (req, res) => {
  try {
    if (!req.user.id) {
      return res.badRequest({
        message: "Insufficient request parameters! id is required.",
      });
    }
    if (!isValidObjectId(req.user.id)) {
      return res.validationError({ message: "invalid object" });
    }

    let query = {
      _id: req.user.id,
    };
    let options = {};

    let foundUser = await dbServiceFindOne(User, query, options);

    if (!foundUser) {
      return res.internalServerError();
    }

    return res.success({ data: foundUser });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
});

const logout = asyncHandler(async (req, res) => {
  try {
    if (!req.user.id) {
      return res.badRequest({
        message: "Insufficient request parameters! id is required.",
      });
    }

    await dbServiceUpdateOne(
      UserTokens,
      { userId: req.user.id },
      { isActive: false ,token:""}
    );
    return res.success({ message: "Logout successful"});
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
});

const sendOTPHandler = asyncHandler(async (req, res) => {
  let { phone } = req.body;

  if (!phone) {
    return res.badRequest({
      message: "Insufficient request parameters! phone is required.",
    });
  }
  let result = await loginUser(
    phone,
    null,
    PLATFORM.USERAPP,
    false,
    "FORGOT_PASSWORD"
  );
  if (result.flag) {
    return res.badRequest({ message: result.data });
  }
  return res.success({
    data: result.data,
    message: "Login Successful",
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  // phone code password confirmPassword
  const params = req.body;
  try {
    if (!params.code || !params.confirmPassword || !params.password) {
      return res.badRequest({
        message:
          "Insufficient request parameters! code and newPassword is required.",
      });
    }
    if (req.body.password.toLowerCase() !== req.body.confirmPassword.toLowerCase()) {
      return res.badRequest({
        message: "password and confirm password should be same",
      });
    }

    const where = {
      "phone": params.phone,
      "isActive": true,
      "isDeleted": false,
    }
    let found = await dbServiceFindOne(User, where);
    if (!found) {
      return res.failure({ message: "Invalid User" });
    }
    const updateNumber = params.phone.startsWith("91") ? params.phone : `91${params.phone}`;
    const otpDetail = await OTP.findOne({
      phone: updateNumber,
    }).sort({ createdAt: -1 });
    if (!otpDetail || otpDetail.otp !== params.code) {
      return res.failure({ message: "Invalid OTP" });
    }
    let response = await resetPassword(found, params.password);
    if (!response || response.flag) {
      return res.failure({ message: response.data });
    }
    return res.success({ message: "Password reset successfully" });
  } catch (error) {
    return res.internalServerError({ data: error.message });
  }
});


const resetPasswordHandler = asyncHandler(async (req, res) => {
  // password confirmPassword
  const params = req.body;
  try {
    if (!params.password || !params.confirmPassword) {
      return res.badRequest({
        message: "Insufficient request parameters! password is required.",
      });
    }
    if (req.body.password.toLowerCase() !== req.body.confirmPassword.toLowerCase()) {
      return res.badRequest({
        message: "password and confirm password should be same",
      });
    }
    let response = await resetPassword(req.user, params.password);
    if (!response || response.flag) {
      return res.failure({ message: response.data });
    }
    return res.success({ message: "Password reset successfully" });
  } catch (error) {
    return res.internalServerError({ data: error.message });
  }
});
export { register, login, getUser, logout, forgotPassword, sendOTPHandler, resetPasswordHandler };