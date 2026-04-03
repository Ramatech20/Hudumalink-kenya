import { toast } from "sonner";

export enum ErrorType {
  API = "API",
  NETWORK = "NETWORK",
  VALIDATION = "VALIDATION",
  FIRESTORE = "FIRESTORE",
  AUTH = "AUTH",
  UNKNOWN = "UNKNOWN",
}

export interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  originalError?: any;
}

/**
 * Handles API errors from fetch responses.
 * Parses the response body for error messages and displays a toast.
 */
export const handleApiError = async (response: Response, customMessage?: string): Promise<AppError> => {
  let errorMessage = customMessage || "An error occurred during the API request.";
  let details = null;

  try {
    const data = await response.json();
    // Common error fields in various APIs
    errorMessage = data.message || data.error || data.ResponseDescription || data.errorMessage || errorMessage;
    details = data;
  } catch (e) {
    // If response is not JSON, use status text or a default
    if (response.status === 404) errorMessage = "Resource not found.";
    else if (response.status === 401) errorMessage = "Unauthorized. Please login again.";
    else if (response.status === 403) errorMessage = "Forbidden. You don't have permission.";
    else if (response.status >= 500) errorMessage = "Server error. Please try again later.";
    else errorMessage = response.statusText || errorMessage;
  }

  const error: AppError = {
    type: ErrorType.API,
    message: errorMessage,
    details,
  };

  console.error(`[API Error] ${response.status}: ${errorMessage}`, details);
  toast.error(errorMessage);
  return error;
};

/**
 * Handles network-related errors (e.g., failed to fetch).
 */
export const handleNetworkError = (error: any): AppError => {
  const isOffline = !navigator.onLine;
  const errorMessage = isOffline 
    ? "You are offline. Please check your internet connection." 
    : "Network error. Unable to connect to the server.";
  
  const appError: AppError = {
    type: ErrorType.NETWORK,
    message: errorMessage,
    originalError: error,
  };

  console.error("[Network Error]", error);
  toast.error(errorMessage);
  return appError;
};

/**
 * Handles validation errors (e.g., form validation).
 */
export const handleValidationError = (message: string): AppError => {
  const appError: AppError = {
    type: ErrorType.VALIDATION,
    message,
  };

  toast.error(message);
  return appError;
};

/**
 * Handles general errors and unexpected exceptions.
 */
export const handleGeneralError = (error: any, customMessage?: string): AppError => {
  const message = customMessage || error.message || "An unexpected error occurred.";
  const appError: AppError = {
    type: ErrorType.UNKNOWN,
    message,
    originalError: error,
  };

  console.error("[General Error]", error);
  toast.error(message);
  return appError;
};

/**
 * Handles authentication errors.
 */
export const handleAuthError = (error: any): AppError => {
  let message = "Authentication failed.";
  
  if (error.code) {
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        message = "Invalid email or password.";
        break;
      case 'auth/email-already-in-use':
        message = "This email is already registered.";
        break;
      case 'auth/weak-password':
        message = "Password is too weak.";
        break;
      case 'auth/invalid-email':
        message = "Invalid email address.";
        break;
      case 'auth/popup-closed-by-user':
        message = "Sign-in popup was closed before completion.";
        break;
      default:
        message = error.message || message;
    }
  }

  const appError: AppError = {
    type: ErrorType.AUTH,
    message,
    originalError: error,
  };

  console.error("[Auth Error]", error);
  toast.error(message);
  return appError;
};
