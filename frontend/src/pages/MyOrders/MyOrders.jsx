import React, {
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { assets } from "../../assets/assets";
import { createOrderEventSource } from "../../lib/orderRealtime";

// ─── Status pipeline definition ────────────────────────────────────────────
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

// ─── Single Order Card ──────────────────────────────────────────────────────
const OrderCard = ({ order, onTrack }) => {
  const currentIdx = getStatusIndex(order.status);
  const statusColor = getStatusColor(order.status);

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "18px 20px",
        boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
        transition: "transform 0.18s, box-shadow 0.18s",
        marginBottom: "14px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.09)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,0.05)";
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
        <div
          style={{
            background: "#fff7ed",
            borderRadius: "10px",
            padding: "10px",
            flexShrink: 0,
          }}
        >
          <img
            src={assets.parcel_icon}
            alt="Order"
            style={{ width: 40, height: 40, objectFit: "contain" }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Items list */}
          <p
            style={{
              fontWeight: 600,
              fontSize: "14px",
              color: "#1f2937",
              marginBottom: 4,
            }}
          >
            {order.items &&
              order.items.map(
                (item, i) =>
                  `${item.name} x ${item.quantity}${i < order.items.length - 1 ? ", " : ""}`,
              )}
          </p>

          {/* Amount + item count */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginTop: 4,
            }}
          >
            <span
              style={{ fontSize: "13px", color: "#374151", fontWeight: 700 }}
            >
              LKR {Number(order.amount || 0).toLocaleString()}.00
            </span>
            <span style={{ fontSize: "12px", color: "#6b7280" }}>
              {order.items ? order.items.length : 0} item
              {order.items?.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Status badge */}
        <div style={{ flexShrink: 0, textAlign: "right" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: statusColor + "18",
              color: statusColor,
              borderRadius: "99px",
              padding: "4px 10px",
              fontSize: "11px",
              fontWeight: 700,
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

      {/* Progress pipeline */}
      <div style={{ marginTop: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            position: "relative",
          }}
        >
          {ORDER_PIPELINE.map((step, idx) => {
            const isCompleted = idx <= currentIdx;
            const isCurrent = idx === currentIdx;
            return (
              <React.Fragment key={step.key}>
                {/* Node */}
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
                      width: isCurrent ? 18 : 12,
                      height: isCurrent ? 18 : 12,
                      borderRadius: "50%",
                      background: isCompleted ? step.color : "#e5e7eb",
                      border: isCurrent
                        ? `3px solid ${step.color}`
                        : "2px solid " + (isCompleted ? step.color : "#d1d5db"),
                      boxShadow: isCurrent
                        ? `0 0 0 4px ${step.color}22`
                        : "none",
                      transition: "all 0.3s",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "9px",
                      marginTop: 4,
                      color: isCompleted ? step.color : "#9ca3af",
                      fontWeight: isCurrent ? 700 : 500,
                      whiteSpace: "nowrap",
                      textAlign: "center",
                      maxWidth: 54,
                    }}
                  >
                    {step.label}
                  </span>
                </div>
                {/* Connector line */}
                {idx < ORDER_PIPELINE.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: 3,
                      borderRadius: 4,
                      background:
                        idx < currentIdx
                          ? `linear-gradient(to right, ${ORDER_PIPELINE[idx].color}, ${ORDER_PIPELINE[idx + 1].color})`
                          : "#e5e7eb",
                      transition: "background 0.4s",
                      marginBottom: 16,
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Track button */}
      <div
        style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}
      >
        <button
          onClick={() => onTrack(order._id)}
          style={{
            background: "linear-gradient(135deg, #ff6b35, #f97316)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "7px 18px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.03em",
            boxShadow: "0 3px 10px rgba(249,115,22,0.3)",
            transition: "opacity 0.2s, transform 0.15s",
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
          Track Order
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
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const streamRef = useRef(null);

  const fetchOrders = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        else setIsRefreshing(true);
        setError(null);

        const response = await axios.post(
          url + "/api/order/userorders",
          {},
          { headers: { token } },
        );

        if (response.data.success) {
          setData(response.data.data || []);
          setLastUpdated(new Date());
        } else {
          if (!silent)
            setError(response.data.message || "Failed to fetch orders");
        }
      } catch (err) {
        if (!silent) setError("Failed to load orders. Please try again.");
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
      setLastUpdated(new Date());
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
        <div style={{ margin: "48px 0" }}>
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
      <div style={{ margin: "48px 0" }}>
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

      <div style={{ margin: "48px 0" }}>
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
                fontSize: 26,
                fontWeight: 800,
                color: "#111827",
                margin: 0,
              }}
            >
              My Orders
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
              Track all your orders in real-time
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {/* Live tracking badge */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#f0fdf4",
                color: "#16a34a",
                border: "1px solid #bbf7d0",
                borderRadius: 99,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#22c55e",
                  display: "inline-block",
                  animation: "myOrdersPulse 1.8s infinite",
                }}
              />
              Live tracking
            </span>

            {/* Last updated */}
            {lastUpdated && (
              <span style={{ fontSize: 11, color: "#9ca3af" }}>
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}

            {/* Manual refresh */}
            <button
              onClick={() => fetchOrders(true)}
              title="Refresh now"
              style={{
                background: isRefreshing ? "#f3f4f6" : "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "6px 12px",
                cursor: "pointer",
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
            {data.map((order, index) => (
              <OrderCard
                key={order._id || index}
                order={order}
                onTrack={handleTrack}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MyOrders;
