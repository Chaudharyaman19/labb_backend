import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { USER_TYPES } from "../constants.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import uniqueValidator from "mongoose-unique-validator";
import { convertObjectToEnum } from "../utils/common.js";

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
const userSchema = new Schema(
  {
    name: {
      type: String,
    },
    password: {
      type: String,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    userType: {
      type: Number,
      enum: convertObjectToEnum(USER_TYPES),
      required: true,
    },
    languagePreference: {
      type: String,
      default: "en",
    },
    avatar: {
      type: String,
    },
    loginRetryLimit: {
      type: Number,
      default: 0,
    },
    loginReactiveTime: {
      type: Date,
    },
    ssoAuth: {
      googleId: { type: String },
      facebookId: { type: String },
    },

    createdBy: {
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
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  this.isDeleted = false;
  this.isActive = true;

  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.method("toJSON", function () {
  const { _id, __v, ...object } = this.toObject({ virtuals: true });
  object.id = _id;
  delete object.password;
  return object;
});

userSchema.methods.isPasswordMatch = async function (password) {
  const result = await bcrypt.compare(password, this.password)
  console.log(password, this.password,result);
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = async function (ACCESS_TOKEN_SECRET) {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
    },
    ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.plugin(mongoosePaginate);
userSchema.plugin(uniqueValidator, {
  message: "Error, expected {VALUE} to be unique.",
});
export const User = mongoose.model("User", userSchema);
