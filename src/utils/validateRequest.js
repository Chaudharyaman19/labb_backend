/**
 * @description : validate request body parameter with joi.
 * @param {Object} payload : body from request.
 * @param {Object} schemaKeys : model wise schema keys. ex. user validation.
 * @returns : returns validation with message {isValid, message}
 */
export const validateParamsWithJoi = (payload, schemaKeys) => {
  console.log("payload", payload);
  const { error } = schemaKeys.validate(payload);
  console.log("error", error);
  if (error) {
    const message = error.details.map((el) => el.message).join("\n");
    return {
      isValid: false,
      message,
    };
  }
  return { isValid: true };
};
