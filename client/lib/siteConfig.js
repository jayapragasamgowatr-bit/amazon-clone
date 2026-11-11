// ============================================================
// COMPANY DETAILS  -  EDIT THIS FILE
// ============================================================
// Everything the information pages, footer and invoice say about
// the business comes from here. Values wrapped in [square brackets]
// are placeholders: replace them with your real details. Anything
// left in brackets is shown on the site exactly as written, so it
// is easy to spot what still needs filling in.
// ============================================================

const siteConfig = {
  name: "Waventra Vetric",
  legalName: "[Registered company name]",
  tagline: "Smart water measurement and monitoring products",

  supportEmail: "[support email address]",
  supportPhone: "[support phone number]",
  supportHours: "Monday to Saturday, 9:30 am to 6:30 pm IST",

  address: {
    line1: "[Building / street address]",
    city: "[City]",
    state: "[State]",
    postalCode: "[PIN code]",
    country: "India",
  },

  // Shown on invoices. Leave the placeholder until you have the real number.
  gstin: "[GSTIN]",

  // Keep these in step with RETURN_WINDOW_DAYS on the server and your real policies.
  returnWindowDays: 7,
  dispatchTime: "[e.g. 1-2 business days]",
  deliveryTime: "[e.g. 3-7 business days depending on location]",
  refundTime: "[e.g. 5-7 business days after the return is approved]",
  warranty: "[Warranty terms, e.g. 12 months manufacturer warranty]",

  founded: "[Year founded]",
};

export const isPlaceholder = (value) => /^\[.*\]$/.test(String(value || "").trim());

export const formatAddress = (address = siteConfig.address) =>
  [address.line1, address.city, address.state, address.postalCode, address.country]
    .filter(Boolean)
    .join(", ");

export default siteConfig;
