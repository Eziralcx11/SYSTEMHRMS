


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
  