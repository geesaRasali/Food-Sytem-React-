import React, { useState, useEffect, useRef } from 'react';
import { FiTag, FiEdit, FiTrash2, FiPlus, FiX, FiUploadCloud, FiImage } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from 'axios';

const Categories = ({ url, adminToken }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add form state
  const [categoryName, setCategoryName] = useState('');
  const [categoryImage, setCategoryImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [adding, setAdding] = useState(false);
  const addFileRef = useRef(null);

  // Edit modal state
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const editFileRef = useRef(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const authHeaders = { token: adminToken };

  const getCategoryImageUrl = (filename) => {
    if (!filename) return null;
    if (filename.startsWith('http')) return filename;
    return `${url}/images/${filename}`;
  };

  // ── Fetch categories from backend ──────────────────────────────────────────

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${url}/api/food/category/list`);
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ── Image pick handlers ────────────────────────────────────────────────────

  const handleImageChange = (file, setImg, setPreview) => {
    if (!file) return;
    setImg(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAddImageChange = (e) => {
    handleImageChange(e.target.files[0], setCategoryImage, setImagePreview);
  };

  const handleEditImageChange = (e) => {
    handleImageChange(e.target.files[0], setEditImage, setEditImagePreview);
  };

  // ── Add category ───────────────────────────────────────────────────────────

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const trimmedName = categoryName.trim();
    if (!trimmedName) {
      toast.error('Category name cannot be empty');
      return;
    }
    if (!categoryImage) {
      toast.error('Please upload an image for the category');
      return;
    }

    setAdding(true);
    try {
      const formData = new FormData();
      formData.append('name', trimmedName);
      formData.append('image', categoryImage);

      const res = await axios.post(`${url}/api/food/category/add`, formData, {
        headers: { ...authHeaders, 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        toast.success('Category added successfully');
        setCategoryName('');
        setCategoryImage(null);
        setImagePreview(null);
        if (addFileRef.current) addFileRef.current.value = '';
        await fetchCategories();
      } else {
        toast.error(res.data.message || 'Failed to add category');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error adding category');
    } finally {
      setAdding(false);
    }
  };

  // ── Delete category ────────────────────────────────────────────────────────

  const handleDeleteCategory = async (id, name) => {
    try {
      const res = await axios.post(
        `${url}/api/food/category/delete`,
        { id },
        { headers: authHeaders }
      );
      if (res.data.success) {
        toast.success(`Category "${name}" deleted`);
        setCategories((prev) => prev.filter((c) => c._id !== id));
      } else {
        toast.error(res.data.message || 'Failed to delete category');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting category');
    }
  };

  // ── Edit modal ─────────────────────────────────────────────────────────────

  const handleEditClick = (category) => {
    setEditingCategory(category);
    setEditName(category.name);
    setEditImage(null);
    setEditImagePreview(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const trimmedName = editName.trim();
    if (!trimmedName) {
      toast.error('Category name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('id', editingCategory._id);
      formData.append('name', trimmedName);
      if (editImage) formData.append('image', editImage);

      const res = await axios.post(`${url}/api/food/category/update`, formData, {
        headers: { ...authHeaders, 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        toast.success('Category updated successfully');
        setEditingCategory(null);
        setEditName('');
        setEditImage(null);
        setEditImagePreview(null);
        await fetchCategories();
      } else {
        toast.error(res.data.message || 'Failed to update category');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating category');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseEdit = () => {
    setEditingCategory(null);
    setEditName('');
    setEditImage(null);
    setEditImagePreview(null);
  };

  // ── Format date ────────────────────────────────────────────────────────────

  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-zinc-50 px-4 py-6 dark:bg-zinc-900 md:px-7">
      <div className="mx-auto max-w-6xl">
        {/* Main Card Layout */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-[0_14px_34px_rgba(0,0,0,0.02)] dark:border-zinc-800 dark:bg-zinc-950 md:p-8">

          {/* Header */}
          <div className="flex items-start gap-4 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 dark:bg-zinc-900 text-orange-500">
              <FiTag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Food Categories</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Organize menu items with reusable categories for easier browsing.
              </p>
            </div>
          </div>

          {/* Grid Content */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">

            {/* Left Column: Add Form */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-5">
                  Add food category
                </h3>

                <form onSubmit={handleAddCategory} className="space-y-4">
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      Category name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Salad, Deserts..."
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-orange-500 transition duration-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      Category image
                    </label>
                    <div
                      onClick={() => addFileRef.current?.click()}
                      className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all duration-200 ${
                        imagePreview
                          ? 'border-orange-400 bg-orange-50/30 dark:bg-orange-900/10'
                          : 'border-zinc-200 bg-white hover:border-orange-400 hover:bg-orange-50/20 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-orange-500'
                      } p-4`}
                    >
                      {imagePreview ? (
                        <>
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="h-28 w-28 rounded-full object-cover shadow-md ring-2 ring-orange-400/40"
                          />
                          <p className="text-xs font-medium text-orange-500">Click to change image</p>
                        </>
                      ) : (
                        <>
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 dark:bg-zinc-700">
                            <FiUploadCloud className="h-7 w-7 text-orange-400" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                              Click to upload image
                            </p>
                            <p className="mt-0.5 text-xs text-zinc-400">PNG, JPG, JPEG, WEBP</p>
                          </div>
                        </>
                      )}
                      <input
                        ref={addFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAddImageChange}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={adding}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <FiPlus className="w-4 h-4" />
                    {adding ? 'Adding…' : 'Add category'}
                  </button>
                </form>
              </div>
            </div>

          
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-5">
                  New categories
                </h3>

                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
                  </div>
                ) : categories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-400">
                    <FiImage className="h-10 w-10" />
                    <p className="text-sm font-medium">No categories yet. Add one!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs font-bold uppercase tracking-wider text-zinc-400">
                          <th className="pb-3 pr-4">Image</th>
                          <th className="pb-3 pr-4">Name</th>
                          <th className="pb-3 pr-4">Updated</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                        {categories.map((category) => (
                          <tr key={category._id} className="group transition-colors hover:bg-zinc-100/30 dark:hover:bg-zinc-800/10">
                            <td className="py-3 pr-4">
                              {getCategoryImageUrl(category.image) ? (
                                <img
                                  src={getCategoryImageUrl(category.image)}
                                  alt={category.name}
                                  className="h-11 w-11 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700"
                                />
                              ) : (
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                                  <FiImage className="h-5 w-5 text-zinc-400" />
                                </div>
                              )}
                            </td>
                            <td className="py-3 pr-4 font-semibold text-zinc-800 dark:text-zinc-200">
                              {category.name}
                            </td>
                            <td className="py-3 pr-4 text-zinc-500 dark:text-zinc-400">
                              {formatDate(category.updatedAt)}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex justify-end items-center gap-2">
                                <button
                                  onClick={() => handleEditClick(category)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 transition"
                                >
                                  <FiEdit className="w-3.5 h-3.5" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(category._id, category.name)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition"
                                >
                                  <FiTrash2 className="w-3.5 h-3.5" />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Edit Category Modal ─────────────────────────────────────────────── */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
                  Edit Category
                </p>
                <h2 className="mt-1 text-xl font-black text-zinc-900 dark:text-zinc-100">
                  {editingCategory.name}
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Update the category name and/or image.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <FiX className="text-lg leading-none" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-5 space-y-4">
              {/* Name field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Category Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-orange-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:bg-zinc-800"
                  placeholder="Enter new category name"
                  required
                />
              </div>

              {/* Image field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Category Image <span className="font-normal text-zinc-400">(optional – replaces current)</span>
                </label>

                {/* Current image preview */}
                {!editImagePreview && getCategoryImageUrl(editingCategory.image) && (
                  <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
                    <img
                      src={getCategoryImageUrl(editingCategory.image)}
                      alt="Current"
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Current image</p>
                      <p className="text-xs text-zinc-400">Upload below to replace</p>
                    </div>
                  </div>
                )}

                <div
                  onClick={() => editFileRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 transition-all duration-200 ${
                    editImagePreview
                      ? 'border-orange-400 bg-orange-50/30 dark:bg-orange-900/10'
                      : 'border-zinc-200 bg-white hover:border-orange-400 hover:bg-orange-50/20 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-orange-500'
                  }`}
                >
                  {editImagePreview ? (
                    <>
                      <img
                        src={editImagePreview}
                        alt="New preview"
                        className="h-20 w-20 rounded-full object-cover shadow-md ring-2 ring-orange-400/40"
                      />
                      <p className="text-xs font-medium text-orange-500">Click to change</p>
                    </>
                  ) : (
                    <>
                      <FiUploadCloud className="h-6 w-6 text-zinc-400" />
                      <p className="text-xs text-zinc-500">Click to upload new image</p>
                    </>
                  )}
                  <input
                    ref={editFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleEditImageChange}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="flex-1 rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black text-white transition hover:bg-orange-600 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default Categories;
