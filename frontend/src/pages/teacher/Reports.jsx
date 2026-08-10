import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { FileBarChart, Download, FileSpreadsheet, FileText, Filter } from 'lucide-react';

export default function Reports() {
  const [filters, setFilters] = useState({
    branch: 'ALL',
    year: 'ALL',
    department: 'ALL',
    category: 'ALL'
  });
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    const query = new URLSearchParams(filters).toString();
    const res = await apiRequest(`/reports/attendance?${query}`);
    if (res.success) {
      setReportData(res.report || []);
    }
    setLoading(false);
  };

  const handleExportCSV = () => {
    exportToCSV('Idealab_Attendance_Report', reportData);
  };

  const handleExportExcel = () => {
    exportToExcel('Idealab_Attendance_Report', reportData);
  };

  const handleExportPDF = () => {
    exportToPDF('Idealab_Attendance_Report', 'IDEALAB SMART ATTENDANCE REPORT', reportData);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Attendance Reports & Analytics</h1>
          <p className="text-xs text-gray-400 font-mono font-medium">Generate custom reports and export to Excel, CSV, or PDF</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={generateReport}
            className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold font-mono shadow-md flex items-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>GENERATE REPORT</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold font-mono shadow-md flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>EXPORT EXCEL</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-cyan-600/90 hover:bg-cyan-600 text-white text-xs font-bold font-mono shadow-md flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-bold font-mono shadow-md flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>EXPORT PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">CATEGORY</label>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="SIC">SIC (Innovation Council)</option>
            <option value="SC">SC (Student Chapter)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">BRANCH</label>
          <select
            value={filters.branch}
            onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
          >
            <option value="ALL">All Branches</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Electronics & Comm">Electronics & Comm</option>
            <option value="Mechanical Engg">Mechanical Engg</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">YEAR</label>
          <select
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
          >
            <option value="ALL">All Academic Years</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">DEPARTMENT</label>
          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="ME">ME</option>
          </select>
        </div>
      </div>

      {/* Generated Report Table */}
      <div className="glass-card overflow-hidden border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-gray-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3.5">Student Name</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">SIC</th>
                <th className="px-4 py-3.5">Branch</th>
                <th className="px-4 py-3.5">Year</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Total Sessions</th>
                <th className="px-4 py-3.5">Present</th>
                <th className="px-4 py-3.5">Absent</th>
                <th className="px-4 py-3.5 text-right">Attendance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-4 py-8 text-center text-gray-400 font-mono">Generating report...</td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-4 py-8 text-center text-gray-400 font-mono">No data matching selected filters.</td>
                </tr>
              ) : (
                reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/5">
                    <td className="px-4 py-3.5 font-bold text-white">{row.studentName}</td>
                    <td className="px-4 py-3.5 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        row.studentCategory === 'SC' 
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' 
                          : 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                      }`}>
                        {row.studentCategory || 'SIC'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-violet-300">{row.sic}</td>
                    <td className="px-4 py-3.5">{row.branch}</td>
                    <td className="px-4 py-3.5">{row.year}</td>
                    <td className="px-4 py-3.5 font-mono text-gray-400">{row.department}</td>
                    <td className="px-4 py-3.5 font-mono text-white">{row.totalSessions}</td>
                    <td className="px-4 py-3.5 font-mono text-emerald-400 font-bold">{row.present}</td>
                    <td className="px-4 py-3.5 font-mono text-red-400 font-bold">{row.absent}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-cyan-300">
                      {row.attendancePercentage}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
