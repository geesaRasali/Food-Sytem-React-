import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FiPackage, FiSearch, FiTag, FiTrash2, FiEdit } from 'react-icons/fi'

// Categories that belong to Stock Control, not the menu item list
const MATERIAL_CATEGORIES = new Set([
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
  'meat & poultry',
])

const List = ({ url, adminToken }) => {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [editItem, setEditItem] = useState(null)
  const [editPrice, setEditPrice] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const fetchList = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${url}/api/food/list`)

      if (response.data.success) {
        // Exclude raw-material / stock items — only show actual menu food items
        const menuItems = (response.data.data || []).filter(
          (item) => !item.category || !MATERIAL_CATEGORIES.has(item.category.toLowerCase())
        )
        setList(menuItems)
      } else {
        toast.error(response.data.message || 'Unable to load items')
      }
    } catch (error) {
      toast.error('Failed to fetch food items')
    } finally {
      setLoading(false)
    }
  }

  const removeFood = async (foodId) => {
    try {
      const response = await axios.post(
        `${url}/api/food/remove`,
        { id: foodId },
        { headers: { token: adminToken, Authorization: `Bearer ${adminToken}` } },
      )

      if (response.data.success) {
        toast.success('Item removed successfully')
        await fetchList()
      } else {
        toast.error(response.data.message || 'Error removing food item')
      }
    } catch (error) {
      toast.error('Failed to remove food item')
    }
  }

  const openEditPrice = (item) => {
    setEditItem(item)
    setEditPrice(item?.price ?? '')
  }

  const closeEditPrice = () => {
    setEditItem(null)
    setEditPrice('')
  }

  const updateFoodPrice = async (event) => {
    event.preventDefault()

    if (!editItem?._id) {
      return
    }

    const nextPrice = Number(editPrice)

    if (Number.isNaN(nextPrice) || nextPrice < 0) {
      toast.error('Please enter a valid price')
      return
    }

    try {
      setSavingEdit(true)
      const response = await axios.post(
        `${url}/api/food/update`,
        { id: editItem._id, price: nextPrice },
        { headers: { token: adminToken, Authorization: `Bearer ${adminToken}` } },
      )

      if (response.data.success) {
        toast.success('Price updated successfully')
        closeEditPrice()
        await fetchList()
      } else {
        toast.error(response.data.message || 'Error updating price')
      }
    } catch (error) {
      toast.error('Failed to update price')
    } finally {
      setSavingEdit(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  const filteredList = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return list

    return list.filter((item) => {
      const name = String(item?.name || '').toLowerCase()
      const category = String(item?.category || '').toLowerCase()
      return name.includes(normalizedQuery) || category.includes(normalizedQuery)
    })
  }, [list, query])

  return (
    <section className='min-h-[calc(100vh-4rem)] bg-zinc-50 px-4 py-5 dark:bg-zinc-900 md:px-6'>
      <div className='mx-auto max-w-7xl'>
        <div className='mb-4 overflow-hidden rounded-2xl border border-orange-100 bg-linear-to-r from-white via-orange-50/65 to-amber-50/65 px-4 py-4 shadow-[0_10px_30px_rgba(249,115,22,0.08)] dark:border-zinc-700 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800 md:px-5'>
          <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
            <div>
              <p className='text-xs font-bold uppercase tracking-[0.18em] text-orange-600'>Inventory</p>
              <h1 className='mt-1.5 text-2xl font-black tracking-tight text-zinc-900 to-black:text-zinc-100'>Food Items</h1>
              <p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>Compact view for fast admin management.</p>
            </div>

            <div className='grid grid-cols-2 gap-2'>
              <div className='rounded-lg border border-zinc-200 bg-white px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-800'>
                <p className='text-[12px] font-semibold uppercase tracking-wide text-zinc-400'>Total</p>
                <p className='text-sm font-bold text-zinc-800 dark:text-zinc-100'>{list.length} items</p>
              </div>
              
            </div>
          </div>

          <div className='mt-3 flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800'>
            <FiSearch className='text-zinc-400' />
            <input
              type='text'
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='name or category'
              className='w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-100'
            />
          </div>
        </div>

        {loading ? (
          <div className='flex h-56 items-center justify-center rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'>
            <div className='h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent' />
          </div>
        ) : filteredList.length === 0 ? (
          <div className='flex h-56 flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'>
            <FiPackage size={40} className='mb-3 text-zinc-300' />
            <p className='text-sm font-medium text-zinc-500 dark:text-zinc-400'>No food items found.</p>
          </div>
        ) : (
          <div className='overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_10px_25px_rgba(15,23,42,0.06)] dark:border-zinc-700 dark:bg-zinc-900'>
            <div className='hidden grid-cols-[72px_1.8fr_1fr_0.8fr_130px] items-center gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-[14 px] font-bold uppercase tracking-wider text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-300 md:grid'>
              <span>Image</span>
              <span>Item</span>
              <span>Category</span>
              <span>Price</span>
              <span className='text-center'>Action</span>
            </div>

            <div className='divide-y divide-zinc-100 dark:divide-zinc-800'>
              {filteredList.map((item) => (
                <div key={item._id} className='px-3 py-3 md:px-4'>
                  <div className='grid items-center gap-3 md:grid-cols-[72px_1.8fr_1fr_0.8fr_130px]'>
                    <div className='h-14 w-16 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700'>
                      <img src={`${url}/images/${item.image}`} alt={item.name} className='h-full w-full object-cover' />
                    </div>

                    <div className='min-w-0'>
                      <p className='truncate text-sm font-bold text-zinc-900 dark:text-zinc-100'>{item.name}</p>
                      <p className='text-[10px] uppercase tracking-wide text-zinc-400'>ID: {String(item._id).slice(-8)}</p>
                    </div>

                    <div>
                      <span className='inline-flex items-center gap-1 rounded-full bg-orange-100/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-orange-700 dark:bg-orange-500/15 dark:text-orange-300'>
                        <FiTag size={14} />
                        {item.category}
                      </span>
                    </div>

                    <p className='text-sm font-black text-zinc-800 dark:text-zinc-100'>LKR {Number(item.price).toLocaleString()}</p>

                    <div className='md:flex md:justify-center'> 
                      <div className='mt-2 flex w-full items-center gap-2 md:mt-0 md:w-auto'>
                        <button
                          type='button'
                          onClick={() => openEditPrice(item)}
                          className='inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-500 hover:text-white dark:bg-amber-500/10 dark:text-amber-300'
                        >
                          <FiEdit size={14} />
                          Edit
                        </button>

                        <button
                          type='button'
                          onClick={() => removeFood(item._id)}
                          className='inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-500 hover:text-white dark:bg-red-500/10 dark:text-red-400'
                        >
                          <FiTrash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {editItem ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm'>
          <div className='w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <p className='text-xs font-bold uppercase tracking-[0.18em] text-orange-600'>Edit price</p>
                <h2 className='mt-1 text-xl font-black text-zinc-900 dark:text-zinc-100'>{editItem.name}</h2>
                <p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>Update only the item price from the list.</p>
              </div>
              <button
                type='button'
                onClick={closeEditPrice}
                className='rounded-full p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
              >
                <span className='text-lg leading-none'>×</span>
              </button>
            </div>

            <form onSubmit={updateFoodPrice} className='mt-5 space-y-4'>
              <div className='space-y-2'>
                <label className='text-sm font-semibold text-zinc-700 dark:text-zinc-300'>Price (LKR)</label>
                <input
                  type='number'
                  min='0'
                  step='1'
                  value={editPrice}
                  onChange={(event) => setEditPrice(event.target.value)}
                  className='w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-orange-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:bg-zinc-800'
                  placeholder='Enter new price'
                  required
                />
              </div>

              <div className='flex gap-3'>
                <button
                  type='button'
                  onClick={closeEditPrice}
                  className='flex-1 rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={savingEdit}
                  className='flex-1 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70'
                >
                  {savingEdit ? 'Saving...' : 'Save price'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default List
