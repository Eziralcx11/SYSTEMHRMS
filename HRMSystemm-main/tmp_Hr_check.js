



// ============================================
// APPLICANTS DATA
// ============================================
const applicantsData = [];
let hrEmployeesData = [];

let currentApplicantIndex = -1;

// ============================================
// LOAD APPLICATIONS FROM apply.html (localStorage)
// ============================================
function loadExternalApplications() {
  let external = [];
  try {
    external = JSON.parse(localStorage.getItem('qc_applications')) || [];
  } catch (e) {
    external = [];
  }

  external.forEach(app => {
    const lines = [
      'Application ID: ' + (app.applicationId || '—'),
      'Full Name: ' + (app.fullName || app.name || '—'),
      'Date of Birth: ' + (app.birthdate || '—'),
      'Gender: ' + (app.gender || '—'),
      'Civil Status: ' + (app.civilStatus || '—'),
      'Email: ' + (app.email || '—'),
      'Contact Number: ' + (app.contactNo || '—'),
      'Complete Address: ' + (app.address || '—'),
      'Position Applying For: ' + (app.position || '—'),
      'Employment Type: ' + (app.employmentType || '—'),
      'Years of Experience: ' + (app.yearsExp || '—'),
      'Preferred Work Shift: ' + (app.shift || '—'),
      'Highest Educational Attainment: ' + (app.education || '—'),
      'School / University: ' + (app.school || '—'),
      'Course / Program: ' + (app.course || '—'),
      'Year Graduated: ' + (app.yearGrad || '—'),
      'High School: ' + (app.highSchool || '—'),
      'High School Year: ' + (app.highSchoolYear || '—'),
      'Academic Honors: ' + (app.honors || '—'),
      'Resume / CV: ' + (app.resumeName || 'Not uploaded')
    ];

    applicantsData.push({
      name: app.fullName || app.name || 'Applicant',
      email: app.email || '—',
      position: app.position || '—',
      date: app.date || '—',
      status: app.status || 'Pending',
      availability: app.availability === 'not-available' ? 'Not Available' : (app.availability === 'available' ? 'Available' : 'Not Set'),
      yearsExp: app.yearsExp || '',
      details: lines.join('\n')
    });
  });
}

// ============================================
// VIEW APPLICANT
// ============================================
function viewApplicant(index) {
  const app = applicantsData[index];
  document.getElementById('viewApplicantName').textContent = app.name;
  document.getElementById('viewApplicantEmail').textContent = app.email;
  document.getElementById('viewApplicantPosition').textContent = app.position;
  document.getElementById('viewApplicantDate').textContent = app.date;
  document.getElementById('viewApplicantStatus').textContent = app.status;
  document.getElementById('viewApplicantAvailability').textContent = app.availability;
  document.getElementById('viewApplicantDetails').innerHTML = renderApplicantDetails(app.details);
  document.getElementById('viewApplicantResume').innerHTML = app.resumePath
    ? '<button type="button" class="btn btn-sm btn-gold" onclick="openResumeViewer(\'' + encodeURIComponent(app.resumePath) + '\',\'' + encodeURIComponent(app.resumeName || 'Resume / CV') + '\')"><i class="fas fa-file-pdf"></i> View Resume / CV</button>'
    : '<span style="color:#80624E;font-size:13px;"><i class="fas fa-file-circle-xmark"></i> No resume file available.</span>';
  document.getElementById('viewApplicantModal').classList.add('show');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function hrFormatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function hrInferDepartment(position) {
  const value = String(position || '').toLowerCase();
  if (value.includes('barista') || value.includes('cashier')) return 'Operations';
  return 'Operations';
}

function hrEmployeeStatusLabel(status) {
  if (status === 'approved') return 'Active';
  if (status === 'inactive') return 'Not Active / Resigned';
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : '-';
}

function hrEmployeeStatusClass(status) {
  if (status === 'approved') return 'status-active';
  if (status === 'inactive') return 'status-leave';
  return 'status-pending';
}

function relativeDateLabel(value) {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return minutes + ' minute' + (minutes === 1 ? '' : 's') + ' ago';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + ' hour' + (hours === 1 ? '' : 's') + ' ago';
  const days = Math.floor(hours / 24);
  return days + ' day' + (days === 1 ? '' : 's') + ' ago';
}

function renderHrDashboardActivity() {
  const list = document.getElementById('hrRecentActivityList');
  if (!list) return;

  const activities = [];
  applicantsData.forEach(app => {
    activities.push({
      text: 'Applicant ' + app.name + ' is ' + app.status,
      time: app.createdAt || '',
      dot: app.status === 'Rejected' || app.status === 'Interview Not Passed' ? 'activity-dot-red' : 'activity-dot-blue'
    });
  });
  hrEmployeesData.forEach(employee => {
    activities.push({
      text: employee.full_name + ' is ' + hrEmployeeStatusLabel(employee.status),
      time: employee.created_at || '',
      dot: employee.status === 'approved' ? 'activity-dot-green' : 'activity-dot-gold'
    });
  });

  activities.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
  const visible = activities.slice(0, 6);
  if (!visible.length) {
    list.innerHTML = '<div class="activity-item"><div class="activity-dot activity-dot-gold"></div><div class="activity-info"><span class="activity-text">No employee or applicant activity yet.</span><span class="activity-time">Database is empty</span></div></div>';
    return;
  }

  list.innerHTML = visible.map(item =>
    '<div class="activity-item">' +
      '<div class="activity-dot ' + item.dot + '"></div>' +
      '<div class="activity-info">' +
        '<span class="activity-text">' + escapeHtml(item.text) + '</span>' +
        '<span class="activity-time">' + escapeHtml(relativeDateLabel(item.time)) + '</span>' +
      '</div>' +
    '</div>'
  ).join('');
}

function renderHrUpcomingEvents() {
  const list = document.getElementById('hrUpcomingEventsList');
  if (!list) return;

  const events = applicantsData
    .filter(app => app.interviewDate && app.interviewTime)
    .map(app => {
      const date = new Date(app.interviewDate + 'T' + app.interviewTime);
      return { app, date };
    })
    .filter(item => !Number.isNaN(item.date.getTime()) && item.date >= new Date())
    .sort((a, b) => a.date - b.date)
    .slice(0, 4);

  if (!events.length) {
    list.innerHTML = '<div class="event-item"><div class="event-date-box"><span class="event-date-num">--</span><span class="event-date-month">---</span></div><div class="event-info"><span class="event-title">No upcoming interviews</span><span class="event-desc">Scheduled applicant interviews will appear here.</span><span class="event-time"><i class="fas fa-clock"></i> None scheduled</span></div></div>';
    return;
  }

  list.innerHTML = events.map(item => {
    const date = item.date;
    return '<div class="event-item">' +
      '<div class="event-date-box"><span class="event-date-num">' + date.getDate() + '</span><span class="event-date-month">' + date.toLocaleString('en-US', { month: 'short' }).toUpperCase() + '</span></div>' +
      '<div class="event-info">' +
        '<span class="event-title">' + escapeHtml(item.app.status.replace('Scheduled', '').trim() || 'Interview') + '</span>' +
        '<span class="event-desc">' + escapeHtml(item.app.name + ' - ' + item.app.position) + '</span>' +
        '<span class="event-time"><i class="fas fa-clock"></i> ' + escapeHtml(date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })) + '</span>' +
      '</div>' +
    '</div>';
  }).join('');
}

function renderHrNotifications() {
  const list = document.getElementById('hrNotificationList');
  const badge = document.querySelector('.notif-badge');
  if (!list || !badge) return;

  const items = applicantsData
    .filter(app => app.status === 'Pending' || app.status === 'Final Interview Passed' || app.status === 'Inactive / Resigned')
    .slice(0, 5);

  badge.textContent = String(items.length);
  if (!items.length) {
    list.innerHTML = '<div class="notif-item"><div class="notif-icon notif-icon-gold"><i class="fas fa-bell"></i></div><div class="notif-content"><p class="notif-text">No database notifications yet.</p><span class="notif-time">Live HR updates will appear here</span></div></div>';
    return;
  }

  list.innerHTML = items.map(app => {
    const iconClass = app.status === 'Inactive / Resigned' ? 'notif-icon-red' : (app.status === 'Final Interview Passed' ? 'notif-icon-green' : 'notif-icon-blue');
    const icon = app.status === 'Inactive / Resigned' ? 'fa-user-slash' : (app.status === 'Final Interview Passed' ? 'fa-check-circle' : 'fa-file-alt');
    return '<div class="notif-item notif-unread">' +
      '<div class="notif-icon ' + iconClass + '"><i class="fas ' + icon + '"></i></div>' +
      '<div class="notif-content"><p class="notif-text">' + escapeHtml(app.name + ' - ' + app.status) + '</p><span class="notif-time">' + escapeHtml(relativeDateLabel(app.createdAt)) + '</span></div>' +
    '</div>';
  }).join('');
}

