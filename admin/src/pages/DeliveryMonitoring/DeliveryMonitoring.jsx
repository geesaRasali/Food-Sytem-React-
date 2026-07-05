import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FiTruck, 
  FiMap, 
  FiCheckCircle, 
  FiMapPin, 
  FiBox, 
  FiPackage, 
  FiUser,
  FiPhone,
  FiCalendar,
  FiArrowRight,
  FiCheck
} from 'react-icons/fi';

const DeliveryMonitoring = ({ url, adminToken, adminUser }) => {
  const isRider = adminUser?.role === 'delivery staff';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('Ready for Delivery'); // 'Ready for Delivery', 'Out for Delivery', 'Delivered'

  // Fetch all orders from backend database
  const fetchOrders = async () => {
    if (!url || !adminToken) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/order/list`, {
        headers: {
          token: adminToken,
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (response.data?.success) {
        setOrders(response.data.data || []);
      } else {
        toast.error('Failed to load orders');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching delivery data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [url, adminToken]);

  // Update order status in the backend
  const updateDeliveryStatus = async (orderId, newStatus) => {
    try {
      const payload = { orderId, status: newStatus };
      
      // When picking up / going out for delivery, assign the logged-in rider
      if (newStatus === 'Out for delivery') {
        payload.deliveryStaff = adminUser?.name || adminUser?.username || 'Delivery Partner';
      }

      const response = await axios.post(`${url}/api/order/status`, payload, {
        headers: {
          token: adminToken,
          Authorization: `Bearer ${adminToken}`
        }
      });

      if (response.data?.success) {
        toast.success(`Delivery status updated to: ${newStatus}`);
        fetchOrders();
      } else {
        toast.error(response.data?.message || 'Failed to update delivery');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error executing status update');
    }
  };

  // Restrict list to delivery-only statuses: 'Ready for Delivery', 'Out for delivery', 'Delivered'
  const deliveryOrders = useMemo(() => {
    return orders.filter(order => {
      const status = order.status;
      const isDeliveryOrder = ['Ready for Delivery', 'Out for delivery', 'Delivered'].includes(status);
      
      if (!isDeliveryOrder) return false;

      // If logged in user is a rider, filter 'Out for delivery' & 'Delivered' orders to only show those assigned to them.
      // Show all 'Ready for Delivery' orders so they can collect them.
      if (isRider) {
        const myName = adminUser?.name || adminUser?.username || '';
        const isAssignedToMe = order.deliveryStaff === myName;
        const isUnassignedReady = !order.deliveryStaff && status === 'Ready for Delivery';

        if (!isAssignedToMe && !isUnassignedReady) return false;
      }

      return true;
    });
  }, [orders, isRider, adminUser]);

  // Filter orders by delivery stage for the 3 categories
  const readyOrders = useMemo(() => {
    return deliveryOrders.filter(o => o.status === 'Ready for Delivery');
  }, [deliveryOrders]);

  const outOrders = useMemo(() => {
    return deliveryOrders.filter(o => o.status === 'Out for delivery');
  }, [deliveryOrders]);

  const deliveredOrders = useMemo(() => {
    return deliveryOrders.filter(o => o.status === 'Delivered');
  }, [deliveryOrders]);

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto animate-fadeIn text-zinc-900 dark:text-zinc-100 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500 dark:bg-orange-500/20">
            <FiTruck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-955 dark:text-white tracking-tight">
              {isRider ? 'My Delivery Portal' : 'Delivery Management'}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              {isRider ? 'Manage your pickup queue and complete deliveries' : 'Track orders ready for pickup, out in transit, and completed'}
            </p>
          </div>
        </div>
        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {}
          <button 
            onClick={fetchOrders}
            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            Refresh List
          </button>
        </div>
      </div>

      {/* Overview Cards (Clickable Tabs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Ready Card */}
        <div 
          onClick={() => setCurrentTab('Ready for Delivery')}
          className={`cursor-pointer bg-white dark:bg-zinc-900 border p-6 rounded-3xl flex items-center justify-between shadow-xs transition duration-300 ${
            currentTab === 'Ready for Delivery'
              ? 'border-amber-500 ring-2 ring-amber-500/10'
              : 'border-zinc-205 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
          }`}
        >
          <div>
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Ready for Delivery</p>
            <h3 className="text-3xl font-extrabold text-amber-500 mt-1">{readyOrders.length}</h3>
          </div>
          <div className="p-4 bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 rounded-2xl">
            <FiBox className="w-6 h-6" />
          </div>
        </div>

        {/* Out for Delivery Card */}
        <div 
          onClick={() => setCurrentTab('Out for Delivery')}
          className={`cursor-pointer bg-white dark:bg-zinc-900 border p-6 rounded-3xl flex items-center justify-between shadow-xs transition duration-300 ${
            currentTab === 'Out for Delivery'
              ? 'border-blue-500 ring-2 ring-blue-500/10'
              : 'border-zinc-205 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
          }`}
        >
          <div>
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Out for Delivery</p>
            <h3 className="text-3xl font-extrabold text-blue-500 mt-1">{outOrders.length}</h3>
          </div>
          <div className="p-4 bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 rounded-2xl">
            <FiTruck className="w-6 h-6" />
          </div>
        </div>

        {/* Delivered Card */}
        <div 
          onClick={() => setCurrentTab('Delivered')}
          className={`cursor-pointer bg-white dark:bg-zinc-900 border p-6 rounded-3xl flex items-center justify-between shadow-xs transition duration-300 ${
            currentTab === 'Delivered'
              ? 'border-emerald-500 ring-2 ring-emerald-500/10'
              : 'border-zinc-205 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
          }`}
        >
          <div>
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Delivered</p>
            <h3 className="text-3xl font-extrabold text-emerald-500 mt-1">{deliveredOrders.length}</h3>
          </div>
          <div className="p-4 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 rounded-2xl">
            <FiCheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Active Grid View */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
        
        {/* Tab Title Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-805">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${
              currentTab === 'Ready for Delivery' ? 'bg-amber-500' :
              currentTab === 'Out for Delivery' ? 'bg-blue-500' : 'bg-emerald-500'
            }`} />
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white">
              {currentTab}
            </h2>
          </div>
          <span className={`px-3 py-1 text-xs font-black rounded-xl ${
            currentTab === 'Ready for Delivery' ? 'bg-amber-100 text-amber-600 dark:bg-amber-955/20 dark:text-amber-400' :
            currentTab === 'Out for Delivery' ? 'bg-blue-100 text-blue-600 dark:bg-blue-955/20 dark:text-blue-400' :
            'bg-emerald-100 text-emerald-600 dark:bg-emerald-955/20 dark:text-emerald-400'
          }`}>
            {currentTab === 'Ready for Delivery' ? readyOrders.length :
             currentTab === 'Out for Delivery' ? outOrders.length : deliveredOrders.length} Orders
          </span>
        </div>

        {/* Content list in responsive grid */}
        {loading ? (
          <p className="text-sm text-zinc-450 italic py-8">Updating delivery list...</p>
        ) : (
          (() => {
            const activeList = 
              currentTab === 'Ready for Delivery' ? readyOrders :
              currentTab === 'Out for Delivery' ? outOrders : deliveredOrders;
              
            if (activeList.length === 0) {
              return (
                <div className="text-center py-16 bg-zinc-50/50 dark:bg-zinc-900/30 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-zinc-450 font-semibold text-sm">
                  {currentTab === 'Ready for Delivery' ? 'No orders ready for pickup.' :
                   currentTab === 'Out for Delivery' ? 'No orders in transit.' : 'No orders successfully delivered.'}
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeList.map(order => (
                  <div key={order._id} className="bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs hover:shadow-sm transition flex flex-col justify-between min-h-[340px]">
                    
                    <div>
                      {/* Card Header */}
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60">
                        <span className="text-sm font-black text-orange-600 font-mono">#{order._id.substring(0, 8).toUpperCase()}</span>
                        <span className="text-xs text-zinc-400 font-bold flex items-center gap-1.5">
                          <FiCalendar size={13} />
                          {new Date(order.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Customer Info Card */}
                      <div className="mb-4 p-4 bg-zinc-100/60 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 space-y-3">
                        <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100">
                          <FiUser className="w-4 h-4 text-zinc-405 shrink-0" />
                          <span className="font-bold text-sm">{order.address?.firstName} {order.address?.lastName}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-zinc-805 dark:text-zinc-200">
                          <FiPhone className="w-4 h-4 text-zinc-405 shrink-0" />
                          <span className="font-bold text-sm">{order.address?.phone}</span>
                        </div>
                        <div className="flex items-start gap-2.5 text-zinc-805 dark:text-zinc-200">
                          <FiMapPin className="w-4 h-4 text-zinc-450 shrink-0 mt-0.5" />
                          <span className="font-semibold text-sm leading-relaxed">{order.address?.street}, {order.address?.city}</span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="mb-4">
                        <p className="text-[10px] font-black uppercase tracking-wider text-zinc-455 mb-2">Items</p>
                        <div className="flex flex-wrap gap-2">
                          {order.items.map((item, idx) => (
                            <span key={idx} className="inline-block px-3 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold rounded-lg shadow-2xs">
                              {item.name} <span className="text-orange-500 font-black">x{item.quantity}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Assigned Rider Info (only for Out/Delivered) */}
                      {order.status !== 'Ready for Delivery' && (
                        <div className="mb-4 flex items-center gap-2 pt-1">
                          <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-550">
                            {order.deliveryStaff ? order.deliveryStaff[0].toUpperCase() : '?'}
                          </div>
                          <span className="text-xs text-zinc-500 font-bold">Rider: {order.deliveryStaff || 'Unassigned'}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Block */}
                    <div className="pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50 mt-auto">
                      {order.status === 'Ready for Delivery' && (
                        <button 
                          onClick={() => updateDeliveryStatus(order._id, 'Out for delivery')}
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-xs tracking-wider transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          Mark as Out for Delivery <FiArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {order.status === 'Out for delivery' && (
                        <button 
                          onClick={() => updateDeliveryStatus(order._id, 'Delivered')}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs tracking-wider transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          Mark as Delivered <FiCheck className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {order.status === 'Delivered' && (
                        <div className="w-full py-2.5 bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-1 border border-emerald-100 dark:border-emerald-900/30">
                          <FiCheckCircle className="w-4 h-4" /> Delivered
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            );
          })()
        )}

      </div>
    </div>
  );
};

export default DeliveryMonitoring;
