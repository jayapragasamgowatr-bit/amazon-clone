// ============================================================
// API CONFIG
// ============================================================

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

// ============================================================
// GET TOKEN
// ============================================================

const REQUEST_TIMEOUT_MS = 20000;

const getToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem("token");
  } catch (error) {
    console.error("TOKEN READ ERROR:", error);
    return null;
  }
};

// ============================================================
// NORMALIZE ENDPOINT
// ============================================================

const normalizeEndpoint = (endpoint) => {
  if (!endpoint) {
    return "/";
  }

  let url = String(endpoint).trim();

  // If a complete backend URL was supplied,
  // remove the base URL.
  if (url.startsWith(API_BASE_URL)) {
    url = url.substring(API_BASE_URL.length);
  }

  // Remove leading slashes and add exactly one.
  url = "/" + url.replace(/^\/+/, "");

  return url;
};

// ============================================================
// API FETCH
// ============================================================

export const apiFetch = async (
  endpoint,
  options = {}
) => {
  const {
    method = "GET",
    auth = false,
    body,
    headers = {},
    ...restOptions
  } = options;

  const normalizedEndpoint =
    normalizeEndpoint(endpoint);

  const url =
    `${API_BASE_URL}${normalizedEndpoint}`;

  const token = getToken();

  // ==========================================================
  // HEADERS
  // ==========================================================

  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  // ==========================================================
  // BODY
  // ==========================================================

  let requestBody;

  if (
    body !== undefined &&
    body !== null
  ) {
    requestHeaders["Content-Type"] =
      "application/json";

    requestBody =
      typeof body === "string"
        ? body
        : JSON.stringify(body);
  }

  // ==========================================================
  // AUTHORIZATION
  // ==========================================================

  if (auth) {
    if (!token) {
      console.error(
        "AUTH ERROR: Authentication required but no token exists."
      );

      throw new Error(
        "Not authorized. Please login again."
      );
    }

    requestHeaders.Authorization =
      `Bearer ${token}`;
  }

  // ==========================================================
  // DEBUG
  // ==========================================================

  if (process.env.NODE_ENV !== "production") {
    console.debug("API REQUEST:", {
      method,
      endpoint: normalizedEndpoint,
      authenticated: Boolean(auth && token),
    });
  }

// ==========================================================
  // FETCH
  // ==========================================================

  let response;

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
      signal: controller.signal,
      ...restOptions,
    });
  } catch (error) {
    console.error("NETWORK ERROR:", error);

    if (error?.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }

    throw new Error(
      `Unable to connect to backend server. Make sure the backend is running on ${API_BASE_URL}.`
    );
  } finally {
    clearTimeout(timeoutId);
  }

  // ==========================================================
  // RESPONSE
  // ==========================================================

  let data = null;

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  try {
    if (
      contentType.includes(
        "application/json"
      )
    ) {
      data = await response.json();
    } else {
      const text =
        await response.text();

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = {
            message: text,
          };
        }
      }
    }
  } catch (error) {
    console.error(
      "RESPONSE PARSE ERROR:",
      error
    );

    data = null;
  }

  // ==========================================================
  // AUTHENTICATION FAILURE
  // ==========================================================

  if (
    response.status === 401 &&
    typeof window !== "undefined"
  ) {
    console.error(
      "401 UNAUTHORIZED:",
      data
    );

    // Remove invalid/expired token.
    localStorage.removeItem("token");
  }

  // ==========================================================
  // ERROR RESPONSE
  // ==========================================================

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      (
        Array.isArray(data?.errors)
          ? data.errors[0]?.message ||
            data.errors[0]
          : null
      ) ||
      `API request failed: ${response.status}`;

    console.error(
      "API ERROR:",
      response.status,
      message,
      url
    );

    throw new Error(message);
  }

  // ==========================================================
  // SUCCESS
  // ==========================================================

  return data;
};

// ============================================================
// AUTH
// ============================================================

// ============================================================
// REGISTER USER
// ============================================================

export const registerUser = async ({
  name,
  email,
  password,
}) => {
  return apiFetch(
    "/api/auth/register",
    {
      method: "POST",

      body: {
        name,
        email,
        password,
      },
    }
  );
};

