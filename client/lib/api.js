const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://myshop-api-z6mr.onrender.com";

export async function apiFetch(
  endpoint,
  options = {}
) {
  try {
    // Get current JWT token
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token")
        : null;

    // Build headers
    const headers = {
      "Content-Type": "application/json",

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),

      ...(options.headers || {}),
    };

    // API request
    const res = await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,
        headers,
      }
    );

    // Read response
    const contentType =
      res.headers.get("content-type") || "";

    let data;

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      data = await res.json();
    } else {
      const text = await res.text();

      data = {
        message:
          text || "Request failed",
      };
    }

    // Handle HTTP errors
    if (!res.ok) {
      if (
        res.status === 401 &&
        typeof window !== "undefined"
      ) {
        const message =
          data?.message || "";

        const lowerMessage =
          message.toLowerCase();

        // Clear invalid/expired login
        if (
          lowerMessage.includes(
            "jwt expired"
          ) ||
          lowerMessage.includes(
            "jwt malformed"
          ) ||
          lowerMessage.includes(
            "invalid token"
          ) ||
          lowerMessage.includes(
            "invalid signature"
          ) ||
          lowerMessage.includes(
            "not authorized"
          ) ||
          lowerMessage.includes(
            "unauthorized"
          )
        ) {
          localStorage.removeItem(
            "token"
          );

          localStorage.removeItem(
            "user"
          );
        }
      }

      throw new Error(
        data?.message ||
          "Request failed"
      );
    }

    return data;
  } catch (error) {
    // Network error
    if (
      error instanceof TypeError
    ) {
      throw new Error(
        "Unable to connect to the server. Please try again."
      );
    }

    throw error;
  }
}