import { asyncHandler } from "../../../utils/asyncHandler.js";
import { Package } from "../../../models/package.model.js";
import {
  dbServiceFind,
  dbServiceFindOne,
  dbServicePaginate,
} from "../../../db/dbServices.js";
import { isValidObjectId } from "mongoose";

export const searchPackages = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    page = 1,
    limit = 100,
  } = req.query;

  let query = {
    isActive: true,
    isDeleted: false,
  };

  // Text search
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tests: { $in: [new RegExp(search, "i")] } },
    ];
  }

  // Category filter
  if (category) {
    query.category = category;
  }

  // Price range filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
  };

  const result = await dbServicePaginate(Package, query, options);

  return res.success({
    data: result,
    message: "Packages retrieved successfully",
  });
});

export const getPackageById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.validationError({ message: "Invalid package ID" });
  }

  const query = {
    _id: id,
    isActive: true,
    isDeleted: false,
  };

  const packageData = await dbServiceFindOne(Package, query);

  if (!packageData) {
    return res.recordNotFound({ message: "Package not found" });
  }

  return res.success({
    data: packageData,
    message: "Package retrieved successfully",
  });
});

export const getPackagesByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const query = {
    category: category,
    isActive: true,
    isDeleted: false,
  };

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { price: 1 },
  };

  const result = await dbServiceFind(Package, query, options);

  return res.success({
    data: result,
    message: "Packages retrieved successfully",
  });
});

export const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Package.distinct("category", {
    isActive: true,
    isDeleted: false,
  });

  return res.success({
    data: categories,
    message: "Categories retrieved successfully",
  });
});