// ============================================================
// LOGIN USER
// ============================================================

export const loginUser = async ({
  email,
  password,
}) => {
  const data =
    await apiFetch(
      "/api/auth/login",
      {
        method: "POST",

        body: {
          email,
          password,
        },
      }
    );

  // Save JWT.
  if (
    typeof window !== "undefined" &&
    data?.token
  ) {
    localStorage.setItem(
      "token",
      data.token
    );
  }

  return data;
};

// ============================================================
// LOGOUT USER
// ============================================================

export const logoutUser = () => {
  if (
    typeof window !== "undefined"
  ) {
    localStorage.removeItem(
      "token"
    );
  }
};

// ============================================================
// GET CURRENT USER
// ============================================================

export const getCurrentUser = async () => {
  return apiFetch(
    "/api/auth/me",
    {
      method: "GET",
      auth: true,
    }
  );
};

// ============================================================
// PRODUCTS
// ============================================================

// ============================================================
// GET PRODUCTS
// ============================================================

export const getProducts = async (
  params = {}
) => {
  const searchParams =
    new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        searchParams.set(
          key,
          String(value)
        );
      }
    }
  );

  const query =
    searchParams.toString();

  return apiFetch(
    `/api/products${
      query
        ? `?${query}`
        : ""
    }`,
    {
      method: "GET",
    }
  );
};

// ============================================================
// GET PRODUCT BY ID
// ============================================================

export const getProductById = async (
  id
) => {
  if (!id) {
    throw new Error(
      "Product ID is required"
    );
  }

  return apiFetch(
    `/api/products/${id}`,
    {
      method: "GET",
    }
  );
};

// ============================================================
// PRODUCT SUGGESTIONS
// ============================================================

export const getProductSuggestions =
  async (search = "") => {
    return apiFetch(
      `/api/products/suggestions?q=${encodeURIComponent(
        search
      )}`,
      {
        method: "GET",
      }
    );
  };

// ============================================================
// CREATE PRODUCT
// ============================================================

export const createProduct =
  async (productData) => {
    if (!productData) {
      throw new Error(
        "Product data is required"
      );
    }

    return apiFetch(
      "/api/products",
      {
        method: "POST",
        auth: true,
        body: productData,
      }
    );
  };

// ============================================================
// UPDATE PRODUCT
// ============================================================

export const updateProduct =
  async (
    id,
    productData
  ) => {
    if (!id) {
      throw new Error(
        "Product ID is required"
      );
    }

    if (!productData) {
      throw new Error(
        "Product data is required"
      );
    }

    return apiFetch(
      `/api/products/${id}`,
      {
        method: "PUT",
        auth: true,
        body: productData,
      }
    );
  };

// ============================================================
// DELETE PRODUCT
// ============================================================

export const deleteProduct =
  async (id) => {
    if (!id) {
      throw new Error(
        "Product ID is required"
      );
    }

    return apiFetch(
      `/api/products/${id}`,
      {
        method: "DELETE",
        auth: true,
      }
    );
  };

// ============================================================
// ADMIN PRODUCT MANAGEMENT
// ============================================================

export const getAdminProducts = async (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();

  return apiFetch(
    `/api/products/admin/list${query ? `?${query}` : ""}`,
    {
      method: "GET",
      auth: true,
    }
  );
};

export const getInventory = async (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return apiFetch(`/api/products/admin/inventory${query ? `?${query}` : ""}`, { method: "GET", auth: true });
};

export const getInventoryHistory = async (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return apiFetch(`/api/products/admin/inventory/history${query ? `?${query}` : ""}`, { method: "GET", auth: true });
};

