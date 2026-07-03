 import React, { useEffect, useState } from 'react'
import { assets, stockMaterials } from '../../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FiUpload, FiPlusCircle, FiInfo, FiArrowLeft } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

const AddMaterial = ({ url, adminToken }) => {
    const navigate = useNavigate()
    const [image, setImage] = useState(false)
    const [selectedPredefined, setSelectedPredefined] = useState(null)
    const [suppliersList, setSuppliersList] = useState([])
    
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

    const [data, setData] = useState({
        name: '',
        description: 'Raw material/ingredient for kitchen use.',
        price: '',
        category: materialCategories[0],
        supplier: '',
        quantity: ''
    })

    console.log("stockMaterials keys:", Object.keys(stockMaterials));
    console.log("current category:", data.category);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const response = await axios.get(`${url}/api/supplier/list`, {
                    headers: { token: adminToken, Authorization: `Bearer ${adminToken}` }
                })
                if (response.data.success) {
                    setSuppliersList(response.data.data)
                    if (response.data.data.length > 0) {
                        setData(prev => ({ ...prev, supplier: response.data.data[0].name }))
                    }
                }
            } catch (err) {
                console.error("Failed to fetch suppliers", err)
            }
        }
        if (url && adminToken) {
            fetchSuppliers()
        }
    }, [url, adminToken])

    const onChangeHandler = (event) => {
        const name = event.target.name
        const value = event.target.value
        setData((prev) => ({ ...prev, [name]: value }))
        if (name === 'category') {
            setSelectedPredefined(null)
        }
    }

    const onSubmitHandler = async (event) => {
        event.preventDefault()

        const formData = new FormData()
        formData.append('name', data.name)
        formData.append('description', data.description)
        formData.append('price', Number(data.price))
        formData.append('category', data.category)
        formData.append('supplier', data.supplier)
        formData.append('quantity', Number(data.quantity) || 0)
        
        if (image) {
            formData.append('image', image)
        } else if (selectedPredefined) {
            formData.append('image', selectedPredefined.filename)
        } else {
            formData.append('image', 'food_1.png')
        }

        try {
            const response = await axios.post(`${url}/api/food/add`, formData, {
                headers: { token: adminToken, Authorization: `Bearer ${adminToken}` },
            })
            if (response.data.success) {
                setData({
                    name: '',
                    description: 'Raw material/ingredient for kitchen use.',
                    price: '',
                    category: materialCategories[0],
                    supplier: suppliersList[0]?.name || '',
                    quantity: ''
                })
                setImage(false)
                setSelectedPredefined(null)
                toast.success("Material added to stock successfully!")
                navigate('/stock-control/stock-list')
            } else {
                toast.error(response.data.message || 'Failed to add material.')
            }
        } catch (error) {
            const message = error?.response?.data?.message || error?.message || 'Failed to add material.'
            toast.error(message)
        }
    }

    const handleSelectPredefined = (item) => {
        setSelectedPredefined(item)
        setImage(false)
        setData(prev => ({ ...prev, name: item.name }))
    }

    const previewImage = image ? URL.createObjectURL(image) : (selectedPredefined ? selectedPredefined.image : assets.upload_area)

    return (
        <div className='min-h-screen bg-[#fcfcfc] p-4 md:p-10 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 animate-fadeIn'>
            <div className='mx-auto max-w-5xl'>


                {/* Header */}
                <div className='mb-8'>
                    <h1 className='text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100'>
                        Add Stock Material
                    </h1>
                    <p className='text-zinc-500 mt-1'>Register a new raw material or ingredient to your inventory control.</p>
                </div>

                <form onSubmit={onSubmitHandler} className='grid grid-cols-1 gap-8 lg:grid-cols-12'>
                    {/* Left: Image Side */}
                    <div className='lg:col-span-4'>
                        <div className='sticky top-24 space-y-6 rounded-[2.5rem] bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.04)] dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850'>
                            <p className='flex items-center gap-2 font-bold text-zinc-800 dark:text-zinc-200'>
                                <FiUpload size={18} className='text-orange-500' />
                                Material Image
                            </p>
                            <label htmlFor='image' className='group relative block aspect-square cursor-pointer overflow-hidden rounded-4xl border-2 border-dashed border-zinc-200 transition-all hover:border-orange-400 dark:border-zinc-800'>
                                <img src={previewImage} className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${!image && 'p-10 opacity-30'}`} alt='Preview' />
                                <div className='absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100'>
                                    <p className='text-xs font-bold text-white'>UPLOAD IMAGE</p>
                                </div>
                            </label>
                            <input onChange={(e) => setImage(e.target.files[0])} type='file' id='image' hidden />
                            <div className='rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/50'>
                                <p className='flex items-start gap-2 text-xs leading-relaxed text-zinc-500'>
                                    <FiInfo size={14} className='mt-0.5 shrink-0' />
                                    Provide a clear image of the ingredient or packaging for quick visual tracking.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Content Side */}
                    <div className='space-y-6 lg:col-span-8'>
                        <div className='rounded-[2.5rem] bg-white p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850'>
                            <div className='grid gap-6'>
                                {/* Name Input */}
                                <div className='space-y-2'>
                                    <label className='ml-1 text-sm font-bold text-zinc-700 dark:text-zinc-300'>Material / Ingredient Name</label>
                                    <input
                                        name='name'
                                        onChange={onChangeHandler}
                                        value={data.name}
                                        className='w-full rounded-2xl border-none bg-zinc-50 dark:bg-zinc-800/50 px-5 py-4 text-zinc-900 dark:text-white outline-none transition placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-400'
                                        placeholder='Ex: Fresh Red Tomatoes'
                                        required
                                    />
                                </div>

                                {/* Predefined Materials Grid */}
                                {stockMaterials[data.category] && (
                                    <div className='space-y-3 animate-fadeIn'>
                                        <label className='ml-1 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>Select Predefined Ingredient</label>
                                        <div className='grid grid-cols-2 sm:grid-cols-5 gap-3 max-h-64 overflow-y-auto p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800/60'>
                                            {stockMaterials[data.category].map((item) => (
                                                <button
                                                    type="button"
                                                    key={item.name}
                                                    onClick={() => handleSelectPredefined(item)}
                                                    className={`p-2 bg-white dark:bg-zinc-900 border rounded-xl flex flex-col items-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer ${
                                                        selectedPredefined?.name === item.name 
                                                            ? 'border-orange-500 ring-2 ring-orange-500/20' 
                                                            : 'border-zinc-200 dark:border-zinc-800/50'
                                                    }`}
                                                >
                                                    <img src={item.image} alt={item.name} className='w-12 h-12 object-cover rounded-lg' />
                                                    <span className='text-[10px] font-bold text-zinc-650 dark:text-zinc-300 text-center leading-tight truncate w-full'>{item.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Pricing, Category, Supplier & Quantity */}
                                <div className='grid grid-cols-1 gap-6 md:grid-cols-4'>
                                    <div className='space-y-2'>
                                        <label className='ml-1 text-sm font-bold text-zinc-700 dark:text-zinc-300'>Category</label>
                                        <select
                                            name='category'
                                            onChange={onChangeHandler}
                                            value={data.category}
                                            className='w-full cursor-pointer rounded-2xl border-none bg-zinc-50 dark:bg-zinc-800/50 px-5 py-4 text-zinc-900 dark:text-white outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400'
                                        >
                                            {materialCategories.map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className='space-y-2'>
                                        <label className='ml-1 text-sm font-bold text-zinc-700 dark:text-zinc-300'>Supplier</label>
                                        <select
                                            name='supplier'
                                            onChange={onChangeHandler}
                                            value={data.supplier}
                                            className='w-full cursor-pointer rounded-2xl border-none bg-zinc-50 dark:bg-zinc-800/50 px-5 py-4 text-zinc-900 dark:text-white outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400'
                                            required
                                        >
                                            {suppliersList.length > 0 ? (
                                                suppliersList.map((s) => (
                                                    <option key={s._id} value={s.name}>
                                                        {s.name}
                                                    </option>
                                                ))
                                            ) : (
                                                <option value="">No suppliers found</option>
                                            )}
                                        </select>
                                    </div>
                                    <div className='space-y-2'>
                                        <label className='ml-1 text-sm font-bold text-zinc-700 dark:text-zinc-300'>Price (LKR)</label>
                                        <input
                                            name='price'
                                            type='number'
                                            onChange={onChangeHandler}
                                            value={data.price}
                                            className='w-full rounded-2xl border-none bg-zinc-50 dark:bg-zinc-800/50 px-5 py-4 text-zinc-900 dark:text-white outline-none transition placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-400'
                                            placeholder='0.00'
                                            required
                                        />
                                    </div>
                                    <div className='space-y-2'>
                                        <label className='ml-1 text-sm font-bold text-zinc-700 dark:text-zinc-300'>Quantity</label>
                                        <input
                                            name='quantity'
                                            type='number'
                                            onChange={onChangeHandler}
                                            value={data.quantity}
                                            className='w-full rounded-2xl border-none bg-zinc-50 dark:bg-zinc-800/50 px-5 py-4 text-zinc-900 dark:text-white outline-none transition placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-400'
                                            placeholder='e.g. 50'
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type='submit'
                                className='mt-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 hover:bg-orange-700 py-5 text-lg font-black text-white shadow-xl shadow-orange-200 dark:shadow-none transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer'
                            >
                                <FiPlusCircle size={20} />
                                ADD MATERIAL TO INVENTORY
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddMaterial
