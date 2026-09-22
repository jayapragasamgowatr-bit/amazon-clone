import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { apiFetch } from "../../../lib/api";
import { motion } from "framer-motion";

export default function EditProductPage() {
  const router = useRouter();
  const { id } = router.query;

  // ============================================================
  // PRODUCT FORM
  // ============================================================

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    image: "",
    category: "",
    countInStock: "",
  });

  // ============================================================
  // SPECIFICATIONS
  // ============================================================

  const [specifications, setSpecifications] = useState([]);

  // ============================================================
  // STATE
  // ============================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ============================================================
  // FETCH PRODUCT
  // ============================================================

  useEffect(() => {
    if (!router.isReady || !id) {
      return;
    }

    fetchProduct();
  }, [router.isReady, id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);

      const data = await apiFetch(
        `/api/products/${id}`,
        {
          method: "GET",
        }
      );

      // Some APIs return:
      // { product: {...} }
      // Others return the product directly.
      const product = data?.product || data?.data?.product || data;

      if (!product) {
        throw new Error("Product not found");
      }

      // ========================================================
      // PRODUCT DATA
      // ========================================================

      setFormData({
        name: product.name || "",
        price: product.price ?? "",
        description: product.description || "",
        image: product.image || "",
        category: product.category || "",
        countInStock: product.countInStock ?? "",
      });

      // ========================================================
      // SPECIFICATIONS
      // ========================================================

      const specs = product.specifications || {};

      const specificationArray = Object.entries(specs).map(
        ([key, value]) => ({
          key,
          value: String(value ?? ""),
        })
      );

      setSpecifications(specificationArray);
    } catch (error) {
      console.error("FETCH PRODUCT ERROR:", error);

      toast.error(
        error?.message || "Failed to load product"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // HANDLE FORM CHANGE
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ============================================================
  // SPECIFICATION CHANGE
  // ============================================================

  const handleSpecificationChange = (
    index,
    field,
    value
  ) => {
    setSpecifications((prev) => {
      const updated = [...prev];

      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      return updated;
    });
  };

  // ============================================================
  // ADD SPECIFICATION
  // ============================================================

  const addSpecification = () => {
    setSpecifications((prev) => [
      ...prev,
      {
        key: "",
        value: "",
      },
    ]);
  };

  // ============================================================
  // REMOVE SPECIFICATION
  // ============================================================

  const removeSpecification = (index) => {
    setSpecifications((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  // ============================================================
  // SUBMIT UPDATE
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!id) {
      toast.error("Invalid product ID");
      return;
    }

    // ==========================================================
    // BASIC VALIDATION
    // ==========================================================

    const name = String(formData.name || "").trim();
    const description = String(
      formData.description || ""
    ).trim();

    const category = String(
      formData.category || ""
    ).trim();

    const image = String(
      formData.image || ""
    ).trim();

    const price = Number(formData.price);
    const countInStock = Number(formData.countInStock);

    if (!name) {
      toast.error("Product name is required");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      toast.error("Enter a valid product price");
      return;
    }

    if (!description) {
      toast.error("Product description is required");
      return;
    }

    if (!Number.isFinite(countInStock) || countInStock < 0) {
      toast.error("Enter a valid stock quantity");
      return;
    }

    // ==========================================================
    // BUILD SPECIFICATIONS
    // ==========================================================

    const specificationObject = {};

    for (const spec of specifications) {
      const key = String(spec?.key || "").trim();
      const value = String(spec?.value || "").trim();

      if (key && value) {
        specificationObject[key] = value;
      }
    }

    // ==========================================================
    // SAVE
    // ==========================================================

    try {
      setSaving(true);

      console.log("UPDATING PRODUCT:", {
        id,
        name,
        price,
        category,
        countInStock,
      });

      // ========================================================
      // IMPORTANT FIX:
      //
      // auth: true is REQUIRED here.
      //
      // PUT /api/products/:id is protected by:
      // protect + adminOnly
      //
      // apiFetch only sends:
      // Authorization: Bearer <token>
      //
      // when auth: true is supplied.
      // ========================================================

      const result = await apiFetch(
        `/api/products/${id}`,
        {
          method: "PUT",

          auth: true,

          body: {
            name,
            price,
            description,
            image,
            category,
            countInStock,
            specifications: specificationObject,
          },
        }
      );

      console.log(
        "PRODUCT UPDATE SUCCESS:",
        result
      );

      toast.success(
        "Product updated successfully"
      );

      // Small delay so toast is visible.
      setTimeout(() => {
        router.push("/admin/products");
      }, 500);
    } catch (error) {
      console.error(
        "UPDATE PRODUCT ERROR:",
        error
      );

      // ========================================================
      // AUTH ERROR
      // ========================================================

      if (
        error?.message
          ?.toLowerCase()
          .includes("not authorized")
      ) {
        toast.error(
          "Admin session expired. Please login again."
        );

        return;
      }

      // ========================================================
      // OTHER ERROR
      // ========================================================

      toast.error(
        error?.message ||
          "Failed to update product"
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <ProtectedRoute>
        <div
          style={{
            maxWidth: "900px",
            margin: "80px auto",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <div
            className="glass-card"
            style={{
              padding: "40px",
            }}
          >
            <h2>
              Loading product...
            </h2>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <ProtectedRoute>
      <main
        style={{
          minHeight: "100vh",
          padding: "40px 20px 80px",
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="glass-card"
            style={{
              padding: "40px",
              borderRadius: "24px",
            }}
          >
            {/* ==================================================
                HEADER
            ================================================== */}

            <div
              style={{
                marginBottom: "30px",
              }}
            >
              <h1
                style={{
                  fontSize: "42px",
                  margin: 0,
                  marginBottom: "8px",
                  fontWeight: 900,
                }}
              >
                Edit Product ✏️
              </h1>

              <p
                style={{
                  opacity: 0.65,
                  margin: 0,
                }}
              >
                Update product information and
                technical specifications.
              </p>
            </div>

            {/* ==================================================
                FORM
            ================================================== */}

            <form
              onSubmit={handleSubmit}
              style={{
                display: "grid",
                gap: "22px",
              }}
            >
              {/* =================================================
                  PRODUCT NAME
              ================================================= */}

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 700,
                  }}
                >
                  Product Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Product Name"
                  required
                  style={inputStyle}
                />
              </div>

              {/* =================================================
                  PRICE
              ================================================= */}

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 700,
                  }}
                >
                  Price
                </label>

                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Price"
                  min="0"
                  step="0.01"
                  required
                  style={inputStyle}
                />
              </div>

              {/* =================================================
                  CATEGORY
              ================================================= */}

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 700,
                  }}
                >
                  Category
                </label>

                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="Category"
                  style={inputStyle}
                />
              </div>

              {/* =================================================
                  STOCK
              ================================================= */}

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 700,
                  }}
                >
                  Stock Quantity
                </label>

                <input
                  type="number"
                  name="countInStock"
                  value={formData.countInStock}
                  onChange={handleChange}
                  placeholder="Stock Quantity"
                  min="0"
                  step="1"
                  required
                  style={inputStyle}
                />
              </div>

              {/* =================================================
                  DESCRIPTION
              ================================================= */}

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 700,
                  }}
                >
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Product Description"
                  rows={7}
                  required
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    minHeight: "150px",
                  }}
                />
              </div>

              {/* =================================================
                  IMAGE
              ================================================= */}

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 700,
                  }}
                >
                  Product Image URL
                </label>

                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://..."
                  style={inputStyle}
                />
              </div>

              {/* =================================================
                  IMAGE PREVIEW
              ================================================= */}

              {formData.image && (
                <div
                  style={{
                    padding: "20px",
                    borderRadius: "16px",
                    border:
                      "1px solid rgba(255,255,255,0.1)",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      marginTop: 0,
                      opacity: 0.6,
                      fontSize: "13px",
                    }}
                  >
                    Image Preview
                  </p>

                  <img
                    src={formData.image}
                    alt={formData.name || "Product"}
                    style={{
                      maxWidth: "280px",
                      maxHeight: "220px",
                      objectFit: "contain",
                      borderRadius: "12px",
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display =
                        "none";
                    }}
                  />
                </div>
              )}

              {/* =================================================
                  SPECIFICATIONS
              ================================================= */}

              <section
                style={{
                  padding: "24px",
                  borderRadius: "20px",
                  border:
                    "1px solid rgba(255,255,255,0.1)",
                  background:
                    "rgba(255,255,255,0.03)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    gap: "15px",
                    marginBottom: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "24px",
                      }}
                    >
                      Technical Specifications
                    </h2>

                    <p
                      style={{
                        opacity: 0.6,
                        margin:
                          "6px 0 0",
                        fontSize: "14px",
                      }}
                    >
                      Add product-specific
                      technical details.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      addSpecification
                    }
                    style={buttonStyle}
                  >
                    + Add Specification
                  </button>
                </div>

                {/* =================================================
                    EMPTY SPECIFICATIONS
                ================================================= */}

                {specifications.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "25px",
                      opacity: 0.6,
                    }}
                  >
                    No specifications
                    added yet.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gap: "12px",
                    }}
                  >
                    {specifications.map(
                      (spec, index) => (
                        <div
                          key={index}
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "1fr 1fr auto",
                            gap: "10px",
                            alignItems:
                              "center",
                          }}
                        >
                          {/* KEY */}

                          <input
                            type="text"
                            placeholder="Specification"
                            value={
                              spec.key
                            }
                            onChange={(e) =>
                              handleSpecificationChange(
                                index,
                                "key",
                                e.target.value
                              )
                            }
                            style={
                              inputStyle
                            }
                          />

                          {/* VALUE */}

                          <input
                            type="text"
                            placeholder="Value"
                            value={
                              spec.value
                            }
                            onChange={(e) =>
                              handleSpecificationChange(
                                index,
                                "value",
                                e.target.value
                              )
                            }
                            style={
                              inputStyle
                            }
                          />

                          {/* REMOVE */}

                          <button
                            type="button"
                            onClick={() =>
                              removeSpecification(
                                index
                              )
                            }
                            style={{
                              ...buttonStyle,
                              background:
                                "rgba(239,68,68,0.2)",
                              color:
                                "#fca5a5",
                              padding:
                                "10px 14px",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </section>

              {/* =================================================
                  ACTIONS
              ================================================= */}

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  gap: "12px",
                  marginTop: "10px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/admin/products"
                    )
                  }
                  disabled={saving}
                  style={{
                    ...buttonStyle,
                    background:
                      "rgba(255,255,255,0.1)",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    ...buttonStyle,
                    minWidth: "150px",
                  }}
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

// ============================================================
// STYLES
// ============================================================

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "14px 16px",
  borderRadius: "12px",
  border:
    "1px solid rgba(255,255,255,0.12)",
  background:
    "rgba(255,255,255,0.06)",
  color: "inherit",
  outline: "none",
  fontSize: "15px",
};

const buttonStyle = {
  border: 0,
  borderRadius: "12px",
  padding: "12px 18px",
  color: "#fff",
  background:
    "linear-gradient(135deg,#7c3aed,#06b6d4)",
  fontWeight: 800,
  cursor: "pointer",
};