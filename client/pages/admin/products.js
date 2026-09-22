import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import toast from "react-hot-toast";

import {
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  Package,
  X,
} from "lucide-react";

import {
  apiFetch,
  createProduct,
  updateProduct,
  deleteProduct as deleteProductApi,
  getAdminProducts,
  updateProductStock,
} from "../../lib/api";

import { useAuth } from "../../context/AuthContext";

const CATEGORIES = [
  "Flow Meters",
  "Level Sensors",
  "Water Quality",
  "IoT & Automation",
  "Controllers & Gateways",
  "Valves",
  "Accessories",
];

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "Flow Meters",
  countInStock: "",
  image: "",
  specifications: {},
  features: [],
  applications: [],
};

export default function AdminProducts() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalProducts: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [summary, setSummary] = useState({
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    outOfStockProducts: 0,
    lowStockProducts: 0,
    lowStockThreshold: 5,
  });
  const [stockUpdatingId, setStockUpdatingId] = useState(null);
  const [activeUpdatingId, setActiveUpdatingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(emptyForm);

  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");

  const [featureText, setFeatureText] = useState("");
  const [applicationText, setApplicationText] = useState("");

  // =====================================================
  // AUTH + SERVER-SIDE PRODUCT LIST
  // =====================================================

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.isAdmin !== true && user.role !== "admin") {
      toast.error("Admin access only");
      router.replace("/");
      return;
    }
  }, [authLoading, user, router]);

  const fetchProducts = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const data = await getAdminProducts({
        page,
        limit,
        search: search.trim(),
        category: category === "All" ? "" : category,
        status: statusFilter,
        lowStockThreshold,
      });

      setProducts(Array.isArray(data?.products) ? data.products : []);
      setPagination(data?.pagination || {
        page,
        limit,
        totalProducts: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
      setSummary(data?.summary || {
        totalProducts: 0,
        activeProducts: 0,
        inactiveProducts: 0,
        outOfStockProducts: 0,
        lowStockProducts: 0,
        lowStockThreshold,
      });
    } catch (error) {
      console.error("ADMIN PRODUCTS ERROR:", error);
      toast.error(error?.message || "Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const timer = setTimeout(() => {
      fetchProducts();
    }, 350);

    return () => clearTimeout(timer);
  }, [user, page, search, category, statusFilter, lowStockThreshold]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleCategoryChange = (value) => {
    setCategory(value);
    setPage(1);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchProducts();
      toast.success("Products refreshed.");
    } catch (error) {
      console.error("REFRESH PRODUCTS ERROR:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleStockUpdate = async (product) => {
    const current = Number(product?.countInStock) || 0;
    const input = window.prompt(
      `Set stock quantity for "${product?.name || "product"}":`,
      String(current)
    );

    if (input === null) return;

    const value = Number(input);

    if (!Number.isInteger(value) || value < 0) {
      toast.error("Stock must be a non-negative whole number.");
      return;
    }

    try {
      setStockUpdatingId(product._id);

      const data = await updateProductStock(product._id, value);
      const updated = data?.product;

      setProducts((previous) =>
        previous.map((item) =>
          item._id === product._id
            ? { ...item, ...(updated || {}), countInStock: value }
            : item
        )
      );

      // Update visible stock summary immediately so the dashboard cards
      // never remain stale while the server refresh is completing.
      setSummary((previous) => {
        const oldStock = Number(product?.countInStock) || 0;
        const wasOut = oldStock === 0;
        const isOut = value === 0;
        const wasLow = oldStock > 0 && oldStock <= lowStockThreshold;
        const isLow = value > 0 && value <= lowStockThreshold;

        return {
          ...previous,
          inStockProducts: Math.max(
            0,
            Number(previous?.inStockProducts || 0) +
              (isOut ? 0 : 1) -
              (wasOut ? 0 : 1)
          ),
          outOfStockProducts: Math.max(
            0,
            Number(previous?.outOfStockProducts || 0) +
              (isOut ? 1 : 0) -
              (wasOut ? 1 : 0)
          ),
          lowStockProducts: Math.max(
            0,
            Number(previous?.lowStockProducts || 0) +
              (isLow ? 1 : 0) -
              (wasLow ? 1 : 0)
          ),
        };
      });

      toast.success("Stock updated successfully.");
      await fetchProducts();
    } catch (error) {
      console.error("UPDATE STOCK ERROR:", error);
      toast.error(error?.message || "Failed to update stock.");
    } finally {
      setStockUpdatingId(null);
    }
  };

  const handleToggleActive = async (product) => {
    const nextActive = product?.isActive !== true;

    try {
      setActiveUpdatingId(product._id);

      await updateProduct(product._id, {
        isActive: nextActive,
      });

      setProducts((previous) =>
        previous.map((item) =>
          item._id === product._id
            ? { ...item, isActive: nextActive }
            : item
        )
      );

      toast.success(
        nextActive ? "Product activated." : "Product deactivated."
      );

      await fetchProducts();
    } catch (error) {
      console.error("TOGGLE PRODUCT ERROR:", error);
      toast.error(error?.message || "Failed to update product status.");
    } finally {
      setActiveUpdatingId(null);
    }
  };

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // ADD SPECIFICATION
  // =====================================================

  const addSpecification = () => {
    if (
      !specKey.trim() ||
      !specValue.trim()
    ) {
      toast.error(
        "Enter specification name and value"
      );
      return;
    }

    setForm((prev) => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [specKey.trim()]:
          specValue.trim(),
      },
    }));

    setSpecKey("");
    setSpecValue("");
  };

  // =====================================================
  // REMOVE SPECIFICATION
  // =====================================================

  const removeSpecification = (key) => {
    setForm((prev) => {
      const updated = {
        ...prev.specifications,
      };

      delete updated[key];

      return {
        ...prev,
        specifications: updated,
      };
    });
  };

  // =====================================================
  // ADD FEATURE
  // =====================================================

  const addFeature = () => {
    if (!featureText.trim()) return;

    setForm((prev) => ({
      ...prev,
      features: [
        ...prev.features,
        featureText.trim(),
      ],
    }));

    setFeatureText("");
  };

  // =====================================================
  // REMOVE FEATURE
  // =====================================================

  const removeFeature = (index) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.filter(
        (_, i) => i !== index
      ),
    }));
  };

  // =====================================================
  // ADD APPLICATION
  // =====================================================

  const addApplication = () => {
    if (!applicationText.trim()) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      applications: [
        ...prev.applications,
        applicationText.trim(),
      ],
    }));

    setApplicationText("");
  };

  // =====================================================
  // REMOVE APPLICATION
  // =====================================================

  const removeApplication = (index) => {
    setForm((prev) => ({
      ...prev,
      applications:
        prev.applications.filter(
          (_, i) => i !== index
        ),
    }));
  };

  // =====================================================
  // OPEN ADD FORM
  // =====================================================

  const openAddForm = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,
      specifications: {},
      features: [],
      applications: [],
    });

    setSpecKey("");
    setSpecValue("");
    setFeatureText("");
    setApplicationText("");

    setShowForm(true);
  };

  // =====================================================
  // OPEN EDIT FORM
  // =====================================================

  const openEditForm = (product) => {
    setEditingId(product._id);

    setForm({
      name: product.name || "",

      description:
        product.description || "",

      price:
        product.price ?? "",

      category:
        product.category ||
        "Flow Meters",

      countInStock:
        product.countInStock ?? 0,

      image:
        product.image || "",

      specifications:
        product.specifications ||
        product.specs ||
        {},

      features:
        Array.isArray(product.features)
          ? product.features
          : [],

      applications:
        Array.isArray(
          product.applications
        )
          ? product.applications
          : [],
    });

    setSpecKey("");
    setSpecValue("");
    setFeatureText("");
    setApplicationText("");

    setShowForm(true);
  };

  // =====================================================
  // CLOSE FORM
  // =====================================================

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);

    setSpecKey("");
    setSpecValue("");
    setFeatureText("");
    setApplicationText("");

    setForm({
      ...emptyForm,
      specifications: {},
      features: [],
      applications: [],
    });
  };

  // =====================================================
  // SAVE PRODUCT
  // =====================================================

  const saveProduct = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error(
        "Product name is required"
      );
      return;
    }

    if (!form.description.trim()) {
      toast.error(
        "Product description is required"
      );
      return;
    }

    if (
      form.price === "" ||
      Number(form.price) < 0
    ) {
      toast.error(
        "Enter a valid price"
      );
      return;
    }

    if (
      form.countInStock === "" ||
      Number(form.countInStock) < 0
    ) {
      toast.error(
        "Enter valid stock"
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),

        description:
          form.description.trim(),

        price: Number(form.price),

        category: form.category,

        countInStock:
          Number(form.countInStock),

        image:
          form.image.trim(),

        specifications:
          form.specifications,

        features:
          form.features,

        applications:
          form.applications,
      };

      // =================================================
      // UPDATE
      // =================================================

      if (editingId) {
        console.log(
          "UPDATING PRODUCT:",
          editingId
        );

        await updateProduct(
          editingId,
          payload
        );

        toast.success(
          "Product updated successfully"
        );
      }

      // =================================================
      // CREATE
      // =================================================

      else {
        console.log(
          "CREATING PRODUCT"
        );

        await createProduct(
          payload
        );

        toast.success(
          "Product created successfully"
        );
      }

      closeForm();

      await fetchProducts();

    } catch (error) {
      console.error(
        "SAVE PRODUCT ERROR:",
        error
      );

      toast.error(
        error.message ||
          "Failed to save product"
      );

    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE PRODUCT
  // =====================================================

  const deleteProduct = async (product) => {
    const confirmed =
      window.confirm(
        `Delete "${product.name}"?`
      );

    if (!confirmed) return;

    try {
      console.log(
        "DELETING PRODUCT:",
        product._id
      );

      await deleteProductApi(
        product._id
      );

      toast.success(
        "Product deleted"
      );

      setProducts((prev) =>
        prev.filter(
          (item) =>
            item._id !==
            product._id
        )
      );

    } catch (error) {
      console.error(
        "DELETE PRODUCT ERROR:",
        error
      );

      toast.error(
        error.message ||
          "Failed to delete product"
      );
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (
    authLoading ||
    (loading && !products.length)
  ) {
    return <AdminLoading />;
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="admin-products-page">

      <div className="admin-container">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="page-header">

          <div>

            <div className="eyebrow">
              ADMIN PANEL
            </div>

            <h1>
              Products
            </h1>

            <p>
              Manage your water
              management products.
            </p>

          </div>

          <div className="header-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={handleRefresh}
              disabled={loading || refreshing}
            >
              <RefreshCw
                size={17}
                className={
                  loading || refreshing
                    ? "spin"
                    : ""
                }
              />

              Refresh
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={openAddForm}
            >
              <Plus size={18} />

              Add Product
            </button>

          </div>

        </div>

        {/* ================================================= */}
        {/* FILTER */}
        {/* ================================================= */}

        <div className="filter-card">

          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search products or category..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>

          <label className="threshold-field">
            <span>Low-stock threshold</span>
            <input
              type="number"
              min="0"
              max="1000000"
              value={lowStockThreshold}
              onChange={(e) => {
                const value = Math.max(0, Number(e.target.value) || 0);
                setLowStockThreshold(value);
                setPage(1);
              }}
            />
          </label>

        </div>

        {/* ================================================= */}
        {/* STATS */}
        {/* ================================================= */}

        <div className="stats-grid">

          <StatCard
            title="Total Products : "
            value={summary.totalProducts || 0}
            icon={
              <Package size={21} />
            }
          />

          <StatCard
            title="In Stock : "
            value={
              summary.inStockProducts !== undefined
                ? summary.inStockProducts
                : products.filter(
                    (product) =>
                      Number(product?.countInStock || 0) > 0
                  ).length
            }
            icon={
              <span>✓</span>
            }
          />

          <StatCard
            title="Out of Stock : "
            value={summary.outOfStockProducts || 0}
            icon={
              <span>!</span>
            }
          />

          <StatCard
            title="Low Stock : "
            value={summary.lowStockProducts || 0}
            icon={
              <span>⚠</span>
            }
          />

          <StatCard
            title="Inactive : "
            value={summary.inactiveProducts || 0}
            icon={
              <span>○</span>
            }
          />

        </div>

        {/* ================================================= */}
        {/* PRODUCTS TABLE */}
        {/* ================================================= */}

        {products.length === 0 ? (

          <div className="empty-card">

            <Package
              size={48}
              strokeWidth={1.5}
            />

            <h2>
              No products found
            </h2>

            <p>
              Add your first product
              to get started.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={openAddForm}
            >
              <Plus size={18} />

              Add Product
            </button>

          </div>

        ) : (

          <div className="table-card">

            <div className="table-wrapper">

              <table>

                <thead>

                  <tr>

                    <th>
                      Product
                    </th>

                    <th>
                      Category
                    </th>

                    <th>
                      Price
                    </th>

                    <th>
                      Stock
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Rating
                    </th>

                    <th className="actions-header">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {products.map(
                    (product) => (

                      <tr
                        key={
                          product._id
                        }
                      >

                        {/* PRODUCT */}

                        <td>

                          <div className="product-info">

                            <div className="product-image">

                              {product.image ? (

                                <img
                                  src={
                                    product.image
                                  }
                                  alt={
                                    product.name
                                  }
                                />

                              ) : (

                                <Package
                                  size={25}
                                />

                              )}

                            </div>

                            <div>

                              <strong>
                                {
                                  product.name
                                }
                              </strong>

                              <span>
                                ID:{" "}
                                {
                                  product._id
                                }
                              </span>

                            </div>

                          </div>

                        </td>

                        {/* CATEGORY */}

                        <td>

                          <span className="category-badge">

                            {
                              product.category ||
                              "Uncategorized"
                            }

                          </span>

                        </td>

                        {/* PRICE */}

                        <td>

                          <strong>
                            ₹
                            {Number(
                              product.price ||
                                0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </strong>

                        </td>

                        {/* STOCK */}

                        <td>
                          <div className="stock-cell">
                            <span
                              className={
                                Number(product.countInStock || 0) <= 0
                                  ? "stock-badge out"
                                  : Number(product.countInStock || 0) <= lowStockThreshold
                                  ? "stock-badge low"
                                  : "stock-badge in"
                              }
                            >
                              {Number(product.countInStock || 0) <= 0
                                ? "Out of stock "
                                : `${product.countInStock} in stock`}
                            </span>

                            <button
                              type="button"
                              className="stock-edit-button"
                              onClick={() => handleStockUpdate(product)}
                              disabled={stockUpdatingId === product._id}
                              title="Update stock"
                            >
                              {stockUpdatingId === product._id ? "..." : "Edit"}
                            </button>
                          </div>
                        </td>

                        {/* STATUS */}

                        <td>
                          <button
                            type="button"
                            className={`active-badge ${product.isActive !== false ? "active" : "inactive"}`}
                            onClick={() => handleToggleActive(product)}
                            disabled={activeUpdatingId === product._id}
                            title="Toggle active status"
                          >
                            {activeUpdatingId === product._id
                              ? "..."
                              : product.isActive !== false
                              ? "Active"
                              : "Inactive"}
                          </button>
                        </td>

                        {/* RATING */}

                        <td>

                          <span className="rating">

                            <span className="star">
                              ★
                            </span>

                            {Number(
                              product.rating ||
                                0
                            ).toFixed(1)}

                            <small>
                              {" "}
                              (
                              {
                                product.numReviews ||
                                0
                              }
                              )
                            </small>

                          </span>

                        </td>

                        {/* ACTIONS */}

                        <td className="actions-cell">

                          <div className="action-buttons">

                            {/* EDIT */}

                            <button
                              type="button"
                              className="icon-button edit"
                              title="Edit product"
                              aria-label="Edit product"
                              onClick={() =>
                                openEditForm(
                                  product
                                )
                              }
                            >

                              <Pencil
                                size={17}
                                strokeWidth={2.5}
                              />

                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              className="icon-button delete"
                              title="Delete product"
                              aria-label="Delete product"
                              onClick={() =>
                                deleteProduct(
                                  product
                                )
                              }
                            >

                              <Trash2
                                size={17}
                                strokeWidth={2.5}
                              />

                            </button>

                            {/* REVIEWS */}

                            <Link
                              href={`/admin/reviews?product=${product._id}`}
                              className="review-link"
                              title={`Manage ${product.numReviews || 0} review(s)`}
                            >
                              Reviews
                            </Link>

                            {/* VIEW */}

                            <Link
                              href={`/product/${product._id}`}
                              className="view-link"
                            >
                              View
                            </Link>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}

      </div>

      <div className="pagination-bar">
        <span>
          Showing {products.length} of {pagination.totalProducts || 0} products
        </span>

        <div className="pagination-controls">
          <button
            type="button"
            className="secondary-button"
            disabled={!pagination.hasPreviousPage}
            onClick={() => setPage((previous) => Math.max(1, previous - 1))}
          >
            ← Previous
          </button>

          <span className="page-number">
            Page <strong>{pagination.page || 1}</strong> of{" "}
            <strong>{pagination.totalPages || 1}</strong>
          </span>

          <button
            type="button"
            className="secondary-button"
            disabled={!pagination.hasNextPage}
            onClick={() =>
              setPage((previous) =>
                Math.min(pagination.totalPages || previous, previous + 1)
              )
            }
          >
            Next →
          </button>
        </div>
      </div>

      {/* ================================================= */}
      {/* PRODUCT FORM MODAL */}
      {/* ================================================= */}


      {showForm && (

        <div className="modal-overlay">

          <div className="product-modal">

            <div className="modal-header">

              <div>

                <div className="eyebrow">
                  PRODUCT MANAGEMENT
                </div>

                <h2>
                  {editingId
                    ? "Edit Product"
                    : "Add Product"}
                </h2>

              </div>

              <button
                type="button"
                className="close-button"
                onClick={closeForm}
                disabled={saving}
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={saveProduct}
            >

              {/* BASIC INFORMATION */}

              <div className="form-section">

                <h3>
                  Basic Information
                </h3>

                <div className="form-grid">

                  <FormField
                    label="Product Name"
                    full
                  >

                    <input
                      name="name"
                      value={
                        form.name
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Example: Electromagnetic Flow Meter"
                      required
                    />

                  </FormField>

                  <FormField label="Category">

                    <select
                      name="category"
                      value={
                        form.category
                      }
                      onChange={
                        handleChange
                      }
                    >

                      {CATEGORIES.map(
                        (item) => (

                          <option
                            key={item}
                            value={item}
                          >
                            {item}
                          </option>

                        )
                      )}

                    </select>

                  </FormField>

                  <FormField label="Price (₹)">

                    <input
                      type="number"
                      name="price"
                      value={
                        form.price
                      }
                      onChange={
                        handleChange
                      }
                      min="0"
                      step="0.01"
                      placeholder="0"
                      required
                    />

                  </FormField>

                  <FormField label="Stock">

                    <input
                      type="number"
                      name="countInStock"
                      value={
                        form.countInStock
                      }
                      onChange={
                        handleChange
                      }
                      min="0"
                      placeholder="0"
                      required
                    />

                  </FormField>

                  <FormField
                    label="Image URL"
                    full
                  >

                    <input
                      type="url"
                      name="image"
                      value={
                        form.image
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="https://..."
                    />

                  </FormField>

                  <FormField
                    label="Description"
                    full
                  >

                    <textarea
                      name="description"
                      value={
                        form.description
                      }
                      onChange={
                        handleChange
                      }
                      rows={5}
                      placeholder="Describe the product..."
                      required
                    />

                  </FormField>

                </div>

              </div>

              {/* SPECIFICATIONS */}

              <div className="form-section">

                <h3>
                  Technical Specifications
                </h3>

                <div className="inline-form">

                  <input
                    value={specKey}
                    onChange={(e) =>
                      setSpecKey(
                        e.target.value
                      )
                    }
                    placeholder="Specification"
                  />

                  <input
                    value={specValue}
                    onChange={(e) =>
                      setSpecValue(
                        e.target.value
                      )
                    }
                    placeholder="Value"
                  />

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={
                      addSpecification
                    }
                  >
                    Add
                  </button>

                </div>

                <div className="tag-list">

                  {Object.entries(
                    form.specifications
                  ).map(
                    ([key, value]) => (

                      <div
                        className="data-row"
                        key={key}
                      >

                        <strong>
                          {key}
                        </strong>

                        <span>
                          {String(value)}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            removeSpecification(
                              key
                            )
                          }
                        >
                          <X size={15} />
                        </button>

                      </div>

                    )
                  )}

                </div>

              </div>

              {/* FEATURES */}

              <div className="form-section">

                <h3>
                  Key Features
                </h3>

                <div className="inline-form">

                  <input
                    value={
                      featureText
                    }
                    onChange={(e) =>
                      setFeatureText(
                        e.target.value
                      )
                    }
                    placeholder="Example: Real-time monitoring"
                    onKeyDown={(e) => {

                      if (
                        e.key ===
                        "Enter"
                      ) {

                        e.preventDefault();

                        addFeature();

                      }

                    }}
                  />

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={
                      addFeature
                    }
                  >
                    Add
                  </button>

                </div>

                <div className="tag-list">

                  {form.features.map(
                    (
                      feature,
                      index
                    ) => (

                      <div
                        className="tag"
                        key={`${feature}-${index}`}
                      >

                        {feature}

                        <button
                          type="button"
                          onClick={() =>
                            removeFeature(
                              index
                            )
                          }
                        >
                          <X size={14} />
                        </button>

                      </div>

                    )
                  )}

                </div>

              </div>

              {/* APPLICATIONS */}

              <div className="form-section">

                <h3>
                  Applications
                </h3>

                <div className="inline-form">

                  <input
                    value={
                      applicationText
                    }
                    onChange={(e) =>
                      setApplicationText(
                        e.target.value
                      )
                    }
                    placeholder="Example: STP Plants"
                    onKeyDown={(e) => {

                      if (
                        e.key ===
                        "Enter"
                      ) {

                        e.preventDefault();

                        addApplication();

                      }

                    }}
                  />

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={
                      addApplication
                    }
                  >
                    Add
                  </button>

                </div>

                <div className="tag-list">

                  {form.applications.map(
                    (
                      application,
                      index
                    ) => (

                      <div
                        className="tag"
                        key={`${application}-${index}`}
                      >

                        {application}

                        <button
                          type="button"
                          onClick={() =>
                            removeApplication(
                              index
                            )
                          }
                        >
                          <X size={14} />
                        </button>

                      </div>

                    )
                  )}

                </div>

              </div>

              {/* FORM ACTIONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >

                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Product"
                    : "Create Product"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ================================================= */}
      {/* CSS */}
      {/* ================================================= */}

      <style jsx>{`

        .admin-products-page {
          min-height: 100vh;
          padding: 34px 28px 80px;
          background:
            radial-gradient(circle at 8% 8%, rgba(124, 58, 237, 0.20), transparent 28%),
            radial-gradient(circle at 92% 16%, rgba(6, 182, 212, 0.16), transparent 30%),
            linear-gradient(135deg, #090f22 0%, #151331 48%, #092b3b 100%);
          color: #f8fafc;
        }

        .admin-container {
          max-width: 1540px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          margin-bottom: 24px;
        }

        .eyebrow {
          color: #67e8f9;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1.8px;
          margin-bottom: 8px;
        }

        .page-header h1 {
          margin: 0;
          font-size: clamp(34px, 4vw, 50px);
          line-height: 1.05;
          font-weight: 900;
          letter-spacing: -1.2px;
        }

        .page-header p {
          margin: 9px 0 0;
          color: #aeb9cd;
          font-size: 15px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        button {
          font-family: inherit;
        }

        .primary-button,
        .secondary-button {
          min-height: 42px;
          border-radius: 11px;
          padding: 10px 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 800;
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease;
        }

        .primary-button {
          border: 1px solid rgba(56, 189, 248, .22);
          background: linear-gradient(135deg, #0ea5e9, #4f46e5);
          color: #fff;
          box-shadow: 0 10px 25px rgba(14, 165, 233, .16);
        }

        .secondary-button {
          background: rgba(255,255,255,.055);
          color: #e5edf8;
          border: 1px solid rgba(148,163,184,.18);
        }

        .primary-button:hover,
        .secondary-button:hover {
          transform: translateY(-1px);
        }

        .primary-button:disabled,
        .secondary-button:disabled {
          opacity: .55;
          cursor: not-allowed;
          transform: none;
        }

        .filter-card {
          display: grid;
          grid-template-columns: minmax(300px, 1.7fr) minmax(170px, 1fr) minmax(170px, 1fr) minmax(190px, 1fr);
          gap: 12px;
          align-items: stretch;
          padding: 14px;
          margin-bottom: 18px;
          border: 1px solid rgba(148,163,184,.14);
          border-radius: 18px;
          background: rgba(255,255,255,.055);
          box-shadow: 0 18px 50px rgba(0,0,0,.16);
          backdrop-filter: blur(16px);
        }

        .search-box,
        .filter-card > select,
        .threshold-field {
          min-height: 48px;
          box-sizing: border-box;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          border-radius: 11px;
          border: 1px solid rgba(148,163,184,.18);
          background: rgba(7,13,31,.32);
          color: #9fb0c8;
        }

        .search-box:focus-within {
          border-color: rgba(56,189,248,.55);
          box-shadow: 0 0 0 3px rgba(56,189,248,.08);
        }

        .search-box input {
          border: 0;
          outline: 0;
          background: transparent;
          color: #f8fafc;
          width: 100%;
          padding: 12px 0;
          font-size: 14px;
        }

        .search-box input::placeholder {
          color: #71809a;
        }

        input,
        textarea,
        select {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid rgba(148,163,184,.18);
          border-radius: 11px;
          padding: 12px;
          background: rgba(7,13,31,.32);
          color: #f8fafc;
          outline: none;
          font-family: inherit;
          font-size: 14px;
        }

        select option {
          background: #11182e;
          color: #fff;
        }

        input:focus,
        textarea:focus,
        select:focus {
          border-color: rgba(56,189,248,.55);
          box-shadow: 0 0 0 3px rgba(56,189,248,.07);
        }

        .threshold-field {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 12px;
          border: 1px solid rgba(148,163,184,.18);
          border-radius: 11px;
          background: rgba(7,13,31,.32);
        }

        .threshold-field span {
          color: #8fa0b8;
          white-space: nowrap;
          font-size: 11px;
          font-weight: 700;
        }

        .threshold-field input {
          width: 72px;
          margin-left: auto;
          border: 0;
          padding: 10px 4px;
          background: transparent;
          text-align: center;
          font-weight: 800;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 13px;
          margin-bottom: 18px;
        }

        .stat-card {
          position: relative;
          min-height: 142px;
          padding: 20px;
          overflow: hidden;
          border: 1px solid rgba(148,163,184,.14);
          border-radius: 18px;
          background: linear-gradient(145deg, rgba(255,255,255,.075), rgba(255,255,255,.035));
          box-shadow: 0 18px 45px rgba(0,0,0,.16);
          backdrop-filter: blur(14px);
        }

        .stat-card::after {
          content: "";
          position: absolute;
          width: 100px;
          height: 100px;
          right: -42px;
          bottom: -48px;
          border-radius: 50%;
          background: rgba(56,189,248,.08);
        }

        .stat-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: rgba(14,165,233,.11);
          color: #67e8f9;
          font-size: 19px;
          font-weight: 900;
        }

        .stat-title {
          display: block;
          margin-top: 14px;
          color: #9eabc0;
          font-size: 12px;
          font-weight: 700;
        }

        .stat-value {
          display: block;
          margin-top: 3px;
          color: #fff;
          font-size: 30px;
          line-height: 1;
          font-weight: 900;
        }

        .table-card {
          overflow: hidden;
          border: 1px solid rgba(148,163,184,.15);
          border-radius: 20px;
          background: rgba(255,255,255,.052);
          box-shadow: 0 24px 65px rgba(0,0,0,.20);
          backdrop-filter: blur(15px);
        }

        .table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          min-width: 1120px;
          border-collapse: separate;
          border-spacing: 0;
        }

        th,
        td {
          padding: 16px 18px;
          text-align: left;
          border-bottom: 1px solid rgba(148,163,184,.09);
          vertical-align: middle;
        }

        th {
          background: rgba(255,255,255,.035);
          color: #93a0b7;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 900;
          white-space: nowrap;
        }

        tbody tr {
          transition: background .18s ease;
        }

        tbody tr:hover {
          background: rgba(255,255,255,.035);
        }

        tbody tr:last-child td {
          border-bottom: 0;
        }

        td {
          color: #d5ddea;
          font-size: 13px;
        }

        .product-info {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 260px;
        }

        .product-image {
          width: 56px;
          height: 56px;
          flex: 0 0 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid rgba(148,163,184,.14);
          border-radius: 12px;
          background: linear-gradient(145deg, rgba(255,255,255,.09), rgba(255,255,255,.03));
          color: #7dd3fc;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 5px;
          box-sizing: border-box;
        }

        .product-info strong {
          display: block;
          max-width: 290px;
          overflow: hidden;
          color: #f8fafc;
          font-size: 14px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .product-info span {
          display: block;
          max-width: 290px;
          margin-top: 4px;
          overflow: hidden;
          color: #65738b;
          font-size: 10px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .category-badge,
        .stock-badge,
        .active-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          font-weight: 800;
          white-space: nowrap;
        }

        .category-badge {
          padding: 7px 10px;
          background: rgba(99,102,241,.10);
          border: 1px solid rgba(99,102,241,.12);
          color: #c7d2fe;
          font-size: 11px;
        }

        .stock-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 150px;
          flex-wrap: nowrap;
        }

        .stock-badge {
          min-width: 86px;
          padding: 7px 9px;
          font-size: 10px;
        }

        .stock-badge.in {
          background: rgba(34,197,94,.10);
          border: 1px solid rgba(34,197,94,.14);
          color: #4ade80;
        }

        .stock-badge.out {
          background: rgba(239,68,68,.10);
          border: 1px solid rgba(239,68,68,.14);
          color: #f87171;
        }

        .stock-badge.low {
          background: rgba(245,158,11,.11);
          border: 1px solid rgba(245,158,11,.15);
          color: #fbbf24;
        }

        .stock-edit-button {
          height: 30px;
          padding: 0 9px;
          border: 1px solid rgba(56,189,248,.22);
          border-radius: 8px;
          background: rgba(56,189,248,.07);
          color: #67e8f9;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        .stock-edit-button:hover {
          background: rgba(56,189,248,.14);
        }

        .stock-edit-button:disabled {
          opacity: .5;
          cursor: wait;
        }

        .active-badge {
          min-width: 72px;
          padding: 7px 10px;
          border: 1px solid transparent;
          font-size: 10px;
          cursor: pointer;
        }

        .active-badge.active {
          background: rgba(34,197,94,.10);
          border-color: rgba(34,197,94,.14);
          color: #4ade80;
        }

        .active-badge.inactive {
          background: rgba(148,163,184,.10);
          border-color: rgba(148,163,184,.14);
          color: #94a3b8;
        }

        .active-badge:hover {
          filter: brightness(1.15);
        }

        .active-badge:disabled {
          opacity: .55;
          cursor: wait;
        }

        .rating {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          color: #e2e8f0;
          white-space: nowrap;
          font-weight: 800;
        }

        .star {
          color: #facc15;
          font-size: 16px;
        }

        td small {
          color: #748198;
          font-size: 10px;
        }

        .actions-header,
        .actions-cell {
          text-align: center;
          min-width: 255px;
        }

        .action-buttons {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }

        .icon-button {
          width: 36px;
          height: 36px;
          min-width: 36px;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: rgba(255,255,255,.045);
          cursor: pointer;
          transition: transform .18s ease, background .18s ease, border-color .18s ease;
        }

        .icon-button.edit {
          color: #38bdf8 !important;
          border: 1px solid rgba(56,189,248,.25);
        }

        .icon-button.edit svg {
          stroke: #38bdf8 !important;
        }

        .icon-button.delete {
          color: #f87171 !important;
          border: 1px solid rgba(239,68,68,.25);
        }

        .icon-button.delete svg {
          stroke: #f87171 !important;
        }

        .icon-button:hover {
          transform: translateY(-1px);
        }

        .icon-button.edit:hover {
          background: rgba(56,189,248,.11);
          border-color: rgba(56,189,248,.55);
        }

        .icon-button.delete:hover {
          background: rgba(239,68,68,.11);
          border-color: rgba(239,68,68,.55);
        }


        .review-link {
          min-width: 55px;
          color: #c4b5fd;
          font-size: 11px;
          font-weight: 900;
          text-decoration: none;
        }

        .review-link:hover {
          color: #ddd6fe;
          text-decoration: underline;
        }

        .view-link {
          min-width: 42px;
          color: #67e8f9;
          font-size: 11px;
          font-weight: 900;
          text-decoration: none;
        }

        .view-link:hover {
          color: #a5f3fc;
          text-decoration: underline;
        }

        .pagination-bar {
          max-width: 1540px;
          margin: 16px auto 0;
          padding: 0 2px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          color: #8391a9;
          font-size: 12px;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .pagination-controls .secondary-button {
          min-height: 38px;
          padding: 8px 12px;
          font-size: 12px;
        }

        .page-number {
          min-width: 100px;
          text-align: center;
          color: #aab5c7;
          white-space: nowrap;
        }

        .empty-card {
          min-height: 380px;
          border: 1px solid rgba(148,163,184,.14);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 30px;
          background: rgba(255,255,255,.052);
          color: #9eabc0;
        }

        .empty-card h2 {
          margin: 15px 0 5px;
          color: #fff;
        }

        .empty-card p {
          margin: 0 0 20px;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(2,6,23,.78);
          backdrop-filter: blur(10px);
        }

        .product-modal {
          width: min(900px, 100%);
          max-height: 92vh;
          overflow-y: auto;
          border: 1px solid rgba(148,163,184,.18);
          border-radius: 24px;
          background: linear-gradient(145deg, #0b1428, #11172e 55%, #0b2534);
          box-shadow: 0 35px 100px rgba(0,0,0,.55);
        }

        .modal-header {
          position: sticky;
          top: 0;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 22px 24px;
          background: rgba(9,20,38,.96);
          border-bottom: 1px solid rgba(148,163,184,.12);
          backdrop-filter: blur(12px);
        }

        .modal-header h2 {
          margin: 0;
          color: #fff;
          font-size: 25px;
        }

        .close-button {
          width: 38px;
          height: 38px;
          border: 1px solid rgba(148,163,184,.16);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,.05);
          color: #dbeafe;
          cursor: pointer;
        }

        .close-button:hover {
          background: rgba(255,255,255,.10);
        }

        .close-button:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .product-modal form {
          padding: 24px;
        }

        .form-section {
          padding: 22px 0;
          border-bottom: 1px solid rgba(148,163,184,.10);
        }

        .form-section:first-child {
          padding-top: 2px;
        }

        .form-section h3 {
          margin: 0 0 16px;
          color: #f8fafc;
          font-size: 17px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: 15px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .form-field.full {
          grid-column: 1 / -1;
        }

        .form-field label {
          color: #9aa8bd;
          font-size: 11px;
          font-weight: 800;
        }

        .inline-form {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 9px;
        }

        .tag-list {
          display: grid;
          gap: 8px;
          margin-top: 12px;
        }

        .data-row {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 15px;
          align-items: center;
          padding: 11px 13px;
          border: 1px solid rgba(148,163,184,.08);
          border-radius: 10px;
          background: rgba(255,255,255,.035);
        }

        .data-row span {
          color: #aeb9ca;
        }

        .data-row button,
        .tag button {
          border: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
          opacity: .7;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 9px 12px;
          border: 1px solid rgba(14,165,233,.14);
          border-radius: 10px;
          background: rgba(14,165,233,.08);
          color: #d9f6ff;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding-top: 24px;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1250px) {
          .stats-grid {
            grid-template-columns: repeat(3, minmax(0,1fr));
          }

          .filter-card {
            grid-template-columns: repeat(2, minmax(0,1fr));
          }
        }

        @media (max-width: 800px) {
          .admin-products-page {
            padding: 25px 15px 60px;
          }

          .page-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .header-actions {
            width: 100%;
          }

          .header-actions button {
            flex: 1;
          }

          .filter-card {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: repeat(2, minmax(0,1fr));
          }

          .pagination-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .pagination-controls {
            justify-content: center;
            flex-wrap: wrap;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .form-field.full {
            grid-column: auto;
          }

          .inline-form {
            grid-template-columns: 1fr;
          }

          .product-modal form {
            padding: 18px;
          }

          .modal-header {
            padding: 18px;
          }

          .modal-actions {
            flex-direction: column-reverse;
          }

          .modal-actions button {
            width: 100%;
          }
        }

        @media (max-width: 520px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .page-header h1 {
            font-size: 34px;
          }
        }

      `}</style>

    </div>
  );
}

// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  title,
  value,
  icon,
}) {
  return (
    <div className="stat-card">

      <div className="stat-icon">
        {icon}
      </div>

      <span className="stat-title">
        {title}
      </span>

      <strong className="stat-value">
        {value}
      </strong>

    </div>
  );
}

// =====================================================
// FORM FIELD
// =====================================================

function FormField({
  label,
  children,
  full = false,
}) {
  return (
    <div
      className={`form-field ${
        full ? "full" : ""
      }`}
    >

      <label>
        {label}
      </label>

      {children}

    </div>
  );
}

// =====================================================
// LOADING
// =====================================================

function AdminLoading() {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "15px",
      }}
    >

      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border:
            "4px solid rgba(14,165,233,.15)",
          borderTopColor:
            "#0284c7",
          animation:
            "admin-spin .8s linear infinite",
        }}
      />

      <strong>
        Loading products...
      </strong>

      <style jsx>{`

        @keyframes admin-spin {

          to {
            transform:
              rotate(360deg);
          }

        }

      `}</style>

    </div>
  );
}