function renderHrEmployeeRows(employees, includeAction, includeContract = false) {
  if (!employees.length) {
    return '<tr><td colspan="' + (includeAction ? '6' : (includeContract ? '6' : '5')) + '" style="text-align:center;">No employee records in the database yet.</td></tr>';
  }

  return employees.map(employee => {
    const status = employee.status || '';
    const cells = [
      '<td><div class="emp-cell"><div class="emp-avatar"><i class="fas fa-user"></i></div><div><span class="emp-name">' + escapeHtml(employee.full_name) + '</span><span class="emp-email">' + escapeHtml(employee.email) + '</span></div></div></td>',
      '<td>' + escapeHtml(employee.position || '-') + '</td>',
      '<td>' + escapeHtml(hrInferDepartment(employee.position)) + '</td>',
      '<td><span class="status-badge ' + hrEmployeeStatusClass(status) + '">' + hrEmployeeStatusLabel(status) + '</span></td>',
      '<td>' + escapeHtml(hrFormatDate(employee.created_at)) + '</td>'
    ];
    if (includeAction) {
      cells.push('<td><button class="btn btn-sm btn-gold" onclick="showPage(\'employees\')"><i class="fas fa-eye"></i></button></td>');
    }
    if (includeContract) {
      const contract = hrEmployeeDocuments.find(document => Number(document.employee_id) === Number(employee.id) && document.document_type === 'employment_contract');
      const contractLabel = !contract ? 'Not Assigned' : (contract.contract_status === 'verified' ? 'Verified' : (contract.contract_status === 'signed' ? 'For Verification' : 'For Signing'));
      const contractClass = contract?.contract_status === 'verified' ? 'status-active' : 'status-pending';
      const contractUrl = contract ? 'php/employee_documents.php?action=file&document_id=' + Number(contract.document_id) : '';
      const contractExtension = contract ? String(contract.file_name || 'contract.pdf').split('.').pop().toLowerCase() : '';
      cells.push('<td><div class="employee-contract-cell"><span class="status-badge ' + contractClass + '">' + contractLabel + '</span>' +
        (contract ? '<button type="button" class="btn btn-sm btn-gold" onclick="openResumeViewer(\'' + encodeURIComponent(contractUrl) + '\',\'' + encodeURIComponent(contract.file_name || 'Employment Contract') + '\',\'' + encodeURIComponent(contractExtension) + '\')"><i class="fas fa-eye"></i> View</button>' : '<button class="btn btn-sm btn-outline" onclick="showPage(\'employee-documents\')"><i class="fas fa-file-circle-plus"></i> Assign</button>') +
        '</div></td>');
    }
    return '<tr>' + cells.join('') + '</tr>';
  }).join('');
}

async function loadHrEmployees() {
  const recentBody = document.getElementById('hrRecentEmployeesBody');
  const fullBody = document.getElementById('hrEmployeesBody');
  const count = document.getElementById('hrEmployeeCount');
  if (!recentBody && !fullBody) return;

  try {
    const response = await fetch('../php/accounts.php?action=list');
    if (response.status === 401 || response.status === 403) {
      showSystemAlert('HR Session Required', 'Please sign in again using an HR or Administrator PIN to view employees.', false);
      setTimeout(() => { window.location.href = 'Login.html'; }, 1800);
      return;
    }
    const result = await response.json();
    if (!result.success) throw new Error(result.message);

    const employees = result.accounts.filter(account => {
      const position = String(account.position || '').toLowerCase();
      return ['approved', 'inactive'].includes(account.status) &&
        position !== 'administrator' &&
        !position.includes('hr') &&
        position !== 'human resources';
    });

    hrEmployeesData = employees;
    document.getElementById('totalEmployees').textContent = employees.filter(employee => employee.status === 'approved').length;
    if (count) count.textContent = employees.length + ' total';
    if (recentBody) recentBody.innerHTML = renderHrEmployeeRows(employees.slice(0, 5), true);
    try {
      const documentResponse = await fetch('../php/employee_documents.php?action=hr_list', { cache: 'no-store' });
      const documentResult = await documentResponse.json();
      if (documentResponse.ok && documentResult.success) hrEmployeeDocuments = documentResult.documents || [];
    } catch (documentError) {
      hrEmployeeDocuments = [];
    }
    if (fullBody) fullBody.innerHTML = renderHrEmployeeRows(employees, false, true);
    renderHrDashboardActivity();
  } catch (error) {
    if (recentBody) recentBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Unable to load employees from the database.</td></tr>';
    if (fullBody) fullBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Unable to load employees from the database.</td></tr>';
  }
}

const detailSkipLabels = ['Email', 'Position Applying For'];

function renderApplicantDetails(text) {
  if (!text || !text.trim()) {
    return '<p class="app-details-empty">No additional details provided.</p>';
  }
  const lines = text.split('\n');
  let html = '';
  lines.forEach(line => {
    const idx = line.indexOf(':');
    if (idx > 0 && idx < 60) {
      const label = line.substring(0, idx).trim();
      const value = line.substring(idx + 1).trim();
      if (detailSkipLabels.includes(label)) return;
      html += '<div class="app-detail-row">' +
                '<span class="app-detail-label">' + escapeHtml(label) + '</span>' +
                '<span class="app-detail-value">' + escapeHtml(value) + '</span>' +
              '</div>';
    } else if (line.trim()) {
      html += '<p class="app-detail-para">' + escapeHtml(line) + '</p>';
    }
  });
  return html;
}

function closeViewApplicant() {
  document.getElementById('viewApplicantModal').classList.remove('show');
}

// ============================================
// REVIEW APPLICANT
// ============================================
function reviewApplicant(index) {
  currentApplicantIndex = index;
  const app = applicantsData[index];
  document.getElementById('reviewApplicantDesc').innerHTML = 'Review application for <strong style="color: #C9A17A;">' + app.name + '</strong>';
  document.getElementById('reviewApplicantEmail').textContent = app.email || 'Not provided';
  document.getElementById('reviewApplicantPosition').textContent = app.position || 'Not provided';
  document.getElementById('reviewApplicantExperience').textContent = app.yearsExp || 'Not provided';
  document.getElementById('reviewApplicantDate').textContent = app.date || 'Not provided';
  document.getElementById('reviewApplicantDetails').innerHTML = renderApplicantDetails(app.details);
  document.getElementById('reviewApplicantResume').innerHTML = app.resumePath
    ? '<button type="button" class="btn btn-sm btn-gold" onclick="openResumeViewer(\'' + encodeURIComponent(app.resumePath) + '\',\'' + encodeURIComponent(app.resumeName || 'Resume / CV') + '\')"><i class="fas fa-file-pdf"></i> View Resume / CV</button>'
    : '<span style="color:rgba(230, 214, 194,0.45); font-size:13px;"><i class="fas fa-file-circle-xmark"></i> No resume uploaded.</span>';
  document.getElementById('reviewRemarks').value = '';
  document.getElementById('reviewApplicantModal').classList.add('show');
}

function closeReviewApplicant() {
  document.getElementById('reviewApplicantModal').classList.remove('show');
  currentApplicantIndex = -1;
}

function openResumeViewer(encodedPath, encodedName, forcedExtension) {
  const path = decodeURIComponent(encodedPath || '');
  const name = decodeURIComponent(encodedName || 'Resume / CV');
  if (!path) return;

  const fileUrl = '../' + encodeURI(path);
  const extension = (forcedExtension || path.split('.').pop()).toLowerCase().split('?')[0];
  const body = document.getElementById('resumeViewerBody');
  document.getElementById('resumeViewerTitle').textContent = name;
  document.getElementById('resumeDownloadLink').href = fileUrl;
  document.getElementById('resumeDownloadLabel').textContent = path.toLowerCase().includes('uploads/resumes/')
    ? 'Download Resume'
    : 'Download Document';

  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
    body.innerHTML = '<img class="resume-viewer-image" src="' + fileUrl + '" alt="Applicant resume">';
  } else if (extension === 'pdf') {
    body.innerHTML = '<iframe class="resume-viewer-frame" src="' + fileUrl + '#toolbar=1&navpanes=0" title="Applicant resume"></iframe>';
  } else {
    body.innerHTML = '<div class="resume-viewer-unavailable"><i class="fas fa-file-word"></i><h3>Preview unavailable</h3><p>DOC and DOCX files cannot be previewed directly by this browser. Use the download button below.</p></div>';
  }

  document.getElementById('resumeViewerModal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeResumeViewer() {
  document.getElementById('resumeViewerModal').classList.remove('show');
  document.getElementById('resumeViewerBody').innerHTML = '';
  document.body.style.overflow = '';
}

function markQualified() {
  if (currentApplicantIndex === -1) return;
  const idx = currentApplicantIndex;
  closeReviewApplicant();
  showQualifyConfirm(idx, 'qualified');
}

function markNotQualified() {
  if (currentApplicantIndex === -1) return;
  const idx = currentApplicantIndex;
  closeReviewApplicant();
  showQualifyConfirm(idx, 'not-qualified');
}

// ============================================
// QUALIFY CONFIRM / RESULT MODALS
// ============================================
let qualifyPendingIndex = -1;
let qualifyPendingAction = ''; // 'qualified' or 'not-qualified'

