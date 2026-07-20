export const successResponse = (data, message = 'Operation successful') => ({
  success: true,
  message,
  data,
});

export const errorResponse = (message) => ({
  success: false,
  message,
});
