import { asyncHandler } from "../../../utils/asyncHandler.js";
import { Member } from "../../../models/member.model.js";
import { dbServiceCreate, dbServiceFind, dbServiceFindOne, dbServiceUpdateOne } from "../../../db/dbServices.js";
import { isValidObjectId } from "mongoose";
import joi from "joi";

const memberCreateSchema = joi.object({
  name: joi.string().min(2).max(100).required(),
  relation: joi.string().min(2).max(50).required(),
  gender: joi.string().valid("male", "female", "other").required(),
  dob: joi.date().iso().required(),
  phone: joi.string().pattern(/^\d{10}$/).optional(),
});

export const addMember = asyncHandler(async (req, res) => {
  const { error } = memberCreateSchema.validate(req.body);
  if (error) {
    return res.validationError({ message: error.details.map((d) => d.message).join("\n") });
  }

  const payload = { ...req.body, userId: req.user.id };
  const created = await dbServiceCreate(Member, payload);
  return res.success({ data: created, message: "Member added successfully" });
});

export const getMembers = asyncHandler(async (req, res) => {
  const members = await dbServiceFind(Member, {
    userId: req.user.id,
    isActive: true,
    isDeleted: false,
  });
  return res.success({ data: members });
});

export const updateMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.validationError({ message: "Invalid member ID" });
  }

  const { error } = memberCreateSchema.fork(["name", "relation", "gender", "dob"], (s) => s.optional()).validate(req.body);
  if (error) {
    return res.validationError({ message: error.details.map((d) => d.message).join("\n") });
  }

  const updated = await dbServiceUpdateOne(
    Member,
    { _id: id, userId: req.user.id, isDeleted: false },
    req.body,
    { new: true }
  );
  if (!updated) {
    return res.recordNotFound({ message: "Member not found" });
  }
  return res.success({ data: updated, message: "Member updated successfully" });
});

export const deleteMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.validationError({ message: "Invalid member ID" });
  }
  const updated = await dbServiceUpdateOne(
    Member,
    { _id: id, userId: req.user.id, isDeleted: false },
    { isDeleted: true, isActive: false },
    { new: true }
  );
  if (!updated) {
    return res.recordNotFound({ message: "Member not found" });
  }
  return res.success({ data: updated, message: "Member deleted successfully" });
});


