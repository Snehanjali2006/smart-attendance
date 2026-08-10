const db = require('../config/database');

exports.getAttendanceReport = (req, res) => {
  try {
    const { branch, year, department, startDate, endDate, category } = req.query;

    let query = 'SELECT * FROM students WHERE status = "ACTIVE"';
    const params = [];

    if (branch && branch !== 'ALL') {
      query += ' AND branch = ?';
      params.push(branch);
    }
    if (year && year !== 'ALL') {
      query += ' AND year = ?';
      params.push(year);
    }
    if (department && department !== 'ALL') {
      query += ' AND department = ?';
      params.push(department);
    }
    if (category && category !== 'ALL') {
      query += ' AND student_category = ?';
      params.push(category.toUpperCase());
    }

    query += ' ORDER BY name ASC';
    const students = db.prepare(query).all(...params);

    const totalSessionsCount = db.prepare('SELECT COUNT(*) as count FROM attendance_sessions').get().count || 1;

    const reportRows = students.map((st) => {
      const pCount = db.prepare('SELECT COUNT(*) as count FROM attendance WHERE student_id = ? AND status = "PRESENT"').get(st.student_id).count;
      const aCount = Math.max(0, totalSessionsCount - pCount);
      const pct = Math.round((pCount / totalSessionsCount) * 100);

      return {
        studentName: st.name,
        sic: st.student_id,
        branch: st.branch,
        year: st.year,
        department: st.department,
        studentCategory: st.student_category || 'SIC',
        totalSessions: totalSessionsCount,
        present: pCount,
        absent: aCount,
        attendancePercentage: `${pct}%`
      };
    });

    res.json({
      success: true,
      summary: {
        totalStudents: students.length,
        generatedAt: new Date().toISOString(),
        filters: { branch, year, department, category, startDate, endDate }
      },
      report: reportRows
    });

  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate attendance report.' });
  }
};
