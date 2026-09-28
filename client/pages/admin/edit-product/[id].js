import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { apiFetch } from "../../../lib/api";
import { motion } from "framer-motion";

const MAX_IMAGES = 8;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function EditProductPage() {
  const router = useRouter();
  const { id } = router.query;

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    image: "",
    category: "",
    countInStock: "",
  });

  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [specifications, setSpecifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (router.isReady && id) fetchProduct();
  }, [router.isReady, id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/products/${id}`);
      const product = data?.product || data?.data?.product || data;
      if (!product) throw new Error("Product not found");

      const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
      if (product.image && !images.includes(product.image)) images.unshift(product.image);

      setFormData({
        name: product.name || "",
        price: product.price ?? "",
        description: product.description || "",
        image: product.image || images[0] || "",
        category: product.category || "",
        countInStock: product.countInStock ?? "",
      });
      setExistingImages(images.slice(0, MAX_IMAGES));

      const specs = product.specifications || {};
      setSpecifications(Object.entries(specs).map(([key, value]) => ({ key, value: String(value ?? "") })));
    } catch (error) {
      console.error("FETCH PRODUCT ERROR:", error);
      toast.error(error?.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUrlChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, image: value }));
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const remaining = MAX_IMAGES - existingImages.length - newFiles.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed.`);
      e.target.value = "";
      return;
    }

    const valid = selected.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image.`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is larger than 5 MB.`);
        return false;
      }
      return true;
    }).slice(0, remaining);

    if (valid.length) {
      setNewFiles((prev) => [...prev, ...valid]);
      toast.success(`${valid.length} image${valid.length === 1 ? "" : "s"} selected`);
    }
    e.target.value = "";
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setFormData((current) => ({
        ...current,
        image: current.image === prev[index] ? (next[0] || "") : current.image,
      }));
      return next;
    });
  };

  const removeNewFile = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const specificationChange = (index, field, value) => {
    setSpecifications((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addSpecification = () => setSpecifications((prev) => [...prev, { key: "", value: "" }]);
  const removeSpecification = (index) => setSpecifications((prev) => prev.filter((_, i) => i !== index));

  const newFilePreviews = useMemo(
    () => newFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [newFiles]
  );

  useEffect(() => {
    return () => newFilePreviews.forEach((item) => URL.revokeObjectURL(item.url));
  }, [newFilePreviews]);

  const uploadNewImages = async () => {
    if (!newFiles.length) return null;

    const form = new FormData();
    newFiles.forEach((file) => form.append("images", file));

    return apiFetch(`/api/products/${id}/images`, {
      method: "POST",
      auth: true,
      body: form,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!id) return toast.error("Invalid product ID");

    const name = String(formData.name || "").trim();
    const description = String(formData.description || "").trim();
    const category = String(formData.category || "").trim();
    const image = String(formData.image || "").trim();
    const price = Number(formData.price);
    const countInStock = Number(formData.countInStock);

    if (!name) return toast.error("Product name is required");
    if (!Number.isFinite(price) || price < 0) return toast.error("Enter a valid product price");
    if (!description) return toast.error("Product description is required");
    if (!Number.isFinite(countInStock) || countInStock < 0) return toast.error("Enter a valid stock quantity");

    const specificationObject = {};
    specifications.forEach((spec) => {
      const key = String(spec?.key || "").trim();
      const value = String(spec?.value || "").trim();
      if (key && value) specificationObject[key] = value;
    });

    // Keep the manually supplied URL as the first image, followed by saved gallery images.
    const images = Array.from(new Set([image, ...existingImages].filter(Boolean))).slice(0, MAX_IMAGES);

    try {
      setSaving(true);

      await apiFetch(`/api/products/${id}`, {
        method: "PUT",
        auth: true,
        body: {
          name,
          price,
          description,
          image: images[0] || "",
          images,
          category,
          countInStock,
          specifications: specificationObject,
        },
      });

      if (newFiles.length) {
        await uploadNewImages();
      }

      toast.success("Product updated successfully");
      setTimeout(() => router.push("/admin/products"), 500);
    } catch (error) {
      console.error("UPDATE PRODUCT ERROR:", error);
      toast.error(error?.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div style={{ maxWidth: 900, margin: "80px auto", padding: 20, textAlign: "center" }}>
          <div className="glass-card" style={{ padding: 40 }}><h2>Loading product...</h2></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main style={{ minHeight: "100vh", padding: "40px 20px 80px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: 40, borderRadius: 24 }}>
            <div style={{ marginBottom: 30 }}>
              <h1 style={{ fontSize: 42, margin: 0, marginBottom: 8, fontWeight: 900 }}>Edit Product ✏️</h1>
              <p style={{ opacity: 0.65, margin: 0 }}>Update product information, gallery images and technical specifications.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 22 }}>
              <Field label="Product Name">
                <input type="text" name="name" value={formData.name} onChange={handleChange} required style={inputStyle} />
              </Field>

              <Field label="Price">
                <input type="number" name="price" value={formData.price} onChange={handleChange} min="0" step="0.01" required style={inputStyle} />
              </Field>

              <Field label="Category">
                <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="Flow Meters" style={inputStyle} />
              </Field>

              <Field label="Stock Quantity">
                <input type="number" name="countInStock" value={formData.countInStock} onChange={handleChange} min="0" step="1" required style={inputStyle} />
              </Field>

              <Field label="Description">
                <textarea name="description" value={formData.description} onChange={handleChange} rows={7} required style={{ ...inputStyle, resize: "vertical", minHeight: 150 }} />
              </Field>

              <section style={sectionStyle}>
                <div style={sectionHeaderStyle}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 24 }}>Product Images</h2>
                    <p style={{ opacity: 0.65, margin: "6px 0 0", fontSize: 14 }}>
                      Upload up to {MAX_IMAGES} images. The first image is used as the main product image.
                    </p>
                  </div>
                  <strong>{existingImages.length + newFiles.length}/{MAX_IMAGES}</strong>
                </div>

                <Field label="Main Image URL (optional)">
                  <input type="url" value={formData.image} onChange={handleImageUrlChange} placeholder="https://..." style={inputStyle} />
                </Field>

                <div style={{ marginTop: 16 }}>
                  <label style={uploadLabel}>
                    <span style={{ fontSize: 18 }}>📷</span>
                    Upload Multiple Images
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleFileChange} hidden />
                  </label>
                  <p style={{ opacity: 0.55, fontSize: 12, marginTop: 8 }}>JPEG, PNG, WEBP or GIF • Maximum 5 MB each</p>
                </div>

                {(existingImages.length > 0 || newFilePreviews.length > 0) && (
                  <div style={galleryGrid}>
                    {existingImages.map((src, index) => (
                      <div key={`existing-${src}-${index}`} style={imageCard}>
                        <img src={src} alt={`${formData.name} ${index + 1}`} style={thumbStyle} />
                        {index === 0 && <span style={mainBadge}>MAIN</span>}
                        <button type="button" onClick={() => removeExistingImage(index)} style={removeImageButton}>×</button>
                      </div>
                    ))}
                    {newFilePreviews.map((item, index) => (
                      <div key={`new-${item.file.name}-${index}`} style={imageCard}>
                        <img src={item.url} alt={item.file.name} style={thumbStyle} />
                        <span style={newBadge}>NEW</span>
                        <button type="button" onClick={() => removeNewFile(index)} style={removeImageButton}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section style={sectionStyle}>
                <div style={sectionHeaderStyle}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 24 }}>Technical Specifications</h2>
                    <p style={{ opacity: 0.6, margin: "6px 0 0", fontSize: 14 }}>Add product-specific technical details.</p>
                  </div>
                  <button type="button" onClick={addSpecification} style={buttonStyle}>+ Add Specification</button>
                </div>

                {specifications.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 25, opacity: 0.6 }}>No specifications added yet.</div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {specifications.map((spec, index) => (
                      <div key={index} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "center" }}>
                        <input type="text" placeholder="Specification" value={spec.key} onChange={(e) => specificationChange(index, "key", e.target.value)} style={inputStyle} />
                        <input type="text" placeholder="Value" value={spec.value} onChange={(e) => specificationChange(index, "value", e.target.value)} style={inputStyle} />
                        <button type="button" onClick={() => removeSpecification(index)} style={{ ...buttonStyle, background: "rgba(239,68,68,0.2)", color: "#fca5a5", padding: "10px 14px" }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                <button type="button" onClick={() => router.push("/admin/products")} disabled={saving} style={{ ...buttonStyle, background: "rgba(255,255,255,0.1)" }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ ...buttonStyle, minWidth: 180 }}>{saving ? "Saving..." : "Save Changes"}</button>
              </div>
            </form>
          </motion.div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "14px 16px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "inherit",
  outline: "none",
  fontSize: 15,
};

const buttonStyle = {
  border: 0,
  borderRadius: 12,
  padding: "12px 18px",
  color: "#fff",
  background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
  fontWeight: 800,
  cursor: "pointer",
};

const sectionStyle = {
  padding: 24,
  borderRadius: 20,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.03)",
};

const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 15,
  marginBottom: 20,
  flexWrap: "wrap",
};

const uploadLabel = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  padding: "13px 18px",
  borderRadius: 12,
  cursor: "pointer",
  color: "#fff",
  background: "linear-gradient(135deg,#06b6d4,#7c3aed)",
  fontWeight: 800,
};

const galleryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))",
  gap: 14,
  marginTop: 20,
};

const imageCard = {
  position: "relative",
  minHeight: 150,
  overflow: "hidden",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.2)",
};

const thumbStyle = {
  width: "100%",
  height: 150,
  display: "block",
  objectFit: "cover",
};

const removeImageButton = {
  position: "absolute",
  top: 7,
  right: 7,
  width: 30,
  height: 30,
  border: 0,
  borderRadius: "50%",
  background: "rgba(0,0,0,0.72)",
  color: "#fff",
  fontSize: 22,
  cursor: "pointer",
};

const mainBadge = {
  position: "absolute",
  left: 8,
  bottom: 8,
  padding: "4px 7px",
  borderRadius: 6,
  background: "rgba(6,182,212,0.9)",
  color: "#fff",
  fontSize: 10,
  fontWeight: 900,
};

const newBadge = {
  position: "absolute",
  left: 8,
  bottom: 8,
  padding: "4px 7px",
  borderRadius: 6,
  background: "rgba(124,58,237,0.9)",
  color: "#fff",
  fontSize: 10,
  fontWeight: 900,
};
