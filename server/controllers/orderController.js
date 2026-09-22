const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const InventoryTransaction = require("../models/InventoryTransaction");
const {
  sendOrderConfirmationEmail,
  sendAdminOrderNotification,
  sendOrderStatusEmail,
} = require("../utils/emailService");

const {
  ALLOWED_STATUSES,
  canTransitionStatus,
  shouldRestoreStockOnCancellation,
} = require("../utils/orderRules");

const MAX_ITEM_QUANTITY = 100;

const getUserId = (req) => req.user?._id;

const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isValidPhone = (value) => /^[0-9]{10}$/.test(value);

const isValidPincode = (value) => /^[0-9]{6}$/.test(value);

/*
 * Restore inventory for a list of reserved products.
 *
 * This helper is used inside transactions as well as for
 * defensive rollback logic where appropriate.
 */
const restoreReservedStock = async (
  reservedProducts,
  session = null
) => {
  for (const reserved of reservedProducts) {
    const options = session ? { session } : {};

    await Product.updateOne(
      {
        _id: reserved.productId,
      },
      {
        $inc: {
          countInStock: reserved.quantity,
        },
      },
      options
    );
  }
};

/*
 * Create Order
 *
 * IMPORTANT:
 * Product stock reservation and Order creation happen
 * inside ONE MongoDB transaction.
 *
 * If any operation fails:
 *
 *   Stock changes -> ROLLBACK
 *   Order creation -> ROLLBACK
 *
 * Therefore we cannot end up with:
 *
 *   stock decreased + no order
 *
 * or:
 *
 *   order created + stock not reserved
 */
const createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { items, shippingAddress, customer } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      });
    }

    if (items.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Too many different products in one order",
      });
    }

    if (!shippingAddress || typeof shippingAddress !== "object") {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    const customerName = String(
      shippingAddress.name ||
        customer?.name ||
        req.user.name ||
        ""
    ).trim();

    const customerEmail = String(
      shippingAddress.email ||
        customer?.email ||
        req.user.email ||
        ""
    )
      .trim()
      .toLowerCase();

    const customerPhone = String(
      shippingAddress.phone ||
        customer?.phone ||
        ""
    ).trim();

    const address = String(
      shippingAddress.address || ""
    ).trim();

    const city = String(
      shippingAddress.city || ""
    ).trim();

    const state = String(
      shippingAddress.state || ""
    ).trim();

    const postalCode = String(
      shippingAddress.postalCode ||
        shippingAddress.pincode ||
        ""
    ).trim();

    if (!customerName) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    if (customerName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Customer name is too long",
      });
    }

    if (!isValidEmail(customerEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    if (!isValidPhone(customerPhone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid 10-digit phone number",
      });
    }

    if (!address || address.length > 500) {
      return res.status(400).json({
        success: false,
        message: "A valid delivery address is required",
      });
    }

    if (!city || city.length > 100) {
      return res.status(400).json({
        success: false,
        message: "A valid city is required",
      });
    }

    if (!state || state.length > 100) {
      return res.status(400).json({
        success: false,
        message: "A valid state is required",
      });
    }

    if (!isValidPincode(postalCode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid 6-digit postal code",
      });
    }

    /*
     * Consolidate duplicate products.
     *
     * Example:
     *
     * Product A x 2
     * Product A x 3
     *
     * becomes:
     *
     * Product A x 5
     */
    const quantities = new Map();

    for (const item of items) {
      const productId = String(
        item?.product || ""
      ).trim();

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
      }

      const quantity = Number(
        item?.quantity
      );

      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > MAX_ITEM_QUANTITY
      ) {
        return res.status(400).json({
          success: false,
          message: `Quantity must be a whole number between 1 and ${MAX_ITEM_QUANTITY}`,
        });
      }

      quantities.set(
        productId,
        (quantities.get(productId) || 0) +
          quantity
      );
    }

    if (
      [...quantities.values()].some(
        (quantity) =>
          quantity > MAX_ITEM_QUANTITY
      )
    ) {
      return res.status(400).json({
        success: false,
        message: `Maximum quantity per product is ${MAX_ITEM_QUANTITY}`,
      });
    }

    let createdOrder = null;

    await session.withTransaction(async () => {
      const normalizedItems = [];
      const stockMovements = [];
      let subtotal = 0;

      /*
       * Reserve stock atomically.
       *
       * The countInStock >= quantity condition ensures
       * concurrent orders cannot reserve stock that
       * doesn't exist.
       */
      for (const [
        productId,
        quantity,
      ] of quantities) {
        const product =
          await Product.findOneAndUpdate(
            {
              _id: productId,

              $or: [
                {
                  isActive: true,
                },
                {
                  isActive: {
                    $exists: false,
                  },
                },
              ],

              countInStock: {
                $gte: quantity,
              },
            },
            {
              $inc: {
                countInStock: -quantity,
              },
            },
            {
              returnDocument: "after",
              session,
            }
          );

        if (!product) {
          const exists =
            await Product.exists(
              {
                _id: productId,

                $or: [
                  {
                    isActive: true,
                  },
                  {
                    isActive: {
                      $exists: false,
                    },
                  },
                ],
              },
              {
                session,
              }
            );

          const error = new Error(
            exists
              ? `Insufficient stock for ${productId}`
              : "Product not found or unavailable"
          );

          error.statusCode = exists
            ? 409
            : 404;

          throw error;
        }

        const price = Number(
          product.price
        );

        if (
          !Number.isFinite(price) ||
          price < 0
        ) {
          const error = new Error(
            "Product has an invalid price"
          );

          error.statusCode = 500;

          throw error;
        }

        subtotal +=
          price * quantity;

        normalizedItems.push({
          product: product._id,
          name: product.name,
          price,
          quantity,
          image:
            product.image || "",
        });

        stockMovements.push({
          product: product._id,
          quantityChange: -quantity,
          previousStock: Number(product.countInStock) + quantity,
          newStock: Number(product.countInStock),
        });
      }

      const shipping = 0;

      const totalPrice =
        subtotal + shipping;

      /*
       * Create the order in the SAME transaction.
       */
      const orders =
        await Order.create(
          [
            {
              user: userId,

              customer: {
                name: customerName,
                email: customerEmail,
                phone: customerPhone,
              },

              items: normalizedItems,

              shippingAddress: {
                name: customerName,
                email: customerEmail,
                phone: customerPhone,
                address,
                city,
                state,
                postalCode,
                pincode: postalCode,
              },

              paymentMethod: "COD",

              paymentStatus: "Pending",

              subtotal,

              shipping,

              totalPrice,

              status: "Pending",

              stockReserved: true,

              stockRestored: false,
            },
          ],
          {
            session,
          }
        );

      createdOrder = orders[0];

      if (stockMovements.length) {
        await InventoryTransaction.insertMany(
          stockMovements.map((movement) => ({
            ...movement,
            type: "OUT",
            reason: "Order placed",
            referenceType: "Order",
            referenceId: createdOrder._id,
            performedBy: userId,
          })),
          { session }
        );
      }
    });

    /*
     * Transaction committed successfully.
     *
     * Email happens AFTER commit so an email failure
     * cannot undo a successful order.
     */
    await createdOrder.populate(
      "user",
      "name email"
    );

    const emailResults =
      await Promise.allSettled([
        sendOrderConfirmationEmail(
          createdOrder
        ),

        sendAdminOrderNotification(
          createdOrder
        ),
      ]);

    emailResults.forEach(
      (result, index) => {
        if (
          result.status ===
          "rejected"
        ) {
          console.error(
            index === 0
              ? "Customer order email failed:"
              : "Admin order email failed:",
            result.reason?.message ||
              result.reason
          );
        }
      }
    );

    return res.status(201).json({
      success: true,
      message:
        "Order created successfully",
      order: createdOrder,
      _id: createdOrder._id,
    });
  } catch (error) {
    console.error(
      "CREATE ORDER ERROR:",
      error
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message: Object.values(
          error.errors
        )
          .map(
            (item) => item.message
          )
          .join(", "),
      });
    }

    if (
      error.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid ID supplied",
      });
    }

    if (error.statusCode) {
      return res.status(
        error.statusCode
      ).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to create order",
    });
  } finally {
    await session.endSession();
  }
};

/*
 * Escape user input before using it in a MongoDB regex.
 */
const escapeRegex = (value) =>
  String(value || "").replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

/*
 * Parse and validate pagination parameters.
 *
 * Customer default: 10
 * Admin default: 20
 * Maximum: 100
 */
