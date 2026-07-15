import React, {
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { assets } from "../../assets/assets";
import { createOrderEventSource } from "../../lib/orderRealtime";


const ORDER_PIPELINE = [
  { key: "Order Placed", label: "Placed", color: "#94a3b8" },
  { key: "Food Processing", label: "Preparing", color: "#f97316" },
  { key: "Ready for Delivery", label: "Ready", color: "#8b5cf6" },
  { key: "Out for delivery", label: "Out for delivery", color: "#3b82f6" },
  { key: "Delivered", label: "Delivered", color: "#22c55e" },
];

const getStatusIndex = (status = "") => {
  const normalized = status.toLowerCase().trim();
  const idx = ORDER_PIPELINE.findIndex(
    (s) => s.key.toLowerCase() === normalized,
  );
  return idx >= 0 ? idx : 0;
};

const getStatusColor = (status = "") => {
  const idx = getStatusIndex(status);
  return ORDER_PIPELINE[idx]?.color || "#94a3b8";
};

const ORDERS_PER_PAGE = 5;

const PAGE_PADDING = {
  padding: "32px 24px 48px",
  maxWidth: 1120,
  margin: "0 auto",
  width: "100%",
  boxSizing: "border-box",
};

const formatOrderDateTime = (value) => {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return "";

  const day = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  return `${day} • ${time}`;
};


const OrderCard = ({ order, onTrack }) => {
  const [showTracking, setShowTracking] = useState(false);
  const currentIdx = getStatusIndex(order.status);
  const statusColor = getStatusColor(order.status);

  const handleToggleTracking = () => {
    if (!showTracking) {
      onTrack(order._id);
    }
    setShowTracking((prev) => !prev);
  };

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #fffdf9 100%)",
        border: "1px solid #e7e5e4",
        borderRadius: "16px",
        padding: "14px 15px 13px",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
        transition: "transform 0.18s, box-shadow 0.18s",
        marginBottom: "10px",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 14px 34px rgba(15,23,42,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(15, 23, 42, 0.05)";
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto minmax(0, 1fr) auto",
          columnGap: 12,
          rowGap: 8,
          alignItems: "start",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
            borderRadius: "12px",
            padding: "8px",
            flexShrink: 0,
            border: "1px solid #fed7aa",
            gridRow: "1 / span 2",
          }}
        >
          <img
            src={assets.parcel_icon}
            alt="Order"
            style={{ width: 28, height: 28, objectFit: "contain" }}
          />
        </div>

        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontWeight: 900,
              fontSize: "15px",
              color: "#0f172a",
              margin: 0,
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
            }}
          >
            {order.items &&
              order.items.map(
                (item, i) =>
                  `${item.name} x ${item.quantity}${i < order.items.length - 1 ? ", " : ""}`,
              )}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              marginTop: 5,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{ fontSize: "21px", color: "#111827", fontWeight: 900 }}
            >
              LKR {Number(order.amount || 0).toLocaleString()}.00
            </span>
            <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 600 }}>
              {order.items ? order.items.length : 0} item
              {order.items?.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              marginTop: 8,
              fontSize: "12px",
              color: "#6b7280",
            }}
          >
            <span style={{ fontWeight: 700, color: "#374151" }}>
              Order #{String(order._id || "").slice(-6).toUpperCase()}
            </span>
            <span style={{ fontWeight: 600 }}>
              {formatOrderDateTime(order.createdAt || order.date)}
            </span>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: statusColor + "18",
              color: statusColor,
              borderRadius: "999px",
              padding: "7px 12px",
              fontSize: "12px",
              fontWeight: 800,
              border: `1px solid ${statusColor}33`,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: statusColor,
                display: "inline-block",
                animation:
                  order.status !== "Delivered"
                    ? "myOrdersPulse 1.8s infinite"
                    : "none",
              }}
            />
            {order.status || "Food Processing"}
          </span>
        </div>
      </div>

      {showTracking && (
        <div
          style={{
            marginTop: 12,
            animation: "myOrdersFadeIn 0.25s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              position: "relative",
              overflowX: "auto",
              paddingBottom: 2,
            }}
          >
            {ORDER_PIPELINE.map((step, idx) => {
              const isCompleted = idx <= currentIdx;
              const isCurrent = idx === currentIdx;
              return (
                <React.Fragment key={step.key}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      zIndex: 1,
                      flex: "0 0 auto",
                    }}
                  >
                    <div
                      style={{
                        width: isCurrent ? 12 : 8,
                        height: isCurrent ? 12 : 8,
                        borderRadius: "50%",
                        background: isCompleted ? step.color : "#e5e7eb",
                        border: isCurrent
                          ? `2px solid ${step.color}`
                          : "1.5px solid " +
                            (isCompleted ? step.color : "#d1d5db"),
                        boxShadow: isCurrent
                          ? `0 0 0 3px ${step.color}22`
                          : "none",
                        transition: "all 0.3s",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "8px",
                        marginTop: 3,
                        color: isCompleted ? step.color : "#9ca3af",
                        fontWeight: isCurrent ? 700 : 500,
                        whiteSpace: "nowrap",
                        textAlign: "center",
                        maxWidth: 44,
                        lineHeight: 1.2,
                      }}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < ORDER_PIPELINE.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        minWidth: 12,
                        height: 2,
                        borderRadius: 4,
                        background:
                          idx < currentIdx
                            ? `linear-gradient(to right, ${ORDER_PIPELINE[idx].color}, ${ORDER_PIPELINE[idx + 1].color})`
                            : "#e5e7eb",
                        transition: "background 0.4s",
                        marginBottom: 14,
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
        <button
          type="button"
          onClick={handleToggleTracking}
          style={{
            background: showTracking
              ? "#fff"
              : "linear-gradient(135deg, #ff6b35, #f97316)",
            color: showTracking ? "#374151" : "#fff",
            border: showTracking ? "1px solid #e5e7eb" : "none",
            borderRadius: "999px",
            padding: "7px 14px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.03em",
            boxShadow: showTracking
              ? "none"
              : "0 2px 8px rgba(249,115,22,0.25)",
            transition: "opacity 0.2s, transform 0.15s",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            minWidth: 118,
            justifyContent: "center",
            boxShadow: showTracking
              ? "none"
              : "0 6px 16px rgba(249,115,22,0.18)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.88";
            e.currentTarget.style.transform = "scale(1.03)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: showTracking ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          {showTracking ? "Hide Tracking" : "Track Order"}
        </button>
      </div>
    </div>
  );
};

// ─── Pagination ─────────────────────────────────────────────────────────────
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems }) => {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * ORDERS_PER_PAGE + 1;
  const end = Math.min(currentPage * ORDERS_PER_PAGE, totalItems);

  const btnStyle = (active, disabled) => ({
    background: active ? "#f97316" : "#fff",
    color: active ? "#fff" : disabled ? "#d1d5db" : "#374151",
    border: active ? "1px solid #f97316" : "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    transition: "background 0.15s, color 0.15s",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
        marginTop: 20,
        paddingTop: 16,
        borderTop: "1px solid #e5e7eb",
      }}
    >
      <span style={{ fontSize: 12, color: "#6b7280" }}>
        Showing {start}–{end} of {totalItems} orders
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={btnStyle(false, currentPage === 1)}
        >
          Prev
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            style={btnStyle(page === currentPage, false)}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={btnStyle(false, currentPage === totalPages)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────
const MyOrders = () => {
  const { url, token } = useContext(StoreContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const streamRef = useRef(null);
  const listRef = useRef(null);

  const getOrderDate = (order) =>
    new Date(order.createdAt || order.date || 0);

  const sortedOrders = useMemo(
    () =>
      [...data].sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA;
      }),
    [data],
  );

  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / ORDERS_PER_PAGE));

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ORDERS_PER_PAGE;
    return sortedOrders.slice(start, start + ORDERS_PER_PAGE);
  }, [sortedOrders, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const fetchOrders = useCallback(
    async (silent = false) => {
      if (!url || !token) {
        const message = "Please log in again to refresh your orders";
        if (!silent) setError(message);
        else toast.error(message);
        return;
      }

      try {
        if (!silent) setLoading(true);
        else setIsRefreshing(true);
        setError(null);

        const response = await axios.post(
          url + "/api/order/userorders",
          {},
          {
            headers: {
              token,
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.data.success) {
          setData(response.data.data || []);
          if (silent) {
            toast.success("Orders refreshed");
          }
        } else {
          const message = response.data.message || "Failed to fetch orders";
          if (!silent) setError(message);
          else toast.error(message);
        }
      } catch (err) {
        const message = "Failed to load orders. Please try again.";
        if (!silent) setError(message);
        else toast.error(message);
      } finally {
        if (!silent) setLoading(false);
        else setIsRefreshing(false);
      }
    },
    [url, token],
  );

  // Initial load
  useEffect(() => {
    if (token) {
      fetchOrders();
    } else {
      setLoading(false);
      setError("Please log in to view your orders");
    }
  }, [token]);

  useEffect(() => {
    if (!token || !url) return;
    streamRef.current = createOrderEventSource(url, token, (updatedOrder) => {
      setData((prev) =>
        prev.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order,
        ),
      );
    });

    return () => {
      streamRef.current?.close?.();
      streamRef.current = null;
    };
  }, [token, url]);

  const handleTrack = () => {
    fetchOrders(true);
  };

  // ── Render states ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <style>{`@keyframes myOrdersSpin { to { transform: rotate(360deg); } }`}</style>
        <div style={PAGE_PADDING}>
          <h1
            style={{
              marginBottom: 30,
              fontSize: 24,
              fontWeight: 800,
              color: "#111827",
            }}
          >
            My Orders
          </h1>
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#6b7280",
              fontSize: 15,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "4px solid #f97316",
                borderTopColor: "transparent",
                animation: "myOrdersSpin 0.8s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            Loading your orders...
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <div style={PAGE_PADDING}>
        <h2
          style={{
            marginBottom: 30,
            fontSize: 24,
            fontWeight: 800,
            color: "#111827",
          }}
        >
          My Orders
        </h2>
        <div
          style={{
            border: "1px solid #fca5a5",
            background: "#fff5f5",
            borderRadius: 12,
            padding: "40px 20px",
            textAlign: "center",
            color: "#ef4444",
            fontSize: 15,
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes myOrdersPulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes myOrdersSpin  { to { transform: rotate(360deg); } }
        @keyframes myOrdersFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={PAGE_PADDING} ref={listRef}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div>
            <h2
              style={{
                  fontSize: 34,
                fontWeight: 800,
                color: "#111827",
                margin: 0,
                
              }}
            >
              My Orders
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 15, color: "#6b7280" }}>
              Track all your orders in real-time
            </p>
          </div>

          <button
            onClick={() => fetchOrders(true)}
            title="Refresh now"
            disabled={isRefreshing}
            style={{
              background: isRefreshing ? "#f3f4f6" : "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "6px 12px",
              cursor: isRefreshing ? "not-allowed" : "pointer",
              opacity: isRefreshing ? 0.8 : 1,
              color: "#6b7280",
              fontSize: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 5,
              transition: "background 0.2s",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                animation: isRefreshing
                  ? "myOrdersSpin 0.8s linear infinite"
                  : "none",
              }}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Orders list */}
        {data.length === 0 ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              color: "#6b7280",
              fontSize: 15,
              border: "1px dashed #e5e7eb",
              borderRadius: 14,
              background: "#fafafa",
            }}
          >
            <img
              src={assets.parcel_icon}
              alt="No orders"
              style={{ width: 56, opacity: 0.3, marginBottom: 14 }}
            />
            <p style={{ margin: 0, fontWeight: 600 }}>No orders yet</p>
            <p style={{ margin: "6px 0 0", fontSize: 13 }}>
              Start ordering some delicious food!
            </p>
          </div>
        ) : (
          <div style={{ animation: "myOrdersFadeIn 0.35s ease" }}>
            {paginatedOrders.map((order, index) => (
              <OrderCard
                key={order._id || index}
                order={order}
                onTrack={handleTrack}
              />
            ))}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={sortedOrders.length}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default MyOrders;
