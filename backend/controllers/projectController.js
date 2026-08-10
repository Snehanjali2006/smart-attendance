const db = require('../config/database');

exports.getAllProjects = (req, res) => {
  try {
    const projects = db.prepare('SELECT * FROM projects ORDER BY project_id DESC').all();

    const listWithMembers = projects.map((p) => {
      const members = db.prepare('SELECT student_id, student_name FROM project_members WHERE project_id = ?').all(p.project_id);
      return {
        ...p,
        studentsAssignedCount: members.length,
        members
      };
    });

    res.json({ success: true, projects: listWithMembers });

  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve projects list.' });
  }
};

exports.createProject = (req, res) => {
  try {
    const { projectName, description, status, startDate, deadline, assignedStudents } = req.body;

    if (!projectName) {
      return res.status(400).json({ success: false, message: 'Project Name is required.' });
    }

    const nextNum = db.prepare('SELECT COUNT(*) as count FROM projects').get().count + 1;
    const projectId = `PRJ-${String(nextNum).padStart(2, '0')}`;

    db.prepare(`
      INSERT INTO projects (project_id, project_name, description, faculty_id, faculty_name, status, start_date, deadline)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      projectId,
      projectName,
      description || '',
      req.user.id,
      req.user.name || 'Dr. Priyanshu Sharma',
      status || 'In Progress',
      startDate || new Date().toISOString().split('T')[0],
      deadline || '2026-12-31'
    );

    if (Array.isArray(assignedStudents)) {
      const insertMember = db.prepare('INSERT INTO project_members (project_id, student_id, student_name) VALUES (?, ?, ?)');
      assignedStudents.forEach((st) => {
        insertMember.run(projectId, st.student_id || st.sic, st.name);
      });
    }

    res.json({ success: true, message: 'Project created successfully.', projectId });

  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ success: false, message: 'Failed to create project.' });
  }
};

exports.submitProjectRequest = (req, res) => {
  try {
    const userId = req.user.id;
    const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(userId);

    if (!student) {
      return res.status(403).json({ success: false, message: 'Only students can submit project requests.' });
    }

    const { projectName, projectId, reason, problemStatement, expectedOutcome, teamMembers, message } = req.body;

    if (!projectName) {
      return res.status(400).json({ success: false, message: 'Project Name is required.' });
    }

    const resReq = db.prepare(`
      INSERT INTO project_requests (student_id, student_name, project_id, project_name, faculty_id, reason, problem_statement, expected_outcome, team_members, message, status)
      VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, 'PENDING')
    `).run(
      student.student_id,
      student.name,
      projectId || null,
      projectName,
      reason || '',
      problemStatement || '',
      expectedOutcome || '',
      teamMembers || student.name,
      message || ''
    );

    res.json({
      success: true,
      message: 'Project request submitted successfully to IdeaLab faculty.',
      requestId: resReq.lastInsertRowid
    });

  } catch (err) {
    console.error('Submit project request error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit project request.' });
  }
};

exports.getProjectRequests = (req, res) => {
  try {
    const requests = db.prepare('SELECT * FROM project_requests ORDER BY created_at DESC').all();
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch project requests.' });
  }
};

exports.updateProjectRequestStatus = (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body; // 'APPROVED' or 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be APPROVED or REJECTED.' });
    }

    const request = db.prepare('SELECT * FROM project_requests WHERE request_id = ?').get(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Project request not found.' });
    }

    db.prepare('UPDATE project_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE request_id = ?').run(status, requestId);

    // Notify student
    const studentObj = db.prepare('SELECT user_id FROM students WHERE student_id = ?').get(request.student_id);
    if (studentObj) {
      const notifTitle = status === 'APPROVED' ? '✓ Project Request Approved' : '❌ Project Request Update';
      const notifMessage = status === 'APPROVED'
        ? `Your request to work on "${request.project_name}" has been APPROVED by Dr. Priyanshu.`
        : `Your request for "${request.project_name}" was not approved at this time.`;

      db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(
        studentObj.user_id,
        notifTitle,
        notifMessage,
        status === 'APPROVED' ? 'SUCCESS' : 'WARNING'
      );
    }

    // If approved, add student to project members
    if (status === 'APPROVED' && request.project_id) {
      db.prepare('INSERT OR IGNORE INTO project_members (project_id, student_id, student_name) VALUES (?, ?, ?)').run(
        request.project_id,
        request.student_id,
        request.student_name
      );
    }

    res.json({ success: true, message: `Project request ${status.toLowerCase()} successfully.` });

  } catch (err) {
    console.error('Update request error:', err);
    res.status(500).json({ success: false, message: 'Failed to update project request.' });
  }
};
