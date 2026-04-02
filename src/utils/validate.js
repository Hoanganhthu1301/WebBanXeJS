const formatErrorList = (errors) => {
  if (errors.length === 1) return errors[0];
  if (errors.length === 2) return `${errors[0]} và ${errors[1]}`;

  return `${errors.slice(0, -1).join(', ')} và ${errors[errors.length - 1]}`;
};

const validatePassword = (password) => {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push('ít nhất 8 ký tự');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('ít nhất 1 chữ hoa');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('ít nhất 1 chữ thường');
  }

  if (!/\d/.test(password)) {
    errors.push('ít nhất 1 số');
  }

  if (!/[^\w\s]/.test(password)) {
    errors.push('ít nhất 1 ký tự đặc biệt');
  }

  return {
    isValid: errors.length === 0,
    errors,
    message: formatErrorList(errors)
  };
};

module.exports = {
  validatePassword
};