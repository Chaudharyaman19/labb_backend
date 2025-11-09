// /**
//  * PaymentController.js
//  * @description : exports action methods for Payment.
//  */

// import { instance } from "../../../services/razorpay.service.js";
// import crypto from "crypto";
// import { payment as Payment } from "../../../models/payments.model.js";
// import {
//   dbServiceCreate,
//   dbServiceFindOne,
//   dbServiceUpdateOne,
// } from "../../../db/dbServices.js";
// import { Booking } from "../../../models/booking.model.js";
// import joi from "joi";
// import axios from "axios";

// /**
//  * checkout payment
//  */
// const checkout = async (req, res) => {
//   console.log(req.body, "this is checkout");
//   const options = {
//     amount: req.body.amount,
//     currency: req.body.currency,
//   };
//   try {
//     const order = await instance.orders.create(options);
//     console.log(req.body, "this is createExternalBooking");
//     const schema = joi
//       .object({
//         booking_date: joi
//           .string()
//           .pattern(/^\d{4}-\d{2}-\d{2}$/)
//           .required(),
//         collection_slot: joi.number().required(),
//         package_code: joi
//           .alternatives()
//           .try(joi.string(), joi.array().items(joi.string()))
//           .required(),
//         customer_phonenumber: joi
//           .string()
//           .pattern(/^[6-9]\d{9}$/)
//           .required(),
//         customer_whatsapppnumber: joi
//           .string()
//           .pattern(/^[6-9]\d{9}$/)
//           .required(),
//         customer_latitude: joi.number().required(),
//         customer_longitude: joi.number().required(),
//         customer_name: joi.string().min(3).max(30).required(),
//         pincode: joi
//           .string()
//           .pattern(/^\d{6}$/)
//           .required(),
//         is_credit: joi.boolean().required(),
//         customer_gender: joi
//           .string()
//           .valid("male", "female", "Male", "Female")
//           .required(),
//         customer_landmark: joi.string(),
//         customer_address: joi.string().required(),
//         customer_email: joi.string().email().optional(),
//       })
//       .unknown(true);

//     const { error } = schema.validate(req.body);
//     console.log(error, "this is error");
//     if (error) return res.validationError({ message: error.message });

//     const url = `${process.env.EXTERNAL_API_BASE_URL}/api/external/v2/center-create-booking/`;
//     console.log(url, "this is url");
//     const response = await axios.post(url, req.body, {
//       headers: {
//         key: "h3r7aRrq7AchshiXhCTvGOkG9kJXIKe6",
//       },
//     });
//     console.log(response);
//     const data = response.data;

//     if (response.data.status !== "success" || !response || !response.status) {
//       return res.internalServerError({ message: "External booking failed" });
//     }

//     // Map packages
//     const packages = data.packages.map((pkg) => ({
//       packageId: pkg.id,
//       name: pkg.name,
//       code: pkg.code,
//       price: pkg.package_price,
//       offer_price: pkg.offer_price,
//       tests: pkg.test?.map((t) => ({
//         testId: t.id,
//         name: t.name,
//         code: t.code,
//         description: t.description,
//       })),
//     }));

//     const slot = data.slot_time
//       ? { slotId: data.slot_time.id, slotTime: data.slot_time.slot }
//       : {};

//     const customer = {
//       name: data.customer_name,
//       age: data.customer_age,
//       gender: data.customer_gender,
//       email: data.customer_email,
//       phone: data.customer_phonenumber,
//       whatsapp: data.customer_whatsapppnumber,
//       address: data.customer_address,
//       landmark: data.customer_landmark,
//       aadhar: data.customer_aadhar,
//       pincode: data.pincode,
//     };

