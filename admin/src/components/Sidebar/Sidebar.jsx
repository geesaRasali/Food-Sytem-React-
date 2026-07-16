import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiPlusCircle,
  FiList,
  FiShoppingBag,
  FiDatabase,
  FiUsers,
  FiClock,
  FiTruck,
  FiUserCheck,
  FiMail,
  FiTrendingUp,
  FiSettings,
  FiChevronDown,
  FiUserPlus,
  FiRepeat,
  FiUser,
  FiPackage,
} from "react-icons/fi";
import { hasPermission } from "../../config/rbac";
import logo from "../../assets/logo.png";

const Sidebar = ({ adminUser, pendingMessagesCount = 0 }) => {
  const location = useLocation();
  const role = adminUser?.role;
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isKitchenOpen, setIsKitchenOpen] = useState(false);

  
  const isKitchenTabActive = (tabName) => {
    if (location.pathname !== "/kitchen-monitoring") return false;
    const currentTab = new URLSearchParams(location.search).get("tab") || "orders";
    return currentTab === tabName;
  };

  useEffect(() => {
    if (location.pathname.startsWith("/stock-control")) {
      setIsStockOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (
      location.pathname === "/categories" ||
      location.pathname === "/add" ||
      location.pathname === "/list" 

    ) {
      setIsMenuOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname.startsWith("/kitchen-monitoring") || location.pathname === "/kitchen-stock") {
      setIsKitchenOpen(true);
    }
  }, [location.pathname]);

  const showDashboard = hasPermission(role, "dashboard");
  const showOrders = hasPermission(role, "orders");
  const showAddFood = hasPermission(role, "addFood");
  const showListFood = hasPermission(role, "listFood");
  const showCategories = hasPermission(role, "categories");
  const showStockControl = hasPermission(role, "stockControl");
  const showKitchenMonitoring = hasPermission(role, "kitchenMonitoring");
  const showDeliveryMonitoring = hasPermission(role, "deliveryMonitoring");
  const showStaffUsers = hasPermission(role, "staffUsers");
  const showMessages = hasPermission(role, "messages");
  const showReports = hasPermission(role, "reports");
  const showSettings = hasPermission(role, "settings");

  const isStockControlActive = location.pathname.startsWith("/stock-control");

  return (
    <aside className="fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] w-[18%] bg-white text-zinc-650 border-r border-zinc-200 dark:bg-[#0b090c] dark:text-[#a099b0] dark:border-[#1a1722] flex flex-col justify-between 
    overflow-y-auto select-none font-sans scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
      
      <div className="p-5 flex justify-center items-center border-b border-orange-100 bg-[#fffcf9] dark:border-[#1a1722] dark:bg-[#0e0c12]">
        <img
          src={logo}
          alt="Urban Foods Logo"
          className="h-10 object-contain"
        />
      </div>

      <nav className="flex-1 px-3 py-5 space-y-6">
        
        {(showDashboard || showOrders) && (
          <div className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-zin-400 dark:text-[#635c72]">
              Core Operations
            </p>
            <div className="space-y-0.5">
              {showDashboard && (
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-205 ${
                      isActive
                        ? "bg-orange-50 text-orange-600 border-l-4 border-l-orange-500 pl-2 dark:bg-[#2a170c] dark:text-orange-400 dark:border-l-orange-500"
                        : "text-zinc-600 hover:bg-orange-50/60 hover:text-orange-600 dark:text-[#a099b0] dark:hover:bg-[#15121b]/80 dark:hover:text-white"
                    }`
                  }
                >
                  <FiGrid className="w-5 h-5 flex-shrink-0 text-orange-500 dark:text-orange-400" />
                  <span>Dashboard</span>
                </NavLink>
              )}

              {(showAddFood || showListFood || showCategories) && (
                <div className="space-y-0.5 mb-1">
                  <button
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-205 text-zinc-600 hover:bg-orange-50/60 hover:text-orange-600 dark:text-[#a099b0] dark:hover:bg-[#15121b]/80 dark:hover:text-white cursor-pointer ${
                      isMenuOpen ? "text-orange-600 bg-orange-50/30 dark:bg-transparent dark:text-orange-400 font-bold" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FiDatabase className="w-5 h-5 flex-shrink-0 text-orange-500 dark:text-orange-400" />
                      <span>Menu Management</span>
                    </div>
                    <FiChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isMenuOpen && (
                    <div className="pl-6 space-y-0.5 border-l border-orange-100 dark:border-[#1a1722] ml-5 mt-1 mb-1">

                       {showCategories && (
                        <NavLink
                          to="/categories"
                          className={({ isActive }) =>
                            `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                              isActive
                                ? "bg-orange-50 text-orange-600 dark:bg-[#2a170c] dark:text-orange-400"
                                : "text-zinc-550 hover:bg-orange-50/65 hover:text-orange-600 dark:text-[#a099b0]/80 dark:hover:bg-[#15121b]/80 dark:hover:text-white"
                            }`
                          }
                        >
                          <FiGrid className="w-4 h-4 text-orange-500/80 dark:text-orange-400/80" />
                          <span>Categories</span>
                        </NavLink>
                      )}
                       {showAddFood && (
                        <NavLink
                          to="/add"
                          className={({ isActive }) =>
                            `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                              isActive
                                ? "bg-orange-50 text-orange-600 dark:bg-[#2a170c] dark:text-orange-400"
                                : "text-zinc-550 hover:bg-orange-50/65 hover:text-orange-600 dark:text-[#a099b0]/80 dark:hover:bg-[#15121b]/80 dark:hover:text-white"
                            }`
                          }
                        >
                          <FiPlusCircle className="w-4 h-4 text-orange-500/80 dark:text-orange-400/80" />
                          <span>Add Item</span>
                        </NavLink>
                      )}
                    
                      {showListFood && (
                        <NavLink
                          to="/list"
                          className={({ isActive }) =>
                            `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                              isActive
                                ? "bg-orange-50 text-orange-600 dark:bg-[#2a170c] dark:text-orange-400"
                                : "text-zinc-550 hover:bg-orange-50/65 hover:text-orange-600 dark:text-[#a099b0]/80 dark:hover:bg-[#15121b]/80 dark:hover:text-white"
                            }`
                          }
                        >
                          <FiList className="w-4 h-4 text-orange-500/80 dark:text-orange-400/80" />
                          <span>Item List</span>
                        </NavLink>
                      )}
                   
                    </div>
                  )}
                </div>
              )}

              {showOrders && (
                <NavLink
                  to="/orders"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-orange-50 text-orange-600 border-l-4 border-l-orange-500 pl-2 dark:bg-[#2a170c] dark:text-orange-400 dark:border-l-orange-500"
                        : "text-zinc-600 hover:bg-orange-50/60 hover:text-orange-600 dark:text-[#a099b0] dark:hover:bg-[#15121b]/80 dark:hover:text-white"
                    }`
                  }
                >
                  <FiShoppingBag className="w-5 h-5 flex-shrink-0 text-orange-500 dark:text-orange-400" />
                  <span>Order Management</span>
                </NavLink>
              )}
            </div>
          </div>
        )}

        {/* SECTION 2: INVENTORY & MONITORING */}
        {(showStockControl || showKitchenMonitoring || showDeliveryMonitoring) && (
          <div className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#635c72]">
              Inventory &amp; Monitoring
            </p>
            <div className="space-y-0.5">
              {showStockControl && (
                <div className="space-y-0.5">
                  <button
                    onClick={() => setIsStockOpen((prev) => !prev)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-205 text-zinc-600 hover:bg-orange-50/60 hover:text-orange-600 dark:text-[#a099b0] dark:hover:bg-[#15121b]/80 dark:hover:text-white ${
                      isStockOpen ? "text-orange-650 bg-orange-50/30 dark:bg-transparent dark:text-orange-400" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FiDatabase className="w-5 h-5 flex-shrink-0 text-orange-500 dark:text-orange-400" />
                      <span>Stock Control</span>
                    </div>
                    <FiChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isStockOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isStockOpen && (
                    <div className="pl-6 space-y-0.5 border-l border-orange-100 dark:border-[#1a1722] ml-5 mt-1">
                      <NavLink
                        to="/stock-control/add-supplier"
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? "bg-orange-50 text-orange-600 dark:bg-[#2a170c] dark:text-orange-400"
                              : "text-zinc-550 hover:bg-orange-50/65 hover:text-orange-600 dark:text-[#a099b0]/80 dark:hover:bg-[#15121b]/80 dark:hover:text-white"
                          }`
                        }
                      >
                        <FiUserPlus className="w-4 h-4 text-orange-500/80 dark:text-orange-400/80" />
                        <span>Add Supplier</span>
                      </NavLink>
                      <NavLink
                        to="/stock-control/add-material"
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? "bg-orange-50 text-orange-600 dark:bg-[#2a170c] dark:text-orange-400"
                              : "text-zinc-550 hover:bg-orange-50/65 hover:text-orange-600 dark:text-[#a099b0]/80 dark:hover:bg-[#15121b]/80 dark:hover:text-white"
                          }`
                        }
                      >
                        <FiRepeat className="w-4 h-4 text-orange-500/80 dark:text-orange-400/80" />
                        <span>Add Material</span>
                      </NavLink>

                      <NavLink
                        to="/stock-control/stock-list"
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? "bg-orange-50 text-orange-600 dark:bg-[#2a170c] dark:text-orange-400"
                              : "text-zinc-550 hover:bg-orange-50/65 hover:text-orange-600 dark:text-[#a099b0]/80 dark:hover:bg-[#15121b]/80 dark:hover:text-white"
                          }`
                        }
                      >
                        <FiList className="w-4 h-4 text-orange-500/80 dark:text-orange-400/80" />
                        <span>Stock List</span>
                      </NavLink>

                      <NavLink
                        to="/stock-control/supply-history"
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? "bg-orange-50 text-orange-600 dark:bg-[#2a170c] dark:text-orange-400"
                              : "text-zinc-550 hover:bg-orange-50/65 hover:text-orange-600 dark:text-[#a099b0]/80 dark:hover:bg-[#15121b]/80 dark:hover:text-white"
                          }`
                        }
                      >
                        <FiPackage className="w-4 h-4 text-orange-500/80 dark:text-orange-400/80" />
                        <span>Supply History</span>
                      </NavLink>

                      <NavLink
                        to="/stock-control/kitchen-transfer-list"
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? "bg-orange-50 text-orange-600 dark:bg-[#2a170c] dark:text-orange-400"
                              : "text-zinc-550 hover:bg-orange-50/65 hover:text-orange-600 dark:text-[#a099b0]/80 dark:hover:bg-[#15121b]/80 dark:hover:text-white"
                          }`
                        }
                      >
                        <FiTruck className="w-4 h-4 text-orange-500/80 dark:text-orange-400/80" />
                        <span>Kitchen Transfer List</span>
                      </NavLink>
                      
                    </div>
                  )}
                </div>
              )}

              {showKitchenMonitoring && (
                <div className="space-y-0.5">
                  <button
                    onClick={() => setIsKitchenOpen((prev) => !prev)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-205 text-zinc-600 hover:bg-orange-50/60 hover:text-orange-600 dark:text-[#a099b0] dark:hover:bg-[#15121b]/80 dark:hover:text-white cursor-pointer ${
                      isKitchenOpen ? "text-orange-600 bg-orange-50/30 dark:bg-transparent dark:text-orange-400 font-bold" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FiClock className="w-5 h-5 flex-shrink-0 text-orange-500 dark:text-orange-400" />
                      <span>Kitchen Management</span>
                    </div>
                    <FiChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isKitchenOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isKitchenOpen && (
                    <div className="pl-6 space-y-0.5 border-l border-orange-100 dark:border-[#1a1722] ml-5 mt-1 mb-1">
                      <NavLink
                        to="/kitchen-monitoring?tab=dashboard"
                        className={() =>
                          `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isKitchenTabActive("dashboard")
                              ? "bg-orange-50 text-orange-600 dark:bg-[#2a170c] dark:text-orange-400"
                              : "text-zinc-550 hover:bg-orange-50/65 hover:text-orange-600 dark:text-[#a099b0]/80 dark:hover:bg-[#15121b]/80 dark:hover:text-white"
                          }`
                        }
                      >
                        <span className="text-sm">🏠</span>
                        <span>Dashboard</span>
                      </NavLink>

                      <NavLink
                        to="/kitchen-monitoring?tab=orders"
                        className={() =>
                          `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isKitchenTabActive("orders")
                              ? "bg-orange-50 text-orange-600 dark:bg-[#2a170c] dark:text-orange-400"
                              : "text-zinc-550 hover:bg-orange-50/65 hover:text-orange-600 dark:text-[#a099b0]/80 dark:hover:bg-[#15121b]/80 dark:hover:text-white"
                          }`
                        }
                      >
                        <span className="text-sm">📋</span>
                        <span>Kitchen Orders</span>
                      </NavLink>

                      <NavLink
                        to="/kitchen-stock"
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? "bg-orange-50 text-orange-600 dark:bg-[#2a170c] dark:text-orange-400"
                              : "text-zinc-550 hover:bg-orange-50/65 hover:text-orange-600 dark:text-[#a099b0]/80 dark:hover:bg-[#15121b]/80 dark:hover:text-white"
                          }`
                        }
                      >
                        <span className="text-sm">🥫</span>
                        <span>Kitchen Stock</span>
                      </NavLink>

                      <NavLink
                        to="/kitchen-monitoring?tab=history"
                        className={() =>
                          `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isKitchenTabActive("history")
                              ? "bg-orange-50 text-orange-600 dark:bg-[#2a170c] dark:text-orange-400"
                              : "text-zinc-550 hover:bg-orange-50/65 hover:text-orange-600 dark:text-[#a099b0]/80 dark:hover:bg-[#15121b]/80 dark:hover:text-white"
                          }`
                        }
                      >
                        <span className="text-sm">📜</span>
                        <span>Order History</span>
                      </NavLink>

                    </div>
                  )}
                </div>
              )}

              {showDeliveryMonitoring && (
                <NavLink
                  to="/delivery-monitoring"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-orange-50 text-orange-600 border-l-4 border-l-orange-500 pl-2 dark:bg-[#2a170c] dark:text-orange-400 dark:border-l-orange-500"
                        : "text-zinc-600 hover:bg-orange-50/60 hover:text-orange-600 dark:text-[#a099b0] dark:hover:bg-[#15121b]/80 dark:hover:text-white"
                    }`
                  }
                >
                  <FiTruck className="w-5 h-5 flex-shrink-0 text-orange-500 dark:text-orange-400" />
                  <span>Delivery Monitoring</span>
                </NavLink>
              )}
            </div>
          </div>
        )}

       
        {(showStaffUsers || showMessages || showReports || showSettings) && (
          <div className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#635c72]">
              Administration
            </p>
            <div className="space-y-0.5">
              {showStaffUsers && (
                <NavLink
                  to="/staff-users"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-orange-50 text-orange-600 border-l-4 border-l-orange-500 pl-2 dark:bg-[#2a170c] dark:text-orange-400 dark:border-l-orange-500"
                        : "text-zinc-600 hover:bg-orange-50/60 hover:text-orange-600 dark:text-[#a099b0] dark:hover:bg-[#15121b]/80 dark:hover:text-white"
                    }`
                  }
                >
                  <FiUserCheck className="w-5 h-5 flex-shrink-0 text-orange-500 dark:text-orange-400" />
                  <span>Staff User Management</span>
                </NavLink>
              )}

              {showMessages && (
                <NavLink
                  to="/admin/messages"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-orange-50 text-orange-600 border-l-4 border-l-orange-500 pl-2 dark:bg-[#2a170c] dark:text-orange-400 dark:border-l-orange-500"
                        : "text-zinc-600 hover:bg-orange-50/60 hover:text-orange-600 dark:text-[#a099b0] dark:hover:bg-[#15121b]/80 dark:hover:text-white"
                    }`
                  }
                >
                  <FiMail className="w-5 h-5 flex-shrink-0 text-orange-500 dark:text-orange-400" />
                  <span className="flex-1">Customer Messages</span>
                  {pendingMessagesCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {pendingMessagesCount}
                    </span>
                  )}
                </NavLink>
              )}

              {showReports && (
                <NavLink
                  to="/reports-analytics"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-orange-50 text-orange-600 border-l-4 border-l-orange-500 pl-2 dark:bg-[#2a170c] dark:text-orange-400 dark:border-l-orange-500"
                        : "text-zinc-600 hover:bg-orange-50/60 hover:text-orange-600 dark:text-[#a099b0] dark:hover:bg-[#15121b]/80 dark:hover:text-white"
                    }`
                  }
                >
                  <FiTrendingUp className="w-5 h-5 flex-shrink-0 text-orange-500 dark:text-orange-400" />
                  <span>Reports &amp; Analytics</span>
                </NavLink>
              )}

              {showSettings && (
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-orange-50 text-orange-600 border-l-4 border-l-orange-500 pl-2 dark:bg-[#2a170c] dark:text-orange-400 dark:border-l-orange-500"
                        : "text-zinc-600 hover:bg-orange-50/60 hover:text-orange-600 dark:text-[#a099b0] dark:hover:bg-[#15121b]/80 dark:hover:text-white"
                    }`
                  }
                >
                  <FiUser className="w-5 h-5 flex-shrink-0 text-orange-500 dark:text-orange-400" />
                  <span>Profile Settings</span>
                </NavLink>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-zinc-150 text-center text-[10px] text-zinc-400 bg-zinc-50/50 dark:border-[#1a1722] dark:text-zinc-600 dark:bg-[#08070b]">
        <p>&copy; 2026 Urban Foods</p>
      </div>
    </aside>
  );
};

export default Sidebar;
