



let currentStep = 1;

function showApplyAlert(title, message, success = false) {
  const icon = document.getElementById('applyAlertIcon');
  const iconTag = document.getElementById('applyAlertIconTag');
  icon.style.background = success ? 'rgba(139, 94, 60,.15)' : 'rgba(139, 94, 60,.15)';
  icon.style.borderColor = success ? 'rgba(139, 94, 60,.25)' : 'rgba(139, 94, 60,.25)';
  iconTag.className = success ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
  iconTag.style.color = success ? '#8B5E3C' : '#8B5E3C';
  document.getElementById('applyAlertTitle').textContent = title;
  document.getElementById('applyAlertMessage').textContent = message || 'Please check your application details.';
  document.getElementById('applyAlertOverlay').style.display = 'flex';
}

function closeApplyAlert() {
  document.getElementById('applyAlertOverlay').style.display = 'none';
}

document.getElementById('applyAlertOverlay').addEventListener('click', function(event) {
  if (event.target === this) closeApplyAlert();
});

window.alert = function(message) {
  showApplyAlert('Application Alert', message, false);
};

function trackerEscape(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

document.getElementById('applicationTrackerForm').addEventListener('submit', async function(event) {
  event.preventDefault();
  const button = document.getElementById('trackerButton');
  const box = document.getElementById('trackerResult');
  button.disabled = true;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
  box.className = 'tracker-result';
  box.innerHTML = '';
  try {
    const response = await fetch('../php/applicants.php', { method: 'POST', body: new FormData(this) });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Unable to find this application.');
    const app = result.application;
    const updated = new Date(String(app.updated_at).replace(' ', 'T'));
    const updatedLabel = Number.isNaN(updated.getTime()) ? app.updated_at : updated.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
    let schedule = '';
    if (app.interview_date && app.interview_time) {
      const interview = new Date(app.interview_date + 'T' + app.interview_time);
      const interviewLabel = Number.isNaN(interview.getTime()) ? app.interview_date + ' ' + app.interview_time : interview.toLocaleString('en-PH', { dateStyle: 'full', timeStyle: 'short' });
      schedule = '<div class="tracker-schedule"><i class="fas fa-calendar-check"></i><div><b>Interview schedule</b><span>' + trackerEscape(interviewLabel) + '</span><small>' + trackerEscape(app.interview_location || 'Venue will be provided by HR') + '</small></div></div>';
    }
    const waiting = Number(app.waiting_days) >= 7 ? '<div class="tracker-wait"><i class="fas fa-circle-info"></i> Waiting ' + Number(app.waiting_days) + ' days since the last update. HR has been flagged for follow-up.</div>' : '';
    box.className = 'tracker-result show';
    box.innerHTML = '<div class="tracker-status"><span>Application ' + trackerEscape(app.application_code) + '</span><strong>' + trackerEscape(app.status_label) + '</strong></div><p>' + trackerEscape(app.message) + '</p><div class="tracker-meta"><span><i class="fas fa-user"></i> ' + trackerEscape(app.applicant_name) + '</span><span><i class="fas fa-briefcase"></i> ' + trackerEscape(app.position) + '</span><span><i class="fas fa-clock"></i> Last updated: ' + trackerEscape(updatedLabel) + '</span></div>' + schedule + waiting;
  } catch (error) {
    box.className = 'tracker-result show error';
    box.innerHTML = '<p><i class="fas fa-circle-exclamation"></i> ' + trackerEscape(error.message) + '</p>';
  } finally {
    button.disabled = false;
    button.innerHTML = '<i class="fas fa-arrow-right"></i> Check Status';
  }
});

// Floating label animation on focus
document.querySelectorAll('.float-input input, .float-input textarea, .float-input select').forEach(input => {
    input.addEventListener('focus', function() {
        this.closest('.input').classList.add('focused');
    });
    input.addEventListener('blur', function() {
        if (!this.value) {
            this.closest('.input').classList.remove('focused');
        }
    });
});

// Keep focused class if select has a value
document.querySelectorAll('.float-input select').forEach(select => {
    if (select.value) {
        select.closest('.input').classList.add('focused');
    }
    select.addEventListener('change', function() {
        if (this.value) {
            this.closest('.input').classList.add('focused');
        } else {
            this.closest('.input').classList.remove('focused');
        }
    });
});

// Date input: keep focused if has value
document.querySelectorAll('input[type="date"]').forEach(input => {
    if (input.value) {
        input.closest('.input').classList.add('focused');
    }
    input.addEventListener('change', function() {
        if (this.value) {
            this.closest('.input').classList.add('focused');
        } else {
            this.closest('.input').classList.remove('focused');
        }
    });
});

// File Upload Interaction
function setupFileUpload(areaId, inputId) {
  const area = document.getElementById(areaId);
  const input = document.getElementById(inputId);

  area.addEventListener('click', function() { input.click(); });

  area.addEventListener('dragover', function(e) {
    e.preventDefault(); this.classList.add('drag-over');
  });

  area.addEventListener('dragleave', function() {
    this.classList.remove('drag-over');
  });

  area.addEventListener('drop', function(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    if (e.dataTransfer.files.length) {
      input.files = e.dataTransfer.files;
      updateFileText(area, e.dataTransfer.files[0].name);
    }
  });

  input.addEventListener('change', function() {
    if (this.files.length) updateFileText(area, this.files[0].name);
  });
}

function updateFileText(area, filename) {
  const text = area.querySelector('.file-upload-text');
  text.innerHTML = `<i class="fas fa-check-circle" style="color: #C9A17A;"></i> ${filename}`;
  area.style.borderColor = '#C9A17A';
  area.style.background = 'rgba(201, 161, 122, 0.05)';
}

setupFileUpload('resumeArea', 'resume');

document.getElementById('contactNo')?.addEventListener('input', function() {
  this.value = this.value.replace(/\D/g, '').slice(0, 11);
});

let publishedJobPosts = [];
let branchLocationMap;
let branchLocationMarkers = [];

function escapeApplyHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function initializeBranchLocationMap() {
  if (!document.getElementById('branchLocationMap')) return;
  if (branchLocationMap) return;

  const caviteCenter = [14.2794, 120.8831];
  branchLocationMap = L.map('branchLocationMap', {
    zoomControl: true,
    scrollWheelZoom: true,
    dragging: true,
    doubleClickZoom: true,
    maxZoom: 18,
    minZoom: 9,
    maxBounds: [[13.8, 120.4], [14.8, 121.8]],
    maxBoundsViscosity: 1.0
  }).setView(caviteCenter, 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(branchLocationMap);

  setTimeout(() => branchLocationMap.invalidateSize(), 250);
}

function scrollToBranchVacancies(branchId) {
  if (!branchId) return;
  const targetCard = document.querySelector('.vacancy-card[data-branch-id="' + String(branchId) + '"]');
  if (!targetCard) return;
  targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  targetCard.style.outline = '2px solid rgba(201, 161, 122, 0.9)';
  targetCard.style.outlineOffset = '4px';
  targetCard.style.borderRadius = '12px';
  setTimeout(() => {
    targetCard.style.outline = '';
    targetCard.style.outlineOffset = '';
    targetCard.style.borderRadius = '';
  }, 1800);
}

function renderBranchLocationMap(branches) {
  if (!branchLocationMap) initializeBranchLocationMap();
  if (!branchLocationMap || !Array.isArray(branches) || !branches.length) return;

  branchLocationMarkers.forEach(marker => marker.remove());
  branchLocationMarkers = [];

  const validBranches = branches.filter(branch => {
    const lat = parseFloat(branch.latitude);
    const lng = parseFloat(branch.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  });

  if (!validBranches.length) return;

  validBranches.forEach(branch => {
    const lat = parseFloat(branch.latitude);
    const lng = parseFloat(branch.longitude);
    const marker = L.marker([lat, lng]).addTo(branchLocationMap);
    const popupHtml = '<div style="font-family: Poppins, sans-serif; color: #2B1F18; min-width: 170px;">' +
      '<strong style="display:block; margin-bottom:4px;">' + escapeApplyHtml(branch.name || 'Quadra Cafe') + '</strong>' +
      '<span style="display:block; font-size: 11px; color: #8B5E3C;">' + escapeApplyHtml(branch.location || 'Cavite, Philippines') + '</span>' +
      '</div>';
    marker.bindPopup(popupHtml);
    marker.on('click', function() {
      scrollToBranchVacancies(branch.id);
    });
    branchLocationMarkers.push(marker);
  });

  const bounds = L.latLngBounds(validBranches.map(branch => [parseFloat(branch.latitude), parseFloat(branch.longitude)]));
  branchLocationMap.fitBounds(bounds, { padding: [22, 22], maxZoom: 12 });
}

async function loadBranchLocationMap() {
  if (!document.getElementById('branchLocationMap')) return;
  try {
    const response = await fetch('../php/branches.php?action=public_list', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load branch locations.');
    renderBranchLocationMap(result.branches || []);
  } catch (error) {
    const mapNode = document.getElementById('branchLocationMap');
    if (mapNode) mapNode.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;padding:20px;color:#8B5E3C;font-size:12px;">Branch map unavailable right now.</div>';
  }
}

function renderPublishedVacancies() {
  const list = document.getElementById('vacancyList');
  if (!list) return;
  if (!publishedJobPosts.length) {
    list.innerHTML = '<div class="vacancy-empty"><i class="fas fa-briefcase"></i><h4>No Published Vacancies</h4><p>There are no job openings available right now. Please check again later.</p></div>';
    return;
  }

  list.innerHTML = publishedJobPosts.map(post => {
    const remaining = Number(post.remaining || 0);
    const needed = Number(post.applicants_needed || 0);
    const isFull = needed > 0 ? remaining < 1 : false;
    const statusLabel = needed > 0
      ? (isFull ? 'Currently Full' : remaining + ' of ' + needed + ' needed')
      : 'Applicants needed not set';

    const positionLabel = post.position_key === 'barista' ? 'barista' : post.position_key === 'cashier' ? 'cashier' : 'staff';

    return '<article class="vacancy-card" data-branch-id="' + Number(post.branch_id || 0) + '">' +
      '<div class="vacancy-card-head"><div class="vacancy-card-title"><i class="fas fa-mug-hot"></i><div><h4>' + escapeApplyHtml(post.title) + '</h4><small>Quadra Cafe</small></div></div>' +
      '<span class="vacancy-slots' + (isFull ? ' full' : '') + '">' + escapeApplyHtml(statusLabel) + '</span></div>' +
      '<div class="vacancy-salary"><i class="fas fa-peso-sign"></i> ' + escapeApplyHtml(post.salary) + '</div>' +
      '<div class="vacancy-branch"><i class="fas fa-map-marker-alt"></i> ' + escapeApplyHtml(post.branch_name ? post.branch_name + ' • ' + post.branch_location : 'Branch information unavailable') + '</div>' +
      '<div class="vacancy-branch"><i class="fas fa-users"></i> ' + escapeApplyHtml(needed > 0 ? ('Needs ' + needed + ' ' + positionLabel) : 'Applicants needed not set') + '</div>' +
      '<div class="vacancy-detail"><strong>Qualifications</strong><p>' + escapeApplyHtml(post.qualification) + '</p></div>' +
      '<div class="vacancy-detail"><strong>Job Description</strong><p>' + escapeApplyHtml(post.description) + '</p></div>' +
      '<button type="button" class="vacancy-apply-btn" onclick="selectPublishedVacancy(' + Number(post.id) + ')"' + (isFull ? ' disabled' : '') + '>' +
      '<i class="fas fa-paper-plane"></i> ' + (isFull ? 'Position Full' : 'Apply for this Job') + '</button></article>';
  }).join('');
}

function selectPublishedVacancy(id) {
  const post = publishedJobPosts.find(item => Number(item.id) === Number(id));
  if (!post || Number(post.remaining) < 1) return;
  document.getElementById('job_post_id').value = String(post.id);
  document.getElementById('position').value = String(post.position_key || post.title || '');
  document.getElementById('selectedVacancyTitle').textContent = post.title || 'Selected Vacancy';
  document.getElementById('vacancyView').style.display = 'none';
  document.getElementById('applicationView').style.display = 'block';
  document.querySelector('.right')?.scrollTo({ top: 0, behavior: 'smooth' });
  history.replaceState(null, '', '#apply-' + post.position_key);
}

function showVacancies() {
  document.getElementById('applicationView').style.display = 'none';
  document.getElementById('vacancyView').style.display = 'block';
  document.querySelector('.right')?.scrollTo({ top: 0, behavior: 'smooth' });
  history.replaceState(null, '', location.pathname);
}

async function loadPublishedVacancies() {
  const list = document.getElementById('vacancyList');
  try {
    const response = await fetch('../php/job_posts.php?action=open');
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Unable to load job openings.');
    publishedJobPosts = result.posts || [];
    renderPublishedVacancies();
  } catch (error) {
    if (list) list.innerHTML = '<div class="vacancy-empty"><i class="fas fa-triangle-exclamation"></i><h4>Vacancies Unavailable</h4><p>Unable to load published job openings. Please refresh the page.</p></div>';
  }
}
loadPublishedVacancies();
loadBranchLocationMap();

// Populate year selects
function populateYearSelects() {
  const currentYear = new Date().getFullYear();
  ['yearGrad', 'highSchoolYear', 'vocYear'].forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;
    for (let y = currentYear; y >= 1970; y--) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      select.appendChild(opt);
    }
  });
}
populateYearSelects();

// Set max date for birthdate to enforce 18 years old minimum
function setBirthdateMax() {
  const today = new Date();
  const minAge = 18;
  const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  const maxDateStr = maxDate.toISOString().split('T')[0];
  document.getElementById('birthdate').setAttribute('max', maxDateStr);
}
setBirthdateMax();

// Go to Step
function goToStep(step) {
  if (step > currentStep) {
    if (!validateStep(currentStep)) return;
  }

  currentStep = step;

  document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
  document.querySelector(`.form-step[data-step="${step}"]`).classList.add('active');

  document.querySelectorAll('.step').forEach(el => {
    const s = parseInt(el.dataset.step);
    el.classList.remove('active', 'completed');
    if (s === step) el.classList.add('active');
    else if (s < step) el.classList.add('completed');
  });

  const visibleSteps = Array.from(document.querySelectorAll('.progress-steps .step'));
  const activeProgressIndex = visibleSteps.findIndex(item => Number(item.dataset.step) === step);
  document.querySelectorAll('.step-connector').forEach((connector, index) => {
    if (index < activeProgressIndex) connector.classList.add('completed');
    else connector.classList.remove('completed');
  });

  if (step === 4 || step === 5) updateReview();
}

// Validate
function validateStep(step) {
  let valid = true;

  if (step === 1) {
    const textFields = [
      { el: document.getElementById('firstName'), min: 1 },
      { el: document.getElementById('lastName'), min: 1 },
      { el: document.getElementById('birthdate'), min: 1, isDate: true },
      { el: document.getElementById('email'), min: 1 },
      { el: document.getElementById('contactNo'), min: 11, isPhone: true },
      { el: document.getElementById('address'), min: 5 },
    ];

    textFields.forEach(f => {
      const value = String(f.el?.value || '').trim();
      const inputWrapper = f.el?.closest?.('.input');

      if (!value || value.length < f.min) {
        if (inputWrapper) inputWrapper.classList.add('error');
        valid = false;
        return;
      }

      if (f.isPhone) {
        const phoneDigits = value.replace(/\D/g, '');
        if (phoneDigits.length !== 11) {
          if (inputWrapper) inputWrapper.classList.add('error');
          const errorMsg = inputWrapper?.querySelector('.error-msg');
          if (errorMsg) {
            errorMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Must be exactly 11 digits';
          }
          valid = false;
          return;
        }
      }

      if (f.isDate) {
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 18) {
          if (inputWrapper) inputWrapper.classList.add('error');
          const errorMsg = inputWrapper?.querySelector('.error-msg');
          if (errorMsg) {
            errorMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Must be at least 18 years old';
          }
          valid = false;
          return;
        }
      }

      if (inputWrapper) {
        inputWrapper.classList.remove('error');
        const errorMsg = inputWrapper.querySelector('.error-msg');
        if (errorMsg) {
          errorMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Required';
        }
      }
    });

    const selectedJobPost = document.getElementById('job_post_id');
    if (!selectedJobPost || !selectedJobPost.value.trim()) {
      const vacancyNotice = document.querySelector('.vacancy-list');
      if (vacancyNotice) vacancyNotice.scrollIntoView({ behavior: 'smooth', block: 'center' });
      valid = false;
    }
  }

  if (step === 3) {
    const resume = document.getElementById('resume');
    if (!resume.files || resume.files.length < 1) {
      resume.closest('.input').classList.add('error');
      valid = false;
    } else {
      const fileName = resume.files[0].name.toLowerCase();
      if (!/\.(pdf|doc|docx|jpg|jpeg)$/.test(fileName)) {
        resume.closest('.input').classList.add('error');
        alert('Resume must be PDF, DOC, DOCX, JPG, or JPEG only.');
        valid = false;
      } else {
        resume.closest('.input').classList.remove('error');
      }
    }

    const certify = document.getElementById('docCertify');
    if (!certify.checked) { certify.closest('.agreement').classList.add('error'); valid = false; }
    else certify.closest('.agreement').classList.remove('error');
  }

  if (step === 4) {
    const agree = document.getElementById('agreeCheck');
    if (!agree.checked) { agree.closest('.agreement').classList.add('error'); valid = false; }
    else agree.closest('.agreement').classList.remove('error');
  }

  if (!valid) {
    const firstError = document.querySelector('.form-step.active .input.error');
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return valid;
}

// Update Review
function updateReview() {
  const first = document.getElementById('firstName').value || '';
  const middle = document.getElementById('middleName').value || '';
  const last = document.getElementById('lastName').value || '';
  document.getElementById('reviewName').textContent = `${first} ${middle} ${last}`.trim();

  const gen = document.getElementById('gender');
  document.getElementById('reviewGender').textContent = gen.options[gen.selectedIndex]?.text || '—';

  const stat = document.getElementById('civilStatus');
  document.getElementById('reviewStatus').textContent = stat.options[stat.selectedIndex]?.text || '—';

  document.getElementById('reviewBirthdate').textContent = document.getElementById('birthdate').value || '—';
  document.getElementById('reviewEmail').textContent = document.getElementById('email').value || '—';
  document.getElementById('reviewContact').textContent = document.getElementById('contactNo').value || '—';
  document.getElementById('reviewAddress').textContent = document.getElementById('address').value || '—';

  const selectedPost = publishedJobPosts.find(post => String(post.id) === String(document.getElementById('job_post_id').value));
  document.getElementById('reviewPosition').textContent = selectedPost?.title || '—';
  document.getElementById('reviewBranch').textContent = selectedPost ? (selectedPost.branch_name ? selectedPost.branch_name + ' • ' + selectedPost.branch_location : 'Assigned branch') : '—';

  const edu = document.getElementById('education');
  document.getElementById('reviewEducation').textContent = edu.options[edu.selectedIndex]?.text || '—';
  document.getElementById('reviewSchool').textContent = document.getElementById('school').value || '—';
  document.getElementById('reviewCourse').textContent = document.getElementById('course').value || '—';
  document.getElementById('reviewYearGrad').textContent = document.getElementById('yearGrad').value || '—';

  document.getElementById('reviewEmpType').textContent = 'Full Time';

  const exp = document.getElementById('yearsExp');
  document.getElementById('reviewExp').textContent = exp.options[exp.selectedIndex]?.text || '—';

  document.getElementById('reviewShift').textContent = '8:00 AM - 5:00 PM';

  const resumeFile = document.getElementById('resume').files[0];
  document.getElementById('reviewResume').textContent = resumeFile ? resumeFile.name : 'Not uploaded';
}

// Submit application to the database.
async function saveApplication() {
  const getVal = id => (document.getElementById(id)?.value || '').trim();
  const data = new FormData();
  const fields = { action: 'submit', job_post_id: getVal('job_post_id'), first_name: getVal('firstName'), middle_name: getVal('middleName'), last_name: getVal('lastName'), birthdate: getVal('birthdate'), gender: getVal('gender'), civil_status: getVal('civilStatus'), email: getVal('email'), contact_no: getVal('contactNo'), address: getVal('address'), position: getVal('position'), employment_type: getVal('employmentType'), years_experience: getVal('yearsExp'), preferred_shift: getVal('shift') };
  Object.entries(fields).forEach(([key, value]) => data.append(key, value));
  data.append('resume', document.getElementById('resume').files[0]);
  const response = await fetch('../php/applicants.php', { method: 'POST', body: data });
  const responseText = await response.text();
  let result;
  try {
    result = JSON.parse(responseText);
  } catch (error) {
    throw new Error('The server returned an invalid response. Please refresh the page and try again.');
  }
  if (!response.ok || !result.success) throw new Error(result.message || 'Unable to submit application.');
  return result.application_code;
}

// Submit
const form = document.getElementById('applyForm');
const agreeCheck = document.getElementById('agreeCheck');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');
const submitBtn = document.getElementById('submitBtn');

form.addEventListener('submit', async function(e) {
    e.preventDefault();
    let invalidStep = 0;
    for (let step = 1; step <= 4; step++) {
        if (!validateStep(step) && invalidStep === 0) invalidStep = step;
    }

    const valid = invalidStep === 0;
    if (!valid) {
        goToStep(invalidStep);
        showApplyAlert('Incomplete Application', 'Please complete the highlighted required fields before submitting.');
        return;
    }

    if (valid) {
        btnText.style.display = 'none';
        btnSpinner.style.display = 'inline-block';
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');

        try {
            const applicationCode = await saveApplication();
            btnText.style.display = 'inline';
            btnSpinner.style.display = 'none';
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');

            const now = new Date();
            document.getElementById('submitDate').textContent =
                now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) +
                ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            document.getElementById('applicationId').textContent = applicationCode;

            goToStep(5);
            document.querySelectorAll('.float-input input, .float-input textarea, .float-input select').forEach(input => {
                input.closest('.input').classList.remove('focused');
            });
        } catch (error) {
            btnText.style.display = 'inline';
            btnSpinner.style.display = 'none';
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            alert(error.message);
        }
    }
});

// Remove error on input
document.querySelectorAll('.float-input input, .float-input textarea, .float-input select').forEach(input => {
    input.addEventListener('input', function() { this.closest('.input').classList.remove('error'); });
    input.addEventListener('change', function() { this.closest('.input').classList.remove('error'); });
});

agreeCheck.addEventListener('change', function() { this.closest('.agreement').classList.remove('error'); });

