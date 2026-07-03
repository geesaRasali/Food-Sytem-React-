import React, { useEffect, useState } from 'react';
import { FiUsers, FiPhone, FiMail, FiMapPin, FiEdit, FiTrash2, FiPlus, FiPlusCircle, FiXCircle } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';

const SupplierManagement = ({ url, adminToken }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/supplier/list`, {
        headers: { token: adminToken, Authorization: `Bearer ${adminToken}` }
      });
      if (response.data.success) {
        setSuppliers(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to load suppliers");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (url && adminToken) {
      fetchSuppliers();
    }
  }, [url, adminToken]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: ''
    });
    setIsEditing(false);
    setCurrentId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, phone, email, address } = formData;
    if (!name || !phone || !email || !address) {
      toast.warn("All fields are required");
      return;
    }

    try {
      let response;
      if (isEditing) {
        response = await axios.post(`${url}/api/supplier/update`, 
          { id: currentId, ...formData }, 
          { headers: { token: adminToken, Authorization: `Bearer ${adminToken}` } }
        );
      } else {
        response = await axios.post(`${url}/api/supplier/add`, 
          formData, 
          { headers: { token: adminToken, Authorization: `Bearer ${adminToken}` } }
        );
      }

      if (response.data.success) {
        toast.success(response.data.message);
        handleResetForm();
        fetchSuppliers();
      } else {
        toast.error(response.data.message || "Failed to save supplier");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error saving supplier");
    }
  };

  const handleEdit = (supplier) => {
    setIsEditing(true);
    setCurrentId(supplier._id);
    setFormData({
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) {
      return;
    }

    try {
      const response = await axios.post(`${url}/api/supplier/remove`, 
        { id }, 
        { headers: { token: adminToken, Authorization: `Bearer ${adminToken}` } }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        if (currentId === id) {
          handleResetForm();
        }
        fetchSuppliers();
      } else {
        toast.error(response.data.message || "Failed to delete supplier");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error deleting supplier");
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fadeIn text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500 dark:bg-orange-500/20">
          <FiUsers className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">Supplier Management</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">Manage and track ingredient suppliers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Supplier List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Supplier Directory</h2>
            
            {loading ? (
              <p className="text-sm text-zinc-550 dark:text-zinc-400 py-6 text-center">Loading suppliers...</p>
            ) : suppliers.length === 0 ? (
              <p className="text-sm text-zinc-550 dark:text-zinc-400 py-6 text-center">No suppliers registered. Add one using the form on the right.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-450 uppercase text-[10px] font-extrabold tracking-wider">
                      <th className="pb-3 pl-2">Name</th>
                      <th className="pb-3">Phone</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Address</th>
                      <th className="pb-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-850">
                    {suppliers.map((supplier) => (
                      <tr key={supplier._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                        <td className="py-4 pl-2 font-bold text-zinc-800 dark:text-zinc-100">{supplier.name}</td>
                        <td className="py-4 font-medium text-zinc-600 dark:text-zinc-350">{supplier.phone}</td>
                        <td className="py-4 text-zinc-500">{supplier.email}</td>
                        <td className="py-4 text-zinc-500 truncate max-w-[150px]" title={supplier.address}>{supplier.address}</td>
                        <td className="py-4">
                          <div className="flex justify-center items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEdit(supplier)}
                              className="inline-flex items-center justify-center p-2 rounded-lg bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white dark:bg-amber-500/10 dark:text-amber-300 transition-colors cursor-pointer"
                              title="Edit Supplier"
                            >
                              <FiEdit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(supplier._id)}
                              className="inline-flex items-center justify-center p-2 rounded-lg bg-red-50 hover:bg-red-500 text-red-650 hover:text-white dark:bg-red-500/10 dark:text-red-400 transition-colors cursor-pointer"
                              title="Delete Supplier"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
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

        {/* Right: Add/Edit Form */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm sticky top-24">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              {isEditing ? (
                <>
                  <FiEdit className="text-amber-500 w-5 h-5" />
                  Edit Supplier
                </>
              ) : (
                <>
                  <FiPlusCircle className="text-orange-500 w-5 h-5" />
                  Add New Supplier
                </>
              )}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Supplier Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Fresh Farms Ltd"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:border-orange-500 focus:outline-none dark:bg-zinc-950 font-medium"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="e.g. +94 77 123 4567"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:border-orange-500 focus:outline-none dark:bg-zinc-950 font-medium"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="e.g. freshfarms@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:border-orange-500 focus:outline-none dark:bg-zinc-950 font-medium"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Address</label>
                <textarea
                  name="address"
                  placeholder="e.g. 123 Farm Rd, Colombo"
                  rows="3"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:border-orange-500 focus:outline-none dark:bg-zinc-950 font-medium resize-none"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-md transition-all active:scale-[0.98] text-center"
                >
                  {isEditing ? "Save Changes" : "Register Supplier"}
                </button>
                
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="py-3 px-4 bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    <FiXCircle className="w-4 h-4" />
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierManagement;