function showQualifyConfirm(index, action) {
  qualifyPendingIndex = index;
  qualifyPendingAction = action;
  const app = applicantsData[index];
  const title = document.getElementById('qualifyConfirmTitle');
  const desc = document.getElementById('qualifyConfirmDesc');
  const btn = document.getElementById('qualifyConfirmBtn');

  if (action === 'qualified') {
    title.textContent = 'Accept Applicant';
    desc.innerHTML = 'Accept <strong style="color: #C9A17A;">' + app.name + '</strong> and add the applicant to the interview scheduling queue?';
    btn.innerHTML = '<i class="fas fa-user-check"></i> Yes, Accept';
    btn.style.background = 'rgba(139, 94, 60,0.2)';
    btn.style.color = '#8B5E3C';
    btn.style.borderColor = 'rgba(139, 94, 60,0.3)';
  } else {
    title.textContent = 'Reject Applicant';
    desc.innerHTML = 'Are you sure you want to reject <strong style="color: #C9A17A;">' + app.name + '</strong>?';
    btn.innerHTML = '<i class="fas fa-user-times"></i> Yes';
    btn.style.background = 'rgba(139, 94, 60,0.15)';
    btn.style.color = '#8B5E3C';
    btn.style.borderColor = 'rgba(139, 94, 60,0.3)';
  }
  document.getElementById('qualifyConfirmModal').classList.add('show');
}

function closeQualifyConfirm() {
  document.getElementById('qualifyConfirmModal').classList.remove('show');
  qualifyPendingIndex = -1;
  qualifyPendingAction = '';
}

function confirmQualifyAction() {
  if (qualifyPendingIndex === -1) return;
  const app = applicantsData[qualifyPendingIndex];

  if (qualifyPendingAction === 'qualified') {
    app.status = 'Accepted';
    // Show success modal
    const icon = document.getElementById('qualifyResultIcon');
    const iconTag = document.getElementById('qualifyResultIconTag');
    icon.style.background = 'rgba(139, 94, 60,0.15)';
    iconTag.className = 'fas fa-user-check';
    iconTag.style.color = '#8B5E3C';
    document.getElementById('qualifyResultTitle').textContent = 'Application Sent To Admin';
  } else {
    app.status = 'Rejected';
    // Show result modal
    const icon = document.getElementById('qualifyResultIcon');
    const iconTag = document.getElementById('qualifyResultIconTag');
    icon.style.background = 'rgba(139, 94, 60,0.15)';
    iconTag.className = 'fas fa-user-times';
    iconTag.style.color = '#8B5E3C';
    document.getElementById('qualifyResultTitle').textContent = 'Application Rejected';
    document.getElementById('qualifyResultDesc').innerHTML = '<strong style="color: #C9A17A;">' + app.name + '</strong> has been rejected.<br><br>Their application will be archived.';
  }

  closeQualifyConfirm();
  updateApplicantTable();
  setTimeout(() => {
    document.getElementById('qualifyResultModal').classList.add('show');
  }, 300);
}

function closeQualifyResult() {
  document.getElementById('qualifyResultModal').classList.remove('show');
}

// ============================================
// DIRECT QUALIFIED / NOT QUALIFIED (from table)
// ============================================
function markQualifiedDirect(index) {
  showQualifyConfirm(index, 'qualified');
}

function markNotQualifiedDirect(index) {
  showQualifyConfirm(index, 'not-qualified');
}

// ============================================
// SCHEDULE INTERVIEW
// ============================================
function scheduleInterview(index) {
  currentApplicantIndex = index;
  const app = applicantsData[index];
  if (!['Initial Interview Pending', 'Final Interview Pending'].includes(app.status)) {
    currentApplicantIndex = -1;
    alert('This interview cannot be scheduled yet. The applicant must complete the required previous stage first.');
    return;
  }
  const isFinalInterview = app.status === 'Final Interview Pending';
  document.getElementById('scheduleInterviewTitle').textContent = isFinalInterview ? 'Schedule Final Interview' : 'Schedule Initial Interview';
  document.getElementById('scheduleInterviewDesc').innerHTML = 'Set the ' + (isFinalInterview ? 'final' : 'initial') + ' interview schedule for <strong style="color: #C9A17A;">' + app.name + '</strong>';
  // Set default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  // Set min date to today (cannot select past dates)
  const today = new Date();
  document.getElementById('interviewDate').setAttribute('min', today.toISOString().split('T')[0]);
  // Initial interviews must be scheduled within one week from today.
  if (app.status === 'Initial Interview Pending') {
    const lastInitialInterviewDate = new Date();
    lastInitialInterviewDate.setDate(lastInitialInterviewDate.getDate() + 7);
    document.getElementById('interviewDate').setAttribute('max', lastInitialInterviewDate.toISOString().split('T')[0]);
  } else {
    document.getElementById('interviewDate').removeAttribute('max');
  }
  document.getElementById('interviewDate').value = tomorrow.toISOString().split('T')[0];
  document.getElementById('interviewTime').value = '10:00';
  document.getElementById('interviewType').value = 'In-Person';
  document.getElementById('interviewLocation').value = '';
  document.getElementById('scheduleInterviewModal').classList.add('show');
}

function closeScheduleInterview() {
  document.getElementById('scheduleInterviewModal').classList.remove('show');
  currentApplicantIndex = -1;
}

function confirmScheduleInterview() {
  if (currentApplicantIndex === -1) return;
  const app = applicantsData[currentApplicantIndex];
  const date = document.getElementById('interviewDate').value;
  const time = document.getElementById('interviewTime').value;
  const type = document.getElementById('interviewType').value;
  const location = document.getElementById('interviewLocation').value.trim();

  if (!date || !time || !location) {
    alert('Please provide the interview date, time, and venue or meeting link.');
    return;
  }

  app.status = 'For Interview';
  const dateObj = new Date(date + 'T' + time);
  const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  let msg = '📅 Interview Scheduled!\n\n';
  msg += 'Applicant: ' + app.name + '\n';
  msg += 'Date: ' + formattedDate + '\n';
  msg += 'Time: ' + formattedTime + '\n';
  msg += 'Type: ' + type + '\n';
  if (location) msg += 'Location/Link: ' + location + '\n';

  alert(msg);
  updateApplicantTable();
  closeScheduleInterview();
}

// ============================================
// HIRE APPLICANT
// ============================================
let pendingHireIndex = -1;

function hireApplicantNative(index) {
  hireApplicant(index);
  return;
  const app = applicantsData[index];
  if (app.status !== 'Final Interview Passed') {
    showSystemAlert('Hiring Not Available', 'This applicant cannot be hired yet. The initial and final interviews must be completed and the final interview must be marked as passed.', false);
    return;
  }
  if (confirm('Are you sure you want to hire ' + app.name + ' as ' + app.position + '?\n\nThis will move the applicant to the employees list.')) {
    app.status = 'Hired';
    alert('🎉 ' + app.name + ' has been HIRED as ' + app.position + '!\n\nPlease proceed to the Employees page to complete onboarding.');
    updateApplicantTable();
  }
}

function hireApplicant(index) {
  const app = applicantsData[index];
  if (app.status !== 'Final Interview Passed') {
    showSystemAlert('Hiring Not Available', 'This applicant cannot be hired yet. The initial and final interviews must be completed and the final interview must be marked as passed.', false);
    return;
  }
  pendingHireIndex = index;
  document.getElementById('hireConfirmDesc').innerHTML = 'Are you sure you want to hire <strong style="color:#C9A17A;">' + escapeHtml(app.name) + '</strong> as <strong style="color:#C9A17A;">' + escapeHtml(app.position) + '</strong>?<br><br>This will move the applicant to the employees list.';
  document.getElementById('hireConfirmModal').classList.add('show');
}

function closeHireConfirm() {
  pendingHireIndex = -1;
  document.getElementById('hireConfirmModal').classList.remove('show');
}

async function confirmHireApplicant() {
  if (pendingHireIndex < 0) return;
  const app = applicantsData[pendingHireIndex];
  const confirmButton = document.querySelector('#hireConfirmModal .signout-btn-confirm');
  confirmButton.disabled = true;
  confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  try {
    const body = new URLSearchParams({ action: 'hire', id: String(app.dbId) });
    const response = await fetch('../php/applicants.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to save hiring status.');
    app.status = 'Hired';
    app.availability = 'Employed';
    closeHireConfirm();
    updateApplicantTable();
    showSystemAlert('Applicant Hired', app.name + ' has been hired as ' + app.position + '. The hiring status is now saved.', true);
    loadExternalApplications();
  } catch (error) {
    showSystemAlert('Hiring Not Saved', error.message, false);
  } finally {
    confirmButton.disabled = false;
    confirmButton.textContent = 'Yes, Hire';
  }
}

// ============================================
// SEND TO ADMIN
// ============================================
function sendToAdmin(index) {
  const app = applicantsData[index];
  if (app.sentToAdmin) {
    alert('📨 ' + app.name + ' has already been sent to the Admin.');
    return;
  }
  const applicationId = app.applicationId || ('QC-' + Date.now());
  let sent = [];
  try { sent = JSON.parse(localStorage.getItem('qc_to_admin')) || []; } catch (e) { sent = []; }
  sent.push({
    applicationId: applicationId,
    fullName: app.name,
    email: app.email,
    position: app.position,
    date: app.date,
    yearsExp: app.yearsExp || '',
    details: app.details
  });
  localStorage.setItem('qc_to_admin', JSON.stringify(sent));
  app.sentToAdmin = true;
  alert('📨 ' + app.name + ' has been sent to the Admin for final approval.');
  updateApplicantTable();
}