export const updateProductReview = async (productId, reviewId, reviewData = {}) => {
  if (!productId) throw new Error("Product ID is required");
  if (!reviewId) throw new Error("Review ID is required");

  const rating = Number(reviewData.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  const comment = String(reviewData.comment || "").trim();
  if (comment.length > 1000) {
    throw new Error("Review comment cannot exceed 1000 characters.");
  }

  return apiFetch(`/api/products/${productId}/reviews/${reviewId}`, {
    method: "PUT",
    auth: true,
    body: { rating, comment },
  });
};

export const deleteProductReview = async (productId, reviewId) => {
  if (!productId) throw new Error("Product ID is required");
  if (!reviewId) throw new Error("Review ID is required");

  return apiFetch(`/api/products/${productId}/reviews/${reviewId}`, {
    method: "DELETE",
    auth: true,
  });
};

export const updateProductStock = async (id, countInStock) => {
  if (!id) throw new Error("Product ID is required");

  return apiFetch(`/api/products/admin/${id}/stock`, {
    method: "PUT",
    auth: true,
    body: { countInStock: Number(countInStock) },
  });
};

// ============================================================
// WISHLIST
// ============================================================

// ============================================================
// GET WISHLIST
// ============================================================

export const getWishlist =
  async () => {
    return apiFetch(
      "/api/wishlist",
      {
        method: "GET",
        auth: true,
      }
    );
  };

// ============================================================
// ADD TO WISHLIST
// ============================================================

export const addToWishlist =
  async (productId) => {
    if (!productId) {
      throw new Error(
        "Product ID is required"
      );
    }

    return apiFetch(
      "/api/wishlist",
      {
        method: "POST",
        auth: true,

        body: {
          productId,
        },
      }
    );
  };

// ============================================================
// REMOVE FROM WISHLIST
// ============================================================

export const removeFromWishlist =
  async (productId) => {
    if (!productId) {
      throw new Error(
        "Product ID is required"
      );
    }

    return apiFetch(
      `/api/wishlist/${productId}`,
      {
        method: "DELETE",
        auth: true,
      }
    );
  };

// ============================================================
// ORDERS
// ============================================================

// ============================================================
// CREATE ORDER
// POST /api/orders
// ============================================================

export const createOrder = async (orderData) => {
  if (!orderData || typeof orderData !== "object") {
    throw new Error("Order data is required");
  }

  if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
    throw new Error("Order must contain at least one item");
  }

  if (!orderData.shippingAddress || typeof orderData.shippingAddress !== "object") {
    throw new Error("Shipping address is required");
  }

  // Do not send client-calculated prices as trusted values.
  // The server recalculates price, shipping and total from MongoDB.
  const body = {
    items: orderData.items.map((item) => ({
      product: item.product || item._id,
      quantity: Number(item.quantity || 1),
    })),
    shippingAddress: {
      name: String(orderData.shippingAddress.name || "").trim(),
      email: String(orderData.shippingAddress.email || "").trim().toLowerCase(),
      phone: String(orderData.shippingAddress.phone || "").trim(),
      address: String(orderData.shippingAddress.address || "").trim(),
      city: String(orderData.shippingAddress.city || "").trim(),
      state: String(orderData.shippingAddress.state || "").trim(),
      postalCode: String(
        orderData.shippingAddress.postalCode ||
        orderData.shippingAddress.pincode ||
        ""
      ).trim(),
    },
    customer: {
      name: String(orderData.customer?.name || orderData.shippingAddress.name || "").trim(),
      email: String(orderData.customer?.email || orderData.shippingAddress.email || "").trim().toLowerCase(),
      phone: String(orderData.customer?.phone || orderData.shippingAddress.phone || "").trim(),
    },
    paymentMethod: "COD",
  };

  return apiFetch("/api/orders", {
    method: "POST",
    auth: true,
    body,
  });
};

// ============================================================
// GET MY ORDERS
// GET /api/orders/myorders
// ============================================================

export const getMyOrders = async (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();

  return apiFetch(
    `/api/orders/myorders${query ? `?${query}` : ""}`,
    {
      method: "GET",
      auth: true,
    }
  );
};

// ============================================================
// GET ALL ORDERS - ADMIN
// GET /api/orders
// ============================================================

export const getAllOrders = async (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();

  return apiFetch(
    `/api/orders${query ? `?${query}` : ""}`,
    {
      method: "GET",
      auth: true,
    }
  );
};

// ============================================================
// GET ADMIN ORDER ANALYTICS
// GET /api/orders/admin/analytics
// ============================================================

