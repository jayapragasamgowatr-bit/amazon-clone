import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const MAX_QUANTITY = 100;

const clampQuantity = (quantity, stock) => {
  const value = Number(quantity);
  const safe = Number.isInteger(value) && value > 0 ? value : 1;
  const stockLimit = Number.isFinite(Number(stock)) ? Math.max(1, Number(stock)) : MAX_QUANTITY;
  return Math.min(safe, Math.min(MAX_QUANTITY, stockLimit));
};

const useCartStore = create(
  persist(
    (set) => ({
      cart: [],

      addToCart: (product, quantity = 1) => {
        if (!product?._id) return;

        set((state) => {
          const existing = state.cart.find((item) => item._id === product._id);
          const nextQuantity = clampQuantity(
            (existing?.quantity || 0) + Number(quantity || 1),
            product.countInStock
          );

          if (existing) {
            return {
              cart: state.cart.map((item) =>
                item._id === product._id
                  ? { ...item, quantity: nextQuantity }
                  : item
              ),
            };
          }

          return {
            cart: [
              ...state.cart,
              {
                ...product,
                _id: product._id || product.id,
                quantity: clampQuantity(
                  quantity,
                  product.countInStock
                ),
              },
            ],
          };
        });
      },

      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item._id !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item._id === productId
              ? {
                  ...item,
                  quantity: clampQuantity(quantity, item.countInStock),
                }
              : item
          ),
        })),

      increaseQuantity: (productId) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item._id === productId
              ? {
                  ...item,
                  quantity: clampQuantity(
                    Number(item.quantity || 1) + 1,
                    item.countInStock
                  ),
                }
              : item
          ),
        })),

      decreaseQuantity: (productId) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item._id === productId
              ? { ...item, quantity: Math.max(1, Number(item.quantity || 1) - 1) }
              : item
          ),
        })),

      clearCart: () => set({ cart: [] }),
    }),
    {
      name: "gowatr-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);

export default useCartStore;
