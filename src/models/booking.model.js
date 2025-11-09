import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const myCustomLabels = {
  totalDocs: "itemCount",
  docs: "data",
  limit: "perPage",
  page: "currentPage",
  nextPage: "next",
  prevPage: "prev",
  totalPages: "pageCount",
  pagingCounter: "slNo",
  meta: "paginator",
};

mongoosePaginate.paginate.options = { customLabels: myCustomLabels };

const bookingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bookingId: {
      type: String,
      required: true,
    },
    packages: [
      {
        packageId: { type: Number },
        name: { type: String },
        code: { type: String },
        price: { type: Number },
        offer_price: { type: Number },
        tests: [
          {
            testId: Number,
            name: String,
            code: String,
            description: String,
          },
        ],
      },
    ],
    slot: {
      slotId: { type: Number },
      slotTime: { type: String },
    },
    bookingDate: { type: Date, required: true },
    collectionDate: { type: Date },
    customer: {
      name: String,
      age: Number,
      gender: String,
      email: String,
      phone: String,
      whatsapp: String,
      address: String,
      landmark: String,
      aadhar: String,
      pincode: String,
    },
    totalAmount: { type: Number },
    discountedPrice: { type: Object }, // store discounted_price object
    bookingStatus: { type: String },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentId: { type: String },
    pickup: { type: Object }, // optional pickup info
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);
bookingSchema.plugin(mongoosePaginate);

export const Booking = mongoose.model("Booking", bookingSchema);
