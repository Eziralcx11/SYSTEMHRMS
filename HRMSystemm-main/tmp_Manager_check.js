


    let managerApplicants = [];
    let managerDecisionSaving = false;

    function showManagerAlert(title, message, success = true, allowHtml = false) {
      return new Promise(resolve => {
        const modal = document.getElementById('managerAlertModal');
        document.getElementById('managerAlertTitle').textContent = title;
        const messageElement = document.getElementById('managerAlertMessage');
        if (allowHtml) messageElement.innerHTML = message;
        else messageElement.textContent = message;
        const icon = document.getElementById('managerAlertIcon');
        icon.innerHTML = success ? '<i class="fas fa-check"></i>' : '<i class="fas fa-exclamation"></i>';
        icon.style.background = success ? 'rgba(139,94,60,.15)' : 'rgba(180,70,70,.15)';
        const close = document.getElementById('managerAlertClose');
        const done = () => { modal.classList.remove('show'); close.onclick = null; resolve(); };
        close.onclick = done;
        modal.classList.add('show');
      });
    }

    function confirmManagerAction(title, message, confirmLabel = 'Confirm') {
      return new Promise(resolve => {
        const modal = document.getElementById('managerConfirmModal');
        document.getElementById('managerConfirmTitle').textContent = title;
        document.getElementById('managerConfirmMessage').textContent = message;
        const accept = document.getElementById('managerConfirmAccept');
        const cancel = document.getElementById('managerConfirmCancel');
        accept.textContent = confirmLabel;
        const finish = value => { modal.classList.remove('show'); accept.onclick = null; cancel.onclick = null; resolve(value); };
        accept.onclick = () => finish(true);
        cancel.onclick = () => finish(false);
        modal.classList.add('show');
      });
    }

    function getManagerSchedule(name) {
      return new Promise(resolve => {
        const modal = document.getElementById('managerScheduleModal');
        const form = document.getElementById('managerScheduleForm');
        const date = document.getElementById('managerScheduleDate');
        const time = document.getElementById('managerScheduleTime');
        const location = document.getElementById('managerScheduleLocation');
        document.getElementById('managerScheduleName').textContent = name;
        form.reset();
        const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
        date.min = today.toISOString().slice(0, 10);
        const finish = value => { modal.classList.remove('show'); form.onsubmit = null; document.getElementById('managerScheduleCancel').onclick = null; resolve(value); };
        form.onsubmit = event => { event.preventDefault(); finish({ date:date.value, time:time.value, location:location.value.trim() }); };
        document.getElementById('managerScheduleCancel').onclick = () => finish(null);
        modal.classList.add('show');
      });
    }


    function updateDate() {
      const now = new Date();
      document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    async function loadManagerApplicants() {
      const tbody = document.getElementById('managerInterviewTableBody');
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:rgba(230,214,194,.7)"><i class="fas fa-spinner fa-spin"></i> Loading final interview candidates...</td></tr>';
      try {
        const response = await fetch('../php/applicants.php?action=list&view=manager');
        if (response.status === 401 || response.status === 403) {
          await showManagerAlert('Session Expired', 'Please sign in again to continue.', false);
          window.location.href = 'Login.html';
          return;
        }
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Unable to load applicants.');
        managerApplicants = result.applicants || [];
        renderManagerApplicants();
      } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:rgba(230,214,194,.7)">Unable to load final interviews.</td></tr>';
        console.error(error);
      }
    }

    function renderManagerApplicants() {
      const filter = document.getElementById('managerSearch').value.trim().toLowerCase();
      const filtered = managerApplicants.map((app, index) => ({ app, index })).filter(({ app }) => {
        const name = [app.first_name, app.middle_name, app.last_name].filter(Boolean).join(' ').toLowerCase();
        return !filter || name.includes(filter) || String(app.position || '').toLowerCase().includes(filter);
      });
      const tbody = document.getElementById('managerInterviewTableBody');
      document.getElementById('managerScheduledCount').textContent = filtered.filter(({app}) => ['final_interview_pending','final_interview_scheduled'].includes(app.status)).length;
      document.getElementById('managerArrivedCount').textContent = filtered.filter(({app}) => app.status === 'final_interview_arrived').length;
      document.getElementById('managerReadyCount').textContent = filtered.filter(({app}) => ['final_interview_arrived','final_confirmation_pending'].includes(app.status)).length;
      if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:28px;color:rgba(230,214,194,.55)">No candidates currently require Manager action.</td></tr>';
        return;
      }
      const labels = {
        final_interview_pending: 'Ready to Schedule', final_interview_scheduled: 'Scheduled', final_interview_arrived: 'Ready for Decision',
        final_interview_passed: 'Ready for Contract Handoff', contract_pending: 'With HR for Contract', final_confirmation_pending: 'Ready for Final Confirmation'
      };
      tbody.innerHTML = filtered.map(({ app, index }) => {
        const name = [app.first_name, app.middle_name, app.last_name].filter(Boolean).join(' ');
        const interviewLabel = app.interview_date ? new Date(app.interview_date + 'T' + app.interview_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Not set';
        const active = ['final_interview_arrived','final_confirmation_pending'].includes(app.status);
        let actions = '<button class="btn btn-sm btn-outline" onclick="viewManagerApplicant(' + index + ')"><i class="fas fa-eye"></i></button> ';
        if (app.status === 'final_interview_pending') actions += '<button class="btn btn-sm btn-gold" onclick="scheduleManagerFinalInterview(' + index + ')"><i class="fas fa-calendar-plus"></i> Schedule</button>';
        if (app.status === 'final_interview_scheduled') actions += '<button class="btn btn-sm btn-gold" onclick="recordManagerArrival(' + index + ',true)"><i class="fas fa-check"></i> Arrived</button> <button class="btn btn-sm btn-outline" onclick="recordManagerArrival(' + index + ',false)"><i class="fas fa-times"></i> No Show</button>';
        if (app.status === 'final_interview_arrived') actions += '<button class="btn btn-sm btn-gold" onclick="markFinalInterviewResult(' + index + ',true)"><i class="fas fa-user-check"></i> Hire</button> <button class="btn btn-sm btn-outline" onclick="markFinalInterviewResult(' + index + ',false)"><i class="fas fa-user-times"></i> Not Hire</button>';
        if (app.status === 'final_interview_passed') actions += '<button class="btn btn-sm btn-gold" onclick="startLegacyContract(' + index + ')"><i class="fas fa-file-signature"></i> Start Contract</button>';
        if (app.status === 'contract_pending') actions += '<span class="status-badge status-pending">Awaiting HR Verification</span>';
        if (app.status === 'final_confirmation_pending') actions += '<button class="btn btn-sm btn-gold" onclick="confirmManagerEmployment(' + index + ')"><i class="fas fa-badge-check"></i> Confirm Employment</button>';
        return '<tr><td><div class="emp-cell"><div class="emp-avatar"><i class="fas fa-user"></i></div><div><span class="emp-name">' + escapeHtml(name) + '</span><span class="emp-email">' + escapeHtml(app.email || '') + '</span></div></div></td><td>' + escapeHtml(app.position || '') + '</td><td>' + escapeHtml(interviewLabel) + '</td><td><span class="status-badge ' + (active ? 'status-active' : 'status-pending') + '">' + escapeHtml(labels[app.status] || app.status) + '</span></td><td><div class="action-btns">' + actions + '</div></td></tr>';
      }).join('');
    }

    async function managerWorkflowPost(values) {
      const response = await fetch('../php/applicants.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(values) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Unable to update the hiring workflow.');
      return result;
    }

    async function scheduleManagerFinalInterview(index) {
      const app = managerApplicants[index]; if (!app) return;
      const name = [app.first_name, app.middle_name, app.last_name].filter(Boolean).join(' ');
      const schedule = await getManagerSchedule(name);
      if (!schedule) return;
      const { date, time, location } = schedule;
      try {
        const result = await managerWorkflowPost({ action:'schedule_interview', id:String(app.id), stage:'final', interview_date:date, interview_time:time, interview_location:location });
        managerWorkflowPost({ action:'send_interview_email', id:String(app.id), stage:'final' }).catch(error => showManagerAlert('Email Not Sent', error.message, false));
        await showManagerAlert('Schedule Saved', result.message, true); await loadManagerApplicants();
      } catch (error) { await showManagerAlert('Action Not Completed', error.message, false); }
    }

    async function recordManagerArrival(index, arrived) {
      const app = managerApplicants[index]; if (!app || !await confirmManagerAction('Confirm Arrival Status', arrived ? 'Confirm that this applicant arrived for the final interview?' : 'Mark this applicant as No Show?', arrived ? 'Confirm Arrival' : 'Mark No Show')) return;
      try { const result = await managerWorkflowPost({ action:'interview_arrival', id:String(app.id), stage:'final', arrived:arrived?'yes':'no' }); await showManagerAlert('Arrival Updated', result.message, true); await loadManagerApplicants(); } catch (error) { await showManagerAlert('Update Failed', error.message, false); }
    }

    async function startLegacyContract(index) {
      const app = managerApplicants[index];
      if (!app || !await confirmManagerAction('Start Contract Processing', 'Send this selected applicant to HR for contract signing and verification?', 'Send to HR')) return;
      try {
        const result = await managerWorkflowPost({ action:'start_contract', id:String(app.id) });
        await showManagerAlert('Action Completed', result.message, true);
        await loadManagerApplicants();
      } catch (error) { await showManagerAlert('Action Not Completed', error.message, false); }
    }
    async function confirmManagerEmployment(index) {
      const app = managerApplicants[index]; if (!app || !await confirmManagerAction('Final Employment Confirmation', 'Confirm employment and unlock this employee\'s full HRMS access?', 'Confirm Employment')) return;
      try { const result = await managerWorkflowPost({ action:'final_confirmation', id:String(app.id) }); await showManagerAlert('Employment Confirmed', result.message, true); await loadManagerApplicants(); } catch (error) { await showManagerAlert('Confirmation Failed', error.message, false); }
    }
    async function viewManagerApplicant(index) {
      const app = managerApplicants[index];
      if (!app) return;
      const name = [app.first_name, app.middle_name, app.last_name].filter(Boolean).join(' ');
      const statusLabels = {
        final_interview_pending: 'Ready to Schedule', final_interview_scheduled: 'Final Interview Scheduled',
        final_interview_arrived: 'Ready for Manager Decision', final_interview_passed: 'Ready for Contract Handoff',
        contract_pending: 'With HR for Contract', final_confirmation_pending: 'Ready for Final Confirmation'
      };
      const interview = app.interview_date
        ? new Date(app.interview_date + 'T' + (app.interview_time || '00:00')).toLocaleString('en-US', { month:'long', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit' })
        : 'Not yet scheduled';
      const details = '<div class="manager-detail-grid">' +
        '<div class="manager-detail-row"><span class="manager-detail-label">Applicant</span><span class="manager-detail-value">' + escapeHtml(name) + '</span></div>' +
        '<div class="manager-detail-row"><span class="manager-detail-label">Position</span><span class="manager-detail-value">' + escapeHtml(app.position || 'Not specified') + '</span></div>' +
        '<div class="manager-detail-row"><span class="manager-detail-label">Email</span><span class="manager-detail-value">' + escapeHtml(app.email || 'Not provided') + '</span></div>' +
        '<div class="manager-detail-row"><span class="manager-detail-label">Interview</span><span class="manager-detail-value">' + escapeHtml(interview) + '</span></div>' +
        '<div class="manager-detail-row"><span class="manager-detail-label">Status</span><span class="manager-detail-value">' + escapeHtml(statusLabels[app.status] || app.status) + '</span></div></div>';
      await showManagerAlert('Applicant Details', details, true, true);
    }

    async function markFinalInterviewResult(index, passed) {
      const app = managerApplicants[index];
      if (!app || managerDecisionSaving) return;
      const name = [app.first_name, app.middle_name, app.last_name].filter(Boolean).join(' ');
      if (!await confirmManagerAction(passed ? 'Hire Applicant' : 'Do Not Hire', passed ? 'Hire ' + name + '? A limited HRMS account will be created and a unique PIN will be emailed automatically.' : 'Do not hire ' + name + '?', passed ? 'Hire' : 'Not Hire')) return;
      managerDecisionSaving = true;
      document.querySelectorAll('#managerInterviewTableBody button').forEach(button => button.disabled = true);
      try {
        const body = new URLSearchParams({ action: 'interview_result', id: String(app.id), stage: 'final', result: passed ? 'passed' : 'failed' });
        const response = await fetch('../php/applicants.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || 'Unable to save the final interview result.');
        await showManagerAlert('Action Completed', result.message, true);
        await loadManagerApplicants();
      } catch (error) {
        await showManagerAlert('Decision Not Saved', error.message || 'Unable to save the final interview result.', false);
      } finally {
        managerDecisionSaving = false;
        document.querySelectorAll('#managerInterviewTableBody button').forEach(button => button.disabled = false);
      }
    }

    function escapeHtml(value) {
      return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function showSignoutModal() {
      document.getElementById('signoutModal').classList.add('show');
    }

    function hideSignoutModal() {
      document.getElementById('signoutModal').classList.remove('show');
    }

    async function confirmSignout() {
      const button = document.getElementById('managerSignoutConfirm');
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing Out...';
      await securePortalLogout();
    }

    document.addEventListener('DOMContentLoaded', () => {
      updateDate();
      loadManagerApplicants();
      document.getElementById('managerSearch').addEventListener('input', renderManagerApplicants);
      document.getElementById('managerSearch').addEventListener('keypress', function (event) {
        if (event.key === 'Enter') event.preventDefault();
      });
      document.getElementById('signoutModal').addEventListener('click', function (event) {
        if (event.target === this) hideSignoutModal();
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') hideSignoutModal();
      });
      document.getElementById('menuToggle').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('show'));
      document.addEventListener('click', function (e) {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('menuToggle');
        if (window.innerWidth <= 992 && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
          sidebar.classList.remove('show');
        }
      });
    });
  