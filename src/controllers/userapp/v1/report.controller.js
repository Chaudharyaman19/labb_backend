import { asyncHandler } from "../../../utils/asyncHandler.js";
import { Report } from "../../../models/report.model.js";
import { Booking } from "../../../models/booking.model.js";
import { Package } from "../../../models/package.model.js";
import {
  dbServiceFind,
  dbServiceFindOne,
  dbServiceCreate,
} from "../../../db/dbServices.js";
import { isValidObjectId } from "mongoose";
import dayjs from "dayjs";

export const generateReport = asyncHandler(async (req, res) => {
  const { type, period } = req.query;

  if (!type) {
    return res.badRequest({ message: "Report type is required" });
  }

  let startDate, endDate, periodString;

  // Calculate date range based on type
  switch (type) {
    case "daily":
      startDate = dayjs().startOf("day");
      endDate = dayjs().endOf("day");
      periodString = dayjs().format("YYYY-MM-DD");
      break;
    case "weekly":
      startDate = dayjs().startOf("week");
      endDate = dayjs().endOf("week");
      periodString = `${startDate.format("YYYY-MM-DD")} to ${endDate.format("YYYY-MM-DD")}`;
      break;
    case "monthly":
      startDate = dayjs().startOf("month");
      endDate = dayjs().endOf("month");
      periodString = dayjs().format("YYYY-MM");
      break;
    case "custom":
      if (!period) {
        return res.badRequest({
          message: "Period is required for custom reports",
        });
      }
      const [start, end] = period.split(" to ");
      startDate = dayjs(start).startOf("day");
      endDate = dayjs(end).endOf("day");
      periodString = period;
      break;
    default:
      return res.validationError({ message: "Invalid report type" });
  }

  // Get booking statistics
  const totalBookings = await Booking.countDocuments({
    bookingDate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    isActive: true,
    isDeleted: false,
  });

  const completedBookings = await Booking.countDocuments({
    bookingDate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    status: "completed",
    isActive: true,
    isDeleted: false,
  });

  const cancelledBookings = await Booking.countDocuments({
    bookingDate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    status: "cancelled",
    isActive: true,
    isDeleted: false,
  });

  // Calculate total revenue
  const revenueData = await Booking.aggregate([
    {
      $match: {
        bookingDate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
        status: "completed",
        isActive: true,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
      },
    },
  ]);

  const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

  // Get top packages
  const topPackages = await Booking.aggregate([
    {
      $match: {
        bookingDate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
        isActive: true,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$packageId",
        count: { $sum: 1 },
        totalRevenue: { $sum: "$totalAmount" },
      },
    },
    {
      $lookup: {
        from: "packages",
        localField: "_id",
        foreignField: "_id",
        as: "package",
      },
    },
    {
      $unwind: "$package",
    },
    {
      $project: {
        packageId: "$_id",
        packageName: "$package.name",
        bookingCount: "$count",
        revenue: "$totalRevenue",
      },
    },
    {
      $sort: { bookingCount: -1 },
    },
    {
      $limit: 100,
    },
  ]);

  // Get daily booking trends
  const dailyTrends = await Booking.aggregate([
    {
      $match: {
        bookingDate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
        isActive: true,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$bookingDate" },
        },
        count: { $sum: 1 },
        revenue: { $sum: "$totalAmount" },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  const reportData = {
    totalBookings,
    completedBookings,
    cancelledBookings,
    totalRevenue,
    topPackages,
    dailyTrends,
  };

  // Save report to database
  const report = new Report({
    type,
    period: periodString,
    totalBookings,
    totalRevenue,
    completedBookings,
    cancelledBookings,
    data: reportData,
    generatedBy: req.user.id,
  });

  const result = await dbServiceCreate(Report, report);

  return res.success({
    data: result,
    message: "Report generated successfully",
  });
});

export const getReports = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const query = {
    generatedBy: req.user.id,
    isActive: true,
    isDeleted: false,
  };

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
  };

  const result = await dbServiceFind(Report, query, options);

  return res.success({
    data: result,
    message: "Reports retrieved successfully",
  });
});

export const getReportById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.validationError({ message: "Invalid report ID" });
  }

  const query = {
    _id: id,
    generatedBy: req.user.id,
    isActive: true,
    isDeleted: false,
  };

  const report = await dbServiceFindOne(Report, query);

  if (!report) {
    return res.recordNotFound({ message: "Report not found" });
  }

  return res.success({
    data: report,
    message: "Report retrieved successfully",
  });
});

export const downloadReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { format = "pdf" } = req.query;

  if (!isValidObjectId(id)) {
    return res.validationError({ message: "Invalid report ID" });
  }

  const query = {
    _id: id,
    generatedBy: req.user.id,
    isActive: true,
    isDeleted: false,
  };

  const report = await dbServiceFindOne(Report, query);

  if (!report) {
    return res.recordNotFound({ message: "Report not found" });
  }

  // For now, return JSON data
  // In a real implementation, you would generate PDF/Excel files
  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="report-${id}.${format}"`
  );

  return res.success({
    data: report,
    message: "Report download initiated",
  });
});
