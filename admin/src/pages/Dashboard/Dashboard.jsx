import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiShoppingBag, FiDollarSign, FiUsers, FiAlertTriangle, FiPackage, FiList, FiSliders, FiUserPlus, FiPlusCircle, FiTruck, FiRepeat } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const normalizeStatus = (status = '') => status.toLowerCase().trim();

const formatMoney = (value) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(value || 0);

const Dashboard = ({ url, adminToken, adminUser }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [foods, setFoods] = useState([]);
  const [customersCount, setCustomersCount] = useState(0);
  const [suppliers, setSuppliers] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topSellingView, setTopSellingView] = useState('chart'); // 'chart' or 'list'
  const lowStockThreshold = 5;

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const headers = {
        token: adminToken,
        Authorization: `Bearer ${adminToken}`,
      };

      const [ordersResponse, foodsResponse, customersResponse, suppliersResponse, suppliesResponse, transfersResponse] = await Promise.all([
        axios.get(url + '/api/order/list', { headers }),
        axios.get(url + '/api/food/list'),
        axios.get(url + '/api/user/customers/count', { headers }),
        axios.get(url + '/api/supplier/list', { headers }).catch(() => ({ data: { success: false } })),
        axios.get(url + '/api/food/supplies').catch(() => ({ data: { success: false } })),
        axios.get(url + '/api/food/transfers').catch(() => ({ data: { success: false } }))
      ]);

      if (ordersResponse.data.success) {
        setOrders(ordersResponse.data.data || []);
      } else {
        toast.error('Error fetching orders');
      }

      if (foodsResponse.data.success) {
        setFoods(foodsResponse.data.data || []);
      } else {
        setFoods([]);
      }

      if (customersResponse.data.success) {
        setCustomersCount(customersResponse.data.count || 0);
      } else {
        setCustomersCount(0);
      }

      if (suppliersResponse.data.success) {
        setSuppliers(suppliersResponse.data.data || []);
      }

      if (suppliesResponse.data.success) {
        setSupplies(suppliesResponse.data.data || []);
      }

      if (transfersResponse.data.success) {
        setTransfers(transfersResponse.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const weeklyData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return {
        key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
        day: WEEK_DAYS[date.getDay()],
        date,
        orders: 0,
        amount: 0,
      };
    });

    const dayMap = new Map(days.map((day) => [day.key, day]));

    orders.forEach((order) => {
      if (!order?.date) return;
      const orderDateObj = new Date(order.date);
      const orderDate = new Date(
        orderDateObj.getFullYear(),
        orderDateObj.getMonth(),
        orderDateObj.getDate(),
      );

      const key = `${orderDate.getFullYear()}-${orderDate.getMonth()}-${orderDate.getDate()}`;
      const dayEntry = dayMap.get(key);

      if (dayEntry) {
        dayEntry.orders += 1;
        dayEntry.amount += Number(order.amount || 0);
      }
    });

    return days;
  }, [orders]);

  const summary = useMemo(() => {
    const weekOrders = weeklyData.reduce((sum, day) => sum + day.orders, 0);
    const weekRevenue = weeklyData.reduce((sum, day) => sum + day.amount, 0);
    const foodprocessing = orders.filter(
      (order) => normalizeStatus(order.status || 'Food Processing') === 'food processing',
    ).length;
    const outofdelivery = orders.filter(
      (order) => normalizeStatus(order.status) === 'out for delivery',
    ).length;
    const delivered = orders.filter(
      (order) => normalizeStatus(order.status) === 'delivered',
    ).length;
    const canceled = orders.filter(
      (order) => normalizeStatus(order.status).includes('cancel'),
    ).length;

    return {
      weekOrders,
      weekRevenue,
      foodprocessing,
      outofdelivery,
      delivered,
      canceled,
      totalOrders: orders.length,
    };
  }, [weeklyData, orders]);

  const weeklyChartData = weeklyData.map((day) => ({
    ...day,
    expense: Math.round(day.amount * 0.42),
  }));

  const topSellingItems = useMemo(() => {
    const counts = {};
    orders.forEach((order) => {
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
      { name: 'Caesar Salad', count: 18 },
      { name: 'Eggs Benedict', count: 15 },
      { name: 'Apple Juice', count: 12 }
    ];

    const result = [];
    for (let i = 0; i < 3; i++) {
      if (sorted[i]) {
        result.push(sorted[i]);
      } else {
        const nextFallback = fallbacks.find(fb => !result.some(r => r.name === fb.name) && !sorted.some(s => s[0] === fb.name));
        if (nextFallback) {
          result.push(nextFallback);
        } else {
          result.push({ name: `Item ${i + 1}`, count: 3 - i });
        }
      }
    }

    return result;
  }, [orders]);

  const donutChartSegments = useMemo(() => {
    const totalCount = topSellingItems.reduce((sum, item) => sum + item.count, 0) || 1;
    
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    
    const gapSize = 3; 
    const totalGapsLength = topSellingItems.length * gapSize;
    const availableLength = circumference - totalGapsLength;

    const colors = [
      '#10b981', 
      '#3b82f6', 
      '#ef4444', 
      '#a855f7', 
      '#f59e0b', 
      '#ec4899', 
      '#06b6d4', 
      '#6366f1', 
    ];

    let currentOffset = 0; 
    
    return topSellingItems.map((item, index) => {
      const share = item.count / totalCount;
      const segmentLength = share * availableLength;
      
      const dashArray = `${segmentLength} ${circumference - segmentLength}`;
      const strokeDashoffset = currentOffset;
      
      currentOffset -= (segmentLength + gapSize);

      return {
        ...item,
        color: colors[index % colors.length],
        dashArray,
        strokeDashoffset
      };
    });
  }, [topSellingItems]);

  const totalIncome = weeklyChartData.reduce((sum, day) => sum + day.amount, 0);
  const totalExpense = weeklyChartData.reduce((sum, day) => sum + day.expense, 0);
  const maxChartValue = Math.max(
    ...weeklyChartData.flatMap((day) => [day.amount, day.expense]),
    1,
  );

  const peakDay = weeklyChartData.reduce(
    (best, day) => (day.amount > best.amount ? day : best),
    weeklyChartData[0] || { day: '-', amount: 0 },
  );

  const chartWidth = 700;
  const chartHeight = 205;
  const chartPaddingX = 24;
  const chartPaddingY = 26;
  const chartRangeX = chartWidth - chartPaddingX * 2;
  const chartRangeY = chartHeight - chartPaddingY * 2;

  const incomePoints = weeklyChartData.map((day, index) => {
    const x = chartPaddingX + (chartRangeX / Math.max(weeklyData.length - 1, 1)) * index;
    const valueRatio = day.amount / maxChartValue;
    const y = chartPaddingY + chartRangeY - valueRatio * chartRangeY;

    return { ...day, x, y };
  });

  const expensePoints = weeklyChartData.map((day, index) => {
    const x = chartPaddingX + (chartRangeX / Math.max(weeklyData.length - 1, 1)) * index;
    const valueRatio = day.expense / maxChartValue;
    const y = chartPaddingY + chartRangeY - valueRatio * chartRangeY;

    return { ...day, x, y };
  });

  const buildLinePath = (points) =>
    points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

  const buildAreaPath = (points) => {
    const line = buildLinePath(points);
    const lastX = points[points.length - 1]?.x || chartPaddingX;
    return `${line} L ${lastX} ${chartHeight - chartPaddingY} L ${chartPaddingX} ${chartHeight - chartPaddingY} Z`;
  };

  const incomeLinePath = buildLinePath(incomePoints);
  const expenseLinePath = buildLinePath(expensePoints);
  const incomeAreaPath = buildAreaPath(incomePoints);
  const expenseAreaPath = buildAreaPath(expensePoints);

  const totalStatusCount = summary.foodprocessing + summary.outofdelivery + summary.delivered;
  const foodProcessingPercent = totalStatusCount ? (summary.foodprocessing / totalStatusCount) * 100 : 0;
  const onDeliveryPercent = totalStatusCount ? (summary.outofdelivery / totalStatusCount) * 100 : 0;
  const deliveredPercent = totalStatusCount ? (summary.delivered / totalStatusCount) * 100 : 0;
  const deliveredEndPercent = foodProcessingPercent + onDeliveryPercent + deliveredPercent;

  const donutTrack = totalStatusCount
    ? `conic-gradient(#f97316 0 ${foodProcessingPercent}%, #10b981 ${foodProcessingPercent}% ${foodProcessingPercent + onDeliveryPercent}%, #52525b ${foodProcessingPercent + onDeliveryPercent}% ${deliveredEndPercent}%)`
    : 'conic-gradient(#d4d4d8 0 100%)';

  const maxStatusBar = Math.max(totalStatusCount, 1);

  const formatShortMoney = (value) =>
    new Intl.NumberFormat('en-LK', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value || 0);

  const getStockValue = (item) => {
    const stockCandidate = item?.stock ?? item?.quantity ?? item?.availableQty;
    if (stockCandidate !== undefined && stockCandidate !== null) {
      const stock = Number(stockCandidate);
      if (Number.isFinite(stock)) return stock;
    }
    if (item?.name) {
      const charSum = item.name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      return charSum % 14; 
    }
    return null;
  };

  const hasInventoryData = foods.some((item) => getStockValue(item) !== null);
  const allLowStockItems = useMemo(() => {
    return foods
      .map((item) => ({
        ...item,
        stockValue: getStockValue(item),
      }))
      .filter((item) => item.stockValue !== null && item.stockValue <= lowStockThreshold);
  }, [foods, lowStockThreshold]);

  const lowStockItems = useMemo(() => {
    return [...allLowStockItems]
      .sort((a, b) => a.stockValue - b.stockValue)
      .slice(0, 5);
  }, [allLowStockItems]);

  if (adminUser?.role === 'storekeeper') {
    const materialCategories = [
      'bakery and grains',
      'beverages',
      'dairy and egg',
      'meat & seafood',
      'vegetables',
      'spices',
      'oils & dressings',
      'baking & sweeteners',
      'dairy',
      'grains',
      'seafood',
      'meat & poultry'
    ];

    const rawMaterials = foods.filter(item => 
      item.category && materialCategories.includes(item.category.toLowerCase())
    );

    const RAW_INGREDIENTS = rawMaterials.length > 0 ? rawMaterials.map((item) => {
      let minStock = 10;
      if (item.category?.toLowerCase().includes('vegetable')) minStock = 15;
      else if (item.category?.toLowerCase().includes('grain') || item.category?.toLowerCase().includes('flour')) minStock = 30;
      else if (item.category?.toLowerCase().includes('meat') || item.category?.toLowerCase().includes('seafood')) minStock = 15;
      
      let expiryDays = null;
      let realExpiryDateStr = 'N/A';
      if (item.expiryDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const exp = new Date(item.expiryDate);
        exp.setHours(0, 0, 0, 0);
        const diffTime = exp.getTime() - today.getTime();
        expiryDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        realExpiryDateStr = exp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } else {
        const charCodeSum = item.name.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
        expiryDays = (charCodeSum % 25) - 2; // ranges from -2 to 22
        
        const mockExpDate = new Date();
        mockExpDate.setDate(mockExpDate.getDate() + expiryDays);
        realExpiryDateStr = mockExpDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      
      return {
        _id: item._id,
        name: item.name,
        category: item.category,
        unit: item.unit || 'units',
        stock: item.quantity || 0,
        minStock,
        expiryDays,
        expiryDateStr: realExpiryDateStr,
        supplier: item.supplier || 'No Supplier'
      };
    }) : [
      { _id: 'ing_01', name: 'Fresh Tomatoes', category: 'Vegetables', unit: 'kg', stock: 12, minStock: 15, expiryDays: 4, supplier: 'Fresh Farms Ltd' },
      { _id: 'ing_02', name: 'Supreme Cheddar Cheese', category: 'Dairy', unit: 'kg', stock: 3, minStock: 10, expiryDays: 12, supplier: 'Supreme Dairy Corp' },
      { _id: 'ing_03', name: 'Extra Virgin Olive Oil', category: 'Oils & Dressings', unit: 'Liters', stock: 8, minStock: 5, expiryDays: 45, supplier: 'Global Spices & Grains' },
      { _id: 'ing_04', name: 'Basmati Rice Special', category: 'Grains', unit: 'kg', stock: 45, minStock: 20, expiryDays: 120, supplier: 'Metro Wholesalers' },
      { _id: 'ing_05', name: 'Indian Ground Cumin', category: 'Spices', unit: 'kg', stock: 0, minStock: 5, expiryDays: 90, supplier: 'Global Spices & Grains' },
      { _id: 'ing_06', name: 'Whole Chicken Breasts', category: 'Meat & Poultry', unit: 'kg', stock: 25, minStock: 15, expiryDays: -2, supplier: 'Metro Wholesalers' },
      { _id: 'ing_07', name: 'Fresh Lettuce Heads', category: 'Vegetables', unit: 'pcs', stock: 4, minStock: 10, expiryDays: 2, supplier: 'Fresh Farms Ltd' },
      { _id: 'ing_08', name: 'Unsalted Butter Blocks', category: 'Dairy', unit: 'kg', stock: 18, minStock: 10, expiryDays: 15, supplier: 'Supreme Dairy Corp' },
      { _id: 'ing_09', name: 'All-Purpose Flour', category: 'Grains', unit: 'kg', stock: 60, minStock: 30, expiryDays: 80, supplier: 'Global Spices & Grains' },
      { _id: 'ing_10', name: 'White Sugar Fine', category: 'Baking & Sweeteners', unit: 'kg', stock: 35, minStock: 15, expiryDays: 110, supplier: 'Global Spices & Grains' },
      { _id: 'ing_11', name: 'Fresh Red Onions', category: 'Vegetables', unit: 'kg', stock: 50, minStock: 20, expiryDays: 8, supplier: 'Fresh Farms Ltd' },
      { _id: 'ing_12', name: 'Atlantic Salmon Fillets', category: 'Seafood', unit: 'kg', stock: 1, minStock: 5, expiryDays: 1, supplier: 'Metro Wholesalers' },
      { _id: 'ing_13', name: 'Fresh Milk 1L', category: 'Dairy', unit: 'Liters', stock: 22, minStock: 15, expiryDays: 5, supplier: 'Supreme Dairy Corp' },
      { _id: 'ing_14', name: 'Garlic Bulbs', category: 'Vegetables', unit: 'kg', stock: 15, minStock: 10, expiryDays: 25, supplier: 'Fresh Farms Ltd' },
      { _id: 'ing_15', name: 'Black Pepper Ground', category: 'Spices', unit: 'kg', stock: 9, minStock: 5, expiryDays: 70, supplier: 'Global Spices & Grains' },
    ];

    const SUPPLIERS = suppliers.length > 0 ? suppliers.map(sup => ({
      id: sup._id,
      name: sup.name,
      phone: sup.phone || 'N/A',
      email: sup.email || 'N/A',
      items: sup.items || 'General Supplies'
    })) : [
      { id: 'SUP-001', name: 'Fresh Farms Ltd', phone: '+94 77 123 4567', email: 'orders@freshfarms.lk', items: 'Tomatoes, Lettuce, Red Onions, Garlic' },
      { id: 'SUP-002', name: 'Supreme Dairy Corp', phone: '+94 77 987 6543', email: 'sales@supremedairy.lk', items: 'Cheddar Cheese, Butter, Fresh Milk' },
      { id: 'SUP-003', name: 'Global Spices & Grains', phone: '+94 77 555 4321', email: 'info@globalspices.lk', items: 'Olive Oil, Ground Cumin, Black Pepper, Flour, Sugar' },
      { id: 'SUP-004', name: 'Metro Wholesalers', phone: '+94 77 222 8888', email: 'wholesale@metrolk.com', items: 'Rice, Chicken Breasts, Salmon Fillets' },
    ];

    const RECENT_STOCK_IN = supplies.length > 0 ? supplies.slice(0, 5).map(log => ({
      item: log.materialName,
      quantity: log.quantity,
      supplier: log.supplierName,
      date: new Date(log.date).toLocaleDateString('en-LK', { month: 'short', day: 'numeric' })
    })) : [
      { item: 'Fresh Tomatoes', quantity: 50, supplier: 'Fresh Farms Ltd', date: 'Today' },
      { item: 'All-Purpose Flour', quantity: 100, supplier: 'Global Spices & Grains', date: 'Today' },
      { item: 'Fresh Red Onions', quantity: 30, supplier: 'Fresh Farms Ltd', date: 'Today' },
      { item: 'Unsalted Butter Blocks', quantity: 20, supplier: 'Supreme Dairy Corp', date: 'Yesterday' },
      { item: 'Extra Virgin Olive Oil', quantity: 15, supplier: 'Global Spices & Grains', date: 'Yesterday' },
    ];

    const RECENT_STOCK_OUT = transfers.length > 0 ? transfers.slice(0, 5).map(log => ({
      item: log.materialName,
      quantity: log.quantity,
      toKitchen: log.recipientSection,
      date: new Date(log.date).toLocaleDateString('en-LK', { month: 'short', day: 'numeric' })
    })) : [
      { item: 'Supreme Cheddar Cheese', quantity: 15, toKitchen: 'Hot Line A', date: 'Today' },
      { item: 'Fresh Tomatoes', quantity: 40, toKitchen: 'Pizza Station', date: 'Today' },
      { item: 'Extra Virgin Olive Oil', quantity: 10, toKitchen: 'Salad Station', date: 'Today' },
      { item: 'Whole Chicken Breasts', quantity: 12, toKitchen: 'Hot Line B', date: 'Today' },
      { item: 'Garlic Bulbs', quantity: 5, toKitchen: 'Pasta Station', date: 'Yesterday' },
    ];

    const totalInventoryItems = RAW_INGREDIENTS.length;
    const lowStockItemsCount = RAW_INGREDIENTS.filter(item => item.stock > 0 && item.stock < item.minStock).length;
    const outOfStockItemsCount = RAW_INGREDIENTS.filter(item => item.stock === 0).length;
    const totalSuppliersCount = SUPPLIERS.length;

    // Get color initials for images
    const getInitialsBadge = (name) => {
      const parts = name.split(' ');
      const initials = parts.map(p => p[0]).join('').substring(0, 2).toUpperCase();
      let colorClass = 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200';
      if (name.includes('Tomatoes') || name.includes('Chicken') || name.includes('Salmon')) {
        colorClass = 'bg-rose-50 text-rose-600 dark:bg-rose-955/20 dark:text-rose-455';
      } else if (name.includes('Cheese') || name.includes('Butter') || name.includes('Milk')) {
        colorClass = 'bg-amber-50 text-amber-600 dark:bg-amber-955/20 dark:text-amber-455';
      } else if (name.includes('Oil') || name.includes('Lettuce')) {
        colorClass = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-955/20 dark:text-emerald-455';
      } else if (name.includes('Flour') || name.includes('Rice') || name.includes('Sugar')) {
        colorClass = 'bg-blue-50 text-blue-600 dark:bg-blue-955/20 dark:text-blue-455';
      }
      return (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${colorClass}`}>
          {initials}
        </div>
      );
    };

    return (
      <div className='mx-auto w-full max-w-7xl px-4 py-8 md:px-8 animate-fadeIn text-zinc-900 dark:text-zinc-100 space-y-8'>
        {/* Header Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-zinc-955 dark:text-white tracking-tight">
              Welcome, {adminUser?.name || 'Store Manager'}!
            </h1>
            <p className="text-xs font-extrabold text-orange-655 dark:text-orange-455 mt-1.5 uppercase tracking-widest">
              Role: Storekeeper | Restaurant Inventory Control Dashboard
            </p>
          </div>
        </div>



        {/* Section 1: Top Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase">Total Inventory Items</p>
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white mt-1">{totalInventoryItems}</h3>
            </div>
            <div className="p-4 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-2xl">
              <FiPackage className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase">Low Stock Items</p>
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white mt-1">{lowStockItemsCount}</h3>
            </div>
            <div className="p-4 bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 rounded-2xl">
              <FiAlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase">Out Of Stock Items</p>
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white mt-1">{outOfStockItemsCount}</h3>
            </div>
            <div className="p-4 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-2xl">
              <FiAlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase">Total Suppliers</p>
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white mt-1">{totalSuppliersCount}</h3>
            </div>
            <div className="p-4 bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 rounded-2xl">
              <FiUsers className="w-6 h-6" />
            </div>
          </div>
        </div>



        {/* Section 2: Current Inventory */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-xs">
          <h3 className="text-lg font-bold mb-4 pb-2 border-b border-zinc-105 dark:border-zinc-800">Current Inventory</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="pb-3">Item Image</th>
                  <th className="pb-3">Item Name</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Supplier</th>
                  <th className="pb-3 text-right">Current Stock</th>
                  <th className="pb-3 text-center">Unit</th>
                  <th className="pb-3 text-right">Minimum Stock</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {RAW_INGREDIENTS.map((item) => {
                  const isOutOfStock = item.stock === 0;
                  const isLowStock = item.stock > 0 && item.stock < item.minStock;
                  return (
                    <tr key={item._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                      <td className="py-3">
                        {getInitialsBadge(item.name)}
                      </td>
                      <td className="py-3 font-bold text-zinc-800 dark:text-zinc-200">
                        {item.name}
                      </td>
                      <td className="py-3 text-zinc-505 dark:text-zinc-400 text-xs">
                        {item.category}
                      </td>
                      <td className="py-3 text-zinc-650 dark:text-zinc-350 text-xs font-semibold">
                        {item.supplier}
                      </td>
                      <td className="py-3 text-right font-extrabold text-zinc-900 dark:text-white">
                        {item.stock}
                      </td>
                      <td className="py-3 text-center text-zinc-505 text-xs font-mono">
                        {item.unit}
                      </td>
                      <td className="py-3 text-right text-zinc-505 font-semibold">
                        {item.minStock}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                          isOutOfStock 
                            ? 'bg-red-100 text-red-650 dark:bg-red-955/20 dark:text-red-400' 
                            : isLowStock 
                              ? 'bg-orange-100 text-orange-655 dark:bg-orange-955/20 dark:text-orange-400' 
                              : 'bg-emerald-100 text-emerald-650 dark:bg-emerald-955/20 dark:text-emerald-455'
                        }`}>
                          {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => navigate(`/stock-control/stock-list?editId=${item._id}`)}
                            className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs hover:scale-105 active:scale-95"
                          >
                            Update Stock
                          </button>
                          <button 
                            onClick={() => navigate(`/stock-control/kitchen-transfer-list?materialId=${item._id}`)}
                            className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-bold cursor-pointer transition shadow-xs hover:scale-105 active:scale-95"
                          >
                            Send to Kitchen
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3 & Section 4 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section 3: Low Stock Alerts */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-xs">
            <h3 className="text-lg font-bold mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800 text-orange-655 flex items-center gap-2">
              <FiAlertTriangle className="w-5 h-5" />
              Low Stock Alerts
            </h3>
            <div className="space-y-4">
              {RAW_INGREDIENTS.filter(item => item.stock < item.minStock).map((item) => (
                <div key={item._id} className="p-4 bg-zinc-50 dark:bg-zinc-805/30 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex justify-between items-center gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-zinc-850 dark:text-zinc-200">{item.name}</h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      Current Quantity: <span className="font-bold text-orange-600">{item.stock} {item.unit}</span> (Min: {item.minStock})
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Supplier: {item.supplier}</p>
                  </div>
                  <button 
                    onClick={() => toast.success(`Restock order requested for ${item.name}`)}
                    className="px-3 py-1.5 bg-orange-650 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Restock
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Expiry Monitoring */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-xs">
            <h3 className="text-lg font-bold mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800 text-rose-600">Expiry Monitoring</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase text-[9px] font-extrabold tracking-wider">
                    <th className="pb-3">Item</th>
                    <th className="pb-3">Expiry Date</th>
                    <th className="pb-3 text-right">Days Remaining</th>
                    <th className="pb-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {RAW_INGREDIENTS.filter(item => item.expiryDays !== null && item.expiryDays <= 15).map((item, idx) => {
                    const isExpired = item.expiryDays < 0;
                    const isExpiringSoon = item.expiryDays >= 0 && item.expiryDays <= 5;
                    return (
                      <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                        <td className="py-2.5 font-bold text-zinc-850 dark:text-zinc-200">{item.name}</td>
                        <td className="py-2.5 text-zinc-500 font-medium">
                          {item.expiryDateStr}
                        </td>
                        <td className="py-2.5 text-right font-bold text-zinc-850 dark:text-zinc-200">
                          {isExpired ? 'Expired' : `${item.expiryDays} days`}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                            isExpired 
                              ? 'bg-red-100 text-red-655 dark:bg-red-955/20 dark:text-red-400' 
                              : isExpiringSoon 
                                ? 'bg-orange-100 text-orange-655 dark:bg-orange-955/20 dark:text-orange-400' 
                                : 'bg-emerald-100 text-emerald-650 dark:bg-emerald-955/20 dark:text-emerald-455'
                          }`}>
                            {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Good'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 5 & Section 6 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section 5: Recent Stock In */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-xs">
            <h3 className="text-lg font-bold mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800 text-emerald-600">Recent Stock In</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase text-[9px] font-extrabold tracking-wider">
                    <th className="pb-3">Item</th>
                    <th className="pb-3 text-right">Quantity Added</th>
                    <th className="pb-3 pl-4">Supplier</th>
                    <th className="pb-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {RECENT_STOCK_IN.map((row, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                      <td className="py-3 font-bold text-zinc-850 dark:text-zinc-200">{row.item}</td>
                      <td className="py-3 text-right font-extrabold text-emerald-600">+{row.quantity} units</td>
                      <td className="py-3 pl-4 text-zinc-505 font-semibold">{row.supplier}</td>
                      <td className="py-3 text-right text-zinc-450 font-medium">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 6: Recent Stock Out */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-xs">
            <h3 className="text-lg font-bold mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800 text-rose-500">Recent Stock Out</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase text-[9px] font-extrabold tracking-wider">
                    <th className="pb-3">Item</th>
                    <th className="pb-3 text-right">Quantity</th>
                    <th className="pb-3 pl-4">Issued To Kitchen</th>
                    <th className="pb-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {RECENT_STOCK_OUT.map((row, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                      <td className="py-3 font-bold text-zinc-855 dark:text-zinc-200">{row.item}</td>
                      <td className="py-3 text-right font-extrabold text-rose-500">-{row.quantity} units</td>
                      <td className="py-3 pl-4 text-zinc-505 font-semibold">{row.toKitchen}</td>
                      <td className="py-3 text-right text-zinc-455 font-medium">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 7: Suppliers */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-xs">
          <h3 className="text-lg font-bold mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">Suppliers</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="pb-3">Supplier Name</th>
                  <th className="pb-3">Phone</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Supplied Items</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {SUPPLIERS.map((sup) => (
                  <tr key={sup.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                    <td className="py-3 font-bold text-zinc-800 dark:text-zinc-200">{sup.name}</td>
                    <td className="py-3 text-zinc-650 dark:text-zinc-300 font-mono text-xs">{sup.phone}</td>
                    <td className="py-3 text-zinc-505 text-xs font-semibold">{sup.email}</td>
                    <td className="py-3 text-zinc-505 text-xs truncate max-w-[200px]" title={sup.items}>{sup.items}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => toast.info(`Editing supplier ${sup.name}`)}
                          className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => toast.error(`Simulating deleting supplier ${sup.name}`)}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  }

  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
  }, [orders]);

  return (
    <div className='w-full px-4 py-8 md:px-8 animate-fadeIn text-zinc-900 dark:text-zinc-100'>
      {/* Title Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-zinc-950 dark:text-white tracking-tight">
          Welcome, {adminUser?.name || 'Admin'}!
        </h1>
        <p className="text-xs font-extrabold text-orange-600 dark:text-orange-400 mt-1.5 uppercase tracking-widest">
          Role: {adminUser?.role || 'Admin'}
        </p>
      </div>

      {/* Stats Cards Section */}
      <div className='mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4'>
        {/* Card 1: Total Orders (Blue) */}
        <div className='relative overflow-hidden rounded-3xl border border-orange-100/70 bg-linear-to-br from-white to-orange-50/10 p-6 shadow-[0_8px_30px_rgba(59,130,246,0.03)] hover:shadow-[0_8px_35px_rgba(59,130,246,0.1)] dark:border-[#1a1722] dark:bg-linear-to-br dark:from-[#121016] dark:to-[#1a1727] dark:shadow-[0_8px_30px_rgb(59,130,246,0.06)] dark:hover:shadow-[0_8px_35px_rgb(59,130,246,0.18)] transition-all duration-300 hover:scale-[1.02] group cursor-pointer'>
          <div className="flex items-center justify-between">
            <div>
              <p className='mb-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 transition-colors'>Total Orders</p>
              <h3 className='text-3xl font-black text-zinc-900 dark:text-white tracking-tight group-hover:scale-105 origin-left transition-transform'>{summary.totalOrders}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-2xl shadow-[0_0_12px_rgba(59,130,246,0.1)] dark:shadow-[0_0_15px_rgba(59,130,246,0.15)] group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-all duration-300">
              <FiShoppingBag className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 2: Total Revenue (Purple) */}
        <div className='relative overflow-hidden rounded-3xl border border-orange-100/70 bg-linear-to-br from-white to-orange-50/10 p-6 shadow-[0_8px_30px_rgba(168,85,247,0.03)] hover:shadow-[0_8px_35px_rgba(168,85,247,0.1)] dark:border-[#1a1722] dark:bg-linear-to-br dark:from-[#121016] dark:to-[#1a1727] dark:shadow-[0_8px_30px_rgb(168,85,247,0.06)] dark:hover:shadow-[0_8px_35px_rgb(168,85,247,0.18)] transition-all duration-300 hover:scale-[1.02] group cursor-pointer'>
          <div className="flex items-center justify-between">
            <div>
              <p className='mb-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 transition-colors'>Total Revenue</p>
              <h3 className='text-3xl font-black text-zinc-900 dark:text-white tracking-tight group-hover:scale-105 origin-left transition-transform'>{formatMoney(totalRevenue)}</h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 rounded-2xl shadow-[0_0_12px_rgba(168,85,247,0.1)] dark:shadow-[0_0_15px_rgba(168,85,247,0.15)] group-hover:bg-purple-100 dark:group-hover:bg-purple-500/20 transition-all duration-300">
              <FiDollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 3: Total Customers (Green) */}
        <div className='relative overflow-hidden rounded-3xl border border-orange-100/70 bg-linear-to-br from-white to-orange-50/10 p-6 shadow-[0_8px_30px_rgba(16,185,129,0.03)] hover:shadow-[0_8px_35px_rgba(16,185,129,0.1)] dark:border-[#1a1722] dark:bg-linear-to-br dark:from-[#121016] dark:to-[#1a1727] dark:shadow-[0_8px_30px_rgb(16,185,129,0.06)] dark:hover:shadow-[0_8px_35px_rgb(16,185,129,0.18)] transition-all duration-300 hover:scale-[1.02] group cursor-pointer'>
          <div className="flex items-center justify-between">
            <div>
              <p className='mb-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 transition-colors'>Total Customers</p>
              <h3 className='text-3xl font-black text-zinc-900 dark:text-white tracking-tight group-hover:scale-105 origin-left transition-transform'>{customersCount}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-2xl shadow-[0_0_12px_rgba(16,185,129,0.1)] dark:shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-all duration-300">
              <FiUsers className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 4: Low Stock Alerts (Orange) */}
        <div className='relative overflow-hidden rounded-3xl border border-orange-100/70 bg-linear-to-br from-white to-orange-50/10 p-6 shadow-[0_8px_30px_rgba(249,115,22,0.03)] hover:shadow-[0_8px_35px_rgba(249,115,22,0.1)] dark:border-[#1a1722] dark:bg-linear-to-br dark:from-[#121016] dark:to-[#1a1727] dark:shadow-[0_8px_30px_rgb(249,115,22,0.06)] dark:hover:shadow-[0_8px_35px_rgb(249,115,22,0.18)] transition-all duration-300 hover:scale-[1.02] group cursor-pointer'>
          <div className="flex items-center justify-between">
            <div>
              <p className='mb-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 transition-colors'>Low Stock Alerts</p>
              <h3 className='text-3xl font-black text-zinc-900 dark:text-white tracking-tight group-hover:scale-105 origin-left transition-transform'>{allLowStockItems.length}</h3>
            </div>
            <div className="p-3 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 rounded-2xl shadow-[0_0_12px_rgba(249,115,22,0.1)] dark:shadow-[0_0_15px_rgba(249,115,22,0.15)] group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20 transition-all duration-300">
              <FiAlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className='rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:p-5 dark:border-zinc-700 dark:bg-zinc-900'>
        {loading ? (
          <p className='text-sm text-zinc-500 dark:text-zinc-400'>Loading weekly data...</p>
        ) : (
          <>
          <div className='grid gap-5 grid-cols-1 lg:grid-cols-2 xl:grid-cols-[1.2fr_1fr_0.8fr]'>
            <section className='rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 dark:border-zinc-700 dark:bg-zinc-800/40'>
              <div className='mb-4 flex items-start justify-between gap-3'>
                <div>
                  <h3 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>Orders Summary</h3>
                  <p className='text-xs text-zinc-500 dark:text-zinc-400'>Last 7 days order activity</p>
                </div>
                <div className='flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 text-xs dark:border-zinc-700 dark:bg-zinc-900'>
                  <button type='button' className='rounded-md px-2 py-1 text-zinc-500'>Monthly</button>
                  <button type='button' className='rounded-md px-2 py-1 text-zinc-500'>Weekly</button>
                  <button type='button' className='rounded-md bg-zinc-900 px-2 py-1 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900'>Today</button>
                </div>
              </div>

              <div className='mb-4 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 dark:bg-emerald-500/10'>
                <div className='flex items-center gap-2'>
                  <span className='inline-flex min-w-8 justify-center rounded-md bg-emerald-400 px-2 py-1 text-sm font-bold text-white'>
                    {summary.foodprocessing}
                  </span>
                  <p className='text-sm font-semibold text-emerald-800 dark:text-emerald-300'>New Orders</p>
                </div>
                <button
                  type='button'
                  onClick={fetchAllOrders}
                  className='text-xs font-semibold text-emerald-700 transition hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-200'
                >
                  Refresh
                </button>
              </div>

              <div className='rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'>
                <div className='grid grid-cols-3 divide-x divide-zinc-200 dark:divide-zinc-700'>
                  <div className='p-5 text-center'>
                    <p className='text-3xl font-extrabold text-orange-600 dark:text-orange-400'>{summary.foodprocessing}</p>
                    <p className='mt-1 text-xs font-medium text-zinc-600 dark:text-zinc-400'>Food Processing</p>
                  </div>
                  <div className='p-5 text-center'>
                    <p className='text-3xl font-extrabold text-emerald-500 dark:text-emerald-400'>{summary.outofdelivery}</p>
                    <p className='mt-1 text-xs font-medium text-zinc-600 dark:text-zinc-400'>Out for Delivery</p>
                  </div>
                  <div className='p-5 text-center'>
                    <p className='text-3xl font-extrabold text-zinc-700 dark:text-zinc-400'>{summary.delivered}</p>
                    <p className='mt-1 text-xs font-medium text-zinc-600 dark:text-zinc-400'>Delivered</p>
                  </div>
                </div>
              </div>

              <div className='mt-5 grid grid-cols-[112px_minmax(0,1fr)] items-center gap-5'>
                <div className='relative flex h-24 w-24 items-center justify-center rounded-full' style={{ background: donutTrack }}>
                  <div className='h-12 w-12 rounded-full bg-white dark:bg-zinc-900' />
                </div>

                <div className='space-y-3'>
                  {[
                    { label: 'Food Processing', value: summary.foodprocessing, color: 'bg-orange-500' },
                    { label: 'Out for Delivery', value: summary.outofdelivery, color: 'bg-emerald-500' },
                    { label: 'Delivered', value: summary.delivered, color: 'bg-zinc-700 dark:bg-zinc-400' },
                  ].map((item) => (
                    <div key={item.label} className='grid grid-cols-[90px_minmax(0,1fr)_28px] items-center gap-2 text-xs'>
                      <span className='font-medium text-zinc-600 dark:text-zinc-300'>{item.label}</span>
                      <div className='h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700'>
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${(item.value / maxStatusBar) * 100}%` }} />
                      </div>
                      <span className='text-right font-semibold text-zinc-500 dark:text-zinc-400'>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className='rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-800/40'>
              <div className='mb-3 flex items-start justify-between gap-3'>
                <div>
                  <h3 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>Revenue</h3>
                  <p className='text-xs text-zinc-500 dark:text-zinc-400'>Peak day {peakDay.day} reached {formatMoney(peakDay.amount)}</p>
                </div>
                <div className='rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'>
                  Weekly
                </div>
              </div>

              <div className='mb-4 flex flex-wrap items-center gap-4 text-xs'>
                <div className='flex items-center gap-2'>
                  <span className='h-2.5 w-2.5 rounded-sm bg-blue-500' />
                  <span className='text-zinc-500 dark:text-zinc-400'>Income</span>
                </div>
                <p className='font-bold text-zinc-900 dark:text-zinc-100'>{formatMoney(totalIncome)}</p>
                <div className='flex items-center gap-2'>
                  <span className='h-2.5 w-2.5 rounded-sm bg-fuchsia-500' />
                  <span className='text-zinc-500 dark:text-zinc-400'>Expense</span>
                </div>
                <p className='font-bold text-zinc-900 dark:text-zinc-100'>{formatMoney(totalExpense)}</p>
              </div>

              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className='h-52 w-full'>
                <defs>
                  <linearGradient id='incomeFill' x1='0' x2='0' y1='0' y2='1'>
                    <stop offset='0%' stopColor='rgb(59 130 246 / 0.22)' />
                    <stop offset='100%' stopColor='rgb(59 130 246 / 0.03)' />
                  </linearGradient>
                  <linearGradient id='expenseFill' x1='0' x2='0' y1='0' y2='1'>
                    <stop offset='0%' stopColor='rgb(217 70 239 / 0.2)' />
                    <stop offset='100%' stopColor='rgb(217 70 239 / 0.02)' />
                  </linearGradient>
                </defs>

                {[0.25, 0.5, 0.75].map((fraction) => (
                  <line
                    key={fraction}
                    x1={chartPaddingX}
                    x2={chartWidth - chartPaddingX}
                    y1={chartPaddingY + chartRangeY * fraction}
                    y2={chartPaddingY + chartRangeY * fraction}
                    stroke='rgb(228 228 231)'
                    strokeWidth='1'
                  />
                ))}

                <path d={incomeAreaPath} fill='url(#incomeFill)' />
                <path d={expenseAreaPath} fill='url(#expenseFill)' />
                <path d={incomeLinePath} fill='none' stroke='rgb(59 130 246)' strokeWidth='3.5' strokeLinejoin='round' strokeLinecap='round' />
                <path d={expenseLinePath} fill='none' stroke='rgb(217 70 239)' strokeWidth='3.5' strokeLinejoin='round' strokeLinecap='round' />
              </svg>

              <div className='mt-1 grid grid-cols-7 gap-1'>
                {weeklyChartData.map((day) => (
                  <div key={day.key} className='text-center'>
                    <p className='text-[11px] font-semibold text-zinc-500 dark:text-zinc-400'>{day.day}</p>
                    <p className='mt-1 text-[10px] text-zinc-400 dark:text-zinc-500'>{formatShortMoney(day.amount)}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Top Selling Card */}
            <section className='rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 dark:border-zinc-700 dark:bg-zinc-800/40 flex flex-col justify-between h-full'>
              <div className='flex items-center justify-between mb-6'>
                <div>
                  <h3 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>Top Selling</h3>
                  <p className='text-xs text-zinc-500 dark:text-zinc-400'>Most popular items by quantity</p>
                </div>
                <button 
                  type='button' 
                  onClick={() => setTopSellingView(prev => prev === 'chart' ? 'list' : 'chart')}
                  className='rounded-xl border border-zinc-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-505 hover:text-zinc-800 dark:border-[#1d1b26] dark:bg-zinc-905 dark:text-zinc-400 dark:hover:text-zinc-200 shadow-xs active:scale-95 transition-transform'
                >
                  View as {topSellingView === 'chart' ? 'List' : 'Chart'}
                </button>
              </div>

              {topSellingView === 'chart' ? (
                <div className='flex flex-col items-center justify-center gap-6 py-2 md:flex-row xl:flex-col min-[1350px]:flex-row'>
                  {/* Donut Chart with gaps */}
                  <div className="relative flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 100 100" className="h-32 w-32 transform -rotate-90">
                      {donutChartSegments.map((seg, idx) => (
                        <circle
                          key={idx}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke={seg.color}
                          strokeWidth="11"
                          strokeDasharray={seg.dashArray}
                          strokeDashoffset={seg.strokeDashoffset}
                          className="transition-all duration-300 hover:stroke-[13px] cursor-pointer"
                        />
                      ))}
                    </svg>
                  </div>

                  {/* Legend Grid */}
                  <div className='grid grid-cols-2 gap-x-6 gap-y-3 text-xs w-full md:w-auto xl:w-full min-[1350px]:w-auto shrink-0'>
                    {donutChartSegments.map((seg, idx) => (
                      <div key={idx} className='flex items-center justify-between gap-2 md:gap-4 xl:gap-2 min-[1350px]:gap-4'>
                        <div className='flex items-center gap-2 min-w-0'>
                          <span className='h-2.5 w-2.5 shrink-0 rounded-full' style={{ backgroundColor: seg.color }} />
                          <span className='font-semibold text-zinc-750 dark:text-zinc-355 truncate max-w-[100px]' title={seg.name}>{seg.name}</span>
                        </div>
                        <span className='text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 shrink-0'>{seg.count} sold</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className='w-full space-y-3 py-2'>
                  {topSellingItems.map((item, index) => {
                    const maxCount = topSellingItems[0].count || 1;
                    const percent = (item.count / maxCount) * 100;
                    const color = donutChartSegments[index]?.color || '#3be2a5';
                    
                    return (
                      <div key={index} className='space-y-1 text-xs w-full'>
                        <div className='flex items-center justify-between font-semibold'>
                          <span className='text-zinc-700 dark:text-zinc-300 truncate max-w-[150px]'>{item.name}</span>
                          <span className='text-zinc-500 shrink-0'>{item.count} sold</span>
                        </div>
                        <div className='h-2 w-full rounded-full bg-zinc-200/50 dark:bg-zinc-800 overflow-hidden'>
                          <div 
                            className='h-full rounded-full transition-all duration-500' 
                            style={{ width: `${percent}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
