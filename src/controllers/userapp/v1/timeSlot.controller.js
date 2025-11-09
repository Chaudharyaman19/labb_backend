import { asyncHandler } from "../../../utils/asyncHandler.js";
import { TimeSlot } from "../../../models/timeSlot.model.js";
import { Booking } from "../../../models/booking.model.js";
import { Package } from "../../../models/package.model.js";
import joi from "joi";
import {
  dbServiceFind,
  dbServiceFindOne,
  dbServiceCreate,
} from "../../../db/dbServices.js";
import dayjs from "dayjs";

export const getAvailableSlots = asyncHandler(async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.badRequest({ message: "Date parameter is required" });
  }

  const queryDate = dayjs(date).startOf("day");
  if (!queryDate.isValid()) {
    return res.validationError({ message: "Invalid date format" });
  }

  const query = {
    date: {
      $gte: queryDate.toDate(),
      $lt: queryDate.add(1, "day").toDate(),
    },
    isActive: true,
    isDeleted: false,
  };

  const slots = await dbServiceFind(TimeSlot, query, {
    sort: { startTime: 1 },
  });

  // Calculate availability for each slot
  const availableSlots = await Promise.all(
    slots.map(async (slot) => {
      const bookingCount = await Booking.countDocuments({
        slotId: slot._id,
        status: { $in: ["pending", "confirmed"] },
        isActive: true,
        isDeleted: false,
      });

      return {
        ...slot.toObject(),
        isAvailable: bookingCount < slot.maxBookings,
        currentBookings: bookingCount,
      };
    })
  );

  return res.success({
    data: availableSlots,
    message: "Available slots retrieved successfully",
  });
});

export const getSlotsByDateRange = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.badRequest({
      message: "Start date and end date parameters are required",
    });
  }

  const start = dayjs(startDate).startOf("day");
  const end = dayjs(endDate).endOf("day");

  if (!start.isValid() || !end.isValid()) {
    return res.validationError({ message: "Invalid date format" });
  }

  if (start.isAfter(end)) {
    return res.validationError({
      message: "Start date must be before end date",
    });
  }

  const query = {
    date: {
      $gte: start.toDate(),
      $lte: end.toDate(),
    },
    isActive: true,
    isDeleted: false,
  };

  const slots = await dbServiceFind(TimeSlot, query, {
    sort: { date: 1, startTime: 1 },
  });

  return res.success({
    data: slots,
    message: "Slots retrieved successfully",
  });
});

const bookSlotSchema = joi.object({
  slotId: joi.string().required(),
  packageId: joi.string().required(),
  homeCollectionId: joi.string().optional(),
});

export const bookSlot = asyncHandler(async (req, res) => {
  const { slotId, packageId, homeCollectionId } = req.body;

  const { error } = bookSlotSchema.validate(req.body);
  if (error) {
    return res.validationError({ message: error.details.map((d) => d.message).join("\n") });
  }

  // Check if slot exists and is available
  const slot = await dbServiceFindOne(TimeSlot, {
    _id: slotId,
    isActive: true,
    isDeleted: false,
  });

  if (!slot) {
    return res.recordNotFound({ message: "Time slot not found" });
  }

  // Check current bookings for this slot
  const currentBookings = await Booking.countDocuments({
    slotId: slotId,
    status: { $in: ["pending", "confirmed"] },
    isActive: true,
    isDeleted: false,
  });

  if (currentBookings >= slot.maxBookings) {
    return res.badRequest({ message: "This time slot is fully booked" });
  }

  // Get package details for pricing
  const packageDetails = await dbServiceFindOne(Package, {
    _id: packageId,
    isActive: true,
    isDeleted: false,
  });

  if (!packageDetails) {
    return res.recordNotFound({ message: "Package not found" });
  }

  // Create booking
  const booking = new Booking({
    userId: req.user.id,
    packageId,
    slotId,
    homeCollectionId,
    totalAmount: packageDetails.price,
    bookingDate: slot.date,
  });

  const result = await dbServiceCreate(Booking, booking);

  return res.success({
    data: result,
    message: "Slot booked successfully",
  });
});

