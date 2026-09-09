









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






window.openContractRequiredModal = function () {
  var modal = document.getElementById('contractRequiredModal');
  if (!modal) return;
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
};
window.closeContractRequiredModal = function () {
  var modal = document.getElementById('contractRequiredModal');
  if (modal) modal.classList.remove('show');
  document.body.style.overflow = '';
};







let currentEmployeeProfile = null;
let employeeAttendanceState = null;
let attendanceLoadedAt = Date.now();
let attendanceProofAction = null;
let attendanceProofStream = null;
let attendanceProofPosition = null;
let attendanceFaceResult = null;

function escapeEmployeeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[character]);
}

function inferEmployeeDepartment(position) {
  const value = (position || '').toLowerCase();
  if (value.includes('cook') || value.includes('chef') || value.includes('kitchen')) return 'Kitchen';
  if (value.includes('manager') || value.includes('supervisor')) return 'Management';
  if (value.includes('finance') || value.includes('admin')) return 'Admin & Finance';
  if (value.includes('maintenance')) return 'Maintenance';
  return 'Operations';
}

function employeeFirstName(fullName) {
  return (fullName || 'Employee').trim().split(/\s+/)[0];
}

function applyEmployeeProfile(user) {
  currentEmployeeProfile = user;
  const name = user.full_name || 'Employee';
  const role = user.position || 'Employee';
  const dept = inferEmployeeDepartment(role);
  document.getElementById('empSideName').textContent = name;
  document.getElementById('empSideRole').textContent = role;
  document.getElementById('dashGreeting').textContent = 'Hi, ' + employeeFirstName(name) + '!';
  const leaveName = document.getElementById('leaveEmpName');
  if (leaveName) leaveName.value = name;
  const leaveDept = document.getElementById('leaveDept');
  if (leaveDept) leaveDept.value = dept;
  const leaveContact = document.getElementById('leaveContact');
  if (leaveContact) leaveContact.value = user.contact_no || '';
  document.getElementById('payslipEmpName').textContent = name;
  document.getElementById('payslipEmpRole').textContent = role;
  document.getElementById('payslipEmpDept').textContent = dept;
  document.getElementById('payslipEmpId').textContent = 'EMP-' + String(user.id).padStart(4, '0');
  document.getElementById('profileFullName').value = name;
  document.getElementById('profileEmail').value = user.email || '';
  document.getElementById('profileContact').value = user.contact_no || '';
  document.getElementById('profilePosition').value = role;
}

let employeePayslipRecords = [];

