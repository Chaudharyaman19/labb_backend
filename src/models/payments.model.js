import mongoose from "mongoose";
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
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    userId: {
      ref: "User",
      type: Schema.Types.ObjectId,
    },
    refId: { type: String },
    paymentChannel: { type: String },
    currentPayment: { type: Number },
    totalPayment: { type: Number },
    order_id: { type: String },
    payment_id: { type: String },
    signature: { type: String },
    paymentStatus: {
      type: String,
      enum: ["pending", "success", "failed", "refunded", "partial"],
      default: "pending",
    },
    addedBy: {
      ref: "User",
      type: Schema.Types.ObjectId,
    },
    updatedBy: {
      ref: "User",
      type: Schema.Types.ObjectId,
    },
    isAppUser: { type: Boolean, default: true },
    isActive: { type: Boolean },
    isDeleted: { type: Boolean },
    createdAt: { type: Date },
    updatedAt: { type: Date },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);

schema.pre("save", async function (next) {
  this.isDeleted = false;
  this.isActive = true;
  next();
});

schema.pre("insertMany", async function (next, docs) {
  if (docs && docs.length) {
    for (let index = 0; index < docs.length; index++) {
      const element = docs[index];
      element.isDeleted = false;
      element.isActive = true;
    }
  }
  next();
});

schema.method("toJSON", function () {
  const { _id, __v, ...object } = this.toObject({ virtuals: true });
  object.id = _id;

  return object;
});
schema.plugin(mongoosePaginate);
const payment = mongoose.model("payment", schema);
export { payment };
