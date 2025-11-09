/**
 * booking.controller.js
 * @description :: exports All booking methods and controller for Admin
 */

import { asyncHandler } from "../../../utils/asyncHandler.js";
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
 * @description : get all bookings (for admin)
 * @param {Object} req : request for getting all bookings
 * @param {Object} res : response for getting all bookings
 * @return {Object} : response {status, message, data}
 */
const listBooking = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      status,
      paymentStatus,
      search,
      startDate,
      endDate,
    } = req.query;

    let query = {
      isActive: true,
      isDeleted: false,
    };

    // Filter by status
    if (status) {
      query.bookingStatus = status;
    }

    // Filter by payment status
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.bookingDate = {};
      if (startDate) {
        query.bookingDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.bookingDate.$lte = new Date(endDate);
      }
    }

    // Search functionality
    if (search) {
      query.$or = [
        { bookingId: { $regex: search, $options: "i" } },
        { "customer.name": { $regex: search, $options: "i" } },
        { "customer.phone": { $regex: search, $options: "i" } },
        { "customer.email": { $regex: search, $options: "i" } },
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [{ path: "userId", select: "name email phone" }],
    };

    const result = await dbServicePaginate(Booking, query, options);

    return res.success({
      data: result,
      message: "Bookings retrieved successfully",
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
});

/**
 * @description : get single booking details (for admin)
 * @param {Object} req : request including booking id in params
 * @param {Object} res : response contains booking document
 * @return {Object} : found Booking. {status, message, data}
 */
const singleBooking = asyncHandler(async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!isValidObjectId(bookingId)) {
      return res.validationError({ message: "Invalid booking ID" });
    }

    let query = {
      _id: bookingId,
      isActive: true,
      isDeleted: false,
    };

    const booking = await dbServiceFindOne(Booking, query, {
      populate: [{ path: "userId", select: "name email phone userType" }],
    });

    if (!booking) {
      return res.recordNotFound({ message: "Booking not found" });
    }

    return res.success({
      data: booking,
      message: "Booking retrieved successfully",
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
});

/**
 * @description : update booking status (for admin)
 * @param {Object} req : request for updating booking
 * @param {Object} res : response for updating booking
 * @return {Object} : response {status, message, data}
 */
const updateBookingStatus = asyncHandler(async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { bookingStatus, paymentStatus, notes } = req.body;

    if (!isValidObjectId(bookingId)) {
      return res.validationError({ message: "Invalid booking ID" });
    }

    const updateData = {};
    if (bookingStatus) updateData.bookingStatus = bookingStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (notes) updateData.adminNotes = notes;

    let query = {
      _id: bookingId,
      isActive: true,
      isDeleted: false,
    };

    const result = await dbServiceUpdateOne(Booking, query, updateData, {
      new: true,
      populate: [{ path: "userId", select: "name email phone" }],
    });

    if (!result) {
      return res.recordNotFound({ message: "Booking not found" });
    }

    return res.success({
      data: result,
      message: "Booking updated successfully",
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
});

/**
 * @description : get booking statistics (for admin dashboard)
 * @param {Object} req : request for getting statistics
 * @param {Object} res : response for getting statistics
 * @return {Object} : response {status, message, data}
 */
const getBookingStats = asyncHandler(async (req, res) => {
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

    // Get total bookings
    const totalBookings = await Booking.countDocuments(baseQuery);

    // Get bookings by status
    const bookingsByStatus = await Booking.aggregate([
      { $match: baseQuery },
      { $group: { _id: "$bookingStatus", count: { $sum: 1 } } },
    ]);

    // Get bookings by payment status
    const bookingsByPaymentStatus = await Booking.aggregate([
      { $match: baseQuery },
      { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
    ]);

    // Get total revenue
    const revenueStats = await Booking.aggregate([
      { $match: { ...baseQuery, paymentStatus: "paid" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalPaidBookings: { $sum: 1 },
        },
      },
    ]);

    const stats = {
      totalBookings,
      bookingsByStatus: bookingsByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      bookingsByPaymentStatus: bookingsByPaymentStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      totalRevenue: revenueStats[0]?.totalRevenue || 0,
      totalPaidBookings: revenueStats[0]?.totalPaidBookings || 0,
    };

    return res.success({
      data: stats,
      message: "Booking statistics retrieved successfully",
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
});

export { listBooking, singleBooking, updateBookingStatus, getBookingStats };
