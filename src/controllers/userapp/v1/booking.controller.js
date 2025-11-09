import { asyncHandler } from "../../../utils/asyncHandler.js";
import { Booking } from "../../../models/booking.model.js";
import {
  dbServiceFind,
  dbServiceFindOne,
  dbServicePaginate,
  dbServiceUpdateOne,
} from "../../../db/dbServices.js";
import { isValidObjectId } from "mongoose";

export const getBookings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 100, status } = req.query;
  console.log("reqq", req.user.id);
  let query = {
    userId: req.user.id,
    isActive: true,
    isDeleted: false,
  };

  if (status) {
    query.status = status;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
  };

  const result = await dbServicePaginate(Booking, query, options);
  console.log("result", result);
  return res.success({
    data: result,
    message: "Bookings retrieved successfully",
  });
});

export const getBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.validationError({ message: "Invalid booking ID" });
  }

  const query = {
    _id: id,
    userId: req.user.id,
    isActive: true,
    isDeleted: false,
  };

  const booking = await dbServiceFindOne(Booking, query, {
    populate: [
      { path: "packageId", select: "name price duration tests" },
      { path: "slotId", select: "startTime endTime date" },
      {
        path: "homeCollectionId",
        select: "address city contactPerson contactNumber",
      },
    ],
  });

  if (!booking) {
    return res.recordNotFound({ message: "Booking not found" });
  }

  return res.success({
    data: booking,
    message: "Booking retrieved successfully",
  });
});

export const updateBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!isValidObjectId(id)) {
    return res.validationError({ message: "Invalid booking ID" });
  }

  // Remove fields that shouldn't be updated
  delete updateData.userId;
  delete updateData._id;
  delete updateData.createdAt;
  delete updateData.updatedAt;

  const query = {
    _id: id,
    userId: req.user.id,
    isActive: true,
    isDeleted: false,
  };

  const result = await dbServiceUpdateOne(Booking, query, updateData, {
    new: true,
    populate: [
      { path: "packageId", select: "name price duration" },
      { path: "slotId", select: "startTime endTime date" },
      { path: "homeCollectionId", select: "address city contactPerson" },
    ],
  });

  if (!result) {
    return res.recordNotFound({ message: "Booking not found" });
  }

  return res.success({
    data: result,
    message: "Booking updated successfully",
  });
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cancellationReason } = req.body;

  if (!isValidObjectId(id)) {
    return res.validationError({ message: "Invalid booking ID" });
  }

  const query = {
    _id: id,
    userId: req.user.id,
    isActive: true,
    isDeleted: false,
  };

  const updateData = {
    status: "cancelled",
    cancellationReason,
  };

  const result = await dbServiceUpdateOne(Booking, query, updateData, {
    new: true,
  });

  if (!result) {
    return res.recordNotFound({ message: "Booking not found" });
  }

  return res.success({
    data: result,
    message: "Booking cancelled successfully",
  });
});

export const confirmBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.validationError({ message: "Invalid booking ID" });
  }

  const query = {
    _id: id,
    userId: req.user.id,
    isActive: true,
    isDeleted: false,
  };

  const result = await dbServiceUpdateOne(
    Booking,
    query,
    { status: "confirmed" },
    {
      new: true,
      populate: [
        { path: "packageId", select: "name price duration" },
        { path: "slotId", select: "startTime endTime date" },
        { path: "homeCollectionId", select: "address city contactPerson" },
      ],
    }
  );

  if (!result) {
    return res.recordNotFound({ message: "Booking not found" });
  }

  return res.success({
    data: result,
    message: "Booking confirmed successfully",
  });
});