//     // const bookingPayload = {
//     //   userId: req.user._id || req.user.id,
//     //   bookingId: data.booking_id,
//     //   packages,
//     //   slot,
//     //   bookingDate: data.booking_date,
//     //   collectionDate: data.collection_date,
//     //   customer,
//     //   totalAmount: data.discounted_price?.final_total_price || 0,
//     //   discountedPrice: data.discounted_price || {},
//     //   bookingStatus: data.booking_status,
//     //   paymentStatus: !data.is_credit ? "pending" : "paid",
//     //   pickup: {
//     //     date: data.pickup_date,
//     //     time: data.pickup_time,
//     //     receiveAmount: data.pickup_receive_amount,
//     //   },
//     //   isActive: true,
//     //   isDeleted: false,
//     //   paymentId: order.id,
//     // };
//     // console.log("payload", bookingPayload);
//     const bookingPayload = {
//       userId: req.user._id || req.user.id,
//       bookingId: data.booking_id,
//       packages,
//       slot,
//       bookingDate: data.booking_date,
//       collectionDate: data.collection_date,
//       customer,

//       totalAmount:
//         req.body.discounted_price ||
//         data.discounted_price?.final_total_price ||
//         0,
//       discountedPrice: {
//         ...data.discounted_price,
//         total_price_package:
//           req.body.discounted_price ||
//           data.discounted_price?.total_price_package ||
//           0,
//       },
//       bookingStatus: data.booking_status,
//       paymentStatus: !data.is_credit ? "pending" : "paid",
//       pickup: {
//         date: data.pickup_date,
//         time: data.pickup_time,
//         receiveAmount: data.pickup_receive_amount,
//       },
//       isActive: true,
//       isDeleted: false,
//       paymentId: order.id,
//     };
//     console.log("payload", bookingPayload);

//     const newBooking = await Booking.create(bookingPayload);

//     return res.success({
//       message: "Booking created successfully",
//       data: {
//         order,
//       },
//     });
//   } catch (err) {
//     console.log(err);
//     return res.internalServerError();
//   }
// };

// /**
//  * verify payment
//  * create payment
//  */
// const paymentVerify = async (req, res) => {
//   const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
//     req.body;
//   console.log(req.body, "this is verify");
//   const body = razorpay_order_id + "|" + razorpay_payment_id;
//   const expectedSignature = crypto
//     .createHmac(
//       "sha256",
//       process.env.RAZORPAY_API_SECRET || "fvo64FVRfeMGCZpMnyul80H3"
//     )
//     .update(body.toString())
//     .digest("hex");
//   const isAuthentic = expectedSignature === razorpay_signature;
//   if (isAuthentic) {
//     try {
//       let dataToCreate = {
//         order_id: razorpay_order_id,
//         payment_id: razorpay_payment_id,
//         signature: razorpay_signature,
//       };
//       dataToCreate.paymentStatus = "success";
//       dataToCreate = new Payment(dataToCreate);
//       let foundOrder = await dbServiceFindOne(Payment, {
//         order_id: razorpay_order_id,
//       });
//       if (!foundOrder) {
//         let createdPayment = await dbServiceCreate(Payment, dataToCreate);

//         // update booking paymentId
//         const booking = await dbServiceUpdateOne(
//           Booking,
//           { paymentId: razorpay_order_id },
//           { paymentId: createdPayment.id, paymentStatus: "paid" }
//         );
//         console.log("booking", booking);
//         res.redirect(
//           `${process.env.RAZORPAY_REDIRECTURL}/${createdPayment.id}`
//         );
//       } else {
//         res.redirect(`${process.env.RAZORPAY_ERRORURL}`);
//       }
//     } catch (error) {
//       res.redirect(`${process.env.RAZORPAY_ERRORURL}`);
//     }
//   } else {
//     res.redirect(`${process.env.RAZORPAY_ERRORURL}`);
//   }
// };

