


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

window.openContractPreview = function (documentId, fileName) {
  const modal = document.getElementById('contractPreviewModal');
  const frame = document.getElementById('contractPreviewFrame');
  const title = document.getElementById('contractPreviewTitle');
  const downloadLink = document.getElementById('contractPreviewDownloadLink');
  if (!modal || !frame || !title || !downloadLink) return;

  const fileUrl = '../php/employee_documents.php?action=file&document_id=' + Number(documentId);
  title.textContent = fileName || 'Employment Contract';
  frame.src = fileUrl;
  downloadLink.href = fileUrl + '&download=1';
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
};

window.closeContractPreview = function () {
  const modal = document.getElementById('contractPreviewModal');
  const frame = document.getElementById('contractPreviewFrame');
  if (modal) modal.classList.remove('show');
  if (frame) frame.src = 'about:blank';
  document.body.style.overflow = '';
};

document.getElementById('contractPreviewModal')?.addEventListener('click', function (event) {
  if (event.target === this) closeContractPreview();
});







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
      ? '<button type="button" class="document-file-link" onclick="openContractPreview(' + Number(document.document_id) + ', ' + JSON.stringify(document.file_name || 'Employment Contract') + ')" style="border:0;background:none;padding:0;text-align:left;cursor:pointer;"><i class="fas fa-paperclip"></i> ' + escapeEmployeeDocumentHtml(document.file_name) + '</button>'
      : '<span class="document-file-missing">No file uploaded</span>';
    return '<article class="government-document-item">' +
      '<div class="document-item-main"><div class="document-type-icon"><i class="fas ' + type.icon + '"></i></div><div><h4>' + type.label + (type.optional ? ' <small>Optional</small>' : '') + '</h4>' + file + '</div></div>' +
      '<div class="document-item-actions"><span class="document-status ' + status.className + '">' + status.label + '</span>' +
      '<input type="file" id="employeeDocumentFile-' + type.key + '" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" hidden onchange="uploadEmployeeDocument(\'' + type.key + '\', this)">' +
      (type.contract && document ? '<button type="button" class="btn btn-outline document-view-btn" onclick="openContractPreview(' + Number(document.document_id) + ', ' + JSON.stringify(document.file_name || 'Employment Contract') + ')"><i class="fas fa-eye"></i> View Contract</button>' : '') +
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
    body.innerHTML = '<div class="contract-modal-file"><span class="document-status ' + (verified ? 'document-status-verified' : 'document-status-pending') + '">' + status + '</span><p style="margin:13px 0 0;color:#E6D6C2;font-size:13px;"><i class="fas fa-file-lines" style="color:#C9A17A;margin-right:8px;"></i>' + escapeEmployeeDocumentHtml(contract.file_name) + '</p><div class="contract-modal-actions"><button type="button" class="btn btn-outline" onclick="openContractPreview(' + Number(contract.document_id) + ', ' + JSON.stringify(contract.file_name || 'Employment Contract') + ')"><i class="fas fa-eye"></i> View Contract</button><a class="btn btn-outline" href="../php/employee_documents.php?action=file&document_id=' + Number(contract.document_id) + '&download=1"><i class="fas fa-download"></i> Download Contract</a></div>' + (contract.rejection_reason ? '<div class="document-rejection"><i class="fas fa-circle-exclamation"></i><span><strong>HR reason:</strong> ' + escapeEmployeeDocumentHtml(contract.rejection_reason) + '</span></div>' : '') + '</div>';
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

