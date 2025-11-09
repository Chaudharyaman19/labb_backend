/**
 * payments.controller.js
 * @description :: exports All payment methods and controller for Admin
 */

import { asyncHandler } from "../../../utils/asyncHandler.js";
import { payment as Payment } from "../../../models/payments.model.js";
import { Booking } from "../../../models/booking.model.js";
import { User } from "../../../models/user.model.js";
import {
  dbServiceFind,
  dbServiceFindOne,
  dbServicePaginate,
  dbServiceUpdateOne,
} from "../../../db/dbServices.js";
import { isValidObjectId } from "mongoose";

/**
 * @description : get all payments (for admin)
 * @param {Object} req : request for getting all payments
 * @param {Object} res : response for getting all payments
 * @return {Object} : response {status, message, data}
 */
const listPayments = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      paymentStatus,
      paymentChannel,
      search,
      startDate,
      endDate,
    } = req.query;

    let query = {
      isActive: true,
      isDeleted: false,
    };

    // Filter by payment status
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Filter by payment channel
    if (paymentChannel) {
      query.paymentChannel = paymentChannel;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Search functionality
    if (search) {
      query.$or = [
        { order_id: { $regex: search, $options: "i" } },
        { payment_id: { $regex: search, $options: "i" } },
        { refId: { $regex: search, $options: "i" } },
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: "userId", select: "name email phone" },
        { path: "addedBy", select: "name email" },
      ],
    };

    const result = await dbServicePaginate(Payment, query, options);

    return res.success({
      data: result,
      message: "Payments retrieved successfully",
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
});

/**
 * @description : get single payment details (for admin)
 * @param {Object} req : request including payment id in params
 * @param {Object} res : response contains payment document
 * @return {Object} : found Payment. {status, message, data}
 */
const singlePayment = asyncHandler(async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!isValidObjectId(paymentId)) {
      return res.validationError({ message: "Invalid payment ID" });
    }

    let query = {
      _id: paymentId,
      isActive: true,
      isDeleted: false,
    };
    const payment = await dbServiceFindOne(Payment, query, {
      populate: [
        { path: "userId", select: "name email phone userType" },
        { path: "addedBy", select: "name email" },
        { path: "updatedBy", select: "name email" },
      ],
    });

    if (!payment) {
      return res.recordNotFound({ message: "Payment not found" });
    }

    // Get related booking if exists
    let relatedBooking = null;
    if (payment.order_id) {
      relatedBooking = await dbServiceFindOne(
        Booking,
        { paymentId: payment.order_id, isActive: true, isDeleted: false },
        {
          populate: [{ path: "userId", select: "name email phone" }],
        }
      );
    }

    return res.success({
      data: {
        payment,
        relatedBooking,
      },
      message: "Payment retrieved successfully",
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
});

/**
 * @description : Get total amount of all paid payments with booking linkage (for admin)
 */
