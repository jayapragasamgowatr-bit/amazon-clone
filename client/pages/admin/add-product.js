import { useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import ProtectedRoute from "../../components/ProtectedRoute";
import { apiFetch } from "../../lib/api";
import { motion } from "framer-motion";

export default function AddProductPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    image: "",
    category: "",
    countInStock: "",
  });

  // --------------------------------------------------
  // SPECIFICATIONS
  // --------------------------------------------------

  const [specifications, setSpecifications] =
    useState([
      {
        key: "",
        value: "",
      },
    ]);

  const [loading, setLoading] =
    useState(false);

  // --------------------------------------------------
  // HANDLE FORM CHANGE
  // --------------------------------------------------

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };

  // --------------------------------------------------
  // IMAGE UPLOAD
  // --------------------------------------------------

  const handleFileUpload = (e) => {
    const file =
      e.target.files[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        image: reader.result,
      }));

      toast.success(
        "Image uploaded"
      );
    };

    reader.readAsDataURL(file);
  };

  // --------------------------------------------------
  // SPECIFICATION CHANGE
  // --------------------------------------------------

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

  // --------------------------------------------------
  // ADD SPECIFICATION
  // --------------------------------------------------

  const addSpecification = () => {
    setSpecifications((prev) => [
      ...prev,
      {
        key: "",
        value: "",
      },
    ]);
  };

  // --------------------------------------------------
  // REMOVE SPECIFICATION
  // --------------------------------------------------

  const removeSpecification = (
    index
  ) => {
    setSpecifications((prev) =>
      prev.filter(
        (_, i) => i !== index
      )
    );
  };

  // --------------------------------------------------
  // SUBMIT
  // --------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const token =
        localStorage.getItem(
          "token"
        );

      if (!token) {
        toast.error(
          "Please login again"
        );

        router.push(
          "/login"
        );

        return;
      }

      // --------------------------------------------------
      // BUILD SPECIFICATIONS OBJECT
      // --------------------------------------------------

      const specificationObject = {};

      specifications.forEach(
        (spec) => {
          const key =
            spec.key.trim();

          const value =
            spec.value.trim();

          if (key && value) {
            specificationObject[
              key
            ] = value;
          }
        }
      );

      // --------------------------------------------------
      // CREATE PRODUCT
      // --------------------------------------------------

      await apiFetch(
        "/api/products",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            name:
              formData.name,

            price:
              Number(
                formData.price
              ),

            description:
              formData.description,

            image:
              formData.image,

            category:
              formData.category,

            countInStock:
              Number(
                formData.countInStock
              ),

            specifications:
              specificationObject,
          }),
        }
      );

      toast.success(
        "Product added successfully!"
      );

      router.push(
        "/admin"
      );

    } catch (error) {
      console.error(error);

      toast.error(
        error.message ||
          "Failed to add product"
      );

    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <ProtectedRoute>

      <div
        style={{
          maxWidth:
            "900px",
          margin:
            "50px auto",
          padding:
            "20px",
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
            padding:
              "40px",
          }}
        >

          <h1
            style={{
              fontSize:
                "42px",
              marginBottom:
                "30px",
              textAlign:
                "center",
            }}
          >
            Add New Product 📦
          </h1>

          <form
            onSubmit={
              handleSubmit
            }
            style={{
              display:
                "grid",
              gap:
                "20px",
            }}
          >

            {/* NAME */}

            <input
              type="text"
              name="name"
              placeholder="Product Name"
              value={
                formData.name
              }
              onChange={
                handleChange
              }
              required
            />

            {/* PRICE */}

            <input
              type="number"
              name="price"
              placeholder="Price"
              value={
                formData.price
              }
              onChange={
                handleChange
              }
              min="0"
              required
            />

            {/* DESCRIPTION */}

            <textarea
              name="description"
              placeholder="Description"
              rows="5"
              value={
                formData.description
              }
              onChange={
                handleChange
              }
              required
            />

            {/* IMAGE URL */}

            <input
              type="text"
              name="image"
              placeholder="Paste Image URL"
              value={
                formData.image.startsWith(
                  "data:"
                )
                  ? ""
                  : formData.image
              }
              onChange={
                handleChange
              }
            />

            {/* IMAGE UPLOAD */}

            <div>

              <label
                style={{
                  display:
                    "block",
                  marginBottom:
                    "10px",
                  fontWeight:
                    "600",
                }}
              >
                Upload Product Image
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={
                  handleFileUpload
                }
              />

            </div>

            {/* IMAGE PREVIEW */}

            {formData.image && (
              <div
                style={{
                  textAlign:
                    "center",
                }}
              >
                <img
                  src={
                    formData.image
                  }
                  alt="Preview"
                  style={{
                    maxWidth:
                      "250px",
                    maxHeight:
                      "250px",
                    objectFit:
                      "contain",
                    borderRadius:
                      "10px",
                  }}
                />
              </div>
            )}

            {/* CATEGORY */}

            <input
              type="text"
              name="category"
              placeholder="Category"
              value={
                formData.category
              }
              onChange={
                handleChange
              }
              required
            />

            {/* STOCK */}

            <input
              type="number"
              name="countInStock"
              placeholder="Stock Count"
              value={
                formData.countInStock
              }
              onChange={
                handleChange
              }
              min="0"
              required
            />

            {/* ==================================================
                TECHNICAL SPECIFICATIONS
            ================================================== */}

            <div
              style={{
                marginTop:
                  "20px",
                padding:
                  "25px",
                borderRadius:
                  "18px",
                background:
                  "rgba(255,255,255,0.05)",
                border:
                  "1px solid rgba(255,255,255,0.1)",
              }}
            >

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  gap:
                    "15px",
                  marginBottom:
                    "20px",
                  flexWrap:
                    "wrap",
                }}
              >

                <div>

                  <h2
                    style={{
                      margin:
                        0,
                      fontSize:
                        "24px",
                    }}
                  >
                    Technical Specifications
                  </h2>

                  <p
                    style={{
                      opacity:
                        0.6,
                      margin:
                        "6px 0 0",
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
                >
                  + Add Specification
                </button>

              </div>

              <div
                style={{
                  display:
                    "grid",
                  gap:
                    "12px",
                }}
              >

                {specifications.map(
                  (
                    spec,
                    index
                  ) => (

                    <div
                      key={
                        index
                      }
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "1fr 1fr auto",
                        gap:
                          "10px",
                        alignItems:
                          "center",
                      }}
                    >

                      <input
                        type="text"
                        placeholder="Specification"
                        value={
                          spec.key
                        }
                        onChange={(
                          e
                        ) =>
                          handleSpecificationChange(
                            index,
                            "key",
                            e.target
                              .value
                          )
                        }
                      />

                      <input
                        type="text"
                        placeholder="Value"
                        value={
                          spec.value
                        }
                        onChange={(
                          e
                        ) =>
                          handleSpecificationChange(
                            index,
                            "value",
                            e.target
                              .value
                          )
                        }
                      />

                      <button
                        type="button"
                        onClick={() =>
                          removeSpecification(
                            index
                          )
                        }
                        disabled={
                          specifications.length ===
                          1
                        }
                        style={{
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

            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={
                loading
              }
            >
              {loading
                ? "Adding..."
                : "Add Product"}
            </button>

          </form>

        </motion.div>

      </div>

    </ProtectedRoute>
  );
}