// ============================================
// UPDATE APPLICANT TABLE
// ============================================
function updateApplicantTable() {
  const container = document.getElementById('applicantWorkflowTables');
  if (!container) return;
  const queues = [
    { key: 'new', title: 'New Applicants', icon: 'fa-inbox', empty: 'No new applicants.', statuses: ['Pending'] },
    { key: 'initial', title: 'Initial Interview', icon: 'fa-comments', empty: 'No applicants for initial interview.', statuses: ['Accepted', 'Initial Interview Scheduled', 'Initial Interview Arrived'] },
    { key: 'final', title: 'Final Interview', icon: 'fa-user-tie', empty: 'No applicants for final interview.', statuses: ['Final Interview Pending', 'Final Interview Scheduled', 'Final Interview Arrived'] },
    { key: 'contract', title: 'Contract Signing & Verification', icon: 'fa-file-signature', empty: 'No applicants awaiting contract processing.', statuses: ['Contract Pending', 'Final Confirmation Pending'] },
    { key: 'hired', title: 'Hired', icon: 'fa-user-check', empty: 'No hired applicants.', statuses: ['Hired'] },
    { key: 'not-hired', title: 'Not Hired', icon: 'fa-user-times', empty: 'No applicants in not hired.', statuses: ['Rejected', 'Interview Not Passed', 'Interview No Show', 'Inactive / Resigned'] }
  ];
  const ordered = applicantsData.map((app, index) => ({ app, index })).sort((a, b) =>
    String(a.app.createdAt || '').localeCompare(String(b.app.createdAt || '')) || Number(a.app.dbId || 0) - Number(b.app.dbId || 0)
  );
  const actionButtons = (app, index) => {
    const view = '<button class="btn btn-sm btn-gold" onclick="viewApplicant(' + index + ')"><i class="fas fa-eye"></i></button> ';
    if (app.status === 'Pending') return '<button class="btn btn-sm btn-outline" onclick="reviewApplicant(' + index + ')"><i class="fas fa-clipboard-check"></i> Review</button>';
    if (app.status === 'Accepted') return view + (app.availability === 'Not Available' ? '<button class="btn btn-sm btn-outline" disabled><i class="fas fa-ban"></i> Not Available</button>' : '<button class="btn btn-sm btn-outline" onclick="scheduleInterview(' + index + ')"><i class="fas fa-calendar-plus"></i> Schedule</button>');
    if (app.status === 'Final Interview Pending' || app.status === 'Final Interview Scheduled' || app.status === 'Final Interview Arrived') return view + '<span class="status-badge status-pending">With Hiring Manager</span>';
    if (app.status === 'Contract Pending') return view + '<button class="btn btn-sm btn-gold" onclick="showPage(\'employee-documents\'); loadHrEmployeeDocuments();"><i class="fas fa-file-signature"></i> Process Contract</button>';
    if (app.status === 'Final Confirmation Pending') return view + '<span class="status-badge status-pending">Awaiting Manager Confirmation</span>';
    if (app.status === 'Initial Interview Scheduled' || app.status === 'Final Interview Scheduled') return view + '<span class="btn btn-sm btn-outline" style="pointer-events:none"><i class="fas fa-clock"></i> ' + escapeHtml(formatInterviewSchedule(app.interviewDate, app.interviewTime)) + '</span> <span class="arrival-question">Arrived?</span> <button class="btn btn-sm" onclick="recordInterviewArrival(' + index + ', true, this)"><i class="fas fa-check"></i> Yes</button> <button class="btn btn-sm btn-outline" onclick="recordInterviewArrival(' + index + ', false, this)"><i class="fas fa-times"></i> No</button>';
    if (app.status === 'Initial Interview Arrived') return view + '<span class="status-badge status-active">Arrived</span> <button class="btn btn-sm" onclick="recordInterviewResult(' + index + ', true, this)"><i class="fas fa-check"></i> Passed</button> <button class="btn btn-sm btn-outline" onclick="recordInterviewResult(' + index + ', false, this)"><i class="fas fa-times"></i> Failed</button>';
    if (app.status === 'Final Interview Arrived') return view + '<span class="status-badge status-active">Arrived</span> <span class="btn btn-sm btn-outline" style="cursor:default;opacity:.8">Awaiting Manager Decision</span>';
    if (app.status === 'Final Interview Passed') return view + '<button class="btn btn-sm" onclick="hireApplicant(' + index + ')"><i class="fas fa-user-check"></i> Hire</button>';
    return view;
  };
  container.innerHTML = queues.map(queue => {
    const items = ordered.filter(item => queue.statuses.includes(item.app.status));
    const rows = items.length ? items.map(({ app, index }) => {
      const statusClass = queue.key === 'not-hired' ? 'status-leave' : (queue.key === 'hired' || app.status === 'Final Interview Passed' ? 'status-active' : 'status-pending');
      const availClass = app.availability === 'Not Available' ? 'status-leave' : 'status-active';
      return '<tr><td><div class="emp-cell"><div class="emp-avatar"><i class="fas fa-user"></i></div><div><span class="emp-name">' + escapeHtml(app.name) + '</span><span class="emp-email">' + escapeHtml(app.email) + '</span></div></div></td><td>' + escapeHtml(app.position) + '</td><td>' + escapeHtml(app.date) + '</td><td><span class="status-badge ' + statusClass + '">' + escapeHtml(app.status) + '</span></td><td><span class="status-badge ' + availClass + '">' + escapeHtml(app.availability || 'Available') + '</span></td><td>' + actionButtons(app, index) + '</td></tr>';
    }).join('') : '<tr><td colspan="6" style="text-align:center;padding:24px;color:rgba(230,214,194,.55)">' + queue.empty + '</td></tr>';
    return '<div class="card" style="margin-bottom:22px"><div class="card-header"><h3 class="card-title"><i class="fas ' + queue.icon + '"></i> ' + queue.title + '</h3><span class="status-badge status-pending">' + items.length + '</span></div><div class="card-body"><div class="table-wrapper"><table class="data-table"><thead><tr><th>Applicant</th><th>Position</th><th>Applied Date</th><th>Status</th><th>Availability</th><th>Action</th></tr></thead><tbody>' + rows + '</tbody></table></div></div></div>';
  }).join('');
  updateApplicantStats();
}
function getApplicantCategory(status) {
  if (status === 'Pending') return 'pending';
  if (status === 'Accepted' || status === 'Final Interview Pending') return 'shortlisted';
  if (status === 'Initial Interview Scheduled' || status === 'Final Interview Scheduled') return 'scheduled';
  if (status === 'Initial Interview Arrived' || status === 'Final Interview Arrived') return 'arrived';
  if (status === 'Final Interview Passed') return 'for-hiring';
  if (status === 'Hired') return 'hired';
  if (status === 'Interview No Show') return 'no-show';
  if (status === 'Rejected' || status === 'Interview Not Passed' || status === 'Inactive / Resigned') return 'rejected';
  return 'pending';
}

function updateApplicantStats() {
  const counts = { total: applicantsData.length, pending: 0, shortlisted: 0, closed: 0, interview: 0 };
  applicantsData.forEach(app => {
    const category = getApplicantCategory(app.status);
    if (category === 'pending') counts.pending++;
    if (category === 'shortlisted') counts.shortlisted++;
    if (['rejected', 'no-show'].includes(category)) counts.closed++;
    if (['scheduled', 'arrived'].includes(category)) counts.interview++;
  });
  document.getElementById('totalApplicants').textContent = counts.total;
  document.getElementById('qualifiedCount').textContent = counts.shortlisted;
  document.getElementById('notQualifiedCount').textContent = counts.closed;
  document.getElementById('forInterviewCount').textContent = counts.interview;
  const pendingDashboard = document.getElementById('pendingApplicants');
  if (pendingDashboard) pendingDashboard.textContent = counts.pending;
}

// ============================================
// FILTER APPLICANTS
// ============================================
function filterApplicants() { updateApplicantTable(); }

// ============================================
// SIGN-OUT CONFIRMATION MODAL
// ============================================
function showSignoutModal() {
  document.getElementById('signoutModal').classList.add('show');
}

function hideSignoutModal() {
  document.getElementById('signoutModal').classList.remove('show');
}

function confirmSignout() {
  securePortalLogout();
}

function openCreateEmployeeModal() {
  document.getElementById('createEmployeeModal').classList.add('show');
}

function closeCreateEmployeeModal() {
  document.getElementById('createEmployeeModal').classList.remove('show');
}

document.getElementById('createEmployeeForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const response = await fetch('../php/create_employee.php', {
    method: 'POST',
    body: new FormData(this)
  });
  const data = await response.json();
  alert(data.message);
  if (data.success) {
    this.reset();
    closeCreateEmployeeModal();
  }
});

document.getElementById('createEmployeeModal').addEventListener('click', function(e) {
  if (e.target === this) closeCreateEmployeeModal();
});

// Close modal on overlay click
document.getElementById('signoutModal').addEventListener('click', function(e) {
  if (e.target === this) {
    hideSignoutModal();
  }
});

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    hideSignoutModal();
    closeViewApplicant();
    closeReviewApplicant();
    closeResumeViewer();
    closeScheduleInterview();
    closeQualifyConfirm();
    closeQualifyResult();
    closeHireConfirm();
  }
});

// ============================================
// SET CURRENT DATE
// ============================================
function updateDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
}
updateDate();

// ============================================
// JOB POSTING
// ============================================
const jobPostsData = [];
let hrBranchesData = [];
let editingJobPostId = 0;

function setJobFlow(step) {
  ['Create', 'Review', 'Publish'].forEach((name, index) => {
    const item = document.getElementById('jobFlow' + name);
    if (!item) return;
    item.classList.toggle('active', index + 1 === step);
    item.classList.toggle('complete', index + 1 < step);
  });
}

