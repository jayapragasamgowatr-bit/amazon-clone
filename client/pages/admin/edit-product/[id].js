import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { apiFetch } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

export default function EditProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    image: "",
    category: "",
    countInStock: "",
  });

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const product = await apiFetch(`/api/products/${id}`);

      setFormData({
        name: product.name || "",
        price: product.price || "",
        description: product.description || "",
        image: product.image || "",
        category: product.category || "",
        countInStock: product.countInStock || "",
      });
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await apiFetch(`/api/products/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(formData),
      });

      toast.success("Product updated");
      router.push("/admin");

    } catch (error) {
      toast.error(error.message);
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
        <div
          className="glass-card"
          style={{
            padding: "40px",
          }}
        >
          <h1
            style={{
              fontSize: "42px",
              marginBottom: "30px",
            }}
          >
            Edit Product ✏️
          </h1>

          <form
            onSubmit={handleSubmit}
            style={{
              display: "grid",
              gap: "20px",
            }}
          >
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Name"
            />

            <input
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Price"
            />

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
            />

            <input
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="Image URL"
            />

            <input
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="Category"
            />

            <input
              name="countInStock"
              value={formData.countInStock}
              onChange={handleChange}
              placeholder="Stock"
            />

            <button type="submit">
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}