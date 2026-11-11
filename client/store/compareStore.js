import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const MAX_COMPARE = 4;

// Products the shopper has picked to compare side by side.
// Only the fields needed to draw a chip are stored; the compare page
// always loads fresh prices and stock from the server.
const useCompareStore = create(
  persist(
    (set, get) => ({
      items: [],

      has: (id) => get().items.some((item) => item._id === id),

      // Returns "added", "removed" or "full" so the caller can show a message.
      toggle: (product) => {
        if (!product?._id) return "ignored";
        const { items } = get();

        if (items.some((item) => item._id === product._id)) {
          set({ items: items.filter((item) => item._id !== product._id) });
          return "removed";
        }
        if (items.length >= MAX_COMPARE) return "full";

        set({
          items: [
            ...items,
            {
              _id: product._id,
              name: product.name || "Product",
              image: product.images?.[0] || product.image || "",
              price: Number(product.price || 0),
            },
          ],
        });
        return "added";
      },

      remove: (id) =>
        set((state) => ({ items: state.items.filter((item) => item._id !== id) })),

      clear: () => set({ items: [] }),
    }),
    {
      name: "wv-compare",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useCompareStore;
