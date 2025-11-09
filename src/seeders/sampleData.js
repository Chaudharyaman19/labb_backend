import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Package } from "../models/package.model.js";
import { TimeSlot } from "../models/timeSlot.model.js";
import { HomeCollection } from "../models/homeCollection.model.js";
import { Booking } from "../models/booking.model.js";
import bcrypt from "bcrypt";
import dayjs from "dayjs";

const sampleData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect("mongodb://localhost:27017/labBookingSystem");
    console.log("Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Package.deleteMany({});
    await TimeSlot.deleteMany({});
    await HomeCollection.deleteMany({});
    await Booking.deleteMany({});
    console.log("Cleared existing data");

    // Create sample user
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = new User({
      name: "John Doe",
      email: "john@example.com",
      phone: "9876543210",
      password: hashedPassword,
      userType: 1,
      isActive: true,
      isDeleted: false,
    });
    await user.save();
    console.log("Created sample user");

    // Create sample packages
    const packages = [
      {
        name: "Basic Health Checkup",
        description: "Complete basic health screening including blood pressure, blood sugar, and basic blood tests",
        price: 1500,
        duration: 1,
        tests: ["Blood Pressure", "Blood Sugar", "Complete Blood Count", "Lipid Profile"],
        category: "health",
        features: ["Home Collection", "Same Day Report", "Doctor Consultation"],
      },
      {
        name: "Comprehensive Health Package",
        description: "Extensive health checkup covering all major health parameters",
        price: 3500,
        duration: 2,
        tests: ["Complete Blood Count", "Lipid Profile", "Liver Function", "Kidney Function", "Thyroid", "Diabetes Panel"],
        category: "health",
        features: ["Home Collection", "Detailed Report", "Doctor Consultation", "Follow-up Support"],
      },
      {
        name: "Cardiac Risk Assessment",
        description: "Specialized package for heart health assessment",
        price: 2500,
        duration: 1,
        tests: ["ECG", "Echocardiogram", "Cardiac Enzymes", "Lipid Profile", "Blood Pressure"],
        category: "cardiac",
        features: ["Home Collection", "Cardiologist Consultation", "Detailed Report"],
      },
      {
        name: "Diabetes Management Package",
        description: "Comprehensive diabetes monitoring and management",
        price: 2000,
        duration: 1,
        tests: ["Fasting Blood Sugar", "HbA1c", "Post Prandial Sugar", "Insulin Levels", "Microalbumin"],
        category: "diabetes",
        features: ["Home Collection", "Diabetologist Consultation", "Diet Plan"],
      },
      {
        name: "Women's Health Package",
        description: "Specialized health package for women",
        price: 3000,
        duration: 2,
        tests: ["Pap Smear", "Mammography", "Hormone Panel", "Bone Density", "Thyroid"],
        category: "women",
        features: ["Home Collection", "Gynecologist Consultation", "Detailed Report"],
      },
    ];

    const createdPackages = await Package.insertMany(packages);
    console.log("Created sample packages");

    // Create sample time slots for the next 30 days
    const timeSlots = [];
    const timeRanges = [
      { start: "09:00", end: "11:00" },
      { start: "11:00", end: "13:00" },
      { start: "14:00", end: "16:00" },
      { start: "16:00", end: "18:00" },
    ];

    for (let i = 0; i < 30; i++) {
      const date = dayjs().add(i, "day");
      for (const timeRange of timeRanges) {
        timeSlots.push({
          startTime: timeRange.start,
          endTime: timeRange.end,
          date: date.toDate(),
          isAvailable: true,
          maxBookings: 5,
          currentBookings: 0,
          isActive: true,
          isDeleted: false,
        });
      }
    }

    await TimeSlot.insertMany(timeSlots);
    console.log("Created sample time slots");

    // Create sample home collections
    const homeCollections = [
      {
        userId: user._id,
        address: "123 Main Street, Apartment 4B",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        contactPerson: "John Doe",
        contactNumber: "9876543210",
        collectionDate: dayjs().add(1, "day").toDate(),
        timeSlot: "09:00 AM - 11:00 AM",
        status: "pending",
        packageId: createdPackages[0]._id,
        specialInstructions: "Please call before arriving",
        isActive: true,
        isDeleted: false,
      },
      {
        userId: user._id,
        address: "456 Park Avenue, Floor 2",
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
        contactPerson: "Jane Smith",
        contactNumber: "9876543211",
        collectionDate: dayjs().add(2, "day").toDate(),
        timeSlot: "11:00 AM - 01:00 PM",
        status: "confirmed",
        packageId: createdPackages[1]._id,
        specialInstructions: "Gate code: 1234",
        isActive: true,
        isDeleted: false,
      },
    ];

    await HomeCollection.insertMany(homeCollections);
    console.log("Created sample home collections");

    // Create sample bookings
    const bookings = [
      {
        userId: user._id,
        packageId: createdPackages[0]._id,
        homeCollectionId: homeCollections[0]._id,
        status: "pending",
        totalAmount: createdPackages[0].price,
        paymentStatus: "pending",
        bookingDate: dayjs().add(1, "day").toDate(),
        isActive: true,
        isDeleted: false,
      },
      {
        userId: user._id,
        packageId: createdPackages[1]._id,
        homeCollectionId: homeCollections[1]._id,
        status: "confirmed",
        totalAmount: createdPackages[1].price,
        paymentStatus: "paid",
        bookingDate: dayjs().add(2, "day").toDate(),
        isActive: true,
        isDeleted: false,
      },
    ];

    await Booking.insertMany(bookings);
    console.log("Created sample bookings");

    console.log("Sample data seeded successfully!");
    console.log("\nSample User Credentials:");
    console.log("Phone: 9876543210");
    console.log("Password: password123");
    console.log("\nYou can now test the application with these credentials.");

  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run the seeder
sampleData();

