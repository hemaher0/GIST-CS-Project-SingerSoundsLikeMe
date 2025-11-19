const EMAIL_REGEX = /\S+@\S+\.\S+/;

export const validateLoginInput = (email, password) => {
  if (!EMAIL_REGEX.test(email)) return "Invalid email format.";
  if (!password) return "Password cannot be empty.";
  return null;
};

export const validateRegisterInput = (email, password, name) => {
  if (!EMAIL_REGEX.test(email)) return "Invalid email format.";
  if (!password || !name) return "All fields are required.";
  return null;
};
