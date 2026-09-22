// Compatibility wrapper.
// The application uses store/cartStore.js as the single canonical cart store.
import useCartStore from "./cartStore";

export const useCartStore = useCartStore;
export default useCartStore;
