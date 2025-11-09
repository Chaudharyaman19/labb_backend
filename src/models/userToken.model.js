/**
 * userTokens.js
 * @description :: model of a database collection userTokens
 */

import { mongoose, Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseUniqueValidator from "mongoose-unique-validator";

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
const userTokenSchema = Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    token: { type: String },

    tokenExpiredTime: { type: Date },

    isTokenExpired: {
      type: Boolean,
      default: false,
    },

    isActive: { type: Boolean },

    addedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    createdAt: { type: Date },

    updatedAt: { type: Date },

    isDeleted: { type: Boolean },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);
userTokenSchema.pre("save", async function (next) {
  this.isDeleted = false;
  this.isActive = true;
  next();
});

userTokenSchema.pre("insertMany", async function (next, docs) {
  if (docs && docs.length) {
    for (let index = 0; index < docs.length; index++) {
      const element = docs[index];
      element.isDeleted = false;
      element.isActive = true;
    }
  }
  next();
});

userTokenSchema.method("toJSON", function () {
  const { _id, __v, ...object } = this.toObject({ virtuals: true });
  object.id = _id;

  return object;
});
userTokenSchema.plugin(mongoosePaginate);
export const UserTokens = mongoose.model("UserTokens", userTokenSchema);