// /**
//  * @description : create document of Payment in mongodb collection.
//  * @param {Object} req : request including body for creating document.
//  * @param {Object} res : response of created document
//  * @return {Object} : created Payment. {status, message, data}
//  */
// const addPayment = async (req, res) => {
//   try {
//     let dataToCreate = { ...(req.body || {}) };
//     let validateRequest = validation.validateParamsWithJoi(
//       dataToCreate,
//       paymentSchemaKey.schemaKeys
//     );
//     if (!validateRequest.isValid) {
//       return res.validationError({
//         message: `Invalid values in parameters, ${validateRequest.message}`,
//       });
//     }
//     dataToCreate.addedBy = req.user.id;
//     dataToCreate = new Payment(dataToCreate);
//     let createdPayment = await dbService.create(Payment, dataToCreate);
//     return res.success({ data: createdPayment });
//   } catch (error) {
//     return res.internalServerError({ message: error.message });
//   }
// };

// /**
//  * @description : find all documents of Payment from collection based on query and options.
//  * @param {Object} req : request including option and query. {query, options : {page, limit, pagination, populate}, isCountOnly}
//  * @param {Object} res : response contains data found from collection.
//  * @return {Object} : found Payment(s). {status, message, data}
//  */
// const findAllPayment = async (req, res) => {
//   try {
//     let options = {};
//     let query = {};
//     let validateRequest = validation.validateFilterWithJoi(
//       req.body,
//       paymentSchemaKey.findFilterKeys,
//       Payment.schema.obj
//     );
//     if (!validateRequest.isValid) {
//       return res.validationError({ message: `${validateRequest.message}` });
//     }
//     if (typeof req.body.query === "object" && req.body.query !== null) {
//       query = { ...req.body.query };
//     }
//     if (req.body.isCountOnly) {
//       let totalRecords = await dbService.count(Payment, query);
//       return res.success({ data: { totalRecords } });
//     }
//     if (
//       req.body &&
//       typeof req.body.options === "object" &&
//       req.body.options !== null
//     ) {
//       options = { ...req.body.options };
//     }
//     let foundPayments = await dbService.paginate(Payment, query, options);
//     if (!foundPayments || !foundPayments.data || !foundPayments.data.length) {
//       return res.recordNotFound();
//     }
//     return res.success({ data: foundPayments });
//   } catch (error) {
//     return res.internalServerError({ message: error.message });
//   }
// };

// /**
//  * @description : find document of Payment from table by id;
//  * @param {Object} req : request including id in request params.
//  * @param {Object} res : response contains document retrieved from table.
//  * @return {Object} : found Payment. {status, message, data}
//  */
// const getPayment = async (req, res) => {
//   try {
//     let query = {};
//     if (!ObjectId.isValid(req.params.id)) {
//       return res.validationError({ message: "invalid objectId." });
//     }
//     query._id = req.params.id;
//     let options = {};
//     let foundPayment = await dbService.findOne(Payment, query, options);
//     if (!foundPayment) {
//       return res.recordNotFound();
//     }
//     return res.success({ data: foundPayment });
//   } catch (error) {
//     return res.internalServerError({ message: error.message });
//   }
// };

// export { addPayment, findAllPayment, getPayment, checkout, paymentVerify };
/**
 * PaymentController.js
 * @description : exports action methods for Payment.
 */

import { instance } from "../../../services/razorpay.service.js";
import crypto from "crypto";
import { payment as Payment } from "../../../models/payments.model.js";
import {
  dbServiceCreate,
  dbServiceFindOne,
  dbServiceUpdateOne,
} from "../../../db/dbServices.js";
import { Booking } from "../../../models/booking.model.js";
import joi from "joi";
import axios from "axios";

/**
 * checkout payment
 */
