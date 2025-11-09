/**
 * auth.controller.js
 * @description :: exports All authentication methods and controller for Admin
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
  dbServiceFind,
  dbServicePaginate,
} from "../../../db/dbServices.js";
import * as common from "../../../utils/common.js";
import { loginUser, resetPassword } from "../../../services/auth.services.js";
import { isValidObjectId } from "mongoose";

/**
 * Admin Register
 * @param {Object} req: request for register and It have { phone,email,password,name}
 * @param {*} res : response for register and stored admin's data in data with validation
 */
const register = asyncHandler(async (req, res) => {
  // Required Validation
  let { phone, email, password, name } = req.body;

  if (!(phone || email)) {
    return res.badRequest({
      message: "Insufficient request parameters! email or phone is required.",
    });
  }
  if (!password) {
    return res.badRequest({
      message: "Insufficient request parameters! password is required.",
    });
  }
  if (!name) {
    return res.badRequest({
      message: "Insufficient request parameters! name is required.",
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
    userType: USER_TYPES.Admin,
  });

  // check data available in database or not
  if (req.body.email) {
    let checkUniqueFields = await common.checkUniqueFieldsInDatabase(
      User,
      ["email"],
      data,
      "REGISTER"
    );
    if (checkUniqueFields.isDuplicate) {
      return res.validationError({
        message: `${checkUniqueFields.value} already exists. Unique ${checkUniqueFields.field} are allowed.`,
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
        message: `${checkUniqueFields.value} already exists. Unique ${checkUniqueFields.field} are allowed.`,
      });
    }
  }

  // create Admin
  const result = await dbServiceCreate(User, data);
  return res.success({
    data: result,
    message: "Admin registered successfully",
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

  let roleAccess = true; 
  // Admin role access
  let result = await loginUser(
    phone,
    password,
    PLATFORM.ADMINAPP,
    roleAccess,
    "LOGIN"
  );
  if (result.flag) {
    return res.badRequest({ message: result.data });
  }

  return res.success({
    data: result.data,
    message: "Admin Login Successful",
  });
});

/**
 * @description : find document of Admin from table by id;
 * @param {Object} req : request including id in request params.
 * @param {Object} res : response contains document retrieved from table.
 * @return {Object} : found Admin. {status, message, data}
 */
const getAdmin = asyncHandler(async (req, res) => {
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
      userType: USER_TYPES.Admin,
    };
    let options = {};

    let foundAdmin = await dbServiceFindOne(User, query, options);

    if (!foundAdmin) {
      return res.recordNotFound({ message: "Admin not found" });
    }

    return res.success({ data: foundAdmin });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
});

/**
 * @description : update admin profile
 * @param {Object} req : request for update
 * @param {Object} res : response for update
 * @return {Object} : response for update {status, message, data}
 */
const updateAdmin = asyncHandler(async (req, res) => {
  try {
    if (!req.user.id) {
      return res.badRequest({
        message: "Insufficient request parameters! id is required.",
      });
    }

    const updateData = { ...req.body };
    delete updateData.password; // Don't allow password update through this endpoint
    delete updateData.userType; // Don't allow userType change
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    let query = {
      _id: req.user.id,
      userType: USER_TYPES.Admin,
    };

    const result = await dbServiceUpdateOne(User, query, updateData, {
      new: true,
    });

    if (!result) {
      return res.recordNotFound({ message: "Admin not found" });
    }

    return res.success({
      data: result,
      message: "Admin updated successfully",
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
});

/**
 * @description : get all users (for admin)
 * @param {Object} req : request for getting all users
 * @param {Object} res : response for getting all users
 * @return {Object} : response {status, message, data}
 */
const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    let query = {
      userType: USER_TYPES.User,
      isActive: true,
      isDeleted: false,
    };

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
    };
    console.log(query);
    const result = await dbServicePaginate(User, query, options);

    return res.success({
      data: result,
      message: "Users retrieved successfully",
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
});

/**
 * @description : get single user info (for admin)
 * @param {Object} req : request including user id in params
 * @param {Object} res : response contains user document
 * @return {Object} : found User. {status, message, data}
 */
const getSingleUserInfo = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.validationError({ message: "Invalid user ID" });
    }

    let query = {
      _id: userId,
      userType: USER_TYPES.User,
      isActive: true,
      isDeleted: false,
    };

    let foundUser = await dbServiceFindOne(User, query, {});

    if (!foundUser) {
      return res.recordNotFound({ message: "User not found" });
    }

    return res.success({ data: foundUser });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
});

export {
  register,
  login,
  getAdmin,
  updateAdmin,
  getAllUsers,
  getSingleUserInfo,
};