function reviewJobPost() {
  const titleSelect = document.getElementById('jpTitle');
  const branchSelect = document.getElementById('jpBranch');
  const positionKey = titleSelect.value;
  const title = titleSelect.options[titleSelect.selectedIndex]?.text || '';
  const branchOption = branchSelect.options[branchSelect.selectedIndex];
  const branchName = branchOption ? branchOption.text : '';
  const salary = document.getElementById('jpSalary').value.trim();
  const qualification = document.getElementById('jpQualification').value.trim();
  const description = document.getElementById('jpDescription').value.trim();

  const applicantsNeeded = document.getElementById('jpApplicantsNeeded').value;
  if (!positionKey || !branchSelect.value || !applicantsNeeded || !salary || !qualification || !description) {
    showSystemAlert('Incomplete Job Post', 'Please complete the job title, branch, number of applicants needed, salary, qualifications, and job description before reviewing.', false);
    return;
  }

  document.getElementById('reviewTitle').textContent = title;
  document.getElementById('reviewSalary').textContent = salary;
  document.getElementById('reviewQualification').textContent = qualification;
  document.getElementById('reviewDescription').textContent = description;
  document.getElementById('reviewBranch').textContent = branchName;
  document.getElementById('reviewApplicantsNeeded').textContent = applicantsNeeded;
  if (branchOption) {
    const branchText = branchOption.text.split(' (')[0];
    document.getElementById('reviewBranch').textContent = branchText;
  }

  document.getElementById('jobPostReviewCard').style.display = 'block';
  setJobFlow(2);
  document.getElementById('jobPostReviewCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function editJobPost() {
  document.getElementById('jobPostReviewCard').style.display = 'none';
  setJobFlow(1);
  document.getElementById('jobPostFormCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function publishJobPost() {
  const titleSelect = document.getElementById('jpTitle');
  const positionKey = titleSelect.value;
  const title = titleSelect.options[titleSelect.selectedIndex]?.text || '';
  const salary = document.getElementById('jpSalary').value.trim();
  const qualification = document.getElementById('jpQualification').value.trim();
  const description = document.getElementById('jpDescription').value.trim();
  const publishButton = document.querySelector('#jobPostReviewCard .btn-gold');
  if (publishButton) publishButton.disabled = true;

  try {
    const branchId = document.getElementById('jpBranch').value;
    const applicantsNeeded = document.getElementById('jpApplicantsNeeded').value;
    const body = new URLSearchParams({ action: 'publish', id: String(editingJobPostId), position_key: positionKey, title, salary, qualification, description, branch_id: String(branchId), applicants_needed: String(applicantsNeeded) });
    const response = await fetch('../php/job_posts.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to publish this job posting.');
    editingJobPostId = 0;
    document.getElementById('jobPostForm').reset();
    document.getElementById('jobPostReviewCard').style.display = 'none';
    document.querySelector('#jobPostFormCard .card-title').innerHTML = '<i class="fas fa-briefcase"></i> Create Job Post';
    setJobFlow(3);
    await loadJobPosts();
    document.getElementById('jobPostListCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    showSystemAlert('Job Post Published', result.message, true);
  } catch (error) {
    showSystemAlert('Job Post Not Published', error.message, false);
  } finally {
    if (publishButton) publishButton.disabled = false;
  }
}

function renderJobPosts() {
  const tbody = document.getElementById('jobPostTableBody');
  const emptyRow = document.getElementById('jpEmptyRow');
  tbody.querySelectorAll('.jp-data-row').forEach(r => r.remove());

  if (jobPostsData.length === 0) {
    emptyRow.style.display = '';
  } else {
    emptyRow.style.display = 'none';
    jobPostsData.forEach((post, index) => {
      const row = document.createElement('tr');
      row.className = 'jp-data-row';
      const isOpen = post.status === 'published';
      row.innerHTML =
        '<td><div class="emp-cell"><div class="emp-avatar"><i class="fas fa-briefcase"></i></div><div><span class="emp-name">' + escapeHtml(post.title) + '</span><span class="emp-email">' + escapeHtml(post.description) + '</span><span class="emp-email">' + escapeHtml(post.branch_name ? post.branch_name + ' | ' + post.branch_location : 'No branch assigned') + '</span></div></div></td>' +
        '<td>' + escapeHtml(post.salary) + '</td>' +
        '<td><button class="job-app-count" onclick="openJobApplications(\'' + escapeHtml(post.position_key) + '\')"><strong>' + Number(post.application_count || 0) + '</strong><span>received</span></button></td>' +
        '<td><span class="status-badge ' + (isOpen ? 'status-active' : 'status-leave') + '">' + (isOpen ? 'Open' : 'Closed') + '</span></td>' +
        '<td><div class="job-row-actions"><button class="btn btn-sm btn-outline" onclick="editPublishedPost(' + index + ')" title="Edit"><i class="fas fa-pen"></i></button>' +
        '<button class="btn btn-sm btn-outline" onclick="setJobPostStatus(' + post.id + ', \'' + (isOpen ? 'closed' : 'published') + '\')" title="' + (isOpen ? 'Close' : 'Reopen') + '"><i class="fas ' + (isOpen ? 'fa-lock' : 'fa-lock-open') + '"></i></button></div></td>';
      tbody.appendChild(row);
    });
  }

  const openCount = jobPostsData.filter(post => post.status === 'published').length;
  document.getElementById('jpCount').textContent = openCount + ' Open';
}

function editPublishedPost(index) {
  const post = jobPostsData[index];
  editingJobPostId = Number(post.id);
  document.getElementById('jpTitle').value = post.position_key;
  document.getElementById('jpBranch').value = post.branch_id || '';
  document.getElementById('jpApplicantsNeeded').value = post.applicants_needed || '1';
  document.getElementById('jpSalary').value = post.salary;
  document.getElementById('jpQualification').value = post.qualification;
  document.getElementById('jpDescription').value = post.description;
  document.getElementById('jobPostReviewCard').style.display = 'none';
  document.querySelector('#jobPostFormCard .card-title').innerHTML = '<i class="fas fa-pen"></i> Edit Job Post';
  setJobFlow(1);
  document.getElementById('jobPostFormCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function loadBranches() {
  try {
    const response = await fetch('../php/branches.php?action=list', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load branches.');
    hrBranchesData = result.branches || [];
    const branchSelect = document.getElementById('jpBranch');
    if (!branchSelect) return;
    branchSelect.innerHTML = '<option value="" selected disabled>Select a branch</option>' + hrBranchesData.map(branch => {
      const counts = 'B ' + (branch.required_baristas || 0) + ' • C ' + (branch.required_cashiers || 0) + ' • M ' + (branch.required_managers || 0);
      return '<option value="' + branch.id + '">' + escapeHtml(branch.name) + ' • ' + escapeHtml(branch.location) + ' (' + escapeHtml(counts) + ')</option>';
    }).join('');
  } catch (error) {
    showSystemAlert('Branches Not Loaded', error.message, false);
  }
}

async function loadJobPosts() {
  try {
    const response = await fetch('../php/job_posts.php?action=list');
    if (response.status === 401 || response.status === 403) {
      showSystemAlert('HR Session Required', 'Please sign in again to manage job postings.', false);
      return;
    }
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load job postings.');
    jobPostsData.length = 0;
    jobPostsData.push(...result.posts);
    renderJobPosts();
  } catch (error) {
    showSystemAlert('Job Posts Not Loaded', error.message, false);
  }
}

async function setJobPostStatus(id, status) {
  try {
    const body = new URLSearchParams({ action: 'set_status', id: String(id), status });
    const response = await fetch('../php/job_posts.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to update the posting.');
    await loadJobPosts();
    showSystemAlert(status === 'published' ? 'Job Post Reopened' : 'Job Post Closed', result.message, true);
  } catch (error) {
    showSystemAlert('Status Not Changed', error.message, false);
  }
}

function openJobApplications(positionKey) {
  showPage('applicants');
  const search = document.querySelector('#page-applicants input[type="search"], #page-applicants .topbar-search input');
  if (search) {
    search.value = positionKey;
    search.dispatchEvent(new Event('input'));
  }
}

// ============================================
// EMPLOYEE DOCUMENTS
// ============================================
let hrEmployeeDocuments = [];
let contractEmployees = [];
let pendingDocumentRejectionId = 0;
let hrDocumentFiltersInitialized = false;

function hrDocumentDate(value, includeTime = false) {
  if (!value) return '—';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-PH', includeTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' });
}

function hrDocumentStatus(document) {
  if (document.document_type === 'employment_contract') {
    if (document.contract_status === 'verified') return { label: 'Verified Contract', badge: 'status-active' };
    if (document.contract_status === 'signed') return { label: 'Signed / For Verification', badge: 'status-pending' };
    return { label: 'For Signing', badge: 'status-pending' };
  }
  if (document.verification_status === 'verified') return { label: 'Verified', badge: 'status-active' };
  if (document.verification_status === 'rejected') return { label: 'Needs Replacement', badge: 'status-leave' };
  return { label: 'Pending Review', badge: 'status-pending' };
}

function updateHrDocumentStats() {
  document.getElementById('hrDocTotal').textContent = hrEmployeeDocuments.length;
  document.getElementById('hrDocPending').textContent = hrEmployeeDocuments.filter(item => item.verification_status === 'pending').length;
  document.getElementById('hrDocVerified').textContent = hrEmployeeDocuments.filter(item => item.verification_status === 'verified').length;
  document.getElementById('hrDocRejected').textContent = hrEmployeeDocuments.filter(item => item.verification_status === 'rejected').length;
}

function filterHrEmployeeDocuments() {
  const search = document.getElementById('hrDocumentSearch').value.trim().toLowerCase();
  const type = document.getElementById('hrDocumentTypeFilter').value;
  const statusFilter = document.getElementById('hrDocumentStatusFilter').value;
  const rows = hrEmployeeDocuments.filter(item =>
    (!search || String(item.employee_name || '').toLowerCase().includes(search)) &&
    (!type || item.document_type === type) &&
    (!statusFilter || item.verification_status === statusFilter)
  );
  document.getElementById('hrDocumentShowing').textContent = rows.length + ' record' + (rows.length === 1 ? '' : 's');
  const body = document.getElementById('hrEmployeeDocumentsBody');
  body.innerHTML = rows.length ? rows.map(item => {
    const status = hrDocumentStatus(item);
    const reason = item.verification_status === 'rejected' && item.rejection_reason
      ? '<small class="hr-document-reason" title="' + escapeHtml(item.rejection_reason) + '"><i class="fas fa-circle-info"></i> ' + escapeHtml(item.rejection_reason) + '</small>' : '';
    const documentUrl = 'php/employee_documents.php?action=file&document_id=' + Number(item.document_id);
    const documentExtension = String(item.file_name || 'document.pdf').split('.').pop().toLowerCase();
    const actions = '<div class="document-review-actions">' +
      '<button type="button" class="btn btn-sm btn-outline" onclick="openResumeViewer(\'' + encodeURIComponent(documentUrl) + '\',\'' + encodeURIComponent(item.file_name || item.document_label || 'Employee Document') + '\',\'' + encodeURIComponent(documentExtension) + '\')" title="Preview"><i class="fas fa-eye"></i></button>' +
      (item.verification_status === 'pending' && (item.document_type !== 'employment_contract' || item.contract_status === 'signed') ? '<button class="btn btn-sm document-approve-btn" onclick="reviewEmployeeDocument(' + Number(item.document_id) + ',\'verified\')" title="Approve"><i class="fas fa-check"></i></button><button class="btn btn-sm document-reject-btn" onclick="openEmployeeDocumentReject(' + Number(item.document_id) + ')" title="Reject"><i class="fas fa-times"></i></button>' : '') + '</div>';
    return '<tr><td><div class="emp-cell"><div class="emp-avatar"><i class="fas fa-user"></i></div><div><span class="emp-name">' + escapeHtml(item.employee_name) + '</span><span class="emp-email">Employee ID: ' + Number(item.employee_id) + '</span></div></div></td>' +
      '<td>' + escapeHtml(item.document_label) + '</td><td>' + hrDocumentDate(item.uploaded_at, true) + '</td>' +
      '<td><span class="status-badge ' + status.badge + '">' + status.label + '</span>' + reason + '</td>' +
      '<td>' + escapeHtml(item.verified_by_name || '—') + '</td><td>' + hrDocumentDate(item.verified_at, true) + '</td><td>' + actions + '</td></tr>';
  }).join('') : '<tr><td colspan="7" style="text-align:center;padding:30px;color:rgba(230, 214, 194,.5)">No uploaded documents match these filters.</td></tr>';
}

function clearHrDocumentFilters() {
  document.getElementById('hrDocumentSearch').value = '';
  document.getElementById('hrDocumentTypeFilter').value = '';
  document.getElementById('hrDocumentStatusFilter').value = '';
  filterHrEmployeeDocuments();
}

async function loadHrEmployeeDocuments() {
  try {
    if (!hrDocumentFiltersInitialized) {
      clearHrDocumentFilters();
      hrDocumentFiltersInitialized = true;
    }
    const response = await fetch('../php/employee_documents.php?action=hr_list', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load employee documents.');
    hrEmployeeDocuments = result.documents || [];
    contractEmployees = result.employees || [];
    const employeeSelect = document.getElementById('contractEmployeeSelect');
    const selectedEmployee = employeeSelect.value;
    employeeSelect.innerHTML = '<option value="">Select employee...</option>' + contractEmployees.map(employee =>
      '<option value="' + Number(employee.id) + '">' + escapeHtml(employee.full_name) + '</option>'
    ).join('');
    employeeSelect.value = selectedEmployee;
    updateHrDocumentStats();
    filterHrEmployeeDocuments();
  } catch (error) {
    document.getElementById('hrEmployeeDocumentsBody').innerHTML = '<tr><td colspan="7" style="text-align:center;">Employee documents could not be loaded.</td></tr>';
    showSystemAlert('Documents Not Loaded', error.message, false);
  }
}

async function reviewEmployeeDocument(documentId, decision, rejectionReason = '') {
  try {
    const body = new URLSearchParams({ action: 'review', document_id: String(documentId), decision, rejection_reason: rejectionReason });
    const response = await fetch('../php/employee_documents.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to review this document.');
    await loadHrEmployeeDocuments();
    showSystemAlert(decision === 'verified' ? 'Document Verified' : 'Document Rejected', result.message, decision === 'verified');
  } catch (error) {
    showSystemAlert('Document Not Reviewed', error.message, false);
  }
}

function openEmployeeDocumentReject(documentId) {
  pendingDocumentRejectionId = documentId;
  const item = hrEmployeeDocuments.find(document => Number(document.document_id) === Number(documentId));
  const label = item ? item.employee_name + ' - ' + item.document_label : 'this employee document';
  document.getElementById('rejectEmployeeDocumentDesc').textContent = 'Reject ' + label + '. Enter the reason the employee must replace this document.';
  document.getElementById('employeeDocumentRejectionReason').value = '';
  document.getElementById('rejectEmployeeDocumentModal').classList.add('show');
}

function closeEmployeeDocumentReject() {
  pendingDocumentRejectionId = 0;
  document.getElementById('rejectEmployeeDocumentModal').classList.remove('show');
}

function confirmEmployeeDocumentReject() {
  const id = pendingDocumentRejectionId;
  const reason = document.getElementById('employeeDocumentRejectionReason').value.trim();
  if (!id || !reason) return showSystemAlert('Rejection Reason Required', 'Enter a rejection reason before rejecting this document.', false);
  closeEmployeeDocumentReject();
  reviewEmployeeDocument(id, 'rejected', reason);
}

document.getElementById('hrDocumentSearch').addEventListener('input', filterHrEmployeeDocuments);
document.getElementById('hrDocumentTypeFilter').addEventListener('change', filterHrEmployeeDocuments);
document.getElementById('hrDocumentStatusFilter').addEventListener('change', filterHrEmployeeDocuments);
document.getElementById('rejectEmployeeDocumentModal').addEventListener('click', function(event) { if (event.target === this) closeEmployeeDocumentReject(); });

// ============================================
// SIDEBAR NAVIGATION
// ============================================
function showPage(page) {
  document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');
  if (page === 'dashboard' || page === 'employees') {
    loadHrEmployees();
  }
  if (page === 'applicants') {
    loadExternalApplications();
  }
  if (page === 'jobposting') {
    loadBranches();
    loadJobPosts();
  }
  if (page === 'employee-documents') {
    loadHrEmployeeDocuments();
  }
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', function(e) {
    e.preventDefault();

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    this.classList.add('active');

    showPage(this.dataset.page);
  });
});

// ============================================
// MOBILE MENU TOGGLE
// ============================================
document.getElementById('menuToggle').addEventListener('click', function() {
  document.getElementById('sidebar').classList.toggle('show');
});

// Close sidebar on outside click (mobile)
document.addEventListener('click', function(e) {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('menuToggle');
  if (window.innerWidth <= 992) {
    if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
      sidebar.classList.remove('show');
    }
  }
});

