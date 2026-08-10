const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://myshop-api-z6mr.onrender.com";

export async function apiFetch(endpoint, options = {}) {
  try {
    // Get token from localStorage
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token")
        : null;

    // Create headers
    const headers = {
      "Content-Type": "application/json",

      ...(token && {
        Authorization: `Bearer ${token}`,
      }),

      ...(options.headers || {}),
    };

    // Make API request
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Read response content type
    const contentType =
      res.headers.get("content-type") || "";

    let data;

    // JSON response
    if (contentType.includes("application/json")) {
      data = await res.json();
    }

    // Non-JSON response
    else {
      const text = await res.text();

      data = {
        message: text || "Request failed",
      };
    }

    // Handle errors
    if (!res.ok) {
      // Unauthorized
      if (
        res.status === 401 &&
        typeof window !== "undefined"
      ) {
        const message = data.message || "";

        const lowerMessage =
          message.toLowerCase();

        // Remove expired/invalid login
        if (
          lowerMessage.includes("jwt expired") ||
          lowerMessage.includes("jwt malformed") ||
          lowerMessage.includes("invalid token") ||
          lowerMessage.includes("not authorized") ||
          lowerMessage.includes("unauthorized")
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }

      throw new Error(
        data.message || "Request failed"
      );
    }

    // Successful response
    return data;

  } catch (error) {
    // Network error
    if (
      error instanceof TypeError &&
      error.message
        .toLowerCase()
        .includes("fetch")
    ) {
      throw new Error(
        "Unable to connect to the server. Please try again."
      );
    }

    // Pass API error to caller
    throw error;
  }
}