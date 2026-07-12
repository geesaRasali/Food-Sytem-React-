import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiClock, 
  FiCheck, 
  FiPlay, 
  FiAlertCircle, 
  FiSearch, 
  FiCoffee, 
  FiCheckCircle, 
  FiUser, 
  FiMapPin, 
  FiPhone, 
  FiDollarSign, 
  FiCalendar, 
  FiActivity, 
  FiChevronRight, 
  FiList,
  FiTrendingUp,
  FiAlertTriangle,
  FiBell,
  FiAward,
  FiBriefcase
} from 'react-icons/fi';

const formatMoney = (value) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(value || 0);

const KitchenMonitoring = ({ url, adminToken, adminUser }) => {
  const isKitchenStaffUser = adminUser?.role === 'kitchen staff';
  
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'orders'; // 'dashboard', 'orders', 'history'
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Queued', 'Preparing', 'Ready'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [kitchenStaffTab, setKitchenStaffTab] = useState(isKitchenStaffUser ? 'My Orders' : 'All'); // 'My Orders', 'Unassigned', 'All'
  const [foods, setFoods] = useState([]);
  const [staffStatuses, setStaffStatuses] = useState({});
  const [activeAlertTab, setActiveAlertTab] = useState('alerts'); // 'alerts' or 'timeline'
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState({});
  
  // Local list of timeline events
  const [timelineEvents, setTimelineEvents] = useState([
    { id: 'ev-1', text: 'Order #ord-1027 marked as Ready for Delivery', time: new Date(Date.now() - 15 * 60000) },
    { id: 'ev-2', text: 'Started preparing Spicy Chicken Pizza for Order #ord-1024', time: new Date(Date.now() - 10 * 60000) },
    { id: 'ev-3', text: 'New Order #ord-1025 added to the queue', time: new Date(Date.now() - 20 * 60000) },
    { id: 'ev-4', text: 'Order #ord-1023 handed over for delivery to KAMAL BANDARA', time: new Date(Date.now() - 25 * 60000) }
  ]);

  // Fetch orders from API
  const fetchOrders = async () => {
    if (!url) {
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
      if (response?.data?.success) {
        setOrders(response.data.data || []);
      } else {
        toast.error('Error loading orders from kitchen feed');
      }
    } catch (err) {
      console.error('Error fetching kitchen orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch staff list for assignment
  const fetchStaffList = async () => {
    if (!url || !adminToken) return;
    try {
      const response = await axios.get(`${url}/api/user/staff`, {
        headers: {
          token: adminToken,
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (response?.data?.success) {
        // Filter for kitchen staff
        const kitchenStaff = (response.data.users || []).filter(
          (u) => u.role === 'kitchen staff'
        );
        setStaffList(kitchenStaff);
      }
    } catch (err) {
      console.error('Error fetching staff list:', err);
    }
  };

  // Fetch food items for stock level alerts
  const fetchFoods = async () => {
    if (!url) return;
    try {
      const response = await axios.get(`${url}/api/food/list`);
      if (response?.data?.success) {
        setFoods(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching food list for kitchen monitoring:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchStaffList();
    fetchFoods();
  }, [url, adminToken]);

  // Auto-polling: silently refresh kitchen orders every 15 s
  useEffect(() => {
    if (!url) return;
    const pollInterval = setInterval(() => {
      fetchOrders();
    }, 15000);
    return () => clearInterval(pollInterval);
  }, [url, adminToken]);

  // High fidelity fallback orders for demonstration
  const activeOrders = useMemo(() => {
    if (orders.length > 0) return orders;
    return [
      {
        _id: 'ord-1024',
        amount: 8000,
        status: 'Preparing',
        kitchenStaff: 'Kamal Bandara',
        date: new Date(Date.now() - 600000).toISOString(), // 10m ago
        payment: true,
        address: { firstName: 'Amila', lastName: 'Perera', phone: '0701173270', street: '45 Galle Rd', city: 'Colombo 03' },
        items: [
          { name: 'Spicy Chicken Pizza (Large)', quantity: 2, price: 3000 },
          { name: 'Jar Ice Cream', quantity: 1, price: 2000 }
        ]
      },
      {
        _id: 'ord-1025',
        amount: 24500,
        status: 'Food Processing', // Queued
        kitchenStaff: '',
        date: new Date(Date.now() - 1200000).toISOString(), // 20m ago
        payment: true,
        address: { firstName: 'Dinithi', lastName: 'Silva', phone: '0712245991', street: '12/A Flower Rd', city: 'Colombo 07' },
        items: [
          { name: 'Sliced Cake', quantity: 7, price: 3500 }
        ]
      },
      {
        _id: 'ord-1026',
        amount: 1600,
        status: 'Food Processing', // Queued
        kitchenStaff: '',
        date: new Date(Date.now() - 1800000).toISOString(), // 30m ago
        payment: false,
        address: { firstName: 'Roshan', lastName: 'De Alwis', phone: '0773348123', street: '88 Kandy Rd', city: 'Kelaniya' },
        items: [
          { name: 'Peri Peri Rolls', quantity: 1, price: 1600 }
        ]
      },
      {
        _id: 'ord-1027',
        amount: 5800,
        status: 'Ready for Delivery',
        kitchenStaff: 'Amara De Silva',
        date: new Date(Date.now() - 2400000).toISOString(),
        payment: true,
        address: { firstName: 'Suresh', lastName: 'Guneratne', phone: '0729910344', street: '24 Orchid Path', city: 'Rajagiriya' },
        items: [
          { name: 'Beef Burger Combo', quantity: 1, price: 4000 },
          { name: 'Chicken Salad', quantity: 1, price: 1800 }
        ]
      }
    ];
  }, [orders]);

  
  const getWorkflowState = (status = '') => {
    const s = status.toLowerCase().trim();
    if (s === 'ready' || s === 'ready for delivery' || s === 'out for delivery') {
      return 'Ready for Pickup';
    }
    if (s === 'preparing') {
      return 'In Progress';
    }
    return 'Pending'; // Default fallback ('Food Processing', 'Placed', etc.)
  };

  // Check if order is active in the kitchen (exclude Delivered/Cancelled)
  const kitchenOrders = useMemo(() => {
    return activeOrders.map(order => {
      const workflowState = getWorkflowState(order.status);
      
      // Calculate dynamic priority level based on order value complexity
      const priority = order.amount > 15000 ? 'High' : order.amount > 4000 ? 'Medium' : 'Low';
      
      // Calculate estimated prep duration based on item quantity
      const itemCount = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 1), 0);
      const estPrepTime = `${10 + itemCount * 2} mins`;

      // Mock special instructions based on items
      let instructions = '';
      if (order._id === 'ord-1024') instructions = 'Extra cheese on one pizza';
      else if (order._id === 'ord-1025') instructions = 'Serve in individual containers';
      else if (order._id === 'ord-1026') instructions = 'Spicy sauce on the side';

      return {
        ...order,
        workflowState,
        priority,
        estPrepTime,
        instructions,
        kitchenStaff: order.kitchenStaff || ''
      };
    }).filter(o => {
      const s = o.status?.toLowerCase().trim() || '';
      return s !== 'delivered' && !s.includes('cancel') && s !== 'order placed';
    });
  }, [activeOrders]);

  // Get completed orders for history view
  const completedOrders = useMemo(() => {
    return activeOrders.map(order => {
      const workflowState = getWorkflowState(order.status);
      const priority = order.amount > 15000 ? 'High' : order.amount > 4000 ? 'Medium' : 'Low';
      const itemCount = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 1), 0);
      const estPrepTime = `${10 + itemCount * 2} mins`;
      return {
        ...order,
        workflowState,
        priority,
        estPrepTime,
        kitchenStaff: order.kitchenStaff || ''
      };
    }).filter(o => {
      const s = o.status?.toLowerCase().trim() || '';
      return s === 'delivered' || s === 'ready for delivery' || s === 'out for delivery';
    });
  }, [activeOrders]);

  // Fallback kitchen staff list when backend database list is empty
  const effectiveStaffList = useMemo(() => {
    if (staffList && staffList.length > 0) return staffList;
    return [
      { id: 'st-1', name: 'Kamal Bandara', username: 'kamal_chef', role: 'kitchen staff' },
      { id: 'st-2', name: 'Amara De Silva', username: 'amara_cook', role: 'kitchen staff' },
      { id: 'st-3', name: 'Nimal Perera', username: 'nimal_prep', role: 'kitchen staff' }
    ];
  }, [staffList]);

  // Compute staff workloads and statuses for the dashboard view
  const staffWorkload = useMemo(() => {
    return effectiveStaffList.map(staff => {
      const activeCount = kitchenOrders.filter(o => o.kitchenStaff === staff.name && o.workflowState !== 'Ready for Pickup').length;
      
      
      let status = staffStatuses[staff.name || staff.username];
      if (!status) {
        if (activeCount > 0) {
          status = 'Preparing';
        } else if (staff.name === 'Nimal Perera' || staff.username === 'nimal_prep') {
          status = 'On Break';
        } else {
          status = 'Available';
        }
      }

      return {
        ...staff,
        activeCount,
        status
      };
    });
  }, [effectiveStaffList, kitchenOrders, staffStatuses]);

  // Handle staff status changes
  const handleStatusChange = (staffName, newStatus) => {
    setStaffStatuses(prev => ({
      ...prev,
      [staffName]: newStatus
    }));
    toast.info(`${staffName}'s status updated to ${newStatus}`);
  };

  // Update order status in backend database
  const updateOrderStatus = async (orderId, newStatus, staffName) => {
    try {
      if (url && adminToken) {
        const payload = { orderId };
        if (newStatus) payload.status = newStatus;
        if (staffName !== undefined) payload.kitchenStaff = staffName;

        const response = await axios.post(`${url}/api/order/status`, payload, {
          headers: {
            token: adminToken,
            Authorization: `Bearer ${adminToken}`
          }
        });
        if (response.data.success) {
          if (staffName !== undefined && !newStatus) {
            toast.success(staffName ? `Assigned to ${staffName}` : 'Order unassigned');
          } else {
            toast.success(`Status updated to ${newStatus}`);
          }
          await fetchOrders();
        } else {
          toast.error(response.data?.message || 'Failed to update order');
        }
      } else {
        // Fallback local update for demonstration
        setOrders(prev => {
          const target = prev.length === 0 ? activeOrders : prev;
          return target.map(o => {
            if (o._id === orderId) {
              const updated = { ...o };
              if (newStatus) updated.status = newStatus;
              if (staffName !== undefined) updated.kitchenStaff = staffName;
              return updated;
            }
            return o;
          });
        });
        toast.success(`Local demonstration: updated successfully`);
      }

      // Add to timeline events list
      if (newStatus) {
        const orderShortId = orderId?.substring(0, 8) || orderId;
        const eventText = newStatus === 'Preparing' 
          ? `Started preparing items for Order #${orderShortId}`
          : `Order #${orderShortId} marked as Ready for Delivery`;
        
        setTimelineEvents(prev => [
          { id: `ev-${Date.now()}`, text: eventText, time: new Date() },
          ...prev
        ]);
      }

      // Refresh drawer detail if active
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(prev => {
          const updated = { ...prev };
          if (newStatus) {
            updated.status = newStatus;
            updated.workflowState = getWorkflowState(newStatus);
          }
          if (staffName !== undefined) {
            updated.kitchenStaff = staffName;
          }
          return updated;
        });
      }

    } catch (err) {
      toast.error('Error updating order');
    }
  };

  // Search & Status filters
  const filteredQueue = useMemo(() => {
    return kitchenOrders.filter(order => {
      // 1. Search filter
      const query = searchQuery.toLowerCase().trim();
      const matchSearch = !query || 
        order._id?.toLowerCase().includes(query) ||
        `${order.address?.firstName || ''} ${order.address?.lastName || ''}`.toLowerCase().includes(query);

      // 2. Status filter
      const matchStatus = statusFilter === 'All' || order.workflowState === statusFilter;

      // 3. Tab filter (kitchen staff dashboard tabs)
      let matchTab = true;
      if (isKitchenStaffUser) {
        const myName = adminUser?.name || adminUser?.username || '';
        if (kitchenStaffTab === 'My Orders') {
          matchTab = order.kitchenStaff === myName;
        } else if (kitchenStaffTab === 'Unassigned') {
          matchTab = !order.kitchenStaff || order.kitchenStaff.trim() === '';
        }
      }

      return matchSearch && matchStatus && matchTab;
    });
  }, [kitchenOrders, searchQuery, statusFilter, kitchenStaffTab, isKitchenStaffUser, adminUser]);

  // Summary Metrics calculations
  const summaryMetrics = useMemo(() => {
    const todayOrdersCount = activeOrders.length;
    const preparingCount = kitchenOrders.filter(o => o.workflowState === 'In Progress').length;
    const readyCount = kitchenOrders.filter(o => o.workflowState === 'Ready for Pickup').length;
    
    // Kitchen staff specific metrics
    const myName = adminUser?.name || adminUser?.username || '';
    const myPreparingCount = kitchenOrders.filter(o => o.workflowState === 'In Progress' && o.kitchenStaff === myName).length;
    const myReadyCount = kitchenOrders.filter(o => o.workflowState === 'Ready for Pickup' && o.kitchenStaff === myName).length;
    const unassignedCount = kitchenOrders.filter(o => !o.kitchenStaff || o.kitchenStaff.trim() === '').length;

    return {
      todayOrdersCount,
      preparingCount,
      readyCount,
      myPreparingCount,
      myReadyCount,
      unassignedCount,
      avgPrepTime: '12 mins'
    };
  }, [activeOrders, kitchenOrders, adminUser]);

  // Today's Orders (filtered by date, fallback to activeOrders if none match)
  const todayOrders = useMemo(() => {
    const todayStr = new Date().toDateString();
    const filtered = activeOrders.filter(order => {
      if (!order?.date) return false;
      return new Date(order.date).toDateString() === todayStr;
    });
    return filtered.length > 0 ? filtered : activeOrders;
  }, [activeOrders]);

  // Today's Performance Metrics
  const { completedOrdersTodayCount, totalOrdersTodayCount, completionPercentage } = useMemo(() => {
    const total = todayOrders.length;
    const completed = todayOrders.filter(o => {
      const wState = getWorkflowState(o.status);
      const statusLower = o.status?.toLowerCase().trim() || '';
      return wState === 'Ready for Pickup' || statusLower === 'delivered' || statusLower === 'out for delivery' || statusLower === 'ready for delivery';
    }).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      completedOrdersTodayCount: completed,
      totalOrdersTodayCount: total,
      completionPercentage: percentage
    };
  }, [todayOrders]);

  // Top 3 Popular Menu Items for Today
  const popularMenuItems = useMemo(() => {
    const counts = {};
    todayOrders.forEach((order) => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (item?.name) {
            counts[item.name] = (counts[item.name] || 0) + Number(item.quantity || 1);
          }
        });
      }
    });

    const sorted = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const fallbacks = [
      { name: 'Chicken Burger', count: 12 },
      { name: 'Fried Rice', count: 9 },
      { name: 'Cheese Pizza', count: 7 }
    ];

    const result = [];
    for (let i = 0; i < 3; i++) {
      if (sorted[i]) {
        result.push(sorted[i]);
      } else {
        const nextFallback = fallbacks.find(fb => !result.some(r => r.name === fb.name));
        if (nextFallback) {
          result.push(nextFallback);
        } else {
          result.push({ name: `Special Item ${i + 1}`, count: 5 - i });
        }
      }
    }
    return result;
  }, [todayOrders]);

  // Kitchen Alerts calculations
  const delayedOrders = useMemo(() => {
    return kitchenOrders.filter(order => {
      if (!order.date) return false;
      const elapsed = (Date.now() - new Date(order.date).getTime()) / 60000;
      return elapsed > 10 && order.workflowState !== 'Ready for Pickup';
    });
  }, [kitchenOrders]);

  const stockAlerts = useMemo(() => {
    const lowStockThreshold = 5;
    const materialCategories = [
      'bakery and grains',
      'Beverages',
      'Dairy and egg',
      'Meat & Seafood',
      'Vegetables',
      'Spices',
      'Oils & Dressings',
      'Baking & Sweeteners'
    ].map(c => c.toLowerCase());

    const realLowStock = foods
      .filter(item => {
        const cat = item.category?.toLowerCase() || '';
        return materialCategories.includes(cat);
      })
      .map(item => {
        const stockCandidate = item?.stock ?? item?.quantity ?? item?.availableQty;
        let stock = null;
        if (stockCandidate !== undefined && stockCandidate !== null) {
          const parsed = Number(stockCandidate);
          if (Number.isFinite(parsed)) stock = parsed;
        }
        return { name: item.name, stock };
      })
      .filter(item => item.stock !== null && item.stock <= lowStockThreshold);
      
    if (realLowStock.length > 0) {
      return realLowStock.map(item => ({
        id: `stock-${item.name}`,
        type: 'stock',
        title: 'Low Stock Alert',
        message: `${item.name} is running low on stock (${item.stock} left)`,
        priority: item.stock === 0 ? 'High' : 'Medium',
        time: new Date()
      }));
    }
    
    return [
      { id: 'stock-cheese', type: 'stock', title: 'Low Stock Alert', message: 'Supreme Cheddar Cheese is running low (3 kg left)', priority: 'High', time: new Date() },
      { id: 'stock-lettuce', type: 'stock', title: 'Low Stock Alert', message: 'Fresh Lettuce Heads is running low (4 pcs left)', priority: 'Medium', time: new Date() }
    ];
  }, [foods]);

  const highPriorityAlerts = useMemo(() => {
    return kitchenOrders
      .filter(order => order.priority === 'High' && order.workflowState !== 'Ready for Pickup')
      .map(order => ({
        id: `priority-${order._id}`,
        type: 'priority',
        title: 'High Priority Order',
        message: `Order #${order._id?.substring(0, 8)} needs immediate attention (LKR ${order.amount.toLocaleString()})`,
        priority: 'High',
        time: new Date(order.date)
      }));
  }, [kitchenOrders]);

  const delayAlertsList = useMemo(() => {
    return delayedOrders.map(order => {
      const elapsed = Math.round((Date.now() - new Date(order.date).getTime()) / 60000);
      return {
        id: `delay-${order._id}`,
        type: 'delay',
        title: 'Delay Warning',
        message: `Order #${order._id?.substring(0, 8)} has been waiting for ${elapsed} mins`,
        priority: elapsed > 15 ? 'High' : 'Medium',
        time: new Date(order.date)
      };
    });
  }, [delayedOrders]);

  const allAlerts = useMemo(() => {
    const list = [...delayAlertsList, ...stockAlerts, ...highPriorityAlerts];
    return list.sort((a, b) => {
      if (a.priority === 'High' && b.priority !== 'High') return -1;
      if (a.priority !== 'High' && b.priority === 'High') return 1;
      return 0;
    });
  }, [delayAlertsList, stockAlerts, highPriorityAlerts]);

  const activeAlerts = useMemo(() => {
    return allAlerts.filter(a => !acknowledgedAlerts[a.id]);
  }, [allAlerts, acknowledgedAlerts]);

  const acknowledgeAlert = (id) => {
    setAcknowledgedAlerts(prev => ({ ...prev, [id]: true }));
    toast.success('Alert acknowledged');
  };

  return (
    <div className="p-6 md:p-8 w-full text-zinc-900 dark:text-zinc-100 font-sans">
      {/* ---------------- HEADER SECTION ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-tr from-red-500 to-orange-400 rounded-2xl text-white shadow-lg shadow-red-500/25">
            <FiCoffee className="w-8 h-8 animate-bounce" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              {isKitchenStaffUser ? "Welcome, Kitchen Staff!" : "Kitchen Operations Portal"}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-semibold">
              Role: <span className="text-red-600 dark:text-red-500 font-bold capitalize">{adminUser?.role || 'Kitchen Staff'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ---------------- TABS RENDER CONDITIONAL ---------------- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* TOP SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(isKitchenStaffUser ? [
              { title: "Pending Orders", value: summaryMetrics.unassignedCount, icon: FiList, color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
              { title: "Orders in Progress", value: summaryMetrics.myPreparingCount, icon: FiClock, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
              { title: "Ready for Pickup", value: summaryMetrics.myReadyCount, icon: FiCheckCircle, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
              { title: "Average Prep Time", value: summaryMetrics.avgPrepTime, icon: FiClock, color: 'bg-red-500/10 text-red-500 border-red-500/20' }
            ] : [
              { title: "Total Pending", value: summaryMetrics.todayOrdersCount, icon: FiList, color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
              { title: "Orders in Progress", value: summaryMetrics.preparingCount, icon: FiClock, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
              { title: "Ready for Pickup", value: summaryMetrics.readyCount, icon: FiCheckCircle, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
              { title: "Average Prep Time", value: summaryMetrics.avgPrepTime, icon: FiClock, color: 'bg-red-500/10 text-red-500 border-red-500/20' }
            ]).map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs relative overflow-hidden group transition duration-350"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{card.title}</span>
                      <h3 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mt-1.5">{card.value}</h3>
                    </div>
                    <div className={`p-3 rounded-2xl border ${card.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* DASHBOARD SPLIT DETAILS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Performance & Popular Items */}
            <div className="space-y-8">
              {/* Today's Performance Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">Today's Performance</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Kitchen efficiency overview</p>
                  </div>
                  <div className="p-3 bg-orange-500/10 text-orange-500 rounded-2xl border border-orange-500/10">
                    <FiTrendingUp className="w-5 h-5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 text-center">
                    <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase block mb-1">Completed Orders</span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{completedOrdersTodayCount}</span>
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 text-center">
                    <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase block mb-1">Total Orders</span>
                    <span className="text-2xl font-black text-zinc-900 dark:text-white">{totalOrdersTodayCount}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-zinc-500 dark:text-zinc-400">Completion Rate</span>
                    <span className="text-zinc-900 dark:text-white">{completionPercentage}%</span>
                  </div>
                  <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500" 
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Popular Menu Items Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">Popular Menu Items</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Most ordered items today</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/10">
                    <FiAward className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-4">
                  {popularMenuItems.map((item, idx) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    const barColors = ['bg-amber-500', 'bg-zinc-400', 'bg-orange-400'];
                    const maxCount = popularMenuItems[0]?.count || 1;
                    const widthPercent = Math.max(10, Math.round((item.count / maxCount) * 100));

                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <div className="flex items-center gap-2">
                            <span className="text-lg shrink-0">{medals[idx]}</span>
                            <span className="text-zinc-800 dark:text-zinc-200 font-bold">{item.name}</span>
                          </div>
                          <span className="text-zinc-500 dark:text-zinc-400 font-bold">{item.count} Orders</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${barColors[idx]} transition-all duration-500`}
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Staff Status & Alerts / Timeline */}
            <div className="space-y-8">
              {/* Kitchen Staff Status Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">Kitchen Staff Status</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Current shifts and workloads</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl border border-blue-500/10">
                    <FiBriefcase className="w-5 h-5" />
                  </div>
                </div>

                {staffWorkload.length === 0 ? (
                  <p className="text-sm text-zinc-500 italic">No active kitchen staff profiles registered.</p>
                ) : (
                  <div className="space-y-3">
                    {staffWorkload.map((staff) => {
                      const getStatusBadge = (status) => {
                        const s = status?.toLowerCase() || '';
                        if (s === 'preparing') {
                          return 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400';
                        }
                        if (s === 'available') {
                          return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400';
                        }
                        return 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400';
                      };

                      return (
                        <div key={staff._id || staff.id} className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 font-black text-sm flex items-center justify-center">
                              {staff.name?.charAt(0) || 'C'}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight">{staff.name}</h4>
                              <p className="text-xs text-zinc-500 mt-0.5">@{staff.username || 'chef'} • {staff.activeCount} active</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={staff.status}
                              onChange={(e) => handleStatusChange(staff.name || staff.username, e.target.value)}
                              className={`text-xs font-bold rounded-lg border-0 px-2.5 py-1.5 focus:ring-1 focus:ring-orange-500/25 focus:outline-none cursor-pointer ${getStatusBadge(staff.status)}`}
                            >
                              <option value="Available" className="bg-white text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">Available</option>
                              <option value="Preparing" className="bg-white text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">Preparing</option>
                              <option value="On Break" className="bg-white text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">On Break</option>
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>


            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="animate-fadeIn">
          {/* KITCHEN STAFF SUB-TABS */}
          {isKitchenStaffUser && (
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-8 overflow-x-auto pb-px">
              {[
                { id: 'My Orders', label: 'My Assigned Orders', count: summaryMetrics.myPreparingCount, countColor: 'bg-orange-500' },
                { id: 'Unassigned', label: 'Unassigned Queue', count: summaryMetrics.unassignedCount, countColor: 'bg-red-500' },
                { id: 'All', label: 'All Active Orders', count: summaryMetrics.preparingCount + summaryMetrics.todayOrdersCount - summaryMetrics.readyCount, countColor: 'bg-zinc-500' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setKitchenStaffTab(tab.id)}
                  className={`px-4 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap mr-6 flex items-center gap-2 ${
                    kitchenStaffTab === tab.id
                      ? 'border-orange-500 text-orange-655 dark:text-orange-400 font-black'
                      : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black text-white ${tab.countColor}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* SEARCH & FILTER PANEL */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-205 dark:border-zinc-800 rounded-2xl p-5 mb-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-450 w-4 h-4" />
              <input 
                type="text"
                placeholder="Search by Order ID or Customer Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-orange-500 dark:bg-zinc-955 font-bold"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto self-start md:self-center">
              {[
                { id: 'All', label: 'All' },
                { id: 'Pending', label: 'Pending' },
                { id: 'In Progress', label: 'In Progress' },
                { id: 'Ready for Pickup', label: 'Ready for Pickup' }
              ].map((filt) => (
                <button
                  key={filt.id}
                  onClick={() => setStatusFilter(filt.id)}
                  className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    statusFilter === filt.id
                      ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                      : 'bg-zinc-50 dark:bg-zinc-850 hover:bg-zinc-100 text-zinc-650 dark:text-zinc-300 dark:hover:bg-zinc-800'
                  }`}
                >
                  {filt.label}
                </button>
              ))}
            </div>
          </div>

          {/* MAIN OPERATIONAL WORKSPACE (Queue + Details) */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Queue Panel */}
            <div className="xl:col-span-2 space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-850">
                <h3 className="text-lg font-black tracking-tight text-zinc-955 dark:text-white">Preparation Queue</h3>
                <span className="text-xs font-bold text-zinc-500">{filteredQueue.length} Active Orders</span>
              </div>

              {loading ? (
                <div className="space-y-4 animate-pulse">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-40 bg-zinc-200 dark:bg-zinc-850 rounded-3xl" />
                  ))}
                </div>
              ) : filteredQueue.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center shadow-xs">
                  <FiCoffee className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                  <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-200">No Orders in Queue</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-450 mt-1 max-w-sm mx-auto">There are no active orders matching your filter or waiting for kitchen preparation.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {filteredQueue.map((order) => {
                      const getBorderClass = (priority) => {
                        if (priority === 'High') return 'border-l-4 border-l-red-500';
                        if (priority === 'Medium') return 'border-l-4 border-l-orange-500';
                        return 'border-l-4 border-l-zinc-300 dark:border-l-zinc-700';
                      };

                      return (
                        <motion.div
                          key={order._id}
                          layout
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`bg-white dark:bg-zinc-900 border transition-all rounded-3xl p-5 shadow-xs hover:shadow-md cursor-pointer relative overflow-hidden ${getBorderClass(order.priority)} ${
                            selectedOrder?._id === order._id 
                              ? 'border-orange-500 dark:border-orange-500 ring-2 ring-orange-500/10'
                              : 'border-zinc-200 dark:border-zinc-800'
                          }`}
                          onClick={() => setSelectedOrder(order)}
                        >
                          {/* Order Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                            {/* Left Meta: ID, Status, Priority */}
                            <div className="flex flex-wrap items-center gap-2">
                              {/* 1. Order ID Monospace Pill */}
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-black text-orange-600 font-mono bg-orange-50 dark:bg-orange-950/20">
                                #{order._id?.substring(0, 8).toUpperCase()}
                              </span>

                              {/* 2. Workflow State Status Pill */}
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                order.workflowState === 'Ready for Pickup'
                                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                                  : order.workflowState === 'In Progress'
                                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                                  : 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400'
                              }`}>
                                {order.workflowState}
                              </span>

                              {/* 3. Priority Level Pill */}
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                order.priority === 'High'
                                  ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                                  : order.priority === 'Medium'
                                  ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400'
                                  : 'bg-zinc-50 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                              }`}>
                                {order.priority} Priority
                              </span>
                            </div>

                            {/* Right Meta: Chef Assignment & Timestamp */}
                            <div className="flex flex-wrap items-center gap-3">
                              {/* 4. Chef Assignment Dropdown */}
                              {isKitchenStaffUser ? (
                                order.kitchenStaff ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 flex items-center gap-1">
                                    <FiUser className="w-2.5 h-2.5" />
                                    <span>{order.kitchenStaff === (adminUser?.name || adminUser?.username) ? 'My Order' : order.kitchenStaff}</span>
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 italic">
                                    Unassigned
                                  </span>
                                )
                              ) : (
                                <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                                  <select
                                    value={order.kitchenStaff || ''}
                                    onChange={(e) => updateOrderStatus(order._id, null, e.target.value)}
                                    className="text-xs font-bold uppercase bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-3 py-0.5 focus:outline-none focus:border-orange-500 text-zinc-700 dark:text-zinc-300 cursor-pointer h-6 leading-none"
                                  >
                                    <option value="">-- Assign Chef --</option>
                                    {staffList.map(s => (
                                      <option key={s.id} value={s.name}>{s.name}</option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              <span className="text-xs text-zinc-500 font-bold">
                                {new Date(order.date).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          {/* Order Summary details */}
                          <div className="mb-4">
                            <h4 className="text-sm font-black text-zinc-900 dark:text-white leading-tight">
                              {order.address?.firstName} {order.address?.lastName}
                            </h4>
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                              {order.items?.map((it, idx) => (
                                <span key={idx} className="inline-block px-2.5 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                  {it.name} <strong className="text-orange-500 ml-1">x{it.quantity}</strong>
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Footer instructions and action triggers */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                              <div className="flex items-center gap-1.5 text-zinc-500">
                                <FiClock className="w-4 h-4 text-zinc-400" />
                                <span>Est. Prep: {order.estPrepTime}</span>
                              </div>
                              {order.instructions && (
                                <div className="flex items-center gap-1.5 text-red-500">
                                  <FiAlertCircle className="w-4 h-4" />
                                  <span className="max-w-[220px] truncate">Note: {order.instructions}</span>
                                </div>
                              )}
                            </div>

                            {/* Workflow buttons */}
                            <div className="flex items-center gap-2 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                              {isKitchenStaffUser ? (
                                <>
                                  {/* Claim order */}
                                  {(!order.kitchenStaff || order.kitchenStaff.trim() === '') && (
                                    <button
                                      onClick={() => updateOrderStatus(order._id, 'Preparing', adminUser.name || adminUser.username)}
                                      className="px-3.5 py-2 bg-indigo-650 hover:bg-indigo-755 text-white rounded-xl text-xs font-extrabold shadow-sm active:scale-95 transition cursor-pointer flex items-center gap-1"
                                    >
                                      <FiUser className="w-3.5 h-3.5" /> Claim &amp; Start
                                    </button>
                                  )}

                                  {/* Claimed by ME */}
                                  {(order.kitchenStaff === (adminUser.name || adminUser.username)) && (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => updateOrderStatus(order._id, null, '')}
                                        className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-750 dark:text-zinc-300 rounded-xl text-xs font-extrabold active:scale-95 transition cursor-pointer"
                                        title="Release order"
                                      >
                                        Release
                                      </button>

                                      {order.workflowState === 'Pending' && (
                                        <button
                                          onClick={() => updateOrderStatus(order._id, 'Preparing')}
                                          className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-extrabold shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                                        >
                                          <FiPlay className="w-3.5 h-3.5" /> Start Preparing
                                        </button>
                                      )}
                                      {order.workflowState === 'In Progress' && (
                                        <button
                                          onClick={() => updateOrderStatus(order._id, 'Ready for Delivery')}
                                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                                        >
                                          <FiCheck className="w-3.5 h-3.5" /> Mark Ready
                                        </button>
                                      )}
                                      {order.workflowState === 'Ready for Pickup' && (
                                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-extrabold bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl">
                                          <FiCheckCircle className="w-3.5 h-3.5" /> Ready
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Claimed by someone else */}
                                  {order.kitchenStaff && order.kitchenStaff !== (adminUser.name || adminUser.username) && (
                                    <span className="text-xs text-zinc-400 dark:text-zinc-550 font-bold italic">
                                      Claimed by {order.kitchenStaff}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  {order.workflowState === 'Pending' && (
                                    <button
                                      onClick={() => updateOrderStatus(order._id, 'Preparing')}
                                      className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-extrabold shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                                    >
                                      <FiPlay className="w-3.5 h-3.5" /> Start Preparing
                                    </button>
                                  )}
                                  {order.workflowState === 'In Progress' && (
                                    <button
                                      onClick={() => updateOrderStatus(order._id, 'Ready for Delivery')}
                                      className="px-3.5 py-2 bg-emerald-650 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                                    >
                                      <FiCheck className="w-3.5 h-3.5" /> Mark Ready
                                    </button>
                                  )}
                                  {order.workflowState === 'Ready for Pickup' && (
                                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-extrabold bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl">
                                      <FiCheckCircle className="w-3.5 h-3.5" /> Ready for Delivery
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Right Details Panel */}
            <div className="xl:col-span-1">
              {selectedOrder ? (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs min-h-[360px] relative overflow-hidden flex flex-col sticky top-24">
                  <h3 className="text-lg font-black tracking-tight text-zinc-950 dark:text-white mb-4 flex items-center gap-2">
                    <FiList className="w-5 h-5 text-orange-500" />
                    Order Details
                  </h3>

                  <div className="flex-1 flex flex-col justify-between h-full animate-fadeIn text-xs">
                    <div className="space-y-5">
                      <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800">
                        <div>
                          <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">Order Reference</span>
                          <span className="font-mono text-zinc-900 dark:text-zinc-200 font-black">#{selectedOrder._id}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          selectedOrder.workflowState === 'Ready for Pickup' 
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15'
                            : selectedOrder.workflowState === 'In Progress'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/15'
                            : 'bg-blue-50 text-blue-600 dark:bg-blue-500/15'
                        }`}>
                          {selectedOrder.workflowState}
                        </span>
                      </div>

                      {/* Customer details */}
                      <div className="space-y-3 p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                        <div className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300">
                          <FiUser className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                          <span className="font-bold">{selectedOrder.address?.firstName} {selectedOrder.address?.lastName}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300">
                          <FiPhone className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                          <span className="font-semibold">{selectedOrder.address?.phone || 'No phone recorded'}</span>
                        </div>
                        <div className="flex items-start gap-2.5 text-zinc-700 dark:text-zinc-300">
                          <FiMapPin className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                          <span className="font-semibold leading-relaxed">
                            {selectedOrder.address?.street}, {selectedOrder.address?.city}
                          </span>
                        </div>
                      </div>

                      {/* Chef Assignment block */}
                      <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl">
                        <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider block mb-2">Chef Assignment</span>
                        {isKitchenStaffUser ? (
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                              {selectedOrder.kitchenStaff 
                                ? (selectedOrder.kitchenStaff === (adminUser?.name || adminUser?.username) ? 'Assigned to You' : `Chef: ${selectedOrder.kitchenStaff}`) 
                                : 'No Chef assigned yet'}
                            </span>
                            {!selectedOrder.kitchenStaff || selectedOrder.kitchenStaff.trim() === '' ? (
                              <button
                                onClick={() => updateOrderStatus(selectedOrder._id, 'Preparing', adminUser.name || adminUser.username)}
                                className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-755 text-white font-extrabold rounded-xl transition cursor-pointer"
                              >
                                Claim
                              </button>
                            ) : selectedOrder.kitchenStaff === (adminUser?.name || adminUser?.username) ? (
                              <button
                                onClick={() => updateOrderStatus(selectedOrder._id, null, '')}
                                className="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-250 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-xl transition cursor-pointer"
                              >
                                Release
                              </button>
                            ) : null}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <FiUser className="w-4 h-4 text-zinc-400" />
                            <select
                              value={selectedOrder.kitchenStaff || ''}
                              onChange={(e) => updateOrderStatus(selectedOrder._id, null, e.target.value)}
                              className="flex-1 text-xs font-semibold bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-zinc-200 cursor-pointer"
                            >
                              <option value="">-- Unassigned --</option>
                              {staffList.map(s => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Items List */}
                      <div>
                        <h4 className="font-bold text-zinc-500 uppercase text-xs tracking-wider mb-2">Ordered Items</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                          {selectedOrder.items?.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-xl">
                              <span className="font-bold text-zinc-800 dark:text-zinc-200">{it.name} <strong className="text-orange-500 font-extrabold ml-1">x{it.quantity}</strong></span>
                              <span className="font-extrabold text-zinc-900 dark:text-white">{formatMoney(it.price * it.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Special instructions */}
                      {selectedOrder.instructions && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/10 border border-red-100 dark:border-red-950/20 rounded-xl text-red-600 dark:text-red-400 flex items-start gap-2">
                          <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block uppercase text-xs tracking-wider mb-0.5">Special Instructions</span>
                            <p className="font-semibold leading-relaxed">{selectedOrder.instructions}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer buttons details */}
                    <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                      {isKitchenStaffUser && selectedOrder.kitchenStaff !== (adminUser?.name || adminUser?.username) ? (
                        <div className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-850 text-zinc-500 rounded-xl font-bold flex items-center justify-center gap-1.5 border border-zinc-200 dark:border-zinc-800 italic">
                          <FiUser className="w-4 h-4" />
                          <span>Assign to yourself to update progress</span>
                        </div>
                      ) : (
                        <>
                           {selectedOrder.workflowState === 'Pending' && (
                             <button
                               onClick={() => updateOrderStatus(selectedOrder._id, 'Preparing')}
                               className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-xs font-bold text-white shadow-xs hover:bg-orange-600 transition active:scale-95 cursor-pointer"
                             >
                               <FiPlay className="w-4 h-4" />
                               <span>Start Preparing</span>
                             </button>
                           )}
                           {selectedOrder.workflowState === 'In Progress' && (
                             <button
                               onClick={() => updateOrderStatus(selectedOrder._id, 'Ready for Delivery')}
                               className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-600 transition active:scale-95 cursor-pointer"
                             >
                               <FiCheck className="w-4 h-4" />
                               <span>Mark as Ready for Delivery</span>
                             </button>
                           )}
                           {selectedOrder.workflowState === 'Ready for Pickup' && (
                             <div className="p-3 bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-150 dark:border-emerald-900/30 rounded-xl text-center">
                               <span className="text-xs font-bold text-emerald-805 dark:text-emerald-400">Order is Prepared & Ready!</span>
                             </div>
                           )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-4">
                  <h4 className="text-base font-black text-zinc-955 dark:text-white">Active Queue Stats</h4>
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-zinc-500">Preparing Orders</span>
                      <span className="text-zinc-950 dark:text-white">{summaryMetrics.preparingCount}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-zinc-500">Unassigned Orders</span>
                      <span className="text-zinc-950 dark:text-white">{summaryMetrics.unassignedCount}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-zinc-500">Total Queue Load</span>
                      <span className="text-zinc-950 dark:text-white">{filteredQueue.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs animate-fadeIn">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-black tracking-tight text-zinc-955 dark:text-white">Order History</h3>
              <p className="text-xs text-zinc-405 dark:text-zinc-500 mt-0.5 font-medium">List of completed and dispatched preparation logs</p>
            </div>
            
            {/* Search History */}
            <div className="relative max-w-xs w-full">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-405 w-3.5 h-3.5" />
              <input 
                type="text"
                placeholder="Search history by customer name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-orange-500 dark:bg-zinc-950 font-bold"
              />
            </div>
          </div>

          {completedOrders.length === 0 ? (
            <div className="text-center py-12">
              <FiCheckCircle className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-200">No History Records</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-450 mt-1">There are no completed kitchen logs matching your search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto font-sans rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <th className="p-4 rounded-l-2xl">Order ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Prepared By</th>
                    <th className="p-4">Dishes Summary</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4 rounded-r-2xl">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
                  {completedOrders
                    .filter(order => {
                      const query = searchQuery.toLowerCase().trim();
                      return !query || 
                        order._id?.toLowerCase().includes(query) ||
                        `${order.address?.firstName || ''} ${order.address?.lastName || ''}`.toLowerCase().includes(query);
                    })
                    .map((order) => (
                      <tr key={order._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/50 transition">
                        <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">#{order._id?.substring(0, 8).toUpperCase()}</td>
                        <td className="p-4">
                          <div className="font-bold text-zinc-900 dark:text-white">
                            {order.address?.firstName} {order.address?.lastName}
                          </div>
                          <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-0.5">{order.address?.city}</div>
                        </td>
                        <td className="p-4 font-bold text-zinc-700 dark:text-zinc-300">{order.kitchenStaff || 'Unassigned'}</td>
                        <td className="p-4 font-semibold text-zinc-600 dark:text-zinc-400">
                          {order.items?.map(it => `${it.name} (x${it.quantity})`).join(', ')}
                        </td>
                        <td className="p-4 font-black text-zinc-955 dark:text-white">{formatMoney(order.amount)}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
                            order.status?.toLowerCase() === 'delivered'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                              : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KitchenMonitoring;