function employeeMoney(value) {
  return '₱' + Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function employeePayslipPeriod(period) {
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

function renderEmployeePayslip(record) {
  document.getElementById('payslipPeriodTitle').textContent = employeePayslipPeriod(record.period);
  document.getElementById('payslipBasicSummary').textContent = employeeMoney(record.basic_pay);
  document.getElementById('payslipAllowanceSummary').textContent = employeeMoney(Number(record.rice_allowance) + Number(record.transport_allowance) + Number(record.overtime_pay));
  document.getElementById('payslipDeductionSummary').textContent = employeeMoney(record.total_deductions);
  document.getElementById('payslipBasicPay').textContent = employeeMoney(record.basic_pay);
  document.getElementById('payslipRice').textContent = employeeMoney(record.rice_allowance);
  document.getElementById('payslipTransport').textContent = employeeMoney(record.transport_allowance);
  document.getElementById('payslipOvertime').textContent = employeeMoney(record.overtime_pay);
  document.getElementById('payslipGross').textContent = employeeMoney(record.gross_pay);
  document.getElementById('payslipSss').textContent = employeeMoney(record.sss);
  document.getElementById('payslipPhilhealth').textContent = employeeMoney(record.philhealth);
  document.getElementById('payslipPagibig').textContent = employeeMoney(record.pagibig);
  document.getElementById('payslipTax').textContent = employeeMoney(record.withholding_tax);
  document.getElementById('payslipAbsences').textContent = employeeMoney(record.absence_deduction);
  document.getElementById('payslipUnpaidLeave').textContent = employeeMoney(record.unpaid_leave_deduction);
  document.getElementById('payslipLates').textContent = employeeMoney(record.late_deduction);
  document.getElementById('payslipTotalDeductions').textContent = employeeMoney(record.total_deductions);
  document.getElementById('payslipNet').textContent = employeeMoney(record.net_pay);
  document.getElementById('printPayslipBtn').disabled = false;
  document.getElementById('printPayslipBtn').title = 'Print this payslip copy';
}

function clearEmployeePayslip() {
  document.getElementById('payslipPeriodTitle').textContent = 'No payslip issued';
  document.getElementById('payslipBasicSummary').textContent = employeeMoney(0);
  document.getElementById('payslipAllowanceSummary').textContent = employeeMoney(0);
  document.getElementById('payslipDeductionSummary').textContent = employeeMoney(0);
  ['payslipBasicPay', 'payslipRice', 'payslipTransport', 'payslipOvertime', 'payslipGross', 'payslipSss', 'payslipPhilhealth', 'payslipPagibig', 'payslipTax', 'payslipAbsences', 'payslipUnpaidLeave', 'payslipLates', 'payslipTotalDeductions', 'payslipNet'].forEach(id => {
    document.getElementById(id).textContent = employeeMoney(0);
  });
  document.getElementById('printPayslipBtn').disabled = true;
  document.getElementById('printPayslipBtn').title = 'Payslip can be printed only after Admin processes payroll on or after cutoff.';
}

function renderEmployeePayslipHistory() {
  const body = document.getElementById('employeePayslipHistory');
  if (!body) return;
  body.innerHTML = employeePayslipRecords.length ? employeePayslipRecords.map((record, index) =>
    '<article class="payslip-history-card"><div class="payslip-history-head"><div><h4>' + employeePayslipPeriod(record.period) + '</h4><span>Issued payslip</span></div><span class="payslip-history-status">Issued</span></div>' +
    '<div class="payslip-history-values"><div><span>Gross Pay</span><strong>' + employeeMoney(record.gross_pay) + '</strong></div><div><span>Deductions</span><strong>' + employeeMoney(record.total_deductions) + '</strong></div></div>' +
    '<div class="payslip-history-footer"><div><span>NET PAY</span><strong>' + employeeMoney(record.net_pay) + '</strong></div><button onclick="selectEmployeePayslip(' + index + ')"><i class="fas fa-eye"></i> View Payslip</button></div></article>'
  ).join('') : '<div class="payslip-history-empty"><i class="fas fa-file-invoice-dollar"></i><span>No payslip issued yet.</span></div>';
}

function selectEmployeePayslip(index) {
  const record = employeePayslipRecords[index];
  if (!record) return;
  document.getElementById('payslipPeriod').value = String(index);
  renderEmployeePayslip(record);
  document.getElementById('page-payslip')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadEmployeePayslips(showEmptyAlert = false) {
  if (document.documentElement.dataset.accessLevel === 'limited') return;
  try {
    const response = await fetch('../php/payroll.php?action=mine', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load payslips.');
    employeePayslipRecords = result.records || [];
    const select = document.getElementById('payslipPeriod');
    select.innerHTML = '';
    if (!employeePayslipRecords.length) {
      select.innerHTML = '<option>No payslip issued</option>';
      clearEmployeePayslip();
      renderEmployeePayslipHistory();
      if (showEmptyAlert) showEmployeeAlert('No Payslip Yet', 'Your payslip copy will appear here after Admin processes payroll.', false);
      return;
    }
    employeePayslipRecords.forEach((record, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = employeePayslipPeriod(record.period);
      select.appendChild(option);
    });
    renderEmployeePayslip(employeePayslipRecords[0]);
    renderEmployeePayslipHistory();
  } catch (error) {
    if (showEmptyAlert) showEmployeeAlert('Payslip Not Loaded', error.message, false);
  }
}

document.getElementById('payslipPeriod')?.addEventListener('change', function() {
  const record = employeePayslipRecords[Number(this.value)];
  if (record) renderEmployeePayslip(record);
});

async function loadEmployeeProfile() {
  try {
    const response = await fetch('../php/profile.php');
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Account does not exist.');
    applyEmployeeProfile(result.user);
  } catch (error) {
    showEmployeeAlert('Account Not Available', error.message || 'Account does not exist.', false);
    setTimeout(() => { window.location.href = 'Login.html'; }, 1800);
  }
}

function showEmployeeAlert(title, message, success = true) {
  const icon = document.getElementById('employeeAlertIcon');
  const iconTag = document.getElementById('employeeAlertIconTag');
  icon.style.background = success ? 'rgba(139, 94, 60,0.15)' : 'rgba(139, 94, 60,0.15)';
  icon.style.borderColor = success ? 'rgba(139, 94, 60,0.25)' : 'rgba(139, 94, 60,0.25)';
  iconTag.className = success ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
  iconTag.style.color = success ? '#8B5E3C' : '#8B5E3C';
  document.getElementById('employeeAlertTitle').textContent = title;
  document.getElementById('employeeAlertDesc').textContent = message;
  document.getElementById('employeeAlertModal').classList.add('show');
}

function closeEmployeeAlert() {
  document.getElementById('employeeAlertModal').classList.remove('show');
}

function enforceElevenDigitPhone(input) {
  if (!input) return;
  input.addEventListener('input', function() {
    this.value = this.value.replace(/\D/g, '').slice(0, 11);
  });
}

enforceElevenDigitPhone(document.getElementById('profileContact'));
enforceElevenDigitPhone(document.getElementById('profileCurrentPin'));

document.getElementById('employeeProfileForm')?.addEventListener('submit', async function(event) {
  event.preventDefault();
  const contact = document.getElementById('profileContact').value.trim();
  if (!/^\d{11}$/.test(contact)) {
    showEmployeeAlert('Invalid Contact Number', 'Contact number must be exactly 11 digits.', false);
    return;
  }
  if (!/^\d{6}$/.test(document.getElementById('profileCurrentPin').value.trim())) {
    showEmployeeAlert('PIN Verification Required', 'Enter your current 6-digit access PIN before saving profile changes.', false);
    return;
  }
  try {
    const body = new FormData(this);
    body.append('action', 'update');
    const response = await fetch('../php/profile.php', { method: 'POST', body });
    const result = await response.json();
    if (!result.success) return showEmployeeAlert('Profile Not Saved', result.message, false);
    document.getElementById('profileCurrentPin').value = '';
    await loadEmployeeProfile();
    showEmployeeAlert('Profile Updated', result.message, true);
  } catch (error) {
    showEmployeeAlert('Profile Not Saved', 'Unable to update your profile information.', false);
  }
});

async function regenerateEmployeePin() {
  document.getElementById('pinConfirmModal').classList.add('show');
}

function closePinConfirm() {
  document.getElementById('pinConfirmModal').classList.remove('show');
}

async function confirmRegenerateEmployeePin() {
  closePinConfirm();
  try {
    const body = new URLSearchParams({ action: 'regenerate_pin' });
    const response = await fetch('../php/profile.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    const result = await response.json();
    showEmployeeAlert(result.success ? 'Confirmation Sent' : 'Confirmation Not Sent', result.message, result.success);
  } catch (error) {
    showEmployeeAlert('Confirmation Not Sent', 'Unable to request a new PIN right now.', false);
  }
}

const employeeDocumentTypes = [
  { key: 'employment_contract', label: 'Employment Contract', optional: false, icon: 'fa-file-signature', contract: true },
  { key: 'sss', label: 'SSS', optional: false, icon: 'fa-id-card' },
  { key: 'philhealth', label: 'PhilHealth', optional: false, icon: 'fa-heart-pulse' },
  { key: 'pagibig', label: 'Pag-IBIG', optional: false, icon: 'fa-house' },
  { key: 'tin', label: 'TIN', optional: false, icon: 'fa-file-invoice-dollar' },
  { key: 'valid_id', label: 'Valid ID', optional: true, icon: 'fa-address-card' }
];
let employeeDocuments = [];

function employeeDocumentStatus(document) {
  if (!document) return { label: 'Missing', className: 'document-status-missing' };
  if (document.document_type === 'employment_contract') {
    if (document.contract_status === 'verified') return { label: 'Verified', className: 'document-status-verified' };
    if (document.contract_status === 'signed') return { label: 'Signed / For Verification', className: 'document-status-pending' };
    return { label: 'For Signing', className: 'document-status-pending' };
  }
  if (document.verification_status === 'verified') return { label: 'Verified', className: 'document-status-verified' };
  if (document.verification_status === 'rejected') return { label: 'Needs Replacement', className: 'document-status-rejected' };
  return { label: 'Pending Review', className: 'document-status-pending' };
}

function renderEmployeeDocuments() {
  const grid = document.getElementById('employeeDocumentsGrid');
  const visibleTypes = document.documentElement.dataset.accessLevel === 'limited' ? employeeDocumentTypes.filter(type => type.contract) : employeeDocumentTypes;
  grid.innerHTML = visibleTypes.map(type => {
    const document = employeeDocuments.find(item => item.document_type === type.key);
    const status = employeeDocumentStatus(document);
    const reason = document?.verification_status === 'rejected' && document.rejection_reason
      ? '<div class="document-rejection"><i class="fas fa-circle-exclamation"></i><span><strong>HR reason:</strong> ' + escapeEmployeeDocumentHtml(document.rejection_reason) + '</span></div>' : '';
    const file = document
      ? '<a class="document-file-link" href="../php/employee_documents.php?action=file&document_id=' + Number(document.document_id) + '" target="_blank" rel="noopener"><i class="fas fa-paperclip"></i> ' + escapeEmployeeDocumentHtml(document.file_name) + '</a>'
      : '<span class="document-file-missing">No file uploaded</span>';
    return '<article class="government-document-item">' +
      '<div class="document-item-main"><div class="document-type-icon"><i class="fas ' + type.icon + '"></i></div><div><h4>' + type.label + (type.optional ? ' <small>Optional</small>' : '') + '</h4>' + file + '</div></div>' +
      '<div class="document-item-actions"><span class="document-status ' + status.className + '">' + status.label + '</span>' +
      '<input type="file" id="employeeDocumentFile-' + type.key + '" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" hidden onchange="uploadEmployeeDocument(\'' + type.key + '\', this)">' +
      (type.contract && document ? '<a class="btn btn-outline document-view-btn" href="../php/employee_documents.php?action=file&document_id=' + Number(document.document_id) + '" target="_blank" rel="noopener"><i class="fas fa-eye"></i> View Contract</a>' : '') +
      (type.contract && document ? '<a class="btn btn-outline document-view-btn" href="../php/employee_documents.php?action=file&document_id=' + Number(document.document_id) + '&download=1"><i class="fas fa-download"></i> Download</a>' : '') +
      '<button type="button" class="btn btn-gold document-upload-btn"' + (type.contract && !document ? ' disabled title="HR must upload your contract first"' : '') + ' onclick="document.getElementById(\'employeeDocumentFile-' + type.key + '\').click()"><i class="fas fa-upload"></i> ' + (type.contract ? (document?.contract_status === 'for_signing' ? 'Upload Signed Copy' : 'Replace Signed Copy') : (document ? 'Replace File' : 'Upload')) + '</button></div>' + reason + '</article>';
  }).join('');
}

function updateContractBanner() {
  if (document.documentElement.dataset.accessLevel !== 'limited') return;
  const contract = employeeDocuments.find(item => item.document_type === 'employment_contract');
  const kicker = document.getElementById('contractBannerKicker');
  const title = document.getElementById('contractBannerTitle');
  const text = document.getElementById('contractBannerText');
  const button = document.getElementById('contractBannerButton');
  if (!kicker || !title || !text || !button) return;
  button.disabled = false;
  if (!contract) {
    kicker.textContent = 'Waiting for HR';
    title.textContent = 'Employment Contract Pending';
    text.textContent = 'HR has not uploaded your contract yet. You can check the current status here.';
    button.innerHTML = '<i class="fas fa-clock"></i> Check Contract';
  } else if (contract.contract_status === 'signed') {
    kicker.textContent = 'Submitted successfully';
    title.textContent = 'Pending HR Verification';
    text.textContent = 'Your signed contract is waiting for HR review. Full access remains locked until final Manager confirmation.';
    button.innerHTML = '<i class="fas fa-eye"></i> View Status';
  } else if (contract.contract_status === 'verified') {
    kicker.textContent = 'HR verification complete';
    title.textContent = 'Awaiting Manager Confirmation';
    text.textContent = 'Your contract was approved by HR. Final Manager confirmation will unlock your dashboard.';
    button.innerHTML = '<i class="fas fa-eye"></i> View Status';
  } else {
    kicker.textContent = 'Action required';
    title.textContent = 'Contract Ready for Signing';
    text.textContent = (contract.file_name || 'Your employment contract') + ' was uploaded by HR. Open, download, sign, and submit it now.';
    button.innerHTML = '<i class="fas fa-file-signature"></i> Open Contract';
  }
}

function escapeEmployeeDocumentHtml(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

async function loadEmployeeDocuments() {
  try {
    const response = await fetch('../php/employee_documents.php?action=mine', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load your documents.');
    employeeDocuments = result.documents || [];
    renderEmployeeDocuments();
    updateContractBanner();
  } catch (error) {
    document.getElementById('employeeDocumentsGrid').innerHTML = '<div class="document-loading document-error"><i class="fas fa-circle-exclamation"></i> ' + escapeEmployeeDocumentHtml(error.message) + '</div>';
  }
}

async function uploadEmployeeDocument(type, input) {
  const file = input.files?.[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    input.value = '';
    return showEmployeeAlert('File Too Large', 'Document file must not exceed 10 MB.', false);
  }
  const form = new FormData();
  form.append('action', 'upload');
  form.append('document_type', type);
  form.append('document', file);
  const buttons = document.querySelectorAll('.document-upload-btn');
  buttons.forEach(button => button.disabled = true);
  try {
    const response = await fetch('../php/employee_documents.php', { method: 'POST', body: form });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to upload this document.');
    await loadEmployeeDocuments();
    showEmployeeAlert('Document Uploaded', result.message, true);
  } catch (error) {
    showEmployeeAlert('Document Not Uploaded', error.message, false);
  } finally {
    input.value = '';
    document.querySelectorAll('.document-upload-btn').forEach(button => button.disabled = false);
  }
}

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
document.getElementById('employeeAlertModal').addEventListener('click', function(e) {
  if (e.target === this) closeEmployeeAlert();
});
document.getElementById('pinConfirmModal').addEventListener('click', function(e) {
  if (e.target === this) closePinConfirm();
});
document.getElementById('attendanceChoiceModal').addEventListener('click', function(e) {
  if (e.target === this) closeAttendanceChoice();
});

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    hideSignoutModal();
    closeEmployeeAlert();
    closePinConfirm();
    closeAttendanceChoice();
  }
});

// ============================================
// SET CURRENT DATE
// ============================================
function updateDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);

  if (currentEmployeeProfile) {
    document.getElementById('dashGreeting').textContent = 'Hi, ' + employeeFirstName(currentEmployeeProfile.full_name) + '!';
  }
}
updateDate();
loadEmployeeProfile();
loadEmployeeDocuments();

// ============================================
// LIVE CLOCK
// ============================================
function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  document.getElementById('liveTime').textContent = time;
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('liveDate').textContent = now.toLocaleDateString('en-US', options);
  if (employeeAttendanceState?.today && !employeeAttendanceState.today.clock_out && !(employeeAttendanceState.today.break_start && !employeeAttendanceState.today.break_end)) {
    const elapsed = Math.max(0, Math.floor((Date.now() - attendanceLoadedAt) / 1000));
    const todaySeconds = Number(employeeAttendanceState.today.duration_seconds || 0) + elapsed;
    const weekSeconds = Number(employeeAttendanceState.stats.week_seconds || 0) + elapsed;
    const monthSeconds = Number(employeeAttendanceState.stats.month_seconds || 0) + elapsed;
    document.getElementById('todayTotal').textContent = attendanceDuration(todaySeconds);
    document.getElementById('weekTotal').textContent = attendanceDuration(weekSeconds);
    document.getElementById('monthTotal').textContent = attendanceDuration(monthSeconds);
    document.getElementById('workHours').textContent = (weekSeconds / 3600).toFixed(1).replace('.0', '');
  }
}
updateClock();
setInterval(updateClock, 1000);

// ============================================
// TIME CLOCK FUNCTIONALITY
// ============================================
let isClockedIn = false;

function attendanceDate(value) {
  return value ? new Date(String(value).replace(' ', 'T')) : null;
}

function attendanceTime(value) {
  const date = attendanceDate(value);
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';
}

function attendanceDuration(seconds) {
  const totalMinutes = Math.max(0, Math.floor(Number(seconds || 0) / 60));
  return Math.floor(totalMinutes / 60) + 'h ' + (totalMinutes % 60) + 'm';
}

function attendanceScheduleTime(value) {
  if (!value) return '—';
  const date = new Date('2000-01-01T' + value);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function renderEmployeeAttendance(data) {
  attendanceLoadedAt = Date.now();
  const btn = document.getElementById('clockBtn');
  const status = document.getElementById('clockStatus');
  const btnText = document.getElementById('clockBtnText');
  const today = data.today;
  const schedule = data.schedule || {};
  document.getElementById('employeeShiftSchedule').innerHTML = '<i class="fas fa-briefcase"></i> Shift: ' + attendanceScheduleTime(schedule.shift_start) + ' - ' + attendanceScheduleTime(schedule.shift_end);
  document.getElementById('employeeBreakSchedule').innerHTML = '<i class="fas fa-mug-hot"></i> Break: ' + attendanceScheduleTime(schedule.break_start) + ' - ' + attendanceScheduleTime(schedule.break_end);
  document.getElementById('employeeDayOffSchedule').innerHTML = '<i class="fas fa-calendar-xmark"></i> Day Off: ' + (schedule.day_off || '—');
  isClockedIn = Boolean(today && !today.clock_out);
  const onBreak = Boolean(isClockedIn && today.break_start && !today.break_end);
  btn.disabled = false;
  if (isClockedIn) {
    btn.className = 'time-clock-btn ' + (onBreak ? 'btn-clock-in' : 'btn-clock-out');
    btnText.textContent = onBreak ? 'RESUME WORK' : 'TIME OUT';
    status.className = 'time-clock-status clocked-in';
    status.innerHTML = onBreak
      ? '<span class="status-dot gold"></span> At Lunch since ' + attendanceTime(today.break_start) + ' (work timer paused)'
      : '<span class="status-dot green"></span> Currently Working (in at ' + attendanceTime(today.clock_in) + ')' + (Number(today.late_minutes) > 0 ? ' — Late ' + Number(today.late_minutes) + ' min(s)' : '');
  } else {
    btn.className = 'time-clock-btn btn-clock-in';
    btn.disabled = !today && !schedule.can_clock_in;
    btnText.textContent = !schedule.can_clock_in && !today ? 'CLOCK IN UNAVAILABLE' : 'TIME IN';
    status.className = 'time-clock-status clocked-out';
    status.innerHTML = '<span class="status-dot red"></span> ' + (schedule.can_clock_in || today ? 'Ready to time in' : 'Time in is currently unavailable');
  }
  document.getElementById('todayTotal').textContent = today ? attendanceDuration(today.duration_seconds) : '0h 0m';
  document.getElementById('weekTotal').textContent = attendanceDuration(data.stats.week_seconds);
  document.getElementById('monthTotal').textContent = attendanceDuration(data.stats.month_seconds);
  document.getElementById('daysPresent').textContent = data.stats.days_present;
  document.getElementById('latesCount').textContent = data.stats.lates;
  document.getElementById('workHours').textContent = (Number(data.stats.week_seconds || 0) / 3600).toFixed(1).replace('.0', '');
  document.getElementById('attendanceRate').textContent = data.stats.days_present ? data.stats.days_present + ' recorded day' + (data.stats.days_present === 1 ? '' : 's') : 'No attendance records yet';
  document.getElementById('lastLate').textContent = data.stats.lates ? data.stats.lates + ' late record' + (data.stats.lates === 1 ? '' : 's') : 'No late records';

  const tbody = document.getElementById('employeeAttendanceBody');
  tbody.innerHTML = data.logs.length ? data.logs.map(log => {
    const day = attendanceDate(log.work_date + ' 00:00:00');
    const dateText = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    let approval = log.clock_out ? 'Approved' : 'In Progress';
    if (log.approval_status === 'pending') approval = 'Pending Admin Review';
    if (log.approval_status === 'rejected') approval = 'Rejected';
    const stateClass = log.approval_status === 'rejected' ? 'status-late' : (log.approval_status === 'pending' ? 'status-pending' : 'status-ontime');
    const metrics = log.clock_out ? '<small style="display:block;margin-top:5px;color:rgba(230, 214, 194,.42)">' + escapeEmployeeDocumentHtml(log.attendance_remark || '') + (Number(log.late_minutes) ? ' • Late ' + Number(log.late_minutes) + 'm' : '') + (Number(log.undertime_minutes) ? ' • Undertime ' + Number(log.undertime_minutes) + 'm' : '') + (Number(log.overtime_minutes) ? ' • Overtime ' + Number(log.overtime_minutes) + 'm' : '') + '</small>' : '';
    const adminNote = log.admin_note ? '<small style="display:block;margin-top:4px;color:#C9A17A">Admin: ' + escapeEmployeeDocumentHtml(log.admin_note) + '</small>' : '';
    return '<tr><td>' + dateText + '</td><td>' + attendanceTime(log.clock_in) + '</td><td>' + attendanceTime(log.break_start) + '</td><td>' + attendanceTime(log.break_end) + '</td><td>' + attendanceTime(log.clock_out) + '</td><td>' + attendanceDuration(log.duration_seconds) + '</td><td><span class="status-badge ' + stateClass + '">' + approval + '</span>' + metrics + adminNote + '</td></tr>';
  }).join('') : '<tr><td colspan="7" style="text-align:center;">No attendance records yet.</td></tr>';

  const activity = document.getElementById('employeeRecentActivity');
  activity.innerHTML = data.activities.length ? data.activities.map(item => {
    const late = item.type === 'late_clock_in';
    const out = item.type === 'clock_out';
    const label = item.type === 'break_start' ? 'Lunch Out at ' : (item.type === 'break_end' ? 'Lunch In at ' : (out ? 'Ended shift at ' : (late ? 'Late time in at ' : 'Timed in at ')));
    const occurred = attendanceDate(item.occurred_at);
    return '<div class="activity-item"><div class="activity-dot ' + (late ? 'activity-dot-red' : 'activity-dot-green') + '"></div><div class="activity-info"><span class="activity-text">' + label + attendanceTime(item.occurred_at) + '</span><span class="activity-time">' + occurred.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + '</span></div></div>';
  }).join('') : '<div class="activity-item"><div class="activity-info"><span class="activity-text">No attendance activity yet.</span></div></div>';
}

async function loadEmployeeAttendance() {
  if (document.documentElement.dataset.accessLevel === 'limited') return;
  try {
    const response = await fetch('../php/attendance.php?action=mine', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load attendance.');
    employeeAttendanceState = result;
    renderEmployeeAttendance(result);
  } catch (error) {
    document.getElementById('clockBtn').disabled = true;
    console.warn('Attendance data was not loaded:', error.message);
  }
}

async function toggleClock() {
  const today = employeeAttendanceState?.today;
  if (!today) return recordAttendanceAction('clock');
  if (today.clock_out) return recordAttendanceAction('clock');
  if (today.break_start && !today.break_end) return recordAttendanceAction('break_end');
  openAttendanceChoice();
}

document.getElementById('clockBtn').addEventListener('click', toggleClock);

function openAttendanceChoice() {
  document.getElementById('attendanceChoiceModal').classList.add('show');
}

function closeAttendanceChoice() {
  document.getElementById('attendanceChoiceModal').classList.remove('show');
}

function chooseAttendanceAction(action) {
  closeAttendanceChoice();
  recordAttendanceAction(action);
}

function stopAttendanceProofCamera() {
  FaceVerification.stop();
  attendanceProofStream = null;
  document.getElementById('attendanceProofVideo').srcObject = null;
}

function closeAttendanceProof() {
  stopAttendanceProofCamera();
  attendanceProofAction = null;
  attendanceProofPosition = null;
  attendanceFaceResult = null;
  document.getElementById('attendanceProofModal').classList.remove('show');
}

async function openAttendanceProof(action) {
  attendanceProofAction = action;
  attendanceProofPosition = null;
  attendanceFaceResult = null;
  const status = document.getElementById('attendanceProofStatus');
  const loading = document.getElementById('attendanceCameraLoading');
  const captureBtn = document.getElementById('captureAttendanceProofBtn');
  const actionTitles = { clock: 'Verify Time In', break_end: 'Verify Lunch In', clock_out: 'Verify Time Out' };
  document.getElementById('attendanceProofTitle').textContent = actionTitles[action] || 'Verify Attendance';
  status.innerHTML = '<span><i class="fas fa-arrows-left-right"></i> Head movement required</span>';
  loading.style.display = 'flex';
  captureBtn.disabled = true;
  document.getElementById('attendanceProofModal').classList.add('show');
  try {
    if (!navigator.mediaDevices?.getUserMedia || !navigator.geolocation) throw new Error('Camera are not supported by this browser.');
    const video = document.getElementById('attendanceProofVideo');
    const [stream, position] = await Promise.all([
      FaceVerification.start(video),
      new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }))
    ]);
    if (!attendanceProofAction) {
      stream.getTracks().forEach(track => track.stop());
      return;
    }
    attendanceProofStream = stream;
    attendanceProofPosition = position;
    loading.style.display = 'none';
    attendanceFaceResult = await FaceVerification.verifyHeadTurn(video, message => {
      status.innerHTML = '<span><i class="fas fa-user-check"></i> ' + escapeEmployeeHtml(message) + '</span><span class="proof-ready"><i class="fas fa-location-dot"></i> GPS ±' + Math.round(position.coords.accuracy) + 'm</span>';
    });
    status.innerHTML = '<span class="proof-ready"><i class="fas fa-circle-check"></i> Face and head movement verified</span><span class="proof-ready"><i class="fas fa-location-dot"></i> GPS ±' + Math.round(position.coords.accuracy) + 'm</span>';
    captureBtn.disabled = false;
  } catch (error) {
    stopAttendanceProofCamera();
    loading.style.display = 'none';
    status.innerHTML = '<span class="proof-error"><i class="fas fa-triangle-exclamation"></i> ' + escapeEmployeeHtml(error.message || 'Camera, face, and head movement verification are required.') + '</span>';
  }
}

