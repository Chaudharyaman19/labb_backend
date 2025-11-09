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

const timeSlotSchema = new Schema(
  {
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    maxBookings: {
      type: Number,
      default: 10,
    },
    currentBookings: {
      type: Number,
      default: 0,
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

timeSlotSchema.plugin(mongoosePaginate);

export const TimeSlot = mongoose.model("TimeSlot", timeSlotSchema);

