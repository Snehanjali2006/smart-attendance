import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import {
  UserPlus,
  Search,
  Users,
  Edit,
  KeyRound,
  UserX,
  UserCheck,
  Building2,
  Zap,
  X,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import CredentialCardModal from '../../components/CredentialCardModal';
import DefaultAvatar from '../../components/DefaultAvatar';
import PhotoUploadModal from '../../components/PhotoUploadModal';

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [resetTargetTeacher, setResetTargetTeacher] = useState(null);
  const [customResetPassword, setCustomResetPassword] = useState('');
  const [resetForceChange, setResetForceChange] = useState(true);
  const [changePasswordTarget, setChangePasswordTarget] = useState(null);
  const [changeNewPassword, setChangeNewPassword] = useState('');
  const [changeConfirmPassword, setChangeConfirmPassword] = useState('');
  const [changeForceChange, setChangeForceChange] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [photoUploadTarget, setPhotoUploadTarget] = useState(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    facultyId: '',
    email: '',
    password: '',
    phone: '',
    department: 'Computer Science & Engineering',
    designation: 'Assistant Professor',
    assignedLabs: 'IdeaLab Hall - 1',
    assignedSubjects: 'Advanced AI & IoT',
    status: 'ACTIVE',
    forcePasswordChange: true
  });

  const fetchTeachers = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (departmentFilter) query.append('department', departmentFilter);
    if (statusFilter) query.append('status', statusFilter);

    const res = await apiRequest(`/admin/teachers?${query.toString()}`);
    if (res.success) {
      setTeachers(res.teachers || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeachers();
  }, [search, departmentFilter, statusFilter]);

  const autoGenerateFormPassword = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setForm((prev) => ({ ...prev, password: `FAC@${randomNum}` }));
  };

  const autoGenerateResetPassword = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setCustomResetPassword(`FAC@${randomNum}`);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    if (editingTeacher) {
      // Update
      const res = await apiRequest(`/admin/teachers/${editingTeacher.id}`, 'PUT', form);
      setSubmitting(false);
      if (res.success) {
        setSuccessMsg('✓ Faculty profile updated successfully!');
        setEditingTeacher(null);
        setShowAddModal(false);
        fetchTeachers();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(res.message || 'Failed to update faculty profile.');
      }
    } else {
      // Create new Faculty
      const res = await apiRequest('/admin/teachers', 'POST', form);
      setSubmitting(false);
      if (res.success && res.credentials) {
        setCreatedCredentials(res.credentials);
        setShowAddModal(false);
        resetForm();
        fetchTeachers();
      } else {
        setErrorMsg(res.message || 'Failed to create faculty account.');
      }
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      facultyId: '',
      email: '',
      password: '',
      phone: '',
      department: 'Computer Science & Engineering',
      designation: 'Assistant Professor',
      assignedLabs: 'IdeaLab Hall - 1',
      assignedSubjects: 'Advanced AI & IoT',
      status: 'ACTIVE',
      forcePasswordChange: true
    });
    setEditingTeacher(null);
    setErrorMsg('');
  };

  const handleEditClick = (t) => {
    setEditingTeacher(t);
    setForm({
      name: t.name,
      facultyId: t.faculty_id,
      email: t.email,
      password: '',
      phone: t.phone || '',
      department: t.department,
      designation: t.designation || 'Assistant Professor',
      assignedLabs: t.assigned_labs || 'IdeaLab Hall - 1',
      assignedSubjects: t.assigned_subjects || 'Advanced AI & IoT',
      status: t.user_status || 'ACTIVE',
      forcePasswordChange: true
    });
    setShowAddModal(true);
  };

  const handleSetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetTargetTeacher) return;

    setSubmitting(true);
    const res = await apiRequest(`/admin/teachers/${resetTargetTeacher.id}/reset-password`, 'POST', {
      password: customResetPassword,
      forcePasswordChange: resetForceChange
    });
    setSubmitting(false);

    if (res.success && res.credentials) {
      setResetTargetTeacher(null);
      setCustomResetPassword('');
      setCreatedCredentials(res.credentials);
    } else {
      alert(`Error: ${res.message}`);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!changePasswordTarget) return;

    if (!changeNewPassword || changeNewPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    if (changeNewPassword !== changeConfirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const res = await apiRequest(`/admin/teachers/${changePasswordTarget.id}/password`, 'PUT', {
      newPassword: changeNewPassword,
      forcePasswordChange: changeForceChange
    });
    setSubmitting(false);

    if (res.success) {
      setChangePasswordTarget(null);
      setChangeNewPassword('');
      setChangeConfirmPassword('');
      if (res.credentials) {
        setCreatedCredentials(res.credentials);
      } else {
        setSuccessMsg('✓ Faculty password changed successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } else {
      alert(`Error: ${res.message}`);
    }
  };

  const [deleteTargetTeacher, setDeleteTargetTeacher] = useState(null);
  const [deletingTeacher, setDeletingTeacher] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deleteTargetTeacher) return;
    setDeletingTeacher(true);
    const res = await apiRequest(`/admin/teachers/${deleteTargetTeacher.id}`, 'DELETE');
    setDeletingTeacher(false);

    if (res.success) {
      setTeachers((prev) => prev.filter((t) => t.id !== deleteTargetTeacher.id));
      setDeleteTargetTeacher(null);
      setSuccessMsg('✓ Faculty member and all associated records deleted safely!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      alert(`Error deleting faculty member: ${res.message}`);
    }
  };


  const handleStatusToggle = async (t, newStatus) => {
    const actionName = newStatus === 'ACTIVE' ? 'Reactivate' : 'Deactivate / Suspend';
    if (!window.confirm(`${actionName} account for Faculty ${t.name}? (Attendance records will remain preserved)`)) return;

    const res = await apiRequest(`/admin/teachers/${t.id}/status`, 'POST', { status: newStatus });
    if (res.success) {
      fetchTeachers();
    } else {
      alert(`Error: ${res.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" /> Admin Faculty Management
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Faculty Accounts & Custom Passwords
          </h1>
          <p className="text-xs text-gray-400 font-mono">
            Admin can issue faculty profiles, set custom passwords, or auto-generate temporary credentials.
          </p>
        </div>

        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:opacity-90 text-white text-xs font-bold font-mono transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ CREATE FACULTY ACCOUNT</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold rounded-xl text-center">
          {successMsg}
        </div>
      )}

      {/* Search and Filters */}
      <div className="glass-card p-4 border-white/10 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Faculty Name, ID, Email, Dept..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto font-mono text-xs">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-gray-300 focus:outline-none"
          >
            <option value="">All Departments</option>
            <option value="Computer Science & Engineering">CSE</option>
            <option value="Electronics & Communication">ECE</option>
            <option value="Mechanical Engineering">ME</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-gray-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>
      </div>

      {/* Faculty Table */}
      <div className="glass-card border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-gray-400">
                <th className="p-4">PHOTO</th>
                <th className="p-4">FACULTY NAME</th>
                <th className="p-4">FACULTY ID</th>
                <th className="p-4">DEPARTMENT & DESIGNATION</th>
                <th className="p-4">ASSIGNED LABS</th>
                <th className="p-4">STATUS</th>
                <th className="p-4">LAST LOGIN</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-400">
                    Loading faculty records...
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500">
                    No faculty accounts found. Click "+ CREATE FACULTY ACCOUNT" to add an instructor.
                  </td>
                </tr>
              ) : (
                teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-all">
                    <td className="p-4">
                      {t.profile_photo ? (
                        <img src={t.profile_photo} alt={t.name} className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/40" />
                      ) : (
                        <DefaultAvatar size={40} />
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-white block">{t.name}</span>
                        <span className="text-[10px] text-gray-400 block">{t.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                        {t.faculty_id}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-200 block">{t.department}</span>
                      <span className="text-[10px] text-indigo-400 block">{t.designation || 'Assistant Professor'}</span>
                    </td>
                    <td className="p-4 text-gray-300">
                      {t.assigned_labs || 'IdeaLab Hall - 1'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          t.user_status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : t.user_status === 'SUSPENDED'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {t.user_status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">
                      {t.last_login ? new Date(t.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPhotoUploadTarget(t)}
                          title={t.profile_photo ? "Change Photo" : "Add Photo"}
                          className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-mono flex items-center gap-1 text-[10px]"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>{t.profile_photo ? "Change" : "Add Photo"}</span>
                        </button>
                        <button
                          onClick={() => handleEditClick(t)}
                          title="Edit Profile"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setResetTargetTeacher(t); setCustomResetPassword(''); }}
                          title="Generate Temporary / Reset Password"
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-mono flex items-center gap-1 text-[10px]"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Reset</span>
                        </button>
                        <button
                          onClick={() => { setChangePasswordTarget(t); setChangeNewPassword(''); setChangeConfirmPassword(''); }}
                          title="Change Password"
                          className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-mono flex items-center gap-1 text-[10px]"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Change</span>
                        </button>
                        {t.user_status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleStatusToggle(t, 'INACTIVE')}
                            title="Deactivate Account"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusToggle(t, 'ACTIVE')}
                            title="Reactivate Account"
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTargetTeacher(t)}
                          title="Delete Faculty Profile"
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-mono flex items-center gap-1 text-[10px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Faculty Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-card max-w-xl w-full p-6 border-indigo-500/40 relative font-mono">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">
              {editingTeacher ? 'Edit Faculty Profile' : 'Admin — Create Faculty Account'}
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              {editingTeacher
                ? 'Modify instructor parameters. Status controls system authorization.'
                : 'Set a custom password or auto-generate credentials for the instructor.'}
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">FACULTY FULL NAME *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Dr. Priyanshu Sharma"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">FACULTY ID *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingTeacher}
                    value={form.facultyId}
                    onChange={(e) => setForm({ ...form, facultyId: e.target.value })}
                    placeholder="e.g. FAC-CSE-001"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">EMAIL ADDRESS *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="faculty@idealab.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {!editingTeacher && (
                <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-indigo-300 font-bold">SET FACULTY PASSWORD</label>
                    <button
                      type="button"
                      onClick={autoGenerateFormPassword}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3 text-cyan-300" />
                      <span>Auto-Generate</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Type custom password or click Auto-Generate..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <label className="flex items-center gap-2 text-gray-300 text-[11px] pt-1">
                    <input
                      type="checkbox"
                      checked={form.forcePasswordChange}
                      onChange={(e) => setForm({ ...form, forcePasswordChange: e.target.checked })}
                      className="rounded border-white/10 bg-white/5"
                    />
                    <span>Force password change on first login</span>
                  </label>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">DEPARTMENT</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="e.g. Computer Science & Engineering"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">DESIGNATION</label>
                  <select
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor & Head">Professor & Head</option>
                    <option value="Lab Administrator">Lab Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">ASSIGNED LAB ROOMS</label>
                  <input
                    type="text"
                    value={form.assignedLabs}
                    onChange={(e) => setForm({ ...form, assignedLabs: e.target.value })}
                    placeholder="IdeaLab Hall - 1, Robotics Lab"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">ACCOUNT STATUS</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="ACTIVE">ACTIVE (Can log in)</option>
                    <option value="INACTIVE">INACTIVE (Disabled)</option>
                    <option value="SUSPENDED">SUSPENDED (Locked)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30"
                >
                  {submitting ? 'Processing...' : editingTeacher ? 'UPDATE FACULTY' : 'CREATE FACULTY'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Set Custom Password Modal */}
      {resetTargetTeacher && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-md w-full p-6 border-amber-500/40 relative font-mono text-xs">
            <button
              onClick={() => setResetTargetTeacher(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Admin — Set Faculty Password</h3>
                <p className="text-gray-400 text-[11px]">{resetTargetTeacher.name} ({resetTargetTeacher.faculty_id})</p>
              </div>
            </div>

            <form onSubmit={handleSetPasswordSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-gray-300 font-bold">ENTER NEW PASSWORD</label>
                  <button
                    type="button"
                    onClick={autoGenerateResetPassword}
                    className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold rounded flex items-center gap-1 border border-amber-500/30"
                  >
                    <Zap className="w-3 h-3" /> Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={customResetPassword}
                  onChange={(e) => setCustomResetPassword(e.target.value)}
                  placeholder="Type custom password or click Auto-Generate..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={resetForceChange}
                  onChange={(e) => setResetForceChange(e.target.checked)}
                  className="rounded border-white/10 bg-white/5"
                />
                <span>Force password change on next login</span>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetTargetTeacher(null)}
                  className="flex-1 py-2.5 bg-white/5 text-gray-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !customResetPassword}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-lg"
                >
                  {submitting ? 'Setting...' : 'SET PASSWORD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Change Password Modal */}
      {changePasswordTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-md w-full p-6 border-cyan-500/40 relative font-mono text-xs">
            <button
              onClick={() => setChangePasswordTarget(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Admin — Change Faculty Password</h3>
                <p className="text-gray-400 text-[11px]">{changePasswordTarget.name} ({changePasswordTarget.faculty_id})</p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-cyan-300 text-[11px]">
              <strong>Account Security:</strong> Faculty ID: <span className="text-white font-bold">{changePasswordTarget.faculty_id}</span>
              <br />Status: <span className="text-white font-bold">{changePasswordTarget.user_status || 'ACTIVE'}</span>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 font-bold mb-1">NEW PASSWORD</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={changeNewPassword}
                  onChange={(e) => setChangeNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars)..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">CONFIRM PASSWORD</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={changeConfirmPassword}
                  onChange={(e) => setChangeConfirmPassword(e.target.value)}
                  placeholder="Re-enter password to confirm..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
                {changeNewPassword && changeConfirmPassword && changeNewPassword !== changeConfirmPassword && (
                  <p className="text-red-400 text-[10px] mt-1">⚠️ Passwords do not match</p>
                )}
              </div>

              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={changeForceChange}
                  onChange={(e) => setChangeForceChange(e.target.checked)}
                  className="rounded border-white/10 bg-white/5"
                />
                <span>Force password change on next login</span>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setChangePasswordTarget(null)}
                  className="flex-1 py-2.5 bg-white/5 text-gray-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !changeNewPassword || changeNewPassword !== changeConfirmPassword}
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-lg"
                >
                  {submitting ? 'Updating...' : 'CHANGE PASSWORD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Faculty Confirmation Modal */}
      {deleteTargetTeacher && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-md w-full p-6 border-red-500/40 relative font-mono">
            <button
              onClick={() => setDeleteTargetTeacher(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-1">Confirm Faculty Deletion</h3>
                <p className="text-xs text-gray-300">
                  Are you sure you want to permanently delete <strong className="text-red-300">{deleteTargetTeacher.name}</strong> (ID: <span className="text-indigo-300 font-bold">{deleteTargetTeacher.faculty_id}</span>)?
                </p>
              </div>

              <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-left text-[11px] text-red-300 space-y-1">
                <p className="font-bold">⚠️ Warning: Irreversible Action</p>
                <ul className="list-disc list-inside text-gray-400 space-y-0.5 text-[10px]">
                  <li>Faculty user account & login access will be deleted</li>
                  <li>Assigned projects & classes will be updated/cleared</li>
                  <li>System notifications for this user will be removed</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTargetTeacher(null)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deletingTeacher}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-red-600/30"
                >
                  {deletingTeacher ? 'Deleting...' : 'DELETE PERMANENTLY'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      <PhotoUploadModal
        isOpen={!!photoUploadTarget}
        onClose={() => setPhotoUploadTarget(null)}
        endpoint={`/admin/faculty/${photoUploadTarget?.id}/photo`}
        title={`Upload Profile Photo - ${photoUploadTarget?.name}`}
        onSuccess={(photoUrl) => {
          setSuccessMsg('✓ Faculty photo updated successfully!');
          fetchTeachers();
          setTimeout(() => setSuccessMsg(''), 4000);
        }}
      />

      {/* Credential Card Display Modal */}
      {createdCredentials && (
        <CredentialCardModal
          credentials={createdCredentials}
          onClose={() => setCreatedCredentials(null)}
        />
      )}
    </div>
  );
}