function captureAttendanceProof() {
  if (!attendanceProofStream || !attendanceProofPosition || !attendanceProofAction || !attendanceFaceResult) return;
  const proof = {
    photo: attendanceFaceResult.photo,
    faceDescriptor: attendanceFaceResult.descriptor,
    livenessVerified: attendanceFaceResult.livenessVerified,
    latitude: attendanceProofPosition.coords.latitude,
    longitude: attendanceProofPosition.coords.longitude,
    accuracy: attendanceProofPosition.coords.accuracy
  };
  const action = attendanceProofAction;
  closeAttendanceProof();
  recordAttendanceAction(action, proof);
}

async function recordAttendanceAction(action, proof = null) {
  if ((action === 'clock' || action === 'break_end' || action === 'clock_out') && !proof) {
    openAttendanceProof(action);
    return;
  }
  const btn = document.getElementById('clockBtn');
  if (btn.disabled) return;
  btn.disabled = true;
  const originalText = document.getElementById('clockBtnText').textContent;
  document.getElementById('clockBtnText').textContent = 'SAVING...';
  try {
    const body = new URLSearchParams({ action });
    if (proof) {
      body.set('proof_photo', proof.photo);
      body.set('latitude', proof.latitude);
      body.set('longitude', proof.longitude);
      body.set('accuracy', proof.accuracy);
      body.set('face_descriptor', JSON.stringify(proof.faceDescriptor));
      body.set('liveness_verified', proof.livenessVerified ? '1' : '0');
    }
    const response = await fetch('../php/attendance.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to save attendance.');
    await loadEmployeeAttendance();
    const titles = { clock_in: 'Time In Recorded', break_start: 'Lunch Out Recorded', break_end: 'Lunch In Recorded', clock_out: 'Time Out Recorded' };
    showEmployeeAlert(titles[result.event] || 'Attendance Recorded', result.message, true);
  } catch (error) {
    btn.disabled = false;
    document.getElementById('clockBtnText').textContent = originalText;
    showEmployeeAlert('Attendance Not Saved', error.message, false);
  }
}