// ============================================
// NOTIFICATION DROPDOWN
// ============================================
const notifToggle = document.getElementById('notifToggle');
const notifDropdown = document.getElementById('notifDropdown');

notifToggle.addEventListener('click', function(e) {
  e.stopPropagation();
  notifDropdown.classList.toggle('show');
});

document.addEventListener('click', function(e) {
  if (!notifDropdown.contains(e.target) && !notifToggle.contains(e.target)) {
    notifDropdown.classList.remove('show');
  }
});

// ============================================
// ANIMATED COUNTERS FOR STATS
// ============================================
function animateCounters() {
  document.querySelectorAll('.stat-value').forEach(el => {
    const target = parseInt(el.textContent.replace(/,/g, ''));
    const duration = 1000;
    const step = Math.ceil(target / 30);
    let current = 0;

    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = current.toLocaleString();
    }, duration / (target / step));
  });
}

// Trigger counter animation when dashboard is visible
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounters();
      observer.disconnect();
    }
  });
});

const dashboardPage = document.getElementById('page-dashboard');
if (dashboardPage) {
  observer.observe(dashboardPage);
}

// ============================================
// SEARCH PLACEHOLDER
// ============================================
document.getElementById('globalSearch').addEventListener('keypress', function(e) {
  if (e.key === 'Enter' && this.value.trim()) {
    alert('🔍 Searching for: ' + this.value.trim());
  }
});

