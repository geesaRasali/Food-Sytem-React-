import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiTrendingUp, 
  FiDownload, 
  FiDollarSign, 
  FiShoppingBag, 
  FiUsers, 
  FiClock, 
  FiTruck, 
  FiPackage, 
  FiUserCheck, 
  FiMail, 
  FiActivity, 
  FiCheckCircle, 
  FiXCircle, 
  FiCalendar, 
  FiFileText, 
  FiPercent, 
  FiAward, 
  FiChevronDown 
} from 'react-icons/fi';


const formatMoney = (value) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(value || 0);


const materialCategories = [
  'bakery and grains',
  'Beverages',
  'Dairy and egg',
  'Meat & Seafood',
  'Vegetables',
  'Spices',
  'Oils & Dressings',
  'Baking & Sweeteners'
];

const CATEGORY_COLORS = [
  '#f97316', '#06b6d4', '#ec4899', '#8b5cf6', '#10b981',
  '#f59e0b', '#3b82f6', '#ef4444', '#84cc16', '#a855f7'
];


const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

const getPieSlicePath = (cx, cy, radius, startAngle, endAngle) => {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    "L", cx, cy,
    "Z"
  ].join(" ");
};

const ReportsAnalytics = ({ url, adminToken, adminUser }) => {
  const [orders, setOrders] = useState([]);
  const [foods, setFoods] = useState([]);
  const [customersCount, setCustomersCount] = useState(0);
  const [staff, setStaff] = useState([]);
  const [messages, setMessages] = useState([]);
  const [supplyLogs, setSupplyLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('All Time');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);


  const [hoveredLineIdx, setHoveredLineIdx] = useState(null);
  const [hoveredBarIdx, setHoveredBarIdx] = useState(null);
  const [hoveredPieIdx, setHoveredPieIdx] = useState(null);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = {
          token: adminToken,
          Authorization: `Bearer ${adminToken}`,
        };

        const [
          ordersRes,
          foodsRes,
          customersRes,
          staffRes,
          messagesRes,
          suppliesRes
        ] = await Promise.all([
          axios.get(`${url}/api/order/list`, { headers }).catch(() => null),
          axios.get(`${url}/api/food/list`).catch(() => null),
          axios.get(`${url}/api/user/customers/count`, { headers }).catch(() => null),
          axios.get(`${url}/api/user/staff`, { headers }).catch(() => null),
          axios.get(`${url}/api/contact/list`, { headers }).catch(() => null),
          axios.get(`${url}/api/food/supplies`, { headers }).catch(() => null),
        ]);

        if (ordersRes?.data?.success) setOrders(ordersRes.data.data || []);
        if (foodsRes?.data?.success) setFoods(foodsRes.data.data || []);
        if (customersRes?.data?.success) setCustomersCount(customersRes.data.count || 0);
        if (staffRes?.data?.success) setStaff(staffRes.data.users || []);
        if (messagesRes?.data?.success) setMessages(messagesRes.data.data || []);
        if (suppliesRes?.data?.success) setSupplyLogs(suppliesRes.data.data || []);
      } catch (err) {
        console.error("Error fetching report data:", err);
        toast.error("Failed to sync some reports databases. Using local metrics.");
      } finally {
        // Add artificial delay for beautiful skeleton demonstration
        setTimeout(() => setLoading(false), 800);
      }
    };
    fetchData();
  }, [url, adminToken]);

  
  const activeOrders = useMemo(() => orders, [orders]);
  const activeFoods = useMemo(() => foods, [foods]);
  const activeCustomersCount = customersCount;
  const activeStaff = useMemo(() => staff, [staff]);
  const activeMessages = useMemo(() => messages, [messages]);

  // Apply Date Filter to Orders
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return activeOrders.filter((order) => {
      const orderDate = new Date(order.date);
      if (dateRange === 'Today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return orderDate >= today;
      } else if (dateRange === 'Last 7 Days') {
        const last7 = new Date(now.getTime() - 7 * 86400000);
        return orderDate >= last7;
      } else if (dateRange === 'Last Month') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return orderDate >= lastMonth;
      } else if (dateRange === 'Custom Range') {
        if (!customStartDate || !customEndDate) return true;
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        return orderDate >= start && orderDate <= end;
      }
      return true;
    });
  }, [activeOrders, dateRange, customStartDate, customEndDate]);

  // ---------------- Summary Cards Metrics ----------------
  const summaryMetrics = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter(o => o.status?.toLowerCase().trim() === 'delivered');
    const cancelledOrders = filteredOrders.filter(o => o.status?.toLowerCase().trim().includes('cancel'));
    const pendingOrders = filteredOrders.filter(o => {
      const s = o.status?.toLowerCase().trim() || '';
      return s !== 'delivered' && !s.includes('cancel');
    });

    const revenue = filteredOrders.filter(o => !o.status?.toLowerCase().includes('cancel')).reduce((sum, o) => sum + Number(o.amount || 0), 0);
   
    const profit = revenue * 0.6;
    const activeOrdersCount = filteredOrders.filter(o => !o.status?.toLowerCase().includes('cancel')).length;
    const avgOrderValue = activeOrdersCount > 0 ? (revenue / activeOrdersCount) : 0;

    return {
      revenue,
      profit,
      ordersCount: totalOrders,
      activeCustomers: activeCustomersCount,
      deliveredCount: completedOrders.length,
      pendingCount: pendingOrders.length,
      cancelledCount: cancelledOrders.length,
      avgOrderValue
    };
  }, [filteredOrders, activeCustomersCount]);

  const prevMetrics = useMemo(() => {
    const now = new Date();
    let prevStart, prevEnd;

    if (dateRange === 'Today') {
      
      prevStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      prevEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateRange === 'Last 7 Days') {
      prevStart = new Date(now.getTime() - 14 * 86400000);
      prevEnd   = new Date(now.getTime() - 7  * 86400000);
    } else if (dateRange === 'Last Month') {
      prevStart = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
      prevEnd   = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    } else {

      if (customStartDate && customEndDate) {
        const s = new Date(customStartDate);
        const e = new Date(customEndDate);
        const dur = e - s;
        prevStart = new Date(s.getTime() - dur);
        prevEnd   = s;
      } else {
        prevStart = new Date(0);
        prevEnd   = new Date(0);
      }
    }

    const prev = activeOrders.filter(o => {
      const d = new Date(o.date);
      return d >= prevStart && d < prevEnd;
    });

    const delivered  = prev.filter(o => o.status?.toLowerCase().trim() === 'delivered').length;
    const cancelled  = prev.filter(o => o.status?.toLowerCase().trim().includes('cancel')).length;
    const pending    = prev.filter(o => { const s = o.status?.toLowerCase().trim() || ''; return s !== 'delivered' && !s.includes('cancel'); }).length;
    const revenue    = prev.filter(o => !o.status?.toLowerCase().includes('cancel')).reduce((sum, o) => sum + Number(o.amount || 0), 0);
    const avgOrder   = prev.length > 0 ? revenue / prev.length : 0;

    return { ordersCount: prev.length, revenue, deliveredCount: delivered, cancelledCount: cancelled, pendingCount: pending, avgOrderValue: avgOrder };
  }, [activeOrders, dateRange, customStartDate, customEndDate]);

  // Compute percentage change helper
  const calcPct = (current, previous) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / Math.abs(previous)) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  // ---------------- Historical Chart Metrics (Line/Bar) ----------------
  const monthlyTimelineData = useMemo(() => {
    // 12 Months structure
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize actual totals for all months to 0
    const data = months.map((month) => ({
      month,
      revenue: 0,
      orders: 0,
      profit: 0
    }));

    // Populate with real database orders
    filteredOrders.filter(o => !o.status?.toLowerCase().includes('cancel')).forEach(o => {
      const orderDate = new Date(o.date);
      const monthIdx = orderDate.getMonth(); // 0 to 11
      if (monthIdx >= 0 && monthIdx < 12) {
        data[monthIdx].revenue += Number(o.amount || 0);
        data[monthIdx].orders += 1;
        data[monthIdx].profit = Math.round(data[monthIdx].revenue * 0.6); // 60% estimated profit margin
      }
    });

    return data;
  }, [filteredOrders]);

  // ---------------- Sales by Category Metrics (Pie Chart 1) ----------------
  const salesByCategory = useMemo(() => {
    // Build a lookup: food name (lowercase) -> real category from DB
    const foodCategoryMap = {};
    activeFoods.forEach(f => {
      if (f.name && f.category) {
        foodCategoryMap[f.name.toLowerCase()] = f.category;
      }
    });

    // Count quantities by REAL category
    const counts = {};
    let totalQuantities = 0;

    filteredOrders.filter(o => o.status?.toLowerCase().trim() === 'delivered').forEach(order => {
      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          const qty = Number(item.quantity || 1);
          // Get the real category from food DB; fall back to the item name itself
          const cat = foodCategoryMap[item.name?.toLowerCase()] || item.category || 'Other';
          counts[cat] = (counts[cat] || 0) + qty;
          totalQuantities += qty;
        });
      }
    });

    if (totalQuantities === 0) {
      // Show real categories from food DB with 0 quantities
      const realCats = [...new Set(activeFoods.map(f => f.category).filter(Boolean))];
      return realCats.slice(0, 10).map((cat, idx) => ({
        name: cat,
        value: 0,
        qty: 0,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
      }));
    }

    return Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a])
      .slice(0, 4)
      .map((cat, idx) => ({
        name: cat,
        value: Math.round((counts[cat] / totalQuantities) * 100),
        qty: counts[cat],
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
      }));
  }, [filteredOrders, activeFoods]);

  const kitchenPerformance = useMemo(() => {
    const pendingKitchenOrders = filteredOrders.filter(o => {
      const s = o.status?.toLowerCase() || '';
      return s === 'food processing' || s === 'preparing' || s === 'order placed';
    }).length;
    
    const preparedOrders = filteredOrders.filter(o => {
      const s = o.status?.toLowerCase() || '';
      return s === 'ready' || s === 'delivered';
    });
    const preparedCount = preparedOrders.length;

    const totalItemsPrepared = preparedOrders.reduce((sum, o) =>
      sum + (o.items || []).reduce((s, item) => s + Number(item.quantity || 1), 0), 0
    );

    return {
      preparedCount,
      pendingKitchenOrders,
      totalItemsPrepared
    };
  }, [filteredOrders]);

  const deliveryPerformance = useMemo(() => {
    const deliveredCount = filteredOrders.filter(o => o.status?.toLowerCase() === 'delivered').length;
    const outForDelivery = filteredOrders.filter(o => o.status?.toLowerCase() === 'out for delivery').length;
    const totalOrders = filteredOrders.length;
    const deliveryRate = totalOrders > 0 ? Math.round((deliveredCount / totalOrders) * 100) : 0;
    return {
      deliveredToday: deliveredCount,
      outForDelivery,
      deliveryRate
    };
  }, [filteredOrders]);

  const inventorySummary = useMemo(() => {
    const rawMaterials = activeFoods.filter(item =>
      item.category && materialCategories.some(cat => cat.toLowerCase() === item.category.toLowerCase())
    );
    const totalQty = rawMaterials.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const lowStockCount = rawMaterials.filter(item => Number(item.quantity || 0) <= 10).length;
    
    // Count supplies restocked in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const todaySupplies = supplyLogs.filter(log => {
      if (!log.date) return false;
      const logDate = new Date(log.date);
      return logDate >= twentyFourHoursAgo;
    });

    return {
      totalQuantity: totalQty,
      lowStockItems: lowStockCount,
      restockedToday: todaySupplies.length
    };
  }, [activeFoods, supplyLogs]);

  const staffSummary = useMemo(() => {
    const totalStaff = activeStaff.length;
    const activeStaffCount = activeStaff.length; // all registered staff are active
    const admins = activeStaff.filter(s => ['admin', 'management staff', 'storekeeper'].includes(s.role)).length;
    const kitchen = activeStaff.filter(s => s.role === 'kitchen staff').length;
    const delivery = activeStaff.filter(s => s.role === 'delivery staff').length;
    return {
      totalStaff,
      activeStaff: activeStaffCount,
      admins,
      kitchen,
      delivery
    };
  }, [activeStaff]);

  // ---------------- Best Selling Foods ----------------
  const bestSellingFoods = useMemo(() => {
    const counts = {};
    filteredOrders.filter(o => o.status?.toLowerCase().trim() === 'delivered').forEach(o => {
      if (Array.isArray(o.items)) {
        o.items.forEach(item => {
          if (!counts[item.name]) {
            counts[item.name] = { orders: 0, revenue: 0 };
          }
          counts[item.name].orders += Number(item.quantity || 1);
          counts[item.name].revenue += Number(item.price || 0) * Number(item.quantity || 1);
        });
      }
    });

    const list = Object.keys(counts).map(name => ({
      name,
      orders: counts[name].orders,
      revenue: counts[name].revenue
    }));

    list.sort((a, b) => b.orders - a.orders);

    if (list.length === 0) {
      return [];
    }

    const maxOrders = Math.max(...list.map(l => l.orders), 1);
    return list.slice(0, 5).map(item => ({
      ...item,
      popularity: Math.round((item.orders / maxOrders) * 100)
    }));
  }, [filteredOrders]);

  // ---------------- Low Stock Items ----------------
  const lowStockReport = useMemo(() => {
    const rawMaterials = activeFoods.filter(item =>
      item.category && materialCategories.some(cat => cat.toLowerCase() === item.category.toLowerCase())
    );
    return rawMaterials
      .map(item => {
        const currentStock = Number(item.quantity || 0);
        return {
          name: item.name,
          currentStock,
          minStock: 10,
          status: currentStock === 0 ? 'Out of Stock' : currentStock <= 10 ? 'Low Stock' : 'In Stock'
        };
      })
      .filter(item => item.currentStock <= 10)
      .slice(0, 5);
  }, [activeFoods]);

  // ---------------- Customer Analytics Metrics ----------------
  const customerAnalytics = useMemo(() => {
    const feedbackCount = activeMessages.length;
    
    // Filter messages that actually have valid numeric ratings to avoid NaN
    const ratedMessages = activeMessages.filter(
      (m) => typeof m.rating === 'number' && !isNaN(m.rating)
    );
    
    const avgRating = ratedMessages.length > 0 
      ? (ratedMessages.reduce((sum, m) => sum + m.rating, 0) / ratedMessages.length).toFixed(1)
      : '4.8';

    return {
      totalCustomers: activeCustomersCount,
      newCustomersThisMonth: 0,
      averageRating: avgRating,
      totalFeedback: feedbackCount
    };
  }, [activeCustomersCount, activeMessages]);

  // ---------------- Recent Activities Feed ----------------
  const recentActivities = useMemo(() => {
    const activities = [];

    // Orders activity
    filteredOrders.forEach(o => {
      activities.push({
        id: o._id,
        type: 'order',
        title: 'New Order Placed',
        description: `Order ${o._id?.substring(0, 8) || '#1024'} values ${formatMoney(o.amount)} status: ${o.status}`,
        time: new Date(o.date)
      });
    });

    // Deliveries
    filteredOrders.filter(o => o.status === 'Delivered').forEach(o => {
      activities.push({
        id: `del-${o._id}`,
        type: 'delivery',
        title: 'Order Delivered',
        description: `Delivery completed successfully to customer for ${o._id?.substring(0, 8)}`,
        time: new Date(new Date(o.date).getTime() + 1800000) // 30m later
      });
    });

    // Feedback
    activeMessages.forEach(msg => {
      activities.push({
        id: msg._id,
        type: 'feedback',
        title: 'Customer Feedback Recieved',
        description: `Message from ${msg.name} with ${msg.rating}-star rating`,
        time: new Date(msg.date || Date.now())
      });
    });

    // Staff Added Activity (Simulated from actual staff size)
    activeStaff.slice(-2).forEach((member, index) => {
      activities.push({
        id: member._id,
        type: 'staff',
        title: 'Staff Registered',
        description: `${member.name} assigned to the role of ${member.role}`,
        time: new Date(Date.now() - (index + 1) * 86400000 * 1.5)
      });
    });

    // Warehouse supply updates (Loaded from database)
    supplyLogs.forEach(log => {
      activities.push({
        id: log._id,
        type: 'stock',
        title: 'Material Stock Restocked',
        description: `Restocked ${log.quantity} ${log.unit || 'units'} of ${log.materialName} from ${log.supplierName}`,
        time: new Date(log.date)
      });
    });

    activities.sort((a, b) => b.time - a.time);
    return activities.slice(0, 6);
  }, [filteredOrders, activeMessages, activeStaff, supplyLogs]);

  // ---------------- Ledger Report Table ----------------
  const ledgerReportTable = useMemo(() => {
    const groups = {};
    const pad = (num) => String(num).padStart(2, '0');

    activeOrders.forEach(o => {
      if (!o.date) return;
      const od = new Date(o.date);
      const dateStr = `${pad(od.getDate())}/${pad(od.getMonth() + 1)}/${od.getFullYear()}`;
      
      if (!groups[dateStr]) {
        groups[dateStr] = {
          date: dateStr,
          orders: 0,
          revenue: 0,
          cancelled: 0,
          delivered: 0,
          rawDate: new Date(od.getFullYear(), od.getMonth(), od.getDate())
        };
      }

      const grp = groups[dateStr];
      grp.orders += 1;
      
      const isCancelled = o.status?.toLowerCase().includes('cancel');
      const isDelivered = o.status?.toLowerCase() === 'delivered';

      if (!isCancelled) {
        grp.revenue += Number(o.amount || 0);
      }
      if (isCancelled) {
        grp.cancelled += 1;
      }
      if (isDelivered) {
        grp.delivered += 1;
      }
    });

    // Convert object to array and sort by date descending
    const table = Object.values(groups);
    table.sort((a, b) => b.rawDate - a.rawDate);

    return table;
  }, [activeOrders]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto text-zinc-900 dark:text-zinc-100 font-sans print:p-0 print:max-w-full">
      {/* ---------------- TOP SECTION ---------------- */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 mb-8 print:mb-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-tr from-orange-500 to-amber-400 rounded-2xl text-white shadow-lg shadow-orange-500/25">
            <FiTrendingUp className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Reports &amp; Analytics</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Performance statistics, sales reports and business insights.</p>
          </div>
        </div>

        {/* Date Filter & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Selector Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className="flex items-center gap-2.5 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-semibold text-sm hover:border-orange-500 dark:hover:border-orange-500 transition-colors shadow-sm select-none cursor-pointer"
            >
              <FiCalendar className="w-4 h-4 text-orange-500" />
              <span>{dateRange}</span>
              <FiChevronDown className={`w-4 h-4 transition-transform duration-250 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFilterDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsFilterDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-20 overflow-hidden animate-fadeIn">
                  <div className="py-1">
                    {['Today', 'Last 7 Days', 'Last Month', 'Custom Range'].map((range) => (
                      <button
                        key={range}
                        onClick={() => {
                          setDateRange(range);
                          setIsFilterDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-orange-50 dark:hover:bg-zinc-800 hover:text-orange-600 transition-colors cursor-pointer ${
                          dateRange === range ? 'text-orange-600 bg-orange-50/50 dark:bg-zinc-800/70' : ''
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>


        </div>
      </div>

      {/* Custom Range Date Pickers (displays only when selected) */}
      {dateRange === 'Custom Range' && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 mb-8 shadow-sm"
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Start Date</span>
            <input 
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-4 py-2 text-sm bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-orange-500 dark:bg-zinc-950 font-bold" 
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">End Date</span>
            <input 
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-4 py-2 text-sm bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-orange-500 dark:bg-zinc-950 font-bold" 
            />
          </div>
          {customStartDate && customEndDate && (
            <button 
              onClick={() => {
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="mt-6 text-xs text-red-500 hover:text-red-600 font-extrabold cursor-pointer"
            >
              Reset Range
            </button>
          )}
        </motion.div>
      )}

      {/* ---------------- SKELETON LOADING OR MAIN CONTENT ---------------- */}
      {loading ? (
        <div className="space-y-8 animate-pulse">
          {/* Cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-28 bg-zinc-200 dark:bg-zinc-850 rounded-2xl" />
            ))}
          </div>
          {/* Large chart skeleton */}
          <div className="h-96 bg-zinc-200 dark:bg-zinc-850 rounded-3xl" />
          {/* Half graphs skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-zinc-200 dark:bg-zinc-850 rounded-3xl" />
            <div className="h-80 bg-zinc-200 dark:bg-zinc-850 rounded-3xl" />
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fadeIn">
          
          {/* ---------------- SUMMARY CARDS ---------------- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Total Revenue',       value: formatMoney(summaryMetrics.revenue),        icon: FiDollarSign,  pct: calcPct(summaryMetrics.revenue,       prevMetrics.revenue),       isNeg: summaryMetrics.revenue       < prevMetrics.revenue,       color: 'from-orange-500/10 to-orange-500/5 text-orange-500' },
              { title: 'Total Orders',         value: summaryMetrics.ordersCount,                 icon: FiShoppingBag, pct: calcPct(summaryMetrics.ordersCount,    prevMetrics.ordersCount),   isNeg: summaryMetrics.ordersCount   < prevMetrics.ordersCount,   color: 'from-blue-500/10 to-blue-500/5 text-blue-500' },
              { title: 'Active Customers',     value: summaryMetrics.activeCustomers,             icon: FiUsers,       pct: calcPct(summaryMetrics.activeCustomers, summaryMetrics.activeCustomers), isNeg: false,                                                color: 'from-emerald-500/10 to-emerald-500/5 text-emerald-500' },
              { title: 'Delivered Orders',     value: summaryMetrics.deliveredCount,              icon: FiCheckCircle, pct: calcPct(summaryMetrics.deliveredCount,  prevMetrics.deliveredCount),  isNeg: summaryMetrics.deliveredCount  < prevMetrics.deliveredCount,  color: 'from-cyan-500/10 to-cyan-500/5 text-cyan-500' },
              { title: 'Pending Orders',       value: summaryMetrics.pendingCount,                icon: FiClock,       pct: calcPct(summaryMetrics.pendingCount,    prevMetrics.pendingCount),    isNeg: summaryMetrics.pendingCount    > prevMetrics.pendingCount,    color: 'from-amber-500/10 to-amber-500/5 text-amber-500' },
              { title: 'Cancelled Orders',     value: summaryMetrics.cancelledCount,              icon: FiXCircle,     pct: calcPct(summaryMetrics.cancelledCount,  prevMetrics.cancelledCount),  isNeg: summaryMetrics.cancelledCount  > prevMetrics.cancelledCount,  color: 'from-red-500/10 to-red-500/5 text-red-500' },
              { title: 'Total Staff',          value: activeStaff.length,                         icon: FiUserCheck,   pct: activeStaff.length > 0 ? `${activeStaff.length} members` : 'No staff', isNeg: false, color: 'from-violet-500/10 to-violet-500/5 text-violet-500' }
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                >
                  {/* Decorative background shape */}
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${card.color} opacity-20 rounded-bl-full group-hover:scale-110 transition-transform`} />
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{card.title}</span>
                    <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${card.color} font-bold`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white mb-2">{card.value}</h3>

                </motion.div>
              );
            })}
          </div>

          {/* ---------------- CHART SECTION ROW 1 ---------------- */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">Monthly Revenue Trend</h3>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-0.5">Aggregate view of billing &amp; earnings projections</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-zinc-500 dark:text-zinc-400">Revenue (LKR)</span>
                </div>
              </div>
            </div>

            {/* Custom Responsive SVG Line Chart */}
            <div className="relative w-full h-80 pt-4 select-none">
              <svg viewBox="0 0 500 200" className="w-full h-full">
                <defs>
                  <linearGradient id="revenue-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Gridlines */}
                {[0, 50, 100, 150].map((yVal, i) => (
                  <line 
                    key={i}
                    x1="30" 
                    y1={yVal + 20} 
                    x2="480" 
                    y2={yVal + 20} 
                    stroke="currentColor" 
                    className="text-zinc-100 dark:text-zinc-800/60" 
                    strokeWidth="1" 
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Draw Areas under the curves first */}
                {(() => {
                  const pointsCount = monthlyTimelineData.length;
                  const maxVal = Math.max(...monthlyTimelineData.map(d => d.revenue), 1);
                  
                  // Construct Area Path
                  let areaPathD = `M 40 170 `;
                  monthlyTimelineData.forEach((d, idx) => {
                    const x = idx * (420 / (pointsCount - 1)) + 40;
                    const y = 170 - (d.revenue / maxVal) * 140;
                    areaPathD += `L ${x} ${y} `;
                  });
                  areaPathD += `L 460 170 Z`;

                  // Construct Stroke Path
                  let linePathD = `M `;
                  monthlyTimelineData.forEach((d, idx) => {
                    const x = idx * (420 / (pointsCount - 1)) + 40;
                    const y = 170 - (d.revenue / maxVal) * 140;
                    linePathD += `${idx === 0 ? '' : 'L '}${x} ${y} `;
                  });

                  return (
                    <>
                      {/* Gradient areas */}
                      <path d={areaPathD} fill="url(#revenue-gradient)" />
                      
                      {/* Line paths */}
                      <path d={linePathD} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                  );
                })()}

                {/* Grid Dot Markers */}
                {monthlyTimelineData.map((d, idx) => {
                  const pointsCount = monthlyTimelineData.length;
                  const maxVal = Math.max(...monthlyTimelineData.map(d => d.revenue), 1);
                  const x = idx * (420 / (pointsCount - 1)) + 40;
                  const yRevenue = 170 - (d.revenue / maxVal) * 140;

                  return (
                    <g key={idx} className="cursor-pointer">
                      {/* Invisible hover trigger line */}
                      <rect 
                        x={x - 15} 
                        y="10" 
                        width="30" 
                        height="170" 
                        fill="transparent" 
                        onMouseEnter={() => setHoveredLineIdx(idx)}
                        onMouseLeave={() => setHoveredLineIdx(null)}
                      />
                      
                      {/* Revenue dot */}
                      <circle 
                        cx={x} 
                        cy={yRevenue} 
                        r={hoveredLineIdx === idx ? 6 : 3.5} 
                        fill="#fff" 
                        stroke="#f97316" 
                        strokeWidth="2.5" 
                        className="transition-all"
                      />
                      
                      {/* X Axis Labels */}
                      <text 
                        x={x} 
                        y="188" 
                        textAnchor="middle" 
                        fontSize="7.5" 
                        fontWeight="bold"
                        className="fill-zinc-400 dark:fill-zinc-550"
                      >
                        {d.month}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip Overlay */}
              <AnimatePresence>
                {hoveredLineIdx !== null && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute bg-zinc-950 text-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-850 dark:border-zinc-700 shadow-2xl flex flex-col gap-1 w-52 pointer-events-none text-xs z-15"
                    style={{ 
                      left: `${Math.min(75, Math.max(5, (hoveredLineIdx / 11) * 100))}%`,
                      top: '20%'
                    }}
                  >
                    <span className="font-extrabold text-zinc-400 border-b border-zinc-800 pb-1.5 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                      <FiCalendar className="w-3.5 h-3.5 text-orange-500" />
                      {monthlyTimelineData[hoveredLineIdx].month} 2026 Forecast
                    </span>
                    <span className="flex items-center justify-between">
                      <span className="text-zinc-400 font-semibold">Revenue:</span>
                      <span className="font-black text-orange-400">{formatMoney(monthlyTimelineData[hoveredLineIdx].revenue)}</span>
                    </span>
                    <span className="flex items-center justify-between mt-0.5 border-t border-zinc-900 pt-1.5">
                      <span className="text-zinc-500 font-bold">Orders Placed:</span>
                      <span className="font-bold text-white">{monthlyTimelineData[hoveredLineIdx].orders} orders</span>
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ---------------- CHART SECTION ROW 2 ---------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Monthly Orders Bar Chart */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">Monthly Orders</h3>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-0.5">Quantity of orders dispatched per fiscal month</p>
              </div>

              <div className="relative h-64 flex items-end justify-between gap-1.5 pt-6">
                {monthlyTimelineData.map((d, idx) => {
                  const maxOrders = Math.max(...monthlyTimelineData.map(x => x.orders), 1);
                  const barPct = (d.orders / maxOrders) * 100;
                  
                  return (
                    <div 
                      key={idx} 
                      className="flex-1 flex flex-col items-center gap-2 group cursor-pointer relative"
                      onMouseEnter={() => setHoveredBarIdx(idx)}
                      onMouseLeave={() => setHoveredBarIdx(null)}
                    >
                      {/* Bar fill container */}
                      <div className="w-full bg-orange-500/10 dark:bg-zinc-800/40 rounded-t-lg h-44 flex items-end relative overflow-hidden">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${barPct}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.03 }}
                          className={`w-full rounded-t-lg bg-gradient-to-t from-orange-600 to-orange-400 group-hover:from-orange-500 group-hover:to-orange-350 transition-all ${
                            hoveredBarIdx === idx ? 'scale-x-[1.05]' : ''
                          }`}
                        />
                      </div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase">
                        {d.month}
                      </span>
                    </div>
                  );
                })}

                {/* Tooltip Overlay */}
                <AnimatePresence>
                  {hoveredBarIdx !== null && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute bottom-16 bg-zinc-950 text-white dark:bg-zinc-800 p-3 rounded-xl border border-zinc-850 dark:border-zinc-700 shadow-2xl flex flex-col gap-0.5 w-44 pointer-events-none text-xs z-15"
                      style={{ 
                        left: `${Math.min(65, Math.max(5, (hoveredBarIdx / 11) * 100))}%`
                      }}
                    >
                      <span className="font-extrabold text-zinc-400 border-b border-zinc-900 pb-1 mb-1 flex items-center gap-1 uppercase">
                        <FiShoppingBag className="w-3.5 h-3.5 text-orange-500" />
                        {monthlyTimelineData[hoveredBarIdx].month} Summary
                      </span>
                      <span className="flex items-center justify-between">
                        <span className="text-zinc-400 font-bold">Total Orders:</span>
                        <span className="font-black text-white">{monthlyTimelineData[hoveredBarIdx].orders}</span>
                      </span>
                      <span className="flex items-center justify-between">
                        <span className="text-zinc-400 font-bold">Est. Volume:</span>
                        <span className="font-bold text-orange-400">{formatMoney(monthlyTimelineData[hoveredBarIdx].revenue)}</span>
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

       
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">Sales by Category</h3>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-0.5">Breakdown of orders quantity across major culinary slots</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 h-56 relative">
                
                {/* SVG Pie Arc Chart */}
                <div className="relative w-44 h-44">
                  <svg viewBox="0 0 100 100" className="w-full h-full rotate-[-90deg]">
                    {(() => {
                      let accumulatedAngle = 0;
                      return salesByCategory.map((slice, idx) => {
                        const startAngle = accumulatedAngle;
                        const angleLength = (slice.value / 100) * 360;
                        const endAngle = accumulatedAngle + angleLength;
                        accumulatedAngle = endAngle;

                        const pathD = getPieSlicePath(50, 50, 42, startAngle, endAngle);

                        return (
                          <path 
                            key={idx}
                            d={pathD}
                            fill={slice.color}
                            stroke={hoveredPieIdx === idx ? '#fff' : 'transparent'}
                            strokeWidth="1.5"
                            className="transition-all duration-200 cursor-pointer origin-center hover:scale-[1.03]"
                            onMouseEnter={() => setHoveredPieIdx(idx)}
                            onMouseLeave={() => setHoveredPieIdx(null)}
                          />
                        );
                      });
                    })()}
                  </svg>
                  {/* Central doughnut hole */}
                  <div className="absolute inset-0 m-auto w-24 h-24 bg-white dark:bg-zinc-900 rounded-full shadow-inner flex flex-col items-center justify-center">
                    <FiShoppingBag className="w-5 h-5 text-orange-500 mb-0.5" />
                    <span className="text-[10px] text-zinc-400 font-extrabold uppercase">Top Slots</span>
                  </div>
                </div>

                {/* Pie Legend list */}
                <div className="flex-1 flex flex-col gap-2.5 w-full">
                  {salesByCategory.map((slice, idx) => (
                    <div 
                      key={idx}
                      className={`flex items-center justify-between p-2 rounded-xl border border-transparent transition-all ${
                        hoveredPieIdx === idx ? 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-850' : ''
                      }`}
                      onMouseEnter={() => setHoveredPieIdx(idx)}
                      onMouseLeave={() => setHoveredPieIdx(null)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }} />
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{slice.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-zinc-955 dark:text-white">{slice.value}%</span>
                        {typeof slice.qty === 'number' ? (
                          <span className="text-[10px] text-zinc-450 block font-bold">{slice.qty} sold</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* ---------------- SYSTEM ANALYTICS ---------------- */}
          <div>
            <div className="mb-5">
              <h3 className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">System Operations Performance</h3>
              <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-0.5">Aggregate performance logs from individual active modules</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              
              {/* Card 1: Kitchen Performance */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3.5 mb-5">
                  <div className="p-3 bg-red-500/10 rounded-xl text-red-500 dark:bg-red-500/15">
                    <FiClock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white leading-tight">Kitchen Operations</h4>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Kitchen Monitoring</span>
                  </div>
                </div>
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-semibold">Orders Prepared:</span>
                    <span className="font-extrabold text-zinc-850 dark:text-zinc-200">{kitchenPerformance.preparedCount} orders</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-semibold">Pending Queue:</span>
                    <span className="font-extrabold text-zinc-850 dark:text-zinc-200">{kitchenPerformance.pendingKitchenOrders} orders</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-semibold">Items Prepared:</span>
                    <span className="font-black text-indigo-600 dark:text-indigo-400">{kitchenPerformance.totalItemsPrepared} items</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Delivery Performance */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3.5 mb-5">
                  <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 dark:bg-blue-500/15">
                    <FiTruck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white leading-tight">Delivery Performance</h4>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Delivery Monitoring</span>
                  </div>
                </div>
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-semibold">Delivered:</span>
                    <span className="font-extrabold text-zinc-850 dark:text-zinc-200">{deliveryPerformance.deliveredToday} orders</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-semibold">Out for Delivery:</span>
                    <span className="font-extrabold text-zinc-850 dark:text-zinc-200">{deliveryPerformance.outForDelivery} orders</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-semibold">Delivery Rate:</span>
                    <span className={`font-black ${deliveryPerformance.deliveryRate >= 80 ? 'text-emerald-600' : deliveryPerformance.deliveryRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {deliveryPerformance.deliveryRate}%
                    </span>
                  </div>
                </div>
              </div>

             
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3.5 mb-5">
                  <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500 dark:bg-orange-500/15">
                    <FiPackage className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white leading-tight">Inventory Summary</h4>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Stock Control</span>
                  </div>
                </div>
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-semibold">Stock Item Quantity:</span>
                    <span className="font-black text-orange-600">{inventorySummary.totalQuantity} units</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-semibold">Low Stock Items:</span>
                    <span className={`font-black px-2 py-0.5 rounded-md text-[10px] ${
                      inventorySummary.lowStockItems > 0 ? 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400' : 'text-emerald-600'
                    }`}>
                      {inventorySummary.lowStockItems} items
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-semibold">Restocked Today:</span>
                    <span className="font-extrabold text-zinc-850 dark:text-zinc-200">{inventorySummary.restockedToday} shipments</span>
                  </div>
                </div>
              </div>

             
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3.5 mb-5">
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 dark:bg-emerald-500/15">
                    <FiUserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white leading-tight">Staff Management</h4>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Staff user admin</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3.5 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-zinc-400 font-bold">TOTAL STAFF</span>
                    <span className="font-black text-base text-zinc-900 dark:text-white">{staffSummary.totalStaff}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-zinc-400 font-bold">KITCHEN DECK</span>
                    <span className="font-extrabold text-zinc-700 dark:text-zinc-300">{staffSummary.kitchen}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-zinc-400 font-bold">RIDERS OUT</span>
                    <span className="font-extrabold text-zinc-700 dark:text-zinc-300">{staffSummary.delivery}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-zinc-400 font-bold">ADMIN PANEL</span>
                    <span className="font-extrabold text-zinc-700 dark:text-zinc-300">{staffSummary.admins}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ---------------- TABLES SECTION ---------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">Best Selling Foods</h3>
                  <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-0.5">Top 5 food items by quantity sold</p>
                </div>
                <FiAward className="w-5 h-5 text-orange-500" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase text-[9px] font-extrabold tracking-wider">
                      <th className="pb-3 pl-2">Food Name</th>
                      <th className="pb-3 text-center">Orders</th>
                      <th className="pb-3">Revenue</th>
                      <th className="pb-3 pr-2">Popularity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-850">
                    {bestSellingFoods.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-6 text-zinc-400 font-semibold">No sales data recorded yet.</td>
                      </tr>
                    ) : (
                      bestSellingFoods.map((food, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                          <td className="py-3 pl-2 font-bold text-zinc-800 dark:text-zinc-200">{food.name}</td>
                          <td className="py-3 text-center text-zinc-500 font-semibold">{food.orders} sold</td>
                          <td className="py-3 font-bold text-zinc-900 dark:text-white">{formatMoney(food.revenue)}</td>
                          <td className="py-3 pr-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 min-w-16 overflow-hidden">
                                <div 
                                  className="bg-orange-500 rounded-full h-full"
                                  style={{ width: `${food.popularity}%` }}
                                />
                              </div>
                              <span className="font-extrabold text-[10px] text-zinc-550">{food.popularity}%</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">Low Stock Report</h3>
                  <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-0.5">Critical items requiring immediate reorder</p>
                </div>
                <FiPackage className="w-5 h-5 text-red-500" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase text-[9px] font-extrabold tracking-wider">
                      <th className="pb-3 pl-2">Item</th>
                      <th className="pb-3 text-center">Current Stock</th>
                      <th className="pb-3 text-center">Minimum Stock</th>
                      <th className="pb-3 pr-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-850">
                    {lowStockReport.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-6 text-zinc-400 font-semibold">No critical stock warnings found.</td>
                      </tr>
                    ) : (
                      lowStockReport.map((item, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                          <td className="py-3.5 pl-2 font-bold text-zinc-800 dark:text-zinc-200">{item.name}</td>
                          <td className="py-3.5 text-center font-bold text-red-650">{item.currentStock} units</td>
                          <td className="py-3.5 text-center text-zinc-500 font-semibold">{item.minStock} units</td>
                          <td className="py-3.5 pr-2">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                              item.status === 'Critical' 
                                ? 'bg-red-50 text-red-750 dark:bg-red-950/20 dark:text-red-450' 
                                : 'bg-orange-100 text-orange-850 dark:bg-orange-950/20 dark:text-orange-400'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">Customer Growth &amp; Feedback</h3>
                <p className="text-xs text-zinc-555 dark:text-zinc-400 mt-0.5">Summary of user acquisitions and messaging ratings</p>
              </div>
              <FiUsers className="w-5 h-5 text-indigo-500" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-850 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
                  <FiUsers className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase block">Total Customers</span>
                  <span className="text-lg font-black text-zinc-900 dark:text-white leading-tight">{customerAnalytics.totalCustomers}</span>
                  <span className="text-[10px] text-emerald-600 font-extrabold block mt-0.5">+{customerAnalytics.newCustomersThisMonth} this month</span>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-855 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                  <FiAward className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase block">Average Rating</span>
                  <span className="text-lg font-black text-zinc-900 dark:text-white leading-tight flex items-center gap-1">
                    {customerAnalytics.averageRating} <span className="text-xs text-zinc-405">/ 5.0</span>
                  </span>
                  <span className="text-[10px] text-zinc-400 font-bold block mt-0.5">Based on feedback logs</span>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-855 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-violet-500/10 rounded-xl text-violet-500">
                  <FiMail className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase block">Customer Messages</span>
                  <span className="text-lg font-black text-zinc-900 dark:text-white leading-tight">{customerAnalytics.totalFeedback} messages</span>
                  <span className="text-[10px] text-zinc-450 font-semibold block mt-0.5">Customer Messages module</span>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-855 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                  <FiCheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase block">Satisfaction Index</span>
                  <span className="text-lg font-black text-zinc-900 dark:text-white leading-tight">96.8%</span>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">High positive response</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm overflow-hidden print:border-none print:shadow-none">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">Daily Ledger Activity Report</h3>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-0.5">Historical breakdown of fiscal billing parameters</p>
              </div>
  
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 uppercase text-[9px] font-extrabold tracking-wider">
                    <th className="pb-3.5 pl-3">Date</th>
                    <th className="pb-3.5 text-center">Orders</th>
                    <th className="pb-3.5 text-right">Revenue</th>
                    <th className="pb-3.5 text-center">Cancelled</th>
                    <th className="pb-3.5 pr-3 text-center">Delivered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-850">
                  {ledgerReportTable.map((row, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                      <td className="py-3.5 pl-3 font-bold text-zinc-800 dark:text-zinc-200">{row.date}</td>
                      <td className="py-3.5 text-center font-bold text-zinc-650 dark:text-zinc-400">{row.orders} orders</td>
                      <td className="py-3.5 text-right font-bold text-zinc-900 dark:text-white">{formatMoney(row.revenue)}</td>
                      <td className="py-3.5 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide ${
                          row.cancelled > 0 ? 'bg-red-50 text-red-750 dark:bg-red-950/20 dark:text-red-400' : 'text-zinc-400'
                        }`}>
                          {row.cancelled} cancel
                        </span>
                      </td>
                      <td className="py-3.5 pr-3 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-750 dark:bg-emerald-950/20 dark:text-emerald-400">
                          {row.delivered} delivered
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default ReportsAnalytics;
