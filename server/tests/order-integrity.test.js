const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

const Order = require("../models/Order");
const Product = require("../models/Product");

let mongoServer;

test.before(async () => {
  mongoServer = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      storageEngine: "wiredTiger",
    },
  });

  const uri = mongoServer.getUri();

  await mongoose.connect(uri);
});

test.after(async () => {
  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
  }
});

test.beforeEach(async () => {
  await Promise.all([
    Order.deleteMany({}),
    Product.deleteMany({}),
  ]);
});

const createProduct = async ({
  name = "Test Product",
  stock = 10,
  price = 100,
} = {}) => {
  return Product.create({
    name,
    price,
    countInStock: stock,
    isActive: true,
    description: "Integration test product",
    image: "",
  });
};

const createOrder = async ({
  product,
  quantity = 2,
  status = "Pending",
  stockReserved = true,
  stockRestored = false,
} = {}) => {
  return Order.create({
    user: new mongoose.Types.ObjectId(),

    customer: {
      name: "Test Customer",
      email: "test@example.com",
      phone: "9876543210",
    },

    items: [
      {
        product: product._id,
        name: product.name,
        price: product.price,
        quantity,
        image: "",
      },
    ],

    shippingAddress: {
      name: "Test Customer",
      email: "test@example.com",
      phone: "9876543210",
      address: "Test Address",
      city: "Chennai",
      state: "Tamil Nadu",
      postalCode: "600001",
      pincode: "600001",
    },

    paymentMethod: "COD",
    paymentStatus: "Pending",

    subtotal: product.price * quantity,
    shipping: 0,
    totalPrice: product.price * quantity,

    status,

    stockReserved,
    stockRestored,
  });
};

test("transaction rollback restores stock when order creation fails", async () => {
  const product = await createProduct({
    stock: 10,
  });

  const session = await mongoose.startSession();

  try {
    await assert.rejects(async () => {
      await session.withTransaction(async () => {
        const updatedProduct =
          await Product.findOneAndUpdate(
            {
              _id: product._id,
              countInStock: {
                $gte: 2,
              },
            },
            {
              $inc: {
                countInStock: -2,
              },
            },
            {
              returnDocument: "after",
              session,
            }
          );

        assert.ok(updatedProduct);

        throw new Error(
          "Simulated order creation failure"
        );
      });
    });
  } finally {
    await session.endSession();
  }

  const finalProduct =
    await Product.findById(
      product._id
    );

  assert.equal(
    finalProduct.countInStock,
    10
  );
});

test("cancellation transaction restores reserved stock exactly once", async () => {
  const product = await createProduct({
    stock: 10,
  });

  /*
   * Simulate stock reservation.
   */
  await Product.updateOne(
    {
      _id: product._id,
    },
    {
      $inc: {
        countInStock: -2,
      },
    }
  );

  const order = await createOrder({
    product,
    quantity: 2,
    status: "Pending",
    stockReserved: true,
    stockRestored: false,
  });

  const session =
    await mongoose.startSession();

  try {
    await session.withTransaction(
      async () => {
        const claimedOrder =
          await Order.findOneAndUpdate(
            {
              _id: order._id,
              status: "Pending",
              stockReserved: true,
              stockRestored: false,
            },
            {
              $set: {
                status: "Cancelled",
                stockReserved: false,
                stockRestored: true,
                cancelledAt: new Date(),
              },
            },
            {
              returnDocument: "after",
              session,
            }
          );

        assert.ok(claimedOrder);

        await Product.updateOne(
          {
            _id: product._id,
          },
          {
            $inc: {
              countInStock: 2,
            },
          },
          {
            session,
          }
        );
      }
    );
  } finally {
    await session.endSession();
  }

  const finalProduct =
    await Product.findById(
      product._id
    );

  const finalOrder =
    await Order.findById(
      order._id
    );

  assert.equal(
    finalProduct.countInStock,
    10
  );

  assert.equal(
    finalOrder.status,
    "Cancelled"
  );

  assert.equal(
    finalOrder.stockReserved,
    false
  );

  assert.equal(
    finalOrder.stockRestored,
    true
  );
});

test("second cancellation cannot restore stock twice", async () => {
  const product = await createProduct({
    stock: 10,
  });

  await Product.updateOne(
    {
      _id: product._id,
    },
    {
      $inc: {
        countInStock: -2,
      },
    }
  );

  const order = await createOrder({
    product,
    quantity: 2,
    status: "Pending",
    stockReserved: true,
    stockRestored: false,
  });

  /*
   * First cancellation.
   */
  const firstClaim =
    await Order.findOneAndUpdate(
      {
        _id: order._id,
        status: "Pending",
        stockReserved: true,
        stockRestored: false,
      },
      {
        $set: {
          status: "Cancelled",
          stockReserved: false,
          stockRestored: true,
        },
      },
      {
        returnDocument: "after",
      }
    );

  assert.ok(firstClaim);

  await Product.updateOne(
    {
      _id: product._id,
    },
    {
      $inc: {
        countInStock: 2,
      },
    }
  );

  /*
   * Second cancellation attempt.
   *
   * It must NOT match because the order is already
   * Cancelled and stockRestored is true.
   */
  const secondClaim =
    await Order.findOneAndUpdate(
      {
        _id: order._id,
        status: "Pending",
        stockReserved: true,
        stockRestored: false,
      },
      {
        $set: {
          status: "Cancelled",
          stockReserved: false,
          stockRestored: true,
        },
      },
      {
        returnDocument: "after",
      }
    );

  assert.equal(
    secondClaim,
    null
  );

  const finalProduct =
    await Product.findById(
      product._id
    );

  assert.equal(
    finalProduct.countInStock,
    10
  );
});

