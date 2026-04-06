// src/pages/ArtisanDashboard.js
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPackage,
  FiShoppingBag,
  FiUser,
  FiLogOut,
  FiClock,
  FiHeart,
  FiHome,
  FiMessageCircle,
  FiEdit,
  FiPlus,
  FiX,
  FiToggleLeft,
  FiToggleRight,
  FiTrash2,
  FiInstagram,
  FiFacebook,
  FiGlobe,
  FiCamera,
  FiRefreshCw,
  FiGrid,
  FiList,
  FiDownload,
  FiMessageSquare,
  FiTool,
  FiMenu,
  FiCheckCircle
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useNotif } from "../context/NotifContext";
import { useSocket } from "../context/SocketContext";
import NotificationBell from "../components/NotificationBell";
import { SkeletonCard, SkeletonRow, SkeletonTable, SkeletonGrid } from "../components/LoadingSkeleton";
import api from "../services/api";
import toast from "react-hot-toast";

// Revenue Icon (receipt/bill style)
const RevenueIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
    />
  </svg>
);

const CATEGORIES = [
  "jewelry",
  "pottery",
  "textiles",
  "woodwork",
  "metalwork",
  "glass",
  "other",
];

const ArtisanDashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const { wishlist } = useCart();
  useNotif();
  const { socket } = useSocket();
  const navigate = useNavigate();

  // Check if user is an artisan, redirect if not
  useEffect(() => {
    if (user && user.role !== 'artisan' && user.role !== 'admin') {
      toast.error('Only artisans can access this dashboard');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    location: user?.location || "",
    phone: user?.phone || "",
    artisanProfile: {
      businessName: user?.artisanProfile?.businessName || "",
      description: user?.artisanProfile?.description || "",
      tagline: user?.artisanProfile?.tagline || "",
      specialties: user?.artisanProfile?.specialties?.join(", ") || "",
      yearsOfExperience: user?.artisanProfile?.yearsOfExperience || 0,
      socialLinks: {
        instagram: user?.artisanProfile?.socialLinks?.instagram || "",
        facebook: user?.artisanProfile?.socialLinks?.facebook || "",
        website: user?.artisanProfile?.socialLinks?.website || "",
      },
    },
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const avatarInputRef = React.useRef(null);
  const coverInputRef = React.useRef(null);
  const [orderViewMode, setOrderViewMode] = useState("list");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [loadingFinancials, setLoadingFinancials] = useState(false);
  const [customizationRequests, setCustomizationRequests] = useState([]);
  const [loadingCustomizations, setLoadingCustomizations] = useState(false);

  // Handle incoming customization requests from buyers
  useEffect(() => {
    if (!socket) return;
    const handleCustomizationRequest = (data) => {
      setCustomizationRequests((prev) => [
        {
          ...data,
          id: Date.now(),
          requestId: data.requestId || data._id,
          productId: data.product?._id || data.product?.id || data.productId,
          productName: data.product?.name || data.productName,
          buyerId:
            data.sender?._id || data.sender?.id || data.sender || data.buyerId,
          buyerName: data.sender?.name || data.senderName || data.buyerName,
          status: "pending",
        },
        ...prev,
      ]);
    };
    socket.on("customization-request", handleCustomizationRequest);
    return () =>
      socket.off("customization-request", handleCustomizationRequest);
  }, [socket]);

  const handleCustomizationResponse = async (request, available) => {
    try {
      let price = 0;
      if (available) {
        const input = window.prompt(
          `Set a price for this customization for "${request.productName || "this product"}:",`
        );
        if (input === null) return;
        price = Number(input) || 0;
      }

      if (request.isChatRequest) {
        const io_roomId = request.roomId || request.requestId;
        const buyerId = request.buyerId || request.sender?.id;
        if (socket && buyerId) {
          socket.emit("chat-request-response", {
            buyerId,
            artisanId: user?._id || user?.id,
            artisanName: user?.name,
            roomId: io_roomId,
            available,
            status: available ? "accepted" : "rejected",
            customizationPrice: price,
          });
        }
        if (buyerId) {
          try {
            await api.post("/chat/request-response", {
              buyerId,
              available,
              roomId: io_roomId,
              customizationPrice: price,
            });
          } catch {
            /* non-critical */
          }
        }
      } else {
        await api.post(
          `/products/${request.product?._id || request.productId}/customization-response`,
          {
            available,
            buyerId: request.sender?._id || request.buyerId,
            requestId: request.requestId || request._id,
            customizationPrice: price,
          }
        );
      }
      setCustomizationRequests((prev) =>
        prev.map((r) =>
          r.id === request.id
            ? {
              ...r,
              status: available ? "accepted" : "rejected",
              customizationPrice: price,
            }
            : r
        )
      );
      toast.success(
        available
          ? "Accepted! Buyer has been notified."
          : "Buyer notified of unavailability."
      );
    } catch (e) {
      toast.error("Failed to respond");
    }
  };

  const fetchCustomizationRequests = async () => {
    setLoadingCustomizations(true);
    try {
      const res = await api.get("/products/customization-requests");
      const requests = res.data?.requests || [];
      setCustomizationRequests(
        requests.map((r) => ({
          ...r,
          id: r._id,
          requestId: r._id,
          productId: r.product?._id || r.product,
          buyerId: r.sender?._id || r.sender,
          sender: r.sender || {
            _id: r.sender,
            name: r.senderName,
            avatar: r.senderAvatar,
          },
          product: r.product || {
            _id: r.product,
            name: r.productName,
            image: r.productImage,
          },
        }))
      );
    } catch (e) {
      console.error("Failed to load customization requests:", e);
    } finally {
      setLoadingCustomizations(false);
    }
  };

  const handlePrintFinancials = () => {
    window.print();
  };

  const stats = {
    revenue: orders
      .filter((o) => o.orderStatus === "delivered" && o.artisanReceivedPayment)
      .reduce((s, o) => s + (o.totalAmount || 0), 0),
    activeProducts: products.filter((p) => p.isActive).length,
    totalOrders: orders.length,
    pendingOrders: orders.filter((o) => ["pending", "confirmed"].includes(o.orderStatus)).length,
  };

  const fetchAllData = async () => {
    setLoadingOrders(true);
    setLoadingProducts(true);
    setLoadingCustomizations(true);
    setLoadingFinancials(true);

    try {
      const [ordersRes, productsRes, custRes] = await Promise.allSettled([
        api.get("/orders/artisan-orders"),
        api.get("/products/my"),
        api.get("/products/customization-requests"),
      ]);

      if (ordersRes.status === "fulfilled") {
        const res = ordersRes.value;
        const ordersData = res.data?.orders || [];
        setOrders(Array.isArray(ordersData) ? ordersData : []);

        const delivered = ordersData.filter(
          (o) => o.orderStatus === "delivered"
        );
        const cancelled = ordersData.filter(
          (o) => o.orderStatus === "cancelled"
        );
        const pending = ordersData.filter((o) =>
          ["pending", "confirmed"].includes(o.orderStatus)
        );
        const revenue = ordersData
          .filter((o) => o.artisanReceivedPayment)
          .reduce((s, o) => s + (o.totalAmount || 0), 0);

        const monthly = {};
        ordersData.forEach((o) => {
          const d = new Date(o.createdAt);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          if (!monthly[key])
            monthly[key] = {
              month: key,
              count: 0,
              revenue: 0,
              commission: 0,
              quantity: 0,
            };
          monthly[key].count++;
          if (o.artisanReceivedPayment) {
            monthly[key].revenue += o.totalAmount || 0;
            monthly[key].commission += (o.totalAmount || 0) * 0.1;
          }
          monthly[key].quantity +=
            o.items?.reduce((s, i) => s + i.quantity, 0) || 0;
        });

        setFinancials({
          total: ordersData.length,
          delivered: delivered.length,
          cancelled: cancelled.length,
          pending: pending.length,
          revenue,
          commission: revenue * 0.1,
          netEarnings: revenue * 0.9,
          monthly: Object.values(monthly).sort((a, b) =>
            a.month.localeCompare(b.month)
          ),
        });
      } else {
        console.error("Failed to load orders:", ordersRes.reason);
        if (ordersRes.reason?.response?.status === 403) {
          toast.error("You don't have permission to access artisan features");
          navigate('/dashboard');
        } else {
          toast.error("Failed to load orders");
        }
        setOrders([]);
      }

      if (productsRes.status === "fulfilled") {
        const res = productsRes.value;
        const productsData = res.data?.products || [];
        setProducts(Array.isArray(productsData) ? productsData : []);
      } else {
        console.error("Failed to load products:", productsRes.reason);
        if (productsRes.reason?.response?.status === 403) {
          toast.error("You don't have permission to access artisan features");
          navigate('/dashboard');
        } else {
          toast.error("Failed to load products");
        }
        setProducts([]);
      }

      if (custRes.status === "fulfilled") {
        const requests = custRes.value.data?.requests || [];
        setCustomizationRequests(Array.isArray(requests) ? requests : []);
      } else {
        console.error("Failed to load customizations:", custRes.reason);
        if (custRes.reason?.response?.status === 403) {
          toast.error("You don't have permission to access artisan features");
          navigate('/dashboard');
        }
      }
    } catch (e) {
      console.error("Unexpected dashboard fetch error:", e);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoadingOrders(false);
      setLoadingProducts(false);
      setLoadingCustomizations(false);
      setLoadingFinancials(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchProducts = () => fetchAllData();
  const fetchOrders = () => fetchAllData();

  useEffect(() => {
    if (!socket) return;
    const handleNewOrder = (data) => {
      toast.success(` New Order Received: #${data.orderId}`, {
        duration: 6000,
      });
      fetchAllData();
    };
    socket.on("new-order", handleNewOrder);
    return () => socket.off("new-order", handleNewOrder);
  }, [socket]);

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success("Order status updated");
      fetchOrders();
    } catch (e) {
      toast.error("Failed to update order");
    }
  };

  const handleConfirmPayment = async (orderId) => {
    if (!window.confirm("Confirm you have received payment for this order?"))
      return;
    try {
      await api.post(`/orders/${orderId}/confirm-payment`);
      toast.success("Payment confirmed");
      fetchOrders();
    } catch (e) {
      toast.error("Failed to confirm payment");
    }
  };

  const handleToggleProduct = async (product) => {
    try {
      await api.put(`/products/${product._id}`, {
        isActive: !product.isActive,
      });
      toast.success(
        `Product ${!product.isActive ? "activated" : "deactivated"}`
      );
      fetchProducts();
    } catch (e) {
      toast.error("Failed to update product");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${productId}`);
      toast.success("Product deleted");
      fetchProducts();
    } catch (e) {
      toast.error("Failed to delete product");
    }
  };

  const handleUploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await api.post("/users/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        updateUser(res.data.user);
        toast.success("Profile photo updated!");
      }
    } catch (err) {
      toast.error(err?.message || "Failed to upload photo");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleSetAvatarUrl = async (url) => {
    if (!url?.trim()) return;
    setUploadingAvatar(true);
    try {
      const res = await api.post("/users/avatar", { imageUrl: url.trim() });
      if (res.data.success) {
        updateUser(res.data.user);
        toast.success("Profile photo updated!");
      }
    } catch (err) {
      toast.error(err?.message || "Failed to set avatar URL");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUploadCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8MB");
      return;
    }
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append("coverImage", file);
      const res = await api.post("/users/cover", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        updateUser(res.data.user);
        toast.success("Cover image updated!");
      }
    } catch (err) {
      toast.error(err?.message || "Failed to upload cover");
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const handleSetCoverUrl = async (url) => {
    if (!url?.trim()) return;
    setUploadingCover(true);
    try {
      const res = await api.post("/users/cover", { imageUrl: url.trim() });
      if (res.data.success) {
        updateUser(res.data.user);
        toast.success("Cover image updated!");
      }
    } catch (err) {
      toast.error(err?.message || "Failed to set cover URL");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const payload = {
        name: profileData.name,
        bio: profileData.bio,
        location: profileData.location,
        phone: profileData.phone,
        artisanProfile: {
          businessName: profileData.artisanProfile.businessName,
          description: profileData.artisanProfile.description,
          tagline: profileData.artisanProfile.tagline,
          specialties: profileData.artisanProfile.specialties
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          yearsOfExperience: Number(profileData.artisanProfile.yearsOfExperience) || 0,
          socialLinks: profileData.artisanProfile.socialLinks,
        },
      };
      console.log('Saving profile payload:', payload);
      const res = await api.put("/users/profile", payload);
      console.log('Profile update response:', res.data);
      updateUser(res.data.user);
      toast.success("Profile updated successfully!");
      setProfileEditing(false);
    } catch (e) {
      console.error('Profile update error:', e);
      const errorMsg = e?.response?.data?.message || e?.message || 'Failed to update profile';
      toast.error(errorMsg);
    } finally {
      setSavingProfile(false);
    }
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    "order ready": "bg-indigo-100 text-indigo-800",
    confirmed: "bg-blue-100 text-blue-800",
    in_production: "bg-purple-100 text-purple-800",
    ready: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: FiHome },
    { id: "products", label: "My Products", icon: FiPackage },
    { id: "orders", label: "Orders", icon: FiShoppingBag },
    { id: "wishlist", label: "Wishlist", icon: FiHeart },
    { id: "customizations", label: "Customisations", icon: FiTool },
    { id: "financials", label: "Financials", icon: RevenueIcon },
    { id: "reviews", label: "Reviews", icon: FiMessageSquare },
    { id: "profile", label: "Profile", icon: FiUser },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${sidebarOpen ? "w-64" : "w-20"} min-h-screen bg-gradient-to-b from-[#7d4f50] to-[#6b4344] text-white flex-shrink-0 fixed left-0 top-0 z-20 transition-all duration-300`}
        >
          <div className="p-4 flex items-center justify-between border-b border-[#6b4344] h-16">
            {sidebarOpen && (
              <h1 className="text-lg font-bold text-amber-100">
                Artisan Panel
              </h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-amber-800 rounded-lg ml-auto"
            >
              <FiMenu className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4">
            {sidebarOpen && (
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                  {user?.name?.[0] || "A"}
                </div>
                <div>
                  <p className="font-semibold text-amber-100 text-sm">
                    {user?.name}
                  </p>
                  <p className="text-xs text-amber-300">Artisan</p>
                </div>
              </div>
            )}
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center ${sidebarOpen ? "space-x-3 px-4" : "justify-center px-2"} py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.id
                    ? "bg-white/20 text-white shadow-md"
                    : "text-amber-200 hover:bg-white/10 hover:text-white"
                    }`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              ))}
              <button
                onClick={() => {
                  navigate(`/artisans/${user?._id || user?.id}/shop`);
                }}
                className={`w-full flex items-center ${sidebarOpen ? "space-x-3 px-4" : "justify-center px-2"} py-3 rounded-xl text-sm font-medium text-amber-200 hover:bg-white/10 hover:text-white mt-2`}
                title={!sidebarOpen ? "View Shop" : undefined}
              >
                <FiGlobe className="h-4 w-4 flex-shrink-0" />
                {sidebarOpen && <span>View Shop</span>}
              </button>
              <div className="border-t border-amber-700 pt-2 mt-4">
                <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className={`w-full flex items-center ${sidebarOpen ? "space-x-3 px-4" : "justify-center px-2"} py-3 rounded-xl text-sm font-medium text-red-300 hover:bg-red-900/30`}
                  title={!sidebarOpen ? "Logout" : undefined}
                >
                  <FiLogOut className="h-4 w-4 flex-shrink-0" />
                  {sidebarOpen && <span>Logout</span>}
                </button>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <div
          className={`${sidebarOpen ? "ml-64" : "ml-20"} flex-1 flex flex-col transition-all duration-300`}
        >
          {/* Top Header Bar */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
            <h2 className="text-gray-700 font-semibold capitalize">
              {activeTab === "dashboard" ? "Artisan Dashboard" : activeTab}
            </h2>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-amber-600 mr-2 hidden sm:inline">
                Happy Shopping, {user?.name}!
              </span>
              <button
                onClick={() => navigate("/")}
                className="flex items-center space-x-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 transition-colors font-medium text-sm"
              >
                <FiHome className="h-4 w-4" />
                <span>Home</span>
              </button>
              <button
                onClick={() => setShowProductModal(true)}
                className="flex items-center space-x-1 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl text-sm font-medium transition-colors"
              >
                <FiPlus className="h-4 w-4" />
                <span>Add Product</span>
              </button>
              <NotificationBell />
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-8">
            {/* Overview */}
            {activeTab === "overview" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      Welcome back, {user?.name?.split(" ")[0]}! 
                    </h1>
                    <p className="text-gray-500">Here's your shop overview for today.</p>
                  </div>
                  {/* Customization Requests Quick Card */}
                  <Link
                    to="/artisan-dashboard?tab=customizations"
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <FiTool className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium opacity-90">Customization Requests</p>
                        <p className="text-xl font-bold">{customizationRequests.filter(r => r.status === 'pending').length}</p>
                      </div>
                    </div>
                  </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {loadingOrders || loadingProducts ? (
                    <>
                      <SkeletonCard color="blue" height="h-28" />
                      <SkeletonCard color="amber" height="h-28" />
                      <SkeletonCard color="green" height="h-28" />
                      <SkeletonCard color="purple" height="h-28" />
                    </>
                  ) : (
                    [
                      {
                        label: "Total Orders",
                        value: stats.totalOrders,
                        icon: FiShoppingBag,
                        color: "from-blue-500 to-blue-600",
                      },
                      {
                        label: "Pending",
                        value: stats.pendingOrders,
                        icon: FiClock,
                        color: "from-yellow-500 to-orange-500",
                      },
                      {
                        label: "Revenue",
                        value: `Rs. ${stats.revenue.toLocaleString()}`,
                        icon: RevenueIcon,
                        color: "from-green-500 to-emerald-600",
                      },
                      {
                        label: "Active Products",
                        value: stats.activeProducts,
                        icon: FiPackage,
                        color: "from-purple-500 to-purple-600",
                      },
                    ].map((s, i) => (
                      <div key={i} className="bg-[#F5EBE0] rounded-2xl p-6 shadow-sm border border-[#D5C4A1]/30">
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}
                        >
                          <s.icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {s.value}
                        </div>
                        <div className="text-sm text-gray-500">{s.label}</div>
                      </div>
                    ))
                  )}
                </div>

                {/* Recent orders */}
                <div className="bg-[#FAF0E6] rounded-2xl shadow-sm p-6 border border-[#D5C4A1]/30">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Recent Orders
                  </h2>
                  {loadingOrders ? (
                    <SkeletonTable rows={5} color="amber" />
                  ) : orders.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">
                      No orders yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.slice(0, 5).map((order) => (
                        <div
                          key={order._id}
                          className="flex items-center justify-between p-4 bg-[#EDDBCD] rounded-xl"
                        >
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {order.orderId}
                            </p>
                            <p className="text-xs text-gray-500">
                              by {order.buyer?.name} · Rs.{" "}
                              {order.totalAmount?.toLocaleString()}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.orderStatus]}`}
                          >
                            {order.orderStatus?.replace(/_/g, " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Products Tab */}
            {activeTab === "products" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">
                    My Products
                  </h1>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setShowProductModal(true);
                    }}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                  >
                    <FiPlus />
                    <span>Add Product</span>
                  </button>
                </div>
                {loadingProducts ? (
                  <SkeletonGrid count={6} color="blue" />
                ) : products.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                    <FiPackage className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      No products yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Add your first product to start selling
                    </p>
                    <button
                      onClick={() => setShowProductModal(true)}
                      className="px-6 py-3 bg-amber-500 text-white rounded-xl font-medium"
                    >
                      Add Product
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <div
                        key={product._id}
                        className="bg-[#FAF0E6] rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow border border-[#D5C4A1]/30"
                      >
                        <div className="relative h-48 bg-gray-100">
                          <img
                            src={
                              product.images?.[0]?.url ||
                              "https://images.unsplash.com/photo-1565193564382-fb8bb0b9e5b4?w=300"
                            }
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                          <div
                            className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${product.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                              }`}
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {product.name}
                          </h3>
                          <p className="text-amber-600 font-bold">
                            Rs. {product.price?.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Stock: {product.stock} · {product.category}
                          </p>
                          <div className="flex items-center space-x-2 mt-3">
                            <button
                              onClick={() => {
                                setEditingProduct(product);
                                setShowProductModal(true);
                              }}
                              className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-center space-x-1"
                            >
                              <FiEdit className="h-3 w-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleToggleProduct(product)}
                              className={`flex-1 py-2 rounded-lg text-sm flex items-center justify-center space-x-1 ${product.isActive
                                ? "bg-green-50 text-green-700 hover:bg-green-100"
                                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                              {product.isActive ? (
                                <FiToggleRight className="h-3 w-3" />
                              ) : (
                                <FiToggleLeft className="h-3 w-3" />
                              )}
                              <span>
                                {product.isActive ? "Active" : "Inactive"}
                              </span>
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product._id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                    <div className="flex space-x-3 mt-1 text-sm">
                      <span className="text-green-600 font-medium">
                        {
                          orders.filter((o) => o.orderStatus === "delivered")
                            .length
                        }{" "}
                        delivered
                      </span>
                      <span className="text-red-500 font-medium">
                        {
                          orders.filter((o) => o.orderStatus === "cancelled")
                            .length
                        }{" "}
                        cancelled
                      </span>
                      <span className="text-yellow-600 font-medium">
                        {
                          orders.filter((o) =>
                            ["pending", "confirmed"].includes(o.orderStatus)
                          ).length
                        }{" "}
                        pending
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setOrderViewMode("list")}
                      className={`p-2 rounded-lg ${orderViewMode === "list" ? "bg-amber-100 text-amber-600" : "bg-white text-gray-400"}`}
                    >
                      <FiList />
                    </button>
                    <button
                      onClick={() => setOrderViewMode("grid")}
                      className={`p-2 rounded-lg ${orderViewMode === "grid" ? "bg-amber-100 text-amber-600" : "bg-white text-gray-400"}`}
                    >
                      <FiGrid />
                    </button>
                  </div>
                </div>

                {loadingOrders ? (
                  orderViewMode === "grid" ? (
                    <SkeletonGrid count={6} color="amber" />
                  ) : (
                    <SkeletonTable rows={5} color="amber" />
                  )
                ) : orders.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                    <FiShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No orders yet</p>
                  </div>
                ) : orderViewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orders.map((order) => (
                      <div
                        key={order._id}
                        className="bg-[#F5EBE0] rounded-2xl shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow border border-[#D5C4A1]/30"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-gray-900 text-sm">
                              {order.orderId}
                            </p>
                            <p className="text-xs text-gray-500">
                              {order.buyer?.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.orderStatus] || "bg-gray-100 text-gray-600"}`}
                          >
                            {order.orderStatus?.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="font-bold text-amber-600">
                          LKR {order.totalAmount?.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {order.items?.length || 0} item(s)
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order._id}
                        className="bg-white rounded-2xl shadow-sm p-6"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                          <div>
                            <p className="font-bold text-gray-900">
                              {order.orderId}
                            </p>
                            <p className="text-sm text-gray-500">
                              Buyer: {order.buyer?.name}
                            </p>
                            {order.buyer?.phone && (
                              <p className="text-xs text-gray-400">
                                📞 {order.buyer.phone}
                              </p>
                            )}
                            <p className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-amber-600 text-lg">
                              LKR {order.totalAmount?.toLocaleString()}
                            </p>
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${statusColors[order.orderStatus] || "bg-gray-100 text-gray-600"}`}
                            >
                              {order.orderStatus?.replace(/_/g, " ")}
                            </span>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="block ml-auto mt-2 text-xs text-blue-500 hover:underline"
                            >
                              View details
                            </button>
                          </div>
                        </div>
                        <div className="border-t pt-3 mb-4">
                          {order.items?.map((item, i) => (
                            <div
                              key={i}
                              className="flex items-center space-x-3 py-2"
                            >
                              <img
                                src={
                                  item.product?.images?.[0]?.url ||
                                  "https://images.unsplash.com/photo-1565193564382-fb8bb0b9e5b4?w=60"
                                }
                                className="w-10 h-10 rounded-lg object-cover"
                                alt={item.product?.name}
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {item.product?.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Qty: {item.quantity} × LKR{" "}
                                  {item.price?.toLocaleString()}
                                </p>
                                {item.customization?.notes && (
                                  <p className="text-xs text-amber-600 mt-1">
                                    Note: {item.customization.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {order.orderStatus !== "cancelled" &&
                            order.orderStatus !== "delivered" && (
                              <>
                                {[
                                  { s: "processing", label: " Processing" },
                                  { s: "order ready", label: "Ready" },
                                  { s: "delivered", label: "✓ Delivered" },
                                  { s: "cancelled", label: "✗ Cancel" },
                                ]
                                  .filter((a) => {
                                    const flow = [
                                      "pending",
                                      "processing",
                                      "order ready",
                                      
                                      "delivered",
                                    ];
                                    const curr = flow.indexOf(
                                      order.orderStatus
                                    );
                                    const next = flow.indexOf(a.s);
                                    if (a.s === "cancelled")
                                      return curr < flow.length - 1;
                                    return next > curr;
                                  })
                                  .map((action) => (
                                    <button
                                      key={action.s}
                                      onClick={() =>
                                        handleUpdateOrderStatus(
                                          order._id,
                                          action.s
                                        )
                                      }
                                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${action.s === "cancelled" ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-amber-50 text-amber-700 hover:bg-amber-100"}`}
                                    >
                                      {action.label}
                                    </button>
                                  ))}
                              </>
                            )}

                          {order.orderStatus === "delivered" &&
                            !order.artisanReceivedPayment && (
                              <button
                                onClick={() => handleConfirmPayment(order._id)}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 flex items-center space-x-2"
                              >
                                <FiCheckCircle className="h-4 w-4" />
                                <span>Receive Payment</span>
                              </button>
                            )}
                          {order.artisanReceivedPayment && (
                            <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm font-medium flex items-center justify-center">
                              <FiCheckCircle className="h-3 w-3 mr-1" /> Payment Received
                            </span>
                          )}

                          {order.chatRoom && (
                            <Link
                              to={`/chat/${order.chatRoom}`}
                              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 flex items-center space-x-1"
                            >
                              <FiMessageCircle className="h-3 w-3" />
                              <span>Chat</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Order Detail Modal */}
                {selectedOrder && (
                  <div
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                    onClick={(e) =>
                      e.target === e.currentTarget && setSelectedOrder(null)
                    }
                  >
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
                      <div className="p-5 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
                        <h2 className="font-bold text-gray-900">
                          Order {selectedOrder.orderId}
                        </h2>
                        <button
                          onClick={() => setSelectedOrder(null)}
                          className="p-2 hover:bg-gray-100 rounded-full"
                        >
                          <FiX />
                        </button>
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            ["Buyer", selectedOrder.buyer?.name],
                            ["Email", selectedOrder.buyer?.email],
                            ["Phone", selectedOrder.buyer?.phone],
                            [
                              "Amount",
                              `LKR ${selectedOrder.totalAmount?.toLocaleString()}`,
                            ],
                            [
                              "Status",
                              selectedOrder.orderStatus?.replace(/_/g, " "),
                            ],
                            [
                              "Date",
                              new Date(
                                selectedOrder.createdAt
                              ).toLocaleString(),
                            ],
                          ].map(
                            ([k, v]) =>
                              v && (
                                <div key={k}>
                                  <p className="text-xs text-gray-500">{k}</p>
                                  <p className="text-sm font-medium text-gray-900">
                                    {v}
                                  </p>
                                </div>
                              )
                          )}
                        </div>
                        {selectedOrder.deliveryAddress && (
                          <div className="p-4 bg-amber-50/60 rounded-xl">
                            <p className="text-xs font-medium text-gray-600 mb-2">
                              DELIVERY ADDRESS
                            </p>
                            <p className="text-sm text-gray-900">
                              {selectedOrder.deliveryAddress.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {selectedOrder.deliveryAddress.address},{" "}
                              {selectedOrder.deliveryAddress.city}
                            </p>
                            <p className="text-sm text-gray-600">
                              {selectedOrder.deliveryAddress.district}
                            </p>
                            {selectedOrder.deliveryAddress.phone && (
                              <p className="text-xs text-gray-500 mt-1">
                                📞 {selectedOrder.deliveryAddress.phone}
                              </p>
                            )}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-2">
                            ITEMS
                          </p>
                          {selectedOrder.items?.map((item, i) => (
                            <div
                              key={i}
                              className="flex items-center space-x-3 py-2 border-b last:border-0"
                            >
                              <img
                                src={
                                  item.product?.images?.[0]?.url ||
                                  "https://images.unsplash.com/photo-1565193564382-fb8bb0b9e5b4?w=50"
                                }
                                className="w-10 h-10 rounded-lg object-cover"
                                alt=""
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {item.product?.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Qty: {item.quantity} × LKR{" "}
                                  {item.price?.toLocaleString()}
                                </p>
                                {item.customization?.notes && (
                                  <p className="text-xs text-amber-600">
                                    Note: {item.customization.notes}
                                  </p>
                                )}
                              </div>
                              <p className="text-sm font-bold text-gray-900">
                                LKR{" "}
                                {(item.quantity * item.price)?.toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                        {selectedOrder.orderStatus !== "cancelled" &&
                          selectedOrder.orderStatus !== "delivered" && (
                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-2">
                                UPDATE STATUS
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  { s: "processing", label: " Processing" },
                                  { s: "order ready", label: " Ready" },
                                  { s: "delivered", label: "✓ Delivered" },
                                  { s: "cancelled", label: "✗ Cancel" },
                                ].map((action) => (
                                  <button
                                    key={action.s}
                                    onClick={() => {
                                      handleUpdateOrderStatus(
                                        selectedOrder._id,
                                        action.s
                                      );
                                      setSelectedOrder(null);
                                    }}
                                    className={`px-3 py-1.5 text-xs rounded-lg font-medium ${action.s === "cancelled" ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-amber-50 text-amber-700 hover:bg-amber-100"}`}
                                  >
                                    {action.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Customisations Tab */}
            {activeTab === "customizations" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Customisation Requests
                    </h1>
                    <p className="text-gray-500">
                      Handle bespoke product requests from buyers
                    </p>
                  </div>
                  <button
                    onClick={fetchCustomizationRequests}
                    className="p-2 bg-white rounded-xl shadow-sm hover:shadow-md text-amber-800 transition-all"
                  >
                    <FiRefreshCw className="h-5 w-5" />
                  </button>
                </div>

                {loadingCustomizations ? (
                  <SkeletonGrid count={4} color="purple" />
                ) : customizationRequests.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                    <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-400">
                      <FiTool className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">
                      No requests yet
                    </h3>
                    <p className="text-gray-500 max-w-xs mx-auto">
                      When buyers ask for custom colors or sizes, they'll appear
                      here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {customizationRequests.map((request) => {
                      const senderName =
                        request.sender?.name ||
                        request.senderName ||
                        request.buyerName ||
                        "Buyer";
                      const productName =
                        request.product?.name ||
                        request.productName ||
                        "Product";
                      const statusCfg = {
                        pending: {
                          label: "Pending",
                          cls: "bg-yellow-100 text-yellow-700",
                        },
                        accepted: {
                          label: "Accepted",
                          cls: "bg-green-100 text-green-700",
                        },
                        rejected: {
                          label: "Declined",
                          cls: "bg-red-100 text-red-700",
                        },
                      }[request.status] || {
                        label: request.status,
                        cls: "bg-gray-100 text-gray-500",
                      };

                      return (
                        <motion.button
                          key={request.id || request._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() =>
                            navigate(
                              `/customization/${request.requestId || request._id}`
                            )
                          }
                          className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-amber-200 transition-all text-left flex flex-col justify-between h-full relative group"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-gray-900 text-sm truncate pr-2">
                                {productName}
                              </h4>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusCfg.cls}`}
                              >
                                {statusCfg.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
                              {request.description}
                            </p>
                          </div>
                          <div className="pt-3 border-t border-gray-50 flex justify-between items-end w-full">
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase font-semibold">
                                Buyer
                              </p>
                              <p className="text-xs font-medium text-gray-700">
                                {senderName}
                              </p>
                            </div>
                            {request.status === "accepted" && (
                              <div className="text-right">
                                <p className="text-[10px] text-gray-400 uppercase font-semibold">
                                  Price
                                </p>
                                <p className="text-sm font-black text-amber-700">
                                  LKR{" "}
                                  {request.customizationPrice?.toLocaleString()}
                                </p>
                              </div>
                            )}
                          </div>
                          {request.status === "pending" && (
                            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                              <button
                                className="flex-1 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors text-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCustomizationResponse(request, true);
                                }}
                              >
                                Accept
                              </button>
                              <button
                                className="flex-1 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-300 transition-colors text-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCustomizationResponse(request, false);
                                }}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* Financials Tab */}
            {activeTab === "financials" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Financial Board
                    </h1>
                    <p className="text-gray-500">
                      Your sales performance and earnings
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={fetchOrders}
                      className="flex items-center space-x-2 px-4 py-2 bg-white rounded-xl shadow-sm text-gray-600 hover:shadow-md"
                    >
                      <FiRefreshCw className="h-4 w-4" />
                      <span>Refresh</span>
                    </button>
                    <button
                      onClick={handlePrintFinancials}
                      className="flex items-center space-x-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600"
                    >
                      <FiDownload className="h-4 w-4" />
                      <span>Print / PDF</span>
                    </button>
                  </div>
                </div>

                {loadingFinancials && (
                  <SkeletonGrid count={4} color="green" />
                )}

                {financials && !loadingFinancials && (
                  <div className="space-y-6" id="financials-print">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        {
                          label: "Total Orders",
                          value: financials.total,
                          color: "from-blue-500 to-blue-600",
                        },
                        {
                          label: "Delivered",
                          value: financials.delivered,
                          color: "from-green-500 to-emerald-600",
                        },
                        {
                          label: "Cancelled",
                          value: financials.cancelled,
                          color: "from-red-500 to-red-600",
                        },
                        {
                          label: "Pending",
                          value: financials.pending,
                          color: "from-yellow-500 to-yellow-600",
                        },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="bg-white rounded-2xl p-5 shadow-sm"
                        >
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}
                          >
                            <FiShoppingBag className="h-5 w-5 text-white" />
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {s.value}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {s.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-2xl p-5 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">
                          Gross Revenue
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          LKR {financials.revenue?.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-white rounded-2xl p-5 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">
                          Platform Commission (10%)
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          - LKR {financials.commission?.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 shadow-sm text-white">
                        <p className="text-sm opacity-80 mb-1">
                          Net Earnings (90%)
                        </p>
                        <p className="text-2xl font-bold">
                          LKR {financials.netEarnings?.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {financials.monthly?.length > 0 && (
                      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b">
                          <h3 className="font-bold text-gray-900">
                            Monthly Sales Breakdown
                          </h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                {[
                                  "Month",
                                  "Orders",
                                  "Quantity",
                                  "Revenue (LKR)",
                                  "Commission (LKR)",
                                  "Net (LKR)",
                                ].map((h) => (
                                  <th
                                    key={h}
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {financials.monthly.map((m) => (
                                <tr key={m.month} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 font-medium text-gray-900">
                                    {m.month}
                                  </td>
                                  <td className="px-4 py-3 text-gray-600">
                                    {m.count}
                                  </td>
                                  <td className="px-4 py-3 text-gray-600">
                                    {m.quantity}
                                  </td>
                                  <td className="px-4 py-3 text-gray-900">
                                    {m.revenue?.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 text-red-600">
                                    {m.commission?.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 font-medium text-green-700">
                                    {(m.revenue * 0.9)?.toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-gray-50 font-bold">
                              <tr>
                                <td className="px-4 py-3 text-gray-900">
                                  Total
                                </td>
                                <td className="px-4 py-3 text-gray-900">
                                  {financials.total}
                                </td>
                                <td className="px-4 py-3 text-gray-600">—</td>
                                <td className="px-4 py-3 text-gray-900">
                                  {financials.revenue?.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-red-600">
                                  {financials.commission?.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-green-700">
                                  {financials.netEarnings?.toLocaleString()}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Wishlist Tab */}
            {activeTab === "wishlist" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                  My Wishlist
                </h1>
                {wishlist.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                    <FiHeart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Your wishlist is empty</p>
                    <Link
                      to="/products"
                      className="px-6 py-3 bg-amber-700 text-white rounded-xl font-medium inline-block"
                    >
                      Browse Products
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((product) => (
                      <Link
                        key={product._id}
                        to={`/products/${product._id}`}
                        className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <img
                          src={
                            product.images?.[0]?.url ||
                            "https://images.unsplash.com/photo-1565193564382-fb8bb0b9e5b4?w=300"
                          }
                          className="w-full h-48 object-cover"
                          alt={product.name}
                        />
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900">
                            {product.name}
                          </h3>
                          <p className="text-amber-600 font-bold mt-1">
                            Rs. {product.price?.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 capitalize">
                            {product.category}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h1>
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  {(() => {
                    const reviews = orders
                      .filter(o => o.orderStatus === 'delivered' && o.buyerReceived === true && o.buyerReview)
                      .sort((a, b) => new Date(b.buyerReview?.createdAt || 0) - new Date(a.buyerReview?.createdAt || 0));

                    if (reviews.length === 0) {
                      return (
                        <div className="text-center py-12 text-gray-400">
                          <FiMessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>No reviews yet.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {reviews.map((o) => (
                          <div key={o._id} className="p-4 bg-[#F5EBE0] border border-[#D5C4A1]/30 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-gray-900 text-sm">{o.buyer?.name || 'Buyer'}</p>
                              {o.buyerReview.createdAt && <span className="text-xs text-gray-500">{new Date(o.buyerReview.createdAt).toLocaleDateString()}</span>}
                            </div>
                            <p className="text-sm text-gray-600">{o.buyerReview.comment || <i>No comment provided</i>}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="max-w-4xl">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                    {!profileEditing && (
                      <button
                        onClick={() => setProfileEditing(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors"
                      >
                        <FiEdit className="h-4 w-4" />
                        <span>Edit Profile</span>
                      </button>
                    )}
                  </div>

                  {/* Cover Image Section */}
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6 border border-gray-200">
                    <div className="relative h-48 bg-gradient-to-r from-amber-700 to-amber-800">
                      {user?.coverImage?.url && (
                        <img
                          src={user.coverImage.url}
                          alt="Cover"
                          className="w-full h-full object-cover"
                        />
                      )}
                      {profileEditing && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <button
                            onClick={() => coverInputRef.current?.click()}
                            disabled={uploadingCover}
                            className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50"
                          >
                            {uploadingCover ? "Uploading..." : "Change Cover"}
                          </button>
                          <input
                            ref={coverInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleUploadCover}
                            className="hidden"
                          />
                        </div>
                      )}
                    </div>

                    {/* Avatar Section */}
                    <div className="px-6 pb-6">
                      <div className="flex items-end space-x-4 -mt-16 mb-6 relative z-10">
                        <div className="relative">
                          {user?.avatar?.url ? (
                            <img
                              src={user.avatar.url}
                              alt={user.name}
                              className="w-32 h-32 rounded-2xl border-4 border-white object-cover shadow-lg"
                            />
                          ) : (
                            <div className="w-32 h-32 rounded-2xl border-4 border-white bg-amber-200 flex items-center justify-center text-5xl font-bold text-amber-800 shadow-lg">
                              {user?.name?.[0]?.toUpperCase()}
                            </div>
                          )}
                          {profileEditing && (
                            <button
                              onClick={() => avatarInputRef.current?.click()}
                              disabled={uploadingAvatar}
                              className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 disabled:opacity-50"
                            >
                              <FiCamera className="h-5 w-5 text-gray-900" />
                            </button>
                          )}
                          <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleUploadAvatar}
                            className="hidden"
                          />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
                          <p className="text-amber-700 font-medium">{user?.artisanProfile?.businessName || "Artisan"}</p>
                          {user?.artisanProfile?.tagline && (
                            <p className="text-gray-600 text-sm mt-1 italic">"{user.artisanProfile.tagline}"</p>
                          )}
                        </div>
                      </div>

                      {/* Profile Info */}
                      {!profileEditing ? (
                        <div className="space-y-6">
                          {/* Bio */}
                          {user?.bio && (
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-2">About</p>
                              <p className="text-gray-900">{user.bio}</p>
                            </div>
                          )}

                          {/* Contact Info */}
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">Email</p>
                              <p className="text-gray-900">{user?.email}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">Phone</p>
                              <p className="text-gray-900">{user?.phone || "Not provided"}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">Location</p>
                              <p className="text-gray-900">{user?.location || "Not provided"}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">Verification</p>
                              <p className="text-gray-900 flex items-center">
                                {user?.isVerified ? (
                                  <span className="flex items-center text-green-600">
                                    <FiCheckCircle className="h-4 w-4 mr-1" />
                                    Verified
                                  </span>
                                ) : (
                                  <span className="text-gray-500">Pending</span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Artisan Profile */}
                          <div className="border-t pt-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Artisan Information</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Business Name</p>
                                <p className="text-gray-900">{user?.artisanProfile?.businessName || "Not provided"}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Description</p>
                                <p className="text-gray-900">{user?.artisanProfile?.description || "Not provided"}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Years of Experience</p>
                                <p className="text-gray-900">{user?.artisanProfile?.yearsOfExperience || 0} years</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Specialties</p>
                                <div className="flex flex-wrap gap-2">
                                  {user?.artisanProfile?.specialties?.length > 0 ? (
                                    user.artisanProfile.specialties.map((spec, i) => (
                                      <span key={i} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                                        {spec}
                                      </span>
                                    ))
                                  ) : (
                                    <p className="text-gray-500">Not provided</p>
                                  )}
                                </div>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600 mb-2">Social Links</p>
                                <div className="space-y-2">
                                  {user?.artisanProfile?.socialLinks?.instagram && (
                                    <p className="text-gray-900">
                                      <span className="font-medium">Instagram:</span> {user.artisanProfile.socialLinks.instagram}
                                    </p>
                                  )}
                                  {user?.artisanProfile?.socialLinks?.facebook && (
                                    <p className="text-gray-900">
                                      <span className="font-medium">Facebook:</span> {user.artisanProfile.socialLinks.facebook}
                                    </p>
                                  )}
                                  {user?.artisanProfile?.socialLinks?.website && (
                                    <p className="text-gray-900">
                                      <span className="font-medium">Website:</span> {user.artisanProfile.socialLinks.website}
                                    </p>
                                  )}
                                  {!user?.artisanProfile?.socialLinks?.instagram && !user?.artisanProfile?.socialLinks?.facebook && !user?.artisanProfile?.socialLinks?.website && (
                                    <p className="text-gray-500">Not provided</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Edit Mode */
                        <div className="space-y-6">
                          {/* Basic Info */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input
                              type="text"
                              value={profileData.name}
                              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                            <textarea
                              value={profileData.bio}
                              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                              rows="3"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              placeholder="Tell customers about yourself..."
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                              <input
                                type="tel"
                                value={profileData.phone}
                                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                              <input
                                type="text"
                                value={profileData.location}
                                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              />
                            </div>
                          </div>

                          {/* Artisan Profile */}
                          <div className="border-t pt-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Artisan Information</h3>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                              <input
                                type="text"
                                value={profileData.artisanProfile.businessName}
                                onChange={(e) => setProfileData({
                                  ...profileData,
                                  artisanProfile: { ...profileData.artisanProfile, businessName: e.target.value }
                                })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              />
                            </div>

                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Tagline (1-2 lines)</label>
                              <input
                                type="text"
                                value={profileData.artisanProfile.tagline}
                                onChange={(e) => setProfileData({
                                  ...profileData,
                                  artisanProfile: { ...profileData.artisanProfile, tagline: e.target.value }
                                })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                placeholder="e.g., Master Potter with 10+ years experience"
                              />
                            </div>

                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                              <textarea
                                value={profileData.artisanProfile.description}
                                onChange={(e) => setProfileData({
                                  ...profileData,
                                  artisanProfile: { ...profileData.artisanProfile, description: e.target.value }
                                })}
                                rows="3"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                placeholder="Describe your craft and experience..."
                              />
                            </div>

                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Specialties (comma-separated)</label>
                              <input
                                type="text"
                                value={profileData.artisanProfile.specialties}
                                onChange={(e) => setProfileData({
                                  ...profileData,
                                  artisanProfile: { ...profileData.artisanProfile, specialties: e.target.value }
                                })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                placeholder="e.g., Pottery, Ceramics, Handpainting"
                              />
                            </div>

                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                              <input
                                type="number"
                                value={profileData.artisanProfile.yearsOfExperience}
                                onChange={(e) => setProfileData({
                                  ...profileData,
                                  artisanProfile: { ...profileData.artisanProfile, yearsOfExperience: Number(e.target.value) }
                                })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              />
                            </div>

                            {/* Social Links */}
                            <div className="mt-6 pt-6 border-t">
                              <h4 className="font-medium text-gray-900 mb-4">Social Links</h4>
                              <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  <FiInstagram className="h-5 w-5 text-gray-600" />
                                  <input
                                    type="text"
                                    placeholder="Instagram URL"
                                    value={profileData.artisanProfile.socialLinks?.instagram || ""}
                                    onChange={(e) => setProfileData({
                                      ...profileData,
                                      artisanProfile: {
                                        ...profileData.artisanProfile,
                                        socialLinks: { ...profileData.artisanProfile.socialLinks, instagram: e.target.value }
                                      }
                                    })}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <FiFacebook className="h-5 w-5 text-gray-600" />
                                  <input
                                    type="text"
                                    placeholder="Facebook URL"
                                    value={profileData.artisanProfile.socialLinks?.facebook || ""}
                                    onChange={(e) => setProfileData({
                                      ...profileData,
                                      artisanProfile: {
                                        ...profileData.artisanProfile,
                                        socialLinks: { ...profileData.artisanProfile.socialLinks, facebook: e.target.value }
                                      }
                                    })}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <FiGlobe className="h-5 w-5 text-gray-600" />
                                  <input
                                    type="text"
                                    placeholder="Website URL"
                                    value={profileData.artisanProfile.socialLinks?.website || ""}
                                    onChange={(e) => setProfileData({
                                      ...profileData,
                                      artisanProfile: {
                                        ...profileData.artisanProfile,
                                        socialLinks: { ...profileData.artisanProfile.socialLinks, website: e.target.value }
                                      }
                                    })}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-3 pt-6 border-t">
                            <button
                              onClick={handleSaveProfile}
                              disabled={savingProfile}
                              className="flex-1 px-6 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
                            >
                              {savingProfile ? "Saving..." : "Save Changes"}
                            </button>
                            <button
                              onClick={() => {
                                setProfileEditing(false);
                                setProfileData({
                                  name: user?.name || "",
                                  bio: user?.bio || "",
                                  location: user?.location || "",
                                  phone: user?.phone || "",
                                  artisanProfile: {
                                    businessName: user?.artisanProfile?.businessName || "",
                                    description: user?.artisanProfile?.description || "",
                                    specialties: user?.artisanProfile?.specialties?.join(", ") || "",
                                    yearsOfExperience: user?.artisanProfile?.yearsOfExperience || 0,
                                    socialLinks: user?.artisanProfile?.socialLinks || {},
                                  },
                                });
                              }}
                              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </main>
        </div>
      </div>

      {/* Product Modal - truncated for brevity */}
      <AnimatePresence>
        {showProductModal && (
          <ProductModal
            product={editingProduct}
            onClose={() => setShowProductModal(false)}
            onSave={() => {
              setShowProductModal(false);
              fetchProducts();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Product Modal component
const ProductModal = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || "",
    category: product?.category || "jewelry",
    stock: product?.stock || 1,
    isCustomizable: product?.isCustomizable || false,
    images: product?.images || [],
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    try {
      const fd = new FormData();
      for (let file of files) {
        fd.append("images", file);
      }
      const res = await api.post("/products/upload-images", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...res.data.images]
        }));
        toast.success("Images uploaded!");
      }
    } catch (err) {
      toast.error("Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Product description is required");
      return;
    }
    if (!formData.price || formData.price <= 0) {
      toast.error("Valid price is required");
      return;
    }
    if (formData.images.length === 0) {
      toast.error("At least one image is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        images: formData.images.map(img => ({
          url: img.url,
          public_id: img.public_id || ""
        }))
      };

      if (product?._id) {
        await api.put(`/products/${product._id}`, payload);
        toast.success("Product updated!");
      } else {
        await api.post("/products", payload);
        toast.success("Product created!");
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {product ? "Edit Product" : "Add New Product"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="e.g., Handmade Ceramic Vase"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Describe your product..."
            />
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (Rs.) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock *
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="1"
                min="1"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="jewelry">Jewelry</option>
              <option value="pottery">Pottery</option>
              <option value="textiles">Textiles</option>
              <option value="woodwork">Woodwork</option>
              <option value="metalwork">Metalwork</option>
              <option value="glass">Glass</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Customizable */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="customizable"
              checked={formData.isCustomizable}
              onChange={(e) => setFormData({ ...formData, isCustomizable: e.target.checked })}
              className="w-4 h-4 text-amber-600 rounded"
            />
            <label htmlFor="customizable" className="text-sm font-medium text-gray-700">
              This product can be customized
            </label>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Images * (at least 1)
            </label>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {formData.images.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={img.url}
                    alt={`Product ${idx + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FiX className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-amber-500 hover:text-amber-600 transition-colors disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Click to upload images"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {saving ? (
                <>
                  <FiRefreshCw className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{product ? "Update" : "Create"} Product</span>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ArtisanDashboard;