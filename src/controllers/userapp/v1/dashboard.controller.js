import { asyncHandler } from "../../../utils/asyncHandler.js";
import { Booking } from "../../../models/booking.model.js";
import { Package } from "../../../models/package.model.js";
import { HomeCollection } from "../../../models/homeCollection.model.js";
import dayjs from "dayjs";

export const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get total bookings
  const totalBookings = await Booking.countDocuments({
    userId,
    isActive: true,
    isDeleted: false,
  });

  // Get completed bookings
  const completedBookings = await Booking.countDocuments({
    userId,
    status: 'completed',
    isActive: true,
    isDeleted: false,
  });

  // Get pending bookings
  const pendingBookings = await Booking.countDocuments({
    userId,
    status: 'pending',
    isActive: true,
    isDeleted: false,
  });

  // Get cancelled bookings
  const cancelledBookings = await Booking.countDocuments({
    userId,
    status: 'cancelled',
    isActive: true,
    isDeleted: false,
  });

  // Calculate total revenue
  const revenueData = await Booking.aggregate([
    {
      $match: {
        userId: userId,
        status: 'completed',
        isActive: true,
        isDeleted: false,
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' }
      }
    }
  ]);

  const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

  // Calculate monthly revenue
  const monthlyRevenueData = await Booking.aggregate([
    {
      $match: {
        userId: userId,
        status: 'completed',
        bookingDate: {
          $gte: dayjs().startOf('month').toDate(),
          $lte: dayjs().endOf('month').toDate(),
        },
        isActive: true,
        isDeleted: false,
      }
    },
    {
      $group: {
        _id: null,
        monthlyRevenue: { $sum: '$totalAmount' }
      }
    }
  ]);

  const monthlyRevenue = monthlyRevenueData.length > 0 ? monthlyRevenueData[0].monthlyRevenue : 0;

  // Get top packages
  const topPackages = await Booking.aggregate([
    {
      $match: {
        userId: userId,
        isActive: true,
        isDeleted: false,
      }
    },
    {
      $group: {
        _id: '$packageId',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' }
      }
    },
    {
      $lookup: {
        from: 'packages',
        localField: '_id',
        foreignField: '_id',
        as: 'package'
      }
    },
    {
      $unwind: '$package'
    },
    {
      $project: {
        packageId: '$_id',
        name: '$package.name',
        price: '$package.price',
        duration: '$package.price',
        bookingCount: '$count',
        revenue: '$totalRevenue'
      }
    },
    {
      $sort: { bookingCount: -1 }
    },
    {
      $limit: 5
    }
  ]);

  // Get recent bookings
  const recentBookings = await Booking.find({
    userId: userId,
    isActive: true,
    isDeleted: false,
  })
    .populate('packageId', 'name price duration')
    .populate('slotId', 'startTime endTime date')
    .populate('homeCollectionId', 'address city contactPerson')
    .sort({ createdAt: -1 })
    .limit(5);

  const stats = {
    totalBookings,
    completedBookings,
    pendingBookings,
    cancelledBookings,
    totalRevenue,
    monthlyRevenue,
    topPackages,
    recentBookings,
  };

  return res.success({
    data: stats,
    message: "Dashboard statistics retrieved successfully",
  });
});

