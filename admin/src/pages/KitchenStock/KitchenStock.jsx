import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  FiPackage,
  FiSearch,
  FiRefreshCw,
  FiCheckCircle,
  FiBox,
  FiCalendar,
  FiLayers,
} from 'react-icons/fi';

const POLL_INTERVAL = 30000;

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const KitchenStock = ({ url, adminToken }) => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchTransfers = useCallback(
    async (silent = false) => {
      if (!url) return;
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const response = await axios.get(`${url}/api/food/transfers?status=Completed`, {
          headers: {
            token: adminToken,
            Authorization: `Bearer ${adminToken}`,
          },
        });
        if (response.data?.success) {
          
          const completed = (response.data.data || []).filter(
            (t) => !t.status || t.status === 'Completed'
          );
          setTransfers(completed);
          setLastUpdated(new Date());
        } else {
          if (!silent) toast.error('Failed to load kitchen stock records.');
        }
      } catch (err) {
        console.error('Error fetching kitchen stock transfers:', err);
        if (!silent) toast.error('Error loading kitchen stock data.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [url, adminToken]
  );

 
  useEffect(() => {
    fetchTransfers(false);
  }, [fetchTransfers]);

  // Auto-refresh
  useEffect(() => {
    const timer = setInterval(() => {
      fetchTransfers(true);
    }, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchTransfers]);

  
  const categories = [
    'All',
    ...Array.from(new Set(transfers.map((t) => t.category).filter(Boolean))),
  ];

  //search + category
  const filtered = transfers.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      t.materialName?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q) ||
      t.recipientSection?.toLowerCase().includes(q);
    const matchesCategory =
      categoryFilter === 'All' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

 
  const totalItems = transfers.length;
  const uniqueMaterials = new Set(transfers.map((t) => t.materialName)).size;
  const uniqueSections = new Set(transfers.map((t) => t.recipientSection)).size;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto text-zinc-900 dark:text-zinc-100">
      {}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500 dark:bg-orange-500/20">
              <FiPackage className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
              Kitchen Stock
            </h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-[3.25rem]">
            Materials received from the Storekeeper via kitchen transfer.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            id="kitchen-stock-refresh-btn"
            onClick={() => fetchTransfers(false)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 dark:hover:bg-zinc-800 transition-all cursor-pointer disabled:opacity-60"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/30 rounded-xl flex-shrink-0">
            <FiCheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wide">
              Total Transfers
            </p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">{totalItems}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-100 dark:bg-orange-950/30 rounded-xl flex-shrink-0">
            <FiBox className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wide">
              Unique Materials
            </p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">{uniqueMaterials}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-950/30 rounded-xl flex-shrink-0">
            <FiLayers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wide">
              Kitchen Sections
            </p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">{uniqueSections}</p>
          </div>
        </div>
      </div>

      
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">
            Transfer Records
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            All completed stock dispatches from store to kitchen sections.
          </p>
        </div>

     
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
         
          <div className="relative flex-1 max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              id="kitchen-stock-search"
              type="text"
              placeholder="Search material, category, section…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          
          <select
            id="kitchen-stock-category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all font-medium cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            <p className="text-sm text-zinc-400">Loading kitchen stock records…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
              <FiPackage className="w-8 h-8 text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
              {searchQuery || categoryFilter !== 'All'
                ? 'No records match your search.'
                : 'No completed kitchen stock transfers found.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="pb-3 pl-2">#</th>
                  <th className="pb-3">Material Name</th>
                  <th className="pb-3">Quantity</th>
                  <th className="pb-3">Kitchen Section</th>
                  <th className="pb-3">
                    <div className="flex items-center gap-1">
                      <FiCalendar className="w-3 h-3" />
                      Transfer Date
                    </div>
                  </th>
                  <th className="pb-3 pr-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                {filtered.map((trf, index) => (
                  <tr
                    key={trf._id}
                    className="hover:bg-orange-50/40 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="py-4 pl-2 text-xs text-zinc-400 font-mono">{index + 1}</td>

                    <td className="py-4 font-bold text-zinc-850 dark:text-zinc-200">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0 inline-block" />
                        {trf.materialName}
                      </div>
                    </td>

                    <td className="py-4 font-bold text-orange-600 dark:text-orange-400">
                      {trf.quantity}{' '}
                      <span className="text-xs font-semibold text-zinc-400">{trf.unit}</span>
                    </td>

                    <td className="py-4 font-medium text-zinc-600 dark:text-zinc-300">
                      {trf.recipientSection}
                    </td>

                    <td className="py-4 text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDate(trf.date)}
                    </td>

                    <td className="py-4 pr-2 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                        <FiCheckCircle className="w-3 h-3" />
                        {trf.status || 'Completed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenStock;