const getAllTotalAmountPaymentPaid = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, paymentStatus = "success" } = req.query;

    let query = {
      isActive: true,
      isDeleted: false,
      paymentStatus,
    };

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Aggregate payments with related bookings
    const paymentStats = await Payment.aggregate([
      { $match: query },
      {
        $addFields: {
          idAsString: {
            $toString: "$_id",
          },
        },
      },
      {
        $lookup: {
          from: "bookings",
          localField: "idAsString",
          foreignField: "paymentId",
          as: "bookingInfo",
        },
      },
      { $unwind: "$bookingInfo" },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$bookingInfo.totalAmount" },
          totalBookings: {
            $sum: { $cond: [{ $ifNull: ["$bookingInfo", false] }, 1, 0] },
          },
          totalPayments: { $sum: 1 },
          averagePayment: { $avg: "$currentPayment" },
        },
      },
    ]);
    console.log("payments tsats", paymentStats);
    // Breakdown by payment status
    const paymentBreakdown = await Payment.aggregate([
      { $match: { isActive: true, isDeleted: false } },
      {
        $group: {
          _id: "$paymentStatus",
          totalAmount: { $sum: "$currentPayment" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Breakdown by payment channel
    const paymentByChannel = await Payment.aggregate([
      {
        $match: { isActive: true, isDeleted: false, paymentStatus: "success" },
      },
      {
        $group: {
          _id: "$paymentChannel",
          totalAmount: { $sum: "$currentPayment" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Daily trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyTrends = await Payment.aggregate([
      {
        $match: {
          isActive: true,
          isDeleted: false,
          paymentStatus: "success",
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalAmount: { $sum: "$currentPayment" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const result = {
      totalAmount: paymentStats[0]?.totalAmount || 0,
      totalPayments: paymentStats[0]?.totalPayments || 0,
      totalBookings: paymentStats[0]?.totalBookings || 0,
      averagePayment: paymentStats[0]?.averagePayment || 0,
      paymentBreakdown: paymentBreakdown.reduce((acc, item) => {
        acc[item._id] = {
          totalAmount: item.totalAmount,
          count: item.count,
        };
        return acc;
      }, {}),
      paymentByChannel: paymentByChannel.reduce((acc, item) => {
        acc[item._id || "unknown"] = {
          totalAmount: item.totalAmount,
          count: item.count,
        };
        return acc;
      }, {}),
      dailyTrends,
    };

    return res.success({
      data: result,
      message: "Payment statistics retrieved successfully",
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
});

/**
 * @description : update payment status (for admin)
 * @param {Object} req : request for updating payment
 * @param {Object} res : response for updating payment
 * @return {Object} : response {status, message, data}
 */
const updatePaymentStatus = asyncHandler(async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { paymentStatus, notes } = req.body;

    if (!isValidObjectId(paymentId)) {
      return res.validationError({ message: "Invalid payment ID" });
    }

    const updateData = {
      paymentStatus,
      updatedBy: req.user.id,
    };
    if (notes) updateData.adminNotes = notes;

    let query = {
      _id: paymentId,
      isActive: true,
      isDeleted: false,
    };

    const result = await dbServiceUpdateOne(Payment, query, updateData, {
      new: true,
      populate: [
        { path: "userId", select: "name email phone" },
        { path: "updatedBy", select: "name email" },
      ],
    });

    if (!result) {
      return res.recordNotFound({ message: "Payment not found" });
    }

    return res.success({
      data: result,
      message: "Payment updated successfully",
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
});

/**
 * @description : get payment statistics for dashboard (for admin)
 * @param {Object} req : request for getting payment statistics
 * @param {Object} res : response for getting payment statistics
 * @return {Object} : response {status, message, data}
 */
const getPaymentStats = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) {
        dateQuery.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateQuery.createdAt.$lte = new Date(endDate);
      }
    }

    const baseQuery = {
      isActive: true,
      isDeleted: false,
      ...dateQuery,
    };

    // Get total payments
    const totalPayments = await Payment.countDocuments(baseQuery);

    // Get successful payments
    const successfulPayments = await Payment.countDocuments({
      ...baseQuery,
      paymentStatus: "success",
    });

    const revenueStats = await Payment.aggregate([
      {
        $match: {
          ...baseQuery,
        },
      },
      {
        $addFields: {
          idAsString: { $toString: "$_id" },
        },
      },
      {
        $lookup: {
          from: "bookings",
          localField: "idAsString",
          foreignField: "paymentId",
          as: "bookingInfo",
        },
      },
      {
        $unwind: "$bookingInfo",
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$bookingInfo.totalAmount" },
          averagePayment: { $sum: "$bookingInfo.totalAmount" },
        },
      },
    ]);
    // Get payments by status
    const paymentsByStatus = await Payment.aggregate([
      { $match: baseQuery },
      { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
    ]);

    const stats = {
      totalPayments,
      successfulPayments,
      failedPayments: totalPayments - successfulPayments,
      successRate:
        totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
      totalRevenue: revenueStats[0]?.totalRevenue || 0,
      averagePayment: revenueStats[0]?.averagePayment || 0,
      paymentsByStatus: paymentsByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    };

    return res.success({
      data: stats,
      message: "Payment statistics retrieved successfully",
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
});

export {
  listPayments,
  singlePayment,
  getAllTotalAmountPaymentPaid,
  updatePaymentStatus,
  getPaymentStats,
};