test("Delivered to Cancelled does not restore stock", async () => {
  const product = await createProduct({
    stock: 10,
  });

  const order = await createOrder({
    product,
    quantity: 2,
    status: "Delivered",
    stockReserved: false,
    stockRestored: false,
  });

  const session =
    await mongoose.startSession();

  try {
    await session.withTransaction(
      async () => {
        const updatedOrder =
          await Order.findOneAndUpdate(
            {
              _id: order._id,
              status: "Delivered",
            },
            {
              $set: {
                status: "Cancelled",
                stockReserved: false,
                stockRestored: false,
                cancelledAt: new Date(),
              },
            },
            {
              returnDocument: "after",
              session,
            }
          );

        assert.ok(updatedOrder);
      }
    );
  } finally {
    await session.endSession();
  }

  const finalProduct =
    await Product.findById(
      product._id
    );

  const finalOrder =
    await Order.findById(
      order._id
    );

  assert.equal(
    finalProduct.countInStock,
    10
  );

  assert.equal(
    finalOrder.status,
    "Cancelled"
  );

  assert.equal(
    finalOrder.stockRestored,
    false
  );
});

test("deleting a reserved Pending order restores stock atomically", async () => {
  const product = await createProduct({
    stock: 10,
  });

  await Product.updateOne(
    {
      _id: product._id,
    },
    {
      $inc: {
        countInStock: -3,
      },
    }
  );

  const order = await createOrder({
    product,
    quantity: 3,
    status: "Pending",
    stockReserved: true,
    stockRestored: false,
  });

  const session =
    await mongoose.startSession();

  try {
    await session.withTransaction(
      async () => {
        const currentOrder =
          await Order.findById(
            order._id
          ).session(session);

        assert.ok(currentOrder);

        await Product.updateOne(
          {
            _id: product._id,
          },
          {
            $inc: {
              countInStock:
                currentOrder.items[0]
                  .quantity,
            },
          },
          {
            session,
          }
        );

        await Order.deleteOne(
          {
            _id: order._id,
          },
          {
            session,
          }
        );
      }
    );
  } finally {
    await session.endSession();
  }

  const finalProduct =
    await Product.findById(
      product._id
    );

  const deletedOrder =
    await Order.findById(
      order._id
    );

  assert.equal(
    finalProduct.countInStock,
    10
  );

  assert.equal(
    deletedOrder,
    null
  );
});

test("deleting a Delivered order does not restore stock", async () => {
  const product = await createProduct({
    stock: 10,
  });

  const order = await createOrder({
    product,
    quantity: 2,
    status: "Delivered",
    stockReserved: false,
    stockRestored: false,
  });

  const session =
    await mongoose.startSession();

  try {
    await session.withTransaction(
      async () => {
        const currentOrder =
          await Order.findById(
            order._id
          ).session(session);

        assert.ok(currentOrder);

        /*
         * Delivered orders must not return inventory.
         */

        await Order.deleteOne(
          {
            _id: order._id,
          },
          {
            session,
          }
        );
      }
    );
  } finally {
    await session.endSession();
  }

  const finalProduct =
    await Product.findById(
      product._id
    );

  const deletedOrder =
    await Order.findById(
      order._id
    );

  assert.equal(
    finalProduct.countInStock,
    10
  );

  assert.equal(
    deletedOrder,
    null
  );
});

test("deleting a Cancelled order does not restore stock twice", async () => {
  const product = await createProduct({
    stock: 10,
  });

  const order = await createOrder({
    product,
    quantity: 2,
    status: "Cancelled",
    stockReserved: false,
    stockRestored: true,
  });

  const session =
    await mongoose.startSession();

  try {
    await session.withTransaction(
      async () => {
        const currentOrder =
          await Order.findById(
            order._id
          ).session(session);

        assert.ok(currentOrder);

        /*
         * stockReserved is already false and
         * stockRestored is already true.
         *
         * Therefore deletion must not increment stock.
         */

        await Order.deleteOne(
          {
            _id: order._id,
          },
          {
            session,
          }
        );
      }
    );
  } finally {
    await session.endSession();
  }

  const finalProduct =
    await Product.findById(
      product._id
    );

  assert.equal(
    finalProduct.countInStock,
    10
  );

  const deletedOrder =
    await Order.findById(
      order._id
    );

  assert.equal(
    deletedOrder,
    null
  );
});
