









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

// Close modal on overlay click
document.getElementById('signoutModal').addEventListener('click', function(e) {
  if (e.target === this) {
    hideSignoutModal();
  }
});
document.getElementById('adminAlertModal').addEventListener('click', function(e) {
  if (e.target === this) {
    closeAdminAlert();
  }
});
document.getElementById('adminCreateEmployeeModal').addEventListener('click', function(e) {
  if (e.target === this) {
    closeAdminCreateEmployee();
  }
});
document.getElementById('empEditModal').addEventListener('click', function(e) {
  if (e.target === this) {
    closeModal('empEditModal');
  }
});

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    hideSignoutModal();
    closeAdminAlert();
    closeAdminCreateEmployee();
    closeModal('empEditModal');
  }
});

// ============================================
// SET CURRENT DATE
// ============================================
function updateDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
  document.getElementById('attendanceDate').valueAsDate = now;
  document.getElementById('attLogDate').textContent = 'Date: ' + now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
updateDate();

// ============================================
// SIDEBAR NAVIGATION
// ============================================
function resetAdminPageScroll() {
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  window.scrollTo(0, 0);
  const main = document.querySelector('.main-content');
  if (main) main.scrollTop = 0;
}

function normalizeAdminPages() {
  const main = document.querySelector('.main-content');
  const topbar = document.querySelector('.topbar');
  if (!main || !topbar) return;
  document.querySelectorAll('.page-content').forEach(page => {
    if (page.parentElement !== main) {
      main.appendChild(page);
    }
  });
}

function forceAdminPage(page) {
  normalizeAdminPages();
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  document.querySelectorAll('.page-content').forEach(p => {
    p.classList.remove('active');
    p.style.setProperty('display', 'none', 'important');
  });
  const target = document.getElementById('page-' + page);
  if (target) {
    target.classList.add('active');
    target.style.setProperty('display', 'block', 'important');
    target.style.setProperty('visibility', 'visible', 'important');
    target.style.setProperty('opacity', '1', 'important');
    target.style.setProperty('min-height', '650px');
    target.removeAttribute('hidden');
  }
  resetAdminPageScroll();
  setTimeout(resetAdminPageScroll, 0);
  if (page === 'employees') {
    loadEmployees();
    loadHiredApplicantsForAccounts();
  }
  if (page === 'branches') loadBranches();
  if (page === 'attendance') loadAdminAttendance();
  if (page === 'payroll') {
    const payrollBody = document.getElementById('payrollTableBody');
    if (payrollBody && !payrollBody.textContent.trim()) {
      payrollBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Loading payroll from the database...</td></tr>';
    }
    loadAdminPayroll();
  }
  if (page === 'leave') loadAdminLeaves();
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    const page = this.dataset.page;
    if (page === 'payroll') {
      window.location.href = this.href;
      return;
    }
    if (this.href) {
      window.history.replaceState(null, '', this.href);
    }
    forceAdminPage(page);
    // Close sidebar on mobile
    if (window.innerWidth <= 992) document.getElementById('sidebar').classList.remove('show');
  });
});

function switchPage(page) {
  forceAdminPage(page);
}

normalizeAdminPages();

// ============================================
// MOBILE MENU TOGGLE
// ============================================
document.getElementById('menuToggle').addEventListener('click', function() {
  document.getElementById('sidebar').classList.toggle('show');
});

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

document.querySelector('.notif-mark-read')?.addEventListener('click', function() {
  document.querySelectorAll('.notif-unread').forEach(n => n.classList.remove('notif-unread'));
  document.querySelector('.notif-badge').textContent = '0';
  this.textContent = 'All marked as read';
});

// ============================================
// ANIMATED COUNTERS
// ============================================
function animateCounters() {
  document.querySelectorAll('#page-dashboard .stat-value').forEach(el => {
    const target = parseInt(el.textContent.replace(/[₱,]/g, ''));
    if (isNaN(target)) return;
    const step = Math.ceil(target / 30);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = current.toLocaleString();
    }, 1000 / (target / step));
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { animateCounters(); observer.disconnect(); }
  });
});
const dashPage = document.getElementById('page-dashboard');
if (dashPage) observer.observe(dashPage);

// ============================================
// APPLICANT FUNCTIONS
// ============================================
let currentApplicantTab = 'all';

