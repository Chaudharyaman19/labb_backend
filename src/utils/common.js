import * as dbServices from "../db/dbServices.js";
/**
 * convertObjectToEnum : converts object to enum
 * @param {Object} obj : object to be converted
 * @return {Array} : converted Array
 */

export const convertObjectToEnum = (obj) => {
  const enumArr = [];
  Object.values(obj).map((val) => enumArr.push(val));
  return enumArr;
};

export const checkUniqueFieldsInDatabase = async (
  model,
  fieldsToCheck,
  data,
  operation,
  filter = {}
) => {
  switch (operation) {
    case "REGISTER":
      for (const field of fieldsToCheck) {
        // Add unique field and it's value in filter.
        let query;

        query = {
          ...filter,
          [field]: data[field],
        };

        console.log("query", query);
        let found = await dbServices.dbServiceFindOne(model, query, {});
        console.log("found", found);
        if (found) {
          return {
            isDuplicate: true,
            field: field,
            value: data[field],
          };
        }
      }
      break;
    default:
      return { isDuplicate: false };
      break;
  }
  return { isDuplicate: false };
};

// export default {
//     checkUniqueFieldsInDatabase,
//     convertObjectToEnum
// }
