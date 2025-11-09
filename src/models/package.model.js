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

const packageSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number, // in days
      required: true,
    },
    tests: [
      {
        type: String,
      },
    ],
    category: {
      type: String,
      required: true,
    },
    features: [
      {
        type: String,
      },
    ],
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

packageSchema.plugin(mongoosePaginate);

export const Package = mongoose.model("Package", packageSchema);
