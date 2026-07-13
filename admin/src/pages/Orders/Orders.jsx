import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { assets } from "../../assets/assets";
import { normalizeRole, ROLES } from "../../config/rbac";
import { FiSearch, FiX } from "react-icons/fi";

const POLL_INTERVAL_MS = 15000;
const ORDERS_PER_PAGE = 5;

const getOrderDate = (order) => new Date(order.createdAt || order.date || 0);

const Orders = ({ url, adminToken, adminUser }) => {
  const [Orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pollRef = useRef(null);
  const normalizedRole = normalizeRole(adminUser?.role);
  const isDeliveryStaff = normalizedRole === ROLES.DELIVERY_STAFF;
  const statusOptions = isDeliveryStaff
    ? ["Out for delivery", "Delivered"]
    : [
        "Order Placed",
        "Food Processing",
        "Ready for Delivery",
        "Out for delivery",
        "Delivered",
      ];

  const fetchAllOrders = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const response = await axios.get(url + "/api/order/list", {
        headers: {
          token: adminToken,
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (response.data.success) {
        setOrders(response.data.data || []);
      } else {
        if (!silent) toast.error("Error fetching orders");
      }
    } catch (error) {
      if (!silent) toast.error("Unable to load orders");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const statusHandler = async (event, orderId) => {
    try {
      const response = await axios.post(
        url + "/api/order/status",
        {
          orderId,
          status: event.target.value,
        },
        {
          headers: {
            token: adminToken,
            Authorization: `Bearer ${adminToken}`,
          },
        },
      );
      if (response.data.success) {
        toast.success(response.data.message || "Status updated");
        await fetchAllOrders();
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      toast.error("Error updating status");
    }
  };

  const formatItemsText = (items = []) => {
    return items.map((item) => `${item.name} x ${item.quantity}`).join(", ");
  };

  const getStatusTone = (status = "") => {
    if (status === "Order Placed") {
      return "bg-zinc-150 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
    }
    if (status === "Delivered") {
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
    }
    if (status === "Out for delivery") {
      return "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300";
    }
    return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
  };

  const totalRevenue = Orders.filter(
    (order) => !order.status?.toLowerCase().includes("cancel"),
  ).reduce((sum, order) => sum + Number(order.amount || 0), 0);
  const deliveredCount = Orders.filter(
    (order) => order.status === "Delivered",
  ).length;
  const pendingCount = Orders.filter(
    (order) =>
      order.status !== "Delivered" &&
      !order.status?.toLowerCase().includes("cancel"),
  ).length;

  const filteredOrders = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return Orders.filter((order) => {
      if (!query) return true;

      const firstName = order.address?.firstName || "";
      const lastName = order.address?.lastName || "";
      const fullName = `${firstName} ${lastName}`.toLowerCase();
      const itemsText = (order.items || [])
        .map((item) => `${item.name} x ${item.quantity}`)
        .join(" ")
        .toLowerCase();
      const orderId = String(order._id || "").toLowerCase();
      const phone = String(order.address?.phone || "").toLowerCase();
      const city = String(order.address?.city || "").toLowerCase();
      const street = String(order.address?.street || "").toLowerCase();

      return (
        fullName.includes(query) ||
        itemsText.includes(query) ||
        orderId.includes(query) ||
        phone.includes(query) ||
        city.includes(query) ||
        street.includes(query)
      );
    });
  }, [Orders, searchQuery]);

  const sortedOrders = useMemo(
    () =>
      [...filteredOrders].sort(
        (a, b) => getOrderDate(b).getTime() - getOrderDate(a).getTime(),
      ),
    [filteredOrders],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(sortedOrders.length / ORDERS_PER_PAGE),
  );

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ORDERS_PER_PAGE;
    return sortedOrders.slice(start, start + ORDERS_PER_PAGE);
  }, [sortedOrders, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Initial load
  useEffect(() => {
    fetchAllOrders();
  }, []);

  
  useEffect(() => {
    if (!url || !adminToken) return;
    pollRef.current = setInterval(() => {
      fetchAllOrders(true);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [url, adminToken]);

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-zinc-50 px-4 py-6 dark:bg-zinc-900 md:px-7">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 rounded-2xl border border-orange-200 bg-linear-to-r from-white via-orange-50/60 to-amber-50/70 p-4 shadow-[0_14px_34px_rgba(249,115,22,0.08)] dark:border-zinc-700 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800 md:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
                Order Management
              </p>
              <h3 className="mt-1.5 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                Orders
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Monitor incoming orders and update delivery progress.
              </p>

            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                  Total
                </p>
                <p className="text-base font-black text-zinc-900 dark:text-zinc-100">
                  {Orders.length}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                  Delivered
                </p>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  {deliveredCount}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                  Pending
                </p>
                <p className="text-base font-black text-amber-600 dark:text-amber-400">
                  {pendingCount}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                  Revenue
                </p>
                <p className="text-base font-black text-zinc-900 dark:text-zinc-100">
                  LKR {totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
            <FiSearch className="text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, items, order ID, phone..."
              className="w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-250 dark:text-zinc-500"
              >
                <FiX className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-44 items-center justify-center rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : Orders.length === 0 ? (
          <div className="flex h-44 flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <img
              src={assets.parcel_icon}
              alt="No orders"
              className="mb-3 h-12 w-12 opacity-35"
            />
            <p className="text-sm text-zinc-500">No orders available yet.</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex h-44 flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <img
              src={assets.parcel_icon}
              alt="No matching orders"
              className="mb-3 h-12 w-12 opacity-35"
            />
            <p className="text-sm text-zinc-500">
              No orders match your search query.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedOrders.map((order, index) => (
              <article
                key={order._id || index}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.05)] dark:border-zinc-700 dark:bg-zinc-900"
              >
                <div className="grid gap-4 md:grid-cols-[64px_2fr_1fr_1fr_190px] md:items-start">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-50 dark:bg-zinc-800">
                    <img
                      src={assets.parcel_icon}
                      alt="Order parcel"
                      className="h-10 w-10 object-contain"
                    />
                  </div>

                  <div>
                    <p className="line-clamp-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {formatItemsText(order.items)}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      {order.address.firstName} {order.address.lastName}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {order.address.street}, {order.address.city},{" "}
                      {order.address.state}, {order.address.country},{" "}
                      {order.address.zipcode}
                    </p>
                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                      Phone: {order.address.phone}
                    </p>
                  </div>

                  <div className="md:pt-1">
                    <p className="text-[11px] uppercase tracking-wide text-zinc-400">
                      Items
                    </p>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                      {order.items.length}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                      #{String(order._id || "").slice(-6)}
                    </p>
                  </div>

                  <div className="md:pt-1">
                    <p className="text-[11px] uppercase tracking-wide text-zinc-400">
                      Amount
                    </p>
                    <p className="text-base font-black text-zinc-900 dark:text-zinc-100">
                      LKR {Number(order.amount || 0).toLocaleString()}
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${getStatusTone(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="md:pt-1">
                    <p className="mb-1 text-[11px] uppercase tracking-wide text-zinc-400">
                      Update Status
                    </p>
                    {order.status === "Order Placed" && !isDeliveryStaff ? (
                      <button
                        type="button"
                        onClick={() =>
                          statusHandler(
                            { target: { value: "Food Processing" } },
                            order._id,
                          )
                        }
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-lg py-2 text-xs font-extrabold uppercase tracking-wider transition active:scale-[0.98] shadow-xs cursor-pointer shadow-orange-500/15"
                      >
                        Confirm & Send
                      </button>
                    ) : (
                      <select
                        onChange={(event) => statusHandler(event, order._id)}
                        value={order.status}
                        className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-xs font-semibold text-zinc-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                      >
                        {statusOptions.map((status) => (
                          <option
                            key={status}
                            value={status}
                            className="bg-white text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                          >
                            {status}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </article>
            ))}

            {totalPages > 1 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-700">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Showing {(currentPage - 1) * ORDERS_PER_PAGE + 1}–
                  {Math.min(currentPage * ORDERS_PER_PAGE, sortedOrders.length)}{" "}
                  of {sortedOrders.length} orders
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => page - 1)}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  >
                    Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          page === currentPage
                            ? "bg-orange-600 text-white"
                            : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => page + 1)}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default Orders;
