export const signupEmailVerify = (
  USER_NAME: string,
  OTP_CODE: string,
  OTP_EXPIRY: string = "10 minutes"
): { id: string; variables: { [key: string]: string | number } } => {
  return {
    id: "signup-email-verify",
    variables: {
      USER_NAME,
      OTP_CODE,
      OTP_EXPIRY,
    },
  };
};

export const welcome = (
  USER_NAME: string
): { id: string; variables: { [key: string]: string | number } } => {
  return {
    id: "welcome",
    variables: {
      USER_NAME,
    },
  };
};

export const newRestaurant = (
  USER_NAME: string,
  RESTAURANT_NAME: string,
  RESTAURANT_SLUG: string
): { id: string; variables: { [key: string]: string | number } } => {
  return {
    id: "new-restaurant",
    variables: {
      USER_NAME,
      RESTAURANT_NAME,
      RESTAURANT_SLUG,
    },
  };
};

export const inviteStaff = (
  RESTAURANT_NAME: string,
  ROLE: string,
  INVITATION_LINK: string,
  EXPIRY_DATE: string,
  INVITER_NAME: string
): { id: string; variables: { [key: string]: string | number } } => {
  return {
    id: "invitation-to-join-restaurant",
    variables: {
      RESTAURANT_NAME,
      ROLE,
      INVITATION_LINK,
      EXPIRY_DATE,
      INVITER_NAME,
    },
  };
};

export const passwordUpdateRequest = (
  USER_NAME: string,
  OTP_CODE: string,
  OTP_EXPIRY: string = "10 minutes"
): { id: string; variables: { [key: string]: string | number } } => {
  return {
    id: "confirm-password-change",
    variables: {
      USER_NAME,
      OTP_CODE,
      OTP_EXPIRY,
    },
  };
};

export const passwordUpdateSuccess = (
  USER_NAME: string
): { id: string; variables: { [key: string]: string | number } } => {
  return {
    id: "password-updated-successfully",
    variables: {
      USER_NAME,
    },
  };
};

export const verifyNewEmail = (
  USER_NAME: string,
  OTP_CODE: string,
  OTP_EXPIRY: string = "10 minutes"
): { id: string; variables: { [key: string]: string | number } } => {
  return {
    id: "verify-new-email",
    variables: {
      USER_NAME,
      OTP_CODE,
      OTP_EXPIRY,
    },
  };
};

export const verifyCurrentEmail = (
  USER_NAME: string,
  OTP_CODE: string,
  OTP_EXPIRY: string = "10 minutes"
): { id: string; variables: { [key: string]: string | number } } => {
  return {
    id: "confirm-email-change",
    variables: {
      USER_NAME,
      OTP_CODE,
      OTP_EXPIRY,
    },
  };
};

export const emailUpdateSuccess = (
  USER_NAME: string,
  NEW_EMAIL: string,
  OLD_EMAIL: string
): { id: string; variables: { [key: string]: string | number } } => {
  return {
    id: "email-updated-successfully",
    variables: {
      USER_NAME,
      NEW_EMAIL,
      OLD_EMAIL,
    },
  };
};

export const newLoginDevice = (
  USER_NAME: string,
  DEVICE: string,
  LOCATION: string
): { id: string; variables: { [key: string]: string | number } } => {
  return {
    id: "new-login",
    variables: {
      USER_NAME,
      DEVICE,
      LOCATION,
    },
  };
};