if (document.documentElement.dataset.accessLevel !== 'limited') loadEmployeeAttendance();

// ============================================
// SIDEBAR NAVIGATION
// ============================================
const limitedContractAccess = document.documentElement.dataset.accessLevel === 'limited';
if (limitedContractAccess) {
  setInterval(async () => {
    try {
      const response = await fetch('../php/session_status.php?role=employee', { cache: 'no-store' });
      const session = await response.json();
      if (response.ok && session.success && session.access_level === 'full') window.location.reload();
      else if (response.ok && session.success) await loadEmployeeDocuments();
    } catch (error) {}
  }, 10000);
}
async function openContractRequiredModal() {
  if (!limitedContractAccess) return;
  const modal = document.getElementById('contractRequiredModal');
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
  await loadContractRequiredModal();
}
function closeContractRequiredModal() {
  const modal = document.getElementById('contractRequiredModal');
  if (modal) modal.classList.remove('show');
  document.body.style.overflow = '';
}
async function loadContractRequiredModal() {
  const body = document.getElementById('contractRequiredBody');
  const form = document.getElementById('contractRequiredForm');
  const closeActions = document.getElementById('contractRequiredCloseActions');
  if (!body || !form) return;
  body.innerHTML = '<div class="document-loading"><i class="fas fa-spinner fa-spin"></i> Loading your contract...</div>';
  form.style.display = 'none';
  closeActions.style.display = 'flex';
  try {
    const response = await fetch('../php/employee_documents.php?action=mine', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load your contract.');
    const contract = (result.documents || []).find(item => item.document_type === 'employment_contract');
    if (!contract) {
      body.innerHTML = '<div class="contract-modal-file"><span class="document-status document-status-pending">Waiting for HR</span><p style="margin:12px 0 0;color:rgba(230,214,194,.65);font-size:13px;">HR has not uploaded your employment contract yet. Please check again later.</p></div>';
      return;
    }
    const pending = contract.contract_status === 'signed';
    const verified = contract.contract_status === 'verified';
    const status = verified ? 'Contract Verified — Awaiting Manager Confirmation' : (pending ? 'Pending HR Verification' : 'Contract Required');
    body.innerHTML = '<div class="contract-modal-file"><span class="document-status ' + (verified ? 'document-status-verified' : 'document-status-pending') + '">' + status + '</span><p style="margin:13px 0 0;color:#E6D6C2;font-size:13px;"><i class="fas fa-file-lines" style="color:#C9A17A;margin-right:8px;"></i>' + escapeEmployeeDocumentHtml(contract.file_name) + '</p><div class="contract-modal-actions"><a class="btn btn-outline" target="_blank" rel="noopener" href="../php/employee_documents.php?action=file&document_id=' + Number(contract.document_id) + '"><i class="fas fa-eye"></i> View Contract</a><a class="btn btn-outline" href="../php/employee_documents.php?action=file&document_id=' + Number(contract.document_id) + '&download=1"><i class="fas fa-download"></i> Download Contract</a></div>' + (contract.rejection_reason ? '<div class="document-rejection"><i class="fas fa-circle-exclamation"></i><span><strong>HR reason:</strong> ' + escapeEmployeeDocumentHtml(contract.rejection_reason) + '</span></div>' : '') + '</div>';
    if (!pending && !verified) {
      form.style.display = 'block';
      closeActions.style.display = 'none';
    }
  } catch (error) {
    body.innerHTML = '<div class="document-loading document-error"><i class="fas fa-circle-exclamation"></i> ' + escapeEmployeeDocumentHtml(error.message) + '</div>';
  }
}
document.getElementById('contractRequiredForm')?.addEventListener('submit', async function(event) {
  event.preventDefault();
  const input = document.getElementById('contractRequiredFile');
  const file = input.files?.[0];
  if (!file) return showEmployeeAlert('Signed Contract Required', 'Choose your signed contract before submitting.', false);
  if (file.size > 10 * 1024 * 1024) return showEmployeeAlert('File Too Large', 'Contract file must not exceed 10 MB.', false);
  const button = document.getElementById('contractRequiredSubmit');
  button.disabled = true;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
  const data = new FormData();
  data.append('action', 'upload'); data.append('document_type', 'employment_contract'); data.append('document', file);
  try {
    const response = await fetch('../php/employee_documents.php', { method: 'POST', body: data });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to submit the signed contract.');
    input.value = '';
    document.getElementById('contractRequiredFileName').textContent = 'Click to choose a PDF, JPG, JPEG, or PNG file';
    await loadContractRequiredModal();
    showEmployeeAlert('Pending HR Verification', 'Your signed contract was submitted successfully and is pending HR verification.', true);
  } catch (error) { showEmployeeAlert('Contract Not Submitted', error.message, false); }
  finally { button.disabled = false; button.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Signed Contract'; }
});
document.getElementById('contractRequiredFile')?.addEventListener('change', function() {
  document.getElementById('contractRequiredFileName').textContent = this.files?.[0]?.name || 'Click to choose a PDF, JPG, JPEG, or PNG file';
});
document.getElementById('contractRequiredModal')?.addEventListener('click', function(event) { if (event.target === this) closeContractRequiredModal(); });
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    if (this.getAttribute('aria-disabled') === 'true') return;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    this.classList.add('active');
    const page = this.dataset.page;
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    if (page === 'dashboard' || page === 'timeclock') loadEmployeeAttendance();
    if (page === 'profile') loadEmployeeDocuments();
    if (page === 'payslip') loadEmployeePayslips(true);
    if (page === 'leave') loadEmployeeLeaves();
    if (window.innerWidth <= 992) document.getElementById('sidebar').classList.remove('show');
  });
});

