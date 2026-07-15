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

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        image: reader.result,
      }));

      toast.success("Image uploaded");
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please login again");
        router.push("/login");
        return;
      }

      await apiFetch("/api/products", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          price: Number(formData.price),
          description: formData.description,
          image: formData.image,
          category: formData.category,
          countInStock: Number(formData.countInStock),
        }),
      });

      toast.success("Product added successfully!");
      router.push("/admin");

    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to add product");

    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute adminOnly={true}>
      <div
        style={{
          maxWidth: "900px",
          margin: "50px auto",
          padding: "20px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{
            padding: "40px",
          }}
        >
          <h1
            style={{
              fontSize: "42px",
              marginBottom: "30px",
              textAlign: "center",
            }}
          >
            Add New Product 📦
          </h1>

          <form
            onSubmit={handleSubmit}
            style={{
              display: "grid",
              gap: "20px",
            }}
          >
            <input
              type="text"
              name="name"
              placeholder="Product Name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <input
              type="number"
              name="price"
              placeholder="Price"
              value={formData.price}
              onChange={handleChange}
              required
            />

            <textarea
              name="description"
              placeholder="Description"
              rows="5"
              value={formData.description}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="image"
              placeholder="Paste Image URL"
              value={
                formData.image.startsWith("data:")
                  ? ""
                  : formData.image
              }
              onChange={handleChange}
            />

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  fontWeight: "600",
                }}
              >
                Upload Product Image
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
              />
            </div>

            {formData.image && (
              <div
                style={{
                  textAlign: "center",
                }}
              >
                <img
                  src={formData.image}
                  alt="Preview"
                  style={{
                    maxWidth: "250px",
                    maxHeight: "250px",
                    objectFit: "contain",
                    borderRadius: "10px",
                  }}
                />
              </div>
            )}

            <input
              type="text"
              name="category"
              placeholder="Category"
              value={formData.category}
              onChange={handleChange}
              required
            />

            <input
              type="number"
              name="countInStock"
              placeholder="Stock Count"
              value={formData.countInStock}
              onChange={handleChange}
              required
            />

            <button
              type="submit"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Product"}
            </button>
          </form>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}