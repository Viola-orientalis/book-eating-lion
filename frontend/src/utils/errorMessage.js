export const getErrorMessage = (err, fallback) =>
  err.response?.data?.message || err.response?.data?.error || fallback