export const getAdminAnalytics = async (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();

  return apiFetch(
    `/api/orders/admin/analytics${query ? `?${query}` : ""}`,
    {
      method: "GET",
      auth: true,
    }
  );
};

// ============================================================
// GET SINGLE ORDER
// GET /api/orders/:id
// ============================================================

export const getOrderById =
  async (orderId) => {
    if (!orderId) {
      throw new Error(
        "Order ID is required"
      );
    }

    return apiFetch(
      `/api/orders/${orderId}`,
      {
        method: "GET",
        auth: true,
      }
    );
  };

// ============================================================
// UPDATE ORDER STATUS - ADMIN
// PUT /api/orders/:id/status
// ============================================================

export const updateOrderStatus =
  async (
    orderId,
    status,
    cancellationReason = ""
  ) => {
    if (!orderId) {
      throw new Error(
        "Order ID is required"
      );
    }

    if (!status) {
      throw new Error(
        "Order status is required"
      );
    }

    const allowedStatuses = [
      "Pending",
      "Confirmed",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    if (
      !allowedStatuses.includes(
        status
      )
    ) {
      throw new Error(
        "Invalid order status"
      );
    }

    const body = {
      status,
    };

    if (
      status === "Cancelled" &&
      cancellationReason
    ) {
      body.cancellationReason =
        cancellationReason;
    }

    return apiFetch(
      `/api/orders/${orderId}/status`,
      {
        method: "PUT",
        auth: true,
        body,
      }
    );
  };

// ============================================================
// DELETE ORDER - ADMIN
// DELETE /api/orders/:id
// ============================================================

export const deleteOrder =
  async (orderId) => {
    if (!orderId) {
      throw new Error(
        "Order ID is required"
      );
    }

    return apiFetch(
      `/api/orders/${orderId}`,
      {
        method: "DELETE",
        auth: true,
      }
    );
  };

// ============================================================
// USERS - ADMIN
// ============================================================

// ============================================================
// GET ALL USERS
// ============================================================

export const getUsers =
  async () => {
    return apiFetch(
      "/api/auth/users",
      {
        method: "GET",
        auth: true,
      }
    );
  };

// ============================================================
// GET USER BY ID
// ============================================================

export const getUserById =
  async (id) => {
    if (!id) {
      throw new Error(
        "User ID is required"
      );
    }

    return apiFetch(
      `/api/auth/users/${id}`,
      {
        method: "GET",
        auth: true,
      }
    );
  };

// ============================================================
// UPDATE USER ROLE
// ============================================================

export const updateUserRole =
  async (
    id,
    role
  ) => {
    if (!id) {
      throw new Error(
        "User ID is required"
      );
    }

    if (
      role !== "user" &&
      role !== "admin"
    ) {
      throw new Error(
        "Role must be user or admin"
      );
    }

    return apiFetch(
      `/api/auth/users/${id}/role`,
      {
        method: "PUT",
        auth: true,

        body: {
          role,
        },
      }
    );
  };

// ============================================================
// DELETE USER
// ============================================================

export const deleteUser =
  async (id) => {
    if (!id) {
      throw new Error(
        "User ID is required"
      );
    }

    return apiFetch(
      `/api/auth/users/${id}`,
      {
        method: "DELETE",
        auth: true,
      }
    );
  };

export const getAdvancedAnalytics = async (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch(`/api/orders/admin/advanced-analytics${suffix}`, { method: "GET", auth: true });
};

export const getEventAnalytics = async (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch(`/api/events/admin/analytics${suffix}`, { method: "GET", auth: true });
};

// ============================================================
// AI RECOMMENDATIONS
// ============================================================

export const getPersonalizedRecommendations = async (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return apiFetch(`/api/recommendations/personalized${query ? `?${query}` : ""}`, { method: "GET" });
};

export const getTrendingRecommendations = async (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return apiFetch(`/api/recommendations/trending${query ? `?${query}` : ""}`, { method: "GET" });
};

export const getSimilarRecommendations = async (productId, params = {}) => {
  if (!productId) throw new Error("Product ID is required");
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/api/recommendations/similar/${productId}${query ? `?${query}` : ""}`, { method: "GET" });
};

export const getFrequentlyBoughtRecommendations = async (productId, params = {}) => {
  if (!productId) throw new Error("Product ID is required");
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/api/recommendations/frequently-bought/${productId}${query ? `?${query}` : ""}`, { method: "GET" });
};

