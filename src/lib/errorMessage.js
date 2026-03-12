export function getErrorMessage(error, fallback = "Something went wrong") {
  if (error instanceof Error && error.message) return error.message;

  if (error && typeof error === "object") {
    const maybeError = error;
    if (typeof maybeError.message === "string" && maybeError.message.trim()) {
      return maybeError.message;
    }
    if (typeof maybeError.error_description === "string" && maybeError.error_description.trim()) {
      return maybeError.error_description;
    }
    if (typeof maybeError.details === "string" && maybeError.details.trim()) {
      return maybeError.details;
    }
  }

  return fallback;
}