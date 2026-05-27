const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://myshop-api-z6mr.onrender.com";

export async function apiFetch(
  endpoint,
  options = {}
) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const headers = {
    "Content-Type": "application/json",
    ...(token && {
      Authorization: `Bearer ${token}`,
    }),
    ...(options.headers || {}),
  };

  const res = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  const contentType =
    res.headers.get("content-type");

  if (
    contentType &&
    contentType.includes("application/json")
  ) {
    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.message || "Request failed"
      );
    }

    return data;
  }

  throw new Error("Expected JSON response");
}