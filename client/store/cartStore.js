import { create } from "zustand";
import { persist } from "zustand/middleware";

const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],

      // ADD PRODUCT
      addToCart: (product) => {
        const existingItem = get().cart.find(
          (item) => item._id === product._id
        );

        if (existingItem) {
          set({
            cart: get().cart.map((item) =>
              item._id === product._id
                ? {
                    ...item,
                    quantity: item.quantity + 1,
                  }
                : item
            ),
          });
        } else {
          set({
            cart: [
              ...get().cart,
              {
                ...product,
                quantity: 1,
              },
            ],
          });
        }
      },

      // REMOVE PRODUCT
      removeFromCart: (productId) => {
        set({
          cart: get().cart.filter(
            (item) => item._id !== productId
          ),
        });
      },

      // UPDATE QUANTITY
      updateQuantity: (productId, quantity) => {
        set({
          cart: get().cart.map((item) =>
            item._id === productId
              ? {
                  ...item,
                  quantity,
                }
              : item
          ),
        });
      },

      // CLEAR CART
      clearCart: () => {
        set({
          cart: [],
        });
      },

      // TOTAL ITEMS
      getCartCount: () => {
        return get().cart.reduce(
          (total, item) =>
            total + item.quantity,
          0
        );
      },

      // TOTAL PRICE
      getTotalPrice: () => {
        return get().cart.reduce(
          (total, item) =>
            total + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: "amazon-cart",
    }
  )
);

export default useCartStore;