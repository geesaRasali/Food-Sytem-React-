import React, { useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FiUpload, FiPlusCircle, FiInfo } from 'react-icons/fi'
import { useLocation, useNavigate } from 'react-router-dom'

const Add = ({ url, adminToken }) => {
    const [image, setImage] = useState(false)
    const location = useLocation()
    const navigate = useNavigate()
    const editingFood = location.state?.food || null

    // Load categories from localStorage dynamically
    const categoriesList = (() => {
        const saved = localStorage.getItem('foodCategories')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.map((cat) => cat.name)
                }
            } catch (e) {
                console.error('Failed to parse categories in Add.jsx', e)
            }
        }
        return ['Salad', 'Rolls', 'Deserts', 'Sandwich', 'Cake', 'Pure Veg', 'Pasta', 'Noodles', 'Koththu']
    })()

    const [suppliersList, setSuppliersList] = useState([])
    const [data, setData] = useState({
        name: '',
        description: '',
        price: '',
        category: editingFood ? editingFood.category : (categoriesList[0] || 'Salad'),
        supplier: editingFood ? (editingFood.supplier || '') : '',
    })

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const response = await axios.get(`${url}/api/supplier/list`, {
                    headers: { token: adminToken, Authorization: `Bearer ${adminToken}` }
                })
                if (response.data.success) {
                    setSuppliersList(response.data.data)
                }
            } catch (err) {
                console.error("Failed to fetch suppliers", err)
            }
        }
        if (url && adminToken) {
            fetchSuppliers()
        }
    }, [url, adminToken])

    useEffect(() => {
        if (editingFood) {
            setData({
                name: editingFood.name || '',
                description: editingFood.description || '',
                price: editingFood.price ?? '',
                category: editingFood.category || 'Salad',
                supplier: editingFood.supplier || '',
            })
        } else {
            setData((prev) => ({
                ...prev,
                category: categoriesList[0] || 'Salad',
                supplier: '',
            }))
        }
    }, [editingFood])

    const onChangeHandler = (event) => {
        const name = event.target.name
        const value = event.target.value
        setData((prev) => ({ ...prev, [name]: value }))
    }

    const onSubmitHandler = async (event) => {
        event.preventDefault()
        const formData = new FormData()
        formData.append('name', data.name)
        formData.append('description', data.description)
        formData.append('price', Number(data.price))
        formData.append('category', data.category)
        formData.append('supplier', data.supplier)
        if (image) {
            formData.append('image', image)
        }

        try {
            const endpoint = editingFood ? `${url}/api/food/update` : `${url}/api/food/add`
            if (editingFood) {
                formData.append('id', editingFood._id)
            }

            const response = await axios.post(endpoint, formData, {
                headers: { token: adminToken, Authorization: `Bearer ${adminToken}` },
            })
            if (response.data.success) {
                setData({ name: '', description: '', price: '', category: 'Salad', supplier: '' })
                setImage(false)
                toast.success(response.data.message)
                navigate('/list')
            } else {
                toast.error(response.data.message || 'Failed to add item.')
            }
        } catch (error) {
            const message = error?.response?.data?.message || error?.message || 'Failed to add item.'
            toast.error(message)
        }
    }

    const previewImage = image ? URL.createObjectURL(image) : assets.upload_area

    return (
        <div className='min-h-screen bg-[#fcfcfc] p-4 md:p-10 dark:bg-zinc-950'>
            <div className='mx-auto max-w-5xl'>
                {/* Header*/}
                <div className='mb-8 flex flex-col md:flex-row md:items-center md:justify-between'>
                    <div>
                        <h1 className='text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100'>
                            Menu Management
                        </h1>
                        <p className='text-zinc-500'>Add a new culinary masterpiece to your menu.</p>
                    </div>
                    
                </div>

                <form onSubmit={onSubmitHandler} className='grid grid-cols-1 gap-8 lg:grid-cols-12'>
                    {/* Left: Image Side */}
                    <div className='lg:col-span-4'>
                        <div className='sticky top-24 space-y-6 rounded-[2.5rem] bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.04)] dark:bg-zinc-900'>
                            <p className='flex items-center gap-2 font-bold text-zinc-800 dark:text-zinc-200'>
                                <FiUpload size={18} className='text-orange-500' />
                                Product Image
                            </p>
                            <label htmlFor='image' className='group relative block aspect-square cursor-pointer overflow-hidden rounded-4xl border-2 border-dashed border-zinc-200 transition-all hover:border-orange-400 dark:border-zinc-800'>
                                <img src={previewImage} className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${!image && 'p-10 opacity-30'}`} alt='Preview' />
                                <div className='absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100'>
                                    <p className='text-xs font-bold text-white'>CHANGE IMAGE</p>
                                </div>
                            </label>
                            <input onChange={(e) => setImage(e.target.files[0])} type='file' id='image' hidden required />
                            <div className='rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/50'>
                                <p className='flex items-start gap-2 text-xs leading-relaxed text-zinc-500'>
                                    <FiInfo size={14} className='mt-0.5 shrink-0' />
                                    Use a high-quality 1:1 square image to make your food look appetizing.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Content Side */}
                    <div className='space-y-6 lg:col-span-8'>
                        <div className='rounded-[2.5rem] bg-white p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] dark:bg-zinc-900'>
                            <div className='grid gap-6'>
                                {/* Name Input */}
                                <div className='space-y-2'>
                                    <label className='ml-1 text-sm font-bold text-zinc-700 dark:text-zinc-300'>Dish Name</label>
                                    <input
                                        name='name'
                                        onChange={onChangeHandler}
                                        value={data.name}
                                        className='w-full rounded-2xl border-none bg-white px-5 py-4 text-zinc-900 outline-none transition placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-400 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-800'
                                        placeholder='Ex: Creamy Alfredo Pasta'
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div className='space-y-2'>
                                    <label className='ml-1 text-sm font-bold text-zinc-700 dark:text-zinc-300'>Description</label>
                                    <textarea
                                        name='description'
                                        onChange={onChangeHandler}
                                        value={data.description}
                                        rows='5'
                                        className='w-full rounded-2xl border-none bg-white px-5 py-4 text-zinc-900 outline-none transition placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-400 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-800 resize-none'
                                        placeholder='Talk about the taste, secret spices, and serving size...'
                                        required
                                    />
                                </div>

                                 {/* Pricing, Category */}
                                 <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                                     <div className='space-y-2'>
                                         <label className='ml-1 text-sm font-bold text-zinc-700 dark:text-zinc-300'>Category</label>
                                         <select
                                             name='category'
                                             onChange={onChangeHandler}
                                             value={data.category}
                                             className='w-full cursor-pointer rounded-2xl border-none bg-white px-5 py-4 text-zinc-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800'
                                         >
                                             {categoriesList.map((c) => (
                                                 <option key={c} value={c} className='bg-white text-zinc-900 dark:bg-gray-800 dark:text-gray-200'>
                                                     {c}
                                                 </option>
                                             ))}
                                         </select>
                                     </div>
                                   
                                     <div className='space-y-2'>
                                         <label className='ml-1 text-sm font-bold text-zinc-700 dark:text-zinc-300'>Price (LKR)</label>
                                         <input
                                             name='price'
                                             type='number'
                                             onChange={onChangeHandler}
                                             value={data.price}
                                             className='w-full rounded-2xl border-none bg-white px-5 py-4 text-zinc-900 outline-none transition placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-400 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-800'
                                             placeholder='0.00'
                                             required
                                         />
                                     </div>
                                 </div>
                            </div>

                            <button
                                type='submit'
                                className='mt-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-5 text-lg font-black text-white shadow-xl shadow-orange-200 transition-all hover:bg-orange-600 hover:-translate-y-1 active:scale-95 dark:shadow-none'
                            >
                                <FiPlusCircle size={20} />
                                {editingFood ? 'UPDATE FOOD ITEM' : 'ADD FOOD ITEM'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Add