import React, { useEffect, useState } from 'react'
import { assets, stockMaterials } from '../../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FiUpload, FiPlusCircle, FiInfo } from 'react-icons/fi'
import { MdCloudUpload } from 'react-icons/md'
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
        quantity: '',
        unit: 'kg',
        expiryDate: ''
    })

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
        formData.append('unit', data.unit)
        if (data.expiryDate) {
            formData.append('expiryDate', data.expiryDate)
        }

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
                    quantity: '',
                    unit: 'kg',
                    expiryDate: ''
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

    const previewImage = image
        ? URL.createObjectURL(image)
        : selectedPredefined
            ? selectedPredefined.image
            : null

    return (
        <div style={styles.page}>
            <div style={styles.container}>

                {/* Header */}
                <div style={styles.header}>
                    <h1 style={styles.title}>Add Stock Material</h1>
                    <p style={styles.subtitle}>Register a new raw material or ingredient to your inventory control.</p>
                </div>

                <form onSubmit={onSubmitHandler} style={styles.formGrid}>

                    {/* LEFT: Image Card */}
                    <div style={styles.imageCard}>
                        <p style={styles.imageCardTitle}>
                            <FiUpload size={16} color="#f97316" />
                            &nbsp; Material Image
                        </p>

                        <label htmlFor="image" style={styles.uploadLabel}>
                            {previewImage ? (
                                <img
                                    src={previewImage}
                                    alt="Preview"
                                    style={styles.previewImg}
                                />
                            ) : (
                                <div style={styles.uploadPlaceholder}>
                                    <MdCloudUpload size={54} color="#cbd5e1" />
                                    <span style={styles.uploadText}>Upload</span>
                                </div>
                            )}
                        </label>
                        <input
                            onChange={(e) => setImage(e.target.files[0])}
                            type="file"
                            id="image"
                            hidden
                        />

                        <div style={styles.infoBox}>
                            <FiInfo size={13} color="#94a3b8" style={{ marginTop: 2, flexShrink: 0 }} />
                            <span style={styles.infoText}>
                                Provide a clear image of the ingredient or packaging for quick visual tracking.
                            </span>
                        </div>
                    </div>

                    {/* RIGHT: Form Card */}
                    <div style={styles.formCard}>

                        {/* Material Name */}
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Material / Ingredient Name</label>
                            <input
                                name="name"
                                onChange={onChangeHandler}
                                value={data.name}
                                style={styles.input}
                                placeholder="Ex: Fresh Red Tomatoes"
                                required
                                onFocus={e => e.target.style.borderColor = '#f97316'}
                                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                            />
                        </div>


                        {/* Row: Category | Supplier | Price | Quantity | Expiry */}
                        <div style={styles.row5}>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Category</label>
                                <select
                                    name="category"
                                    onChange={onChangeHandler}
                                    value={data.category}
                                    style={styles.select}
                                    onFocus={e => e.target.style.borderColor = '#f97316'}
                                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                >
                                    {materialCategories.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Supplier</label>
                                <select
                                    name="supplier"
                                    onChange={onChangeHandler}
                                    value={data.supplier}
                                    style={styles.select}
                                    required
                                    onFocus={e => e.target.style.borderColor = '#f97316'}
                                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                >
                                    {suppliersList.length > 0 ? (
                                        suppliersList.map((s) => (
                                            <option key={s._id} value={s.name}>{s.name}</option>
                                        ))
                                    ) : (
                                        <option value="">No suppliers found</option>
                                    )}
                                </select>
                            </div>

                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Price (LKR)</label>
                                <input
                                    name="price"
                                    type="number"
                                    onChange={onChangeHandler}
                                    value={data.price}
                                    style={styles.input}
                                    placeholder="0.00"
                                    required
                                    onFocus={e => e.target.style.borderColor = '#f97316'}
                                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                />
                            </div>

                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Quantity</label>
                                <input
                                    name="quantity"
                                    type="number"
                                    onChange={onChangeHandler}
                                    value={data.quantity}
                                    style={styles.input}
                                    placeholder="e.g. 50"
                                    required
                                    onFocus={e => e.target.style.borderColor = '#f97316'}
                                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                />
                            </div>

                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Expiry Date</label>
                                <input
                                    name="expiryDate"
                                    type="date"
                                    onChange={onChangeHandler}
                                    value={data.expiryDate}
                                    style={styles.input}
                                    onFocus={e => e.target.style.borderColor = '#f97316'}
                                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            style={styles.submitBtn}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#ea6c0a'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f97316'; e.currentTarget.style.transform = 'translateY(0)' }}
                        >
                            <FiPlusCircle size={18} />
                            &nbsp; ADD MATERIAL TO INVENTORY
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}

/* ─── Inline Styles ──────────────────────────────────────────────── */
const styles = {
    page: {
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        padding: '32px 24px',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
    },
    container: {
        maxWidth: 1100,
        margin: '0 auto',
    },
    header: {
        marginBottom: 28,
    },
    title: {
        fontSize: 26,
        fontWeight: 800,
        color: '#111827',
        margin: 0,
        letterSpacing: '-0.5px',
    },
    subtitle: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 4,
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        gap: 20,
        alignItems: 'start',
    },

    /* ── Image Card ── */
    imageCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: '20px 18px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
    },
    imageCardTitle: {
        display: 'flex',
        alignItems: 'center',
        fontSize: 13,
        fontWeight: 700,
        color: '#1f2937',
        margin: 0,
    },
    uploadLabel: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        aspectRatio: '1 / 1',
        borderRadius: 12,
        border: '2px dashed #d1d5db',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#fafafa',
        transition: 'border-color 0.2s',
    },
    uploadPlaceholder: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        gap: 6,
    },
    uploadText: {
        fontSize: 18,
        fontWeight: 600,
        color: '#cbd5e1',
        letterSpacing: '0.02em',
    },
    previewImg: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    infoBox: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 7,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: '10px 12px',
    },
    infoText: {
        fontSize: 11,
        color: '#94a3b8',
        lineHeight: 1.5,
    },

    /* ── Form Card ── */
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: '24px 24px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        flex: 1,
    },
    label: {
        fontSize: 12,
        fontWeight: 600,
        color: '#374151',
    },
    input: {
        width: '100%',
        padding: '10px 14px',
        borderRadius: 8,
        border: '1.5px solid #e5e7eb',
        fontSize: 13,
        color: '#111827',
        outline: 'none',
        backgroundColor: '#fff',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box',
    },
    select: {
        width: '100%',
        padding: '10px 14px',
        borderRadius: 8,
        border: '1.5px solid #e5e7eb',
        fontSize: 13,
        color: '#111827',
        outline: 'none',
        backgroundColor: '#fff',
        cursor: 'pointer',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box',
    },
    row5: {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 14,
    },
    predefinedGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 10,
        maxHeight: 200,
        overflowY: 'auto',
        padding: 10,
        backgroundColor: '#f9fafb',
        borderRadius: 10,
        border: '1px solid #e5e7eb',
    },
    predefinedItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        padding: '8px 4px',
        borderRadius: 10,
        backgroundColor: '#fff',
        cursor: 'pointer',
        transition: 'all 0.15s',
    },
    predefinedImg: {
        width: 44,
        height: 44,
        objectFit: 'cover',
        borderRadius: 8,
    },
    predefinedName: {
        fontSize: 10,
        fontWeight: 600,
        color: '#374151',
        textAlign: 'center',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        width: '100%',
    },
    submitBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        width: '100%',
        padding: '14px 0',
        backgroundColor: '#f97316',
        color: '#fff',
        fontSize: 14,
        fontWeight: 800,
        letterSpacing: '0.04em',
        borderRadius: 10,
        border: 'none',
        cursor: 'pointer',
        marginTop: 4,
        transition: 'background-color 0.2s, transform 0.1s',
        boxShadow: '0 4px 14px rgba(249,115,22,0.35)',
    },
}

export default AddMaterial