function switchPage(page) {
  if (limitedContractAccess && page !== 'dashboard') {
    showEmployeeAlert('Contract Required', 'Complete your employment contract before using this feature.', false);
    return;
  }
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');
  document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');
  if (page === 'dashboard' || page === 'timeclock') loadEmployeeAttendance();
  if (page === 'payslip') loadEmployeePayslips(true);
  if (page === 'leave') loadEmployeeLeaves();
}

setInterval(() => {
  if (limitedContractAccess) return;
  if (document.getElementById('page-dashboard')?.classList.contains('active') || document.getElementById('page-timeclock')?.classList.contains('active')) {
    loadEmployeeAttendance();
  }
}, 30000);

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
// LEAVE FORM FUNCTIONS
// ============================================
function computeLeaveDays() {
  const start = document.getElementById('leaveStart').value;
  const end = document.getElementById('leaveEnd').value;
  const daysField = document.getElementById('leaveDays');

  if (start && end) {
    const startDate = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');
    const during = document.getElementById('leaveDuring').value;
    if (endDate < startDate || (during && during !== 'whole-day' && start !== end)) {
      daysField.value = '0';
      return;
    }
    daysField.value = during && during !== 'whole-day' ? '0.5' : String(Math.round((endDate - startDate) / 86400000) + 1);
  } else {
    daysField.value = '0';
  }
}

