import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiShield, FiUserPlus, FiUsers } from 'react-icons/fi';
import { ROLE_LABELS, STAFF_ROLE_OPTIONS } from '../../config/rbac';
import { clearAdminSessionAndReload, isAuthFailureMessage } from '../../lib/auth';

const initialForm = {
  id: '',
  name: '',
  email: '',
  username: '',
  password: '',
  role: STAFF_ROLE_OPTIONS[0],
};

const StaffUsers = ({ url, adminToken }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);

  const authHeaders = useMemo(
    () => ({
      token: adminToken,
      Authorization: `Bearer ${adminToken}`,
    }),
    [adminToken],
  );

  const isEditing = Boolean(form.id);

  const resetForm = () => setForm(initialForm);

  const fetchStaffUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/user/staff`, { headers: authHeaders });
      if (!response.data.success) {
        if (isAuthFailureMessage(response.data.message)) {
          clearAdminSessionAndReload();
          return;
        }
        toast.error(response.data.message || 'Failed to fetch staff users');
        return;
      }
      setUsers(response.data.users || []);
    } catch (error) {
      console.error(error);
      const errorMessage = error?.response?.data?.message || error?.message || '';
      if (isAuthFailureMessage(errorMessage)) {
        clearAdminSessionAndReload();
        return;
      }
      toast.error('Failed to fetch staff users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffUsers();
  }, []);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onEdit = (user) => {
    setForm({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      username: user.username || '',
      password: '',
      role: user.role || STAFF_ROLE_OPTIONS[0],
    });
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this staff account?')) return;

    try {
      const response = await axios.delete(`${url}/api/user/staff/${id}`, { headers: authHeaders });
      if (!response.data.success) {
        if (isAuthFailureMessage(response.data.message)) {
          clearAdminSessionAndReload();
          return;
        }
        toast.error(response.data.message || 'Failed to delete staff user');
        return;
      }
      toast.success('Staff user deleted');
      fetchStaffUsers();
      if (form.id === id) {
        resetForm();
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete staff user');
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.username.trim() || !form.role.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!isEditing && !form.password.trim()) {
      toast.error('Password is required for a new staff user');
      return;
    }

    const payload = {
      name: form.name,
      email: form.email,
      username: form.username,
      role: form.role,
    };

    if (form.password.trim()) {
      payload.password = form.password;
    }

    try {
      setSaving(true);

      const response = isEditing
        ? await axios.put(`${url}/api/user/staff/${form.id}`, payload, { headers: authHeaders })
        : await axios.post(`${url}/api/user/staff`, payload, { headers: authHeaders });

      if (!response.data.success) {
        if (isAuthFailureMessage(response.data.message)) {
          clearAdminSessionAndReload();
          return;
        }
        toast.error(response.data.message || 'Unable to save staff user');
        return;
      }

      toast.success(isEditing ? 'Staff user updated' : 'Staff user created');
      resetForm();
      fetchStaffUsers();
    } catch (error) {
      console.error(error);
      const errorMessage = error?.response?.data?.message || error?.message || '';
      if (isAuthFailureMessage(errorMessage)) {
        clearAdminSessionAndReload();
        return;
      }
      toast.error('Unable to save staff user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='grid gap-6 px-4 py-6 md:px-8 font-sans'>
      <div className='rounded-3xl border border-orange-100 bg-linear-to-br from-white via-white to-orange-50/70 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.08)] md:p-6 dark:border-orange-500/25 dark:bg-linear-to-br dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 dark:shadow-[0_18px_45px_rgba(0,0,0,0.5)]'>
        <div className='mb-5 flex flex-wrap items-start justify-between gap-4'>
          <div>
            <div className='mb-2 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700 dark:bg-orange-500/15 dark:text-orange-300'>
              <FiUserPlus className='text-sm' />
              Team management
            </div>
            <h2 className='text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100'>{isEditing ? 'Edit Staff User' : 'Create Staff User'}</h2>
            <p className='mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400'>
              Create and manage staff accounts with role-based access for kitchen, delivery, and management teams.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className='grid max-w-2xl gap-3'>
          <input
            name='name'
            value={form.name}
            onChange={onChange}
            placeholder='Full name'
            required
            className='rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-orange-400 dark:focus:ring-orange-500/20'
          />
          <input
            name='email'
            type='email'
            value={form.email}
            onChange={onChange}
            placeholder='Email'
            required
            className='rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-orange-400 dark:focus:ring-orange-500/20'
          />
          <input
            name='username'
            value={form.username}
            onChange={onChange}
            placeholder='Username'
            required
            className='rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-orange-400 dark:focus:ring-orange-500/20'
          />
          <input
            name='password'
            type='password'
            value={form.password}
            onChange={onChange}
            placeholder={isEditing ? 'New password (optional)' : 'Password'}
            required={!isEditing}
            className='rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-orange-400 dark:focus:ring-orange-500/20'
          />
          <select
            name='role'
            value={form.role}
            onChange={onChange}
            className='rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-orange-400 dark:focus:ring-orange-500/20'
          >
            {STAFF_ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>

          <div className='flex flex-wrap gap-2 pt-1'>
            <button
              type='submit'
              disabled={saving}
              className='inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-orange-500 to-orange-600 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(249,115,22,0.25)] transition hover:from-orange-600 hover:to-orange-700 disabled:cursor-not-allowed disabled:opacity-70'
            >
              <FiShield className='text-base' />
              {saving ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
            </button>
            {isEditing && (
              <button
                type='button'
                onClick={resetForm}
                className='rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className='rounded-3xl border border-zinc-200 bg-white p-5 shadow-[0_18px_45px_rgba(0,0,0,0.06)] md:p-6 dark:border-zinc-700 dark:bg-linear-to-br dark:from-zinc-950 dark:to-zinc-900 dark:shadow-[0_18px_45px_rgba(0,0,0,0.5)]'>
        <div className='mb-4 flex items-center justify-between gap-3'>
          <div>
            <h2 className='text-2xl font-black text-zinc-900 dark:text-zinc-100'>Staff Accounts</h2>
            <p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>Manage every staff member from one place.</p>
          </div>
          <div className='inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'>
            <FiUsers className='text-sm' />
            {users.length} accounts
          </div>
        </div>
        {loading ? (
          <p className='text-sm text-zinc-500 dark:text-zinc-400'>Loading staff users...</p>
        ) : users.length === 0 ? (
          <div className='rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'>
            No staff users found.
          </div>
        ) : (
          <div className='grid gap-3'>
            <div className='hidden grid-cols-[1.2fr_1fr_1.4fr_1fr_1fr] gap-2 rounded-2xl border border-orange-100 bg-orange-50/80 px-4 py-3 text-xs font-black uppercase tracking-wide text-orange-900 md:grid dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300'>
              <span>Name</span>
              <span>Username</span>
              <span>Email</span>
              <span>Role</span>
              <span>Actions</span>
            </div>
            {users.map((user) => (
              <div
                key={user.id}
                className='grid gap-3 rounded-2xl border border-zinc-200 bg-linear-to-br from-white to-zinc-50 px-4 py-4 text-sm shadow-[0_8px_20px_rgba(0,0,0,0.03)] md:grid-cols-[1.2fr_1fr_1.4fr_1fr_1fr] md:items-center dark:border-zinc-700 dark:bg-linear-to-br dark:from-zinc-900 dark:to-zinc-950 dark:shadow-[0_8px_20px_rgba(0,0,0,0.35)]'
              >
                <span className='font-bold text-zinc-900 dark:text-zinc-100'>{user.name}</span>
                <span className='text-zinc-700 dark:text-zinc-300'>{user.username}</span>
                <span className='text-zinc-700 dark:text-zinc-300'>{user.email}</span>
                <span>
                  <span className='inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'>
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                </span>
                <span className='flex gap-2'>
                  {user.role === 'admin' ? (
                    <span className='inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'>
                      🔒 Protected
                    </span>
                  ) : (
                    <>
                      <button
                        type='button'
                        onClick={() => onEdit(user)}
                        className='rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700'
                      >
                        Edit
                      </button>
                      <button
                        type='button'
                        onClick={() => onDelete(user.id)}
                        className='rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700'
                      >
                        Delete
                      </button>
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffUsers;
