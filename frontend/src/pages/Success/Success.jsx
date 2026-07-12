import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { createOrderEventSource } from "../../lib/orderRealtime";

const Success = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { url, token } = useContext(StoreContext);

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || !token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.post(
          url + "/api/order/single",
          { orderId },
          { headers: { token } },
        );

        if (response.data.success && response.data.order) {
          setOrder(response.data.order);
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, token, url]);

  useEffect(() => {
    if (!orderId || !token || !url) return;

    const source = createOrderEventSource(url, token, (updatedOrder) => {
      if (updatedOrder?._id === orderId) {
        setOrder(updatedOrder);
        setLastUpdated(new Date());
      }
    });

    return () => source?.close?.();
  }, [orderId, token, url]);

  const itemCount = useMemo(() => {
    if (!order?.items?.length) return 0;
    return order.items.reduce((total, item) => total + (item.quantity || 0), 0);
  }, [order]);

  return (
    <section className="mx-auto mt-6 w-full max-w-7xl px-4 pb-6 sm:mt-8">
      <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm">
        <div className="bg-linear-to-r from-orange-600 to-amber-400 px-5 py-5 text-white sm:px-6 sm:py-6">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Payment Successful 🎉
          </h1>
          <p className="mt-1 text-sm font-medium text-white/90">
            Thank you for your order.
          </p>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
            Order Summary
          </h2>

          {loading ? (
            <p className="mt-5 text-zinc-500">Loading order details...</p>
          ) : (
            <>
              {order?.items && order.items.length > 0 && (
                <div className="mt-4 rounded-2xl bg-stone-100 p-3.5 sm:p-4">
                  <div className="flex items-center justify-between py-1 text-zinc-700">
                    <span>Order ID</span>
                    <span className="max-w-[58%] truncate text-right font-semibold sm:max-w-none sm:truncate-none">
                      {orderId || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-zinc-700">
                    <span>Total Items</span>
                    <span className="font-semibold">{itemCount}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-zinc-700">
                    <span>Amount</span>
                    <span className="font-semibold">
                      LKR {order?.amount ?? "--"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-zinc-700">
                    <span>Status</span>
                    <span className="font-semibold">
                      {order?.status || "Food Processing"}
                    </span>
                  </div>
                  {lastUpdated && (
                    <div className="flex items-center justify-between py-1 text-zinc-500">
                      <span>Last Updated</span>
                      <span className="font-medium">
                        {lastUpdated.toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="mt-5 flex flex-wrap gap-2.5 sm:gap-3">
            <Link
              to="/myorders"
              className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              View My Orders
            </Link>
            <Link
              to="/"
              className="rounded-xl border border-orange-300 px-5 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-50"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Success;
