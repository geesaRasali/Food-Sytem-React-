import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { FiPackage, FiPlusCircle, FiRepeat, FiList, FiTruck, FiUserPlus, FiArrowLeft, FiPlus, FiSearch, FiEdit2, FiTrash2 } from 'react-icons/fi'
import axios from 'axios'
import { toast } from 'react-toastify'
import SupplierManagement from '../SupplierManagement/SupplierManagement'
import Add from '../Add/Add'
import AddMaterial from './AddMaterial'

const materialCategories = [
  'bakery and grains',
  'Beverages',
  'Dairy and egg',
  'Meat & Seafood',
  'Vegetables',
  'Spices',
  'Oils & Dressings',
  'Baking & Sweeteners'
]

// 1. Grid Portal View (Default)
const StockControlGrid = () => {
  const navigate = useNavigate()

  const stockSections = [
    { label: 'Add Supplier', icon: FiUserPlus, description: 'Create and manage supplier records.', href: '/stock-control/add-supplier' },
    { label: 'Add Material', icon: FiRepeat, description: 'Quickly add raw materials to stock workflows.', href: '/stock-control/add-material' },
    { label: 'Stock List', icon: FiList, description: 'Review current stock levels and statuses.', href: '/stock-control/stock-list' },
    { label: 'Supply History', icon: FiPackage, description: 'View logs of incoming supplier shipments.', href: '/stock-control/supply-history' },
    { label: 'Kitchen Transfer List', icon: FiTruck, description: 'Track items moved to kitchen operations.', href: '/stock-control/kitchen-transfer-list' },
  ]

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto animate-fadeIn text-zinc-900 dark:text-zinc-100">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">Stock Control Operations</h1>
        <p className="text-sm text-zinc-555 dark:text-zinc-400 mt-1">Manage warehouse stock, supplier networks, and kitchen transfers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stockSections.map((section, index) => {
          const Icon = section.icon
          return (
            <button
              key={index}
              onClick={() => navigate(section.href)}
              className="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm hover:shadow-md border border-zinc-200 dark:border-zinc-800 hover:border-orange-200 dark:hover:border-orange-950 text-left transition-all duration-300 hover:scale-[1.02] group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500 dark:bg-orange-500/20 group-hover:scale-105 transition-transform">
                  <Icon className="w-6 h-6 flex-shrink-0" />
                </div>
                <div>
                  <h2 className="font-bold text-zinc-900 dark:text-white mb-1">{section.label}</h2>
                  <p className="text-xs text-zinc-555 dark:text-zinc-400 leading-relaxed">{section.description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const StockList = ({ url, adminToken }) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [foods, setFoods] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editPrice, setEditPrice] = useState(0)
  const [editQuantity, setEditQuantity] = useState(0)
  const [editExpiryDate, setEditExpiryDate] = useState('')

  const queryEditId = searchParams.get('editId')

  const fetchFoods = async () => {
    try {
      const res = await axios.get(`${url}/api/food/list`)
      if (res.data.success) {
        const rawMaterials = res.data.data.filter(item => 
          materialCategories.includes(item.category)
        )
        setFoods(rawMaterials)
      }
    } catch (err) {
      toast.error("Failed to load stock list.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFoods()
  }, [url])

  useEffect(() => {
    if (queryEditId && foods.length > 0) {
      const targetItem = foods.find(f => f._id === queryEditId)
      if (targetItem) {
        setEditingId(queryEditId)
        setEditPrice(targetItem.price)
        setEditQuantity(targetItem.quantity)
        setEditExpiryDate(targetItem.expiryDate ? targetItem.expiryDate.split('T')[0] : '')
      }
    }
  }, [queryEditId, foods])

  const handleSave = async (id) => {
    try {
      const response = await axios.post(`${url}/api/food/update`, {
        id,
        price: Number(editPrice),
        quantity: Number(editQuantity),
        expiryDate: editExpiryDate || null
      }, {
        headers: { token: adminToken, Authorization: `Bearer ${adminToken}` }
      })
      if (response.data.success) {
        toast.success("Stock details updated successfully!")
        setEditingId(null)
        fetchFoods()
      } else {
        toast.error(response.data.message || "Failed to update stock.")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error updating stock details.")
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this material from inventory?")) {
      return
    }
    try {
      const response = await axios.post(`${url}/api/food/remove`, { id }, {
        headers: { token: adminToken, Authorization: `Bearer ${adminToken}` }
      })
      if (response.data.success) {
        toast.success("Material deleted from inventory successfully!")
        fetchFoods()
      } else {
        toast.error(response.data.message || "Failed to delete material.")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error deleting material.")
    }
  }

  const filteredFoods = foods.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => (a.quantity || 0) - (b.quantity || 0))

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto animate-fadeIn text-zinc-900 dark:text-zinc-100">


      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Current Stock List</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Comprehensive database of all culinary items and stock values.</p>
          </div>
          <div className="relative max-w-md w-full md:w-80">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search items or categories..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:border-orange-500 focus:outline-none dark:bg-zinc-950 font-medium"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading inventory items...</p>
        ) : filteredFoods.length === 0 ? (
          <p className="text-sm text-zinc-500 py-6 text-center">No inventory matching the search filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="pb-3 pl-2">Image</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Qty Level</th>
                  <th className="pb-3">Expiry Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-850">
                {filteredFoods.map(item => {
                  const stock = item.quantity || 0
                  return (
                    <tr key={item._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                      <td className="py-3 pl-2">
                        <img src={`${url}/images/${item.image}`} alt={item.name} className="h-10 w-10 rounded-lg object-cover border border-zinc-200 dark:border-zinc-800" />
                      </td>
                      <td className="py-3 font-bold text-zinc-855 dark:text-zinc-200">{item.name}</td>
                      <td className="py-3 text-zinc-500">{item.category}</td>
                      
                      {/* Price Cell */}
                      <td className="py-3 font-semibold text-zinc-700 dark:text-zinc-350">
                        {editingId === item._id ? (
                          <div className="flex items-center gap-1 animate-fadeIn">
                            <span className="text-xs text-zinc-400">LKR</span>
                            <input
                              type="number"
                              value={editPrice}
                              onChange={e => setEditPrice(Math.max(0, Number(e.target.value)))}
                              className="w-20 px-2 py-1 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:border-orange-500 focus:outline-none font-bold"
                            />
                          </div>
                        ) : (
                          `LKR ${item.price}`
                        )}
                      </td>

                      {/* Quantity Cell */}
                      <td className="py-3">
                        {editingId === item._id ? (
                          <div className="flex items-center gap-1 animate-fadeIn">
                            <input
                              type="number"
                              value={editQuantity}
                              onChange={e => setEditQuantity(Math.max(0, Number(e.target.value)))}
                              className="w-16 px-2 py-1 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:border-orange-500 focus:outline-none font-bold"
                            />
                            <span className="text-xs text-zinc-400">{item.unit || 'units'}</span>
                          </div>
                        ) : (
                          `${stock} ${item.unit || 'units'}`
                        )}
                      </td>

                      {/* Expiry Date Cell */}
                      <td className="py-3">
                        {editingId === item._id ? (
                          <div className="flex items-center gap-1 animate-fadeIn">
                            <input
                              type="date"
                              value={editExpiryDate}
                              onChange={e => setEditExpiryDate(e.target.value)}
                              className="px-2 py-1 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:border-orange-500 focus:outline-none font-bold text-zinc-700 dark:text-zinc-300"
                            />
                          </div>
                        ) : (
                          item.expiryDate 
                            ? new Date(item.expiryDate).toLocaleDateString('en-LK', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'N/A'
                        )}
                      </td>

                      {/* Status Cell */}
                      <td className="py-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                          stock === 0 
                            ? 'bg-red-100 text-red-650 dark:bg-red-950/20 dark:text-red-400' 
                            : stock <= 10 
                              ? 'bg-orange-100 text-orange-650 dark:bg-orange-950/20 dark:text-orange-400' 
                              : 'bg-emerald-100 text-emerald-650 dark:bg-emerald-950/20 dark:text-[#10b981]'
                        }`}>
                          {stock === 0 ? 'Out of Stock' : stock <= 10 ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>

                      {/* Actions Cell */}
                      <td className="py-3 pr-2 text-right">
                        {editingId === item._id ? (
                          <div className="flex items-center justify-end gap-1.5 animate-fadeIn">
                            <button
                              onClick={() => handleSave(item._id)}
                              className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider shadow-sm transition active:scale-95 cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition active:scale-95 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingId(item._id)
                                setEditPrice(item.price)
                                setEditQuantity(stock)
                                setEditExpiryDate(item.expiryDate ? item.expiryDate.split('T')[0] : '')
                              }}
                              className="p-1.5 text-zinc-450 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-xl transition cursor-pointer"
                              title="Update Stock/Price"
                            >
                              <FiEdit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="p-1.5 text-zinc-450 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition cursor-pointer"
                              title="Delete Material"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// 4. Kitchen Transfer Component
const KitchenTransferList = ({ url, adminToken }) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [foods, setFoods] = useState([])
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)

  const preselectedMaterialId = searchParams.get('materialId')

  const [formData, setFormData] = useState({
    materialId: preselectedMaterialId || '',
    quantity: '',
    kitchenSection: 'Salad Station'
  })

  const kitchenSections = [
  "Salad Station",
  "Rolls Station",
  "Sandwich Station",
  "Pasta Station",
  "Noodles Station",
  "Koththu Station",
  "Vegetarian Station",
  "Dessert & Bakery Station"
];

  const fetchData = async () => {
    try {
      const [resFoods, resTransfers] = await Promise.all([
        axios.get(`${url}/api/food/list`),
        axios.get(`${url}/api/food/transfers`, {
          headers: { token: adminToken, Authorization: `Bearer ${adminToken}` }
        })
      ])

      if (resFoods.data.success) {
        const rawMaterials = resFoods.data.data.filter(item => 
          materialCategories.includes(item.category)
        )
        setFoods(rawMaterials)
        if (rawMaterials.length > 0 && !formData.materialId) {
          const initialId = preselectedMaterialId || rawMaterials[0]._id
          setFormData(prev => ({ ...prev, materialId: initialId }))
        }
      }

      if (resTransfers.data.success) {
        setTransfers(resTransfers.data.data)
      }
    } catch (err) {
      toast.error("Failed to load kitchen transfer data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [url, adminToken])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      toast.warn("Please enter a valid transfer quantity.")
      return
    }

    const selectedItem = foods.find(f => f._id === formData.materialId)
    if (!selectedItem) return

    if ((selectedItem.quantity || 0) < Number(formData.quantity)) {
      toast.error(`Insufficient stock. Only ${selectedItem.quantity} ${selectedItem.unit || 'units'} available.`)
      return
    }

    try {
      const response = await axios.post(`${url}/api/food/transfers/add`, {
        materialId: formData.materialId,
        quantity: Number(formData.quantity),
        recipientSection: formData.kitchenSection
      }, {
        headers: { token: adminToken, Authorization: `Bearer ${adminToken}` }
      })

      if (response.data.success) {
        toast.success("Stock transferred to kitchen successfully!")
        setFormData(prev => ({ ...prev, quantity: '' }))
        fetchData()
      } else {
        const errMsg = response.data.error 
          ? `${response.data.message}: ${response.data.error}` 
          : (response.data.message || "Failed to perform kitchen transfer.");
        toast.error(errMsg);
      }
    } catch (err) {
      console.error(err)
      toast.error("Error executing kitchen transfer.")
    }
  }

  const selectedItem = foods.find(f => f._id === formData.materialId)

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto animate-fadeIn text-zinc-900 dark:text-zinc-100">
      
      {/* 1. Send Stock to Kitchen Form */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm mb-8">
        <h2 className="text-xl font-black mb-1 tracking-tight">Send Stock to Kitchen</h2>
        <p className="text-xs text-zinc-550 dark:text-zinc-400 mb-6">Dispatch materials directly to active food preparation sections.</p>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading stock materials...</p>
        ) : foods.length === 0 ? (
          <p className="text-sm text-zinc-500">No raw materials in stock to transfer.</p>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ml-1">Select Material</label>
              <select
                value={formData.materialId}
                onChange={e => setFormData({ ...formData, materialId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:border-orange-500 focus:outline-none dark:bg-zinc-950 font-bold"
              >
                {foods.map(f => (
                  <option key={f._id} value={f._id}>{f.name} ({f.quantity} {f.unit || 'units'} left)</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ml-1">Kitchen Section</label>
              <select
                value={formData.kitchenSection}
                onChange={e => setFormData({ ...formData, kitchenSection: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:border-orange-500 focus:outline-none dark:bg-zinc-950 font-bold"
              >
                {kitchenSections.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ml-1">
                Qty to Send {selectedItem ? `(${selectedItem.unit || 'units'})` : ''}
              </label>
              <input
                type="number"
                placeholder="e.g. 10"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:border-orange-500 focus:outline-none dark:bg-zinc-950 font-bold"
                required
              />
            </div>

            <button type="submit" className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-md transition active:scale-[0.98] cursor-pointer">
              Send to Kitchen
            </button>
          </form>
        )}
      </div>

      {/* 2. Kitchen Stock Transfers History Log */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-black tracking-tight">Kitchen Stock Transfers History</h2>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-0.5">Logs of items dispatched from primary store to active culinary lines.</p>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading transfers history...</p>
        ) : transfers.length === 0 ? (
          <p className="text-sm text-zinc-500 py-6 text-center">No transfer records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-450 uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="pb-3 pl-2">Date / Time</th>
                  <th className="pb-3">Item Dispatch</th>
                  <th className="pb-3">Qty Moved</th>
                  <th className="pb-3">Recipient Section</th>
                  <th className="pb-3 pr-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-850">
                {transfers.map(trf => (
                  <tr key={trf._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                    <td className="py-4 pl-2 text-zinc-500 text-xs">
                      {new Date(trf.date).toLocaleString()}
                    </td>
                    <td className="py-4 font-bold text-zinc-850 dark:text-zinc-200">{trf.materialName}</td>
                    <td className="py-4 font-semibold text-orange-600">{trf.quantity} {trf.unit}</td>
                    <td className="py-4 text-zinc-655 dark:text-zinc-400 font-medium">{trf.recipientSection}</td>
                    <td className="py-4 pr-2 text-right">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-650 dark:bg-emerald-950/20 dark:text-emerald-400">
                        Completed
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
  )
}

// 5. Supply History Component
const SupplyHistory = ({ url, adminToken }) => {
  const navigate = useNavigate()
  const [supplies, setSupplies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSupplies = async () => {
      try {
        const response = await axios.get(`${url}/api/food/supplies`, {
          headers: { token: adminToken, Authorization: `Bearer ${adminToken}` }
        })
        if (response.data.success) {
          setSupplies(response.data.data)
        }
      } catch (error) {
        toast.error("Failed to load supply history.")
      } finally {
        setLoading(false)
      }
    }
    fetchSupplies()
  }, [url, adminToken])

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto animate-fadeIn text-zinc-900 dark:text-zinc-100">


      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-black tracking-tight"> Supply History</h2>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-0.5">View the history of all supplied inventory items.</p>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading supply records...</p>
        ) : supplies.length === 0 ? (
          <p className="text-sm text-zinc-500 py-6 text-center">No supply records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-450 uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="pb-3 pl-2">Date / Time</th>
                  <th className="pb-3">Material Name</th>
                  <th className="pb-3">Supplier Name</th>
                  <th className="pb-3">Quantity Supplied</th>
                  <th className="pb-3 pr-2 text-right">Cost Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-850">
                {supplies.map(log => (
                  <tr key={log._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                    <td className="py-4 pl-2 text-zinc-500 text-xs">
                      {new Date(log.date).toLocaleString()}
                    </td>
                    <td className="py-4 font-bold text-zinc-850 dark:text-zinc-200">{log.materialName}</td>
                    <td className="py-4 font-semibold text-zinc-700 dark:text-zinc-350">{log.supplierName}</td>
                    <td className="py-4 font-bold text-orange-600">{log.quantity} {log.unit || 'units'}</td>
                    <td className="py-4 pr-2 text-right font-semibold text-zinc-700 dark:text-zinc-300">LKR {log.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// 6. Main Component — uses location-based rendering (avoids nested Routes matching issues)
const StockControl = ({ url, adminToken }) => {
  const location = useLocation()
  const subPath = location.pathname.replace(/^\/stock-control\/?/, '') // e.g. 'stock-list'

  if (subPath === 'add-supplier') {
    return <SupplierManagement url={url} adminToken={adminToken} />
  }
  if (subPath === 'stock-list') {
    return <StockList url={url} adminToken={adminToken} />
  }
  if (subPath === 'kitchen-transfer-list') {
    return <KitchenTransferList url={url} adminToken={adminToken} />
  }
  if (subPath === 'add-material') {
    return <AddMaterial url={url} adminToken={adminToken} />
  }
  if (subPath === 'supply-history') {
    return <SupplyHistory url={url} adminToken={adminToken} />
  }
  // Default: show the grid portal
  return <StockControlGrid />
}

export default StockControl