export const logRecommendationEvent = async ({ source, productId, action, sessionId, position = 0 }) => {
  if (!source || !productId || !action || !sessionId) return null;
  return apiFetch("/api/recommendations/events", {
    method: "POST",
    body: { source, productId, action, sessionId, position },
  }).catch(() => null);
};

export const getRecommendationAnalytics = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/api/recommendations/admin/analytics${query ? `?${query}` : ""}`, { method: "GET", auth: true });
};

// ============================================================
// ML-READY DEMAND FORECASTING
// ============================================================

export const getDemandForecast = async (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch(`/api/products/admin/demand-forecast${suffix}`, { method: "GET", auth: true });
};

// ============================================================
// PHASE 15-17: CUSTOMER INTELLIGENCE / AI ASSISTANT / COPILOT
// ============================================================
export const getCustomerIntelligence = async (userId, days = 90) => apiFetch(`/api/customer-intelligence/admin/customer?userId=${encodeURIComponent(userId)}&days=${encodeURIComponent(days)}`, { auth:true });
export const getCustomerIntelligenceSummary = async (days = 90) => apiFetch(`/api/customer-intelligence/admin/summary?days=${encodeURIComponent(days)}`, { auth:true });
export const askShoppingAssistant = async (message) => apiFetch("/api/ai/assistant", { method:"POST", body:{message}, auth:false });
export const getBusinessIntelligence = async (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch(`/api/ai/admin/business-intelligence${suffix}`, { auth: true });
};

export const askBusinessIntelligence = async (question, params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch(`/api/ai/admin/business-intelligence/ask${suffix}`, { method: "POST", auth: true, body: { question } });
};

export const getAdminCopilot = async () => apiFetch("/api/ai/admin/copilot", { auth:true });
export const getAdminCustomerAI = async (userId) => { if (!userId) throw new Error("User ID is required"); return apiFetch(`/api/ai/admin/customer/${encodeURIComponent(userId)}`, { auth:true }); };

// ============================================================
// PHASE 18: RISK / ANOMALY SIGNALS
// ============================================================
export const getRiskAnalysis = async (params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params || {}).forEach(([k,v]) => { if(v !== undefined && v !== null && v !== "") q.set(k,String(v)); });
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return apiFetch(`/api/risk/admin/analysis${suffix}`, { auth:true });
};
export const getRiskCustomer = async (query) => {
  if(!query) throw new Error("Customer email, phone, or user ID is required");
  return apiFetch(`/api/risk/admin/customer?q=${encodeURIComponent(query)}`, { auth:true });
};

export const getImageAudit = () => apiFetch('/api/image-intelligence/admin/audit', { auth: true });
export const inspectProductImage = (id) => apiFetch(`/api/image-intelligence/admin/product/${encodeURIComponent(id)}`, { auth: true });
export const getAuthenticityLedger = () => apiFetch('/api/authenticity/admin/ledger', { auth: true });
export const registerAuthenticity = (id) => apiFetch(`/api/authenticity/admin/register/${encodeURIComponent(id)}`, { method: 'POST', auth: true });
export const verifyAuthenticity = (id) => apiFetch(`/api/authenticity/verify/${encodeURIComponent(id)}`);

// ============================================================
// PHASE 22: AI AUTOMATION / ALERTS
// ============================================================
export const getAutomationAlerts = async (params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params || {}).forEach(([k,v]) => { if(v !== undefined && v !== null && v !== "") q.set(k,String(v)); });
  return apiFetch(`/api/automation/alerts${q.toString()?`?${q.toString()}`:""}`, {auth:true});
};
export const runAutomationScan = async () => apiFetch("/api/automation/scan", {method:"POST", auth:true});
export const resolveAutomationAlert = async (id) => apiFetch(`/api/automation/alerts/${encodeURIComponent(id)}/resolve`, {method:"PATCH", auth:true});

export const askAISupport = async (message) => apiFetch("/api/support", { method: "POST", body: { message }, auth: true });