const parsePagination = (query, defaultLimit) => {
  const requestedPage = Number(query?.page || 1);
  const requestedLimit = Number(query?.limit || defaultLimit);

  const page =
    Number.isInteger(requestedPage) && requestedPage >= 1
      ? requestedPage
      : 1;

  const limit =
    Number.isInteger(requestedLimit) &&
    requestedLimit >= 1 &&
    requestedLimit <= 100
      ? requestedLimit
      : defaultLimit;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

/*
 * Parse a YYYY-MM-DD date safely.
 */
const parseDateOnly = (value, endOfDay = false) => {
  if (!value) {
    return null;
  }

  const text = String(value).trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return null;
  }

  const date = new Date(
    `${text}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

/*
 * Build common order query filters.
 */
const buildOrderFilters = ({
  query,
  includeUser,
}) => {
  const {
    search = "",
    status = "",
    from = "",
    to = "",
  } = query || {};

  const filter = {};

  if (includeUser) {
    filter.user = includeUser;
  }

  if (status) {
    const normalizedStatus = String(status).trim();

    if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
      const error = new Error("Invalid order status");
      error.statusCode = 400;
      throw error;
    }

    filter.status = normalizedStatus;
  }

  const searchText = String(search || "").trim().slice(0, 100);

  if (searchText) {
    const escapedSearch = escapeRegex(searchText);

    const searchConditions = [
      {
        "customer.name": {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        "customer.email": {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        "customer.phone": {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        "shippingAddress.name": {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        "shippingAddress.email": {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        "shippingAddress.phone": {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        "shippingAddress.city": {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        "shippingAddress.state": {
          $regex: escapedSearch,
          $options: "i",
        },
      },
    ];

    if (mongoose.Types.ObjectId.isValid(searchText)) {
      searchConditions.push({
        _id: searchText,
      });
    }

    filter.$or = searchConditions;
  }

  const startDate = parseDateOnly(from);
  const endDate = parseDateOnly(to, true);

  if (from && !startDate) {
    const error = new Error("Invalid from date");
    error.statusCode = 400;
    throw error;
  }

  if (to && !endDate) {
    const error = new Error("Invalid to date");
    error.statusCode = 400;
    throw error;
  }

  if (startDate && endDate && startDate > endDate) {
    const error = new Error("from date cannot be after to date");
    error.statusCode = 400;
    throw error;
  }

  if (startDate || endDate) {
    filter.createdAt = {};

    if (startDate) {
      filter.createdAt.$gte = startDate;
    }

    if (endDate) {
      filter.createdAt.$lte = endDate;
    }
  }

  return {
    filter,
    searchText,
    status: String(status || "").trim(),
    from: String(from || "").trim(),
    to: String(to || "").trim(),
  };
};

/*
 * Get current user's orders.
 *
 * Supports:
 *   ?page=1
 *   ?limit=10
 *   ?search=customer
 *   ?status=Delivered
 *   ?from=2026-09-01
 *   ?to=2026-09-30
 */
const getMyOrders = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(
      req.query || {},
      10
    );

    const {
      filter,
      searchText,
      status,
      from,
      to,
    } = buildOrderFilters({
      query: req.query || {},
      includeUser: req.user._id,
    });

    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .populate(
          "items.product",
          "name price image countInStock isActive"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit),

      Order.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalOrders / limit);

    return res.status(200).json({
      success: true,
      orders,
      count: orders.length,
      pagination: {
        page,
        limit,
        totalOrders,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        search: searchText,
        status,
        from,
        to,
      },
    });
  } catch (error) {
    console.error("GET MY ORDERS ERROR:", error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to get orders",
    });
  }
};

/*
 * Get all orders.
 * Admin only through route middleware.
 *
 * Supports:
 *   ?page=1
 *   ?limit=20
 *   ?search=customer
 *   ?status=Pending
 *   ?from=2026-09-01
 *   ?to=2026-09-30
 */
const getAllOrders = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(
      req.query || {},
      20
    );

    const {
      filter,
      searchText,
      status,
      from,
      to,
    } = buildOrderFilters({
      query: req.query || {},
    });

    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .populate(
          "user",
          "name email"
        )
        .populate(
          "items.product",
          "name price image countInStock isActive"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit),

      Order.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalOrders / limit);

    return res.status(200).json({
      success: true,
      orders,
      count: orders.length,
      pagination: {
        page,
        limit,
        totalOrders,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        search: searchText,
        status,
        from,
        to,
      },
    });
  } catch (error) {
    console.error("GET ALL ORDERS ERROR:", error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to get all orders",
    });
  }
};

/*
 * Get one order.
 *
 * Customer can only see their own order.
 * Admin can see any order.
 */
const getOrderById = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order ID",
      });
    }

    const order =
      await Order.findById(id)
        .populate(
          "user",
          "name email"
        )
        .populate(
          "items.product",
          "name price image countInStock isActive"
        );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found",
      });
    }

    const isAdmin =
      req.user?.role ===
      "admin";

    if (
      !isAdmin &&
      String(
        order.user?._id ||
          order.user
      ) !==
        String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Not authorized to view this order",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "GET ORDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get order",
    });
  }
};

/*
 * Update Order Status
 *
 * Cancellation is transactional.
 *
 * The important protection here is:
 *
 *   stockReserved: true
 *   stockRestored: false
 *
 * are used as part of the atomic order update.
 *
 * This means two simultaneous cancellation requests
 * cannot both claim the same inventory restoration.
 */
const updateOrderStatus = async (
  req,
  res
) => {
  const session =
    await mongoose.startSession();

  try {
    const { id } =
      req.params;

    const {
      status,
      cancellationReason = "",
    } = req.body || {};

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order ID",
      });
    }

    if (
      !ALLOWED_STATUSES.includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order status",
      });
    }

    let updatedOrder = null;

    await session.withTransaction(
      async () => {
        /*
         * Read order inside transaction.
         */
        const order =
          await Order.findById(
            id
          ).session(session);

        if (!order) {
          const error =
            new Error(
              "Order not found"
            );

          error.statusCode = 404;

          throw error;
        }

        const previousStatus =
          order.status;

        /*
         * No-op status update.
         */
        if (
          previousStatus ===
          status
        ) {
          const error =
            new Error(
              "Order is already in this status"
            );

          error.statusCode = 409;

          throw error;
        }

        /*
         * Cancelled orders can never reopen.
         */
        if (
          previousStatus ===
            "Cancelled" &&
          status !==
            "Cancelled"
        ) {
          const error =
            new Error(
              "A cancelled order cannot be reopened"
            );

          error.statusCode = 409;

          throw error;
        }

        /*
         * Validate normal transition.
         */
        if (
          !canTransitionStatus(
            previousStatus,
            status
          )
        ) {
          const error =
            new Error(
              previousStatus ===
                "Delivered"
                ? "A delivered order can only remain Delivered or be Cancelled"
                : previousStatus ===
                  "Cancelled"
                ? "A cancelled order cannot be reopened"
                : "Order status cannot move backwards"
            );

          error.statusCode = 409;

          throw error;
        }

        /*
         * ----------------------------------------------------
         * CASE 1:
         * Normal cancellation with stock restoration
         * ----------------------------------------------------
         */
        if (
          status ===
            "Cancelled" &&
          shouldRestoreStockOnCancellation(
            previousStatus
          )
        ) {
          /*
           * Atomically claim the stock restoration.
           *
           * If another cancellation request has already
           * changed this order, this condition will fail.
           */
          const claimedOrder =
            await Order.findOneAndUpdate(
              {
                _id: id,

                status:
                  previousStatus,

                stockReserved: true,

                stockRestored: false,
              },
              {
                $set: {
                  status:
                    "Cancelled",

                  stockReserved:
                    false,

                  stockRestored:
                    true,

                  cancelledAt:
                    order.cancelledAt ||
                    new Date(),

                  cancellationReason:
                    String(
                      cancellationReason ||
                        ""
                    )
                      .trim()
                      .slice(
                        0,
                        500
                      ),
                },
              },
              {
                returnDocument: "after",

                session,
              }
            );

          /*
           * Another request won the cancellation race.
           */
          if (!claimedOrder) {
            const latestOrder =
              await Order.findById(
                id
              ).session(session);

            if (
              latestOrder?.status ===
              "Cancelled"
            ) {
              const error =
                new Error(
                  "Order has already been cancelled"
                );

              error.statusCode =
                409;

              throw error;
            }

            const error =
              new Error(
                "Order could not be updated because it was changed by another request"
              );

            error.statusCode =
              409;

            throw error;
          }

          /*
           * Restore each reserved product inside the
           * SAME transaction.
           */
          for (const item of order.items) {
            const restoredProduct = await Product.findOneAndUpdate(
              { _id: item.product },
              { $inc: { countInStock: item.quantity } },
              { returnDocument: "after", session }
            );

            if (restoredProduct) {
              await InventoryTransaction.create([{
                product: item.product,
                type: "IN",
                quantityChange: Number(item.quantity),
                previousStock: Math.max(0, Number(restoredProduct.countInStock) - Number(item.quantity)),
                newStock: Number(restoredProduct.countInStock),
                reason: "Order cancelled",
                referenceType: "Order",
                referenceId: order._id,
                performedBy: getUserId(req) || null,
              }], { session });
            }
          }

          updatedOrder =
            claimedOrder;

          return;
        }

        /*
         * ----------------------------------------------------
         * CASE 2:
         * Delivered -> Cancelled
         *
         * No automatic stock restoration.
         * ----------------------------------------------------
         */
        if (
          previousStatus ===
            "Delivered" &&
          status ===
            "Cancelled"
        ) {
          const claimedOrder =
            await Order.findOneAndUpdate(
              {
                _id: id,

                status:
                  "Delivered",
              },
              {
                $set: {
                  status:
                    "Cancelled",

                  stockReserved:
                    false,

                  stockRestored:
                    false,

                  cancelledAt:
                    order.cancelledAt ||
                    new Date(),

                  cancellationReason:
                    String(
                      cancellationReason ||
                        ""
                    )
                      .trim()
                      .slice(
                        0,
                        500
                      ),
                },
              },
              {
                returnDocument: "after",

                session,
              }
            );

          if (!claimedOrder) {
            const error =
              new Error(
                "Order was changed by another request"
              );

            error.statusCode =
              409;

            throw error;
          }

          updatedOrder =
            claimedOrder;

          return;
        }

        /*
         * ----------------------------------------------------
         * CASE 3:
         * Delivered status
         * ----------------------------------------------------
         */
        if (
          status ===
          "Delivered"
        ) {
          const claimedOrder =
            await Order.findOneAndUpdate(
              {
                _id: id,

                status:
                  previousStatus,
              },
              {
                $set: {
                  status:
                    "Delivered",

                  deliveredAt:
                    order.deliveredAt ||
                    new Date(),

                  stockReserved:
                    false,
                },
              },
              {
                returnDocument: "after",

                session,
              }
            );

          if (!claimedOrder) {
            const error =
              new Error(
                "Order was changed by another request"
              );

            error.statusCode =
              409;

            throw error;
          }

          updatedOrder =
            claimedOrder;

          return;
        }

        /*
         * ----------------------------------------------------
         * CASE 4:
         * Normal forward status transition.
         * ----------------------------------------------------
         */
        const claimedOrder =
          await Order.findOneAndUpdate(
            {
              _id: id,

              status:
                previousStatus,
            },
            {
              $set: {
                status,
              },
            },
            {
              returnDocument: "after",

              session,
            }
          );

        if (!claimedOrder) {
          const error =
            new Error(
              "Order was changed by another request"
            );

          error.statusCode =
            409;

          throw error;
        }

        updatedOrder =
          claimedOrder;
      }
    );

    /*
     * Populate AFTER transaction commit.
     */
    await updatedOrder.populate(
      "user",
      "name email"
    );

    /*
     * Email failure must never roll back
     * the already committed status update.
     */
    try {
      await sendOrderStatusEmail(
        updatedOrder
      );
    } catch (emailError) {
      console.error(
        "ORDER STATUS EMAIL FAILED:",
        emailError.message
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Order status updated",
      order: updatedOrder,
    });
  } catch (error) {
    console.error(
      "UPDATE ORDER STATUS ERROR:",
      error
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          error.message,
      });
    }

    if (error.statusCode) {
      return res.status(
        error.statusCode
      ).json({
        success: false,
        message:
          error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to update order status",
    });
  } finally {
    await session.endSession();
  }
};

/*
 * Admin Analytics
 */
const getAdminAnalytics = async (
  req,
  res
) => {
  try {
    const {
      from,
      to,
    } = req.query || {};

    const dateMatch = {};

    if (from) {
      const startDate =
        new Date(
          `${String(
            from
          ).slice(
            0,
            10
          )}T00:00:00.000Z`
        );

      if (
        Number.isNaN(
          startDate.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid from date",
        });
      }

      dateMatch.$gte =
        startDate;
    }

    if (to) {
      const endDate =
        new Date(
          `${String(
            to
          ).slice(
            0,
            10
          )}T23:59:59.999Z`
        );

      if (
        Number.isNaN(
          endDate.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid to date",
        });
      }

      dateMatch.$lte =
        endDate;
    }

    if (
      dateMatch.$gte &&
      dateMatch.$lte &&
      dateMatch.$gte >
        dateMatch.$lte
    ) {
      return res.status(400).json({
        success: false,
        message:
          "from date cannot be after to date",
      });
    }

    const orderMatch =
      Object.keys(dateMatch)
        .length
        ? {
            createdAt:
              dateMatch,
          }
        : {};

    const [
      orderSummary,
      ordersByStatus,
      topProducts,
      dailySales,
      lowStockProducts,
      userCount,
      productCount,
      activeProductCount,
    ] = await Promise.all([
      Order.aggregate([
        {
          $match:
            orderMatch,
        },
        {
          $group: {
            _id: null,

            totalOrders: {
              $sum: 1,
            },

            nonCancelledOrders: {
              $sum: {
                $cond: [
                  {
                    $ne: [
                      "$status",
                      "Cancelled",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            cancelledOrders: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "Cancelled",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            nonCancelledRevenue: {
              $sum: {
                $cond: [
                  {
                    $ne: [
                      "$status",
                      "Cancelled",
                    ],
                  },
                  "$totalPrice",
                  0,
                ],
              },
            },

            deliveredRevenue: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "Delivered",
                    ],
                  },
                  "$totalPrice",
                  0,
                ],
              },
            },

            deliveredOrders: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "Delivered",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),

      Order.aggregate([
        {
          $match:
            orderMatch,
        },
        {
          $group: {
            _id: "$status",
            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ]),

      Order.aggregate([
        {
          $match: {
            ...orderMatch,

            status: {
              $ne: "Cancelled",
            },
          },
        },

        {
          $unwind: "$items",
        },

        {
          $group: {
            _id:
              "$items.product",

            name: {
              $first:
                "$items.name",
            },

            quantitySold: {
              $sum:
                "$items.quantity",
            },

            revenue: {
              $sum: {
                $multiply: [
                  "$items.price",
                  "$items.quantity",
                ],
              },
            },
          },
        },

        {
          $sort: {
            quantitySold:
              -1,

            revenue: -1,
          },
        },

        {
          $limit: 10,
        },
      ]),

      Order.aggregate([
        {
          $match: {
            ...orderMatch,

            status: {
              $ne: "Cancelled",
            },
          },
        },

        {
          $group: {
            _id: {
              $dateToString: {
                format:
                  "%Y-%m-%d",

                date:
                  "$createdAt",
              },
            },

            orders: {
              $sum: 1,
            },

            revenue: {
              $sum:
                "$totalPrice",
            },
          },
        },

        {
          $sort: {
            _id: 1,
          },
        },

        {
          $limit: 366,
        },
      ]),

      Product.find({
        $or: [
          {
            isActive: true,
          },
          {
            isActive: {
              $exists: false,
            },
          },
        ],

        countInStock: {
          $lte: 5,
        },
      })
        .select(
          "name countInStock price image category isActive"
        )
        .sort({
          countInStock: 1,
          name: 1,
        })
        .limit(20)
        .lean(),

      require("../models/User")
        .countDocuments(),

      Product.countDocuments(),

      Product.countDocuments({
        $or: [
          {
            isActive: true,
          },
          {
            isActive: {
              $exists: false,
            },
          },
        ],
      }),
    ]);

    const summary =
      orderSummary[0] ||
      {};

    const totalOrders =
      Number(
        summary.totalOrders ||
          0
      );

    const revenue =
      Number(
        summary.nonCancelledRevenue ||
          0
      );

    const nonCancelledOrders =
      Number(
        summary.nonCancelledOrders ||
          0
      );

    return res.status(200).json({
      success: true,

      range: {
        from:
          from || null,

        to:
          to || null,
      },

      summary: {
        totalOrders,

        nonCancelledOrders,

        cancelledOrders:
          Number(
            summary.cancelledOrders ||
              0
          ),

        deliveredOrders:
          Number(
            summary.deliveredOrders ||
              0
          ),

        revenue,

        deliveredRevenue:
          Number(
            summary.deliveredRevenue ||
              0
          ),

        averageOrderValue:
          nonCancelledOrders
            ? Number(
                (
                  revenue /
                  nonCancelledOrders
                ).toFixed(2)
              )
            : 0,

        totalUsers:
          userCount,

        totalProducts:
          productCount,

        activeProducts:
          activeProductCount,
      },

      ordersByStatus:
        ordersByStatus.map(
          (item) => ({
            status:
              item._id,

            count:
              item.count,
          })
        ),

      topProducts,

      dailySales:
        dailySales.map(
          (item) => ({
            date:
              item._id,

            orders:
              item.orders,

            revenue:
              item.revenue,
          })
        ),

      lowStockProducts,
    });
  } catch (error) {
    console.error(
      "GET ADMIN ANALYTICS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load admin analytics",
    });
  }
};

/*
 * Delete Order
 *
 * Admin can delete orders in any status.
 *
 * Inventory rules:
 *
 * Pending
 * Confirmed
 * Processing
 * Shipped
 *     -> reserved stock is restored
 *
 * Delivered
 *     -> NO stock restoration
 *
 * Cancelled
 *     -> NO stock restoration
 *
 * The stock restoration and order deletion happen
 * inside ONE MongoDB transaction.
 */


/*
 * Advanced business analytics.
 * GET /api/orders/admin/advanced-analytics
 * Admin only. Builds decision-ready metrics from existing orders,
 * customers and product/inventory data without introducing a new DB.
 */
const getAdvancedAnalytics = async (req, res) => {
  try {
    const { from, to } = req.query || {};
    const dateMatch = {};

    const parseDate = (value, endOfDay = false) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
      const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    if (from) {
      const start = parseDate(from);
      if (!start) return res.status(400).json({ success: false, message: "Invalid from date" });
      dateMatch.$gte = start;
    }
    if (to) {
      const end = parseDate(to, true);
      if (!end) return res.status(400).json({ success: false, message: "Invalid to date" });
      dateMatch.$lte = end;
    }
    if (dateMatch.$gte && dateMatch.$lte && dateMatch.$gte > dateMatch.$lte) {
      return res.status(400).json({ success: false, message: "from date cannot be after to date" });
    }

    const orderMatch = Object.keys(dateMatch).length ? { createdAt: dateMatch } : {};
    const activeProductMatch = { $or: [{ isActive: true }, { isActive: { $exists: false } }] };

    const [
      summaryAgg,
      customerAgg,
      categoryAgg,
      fulfillmentAgg,
      paymentAgg,
      topCustomers,
      inventoryAgg,
      reviewAgg,
    ] = await Promise.all([
      Order.aggregate([
        { $match: orderMatch },
        { $group: {
          _id: null,
          orders: { $sum: 1 },
          cancelled: { $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] } },
          delivered: { $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] } },
          revenue: { $sum: { $cond: [{ $ne: ["$status", "Cancelled"] }, "$totalPrice", 0] } },
          units: { $sum: { $cond: [{ $ne: ["$status", "Cancelled"] }, { $sum: "$items.quantity" }, 0] } },
        } },
      ]),
      Order.aggregate([
        { $match: { ...orderMatch, status: { $ne: "Cancelled" } } },
        { $group: { _id: "$user", orders: { $sum: 1 }, revenue: { $sum: "$totalPrice" }, lastOrder: { $max: "$createdAt" } } },
        { $group: {
          _id: null,
          uniqueCustomers: { $sum: 1 },
          repeatCustomers: { $sum: { $cond: [{ $gt: ["$orders", 1] }, 1, 0] } },
          averageCustomerRevenue: { $avg: "$revenue" },
        } },
      ]),
      Order.aggregate([
        { $match: { ...orderMatch, status: { $ne: "Cancelled" } } },
        { $unwind: "$items" },
        { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "product" } },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        { $group: {
          _id: { $ifNull: ["$product.category", "Uncategorized"] },
          units: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        } },
        { $sort: { revenue: -1 } },
        { $limit: 12 },
      ]),
      Order.aggregate([
        { $match: { ...orderMatch, status: "Delivered", deliveredAt: { $ne: null } } },
        { $project: { hours: { $divide: [{ $subtract: ["$deliveredAt", "$createdAt"] }, 3600000] } } },
        { $match: { hours: { $gte: 0, $lte: 8760 } } },
        { $group: { _id: null, averageHours: { $avg: "$hours" }, fastestHours: { $min: "$hours" }, slowestHours: { $max: "$hours" } } },
      ]),
      Order.aggregate([
        { $match: orderMatch },
        { $group: { _id: "$paymentMethod", orders: { $sum: 1 }, revenue: { $sum: { $cond: [{ $ne: ["$status", "Cancelled"] }, "$totalPrice", 0] } } } },
        { $sort: { revenue: -1 } },
      ]),
      Order.aggregate([
        { $match: { ...orderMatch, status: { $ne: "Cancelled" } } },
        { $group: { _id: "$user", name: { $first: "$customer.name" }, email: { $first: "$customer.email" }, orders: { $sum: 1 }, revenue: { $sum: "$totalPrice" } } },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
      ]),
      Product.aggregate([
        { $match: activeProductMatch },
        { $group: {
          _id: null,
          products: { $sum: 1 },
          stockUnits: { $sum: "$countInStock" },
          inventoryValue: { $sum: { $multiply: ["$countInStock", "$price"] } },
          lowStock: { $sum: { $cond: [{ $lte: ["$countInStock", 5] }, 1, 0] } },
          outOfStock: { $sum: { $cond: [{ $eq: ["$countInStock", 0] }, 1, 0] } },
        } },
      ]),
      Product.aggregate([
        { $match: activeProductMatch },
        { $project: { reviews: 1, numReviews: 1, rating: 1 } },
        { $group: { _id: null, totalReviews: { $sum: "$numReviews" }, averageRating: { $avg: "$rating" } } },
      ]),
    ]);

    const summary = summaryAgg[0] || {};
    const customers = customerAgg[0] || {};
    const fulfillment = fulfillmentAgg[0] || {};
    const inventory = inventoryAgg[0] || {};
    const reviews = reviewAgg[0] || {};
    const orders = Number(summary.orders || 0);
    const cancelled = Number(summary.cancelled || 0);
    const revenue = Number(summary.revenue || 0);

    return res.status(200).json({
      success: true,
      range: { from: from || null, to: to || null },
      summary: {
        orders,
        cancelledOrders: cancelled,
        deliveredOrders: Number(summary.delivered || 0),
        revenue,
        unitsSold: Number(summary.units || 0),
        averageOrderValue: orders - cancelled > 0 ? Number((revenue / (orders - cancelled)).toFixed(2)) : 0,
        cancellationRate: orders > 0 ? Number(((cancelled / orders) * 100).toFixed(2)) : 0,
      },
      customers: {
        uniqueCustomers: Number(customers.uniqueCustomers || 0),
        repeatCustomers: Number(customers.repeatCustomers || 0),
        repeatRate: customers.uniqueCustomers ? Number(((customers.repeatCustomers / customers.uniqueCustomers) * 100).toFixed(2)) : 0,
        averageCustomerRevenue: Number(customers.averageCustomerRevenue || 0),
      },
      categories: categoryAgg.map((item) => ({ category: item._id, units: item.units, revenue: item.revenue })),
      fulfillment: {
        averageHours: Number(fulfillment.averageHours || 0),
        fastestHours: Number(fulfillment.fastestHours || 0),
        slowestHours: Number(fulfillment.slowestHours || 0),
      },
      paymentMethods: paymentAgg.map((item) => ({ method: item._id || "Unknown", orders: item.orders, revenue: item.revenue })),
      topCustomers: topCustomers.map((item) => ({ id: item._id, name: item.name, email: item.email, orders: item.orders, revenue: item.revenue })),
      inventory: {
        activeProducts: Number(inventory.products || 0),
        stockUnits: Number(inventory.stockUnits || 0),
        inventoryValue: Number(inventory.inventoryValue || 0),
        lowStock: Number(inventory.lowStock || 0),
        outOfStock: Number(inventory.outOfStock || 0),
      },
      reviews: {
        totalReviews: Number(reviews.totalReviews || 0),
        averageRating: Number(reviews.averageRating || 0),
      },
    });
  } catch (error) {
    console.error("GET ADVANCED ANALYTICS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to load advanced analytics" });
  }
};

const deleteOrder = async (
  req,
  res
) => {
  const session =
    await mongoose.startSession();

  try {
    const { id } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order ID",
      });
    }

    let deletedOrder = null;
    let stockWasRestored =
      false;

    await session.withTransaction(
      async () => {
        const order =
          await Order.findById(
            id
          ).session(session);

        if (!order) {
          const error =
            new Error(
              "Order not found"
            );

          error.statusCode = 404;

          throw error;
        }

        /*
         * Only restore inventory when:
         *
         * - stock is still reserved
         * - stock has not already been restored
         * - order has not reached Delivered
         * - order has not been Cancelled
         */
        const shouldRestore =
          order.stockReserved ===
            true &&
          order.stockRestored !==
            true &&
          order.status !==
            "Delivered" &&
          order.status !==
            "Cancelled";

        if (shouldRestore) {
          for (const item of order.items) {
            await Product.updateOne(
              {
                _id:
                  item.product,
              },
              {
                $inc: {
                  countInStock:
                    item.quantity,
                },
              },
              {
                session,
              }
            );
          }

          stockWasRestored =
            true;
        }

        /*
         * Delete the order inside the SAME transaction.
         *
         * If stock restoration fails, the delete is
         * also rolled back.
         */
        await Order.deleteOne(
          {
            _id: id,
          },
          {
            session,
          }
        );

        deletedOrder =
          order;
      }
    );

    return res.status(200).json({
      success: true,

      message:
        stockWasRestored
          ? "Order deleted successfully and reserved stock restored"
          : "Order deleted successfully",

      orderId:
        deletedOrder._id,

      stockRestored:
        stockWasRestored,
    });
  } catch (error) {
    console.error(
      "DELETE ORDER ERROR:",
      error
    );

    if (error.statusCode) {
      return res.status(
        error.statusCode
      ).json({
        success: false,
        message:
          error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete order",
    });
  } finally {
    await session.endSession();
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getAdminAnalytics,
  getAdvancedAnalytics,
};