const checkout = async (req, res) => {
  console.log(req.body, "this is checkout");

  const options = {
    amount: req.body.amount,
    currency: req.body.currency,
  };

  try {
    const order = await instance.orders.create(options);
    console.log(req.body, "this is createExternalBooking");

    const schema = joi
      .object({
        booking_date: joi
          .string()
          .pattern(/^\d{4}-\d{2}-\d{2}$/)
          .required(),
        collection_slot: joi.number().required(),
        package_code: joi
          .alternatives()
          .try(joi.string(), joi.array().items(joi.string()))
          .required(),
        customer_phonenumber: joi
          .string()
          .pattern(/^[6-9]\d{9}$/)
          .required(),
        customer_whatsapppnumber: joi
          .string()
          .pattern(/^[6-9]\d{9}$/)
          .required(),

        // ✅ FIXED: accept both string and number
        customer_latitude: joi
          .alternatives()
          .try(joi.number(), joi.string())
          .required(),
        customer_longitude: joi
          .alternatives()
          .try(joi.number(), joi.string())
          .required(),

        customer_name: joi.string().min(3).max(30).required(),
        pincode: joi
          .string()
          .pattern(/^\d{6}$/)
          .required(),
        is_credit: joi.boolean().required(),
        customer_gender: joi
          .string()
          .valid("male", "female", "Male", "Female")
          .required(),
        customer_landmark: joi.string().allow(""),
        customer_address: joi.string().required(),
        customer_email: joi.string().email().optional(),
      })
      .unknown(true);

    const { error } = schema.validate(req.body);
    console.log(error, "this is error");
    if (error) return res.validationError({ message: error.message });

    const url = `${process.env.EXTERNAL_API_BASE_URL}/api/external/v2/center-create-booking/`;
    console.log(url, "this is url");

    const response = await axios.post(url, req.body, {
      headers: {
        key: "h3r7aRrq7AchshiXhCTvGOkG9kJXIKe6",
      },
    });

    // ✅ Safety check for external API response
    if (!response || !response.data) {
      throw new Error("External API did not respond properly");
    }

    const data = response.data;

    if (data.status !== "success") {
      throw new Error("External booking failed");
    }

    // ✅ Safely handle undefined packages
    const packages = Array.isArray(data.packages)
      ? data.packages.map((pkg) => ({
          packageId: pkg.id,
          name: pkg.name,
          code: pkg.code,
          price: pkg.package_price,
          offer_price: pkg.offer_price,
          tests: Array.isArray(pkg.test)
            ? pkg.test.map((t) => ({
                testId: t.id,
                name: t.name,
                code: t.code,
                description: t.description,
              }))
            : [],
        }))
      : [];

    const slot = data.slot_time
      ? { slotId: data.slot_time.id, slotTime: data.slot_time.slot }
      : {};

    const customer = {
      name: data.customer_name,
      age: data.customer_age,
      gender: data.customer_gender,
      email: data.customer_email,
      phone: data.customer_phonenumber,
      whatsapp: data.customer_whatsapppnumber,
      address: data.customer_address,
      landmark: data.customer_landmark,
      aadhar: data.customer_aadhar,
      pincode: data.pincode,
    };

    const bookingPayload = {
      userId: req.user._id || req.user.id,
      bookingId: data.booking_id,
      packages,
      slot,
      bookingDate: data.booking_date,
      collectionDate: data.collection_date,
      customer,
      totalAmount:
        req.body.discounted_price ||
        data.discounted_price?.final_total_price ||
        0,
      discountedPrice: {
        ...data.discounted_price,
        total_price_package:
          req.body.discounted_price ||
          data.discounted_price?.total_price_package ||
          0,
      },
      bookingStatus: data.booking_status,
      paymentStatus: !data.is_credit ? "pending" : "paid",
      pickup: {
        date: data.pickup_date,
        time: data.pickup_time,
        receiveAmount: data.pickup_receive_amount,
      },
      isActive: true,
      isDeleted: false,
      paymentId: order.id,
    };

    console.log("payload", bookingPayload);

    const newBooking = await Booking.create(bookingPayload);

    return res.success({
      message: "Booking created successfully",
      data: { order },
    });
  } catch (err) {
    // ✅ Detailed error logging
    console.error("Checkout Error:", err.message);
    console.error(err.stack);
    return res.internalServerError({ message: err.message });
  }
};

/**
 * verify payment
 * create payment
 */