// ============================================
// CLOSE MODALS ON OVERLAY CLICK
// ============================================
document.getElementById('viewApplicantModal').addEventListener('click', function(e) {
  if (e.target === this) closeViewApplicant();
});
document.getElementById('reviewApplicantModal').addEventListener('click', function(e) {
  if (e.target === this) closeReviewApplicant();
});
document.getElementById('resumeViewerModal').addEventListener('click', function(e) {
  if (e.target === this) closeResumeViewer();
});
document.getElementById('scheduleInterviewModal').addEventListener('click', function(e) {
  if (e.target === this) closeScheduleInterview();
});
document.getElementById('interviewResultConfirmModal').addEventListener('click', function(e) {
  if (e.target === this) closeInterviewResultConfirm();
});

// Close modals on overlay click
document.getElementById('qualifyConfirmModal').addEventListener('click', function(e) {
  if (e.target === this) closeQualifyConfirm();
});
document.getElementById('qualifyResultModal').addEventListener('click', function(e) {
  if (e.target === this) closeQualifyResult();
});
document.getElementById('hireConfirmModal').addEventListener('click', function(e) {
  if (e.target === this) closeHireConfirm();
});

// ============================================
// LOAD APPLICATIONS FROM apply.html + AUTO-OPEN
// ============================================
loadHrEmployees();
loadExternalApplications();
updateApplicantTable();

setInterval(() => {
  if (document.getElementById('page-dashboard')?.classList.contains('active') ||
      document.getElementById('page-employees')?.classList.contains('active')) {
    loadHrEmployees();
  }
  if (document.getElementById('page-applicants')?.classList.contains('active')) {
    loadExternalApplications();
  }
}, 10000);

if (localStorage.getItem('qc_open_applicants') === '1') {
  localStorage.removeItem('qc_open_applicants');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => {
    if (n.dataset.page === 'applicants') n.classList.add('active');
  });
  showPage('applicants');
}