document.getElementById('leaveDuring')?.addEventListener('change', computeLeaveDays);
const employeeToday = new Date().toLocaleDateString('en-CA');
document.getElementById('leaveStart').min = employeeToday;
document.getElementById('leaveEnd').min = employeeToday;

document.getElementById('leaveContact')?.addEventListener('input', function() {
  this.value = this.value.replace(/\D/g, '').slice(0, 11);
});

function leaveDate(value) {
  const date = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function leaveTypeLabel(value) {
  return ({ vacation: 'Vacation Leave', sick: 'Sick Leave', personal: 'Personal Leave', emergency: 'Emergency Leave', maternity: 'Maternity Leave' })[value] || value;
}

function employeeEscapeHtml(value) {
  const span = document.createElement('span');
  span.textContent = String(value ?? '');
  return span.innerHTML;
}

function renderEmployeeLeaves(data) {
  document.getElementById('leaveApprovedCount').textContent = data.stats.approved;
  document.getElementById('leavePendingCount').textContent = data.stats.pending;
  document.getElementById('leaveTotalCount').textContent = data.stats.total;
  document.getElementById('leaveRejectedCount').textContent = data.stats.rejected;
  const body = document.getElementById('employeeLeaveBody');
  body.innerHTML = data.requests.length ? data.requests.map(request => {
    const status = employeeEscapeHtml(request.status);
    const days = Number(request.days) % 1 ? Number(request.days).toFixed(1) : String(Number(request.days));
    return '<tr title="Reference: ' + employeeEscapeHtml(request.reference_code) + '"><td>' + employeeEscapeHtml(leaveTypeLabel(request.leave_type)) + '</td><td>' + leaveDate(request.start_date + ' 00:00:00') + '</td><td>' + leaveDate(request.end_date + ' 00:00:00') + '</td><td>' + days + '</td><td><span class="status-badge status-' + status + '">' + status.charAt(0).toUpperCase() + status.slice(1) + '</span></td><td>' + leaveDate(request.created_at) + '</td></tr>';
  }).join('') : '<tr><td colspan="6" style="text-align:center;">No leave requests yet.</td></tr>';
}

async function loadEmployeeLeaves() {
  if (document.documentElement.dataset.accessLevel === 'limited') return;
  try {
    const response = await fetch('../php/leave_requests.php?action=mine', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load leave requests.');
    renderEmployeeLeaves(result);
  } catch (error) {
    document.getElementById('employeeLeaveBody').innerHTML = '<tr><td colspan="6" style="text-align:center;">Leave requests could not be loaded.</td></tr>';
  }
}

async function submitLeave(e) {
  e.preventDefault();

  const type = document.getElementById('leaveType');
  const payType = document.getElementById('leaveTypeDetail');
  const start = document.getElementById('leaveStart');
  const end = document.getElementById('leaveEnd');
  const contact = document.getElementById('leaveContact');
  const reason = document.getElementById('leaveReason');
  const during = document.getElementById('leaveDuring');

  if (!type.value || !payType.value || !start.value || !end.value || !contact.value || !reason.value.trim() || !during.value) {
    showEmployeeAlert('Incomplete Leave Request', 'Please fill in all required fields.', false);
    return false;
  }

  if (!/^\d{11}$/.test(contact.value.trim())) {
    showEmployeeAlert('Invalid Contact Number', 'Contact number must be exactly 11 digits.', false);
    return false;
  }

  computeLeaveDays();
  if (Number(document.getElementById('leaveDays').value) <= 0) {
    showEmployeeAlert('Invalid Leave Dates', 'Please select a valid date range. Half-day leave must start and end on the same date.', false);
    return false;
  }

  const submitButton = e.submitter;
  if (submitButton) submitButton.disabled = true;
  try {
    const body = new URLSearchParams({
      action: 'submit', leave_type: type.value, pay_type: payType.value,
      start_date: start.value, end_date: end.value, contact_no: contact.value.trim(),
      reason: reason.value.trim(), leave_during: during.value,
      comments: document.getElementById('leaveComments').value.trim()
    });
    const response = await fetch('../php/leave_requests.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to submit leave request.');
    closeLeaveModal();
    if (currentEmployeeProfile) applyEmployeeProfile(currentEmployeeProfile);
    await loadEmployeeLeaves();
    showEmployeeAlert('Leave Request Submitted', result.message + ' Reference: ' + result.reference_code, true);
  } catch (error) {
    showEmployeeAlert('Leave Request Not Submitted', error.message, false);
  } finally {
    if (submitButton) submitButton.disabled = false;
  }

  return false;
}

function closeLeaveModal() {
  document.getElementById('leaveForm').reset();
  document.getElementById('leaveDays').value = '0';
}

if (document.documentElement.dataset.accessLevel !== 'limited') loadEmployeeLeaves();

// ============================================
// ANIMATED COUNTERS
// ============================================
function animateCounters() {
  document.querySelectorAll('#page-dashboard .stat-value').forEach(el => {
    const target = parseFloat(el.textContent);
    if (isNaN(target)) return;
    const step = Math.ceil(target / 25);
    let current = 0;
    const isFloat = el.textContent.includes('.');
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = isFloat ? current.toFixed(1) : current.toLocaleString();
    }, 800 / (target / step));
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { animateCounters(); observer.disconnect(); }
  });
});
const dashPage = document.getElementById('page-dashboard');
if (dashPage) observer.observe(dashPage);






    const money = v => '₱' + Number(v || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));

    async function api(action, p = {}) {
      const r = await fetch('../php/finance.php?' + new URLSearchParams({ action, ...p }), { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok || !j.success) throw Error(j.message || 'Request failed');
      return j;
    }

    function page(n) {
      document.querySelectorAll('.page-content').forEach(x => x.classList.toggle('active', x.id === 'page-' + n));
      document.querySelectorAll('.nav-item').forEach(x => x.classList.toggle('active', x.dataset.page === n));
      if (n === 'records') loadRecords();
      if (n === 'history') loadHistory();
    }

    document.querySelectorAll('.nav-item').forEach(x => {
      x.onclick = e => {
        e.preventDefault();
        page(x.dataset.page);
      };
    });

    async function loadSummary() {
      try {
        const s = (await api('summary')).summary;
        totalEmployees.textContent = s.total_employees;
        totalGross.textContent = money(s.total_gross_payroll);
        totalDeductions.textContent = money(s.total_deductions);
        totalNet.textContent = money(s.total_net_payroll);
        pendingPayments.textContent = s.pending_payments;
        paidPayroll.textContent = s.paid_payroll;
        financePeriod.textContent = 'Latest closed cutoff: ' + s.latest_period;
      } catch (e) {
        financePeriod.textContent = e.message;
      }
    }

    async function loadRecords() {
      const b = recordsBody;
      b.innerHTML = '<tr><td colspan="7">Loading payroll records...</td></tr>';
      try {
        const d = await api('records', { period: recordPeriod.value, payment_status: recordStatus.value });
        const periods = [...new Map(d.records.map(x => [x.period, x.period_label])).entries()];
        const old = recordPeriod.value;
        recordPeriod.innerHTML = '<option value="">All payroll periods</option>' + periods.map(x => '<option value="' + x[0] + '">' + esc(x[1]) + '</option>').join('');
        recordPeriod.value = old;
        recordsCount.textContent = d.records.length + ' record(s)';
        b.innerHTML = d.records.length ? d.records.map(x =>
          '<tr><td><strong>' + esc(x.full_name) + '</strong><small>' + esc(x.position) + '</small></td>' +
          '<td>' + esc(x.period_label) + '</td>' +
          '<td>' + money(x.gross_pay) + '</td>' +
          '<td class="deduction">' + money(x.total_deductions) + '</td>' +
          '<td><strong>' + money(x.net_pay) + '</strong></td>' +
          '<td><span class="status paid">Paid</span></td>' +
          '<td><button class="view" onclick="payslip(' + x.id + ')">View Payslip</button></td></tr>'
        ).join('') : '<tr><td colspan="7">No issued payroll records found.</td></tr>';
      } catch (e) {
        b.innerHTML = '<tr><td colspan="7">' + esc(e.message) + '</td></tr>';
      }
    }

    recordPeriod.onchange = loadRecords;
    recordStatus.onchange = loadRecords;

    async function loadHistory() {
      try {
        const d = await api('history');
        historyBody.innerHTML = d.records.length ? d.records.map(x =>
          '<article class="history-card">' +
            '<p class="eyebrow">ISSUED PAYROLL</p>' +
            '<h3>' + esc(x.period_label) + '</h3>' +
            '<p class="muted">' + x.employees + ' employees · ' + x.paid + ' paid</p>' +
            '<div><span>Gross Payroll</span><strong>' + money(x.total_gross) + '</strong></div>' +
            '<div><span>Deductions</span><strong class="deduction">' + money(x.total_deductions) + '</strong></div>' +
            '<div class="net-row"><span>Total Net Pay</span><strong>' + money(x.total_net) + '</strong></div>' +
          '</article>'
        ).join('') : 'No issued payroll history yet.';
      } catch (e) {
        historyBody.textContent = e.message;
      }
    }

    async function payslip(id) {
      try {
        const r = (await api('payslip', { id })).record;
        const line = (n, v) => '<p><span>' + n + '</span><strong>' + money(v) + '</strong></p>';
        slipName.textContent = r.full_name;
        slipPeriod.textContent = r.period_label + ' · ' + r.position;
        slipNet.textContent = money(r.net_pay);
        slipGross.textContent = money(r.gross_pay);
        slipDeductionsTotal.textContent = money(r.total_deductions);
        slipEarnings.innerHTML = line('Basic Pay', r.basic_pay) + line('Rice Allowance', r.rice_allowance) + line('Transportation', r.transport_allowance) + line('Overtime Pay', r.overtime_pay);
        slipDeductions.innerHTML = line('SSS', r.sss) + line('PhilHealth', r.philhealth) + line('Pag-IBIG', r.pagibig) + line('Withholding Tax', r.withholding_tax) + line('Absence', r.absence_deduction) + line('Unpaid Leave', r.unpaid_leave_deduction) + line('Late', r.late_deduction);
        payslipModal.classList.add('show');
      } catch (e) {
        alert(e.message);
      }
    }

    function closePayslip() {
      payslipModal.classList.remove('show');
    }

    payslipModal.onclick = e => {
      if (e.target === payslipModal) closePayslip();
    };

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

    loadSummary();
  