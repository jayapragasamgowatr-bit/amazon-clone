export async function apiFetch(
  endpoint,
  options = {}
) {
  const API_URL =
    "http://localhost:5000";

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type":
          "application/json",
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
        ...(options.headers || {}),
      },
    }
  );

  const contentType =
    response.headers.get(
      "content-type"
    );

  if (
    !contentType ||
    !contentType.includes(
      "application/json"
    )
  ) {
    const text =
      await response.text();

    console.error(
      "NON JSON RESPONSE:",
      text
    );

    throw new Error(
      `Expected JSON but got ${contentType}`
    );
  }

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Request failed"
    );
  }

  return data;
}