function switchApplicantTab(btn, tab) {
  document.querySelectorAll('#page-applicants .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  currentApplicantTab = tab;
  filterApplicants();
}

function filterApplicants() {
  const rows = document.querySelectorAll('#applicantsTable tbody tr');
  rows.forEach(row => {
    const status = row.dataset.status;
    if (currentApplicantTab === 'all' || currentApplicantTab === status) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

function approveApplicant(btn) {
  if (confirm('Approve this applicant?')) {
    const row = btn.closest('tr');
    const name = row.querySelector('.emp-name').textContent;
    row.dataset.status = 'approved';
    row.querySelector('.status-badge').className = 'status-badge status-approved';
    row.querySelector('.status-badge').textContent = 'Approved';
    btn.closest('.action-btns').innerHTML = '<button class="action-btn action-btn-view" onclick="viewApplicant(\'' + name + '\')" title="View"><i class="fas fa-eye"></i></button>';
    alert('✅ ' + name + ' has been approved!');
  }
}

function rejectApplicant(btn) {
  if (confirm('Reject this applicant?')) {
    const row = btn.closest('tr');
    const name = row.querySelector('.emp-name').textContent;
    row.dataset.status = 'rejected';
    row.querySelector('.status-badge').className = 'status-badge status-rejected';
    row.querySelector('.status-badge').textContent = 'Rejected';
    btn.closest('.action-btns').innerHTML = '<button class="action-btn action-btn-view" onclick="viewApplicant(\'' + name + '\')" title="View"><i class="fas fa-eye"></i></button>';
    alert('❌ ' + name + ' has been rejected.');
  }
}

function viewApplicant(name) {
  alert('📋 Viewing application of: ' + name + '\n\nYou can view full application details here.');
}

// ============================================
// LOAD APPLICANTS SENT FROM HR (localStorage)
// ============================================
let adminSentApplicants = [];

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const expMap = {
  'none': 'No experience',
  'less-1': 'Less than 1 yr',
  '1-2': '1 - 2 yrs',
  '3-5': '3 - 5 yrs',
  '5-10': '5 - 10 yrs',
  '10+': '10+ yrs'
};

function loadSentToAdmin() {
  let sent = [];
  try { sent = JSON.parse(localStorage.getItem('qc_to_admin')) || []; } catch (e) { sent = []; }
  if (!sent.length) return;

  adminSentApplicants = [];
  const tbody = document.querySelector('#applicantsTable tbody');
  if (!tbody) return;

  const seen = new Set();
  sent.forEach(app => {
    const id = app.applicationId || app.fullName || app.email;
    if (seen.has(id)) return;
    seen.add(id);

    const index = adminSentApplicants.length;
    adminSentApplicants.push(app);

    const name = app.fullName || app.name || 'Applicant';
    const exp = expMap[app.yearsExp] || (app.yearsExp ? app.yearsExp : '—');
    const tr = document.createElement('tr');
    tr.dataset.status = 'pending';
    tr.innerHTML =
      '<td><div class="emp-cell"><div class="emp-avatar"><i class="fas fa-user"></i></div><div>' +
        '<span class="emp-name">' + escapeHtml(name) + '</span>' +
        '<span class="emp-email">' + escapeHtml(app.email || '') + '</span>' +
      '</div></div></td>' +
      '<td>' + escapeHtml(app.position || '—') + '</td>' +
      '<td>' + escapeHtml(exp) + '</td>' +
      '<td>' + escapeHtml(app.date || '—') + '</td>' +
      '<td><span class="status-badge status-pending">Pending</span></td>' +
      '<td><div class="action-btns">' +
        '<button class="action-btn action-btn-view" onclick="viewSentApplicant(' + index + ')" title="View"><i class="fas fa-eye"></i></button>' +
        '<button class="action-btn action-btn-approve" onclick="approveApplicant(this)" title="Approve"><i class="fas fa-check"></i></button>' +
        '<button class="action-btn action-btn-reject" onclick="rejectApplicant(this)" title="Reject"><i class="fas fa-times"></i></button>' +
      '</div></td>';
    tbody.appendChild(tr);
  });

  filterApplicants();
}

// ============================================
// VIEW SENT APPLICANT DETAILS (from HR)
// ============================================
function viewSentApplicant(index) {
  const app = adminSentApplicants[index];
  if (!app) { alert('Application details not found.'); return; }
  document.getElementById('applicantViewName').textContent = app.fullName || app.name || 'Applicant';
  document.getElementById('applicantViewEmail').textContent = app.email || '—';
  document.getElementById('applicantViewPosition').textContent = app.position || '—';
  document.getElementById('applicantViewDate').textContent = app.date || '—';
  document.getElementById('applicantViewDetails').innerHTML = renderSentDetails(app.details);
  document.getElementById('applicantViewModal').classList.add('show');
}

function closeApplicantView() {
  document.getElementById('applicantViewModal').classList.remove('show');
}

function renderSentDetails(text) {
  if (!text || !text.trim()) {
    return '<p style="color: rgba(230, 214, 194,0.4); font-style: italic;">No additional details provided.</p>';
  }
  const skip = ['Email', 'Position Applying For'];
  const lines = text.split('\n');
  let html = '';
  lines.forEach(line => {
    const idx = line.indexOf(':');
    if (idx > 0 && idx < 60) {
      const label = line.substring(0, idx).trim();
      const value = line.substring(idx + 1).trim();
      if (skip.includes(label)) return;
      html += '<div class="detail-row"><span class="detail-label">' + escapeHtml(label) + '</span><span class="detail-value">' + escapeHtml(value) + '</span></div>';
    } else if (line.trim()) {
      html += '<p style="color: rgba(230, 214, 194,0.7); font-size: 13px; margin: 6px 0;">' + escapeHtml(line) + '</p>';
    }
  });
  return html;
}

// Close applicant detail modal on overlay click
document.getElementById('applicantViewModal').addEventListener('click', function(e) {
  if (e.target === this) closeApplicantView();
});

// Search applicants
document.getElementById('appSearch')?.addEventListener('keyup', function() {
  const q = this.value.toLowerCase();
  document.querySelectorAll('#applicantsTable tbody tr').forEach(row => {
    const name = row.querySelector('.emp-name')?.textContent.toLowerCase() || '';
    const pos = row.cells[1]?.textContent.toLowerCase() || '';
    row.style.display = (name.includes(q) || pos.includes(q)) ? '' : 'none';
  });
});

// ============================================
// LEAVE FUNCTIONS
// ============================================
let currentLeaveTab = 'all';
let adminLeaveData = [];

function switchLeaveTab(btn, tab) {
  document.querySelectorAll('#page-leave .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  currentLeaveTab = tab;
  filterLeaves();
}

function filterLeaves() {
  renderAdminLeaves();
}

function adminLeaveDate(value) {
  const date = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function adminLeaveType(value) {
  return ({ vacation: 'Vacation Leave', sick: 'Sick Leave', personal: 'Personal Leave', emergency: 'Emergency Leave', maternity: 'Maternity Leave' })[value] || value;
}

function renderAdminLeaves() {
  const type = document.getElementById('leaveFilterType').value;
  const department = document.getElementById('leaveFilterDept').value;
  const search = document.getElementById('leaveSearch').value.trim().toLowerCase();
  const requests = adminLeaveData.filter(request => {
    const dept = departmentOptionValue(employeeDepartmentValue(request));
    return (currentLeaveTab === 'all' || request.status === currentLeaveTab) &&
      (!type || request.leave_type === type) && (!department || dept === department) &&
      (!search || request.full_name.toLowerCase().includes(search) || request.reference_code.toLowerCase().includes(search));
  });
  const body = document.getElementById('adminLeaveBody');
  body.innerHTML = requests.length ? requests.map(request => {
    const statusLabel = request.status.charAt(0).toUpperCase() + request.status.slice(1);
    const days = Number(request.days) % 1 ? Number(request.days).toFixed(1) : String(Number(request.days));
    const actions = request.status === 'pending'
      ? '<button class="action-btn action-btn-approve" onclick="decideLeave(' + request.id + ',\'approved\',this)" title="Approve"><i class="fas fa-check"></i></button><button class="action-btn action-btn-reject" onclick="decideLeave(' + request.id + ',\'rejected\',this)" title="Reject"><i class="fas fa-times"></i></button>'
      : '<button class="action-btn action-btn-view" onclick="viewAdminLeave(' + request.id + ')" title="View details"><i class="fas fa-eye"></i></button>';
    return '<tr data-leave-status="' + escapeHtml(request.status) + '"><td><div class="emp-cell"><div class="emp-avatar"><i class="fas fa-user"></i></div><div><span class="emp-name">' + escapeHtml(request.full_name) + '</span><span class="emp-email">' + escapeHtml(request.email) + '</span></div></div></td><td>' + escapeHtml(adminLeaveType(request.leave_type)) + '</td><td>' + adminLeaveDate(request.start_date + ' 00:00:00') + '</td><td>' + adminLeaveDate(request.end_date + ' 00:00:00') + '</td><td>' + days + (Number(request.days) === 1 ? ' day' : ' days') + '</td><td><span class="status-badge status-' + escapeHtml(request.status) + '">' + statusLabel + '</span></td><td><div class="action-btns">' + actions + '</div></td></tr>';
  }).join('') : '<tr><td colspan="7" style="text-align:center;">No matching leave requests.</td></tr>';
}

async function loadAdminLeaves() {
  try {
    const response = await fetch('../php/leave_requests.php?action=admin', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load leave requests.');
    adminLeaveData = result.requests;
    populateDepartmentSelect('leaveFilterDept', adminLeaveData);
    document.getElementById('adminLeaveApproved').textContent = result.stats.approved;
    document.getElementById('adminLeavePending').textContent = result.stats.pending;
    document.getElementById('adminLeaveTotal').textContent = result.stats.total;
    document.getElementById('adminLeaveRejected').textContent = result.stats.rejected;
    renderAdminLeaves();
  } catch (error) {
    document.getElementById('adminLeaveBody').innerHTML = '<tr><td colspan="7" style="text-align:center;">Leave requests could not be loaded.</td></tr>';
  }
}

async function decideLeave(requestId, decision, button) {
  const buttons = button.closest('.action-btns').querySelectorAll('button');
  buttons.forEach(item => item.disabled = true);
  try {
    const body = new URLSearchParams({ action: 'decision', request_id: requestId, decision });
    const response = await fetch('../php/leave_requests.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to process leave request.');
    await loadAdminLeaves();
    showAdminAlert(decision === 'approved' ? 'Leave Approved' : 'Leave Rejected', result.message, decision === 'approved');
  } catch (error) {
    buttons.forEach(item => item.disabled = false);
    showAdminAlert('Leave Not Processed', error.message, false);
  }
}

function viewAdminLeave(requestId) {
  const request = adminLeaveData.find(item => Number(item.id) === Number(requestId));
  if (!request) return;
  showAdminAlert('Leave ' + request.reference_code, request.full_name + ' — ' + adminLeaveType(request.leave_type) + ', ' + request.days + ' day(s), ' + request.pay_type.replace('-', ' ') + '. Reason: ' + request.reason, request.status === 'approved');
}

// ============================================
// EMPLOYEE FUNCTIONS
// ============================================
let adminEmployees = [];
let selectedEmployeeId = null;

function findEmployee(id) {
  return adminEmployees.find(employee => String(employee.id) === String(id));
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function normalizePositionValue(position) {
  const value = String(position || '').toLowerCase();
  if (value.includes('barista')) return 'barista';
  if (value.includes('cashier')) return 'cashier';
  return '';
}

function positionDisplayName(value) {
  if (value === 'barista') return 'Barista';
  if (value === 'cashier') return 'Cashier';
  return value || '';
}

async function loadAdminPositionAvailability() {
  const select = document.getElementById('adminCreatePosition');
  if (!select) return null;

  try {
    const response = await fetch('../php/positions.php');
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Unable to load positions.');

    Array.from(select.options).forEach(option => {
      if (!option.value) return;
      const info = result.positions[option.value];
      if (!info) return;
      option.disabled = !info.available;
      option.textContent = info.available
        ? info.label + ' - ' + info.remaining + ' slot' + (info.remaining === 1 ? '' : 's') + ' left'
        : info.label + ' - Full';
    });

    if (!select.value || select.selectedOptions[0]?.disabled) {
      const firstAvailable = Array.from(select.options).find(option => option.value && !option.disabled);
      select.value = firstAvailable ? firstAvailable.value : '';
    }

    return result.positions;
  } catch (error) {
    showAdminAlert('Position Availability Unavailable', 'Unable to check Barista/Cashier slots right now. Please refresh and try again.', false);
    return null;
  }
}

function viewEmployee(id) {
  const employee = findEmployee(id);
  if (!employee) return showAdminAlert('Employee Not Found', 'Unable to find this employee record in the database.', false);
  selectedEmployeeId = employee.id;
  document.getElementById('empModalName').textContent = employee.full_name;
  document.getElementById('empDetailName').textContent = employee.full_name;
  document.getElementById('empDetailPos').textContent = employee.position;
  document.getElementById('empDetailDept').textContent = employeeDepartmentValue(employee);
  document.getElementById('empDetailEmail').textContent = employee.email;
  document.getElementById('empDetailContact').textContent = employee.contact_no || '-';
  document.getElementById('empDetailStatus').textContent = employeeStatusLabel(employee.status);
  document.getElementById('empDetailJoined').textContent = formatDate(employee.created_at);
  document.getElementById('empModal').classList.add('show');
}

function openEmployeeEdit(id) {
  const employee = findEmployee(id);
  if (!employee) return showAdminAlert('Employee Not Found', 'Unable to find this employee record in the database.', false);
  selectedEmployeeId = employee.id;
  document.getElementById('editEmployeeId').value = employee.id;
  document.getElementById('editEmployeeName').value = employee.full_name || '';
  document.getElementById('editEmployeeEmail').value = employee.email || '';
  document.getElementById('editEmployeeContact').value = employee.contact_no || '';
  document.getElementById('editEmployeePosition').value = normalizePositionValue(employee.position);
  document.getElementById('editEmployeeStatus').value = employee.status === 'inactive' ? 'inactive' : 'approved';
  document.getElementById('empEditModal').classList.add('show');
}

function openEmployeeEditFromView() {
  closeModal('empModal');
  openEmployeeEdit(selectedEmployeeId);
}

function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}

function escapeAccountHtml(value) {
  const div = document.createElement('div');
  div.textContent = value || '';
  return div.innerHTML;
}

function inferEmployeeDepartment(position) {
  const value = (position || '').toLowerCase();
  if (value.includes('cook') || value.includes('chef') || value.includes('kitchen')) return 'Kitchen';
  if (value.includes('manager') || value.includes('supervisor')) return 'Management';
  if (value.includes('finance') || value.includes('admin')) return 'Admin & Finance';
  if (value.includes('maintenance')) return 'Maintenance';
  return 'Operations';
}

function employeeDepartmentValue(row) {
  return row?.department || inferEmployeeDepartment(row?.position);
}

function departmentOptionValue(department) {
  return String(department || '').toLowerCase().replace(/\s*&\s*/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function populateDepartmentSelect(selectId, rows) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const current = select.value;
  const departments = Array.from(new Set((rows || []).map(employeeDepartmentValue).filter(Boolean))).sort();
  select.innerHTML = '<option value="">All Departments</option>' + departments.map(dept =>
    '<option value="' + escapeAccountHtml(departmentOptionValue(dept)) + '">' + escapeAccountHtml(dept) + '</option>'
  ).join('');
  if (Array.from(select.options).some(option => option.value === current)) select.value = current;
}

function employeeStatusLabel(status) {
  if (status === 'approved') return 'Active';
  if (status === 'inactive') return 'Not Active / Resigned';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function employeeStatusClass(status) {
  if (status === 'approved') return 'status-active';
  if (status === 'inactive') return 'status-rejected';
  if (status === 'rejected') return 'status-rejected';
  return 'status-pending';
}

async function loadEmployees() {
  const tbody = document.getElementById('employeesTableBody');
  const count = document.getElementById('empCount');
  if (!tbody || !count) return;
  try {
    const response = await fetch('../php/accounts.php?action=list');
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    const employees = data.accounts.filter(account => {
      const position = account.position || '';
      return ['approved', 'inactive'].includes(account.status) &&
        position !== 'Administrator' &&
        !position.toLowerCase().includes('hr') &&
        position.toLowerCase() !== 'human resources';
    });
    adminEmployees = employees;
    populateDepartmentSelect('empFilterDept', employees);
    count.textContent = employees.length + (employees.length === 1 ? ' total' : ' total');
    renderAdminEmployees();
  } catch (error) {
    count.textContent = 'Unavailable';
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Unable to load employees from the database.</td></tr>';
  }
}

function renderAdminEmployees() {
  const tbody = document.getElementById('employeesTableBody');
  const dept = document.getElementById('empFilterDept')?.value || '';
  const status = document.getElementById('empFilterStatus')?.value || '';
  const position = document.getElementById('empFilterPosition')?.value || '';
  const search = document.getElementById('empSearch')?.value.trim().toLowerCase() || '';
  const employees = adminEmployees.filter(employee => {
    const employeeDept = departmentOptionValue(employeeDepartmentValue(employee));
    const employeeStatus = employee.status === 'inactive' ? 'inactive' : 'active';
    const employeePosition = normalizePositionValue(employee.position);
    return (!dept || dept === employeeDept) &&
      (!status || status === employeeStatus) &&
      (!position || position === employeePosition) &&
      (!search || employee.full_name.toLowerCase().includes(search) || employee.email.toLowerCase().includes(search));
  });
  tbody.innerHTML = employees.length ? employees.map(employee => {
    const joined = formatDate(employee.created_at);
    const department = employeeDepartmentValue(employee);
    return '<tr>' +
      '<td><div class="emp-cell"><div class="emp-avatar"><i class="fas fa-user"></i></div><div><span class="emp-name">' + escapeAccountHtml(employee.full_name) + '</span><span class="emp-email">' + escapeAccountHtml(employee.email) + '</span></div></div></td>' +
      '<td>' + escapeAccountHtml(employee.position) + '</td>' +
      '<td>' + escapeAccountHtml(department) + '</td>' +
      '<td><span class="status-badge ' + employeeStatusClass(employee.status) + '">' + employeeStatusLabel(employee.status) + '</span></td>' +
      '<td>' + escapeAccountHtml(joined) + '</td>' +
      '<td><div class="action-btns"><button class="action-btn action-btn-view" onclick="viewEmployee(' + employee.id + ')" title="View"><i class="fas fa-eye"></i></button><button class="action-btn action-btn-edit" onclick="openEmployeeEdit(' + employee.id + ')" title="Edit"><i class="fas fa-edit"></i></button><button class="action-btn employee-face-action ' + (Number(employee.face_enrolled) ? 'is-enrolled' : '') + '" onclick="openExistingFaceEnrollment(' + employee.id + ')" title="' + (Number(employee.face_enrolled) ? 'Re-enroll employee face' : 'Enroll employee face') + '"><i class="fas fa-' + (Number(employee.face_enrolled) ? 'user-check' : 'camera') + '"></i></button></div></td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="6" style="text-align:center;">No matching employee records.</td></tr>';
}

let adminBranches = [];
let branchMap;
let branchMarker;

function branchStatusLabel(status) {
  return status === 'active' ? 'Active' : 'Inactive';
}

function branchStatusClass(status) {
  return status === 'active' ? 'status-approved' : 'status-rejected';
}

function updateBranchCoordsDisplay(lat, lng) {
  const display = document.getElementById('branchCoordsDisplay');
  if (!display) return;
  const safeLat = Number.isFinite(lat) ? Number(lat).toFixed(6) : '0.000000';
  const safeLng = Number.isFinite(lng) ? Number(lng).toFixed(6) : '0.000000';
  display.textContent = 'Selected coordinates: ' + safeLat + ', ' + safeLng;
}

function syncBranchMarkerFromPoint(point) {
  const latitude = Number(point.lat.toFixed(6));
  const longitude = Number(point.lng.toFixed(6));
  document.getElementById('branchLatitude').value = String(latitude);
  document.getElementById('branchLongitude').value = String(longitude);
  updateBranchCoordsDisplay(latitude, longitude);
}

function initializeBranchMap() {
  if (!document.getElementById('branchMap')) return;
  if (branchMap) return;

  const caviteBounds = [[13.8, 120.4], [14.7, 121.7]];
  const defaultLat = 14.2794;
  const defaultLng = 120.8831;

  branchMap = L.map('branchMap', {
    zoomControl: true,
    scrollWheelZoom: true,
    dragging: true,
    doubleClickZoom: true,
    boxZoom: true,
    keyboard: true,
    worldCopyJump: false,
    maxZoom: 20,
    minZoom: 10,
    maxBounds: caviteBounds,
    maxBoundsViscosity: 1.0
  }).setView([defaultLat, defaultLng], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    noWrap: false
  }).addTo(branchMap);

  const savedLat = parseFloat(document.getElementById('branchLatitude')?.value || '');
  const savedLng = parseFloat(document.getElementById('branchLongitude')?.value || '');
  const lat = Number.isFinite(savedLat) ? savedLat : defaultLat;
  const lng = Number.isFinite(savedLng) ? savedLng : defaultLng;

  branchMarker = L.marker([lat, lng], {
    draggable: true,
    keyboard: true,
    title: 'Branch location'
  }).addTo(branchMap);

  branchMarker.on('dragend', function (event) {
    syncBranchMarkerFromPoint(event.target.getLatLng());
  });

  branchMap.on('click', function (event) {
    branchMarker.setLatLng(event.latlng);
    syncBranchMarkerFromPoint(event.latlng);
  });

  branchMarker.on('drag', function (event) {
    syncBranchMarkerFromPoint(event.target.getLatLng());
  });

  syncBranchMarkerFromPoint(branchMarker.getLatLng());
  setTimeout(() => {
    if (branchMap) branchMap.invalidateSize();
  }, 150);
}

function setBranchMapCoordinates(lat, lng, zoom = 17) {
  if (!branchMap || !branchMarker) {
    initializeBranchMap();
  }

  const safeLat = Number.isFinite(lat) ? lat : 14.2794;
  const safeLng = Number.isFinite(lng) ? lng : 120.8831;
  const zoomLevel = Math.max(10, Math.min(20, zoom));
  branchMarker.setLatLng([safeLat, safeLng]);
  branchMap.setView([safeLat, safeLng], zoomLevel);
  document.getElementById('branchLatitude').value = String(Number(safeLat.toFixed(6)));
  document.getElementById('branchLongitude').value = String(Number(safeLng.toFixed(6)));
  updateBranchCoordsDisplay(safeLat, safeLng);
  setTimeout(() => {
    if (branchMap) branchMap.invalidateSize();
  }, 100);
}

let branchLocationSearchTimer = null;

function buildBranchLocationSearchQueries(rawAddress) {
  const cleaned = String(rawAddress || '').trim();
  if (!cleaned) return [];

  const cityHints = [
    'Trece Martires City',
    'Dasmariñas',
    'General Trias',
    'Imus',
    'Cavite City',
    'Tagaytay',
    'Bacoor'
  ];

  const baseQueries = new Set();
  const normalized = cleaned.replace(/\s+/g, ' ');

  baseQueries.add(normalized);
  baseQueries.add(normalized + ', Cavite, Philippines');
  baseQueries.add(normalized + ', Trece Martires City, Cavite, Philippines');
  baseQueries.add(normalized + ', Dasmariñas, Cavite, Philippines');
  baseQueries.add(normalized + ', General Trias, Cavite, Philippines');
  baseQueries.add(normalized + ', Cavite Province, Philippines');

  for (const city of cityHints) {
    if (!new RegExp(city, 'i').test(normalized)) {
      baseQueries.add(normalized + ', ' + city + ', Cavite, Philippines');
    }
  }

  return Array.from(baseQueries).filter(Boolean);
}

function preferredBranchLocationResult(results) {
  if (!Array.isArray(results) || !results.length) return null;

  const preferred = results.find(item => {
    const address = (item.address && typeof item.address === 'object') ? item.address : {};
    const display = String(item.display_name || '').toLowerCase();
    return /cavite/i.test(display)
      || /cavite/i.test(address.state || '')
      || /cavite/i.test(address.city || '')
      || /cavite/i.test(address.county || '')
      || /cavite/i.test(address.province || '');
  });

  return preferred || results[0];
}

async function searchBranchLocationOnMap() {
  const locationInput = document.getElementById('branchLocation');
  if (!locationInput) return;

  const rawAddress = String(locationInput.value || '').trim();
  if (!rawAddress) return;

  const queries = buildBranchLocationSearchQueries(rawAddress);
  let lastError = null;

  for (const query of queries) {
    try {
      const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=1&bounded=1&viewbox=120.4,14.7,121.7,13.8&accept-language=en&q=' + encodeURIComponent(query);
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'QuadraHRMS/1.0'
        }
      });
      const result = await response.json();
      const preferred = preferredBranchLocationResult(result);

      if (!preferred) {
        lastError = new Error('No matching location found.');
        continue;
      }

      const latitude = parseFloat(preferred.lat);
      const longitude = parseFloat(preferred.lon);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        lastError = new Error('This location could not be mapped accurately.');
        continue;
      }

      setBranchMapCoordinates(latitude, longitude, 17.5);
      locationInput.value = rawAddress;
      return;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    showAdminAlert('Location Not Found', 'Unable to find that address in Cavite. You can still move the marker manually to the exact branch location.', false);
  }
}

async function loadBranches() {
  const tbody = document.getElementById('branchesTableBody');
  const count = document.getElementById('branchCount');
  if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading branches from the database...</td></tr>';
  try {
    const response = await fetch('../php/branches.php?action=list', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load branches.');
    adminBranches = result.branches || [];
    if (count) count.textContent = adminBranches.length + (adminBranches.length === 1 ? ' branch' : ' branches');
    renderBranches();
  } catch (error) {
    if (count) count.textContent = 'Unavailable';
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Branches could not be loaded.</td></tr>';
    showAdminAlert('Branches Not Loaded', error.message, false);
  }
}

function renderBranches() {
  const tbody = document.getElementById('branchesTableBody');
  const status = document.getElementById('branchStatus')?.value || '';
  const search = document.getElementById('branchSearch')?.value.trim().toLowerCase() || '';
  const rows = adminBranches.filter(branch => {
    const matchesStatus = !status || branch.status === status;
    const matchesSearch = !search || branch.name.toLowerCase().includes(search) || branch.location.toLowerCase().includes(search) || branch.contact_details.toLowerCase().includes(search);
    return matchesStatus && matchesSearch;
  });
  if (!tbody) return;
  tbody.innerHTML = rows.length ? rows.map(branch => {
    const requiredTotal = (branch.required_baristas || 0) + (branch.required_cashiers || 0) + (branch.required_managers || 0);
    const currentTotal = (branch.current_baristas || 0) + (branch.current_cashiers || 0) + (branch.current_managers || 0);
    const needed = Math.max(0, requiredTotal - currentTotal);
    return '<tr>' +
      '<td>' + escapeAccountHtml(branch.name) + '</td>' +
      '<td>' + escapeAccountHtml(branch.location) + '</td>' +
      '<td>' + escapeAccountHtml(branch.contact_details) + '</td>' +
      '<td><strong>' + requiredTotal + ' required</strong><br>' +
          '<small>B ' + (branch.required_baristas || 0) + ' • C ' + (branch.required_cashiers || 0) + ' • M ' + (branch.required_managers || 0) + '</small><br>' +
          '<small>Current ' + currentTotal + '/' + requiredTotal + ' • Need ' + needed + '</small><br>' +
          '<small>Applicants: ' + (branch.applicant_count || 0) + '</small></td>' +
      '<td><span class="status-badge ' + branchStatusClass(branch.status) + '">' + branchStatusLabel(branch.status) + '</span></td>' +
      '<td>' + escapeAccountHtml(branch.created_at || '') + '</td>' +
      '<td><div class="action-btns"><button class="action-btn action-btn-view" onclick="editBranch(' + branch.id + ')" title="Edit"><i class="fas fa-edit"></i></button><button class="action-btn action-btn-reject" onclick="deleteBranch(' + branch.id + ')" title="Delete"><i class="fas fa-trash"></i></button></div></td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="7" style="text-align:center;">No branches found.</td></tr>';
}

function openBranchForm(branch = null) {
  const form = document.getElementById('branchForm');
  form.reset();
  document.getElementById('branchId').value = branch?.id || '';
  document.getElementById('branchName').value = branch?.name || '';
  document.getElementById('branchLocation').value = branch?.location || '';
  document.getElementById('branchContact').value = branch?.contact_details || '';
  document.getElementById('branchLatitude').value = branch?.latitude ?? '';
  document.getElementById('branchLongitude').value = branch?.longitude ?? '';
  document.getElementById('branchRequiredBaristas').value = branch?.required_baristas ?? 0;
  document.getElementById('branchRequiredCashiers').value = branch?.required_cashiers ?? 0;
  document.getElementById('branchRequiredManagers').value = branch?.required_managers ?? 0;
  document.getElementById('branchStatusInput').value = branch?.status || 'active';
  document.getElementById('branchModalTitle').textContent = branch ? 'Edit Branch' : 'Add Branch';
  document.getElementById('branchFormSubmit').textContent = branch ? 'Save Changes' : 'Add Branch';

  initializeBranchMap();
  const lat = parseFloat(document.getElementById('branchLatitude').value || '');
  const lng = parseFloat(document.getElementById('branchLongitude').value || '');
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    setBranchMapCoordinates(lat, lng);
  } else {
    setBranchMapCoordinates(14.5995, 120.9842);
  }

  document.getElementById('branchModal').classList.add('show');
  setTimeout(() => {
    if (branchMap) branchMap.invalidateSize();
  }, 200);
}

function closeBranchForm() {
  document.getElementById('branchModal').classList.remove('show');
  if (branchMap) {
    setTimeout(() => branchMap.invalidateSize(), 100);
  }
}

async function saveBranch(event) {
  event.preventDefault();
  const form = document.getElementById('branchForm');
  const data = new FormData(form);
  const id = data.get('branch_id');
  const name = String(data.get('branch_name') || '').trim();
  const location = String(data.get('branch_location') || '').trim();
  const contact = String(data.get('branch_contact') || '').trim();
  const latitude = parseFloat(String(data.get('branch_latitude') || ''));
  const longitude = parseFloat(String(data.get('branch_longitude') || ''));
  const requiredBaristas = parseInt(String(data.get('required_baristas') || '0'), 10);
  const requiredCashiers = parseInt(String(data.get('required_cashiers') || '0'), 10);
  const requiredManagers = parseInt(String(data.get('required_managers') || '0'), 10);
  if (!name || !location || !contact) {
    showAdminAlert('Missing fields', 'Please fill out all branch fields.', false);
    return;
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    showAdminAlert('Invalid branch location', 'Please select a valid location on the map before saving.', false);
    return;
  }
  if ([requiredBaristas, requiredCashiers, requiredManagers].some(value => !Number.isInteger(value) || value < 0 || value > 4)) {
    showAdminAlert('Invalid staffing values', 'Branch staffing requirements must be whole numbers between 0 and 4.', false);
    return;
  }
  data.set('branch_latitude', String(Number(latitude.toFixed(6))));
  data.set('branch_longitude', String(Number(longitude.toFixed(6))));
  data.set('required_baristas', String(requiredBaristas));
  data.set('required_cashiers', String(requiredCashiers));
  data.set('required_managers', String(requiredManagers));
  data.set('action', id ? 'update' : 'create');
  try {
    const response = await fetch('../php/branches.php', { method: 'POST', body: data });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to save branch.');
    closeBranchForm();
    await loadBranches();
    showAdminAlert(id ? 'Branch Updated' : 'Branch Created', result.message, true);
  } catch (error) {
    showAdminAlert('Branch Not Saved', error.message, false);
  }
}

function editBranch(id) {
  const branch = adminBranches.find(item => Number(item.id) === Number(id));
  if (!branch) return showAdminAlert('Branch Not Found', 'Unable to find branch record.', false);
  openBranchForm(branch);
}

async function deleteBranch(id) {
  if (!confirm('Delete this branch? This action cannot be undone.')) return;
  try {
    const body = new URLSearchParams({ action: 'delete', id: String(id) });
    const response = await fetch('../php/branches.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to delete branch.');
    await loadBranches();
    showAdminAlert('Branch Deleted', result.message, true);
  } catch (error) {
    showAdminAlert('Deletion Failed', error.message, false);
  }
}

function branchSearchChanged() {
  renderBranches();
}

function branchStatusChanged() {
  renderBranches();
}

function showAdminAlert(title, message, success = true) {
  const icon = document.getElementById('adminAlertIcon');
  const iconTag = document.getElementById('adminAlertIconTag');
  icon.style.background = success ? 'rgba(139, 94, 60,0.15)' : 'rgba(139, 94, 60,0.15)';
  icon.style.borderColor = success ? 'rgba(139, 94, 60,0.25)' : 'rgba(139, 94, 60,0.25)';
  iconTag.className = success ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
  iconTag.style.color = success ? '#8B5E3C' : '#8B5E3C';
  document.getElementById('adminAlertTitle').textContent = title;
  document.getElementById('adminAlertDesc').textContent = message;
  document.getElementById('adminAlertModal').classList.add('show');
}

function closeAdminAlert() {
  document.getElementById('adminAlertModal').classList.remove('show');
}

function enforceElevenDigitPhone(input) {
  if (!input) return;
  input.addEventListener('input', function() {
    this.value = this.value.replace(/\D/g, '').slice(0, 11);
  });
}

enforceElevenDigitPhone(document.querySelector('#adminCreateEmployeeForm input[name="contact_no"]'));
enforceElevenDigitPhone(document.getElementById('editEmployeeContact'));

document.getElementById('employeeEditForm')?.addEventListener('submit', async function(event) {
  event.preventDefault();
  const contact = document.getElementById('editEmployeeContact').value.trim();
  const position = document.getElementById('editEmployeePosition').value;
  if (!/^\d{11}$/.test(contact)) {
    showAdminAlert('Invalid Contact Number', 'Contact number must be exactly 11 digits.', false);
    return;
  }
  if (!position) {
    showAdminAlert('Position Required', 'Please select Barista or Cashier for this employee.', false);
    return;
  }
  try {
    const body = new FormData(this);
    body.append('action', 'update');
    const response = await fetch('../php/accounts.php', { method: 'POST', body });
    const result = await response.json();
    if (!result.success) return showAdminAlert('Update Not Saved', result.message, false);
    closeModal('empEditModal');
    await loadEmployees();
    loadAdminDashboard();
    showAdminAlert('Employee Updated', result.message, true);
  } catch (error) {
    showAdminAlert('Update Not Saved', 'Unable to update the employee record.', false);
  }
});

// ============================================
// SEARCH
// ============================================
document.getElementById('globalSearch')?.addEventListener('keypress', function(e) {
  if (e.key === 'Enter' && this.value.trim()) {
    alert('🔍 Searching for: ' + this.value.trim());
  }
});

loadEmployees();
loadHiredApplicantsForAccounts();

setInterval(() => {
  if (document.getElementById('page-employees')?.classList.contains('active')) {
    loadEmployees();
    loadHiredApplicantsForAccounts();
  }
  if (document.getElementById('page-attendance')?.classList.contains('active') || document.getElementById('page-dashboard')?.classList.contains('active')) {
    loadAdminAttendance();
  }
  if (document.getElementById('page-payroll')?.classList.contains('active')) loadAdminPayroll();
  if (document.getElementById('page-leave')?.classList.contains('active')) loadAdminLeaves();
}, 10000);

// ============================================
// GENERATE REPORT
// ============================================
function generateReport() {
  alert('📊 Generating comprehensive report...\n\nReport will be available for download shortly.');
}

// ============================================
// ATTENDANCE SEARCH
// ============================================
let adminAttendanceData = [];

function adminAttendanceTime(value) {
  if (!value) return '—';
  const date = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function adminAttendanceMinutes(value) {
  if (!value) return null;
  const match = String(value).match(/\s(\d{2}):(\d{2}):\d{2}$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function renderAdminAttendance() {
  const body = document.getElementById('adminAttendanceBody');
  const selectedDate = document.getElementById('attendanceDate').value;
  const today = new Date().toLocaleDateString('en-CA');
  const deptFilter = document.getElementById('attFilterDept').value;
  const statusFilter = document.getElementById('attFilterStatus').value;
  const search = document.getElementById('attSearch').value.trim().toLowerCase();
  const records = adminAttendanceData.filter(record => {
    const dept = departmentOptionValue(employeeDepartmentValue(record));
    const displayStatus = record.status;
    const statusMatch = !statusFilter || statusFilter === displayStatus || (statusFilter === 'present' && displayStatus === 'on_time') || (statusFilter === 'leave' && displayStatus === 'on_leave') || (statusFilter === 'halfday' && (record.day_status === 'half_day' || String(record.leave_during || '').startsWith('half-day')));
    return (!deptFilter || deptFilter === dept) && statusMatch && (!search || record.full_name.toLowerCase().includes(search));
  });
  body.innerHTML = records.length ? records.map(record => {
    let label = 'Not Clocked In';
    let badge = 'status-pending';
    let remark = 'No attendance record';
    const timeInMinutes = adminAttendanceMinutes(record.clock_in);
    const timeOutMinutes = adminAttendanceMinutes(record.clock_out);
    const arrivedLate = timeInMinutes !== null && timeInMinutes >= 8 * 60 + 30;
    const endedEarly = timeOutMinutes !== null && timeOutMinutes < 17 * 60;
    const reviewable = ['full_day', 'half_day', 'undertime'].includes(record.day_status);
    if (record.clock_in) {
      if (record.clock_out && endedEarly) {
        label = arrivedLate ? 'Late / Early Out' : 'Incomplete Shift';
        badge = arrivedLate ? 'status-late' : 'status-absent';
        remark = (arrivedLate ? 'Late arrival at ' + adminAttendanceTime(record.clock_in) + '. ' : '') + 'Ended shift early at ' + adminAttendanceTime(record.clock_out) + '; required end is 5:00 PM.';
      } else if (record.clock_out) {
        label = arrivedLate ? 'Late' : 'Completed';
        badge = arrivedLate ? 'status-late' : 'status-ontime';
        remark = (arrivedLate ? 'Late arrival at ' + adminAttendanceTime(record.clock_in) + '. ' : '') + 'Full shift completed at ' + adminAttendanceTime(record.clock_out) + '.';
      } else if (selectedDate < today || (selectedDate === today && new Date().getHours() >= 17)) {
        label = arrivedLate ? 'Late / Incomplete' : 'Incomplete Shift';
        badge = arrivedLate ? 'status-late' : 'status-absent';
        remark = (arrivedLate ? 'Late arrival at ' + adminAttendanceTime(record.clock_in) + '. ' : '') + 'No end-shift time was recorded.';
      } else {
        label = arrivedLate ? 'Late' : 'Present';
        badge = arrivedLate ? 'status-late' : 'status-ontime';
        remark = (arrivedLate ? 'Late arrival at ' + adminAttendanceTime(record.clock_in) + '. ' : '') + (record.break_start && !record.break_end ? 'Currently on break.' : 'Shift is still in progress.');
      }
    }
    else if (record.status === 'on_leave') { label = String(record.leave_during || '').startsWith('half-day') ? 'Half-Day Leave' : 'On Leave'; badge = 'status-approved'; remark = adminLeaveType(record.leave_type) + ' (' + String(record.leave_pay_type || '').replace('-', ' ') + ')'; }
    else if (record.status === 'day_off') { label = 'Day Off'; badge = 'status-approved'; remark = 'Scheduled ' + escapeHtml(record.scheduled_day_off || '') + ' day off'; }
    else if (record.status === 'absent') { label = 'Absent'; badge = 'status-absent'; remark = 'No time-in recorded within 1 hour after shift start'; }
    if (record.clock_out) {
      label = record.approval_status === 'pending' ? 'Pending Admin Review' : (record.approval_status === 'rejected' ? 'Rejected' : 'Approved');
      badge = record.approval_status === 'pending' ? 'status-pending' : (record.approval_status === 'rejected' ? 'status-rejected' : 'status-approved');
      const metrics = [];
      if (Number(record.late_minutes)) metrics.push('Late ' + Number(record.late_minutes) + 'm');
      if (Number(record.undertime_minutes)) metrics.push('Undertime ' + Number(record.undertime_minutes) + 'm');
      if (Number(record.overtime_minutes)) metrics.push('Overtime ' + Number(record.overtime_minutes) + 'm');
      metrics.push('Worked ' + attendanceDurationLabel(record.duration_seconds));
      remark = escapeHtml(record.attendance_remark || 'Completed') + ' — ' + metrics.join(', ');
      if (record.admin_note) remark += '<br><small>Admin: ' + escapeHtml(record.admin_note) + '</small>';
      if (record.reviewed_by_name) remark += '<br><small>Reviewed by ' + escapeHtml(record.reviewed_by_name) + '</small>';
    }
    const reviewActions = record.approval_status === 'pending'
      ? '<button class="action-btn action-btn-approve" onclick="reviewAttendance(' + Number(record.record_id) + ',\'approved\')" title="Approve attendance"><i class="fas fa-check"></i></button> <button class="action-btn action-btn-reject" onclick="reviewAttendance(' + Number(record.record_id) + ',\'rejected\')" title="Disapprove attendance"><i class="fas fa-times"></i></button>'
      : (reviewable ? '<span class="status-badge ' + (record.approval_status === 'approved' ? 'status-approved' : 'status-rejected') + '">' + escapeHtml(record.approval_status) + '</span>' : '—');
    const proofButtons = [
      record.clock_in_proof_id ? '<a class="attendance-proof-btn proof-time-in" href="../php/attendance.php?action=proof&proof_id=' + Number(record.clock_in_proof_id) + '" target="_blank" rel="noopener" title="View Time In photo, GPS, and timestamp"><span class="attendance-proof-icon"><i class="fas fa-image"></i></span><span><small>PHOTO</small>Time In</span><i class="fas fa-chevron-right proof-arrow"></i></a>' : '',
      record.break_end_proof_id ? '<a class="attendance-proof-btn proof-lunch-in" href="../php/attendance.php?action=proof&proof_id=' + Number(record.break_end_proof_id) + '" target="_blank" rel="noopener" title="View Lunch In photo, GPS, and timestamp"><span class="attendance-proof-icon"><i class="fas fa-mug-hot"></i></span><span><small>PHOTO</small>Lunch In</span><i class="fas fa-chevron-right proof-arrow"></i></a>' : '',
      record.clock_out_proof_id ? '<a class="attendance-proof-btn proof-time-out" href="../php/attendance.php?action=proof&proof_id=' + Number(record.clock_out_proof_id) + '" target="_blank" rel="noopener" title="View Time Out photo, GPS, and timestamp"><span class="attendance-proof-icon"><i class="fas fa-image"></i></span><span><small>PHOTO</small>Time Out</span><i class="fas fa-chevron-right proof-arrow"></i></a>' : ''
    ].filter(Boolean).join(' ');
    return '<tr><td><div class="emp-cell"><div class="emp-avatar"><i class="fas fa-user"></i></div><div><span class="emp-name">' + escapeHtml(record.full_name) + '</span><span class="emp-email">' + escapeHtml(record.email) + '</span></div></div></td>' +
      '<td>' + escapeHtml(employeeDepartmentValue(record)) + '</td><td>' + adminAttendanceTime(record.clock_in) + '</td><td>' + adminAttendanceTime(record.break_start) + '</td><td>' + adminAttendanceTime(record.break_end) + '</td><td>' + adminAttendanceTime(record.clock_out) + '</td>' +
      '<td><span class="status-badge ' + badge + '">' + label + '</span></td><td>' + remark + '</td><td><div class="attendance-proof-actions">' + (proofButtons || '<span class="attendance-no-proof"><i class="fas fa-image"></i> No proof</span>') + '</div></td><td>' + reviewActions + '</td></tr>';
  }).join('') : '<tr><td colspan="10" style="text-align:center;">No matching attendance records for this date.</td></tr>';
}

function attendanceDurationLabel(seconds) {
  const minutes = Math.max(0, Math.floor(Number(seconds || 0) / 60));
  return Math.floor(minutes / 60) + 'h ' + (minutes % 60) + 'm';
}

let attendanceReviewState = null;

function reviewAttendance(id, decision) {
  const record = adminAttendanceData.find(item => Number(item.record_id) === Number(id));
  attendanceReviewState = { id, decision };
  document.getElementById('attendanceReviewTitle').textContent = decision === 'approved' ? 'Approve Attendance' : 'Reject Attendance';
  document.getElementById('attendanceReviewSummary').textContent = (record?.full_name || 'Employee') + ' — ' + (record?.attendance_remark || 'Attendance record');
  document.getElementById('attendanceReviewNote').value = record?.admin_note || '';
  document.getElementById('attendanceReviewSubmit').textContent = decision === 'approved' ? 'Approve' : 'Reject';
  document.getElementById('attendanceReviewModal').classList.add('show');
}

function closeAttendanceReview() {
  document.getElementById('attendanceReviewModal').classList.remove('show');
  attendanceReviewState = null;
}

async function submitAttendanceReview() {
  if (!attendanceReviewState) return;
  const { id, decision } = attendanceReviewState;
  const adminNote = document.getElementById('attendanceReviewNote').value.trim();
  if (decision === 'rejected' && !adminNote) {
    showAdminAlert('Rejection Note Required', 'Enter the reason why this attendance is being rejected.', false);
    return;
  }
  try {
    const body = new URLSearchParams({ action: 'attendance_decision', id: String(id), decision, admin_note: adminNote });
    const response = await fetch('../php/attendance.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to review attendance.');
    closeAttendanceReview();
    await loadAdminAttendance();
    showAdminAlert(decision === 'approved' ? 'Attendance Approved' : 'Attendance Disapproved', result.message, decision === 'approved');
  } catch (error) {
    showAdminAlert('Attendance Not Reviewed', error.message, false);
  }
}

function renderAdminAttendanceActivity(items) {
  const list = document.getElementById('adminRecentActivity');
  list.innerHTML = items.length ? items.map(item => {
    const late = item.type === 'late_clock_in';
    const out = item.type === 'clock_out';
    const action = item.type === 'break_start' ? 'recorded Lunch Out' : (item.type === 'break_end' ? 'recorded Lunch In' : (out ? 'ended the shift' : (late ? 'timed in late' : 'timed in')));
    const occurred = new Date(String(item.occurred_at).replace(' ', 'T'));
    return '<div class="activity-item"><div class="activity-dot ' + (late ? 'activity-dot-red' : 'activity-dot-green') + '"></div><div class="activity-info"><span class="activity-text">' + escapeHtml(item.employee) + ' ' + action + ' at ' + adminAttendanceTime(item.occurred_at) + '</span><span class="activity-time">' + occurred.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + '</span></div></div>';
  }).join('') : '<div class="activity-item"><div class="activity-info"><span class="activity-text">No employee attendance activity yet.</span></div></div>';
}

async function loadAdminAttendance() {
  const date = document.getElementById('attendanceDate').value || new Date().toLocaleDateString('en-CA');
  try {
    const response = await fetch('../php/attendance.php?action=admin&date=' + encodeURIComponent(date), { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load attendance.');
    adminAttendanceData = result.records;
    populateDepartmentSelect('attFilterDept', adminAttendanceData);
    document.getElementById('attPresent').textContent = result.stats.present;
    document.getElementById('attLate').textContent = result.stats.late;
    document.getElementById('attAbsent').textContent = result.stats.absent;
    document.getElementById('attLogDate').textContent = 'Date: ' + new Date(result.date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    if (result.date === new Date().toLocaleDateString('en-CA')) document.getElementById('presentToday').textContent = result.stats.present;
    renderAdminAttendance();
    renderAdminAttendanceActivity(result.activities);
  } catch (error) {
    document.getElementById('adminAttendanceBody').innerHTML = '<tr><td colspan="10" style="text-align:center;">Attendance data could not be loaded.</td></tr>';
  }
}

document.getElementById('attendanceDate')?.addEventListener('change', loadAdminAttendance);
document.getElementById('attFilterDept')?.addEventListener('change', renderAdminAttendance);
document.getElementById('attFilterStatus')?.addEventListener('change', renderAdminAttendance);
document.getElementById('attSearch')?.addEventListener('keyup', function() {
  renderAdminAttendance();
});

loadAdminAttendance();

// ============================================
// EMPLOYEE SEARCH
// ============================================
document.getElementById('empSearch')?.addEventListener('keyup', function() {
  renderAdminEmployees();
});
document.getElementById('empFilterDept')?.addEventListener('change', renderAdminEmployees);
document.getElementById('empFilterStatus')?.addEventListener('change', renderAdminEmployees);
document.getElementById('empFilterPosition')?.addEventListener('change', renderAdminEmployees);
document.getElementById('branchSearch')?.addEventListener('keyup', function() {
  renderBranches();
});
document.getElementById('branchStatus')?.addEventListener('change', function() {
  renderBranches();
});

document.getElementById('branchForm')?.addEventListener('submit', saveBranch);
document.getElementById('branchLocation')?.addEventListener('input', function () {
  const locationValue = this.value.trim();
  if (!locationValue) return;

  if (branchLocationSearchTimer) {
    clearTimeout(branchLocationSearchTimer);
  }

  branchLocationSearchTimer = setTimeout(() => {
    searchBranchLocationOnMap();
  }, 650);
});
document.getElementById('branchLocation')?.addEventListener('change', searchBranchLocationOnMap);

// ============================================
// PAYROLL SEARCH
// ============================================
let adminPayrollRecords = [];

function payrollMoney(value) {
  return '₱' + Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function payrollPeriodLabel(period) {
  const parts = String(period || '').match(/^(\d{4}-\d{2})(?:-(15|30))?$/);
  if (!parts) return period;
  const date = new Date(parts[1] + '-01T00:00:00');
  if (Number.isNaN(date.getTime())) return period;
  const month = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  if (parts[2] === '15') return month + ' (1-15)';
  if (parts[2] === '30') {
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return month + ' (16-' + lastDay + ')';
  }
  return month;
}

function payrollCutoffDate(period) {
  const parts = String(period || '').match(/^(\d{4})-(\d{2})-(15|30)$/);
  if (!parts) return null;
  const year = Number(parts[1]);
  const monthIndex = Number(parts[2]) - 1;
  if (parts[3] === '15') return new Date(year, monthIndex, 15);
  return new Date(year, monthIndex + 1, 0);
}

function payrollCutoffReached(period) {
  const cutoff = payrollCutoffDate(period);
  if (!cutoff) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  cutoff.setHours(0, 0, 0, 0);
  return today >= cutoff;
}

function payrollCutoffDateLabel(period) {
  const cutoff = payrollCutoffDate(period);
  return cutoff ? cutoff.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
}

function latestClosedPayrollPeriod(now = new Date()) {
  const localMonth = date => date.toLocaleDateString('en-CA').slice(0, 7);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  if (now.getDate() >= lastDay) return localMonth(now) + '-30';
  if (now.getDate() >= 15) return localMonth(now) + '-15';
  return localMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)) + '-30';
}

function updatePayrollProcessState() {
  const select = document.getElementById('payrollPeriod');
  const button = document.getElementById('processPayrollBtn');
  if (!select || !button) return;
  const ready = payrollCutoffReached(select.value);
  button.disabled = !ready;
  button.title = ready ? 'Process payroll for this cutoff' : 'Cutoff is not reached yet. Available on ' + payrollCutoffDateLabel(select.value);
  button.style.opacity = ready ? '1' : '0.55';
  button.style.cursor = ready ? 'pointer' : 'not-allowed';
}

function setupPayrollPeriods() {
  const select = document.getElementById('payrollPeriod');
  if (!select || select.options.length) return;
  const now = new Date();
  for (let i = 0; i < 3; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = date.toLocaleDateString('en-CA').slice(0, 7);
    ['30', '15'].forEach(cutoff => {
      const value = month + '-' + cutoff;
      const option = document.createElement('option');
      option.value = value;
      option.textContent = payrollPeriodLabel(value);
      select.appendChild(option);
    });
  }
  select.value = latestClosedPayrollPeriod(now);
  updatePayrollProcessState();
}

function payrollStatusLabel(status) {
  return status === 'issued' ? 'Issued' : 'Pending';
}

function payrollStatusClass(status) {
  return status === 'issued' ? 'status-approved' : 'status-pending';
}

function filterAdminPayroll() {
  const departmentFilter = document.getElementById('payrollDept').value.toLowerCase();
  const statusFilter = document.getElementById('payrollStatus').value;
  const search = document.getElementById('payrollSearch').value.trim().toLowerCase();
  const body = document.getElementById('payrollTableBody');
  const filtered = adminPayrollRecords.filter(row => {
    const dept = departmentOptionValue(employeeDepartmentValue(row));
    const status = row.status === 'issued' ? 'paid' : 'pending';
    return (!departmentFilter || dept === departmentFilter) &&
      (!statusFilter || statusFilter === status) &&
      (!search || row.full_name.toLowerCase().includes(search) || row.email.toLowerCase().includes(search));
  });

  body.innerHTML = filtered.length ? filtered.map(row => {
    const dept = employeeDepartmentValue(row);
    return '<article class="admin-payroll-employee-card">' +
      '<div class="admin-payroll-employee-head"><div class="emp-avatar"><i class="fas fa-user"></i></div>' +
      '<div class="admin-payroll-identity"><h4>' + escapeAccountHtml(row.full_name) + '</h4><p>' + escapeAccountHtml(row.email) + '</p></div>' +
      '<span class="status-badge ' + payrollStatusClass(row.status) + '">' + payrollStatusLabel(row.status) + '</span></div>' +
      '<div class="admin-payroll-department"><i class="fas fa-building"></i> ' + escapeAccountHtml(dept) + '</div>' +
      '<div class="admin-payroll-values">' +
      '<div><span>Gross Salary</span><strong>' + payrollMoney(row.gross_pay) + '</strong></div>' +
      '<div><span>Deductions</span><strong class="deduction">' + payrollMoney(row.total_deductions) + '</strong></div>' +
      '</div>' +
      '<div class="admin-payroll-net-row"><div><span>NET PAY</span><strong>' + payrollMoney(row.net_pay) + '</strong></div>' +
      '<button onclick="viewAdminPayslip(' + row.employee_id + ')" title="View complete payslip"><i class="fas fa-file-invoice-dollar"></i><span>View Payslip</span></button></div>' +
      '</article>';
  }).join('') : '<div class="admin-payroll-empty"><i class="fas fa-wallet"></i><span>No payroll records match this filter.</span></div>';
}

async function loadAdminPayroll() {
  setupPayrollPeriods();
  const now = new Date();
  const currentPeriod = latestClosedPayrollPeriod(now);
  const period = document.getElementById('payrollPeriod').value || currentPeriod;
  try {
    const response = await fetch('../php/payroll.php?action=preview&period=' + encodeURIComponent(period), { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load payroll.');
    adminPayrollRecords = result.records || [];
    populateDepartmentSelect('payrollDept', adminPayrollRecords);
    document.getElementById('payrollTotalNet').textContent = payrollMoney(result.summary.total_net);
    document.getElementById('payrollEmployeeCount').textContent = result.summary.employees;
    document.getElementById('payrollAverageNet').textContent = payrollMoney(result.summary.average_net);
    document.getElementById('payrollSummaryPeriod').textContent = result.period_label || payrollPeriodLabel(result.period);
    document.getElementById('payrollShowingPeriod').textContent = 'Showing ' + (result.period_label || payrollPeriodLabel(result.period));
    updatePayrollProcessState();
    filterAdminPayroll();
    loadAdminPayrollHistory();
  } catch (error) {
    document.getElementById('payrollTableBody').innerHTML = '<div class="admin-payroll-empty">Payroll could not be loaded.</div>';
    showAdminAlert('Payroll Not Loaded', error.message, false);
  }
}

async function loadAdminPayrollHistory() {
  const body = document.getElementById('payrollHistoryBody');
  if (!body) return;
  try {
    const response = await fetch('../php/payroll.php?action=history', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load payroll history.');
    const rows = result.records || [];
    body.innerHTML = rows.length ? rows.map(row =>
      '<article class="admin-payroll-employee-card">' +
      '<div class="admin-payroll-employee-head"><div class="emp-avatar"><i class="fas fa-calendar-check"></i></div>' +
      '<div class="admin-payroll-identity"><h4>' + escapeAccountHtml(row.period_label) + '</h4><p>' + Number(row.employees) + ' employee(s) &middot; Issued ' + new Date(row.issued_at.replace(' ', 'T')).toLocaleDateString('en-PH') + '</p></div>' +
      '<span class="status-badge status-approved">Issued</span></div>' +
      '<div class="admin-payroll-values"><div><span>Gross Payroll</span><strong>' + payrollMoney(row.total_gross) + '</strong></div><div><span>Deductions</span><strong class="deduction">' + payrollMoney(row.total_deductions) + '</strong></div></div>' +
      '<div class="admin-payroll-net-row"><div><span>TOTAL NET PAY</span><strong>' + payrollMoney(row.total_net) + '</strong></div><button onclick="openPayrollHistoryPeriod(\'' + row.period + '\')"><i class="fas fa-eye"></i><span>View Payroll</span></button></div></article>'
    ).join('') : '<div class="admin-payroll-empty"><i class="fas fa-clock-rotate-left"></i><span>No issued payroll history yet.</span></div>';
  } catch (error) {
    body.innerHTML = '<div class="admin-payroll-empty">Payroll history could not be loaded.</div>';
  }
}

function openPayrollHistoryPeriod(period) {
  showPayrollHistoryDetails(period);
}

async function showPayrollHistoryDetails(period) {
  const panel = document.getElementById('payrollHistoryDetails');
  const body = document.getElementById('payrollHistoryDetailsBody');
  if (!panel || !body) return;
  panel.classList.add('show');
  document.getElementById('payrollHistoryTitle').textContent = 'Payroll – ' + payrollPeriodLabel(period);
  body.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading employees...</td></tr>';
  try {
    const response = await fetch('../php/payroll.php?action=history_details&period=' + encodeURIComponent(period), { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load payroll details.');
    const rows = result.records || [];
    body.innerHTML = rows.length ? rows.map(row => '<tr><td><strong>' + escapeAccountHtml(row.full_name) + '</strong><br><small>' + escapeAccountHtml(row.position) + '</small></td><td>' + payrollMoney(row.gross_pay) + '</td><td class="payroll-history-deduction">' + payrollMoney(row.total_deductions) + '</td><td><strong>' + payrollMoney(row.net_pay) + '</strong></td></tr>').join('') : '<tr><td colspan="4" style="text-align:center;">No employees found for this payroll period.</td></tr>';
  } catch (error) {
    body.innerHTML = '<tr><td colspan="4" style="text-align:center;">' + escapeAccountHtml(error.message) + '</td></tr>';
  }
}

function closePayrollHistoryDetails() {
  const panel = document.getElementById('payrollHistoryDetails');
  if (panel) panel.classList.remove('show');
}

async function issueAdminPayroll() {
  const now = new Date();
  const currentPeriod = latestClosedPayrollPeriod(now);
  const period = document.getElementById('payrollPeriod').value || currentPeriod;
  if (!payrollCutoffReached(period)) {
    showAdminAlert('Payroll Not Ready', 'You cannot process ' + payrollPeriodLabel(period) + ' yet. Cutoff date is ' + payrollCutoffDateLabel(period) + '.', false);
    return;
  }
  try {
    const body = new URLSearchParams({ action: 'issue', period });
    const response = await fetch('../php/payroll.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to process payroll.');
    await loadAdminPayroll();
    showAdminAlert('Payroll Issued', result.message, true);
  } catch (error) {
    showAdminAlert('Payroll Not Issued', error.message, false);
  }
}

function viewAdminPayslip(employeeId) {
  const row = adminPayrollRecords.find(item => Number(item.employee_id) === Number(employeeId));
  if (!row) return showAdminAlert('Payslip Not Found', 'Unable to find this payroll record.', false);
  const detailRows = items => items.map(item =>
    '<div class="admin-payslip-line"><span>' + item[0] + '</span><strong>' + payrollMoney(item[1]) + '</strong></div>'
  ).join('');
  document.getElementById('adminPayslipName').textContent = row.full_name;
  document.getElementById('adminPayslipPeriod').textContent = payrollPeriodLabel(row.period);
  document.getElementById('adminPayslipNet').textContent = payrollMoney(row.net_pay);
  document.getElementById('adminPayslipGross').textContent = payrollMoney(row.gross_pay);
  document.getElementById('adminPayslipTotalDeductions').textContent = payrollMoney(row.total_deductions);
  document.getElementById('adminPayslipEarnings').innerHTML = detailRows([
    ['Basic Pay', row.basic_pay],
    ['Rice Allowance', row.rice_allowance],
    ['Transportation', row.transport_allowance],
    ['Overtime Pay', row.overtime_pay]
  ]);
  document.getElementById('adminPayslipDeductions').innerHTML = detailRows([
    ['SSS', row.sss],
    ['PhilHealth', row.philhealth],
    ['Pag-IBIG', row.pagibig],
    ['Withholding Tax', row.withholding_tax],
    ['Absence', row.absence_deduction],
    ['Unpaid Leave', row.unpaid_leave_deduction],
    ['Late', row.late_deduction]
  ]);
  document.getElementById('adminPayslipWorkingDays').textContent = Number(row.working_days || 0);
  document.getElementById('adminPayslipDaysPresent').textContent = Number(row.days_present || 0);
  document.getElementById('adminPayslipLateCount').textContent = Number(row.late_count || 0);
  const issued = row.status === 'issued';
  const status = document.getElementById('adminPayslipStatus');
  status.textContent = issued ? 'Issued' : 'Pending';
  status.className = 'admin-payslip-status ' + (issued ? 'issued' : 'pending');
  document.getElementById('adminPayslipCopy').innerHTML = '<i class="fas ' + (issued ? 'fa-circle-check' : 'fa-circle-info') + '"></i> ' +
    (issued ? 'Employee copy is available in the Employee Portal.' : 'Issue payroll first to publish the employee copy.');
  document.getElementById('adminPayslipModal').classList.add('show');
}

function closeAdminPayslip() {
  document.getElementById('adminPayslipModal').classList.remove('show');
}

document.getElementById('payrollSearch')?.addEventListener('keyup', filterAdminPayroll);
document.getElementById('payrollDept')?.addEventListener('change', filterAdminPayroll);
document.getElementById('payrollStatus')?.addEventListener('change', filterAdminPayroll);
document.getElementById('payrollPeriod')?.addEventListener('change', function() {
  updatePayrollProcessState();
  loadAdminPayroll();
});
loadAdminPayroll();

function restoreVisibleAdminPage() {
  const params = new URLSearchParams(window.location.search);
  const requestedPage = params.get('page');
  const activeNav = document.querySelector('.nav-item.active[data-page]');
  forceAdminPage(requestedPage || activeNav?.dataset.page || 'dashboard');
}

window.addEventListener('load', () => {
  restoreVisibleAdminPage();
  setTimeout(restoreVisibleAdminPage, 100);
  setTimeout(restoreVisibleAdminPage, 500);
});

// ============================================
// LEAVE SEARCH & FILTER
// ============================================
document.getElementById('leaveSearch')?.addEventListener('keyup', function() {
  renderAdminLeaves();
});
document.getElementById('leaveFilterType')?.addEventListener('change', renderAdminLeaves);
document.getElementById('leaveFilterDept')?.addEventListener('change', renderAdminLeaves);
loadAdminLeaves();

// Load applicants sent from HR
loadSentToAdmin();

// Applicant Details Modal (sent from HR) - direct child of body
// ============================================
// Database-backed applicants forwarded by HR.
let adminHiredApplicants = [];
let adminFaceEnrolled = false;
let existingFaceEmployeeId = null;
let existingFaceResult = null;

function openExistingFaceEnrollment(employeeId) {
  const employee = adminEmployees.find(item => Number(item.id) === Number(employeeId));
  if (!employee) return;
  existingFaceEmployeeId = Number(employeeId);
  existingFaceResult = null;
  document.getElementById('adminExistingFaceName').textContent = (Number(employee.face_enrolled) ? 'Replace the registered face for ' : 'Register a face for ') + employee.full_name;
  document.getElementById('adminExistingFacePlaceholder').style.display = 'flex';
  document.getElementById('adminExistingFaceStatus').className = 'face-enrollment-status';
  document.getElementById('adminExistingFaceStatus').innerHTML = '<i class="fas fa-circle-info"></i> Ask the employee to look straight, then turn their head to the right.';
  document.getElementById('adminExistingFaceSave').disabled = true;
  document.getElementById('adminExistingFaceStart').disabled = false;
  document.getElementById('adminExistingFaceModal').classList.add('show');
}

function closeExistingFaceEnrollment() {
  FaceVerification.stop();
  existingFaceEmployeeId = null;
  existingFaceResult = null;
  document.getElementById('adminExistingFaceVideo').srcObject = null;
  document.getElementById('adminExistingFaceModal').classList.remove('show');
}

async function startExistingFaceEnrollment() {
  const video = document.getElementById('adminExistingFaceVideo');
  const status = document.getElementById('adminExistingFaceStatus');
  const startButton = document.getElementById('adminExistingFaceStart');
  startButton.disabled = true;
  try {
    await FaceVerification.start(video);
    document.getElementById('adminExistingFacePlaceholder').style.display = 'none';
    existingFaceResult = await FaceVerification.verifyHeadTurn(video, message => {
      status.innerHTML = '<i class="fas fa-arrows-left-right"></i> ' + escapeAccountHtml(message);
    });
    status.className = 'face-enrollment-status is-verified';
    status.innerHTML = '<i class="fas fa-circle-check"></i> Face and head movement verified. Save this profile.';
    document.getElementById('adminExistingFaceSave').disabled = false;
  } catch (error) {
    status.className = 'face-enrollment-status is-error';
    status.innerHTML = '<i class="fas fa-triangle-exclamation"></i> ' + escapeAccountHtml(error.message);
    startButton.disabled = false;
  } finally {
    FaceVerification.stop();
  }
}

async function saveExistingFaceEnrollment() {
  if (!existingFaceEmployeeId || !existingFaceResult) return;
  const saveButton = document.getElementById('adminExistingFaceSave');
  saveButton.disabled = true;
  const body = new FormData();
  body.set('action', 'enroll_face');
  body.set('employee_id', existingFaceEmployeeId);
  body.set('face_descriptor', JSON.stringify(existingFaceResult.descriptor));
  body.set('face_photo', existingFaceResult.photo);
  body.set('liveness_verified', '1');
  try {
    const response = await fetch('../php/accounts.php', { method: 'POST', body });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to save face profile.');
    closeExistingFaceEnrollment();
    await loadEmployees();
    showAdminAlert('Face Profile Saved', result.message, true);
  } catch (error) {
    saveButton.disabled = false;
    showAdminAlert('Face Not Saved', error.message, false);
  }
}

function resetAdminFaceEnrollment() {
  FaceVerification.stop();
  adminFaceEnrolled = false;
  document.getElementById('adminFaceDescriptor').value = '';
  document.getElementById('adminFacePhoto').value = '';
  document.getElementById('adminLivenessVerified').value = '';
  document.getElementById('adminFaceVideo').srcObject = null;
  document.getElementById('adminFacePlaceholder').style.display = 'flex';
  document.getElementById('adminFaceStatus').className = 'face-enrollment-status';
  document.getElementById('adminFaceStatus').innerHTML = '<i class="fas fa-circle-info"></i> Face registration is required.';
  document.getElementById('adminFaceEnrollBtn').innerHTML = '<i class="fas fa-camera"></i> Start Face Verification';
  document.getElementById('adminFaceEnrollBtn').disabled = false;
}

async function startAdminFaceEnrollment() {
  const video = document.getElementById('adminFaceVideo');
  const placeholder = document.getElementById('adminFacePlaceholder');
  const status = document.getElementById('adminFaceStatus');
  const button = document.getElementById('adminFaceEnrollBtn');
  button.disabled = true;
  status.className = 'face-enrollment-status is-working';
  status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading secure face verification...';
  try {
    await FaceVerification.start(video);
    placeholder.style.display = 'none';
    const result = await FaceVerification.verifyHeadTurn(video, message => {
      status.innerHTML = '<i class="fas fa-arrows-left-right"></i> ' + escapeHtml(message);
    });
    document.getElementById('adminFaceDescriptor').value = JSON.stringify(result.descriptor);
    document.getElementById('adminFacePhoto').value = result.photo;
    document.getElementById('adminLivenessVerified').value = '1';
    adminFaceEnrolled = true;
    status.className = 'face-enrollment-status is-verified';
    status.innerHTML = '<i class="fas fa-circle-check"></i> Head movement and employee face successfully verified.';
    button.innerHTML = '<i class="fas fa-rotate"></i> Retake Face';
  } catch (error) {
    if (!String(error.message).includes('cancelled')) {
      status.className = 'face-enrollment-status is-error';
      status.innerHTML = '<i class="fas fa-triangle-exclamation"></i> ' + escapeHtml(error.message);
    }
  } finally {
    FaceVerification.stop();
    button.disabled = false;
  }
}

async function openAdminCreateEmployee(applicantIndex = null) {
  const form = document.getElementById('adminCreateEmployeeForm');
  const selectedPosition = document.getElementById('adminCreatePosition');
  let requestedPosition = '';
  if (applicantIndex !== null && adminHiredApplicants[applicantIndex]) {
    const app = adminHiredApplicants[applicantIndex];
    const fullName = [app.first_name, app.middle_name, app.last_name].filter(Boolean).join(' ');
    form.applicant_id.value = app.id;
    form.full_name.value = fullName;
    form.email.value = app.email || '';
    form.contact_no.value = app.contact_no || '';
    form.username.value = (app.email || fullName).split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
    requestedPosition = normalizePositionValue(app.position);
  } else {
    form.reset();
    form.applicant_id.value = '';
  }
  const positions = await loadAdminPositionAvailability();
  if (requestedPosition) {
    selectedPosition.value = requestedPosition;
  }
  if (requestedPosition && selectedPosition.selectedOptions[0]?.disabled) {
    const label = positionDisplayName(requestedPosition);
    showAdminAlert('Position Not Available', label + ' is already full. Set an existing employee to Not Active/Resigned first, then create this account.', false);
    selectedPosition.value = '';
  }
  if (positions && !selectedPosition.value) {
    const firstAvailable = Array.from(selectedPosition.options).find(option => option.value && !option.disabled);
    selectedPosition.value = firstAvailable ? firstAvailable.value : '';
  }
  resetAdminFaceEnrollment();
  document.getElementById('adminCreateEmployeeModal').classList.add('show');
}
function closeAdminCreateEmployee() {
  FaceVerification.stop();
  document.getElementById('adminCreateEmployeeModal').classList.remove('show');
}
document.getElementById('adminCreateEmployeeForm')?.addEventListener('submit', async function (event) {
  event.preventDefault();
  const contact = this.contact_no.value.trim();
  const selectedPosition = document.getElementById('adminCreatePosition');
  if (!/^\d{11}$/.test(contact)) {
    showAdminAlert('Invalid Contact Number', 'Contact number must be exactly 11 digits.', false);
    return;
  }
  if (!selectedPosition.value || selectedPosition.selectedOptions[0]?.disabled) {
    showAdminAlert('Position Not Available', 'Selected position is already full. Set an existing employee to Not Active/Resigned before creating another account.', false);
    return;
  }
  if (!adminFaceEnrolled || !this.face_descriptor.value || !this.face_photo.value) {
    showAdminAlert('Face Verification Required', 'Take the employee’s live photo and complete the head-turn verification before creating the account.', false);
    return;
  }
  try {
    const response = await fetch('../php/create_employee.php', { method: 'POST', body: new FormData(this) });
    const result = await response.json();
    if (result.success) {
      this.reset();
      closeAdminCreateEmployee();
      loadEmployees();
      loadHiredApplicantsForAccounts();
      loadAdminDashboard();
      showAdminAlert('Account Created', result.message, true);
    } else {
      showAdminAlert('Account Not Created', result.message, false);
    }
  } catch (error) { showAdminAlert('Account Not Created', 'Unable to create the employee account.', false); }
});

async function loadHiredApplicantsForAccounts() {
  const tbody = document.getElementById('hiredApplicantsBody');
  const count = document.getElementById('hiredApplicantCount');
  if (!tbody || !count) return;
  try {
    const response = await fetch('../php/applicants.php?action=list&view=admin');
    if (response.status === 401 || response.status === 403) {
      showAdminAlert('Admin Session Required', 'Please sign in again using an Administrator PIN to manage hired applicants.', false);
      setTimeout(() => { window.location.href = 'Login.html'; }, 1800);
      return;
    }
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    adminHiredApplicants = result.applicants || [];
    count.textContent = adminHiredApplicants.length + ' ready';
    if (!adminHiredApplicants.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hired employees require a POS account.</td></tr>';
      return;
    }
    tbody.innerHTML = adminHiredApplicants.map((app, index) => {
      const name = [app.first_name, app.middle_name, app.last_name].filter(Boolean).join(' ');
      return '<tr>' +
        '<td><div class="emp-cell"><div class="emp-avatar"><i class="fas fa-user-check"></i></div><div><span class="emp-name">' + escapeAccountHtml(name) + '</span><span class="emp-email">' + escapeAccountHtml(app.email) + '</span></div></div></td>' +
        '<td>' + escapeAccountHtml(app.position) + '</td>' +
        '<td><span class="status-badge status-approved">Full HRMS Access</span></td>' +
        '<td>' + new Date(app.created_at).toLocaleDateString() + '</td>' +
        '<td><button class="btn btn-sm btn-gold" onclick="completePosAccount(' + index + ')"><i class="fas fa-cash-register"></i> Mark POS Created</button></td>' +
      '</tr>';
    }).join('');
  } catch (error) {
    count.textContent = 'Unavailable';
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Unable to load hired applicants.</td></tr>';
  }
}

async function completePosAccount(index) {
  const app = adminHiredApplicants[index];
  if (!app || !confirm('Confirm that the POS account has been created for this employee?')) return;
  try {
    const response = await fetch('../php/applicants.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ action: 'complete_pos_account', id: String(app.id) }) });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to record POS account creation.');
    showAdminAlert('POS Account Recorded', result.message, true);
    loadHiredApplicantsForAccounts();
  } catch (error) { showAdminAlert('POS Account Not Recorded', error.message, false); }
}

async function loadSentToAdmin() {
  const tbody = document.querySelector('#applicantsTable tbody');
  if (!tbody) return;
  try {
    const response = await fetch('../php/applicants.php?action=list&view=admin');
    if (response.status === 401 || response.status === 403) {
      showAdminAlert('Admin Session Required', 'Please sign in again using an Administrator PIN to view applicants.', false);
      setTimeout(() => { window.location.href = 'Login.html'; }, 1800);
      return;
    }
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    adminSentApplicants = result.applicants;
    tbody.innerHTML = '';
    if (!adminSentApplicants.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No applicants are waiting for Admin approval.</td></tr>';
      return;
    }
    adminSentApplicants.forEach((app, index) => {
      const name = [app.first_name, app.middle_name, app.last_name].filter(Boolean).join(' ');
      const status = app.status === 'admin_approved' ? 'Interview Scheduled' : app.status === 'interview_passed' ? 'Interview Passed' : app.status === 'interview_failed' ? 'Interview Not Passed' : app.status === 'admin_rejected' ? 'Rejected' : 'Pending Admin Approval';
      const statusClass = (app.status === 'admin_approved' || app.status === 'interview_passed') ? 'status-approved' : (app.status === 'admin_rejected' || app.status === 'interview_failed') ? 'status-rejected' : 'status-pending';
      const row = document.createElement('tr');
      row.dataset.status = (app.status === 'admin_approved' || app.status === 'interview_passed') ? 'approved' : (app.status === 'admin_rejected' || app.status === 'interview_failed') ? 'rejected' : 'pending';
      row.innerHTML = '<td><div class="emp-cell"><div class="emp-avatar"><i class="fas fa-user"></i></div><div><span class="emp-name">' + escapeHtml(name) + '</span><span class="emp-email">' + escapeHtml(app.email) + '</span></div></div></td>' +
        '<td>' + escapeHtml(app.position) + '</td><td>' + escapeHtml(app.years_experience) + '</td><td>' + new Date(app.created_at).toLocaleDateString() + '</td>' +
        '<td><span class="status-badge ' + statusClass + '">' + status + '</span></td><td><div class="action-btns">' +
        '<button class="action-btn action-btn-view" onclick="viewDatabaseApplicant(' + index + ')" title="View"><i class="fas fa-eye"></i></button>' +
        (app.status === 'hr_qualified' ? '<button class="action-btn action-btn-approve" onclick="approveDatabaseApplicant(' + index + ')" title="Schedule interview and send email"><i class="fas fa-calendar-check"></i></button><button class="action-btn action-btn-reject" onclick="rejectDatabaseApplicant(' + index + ')" title="Reject"><i class="fas fa-times"></i></button>' : '') +
        (app.status === 'admin_approved' ? '<button class="action-btn action-btn-approve" onclick="saveInterviewResult(' + index + ', true)" title="Yes - applicant passed the interview"><i class="fas fa-thumbs-up"></i></button><button class="action-btn action-btn-reject" onclick="saveInterviewResult(' + index + ', false)" title="No - applicant did not pass the interview"><i class="fas fa-thumbs-down"></i></button>' : '') +
        '</div></td>';
      tbody.appendChild(row);
    });
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Unable to load applicants from the database.</td></tr>';
  }
}

function viewDatabaseApplicant(index) {
  const app = adminSentApplicants[index];
  if (!app) return;
  const name = [app.first_name, app.middle_name, app.last_name].filter(Boolean).join(' ');
  document.getElementById('applicantViewName').textContent = name;
  document.getElementById('applicantViewEmail').textContent = app.email;
  document.getElementById('applicantViewPosition').textContent = app.position;
  document.getElementById('applicantViewDate').textContent = new Date(app.created_at).toLocaleDateString();
  const resume = app.resume_path
    ? '<a class="btn btn-sm btn-gold" href="../' + encodeURI(app.resume_path) + '" target="_blank"><i class="fas fa-file-pdf"></i> Open Resume</a>'
    : '<span style="color:rgba(230, 214, 194,0.45);">No resume file was uploaded.</span>';
  document.getElementById('applicantViewDetails').innerHTML = '<div class="detail-row"><span class="detail-label">Application ID</span><span class="detail-value">' + escapeHtml(app.application_code) + '</span></div><div class="detail-row"><span class="detail-label">Experience</span><span class="detail-value">' + escapeHtml(app.years_experience) + '</span></div><div class="detail-row"><span class="detail-label">Resume</span><span class="detail-value">' + resume + '</span></div>';
  document.getElementById('applicantViewModal').classList.add('show');
}

async function approveDatabaseApplicant(index) {
  const app = adminSentApplicants[index];
  const date = prompt('Enter the initial interview date (YYYY-MM-DD):', new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  if (!date) { alert('Interview scheduling was not completed. Please provide a date.'); return; }
  const time = prompt('Enter the initial interview time (24-hour format, HH:MM):', '10:00');
  if (!time) { alert('Interview scheduling was not completed. Please provide a time.'); return; }
  const location = prompt('Enter the interview venue or video-call link:', 'Quadra Cafe');
  if (!location) { alert('Interview scheduling was not completed. Please provide a venue or meeting link.'); return; }
  if (!confirm('Send the interview invitation to ' + app.email + '?\n\nDate: ' + date + '\nTime: ' + time + '\nVenue / link: ' + location)) return;
  await saveAdminDecision(app.id, 'approve', date, time, location);
}

async function saveInterviewResult(index, passed) {
  const app = adminSentApplicants[index];
  const name = [app.first_name, app.middle_name, app.last_name].filter(Boolean).join(' ');
  try {
    const body = new URLSearchParams({ action: 'interview_result', id: app.id, result: passed ? 'passed' : 'failed' });
    const response = await fetch('../php/applicants.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body });
    const result = await response.json();
    alert(result.success ? (passed ? name + ' was marked as PASSED.' : name + ' was marked as NOT PASSED.') : result.message);
    if (result.success) loadSentToAdmin();
  } catch (error) {
    alert('The interview result could not be saved. Please check your connection and try again.');
  }
}

async function rejectDatabaseApplicant(index) {
  const app = adminSentApplicants[index];
  if (confirm('Reject this applicant?')) await saveAdminDecision(app.id, 'reject', '', '', '');
}

async function saveAdminDecision(id, decision, date, time, location) {
  try {
    const body = new URLSearchParams({ action: 'admin_decision', id: id, decision: decision, interview_date: date, interview_time: time, interview_location: location });
    const response = await fetch('../php/applicants.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body });
    const result = await response.json();
    alert(result.message);
    if (result.success) loadSentToAdmin();
  } catch (error) { alert('Unable to save the Admin decision.'); }
}

function adminToday() {
  return new Date().toLocaleDateString('en-CA');
}

function dashboardDate(value) {
  const date = new Date(String(value || '').replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? null : date;
}

function dashboardTimeAgo(value) {
  const date = dashboardDate(value);
  if (!date) return '';
  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + ' min ago';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + ' hour' + (hours === 1 ? '' : 's') + ' ago';
  const days = Math.floor(hours / 24);
  return days + ' day' + (days === 1 ? '' : 's') + ' ago';
}

function dashboardLeaveActiveToday(request) {
  if (request.status !== 'approved') return false;
  const today = adminToday();
  return request.start_date <= today && request.end_date >= today;
}

function dashboardEmployeeRows(accounts) {
  return accounts.filter(account => {
    const position = String(account.position || '').toLowerCase();
    return ['approved', 'inactive'].includes(account.status) &&
      position !== 'administrator' &&
      !position.includes('hr') &&
      position !== 'human resources';
  });
}

function renderAdminDepartmentSummary(employees, attendanceRecords, leaveRequests) {
  const tbody = document.getElementById('adminDepartmentSummary');
  const groups = {};
  employees.forEach(employee => {
    const dept = employeeDepartmentValue(employee);
    if (!groups[dept]) groups[dept] = { total: 0, active: 0, present: 0, leave: 0 };
    groups[dept].total++;
    if (employee.status === 'approved') groups[dept].active++;
  });

  attendanceRecords.forEach(record => {
    const dept = employeeDepartmentValue(record);
    if (!groups[dept]) groups[dept] = { total: 0, active: 0, present: 0, leave: 0 };
    if (record.clock_in) groups[dept].present++;
  });

  leaveRequests.filter(dashboardLeaveActiveToday).forEach(request => {
    const dept = employeeDepartmentValue(request);
    if (!groups[dept]) groups[dept] = { total: 0, active: 0, present: 0, leave: 0 };
    groups[dept].leave++;
  });

  const rows = Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  tbody.innerHTML = rows.length ? rows.map(([dept, data]) => {
    const rate = data.active ? Math.round((data.present / data.active) * 1000) / 10 : 0;
    const badge = rate >= 80 ? 'status-ontime' : (rate >= 50 ? 'status-pending' : 'status-late');
    return '<tr><td>' + escapeAccountHtml(dept) + '</td><td>' + data.total + '</td><td>' + data.present + '</td><td>' + data.leave + '</td><td><span class="status-badge ' + badge + '">' + rate + '%</span></td></tr>';
  }).join('') : '<tr><td colspan="5" style="text-align:center;">No employee records in the database yet.</td></tr>';
}

function renderAdminUpcomingEvents(applicants, leaveRequests) {
  const list = document.getElementById('adminUpcomingEvents');
  const today = adminToday();
  const items = [];

  applicants.forEach(app => {
    if (!app.interview_date || !['initial_interview_scheduled', 'final_interview_scheduled'].includes(app.status)) return;
    if (app.interview_date < today) return;
    const name = [app.first_name, app.middle_name, app.last_name].filter(Boolean).join(' ');
    items.push({
      date: app.interview_date,
      time: app.interview_time || '',
      title: (app.status === 'final_interview_scheduled' ? 'Final' : 'Initial') + ' Interview',
      desc: name + ' - ' + app.position,
      icon: 'fa-calendar-check'
    });
  });

  leaveRequests.forEach(request => {
    if (request.status !== 'pending' || request.start_date < today) return;
    items.push({
      date: request.start_date,
      time: '',
      title: 'Pending Leave Request',
      desc: request.full_name + ' - ' + adminLeaveType(request.leave_type),
      icon: 'fa-calendar-alt'
    });
  });

  applicants.filter(app => ['final_interview_passed', 'hired'].includes(app.status) && !app.employee_id).forEach(app => {
    const name = [app.first_name, app.middle_name, app.last_name].filter(Boolean).join(' ');
    items.push({
      date: (app.created_at || today).slice(0, 10),
      time: '',
      title: 'Create Employee Account',
      desc: name + ' passed final interview',
      icon: 'fa-user-plus'
    });
  });

  items.sort((a, b) => (a.date + ' ' + a.time).localeCompare(b.date + ' ' + b.time));
  list.innerHTML = items.slice(0, 5).map(item => {
    const date = new Date(item.date + 'T00:00:00');
    return '<div class="event-item"><div class="event-date-box"><span class="event-date-num">' + date.getDate() + '</span><span class="event-date-month">' + date.toLocaleDateString('en-US', { month: 'short' }) + '</span></div><div class="event-info"><span class="event-title">' + escapeAccountHtml(item.title) + '</span><span class="event-desc">' + escapeAccountHtml(item.desc) + '</span><span class="event-time"><i class="fas ' + item.icon + '"></i> ' + escapeAccountHtml(item.time ? item.time.slice(0, 5) : 'Needs attention') + '</span></div></div>';
  }).join('') || '<div class="event-item"><div class="event-info"><span class="event-title">No upcoming database events</span><span class="event-desc">Scheduled interviews and pending leave requests will appear here.</span></div></div>';
}

function renderAdminNotifications(applicants, leaveRequests, employees, attendanceActivities) {
  const list = document.getElementById('adminNotifList');
  const badge = document.getElementById('adminNotifBadge');
  const notifications = [];

  applicants.filter(app => ['final_interview_passed', 'hired'].includes(app.status) && !app.employee_id).forEach(app => {
    const name = [app.first_name, app.middle_name, app.last_name].filter(Boolean).join(' ');
    notifications.push({ icon: 'fa-user-plus', color: 'notif-icon-green', text: name + ' is ready for employee account creation.', time: app.created_at || '' });
  });

  leaveRequests.filter(request => request.status === 'pending').forEach(request => {
    notifications.push({ icon: 'fa-calendar-alt', color: 'notif-icon-gold', text: 'Pending leave request from ' + request.full_name + '.', time: request.created_at || '' });
  });

  employees.filter(employee => employee.status === 'inactive').forEach(employee => {
    notifications.push({ icon: 'fa-user-slash', color: 'notif-icon-red', text: employee.full_name + ' is marked Not Active / Resigned.', time: employee.created_at || '' });
  });

  attendanceActivities.forEach(item => {
    const late = item.type === 'late_clock_in';
    const out = item.type === 'clock_out';
    notifications.push({
      icon: out ? 'fa-clock' : (late ? 'fa-exclamation-circle' : 'fa-check-circle'),
      color: late ? 'notif-icon-red' : 'notif-icon-blue',
      text: item.employee + (out ? ' timed out.' : (late ? ' timed in late.' : ' timed in.')),
      time: item.occurred_at || ''
    });
  });

  notifications.sort((a, b) => String(b.time || '').localeCompare(String(a.time || '')));
  const visible = notifications.slice(0, 8);
  badge.textContent = String(visible.length);
  list.innerHTML = visible.length ? visible.map(item =>
    '<div class="notif-item notif-unread"><div class="notif-icon ' + item.color + '"><i class="fas ' + item.icon + '"></i></div><div class="notif-content"><p class="notif-text">' + escapeAccountHtml(item.text) + '</p><span class="notif-time">' + escapeAccountHtml(dashboardTimeAgo(item.time)) + '</span></div></div>'
  ).join('') : '<div class="notif-item"><div class="notif-content"><p class="notif-text">No current database notifications.</p></div></div>';
}

async function loadAdminDashboard() {
  try {
    const today = adminToday();
    const [accountsResponse, applicantsResponse, attendanceResponse, leaveResponse] = await Promise.all([
      fetch('../php/accounts.php?action=list', { cache: 'no-store' }),
      fetch('../php/applicants.php?action=list&view=hr', { cache: 'no-store' }),
      fetch('../php/attendance.php?action=admin&date=' + encodeURIComponent(today), { cache: 'no-store' }),
      fetch('../php/leave_requests.php?action=admin', { cache: 'no-store' })
    ]);

    const [accountsData, applicantsData, attendanceData, leaveData] = await Promise.all([
      accountsResponse.json(), applicantsResponse.json(), attendanceResponse.json(), leaveResponse.json()
    ]);
    if (!accountsData.success || !applicantsData.success || !attendanceData.success || !leaveData.success) {
      throw new Error('One or more dashboard sources could not be loaded.');
    }

    const employees = dashboardEmployeeRows(accountsData.accounts || []);
    const applicants = applicantsData.applicants || [];
    const leaveRequests = leaveData.requests || [];
    const attendanceRecords = attendanceData.records || [];
    const readyApplicants = applicants.filter(app => ['final_interview_passed', 'hired'].includes(app.status) && !app.employee_id);
    const onLeaveToday = leaveRequests.filter(dashboardLeaveActiveToday);

    document.getElementById('totalEmployees').textContent = employees.length;
    document.getElementById('presentToday').textContent = attendanceData.stats?.present || 0;
    document.getElementById('onLeave').textContent = onLeaveToday.length;
    document.getElementById('pendingApplicants').textContent = readyApplicants.length;

    renderAdminDepartmentSummary(employees, attendanceRecords, leaveRequests);
    renderAdminUpcomingEvents(applicants, leaveRequests);
    renderAdminNotifications(applicants, leaveRequests, employees, attendanceData.activities || []);
    renderAdminAttendanceActivity(attendanceData.activities || []);
  } catch (error) {
    document.getElementById('adminDepartmentSummary').innerHTML = '<tr><td colspan="5" style="text-align:center;">Dashboard data could not be loaded.</td></tr>';
    document.getElementById('adminUpcomingEvents').innerHTML = '<div class="event-item"><div class="event-info"><span class="event-title">Dashboard data unavailable</span><span class="event-desc">Please refresh the page after checking Apache and MySQL.</span></div></div>';
    document.getElementById('adminNotifList').innerHTML = '<div class="notif-item"><div class="notif-content"><p class="notif-text">Notifications could not be loaded.</p></div></div>';
    document.getElementById('adminNotifBadge').textContent = '0';
  }
}

loadAdminDashboard();
setInterval(loadAdminDashboard, 10000);

