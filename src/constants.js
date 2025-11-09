export const DB_NAME = "gogeneric_db1";

export const USER_TYPES = {
  User: 1,
  Admin: 2,
};

export const PLATFORM = {
  USERAPP: 1,
  ADMINAPP: 2,
};

export let LOGIN_ACCESS = {
  [USER_TYPES.User]: [PLATFORM.USERAPP],
  [USER_TYPES.Admin]: [PLATFORM.ADMINAPP],
};

// Auth Constants
export const MAX_LOGIN_RETRY_LIMIT = 5;
export const LOGIN_REACTIVE_TIME = 2;

export const JWT = {
  USERAPP_SECRET: "myjwtuserappsecret",
  ADMINAPP_SECRET: "myjwtadminappsecret",
  EXPIRES_IN: 10000,
};
