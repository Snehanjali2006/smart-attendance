import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import {
  UserPlus,
  Search,
  KeyRound,
  Edit,
  UserX,
  UserCheck,
  GraduationCap,
  Sparkles,
  Zap,
  X,
  Check,
  Trash2
} from 'lucide-react';
import CredentialCardModal from '../../components/CredentialCardModal';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [resetTargetStudent, setResetTargetStudent] = useState(null);
  const [customResetPassword, setCustomResetPassword] = useState('');
  const [resetForceChange, setResetForceChange] = useState(true);
  const [changePasswordTarget, setChangePasswordTarget] = useState(null);
  const [changeNewPassword, setChangeNewPassword] = useState('');
  const [changeConfirmPassword, setChangeConfirmPassword] = useState('');
  const [changeForceChange, setChangeForceChange] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [form, setForm] = useState({
    name: '',
    studentId: '',
    email: '',
    password: '',
    phone: '',
    studentCategory: 'SIC',
    branch: 'Computer Science',
    department: 'CSE',
    year: '3rd Year',
    semester: 'Semester 5',
    division: 'A',
    academicYear: '2025-2026',
    status: 'ACTIVE',
    forcePasswordChange: true
  });

  const fetchStudents = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (branchFilter) query.append('branch', branchFilter);
    if (yearFilter) query.append('year', yearFilter);
    if (statusFilter) query.append('status', statusFilter);
    if (categoryFilter) query.append('category', categoryFilter);

    const res = await apiRequest(`/admin/students?${query.toString()}`);
    if (res.success) {
      setStudents(res.students || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, [search, branchFilter, yearFilter, statusFilter, categoryFilter]);

  const autoGenerateFormPassword = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setForm((prev) => ({ ...prev, password: `ILAB@${randomNum}` }));
  };

  const autoGenerateResetPassword = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setCustomResetPassword(`ILAB@${randomNum}`);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    if (editingStudent) {
      // Update
      const res = await apiRequest(`/admin/students/${editingStudent.id}`, 'PUT', form);
      setSubmitting(false);
      if (res.success) {
        setSuccessMsg('✓ Student profile updated successfully!');
        setEditingStudent(null);
        setShowAddModal(false);
        fetchStudents();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(res.message || 'Failed to update student profile.');
      }
    } else {
      // Create new Student
      const res = await apiRequest('/admin/students', 'POST', form);
      setSubmitting(false);
      if (res.success && res.credentials) {
        setCreatedCredentials(res.credentials);
        setShowAddModal(false);
        resetForm();
        fetchStudents();
      } else {
        setErrorMsg(res.message || 'Failed to create student account.');
      }
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      studentId: '',
      email: '',
      password: '',
      phone: '',
      studentCategory: 'SIC',
      branch: 'Computer Science',
      department: 'CSE',
      year: '3rd Year',
      semester: 'Semester 5',
      division: 'A',
      academicYear: '2025-2026',
      status: 'ACTIVE',
      forcePasswordChange: true
    });
    setEditingStudent(null);
    setErrorMsg('');
  };

  const handleEditClick = (st) => {
    setEditingStudent(st);
    setForm({
      name: st.name,
      studentId: st.student_id,
      email: st.email,
      password: '',
      phone: st.phone || '',
      studentCategory: st.student_category || 'SIC',
      branch: st.branch,
      department: st.department,
      year: st.year,
      semester: st.semester,
      division: st.division || 'A',
      academicYear: st.academic_year || '2025-2026',
      status: st.user_status || 'ACTIVE',
      forcePasswordChange: true
    });
    setShowAddModal(true);
  };

  const handleSetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetTargetStudent) return;

    setSubmitting(true);
    const res = await apiRequest(`/admin/students/${resetTargetStudent.id}/reset-password`, 'POST', {
      password: customResetPassword,
      forcePasswordChange: resetForceChange
    });
    setSubmitting(false);

    if (res.success && res.credentials) {
      setResetTargetStudent(null);
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
    const res = await apiRequest(`/admin/students/${changePasswordTarget.id}/password`, 'PUT', {
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
        setSuccessMsg('✓ Student password changed successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } else {
      alert(`Error: ${res.message}`);
    }
  };

  const [deleteTargetStudent, setDeleteTargetStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deleteTargetStudent) return;
    setDeletingStudent(true);
    const res = await apiRequest(`/admin/students/${deleteTargetStudent.id}`, 'DELETE');
    setDeletingStudent(false);

    if (res.success) {
      setStudents((prev) => prev.filter((s) => s.id !== deleteTargetStudent.id));
      setDeleteTargetStudent(null);
      setSuccessMsg('✓ Student and all associated records deleted safely!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      alert(`Error deleting student: ${res.message}`);
    }
  };

  const handleStatusToggle = async (st, newStatus) => {
    const actionName = newStatus === 'ACTIVE' ? 'Reactivate' : 'Deactivate / Suspend';
    if (!window.confirm(`${actionName} account for ${st.name}? (Attendance records will remain preserved)`)) return;

    const res = await apiRequest(`/admin/students/${st.id}/status`, 'POST', { status: newStatus });
    if (res.success) {
      fetchStudents();
    } else {
      alert(`Error: ${res.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-violet-400 font-mono text-xs font-bold uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4" /> Admin User Account System
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Student User Profiles & Passwords
          </h1>
          <p className="text-xs text-gray-400 font-mono">
            Admin can create accounts, set custom passwords or auto-generate credentials with forced password change.
          </p>
        </div>

        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white text-xs font-bold font-mono transition-all flex items-center gap-2 shadow-lg shadow-violet-600/30"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ CREATE STUDENT ACCOUNT</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold rounded-xl text-center">
          {successMsg}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 border-white/10 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Name, SIC, Email, Branch..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto font-mono text-xs">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-gray-300 focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="SIC">SIC (Student Innovation Council)</option>
            <option value="SC">SC (Student Chapter)</option>
          </select>

          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-gray-300 focus:outline-none"
          >
            <option value="">All Branches</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Electronics & Comm">Electronics & Comm</option>
            <option value="Mechanical Engg">Mechanical Engg</option>
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-gray-300 focus:outline-none"
          >
            <option value="">All Years</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
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

      {/* Student Table */}
      <div className="glass-card border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-gray-400">
                <th className="p-4">STUDENT NAME</th>
                <th className="p-4">CATEGORY</th>
                <th className="p-4">SIC / STUDENT ID</th>
                <th className="p-4">BRANCH & DEPT</th>
                <th className="p-4">YEAR & SEM</th>
                <th className="p-4">STATUS</th>
                <th className="p-4">LAST LOGIN</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-400">
                    Loading student user records...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500">
                    No student records found. Click "+ CREATE STUDENT ACCOUNT" to issue a profile.
                  </td>
                </tr>
              ) : (
                students.map((st) => (
                  <tr key={st.id} className="hover:bg-white/5 transition-all">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center font-bold text-violet-300">
                          {st.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-white block">{st.name}</span>
                          <span className="text-[10px] text-gray-400 block">{st.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        st.student_category === 'SC' 
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' 
                          : 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                      }`}>
                        {st.student_category || 'SIC'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-violet-300 bg-violet-500/10 px-2 py-1 rounded border border-violet-500/20">
                        {st.student_id}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-200 block">{st.branch}</span>
                      <span className="text-[10px] text-gray-400 block">Dept: {st.department}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-300 block">{st.year}</span>
                      <span className="text-[10px] text-gray-400 block">{st.semester} • Div {st.division || 'A'}</span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          st.user_status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : st.user_status === 'SUSPENDED'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {st.user_status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">
                      {st.last_login ? new Date(st.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEditClick(st)}
                          title="Edit Profile"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setResetTargetStudent(st); setCustomResetPassword(''); }}
                          title="Generate Temporary / Reset Password"
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-mono flex items-center gap-1 text-[10px]"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Reset</span>
                        </button>
                        <button
                          onClick={() => { setChangePasswordTarget(st); setChangeNewPassword(''); setChangeConfirmPassword(''); }}
                          title="Change Password"
                          className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-mono flex items-center gap-1 text-[10px]"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Change</span>
                        </button>
                        {st.user_status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleStatusToggle(st, 'INACTIVE')}
                            title="Deactivate Account"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusToggle(st, 'ACTIVE')}
                            title="Reactivate Account"
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTargetStudent(st)}
                          title="Delete Student Profile"
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

      {/* Add / Edit Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-card max-w-xl w-full p-6 border-violet-500/40 relative font-mono">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">
              {editingStudent ? 'Edit Student Profile' : 'Admin — Create Student Account'}
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              {editingStudent
                ? 'Modify student details. User status controls login access.'
                : 'Set a custom password or auto-generate one for the student.'}
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">STUDENT FULL NAME *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Snehanjali Baseshankar"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">SIC / STUDENT ID *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingStudent}
                    value={form.studentId}
                    onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                    placeholder="e.g. 23CSE1045"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-violet-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">EMAIL ADDRESS *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="student@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {!editingStudent && (
                <div className="p-3 bg-violet-950/40 border border-violet-500/30 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-violet-300 font-bold">SET STUDENT PASSWORD</label>
                    <button
                      type="button"
                      onClick={autoGenerateFormPassword}
                      className="px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold rounded-lg flex items-center gap-1"
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
                  <label className="block text-gray-400 mb-1">STUDENT CATEGORY *</label>
                  <select
                    value={form.studentCategory}
                    onChange={(e) => setForm({ ...form, studentCategory: e.target.value })}
                    className="w-full bg-slate-900 border border-violet-500/40 rounded-xl px-3 py-2 text-violet-300 font-bold focus:outline-none"
                  >
                    <option value="SIC">SIC — Student Innovation Council</option>
                    <option value="SC">SC — Student Chapter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">BRANCH</label>
                  <select
                    value={form.branch}
                    onChange={(e) => setForm({ ...form, branch: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronics & Comm">Electronics & Comm</option>
                    <option value="Mechanical Engg">Mechanical Engg</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">YEAR</label>
                  <select
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">SEMESTER</label>
                  <select
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Semester 4">Semester 4</option>
                    <option value="Semester 5">Semester 5</option>
                    <option value="Semester 6">Semester 6</option>
                    <option value="Semester 7">Semester 7</option>
                    <option value="Semester 8">Semester 8</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">DIVISION</label>
                  <input
                    type="text"
                    value={form.division}
                    onChange={(e) => setForm({ ...form, division: e.target.value })}
                    placeholder="e.g. A"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">PHONE NUMBER</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 9876543210"
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
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-violet-600/30"
                >
                  {submitting ? 'Processing...' : editingStudent ? 'UPDATE STUDENT' : 'CREATE STUDENT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Set Custom Password Modal */}
      {resetTargetStudent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-md w-full p-6 border-amber-500/40 relative font-mono text-xs">
            <button
              onClick={() => setResetTargetStudent(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Admin — Set Password</h3>
                <p className="text-gray-400 text-[11px]">{resetTargetStudent.name} ({resetTargetStudent.student_id})</p>
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
                  onClick={() => setResetTargetStudent(null)}
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
                <h3 className="text-base font-bold text-white">Admin — Change Student Password</h3>
                <p className="text-gray-400 text-[11px]">{changePasswordTarget.name} ({changePasswordTarget.student_id})</p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-cyan-300 text-[11px]">
              <strong>Account Security:</strong> Student ID: <span className="text-white font-bold">{changePasswordTarget.student_id}</span>
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

      {/* Delete Student Confirmation Modal */}
      {deleteTargetStudent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-md w-full p-6 border-red-500/40 relative font-mono">
            <button
              onClick={() => setDeleteTargetStudent(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-1">Confirm Student Deletion</h3>
                <p className="text-xs text-gray-300">
                  Are you sure you want to permanently delete <strong className="text-red-300">{deleteTargetStudent.name}</strong> (SIC: <span className="text-violet-300 font-bold">{deleteTargetStudent.student_id}</span>)?
                </p>
              </div>

              <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-left text-[11px] text-red-300 space-y-1">
                <p className="font-bold">⚠️ Warning: Irreversible Action</p>
                <ul className="list-disc list-inside text-gray-400 space-y-0.5 text-[10px]">
                  <li>User account & login access will be removed</li>
                  <li>Attendance records will be deleted</li>
                  <li>Project memberships & join requests will be cleared</li>
                  <li>Notifications for this user will be removed</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTargetStudent(null)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deletingStudent}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-red-600/30"
                >
                  {deletingStudent ? 'Deleting...' : 'DELETE PERMANENTLY'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