const paymentVerify = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;
  console.log(req.body, "this is verify");
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac(
      "sha256",
      process.env.RAZORPAY_API_SECRET || "fvo64FVRfeMGCZpMnyul80H3"
    )
    .update(body.toString())
    .digest("hex");
  const isAuthentic = expectedSignature === razorpay_signature;
  if (isAuthentic) {
    try {
      let dataToCreate = {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        signature: razorpay_signature,
      };
      dataToCreate.paymentStatus = "success";
      dataToCreate = new Payment(dataToCreate);
      let foundOrder = await dbServiceFindOne(Payment, {
        order_id: razorpay_order_id,
      });
      if (!foundOrder) {
        let createdPayment = await dbServiceCreate(Payment, dataToCreate);

        // update booking paymentId
        const booking = await dbServiceUpdateOne(
          Booking,
          { paymentId: razorpay_order_id },
          { paymentId: createdPayment.id, paymentStatus: "paid" }
        );
        console.log("booking", booking);
        res.redirect(
          `${process.env.RAZORPAY_REDIRECTURL}/${createdPayment.id}`
        );
      } else {
        res.redirect(`${process.env.RAZORPAY_ERRORURL}`);
      }
    } catch (error) {
      console.error("Payment verify error:", error.message);
      res.redirect(`${process.env.RAZORPAY_ERRORURL}`);
    }
  } else {
    res.redirect(`${process.env.RAZORPAY_ERRORURL}`);
  }
};

/**
 * @description : create document of Payment in mongodb collection.
 */
const addPayment = async (req, res) => {
  try {
    let dataToCreate = { ...(req.body || {}) };
    let validateRequest = validation.validateParamsWithJoi(
      dataToCreate,
      paymentSchemaKey.schemaKeys
    );
    if (!validateRequest.isValid) {
      return res.validationError({
        message: `Invalid values in parameters, ${validateRequest.message}`,
      });
    }
    dataToCreate.addedBy = req.user.id;
    dataToCreate = new Payment(dataToCreate);
    let createdPayment = await dbService.create(Payment, dataToCreate);
    return res.success({ data: createdPayment });
  } catch (error) {
    console.error("Add Payment Error:", error.message);
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : find all documents of Payment.
 */
const findAllPayment = async (req, res) => {
  try {
    let options = {};
    let query = {};
    let validateRequest = validation.validateFilterWithJoi(
      req.body,
      paymentSchemaKey.findFilterKeys,
      Payment.schema.obj
    );
    if (!validateRequest.isValid) {
      return res.validationError({ message: `${validateRequest.message}` });
    }
    if (typeof req.body.query === "object" && req.body.query !== null) {
      query = { ...req.body.query };
    }
    if (req.body.isCountOnly) {
      let totalRecords = await dbService.count(Payment, query);
      return res.success({ data: { totalRecords } });
    }
    if (
      req.body &&
      typeof req.body.options === "object" &&
      req.body.options !== null
    ) {
      options = { ...req.body.options };
    }
    let foundPayments = await dbService.paginate(Payment, query, options);
    if (!foundPayments || !foundPayments.data || !foundPayments.data.length) {
      return res.recordNotFound();
    }
    return res.success({ data: foundPayments });
  } catch (error) {
    console.error("Find All Payment Error:", error.message);
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : find document of Payment by id;
 */
const getPayment = async (req, res) => {
  try {
    let query = {};
    if (!ObjectId.isValid(req.params.id)) {
      return res.validationError({ message: "invalid objectId." });
    }
    query._id = req.params.id;
    let options = {};
    let foundPayment = await dbService.findOne(Payment, query, options);
    if (!foundPayment) {
      return res.recordNotFound();
    }
    return res.success({ data: foundPayment });
  } catch (error) {
    console.error("Get Payment Error:", error.message);
    return res.internalServerError({ message: error.message });
  }
};

export { addPayment, findAllPayment, getPayment, checkout, paymentVerify };