// Always start at the top after a reload (don't restore scroll position)
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// Database-backed applicant workflow. Qualified applicants become visible to Admin.
async function loadExternalApplications() {
  try {
    const response = await fetch('../php/applicants.php?action=list&view=hr');
    if (response.status === 401 || response.status === 403) {
      showSystemAlert('HR Session Required', 'Please sign in again using an HR or Administrator PIN to view applicants.', false);
      setTimeout(() => { window.location.href = 'Login.html'; }, 1800);
      return;
    }
    if (!response.ok) throw new Error('Server returned ' + response.status);
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    applicantsData.length = 0;
    result.applicants.forEach(app => {
      const name = [app.first_name, app.middle_name, app.last_name].filter(Boolean).join(' ');
      const mappedStatus = ({
        pending: 'Pending', shortlisted: 'Accepted', rejected: 'Rejected', hr_rejected: 'Rejected', admin_rejected: 'Rejected', initial_interview_pending: 'Accepted',
        initial_interview_scheduled: 'Initial Interview Scheduled', final_interview_pending: 'Final Interview Pending',
        final_interview_scheduled: 'Final Interview Scheduled', final_interview_passed: 'Final Interview Passed', contract_pending: 'Contract Pending', final_confirmation_pending: 'Final Confirmation Pending',
        initial_interview_arrived: 'Initial Interview Arrived', final_interview_arrived: 'Final Interview Arrived',
        interview_no_show: 'Interview No Show', interview_failed: 'Interview Not Passed', hired: 'Hired'
      })[app.status] || app.status;
      const displayStatus = app.employee_status === 'inactive' ? 'Inactive / Resigned' : mappedStatus;
      const unavailableStatuses = ['Rejected', 'Interview Not Passed', 'Interview No Show', 'Inactive / Resigned'];
      const displayAvailability = displayStatus === 'Hired'
        ? 'Employed'
        : (unavailableStatuses.includes(displayStatus)
          ? 'Not Available'
          : (app.availability === 'not-available' ? 'Not Available' : (app.availability === 'available' ? 'Available' : 'Not Set')));
      const detailLines = [
        'Application ID: ' + app.application_code, 'Full Name: ' + name, 'Email: ' + app.email,
        'Contact Number: ' + app.contact_no, 'Address: ' + app.address,
        'Employment Type: ' + (app.employment_type || '-'),
        'Availability: ' + displayAvailability,
        'Preferred Work Shift: ' + (app.preferred_shift || '-'),
        'Education: ' + app.education,
        'School: ' + app.school, 'Course: ' + app.course, 'Experience: ' + app.years_experience,
        'Resume: ' + (app.resume_name || 'Not uploaded')
      ];
      if (app.initial_interviewer_name) {
        detailLines.push(
          'Initial Interviewed By: ' + app.initial_interviewer_name,
          'Initial Interviewer Role: HR' + (app.initial_interviewer_role ? ' (' + app.initial_interviewer_role + ')' : ''),
          'Initial Interview Result: ' + (app.initial_interview_result === 'passed' ? 'Passed' : 'Failed'),
          'Initial Interview Recorded: ' + (app.initial_interviewed_at ? new Date(String(app.initial_interviewed_at).replace(' ', 'T')).toLocaleString('en-US') : '-')
        );
      }
      if (app.final_interviewer_name) {
        detailLines.push(
          'Final Interviewed By: ' + app.final_interviewer_name,
          'Final Interviewer Role: HR' + (app.final_interviewer_role ? ' (' + app.final_interviewer_role + ')' : ''),
          'Final Interview Result: ' + (app.final_interview_result === 'passed' ? 'Passed' : 'Failed'),
          'Final Interview Recorded: ' + (app.final_interviewed_at ? new Date(String(app.final_interviewed_at).replace(' ', 'T')).toLocaleString('en-US') : '-')
        );
      }
      const details = detailLines.join('\n');
      applicantsData.push({
        dbId: app.id, name: name, email: app.email, position: app.position,
        date: new Date(app.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        createdAt: app.created_at || '',
        updatedAt: app.updated_at || app.created_at || '',
        status: displayStatus,
        availability: displayAvailability, yearsExp: app.years_experience, details: details,
        interviewDate: app.interview_date || '', interviewTime: app.interview_time || '',
        initialInterviewerName: app.initial_interviewer_name || '', initialInterviewerRole: app.initial_interviewer_role || '',
        initialInterviewResult: app.initial_interview_result || '', initialInterviewedAt: app.initial_interviewed_at || '',
        finalInterviewerName: app.final_interviewer_name || '', finalInterviewerRole: app.final_interviewer_role || '',
        finalInterviewResult: app.final_interview_result || '', finalInterviewedAt: app.final_interviewed_at || '',
        resumePath: app.resume_path || '', resumeName: app.resume_name || 'Resume / CV',
        sentToAdmin: false
      });
    });
    updateApplicantTable();
    renderHrDashboardActivity();
    renderHrUpcomingEvents();
    renderHrNotifications();
  } catch (error) {
    document.getElementById('applicantWorkflowTables').innerHTML = '<div class="card"><div class="card-body" style="text-align:center;padding:28px"><i class="fas fa-spinner fa-spin"></i> Reconnecting to the applicant database...</div></div>';
    setTimeout(loadExternalApplications, 3000);
  }
}

async function confirmQualifyAction() {
  if (qualifyPendingIndex === -1) return;
  const app = applicantsData[qualifyPendingIndex];
  const decision = qualifyPendingAction === 'qualified' ? 'qualified' : 'rejected';
  try {
    const body = new URLSearchParams({ action: 'hr_decision', id: app.dbId, decision: decision, remarks: document.getElementById('reviewRemarks')?.value || '' });
    const response = await fetch('../php/applicants.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body });
    const result = await response.json();
    if (!result.success) { showSystemAlert('Decision Not Saved', result.message, false); return; }
    closeQualifyConfirm();
    await loadExternalApplications();
    showSystemAlert(decision === 'qualified' ? 'Applicant Accepted' : 'Applicant Rejected', decision === 'qualified' ? result.message : result.message + ' Availability was automatically set to Not Available.', decision === 'qualified');
  } catch (error) {
    showSystemAlert('Decision Not Saved', 'Unable to save the HR decision.', false);
  }
}

// HR-owned interview workflow. These definitions intentionally replace the old local-only flow.
function showSystemAlert(title, message, success = true) {
  const icon = document.getElementById('qualifyResultIcon');
  const iconTag = document.getElementById('qualifyResultIconTag');
  icon.style.background = success ? 'rgba(139, 94, 60,0.15)' : 'rgba(139, 94, 60,0.15)';
  iconTag.className = success ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
  iconTag.style.color = success ? '#8B5E3C' : '#8B5E3C';
  document.getElementById('qualifyResultTitle').textContent = title;
  document.getElementById('qualifyResultDesc').textContent = message;
  document.getElementById('qualifyResultModal').classList.add('show');
}

function formatInterviewSchedule(date, time) {
  if (!date || !time) return 'Waiting for interview time';
  const value = new Date(date + 'T' + time);
  if (Number.isNaN(value.getTime())) return 'Waiting for interview time';
  return 'Available ' + value.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + value.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function scheduleInterview(index) {
  currentApplicantIndex = index;
  const app = applicantsData[index];
  if (!app || !['Accepted', 'Final Interview Pending'].includes(app.status)) {
    currentApplicantIndex = -1;
    showSystemAlert('Interview Not Available', 'The applicant must complete the previous interview stage first.', false);
    return;
  }
  const finalStage = app.status === 'Final Interview Pending';
  document.getElementById('scheduleInterviewTitle').textContent = finalStage ? 'Schedule Final Interview' : 'Schedule Initial Interview';
  document.getElementById('scheduleInterviewDesc').innerHTML = 'Set the ' + (finalStage ? 'final' : 'initial') + ' interview schedule for <strong style="color:#C9A17A">' + escapeHtml(app.name) + '</strong>. An email will be sent automatically.';
  const today = new Date();
  const tomorrowDate = new Date(today);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 7);
  const tomorrow = tomorrowDate.toISOString().slice(0, 10);
  document.getElementById('interviewDate').min = today.toISOString().slice(0, 10);
  document.getElementById('interviewDate').max = maxDate.toISOString().slice(0, 10);
  document.getElementById('interviewDate').value = tomorrow;
  document.getElementById('interviewTime').value = '10:00';
  document.getElementById('interviewType').value = 'In-Person';
  document.getElementById('interviewLocation').value = '';
  document.getElementById('scheduleInterviewModal').classList.add('show');
}

async function confirmScheduleInterview() {
  if (currentApplicantIndex < 0) return;
  const app = applicantsData[currentApplicantIndex];
  const date = document.getElementById('interviewDate').value;
  const time = document.getElementById('interviewTime').value;
  const type = document.getElementById('interviewType').value;
  const location = document.getElementById('interviewLocation').value.trim();
  if (!date || !time || !location) {
    showSystemAlert('Incomplete Schedule', 'Please provide the interview date, time, and venue or meeting link.', false);
    return;
  }
  const selectedDateTime = new Date(date + 'T' + time);
  const maxDateTime = new Date();
  maxDateTime.setDate(maxDateTime.getDate() + 7);
  maxDateTime.setHours(23, 59, 59, 999);
  if (Number.isNaN(selectedDateTime.getTime()) || selectedDateTime > maxDateTime) {
    showSystemAlert('Schedule Not Allowed', 'Interview schedule must be within 1 week from today only.', false);
    return;
  }
  const stage = app.status === 'Final Interview Pending' ? 'final' : 'initial';
  const scheduleButton = document.getElementById('scheduleConfirmBtn');
  if (scheduleButton.disabled) return;
  scheduleButton.disabled = true;
  scheduleButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  try {
    const body = new URLSearchParams({ action: 'schedule_interview', id: app.dbId, stage, interview_date: date, interview_time: time, interview_type: type, interview_location: location });
    const response = await fetch('../php/applicants.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    const result = await response.json();
    if (!result.success) return showSystemAlert('Schedule Not Sent', result.message, false);
    closeScheduleInterview();
    app.status = stage === 'final' ? 'Final Interview Scheduled' : 'Initial Interview Scheduled';
    app.interviewDate = date;
    app.interviewTime = time;
    updateApplicantTable();
    showSystemAlert('Interview Scheduled', result.message, true);
    loadExternalApplications();

    if (result.email_pending) {
      const emailBody = new URLSearchParams({ action: 'send_interview_email', id: app.dbId, stage });
      fetch('../php/applicants.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: emailBody,
        keepalive: true
      }).then(response => response.json().then(data => ({ ok: response.ok, data })))
        .then(({ ok, data }) => {
          if (!ok || !data.success) showSystemAlert('Email Not Sent', data.message || 'The schedule was saved, but the email could not be sent.', false);
        }).catch(() => showSystemAlert('Email Not Sent', 'The schedule was saved, but the email service could not be reached.', false));
    }
  } catch (error) {
    showSystemAlert('Schedule Error', 'The schedule could not be saved. Please try again.', false);
  } finally {
    scheduleButton.disabled = false;
    scheduleButton.textContent = 'Set Schedule';
  }
}

let pendingInterviewResult = null;

async function recordInterviewArrival(index, arrived, clickedButton) {
  const app = applicantsData[index];
  if (!app || !['Initial Interview Scheduled', 'Final Interview Scheduled'].includes(app.status)) return;
  const stage = app.status === 'Final Interview Scheduled' ? 'final' : 'initial';
  const actionButtons = clickedButton?.parentElement?.querySelectorAll('button') || [];
  actionButtons.forEach(button => { button.disabled = true; });
  try {
    const body = new URLSearchParams({ action: 'interview_arrival', id: app.dbId, stage, arrived: arrived ? 'yes' : 'no' });
    const response = await fetch('../php/applicants.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to save interview arrival.');
    app.status = arrived ? (stage === 'final' ? 'Final Interview Arrived' : 'Initial Interview Arrived') : 'Interview No Show';
    app.availability = arrived ? 'Available' : 'Not Available';
    updateApplicantTable();
    showSystemAlert(arrived ? 'Arrival Confirmed' : 'Applicant Marked No Show', result.message, arrived);
    loadExternalApplications();
  } catch (error) {
    showSystemAlert('Arrival Not Saved', error.message, false);
  } finally {
    actionButtons.forEach(button => { button.disabled = false; });
  }
}

function recordInterviewResult(index, passed, clickedButton) {
  const app = applicantsData[index];
  if (!app) return;
  pendingInterviewResult = { index, passed, clickedButton };
  document.getElementById('interviewResultConfirmTitle').textContent = passed ? 'Confirm Interview Passed' : 'Confirm Interview Not Passed';
  document.getElementById('interviewResultConfirmDesc').textContent =
    'Are you sure you want to mark ' + app.name + ' as ' + (passed ? 'PASSED' : 'NOT PASSED') + '? This will save the interview result.';
  document.getElementById('interviewResultConfirmBtn').textContent = passed ? 'Yes, Mark Passed' : 'Yes, Mark Not Passed';
  document.getElementById('interviewResultConfirmModal').classList.add('show');
}

async function uploadEmploymentContract() {
  const employeeId = document.getElementById('contractEmployeeSelect').value;
  const fileInput = document.getElementById('contractFileInput');
  if (!employeeId) return showSystemAlert('Employee Required', 'Select the employee who will receive this contract.', false);
  if (!fileInput.files.length) {
    fileInput.click();
    fileInput.onchange = () => { if (fileInput.files.length) uploadEmploymentContract(); };
    return;
  }
  const button = document.getElementById('contractUploadButton');
  button.disabled = true;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
  try {
    const form = new FormData();
    form.append('action', 'upload_contract');
    form.append('employee_id', employeeId);
    form.append('document', fileInput.files[0]);
    const response = await fetch('../php/employee_documents.php', { method: 'POST', body: form });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to upload the contract.');
    fileInput.value = '';
    await loadHrEmployeeDocuments();
    showSystemAlert('Contract Uploaded', result.message, true);
  } catch (error) {
    showSystemAlert('Contract Not Uploaded', error.message, false);
  } finally {
    button.disabled = false;
    button.innerHTML = '<i class="fas fa-file-arrow-up"></i> Upload Contract';
  }
}

function createEmploymentContract() {
  const employeeId = document.getElementById('contractEmployeeSelect').value;
  if (!employeeId) return showSystemAlert('Employee Required', 'Select an employee before creating the contract.', false);
  window.open('../php/employment_contract.php?employee_id=' + encodeURIComponent(employeeId), '_blank', 'noopener');
}

function closeInterviewResultConfirm() {
  document.getElementById('interviewResultConfirmModal').classList.remove('show');
  pendingInterviewResult = null;
}

function confirmInterviewResult() {
  if (!pendingInterviewResult) return;
  const pending = pendingInterviewResult;
  document.getElementById('interviewResultConfirmModal').classList.remove('show');
  pendingInterviewResult = null;
  saveInterviewResult(pending.index, pending.passed, pending.clickedButton);
}

async function saveInterviewResult(index, passed, clickedButton) {
  const app = applicantsData[index];
  const stage = app.status === 'Final Interview Arrived' ? 'final' : 'initial';
  const actionButtons = clickedButton?.parentElement?.querySelectorAll('button') || [];
  actionButtons.forEach(button => { button.disabled = true; });
  try {
    const body = new URLSearchParams({ action: 'interview_result', id: app.dbId, stage, result: passed ? 'passed' : 'failed' });
    const response = await fetch('../php/applicants.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    const result = await response.json();
    if (!result.success) return showSystemAlert('Result Not Saved', result.message, false);
    app.status = passed ? (stage === 'final' ? 'Final Interview Passed' : 'Final Interview Pending') : 'Interview Not Passed';
    app.availability = passed ? 'Available' : 'Not Available';
    updateApplicantTable();
    showSystemAlert(passed ? 'Interview Passed' : 'Interview Not Passed', result.message, passed);
    loadExternalApplications();

    if (result.email_pending) {
      const emailBody = new URLSearchParams({ action: 'send_result_email', id: app.dbId });
      fetch('../php/applicants.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: emailBody,
        keepalive: true
      }).then(response => response.json().then(data => ({ ok: response.ok, data })))
        .then(({ ok, data }) => {
          if (!ok || !data.success) showSystemAlert('Email Not Sent', data.message || 'The result was saved, but the email could not be sent.', false);
        }).catch(() => showSystemAlert('Email Not Sent', 'The result was saved, but the email service could not be reached.', false));
    }
  } catch (error) {
    showSystemAlert('Save Error', 'Unable to save the interview result. Please try again.', false);
  } finally {
    actionButtons.forEach(button => { button.disabled = false; });
  }
}

