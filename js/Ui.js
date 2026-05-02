// ── Formatting helpers ────────────────────────────────────────────
function fmtINR(val, decimals = 0) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return '₹' + Number(val).toLocaleString('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  });
}
function fmtINRShort(val) {
  if (val === null || isNaN(val)) return '—';
  if (val >= 1e7) return '₹' + (val / 1e7).toFixed(2) + ' Cr';
  if (val >= 1e5) return '₹' + (val / 1e5).toFixed(2) + ' L';
  return fmtINR(val);
}

// ── Goal name resolver ────────────────────────────────────────────
function resolveGoalLabel(tmpl, customName) {
  if (tmpl.userLabel && customName) return customName;
  if (tmpl.childGoal && customName) {
    const base = tmpl.label.replace(/Child \d+/, customName);
    return base;
  }
  if (tmpl.custom && customName) return customName;
  return tmpl.label;
}

// ── Build Goals Table ─────────────────────────────────────────────
function buildGoalsTable(state, s) {
  const tbody = document.getElementById('goalsBody');
  tbody.innerHTML = '';

  let totalSIP = 0, totalLM = 0;

  state.goals.forEach((g, i) => {
    const tmpl = GOAL_TEMPLATES[i];
    const { months, target, reqSIP, reqLM } = computeGoalRow(g, s);

    if (reqSIP) totalSIP += reqSIP;
    if (reqLM)  totalLM  += reqLM;

    const displayLabel = resolveGoalLabel(tmpl, g.customName);
    const isCustomLabel = tmpl.userLabel;
    const isChildGoal   = tmpl.childGoal;
    const isAspiration  = tmpl.custom && !isChildGoal && !isCustomLabel;

    const targetDisplay = target ? fmtINR(target) : '<span class="calc-zero">—</span>';
    const sipDisplay    = reqSIP  ? `<span class="calc-val">${fmtINR(reqSIP)}</span>` : '<span class="calc-zero">—</span>';
    const lmDisplay     = reqLM   ? `<span class="calc-val">${fmtINR(reqLM)}</span>`  : '<span class="calc-zero">—</span>';

    const tr = document.createElement('tr');
    tr.dataset.idx = i;

    // label column - editable for custom/child goals
    const labelCell = (isCustomLabel || isAspiration)
      ? `<input class="tbl-input" data-field="customName" data-idx="${i}" value="${g.customName || ''}" placeholder="${tmpl.label}" />`
      : `<span>${tmpl.label}</span>`;

    const nameCell = (isChildGoal)
      ? `<input class="tbl-input" data-field="customName" data-idx="${i}" value="${g.customName || ''}" placeholder="Child's name…" />`
      : `<span class="hint-txt">${isCustomLabel || isAspiration ? '' : '—'}</span>`;

    tr.innerHTML = `
      <td style="color:var(--ink-light);font-size:.78rem;">${i + 1}</td>
      <td>${isCustomLabel || isAspiration ? labelCell : `<strong>${displayLabel}</strong>`}</td>
      <td>${nameCell}</td>
      <td><input class="tbl-input yellow-input" type="number" data-field="currentVal" data-idx="${i}"
            value="${g.currentVal || ''}" min="0" step="1000"
            placeholder="${tmpl.isRetirement ? 'units' : '₹'}" style="max-width:130px;" /></td>
      <td><input class="tbl-input yellow-input" data-field="targetDate" data-idx="${i}"
            value="${g.targetDate || ''}" placeholder="Mon-YYYY or Immediate" style="max-width:150px;" /></td>
      <td>${targetDisplay}</td>
      <td>${sipDisplay}</td>
      <td>${lmDisplay}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('totalSIP').textContent = fmtINR(totalSIP);
  document.getElementById('totalLM').textContent  = fmtINR(totalLM);
}

// ── Build Priority Table ──────────────────────────────────────────
function buildPriorityTable(state, s) {
  const tbody = document.getElementById('priorityBody');
  tbody.innerHTML = '';

  // Build computed goal map
  const goalData = {};
  state.goals.forEach((g, i) => {
    const tmpl = GOAL_TEMPLATES[i];
    const computed = computeGoalRow(g, s);
    goalData[tmpl.id] = { ...computed, goal: g, tmpl };
  });

  // Build dropdown options
  const activeGoals = state.goals.map((g, i) => {
    const tmpl = GOAL_TEMPLATES[i];
    const { target } = computeGoalRow(g, s);
    if (!target && !g.targetDate) return null;
    return { id: tmpl.id, label: resolveGoalLabel(tmpl, g.customName) };
  }).filter(Boolean);

  let allocSIP = 0, allocLM = 0;

  state.priorities.forEach((pr, i) => {
    const prData = computePriorityRow(pr, goalData, s);

    if (pr.userSIP) allocSIP += parseFloat(pr.userSIP) || 0;
    if (pr.userLM)  allocLM  += parseFloat(pr.userLM)  || 0;

    const gd = pr.goalId ? goalData[pr.goalId] : null;

    // dropdown
    let opts = `<option value="">— select —</option>`;
    activeGoals.forEach(ag => {
      const sel = ag.id === pr.goalId ? 'selected' : '';
      opts += `<option value="${ag.id}" ${sel}>${ag.label}</option>`;
    });

    // display values
    const reqSIPdisp = gd && gd.reqSIP ? fmtINR(gd.reqSIP) : '—';
    const reqLMdisp  = gd && gd.reqLM  ? fmtINR(gd.reqLM)  : '—';
    const targetDate = gd && gd.goal.targetDate ? gd.goal.targetDate : '—';

    // status badge
    let badgeHtml = '<span class="badge badge-na">—</span>';
    if (prData.status === 'on')  badgeHtml = '<span class="badge badge-on">✅ On Track</span>';
    if (prData.status === 'off') badgeHtml = '<span class="badge badge-off">⚡ Invest More</span>';

    // projection
    let projHtml = '—';
    if (prData.projection && prData.target) {
      projHtml = `<strong>${fmtINRShort(prData.projection)}</strong>
        <br/><small style="color:var(--ink-light)">Target: ${fmtINRShort(prData.target)}</small>`;
    }

    const addlSIP = prData.addlSIP ? `<span style="color:var(--rose)">${fmtINR(prData.addlSIP)}</span>` : '—';
    const addlLM  = prData.addlLM  ? `<span style="color:var(--rose)">${fmtINR(prData.addlLM)}</span>`  : '—';

    const tr = document.createElement('tr');
    tr.dataset.pidx = i;
    tr.innerHTML = `
      <td><strong style="color:var(--gold)">P${i + 1}</strong></td>
      <td><select class="tbl-input" data-pfield="goalId" data-pidx="${i}">${opts}</select></td>
      <td>${targetDate}</td>
      <td style="color:var(--ink-light);font-size:.82rem;">${reqSIPdisp}</td>
      <td style="color:var(--ink-light);font-size:.82rem;">${reqLMdisp}</td>
      <td><input class="tbl-input yellow-input" type="number" data-pfield="userSIP" data-pidx="${i}"
            value="${pr.userSIP || ''}" min="0" step="500" placeholder="0" style="max-width:110px;" /></td>
      <td><input class="tbl-input yellow-input" type="number" data-pfield="userLM" data-pidx="${i}"
            value="${pr.userLM || ''}" min="0" step="1000" placeholder="0" style="max-width:110px;" /></td>
      <td>${projHtml}</td>
      <td>${badgeHtml}</td>
      <td>${addlSIP}</td>
      <td>${addlLM}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('allocSIP').textContent = fmtINR(allocSIP);
  document.getElementById('allocLM').textContent  = fmtINR(allocLM);
}

// ── Build Summary ─────────────────────────────────────────────────
function buildSummary(state, s) {
  const goalData = {};
  state.goals.forEach((g, i) => {
    const tmpl = GOAL_TEMPLATES[i];
    goalData[tmpl.id] = { ...computeGoalRow(g, s), goal: g, tmpl };
  });

  // KPIs
  let totalSIP = 0, totalLM = 0, activeCount = 0, onTrack = 0;
  state.priorities.forEach(pr => {
    if (!pr.goalId) return;
    const pd = computePriorityRow(pr, goalData, s);
    if (pr.userSIP) totalSIP += parseFloat(pr.userSIP) || 0;
    if (pr.userLM)  totalLM  += parseFloat(pr.userLM)  || 0;
    if (pd.status === 'on')  { onTrack++; activeCount++; }
    if (pd.status === 'off') { activeCount++; }
  });

  const reqTotalSIP = Object.values(goalData).reduce((a, g) => a + (g.reqSIP || 0), 0);

  document.getElementById('summaryKPIs').innerHTML = `
    <div class="kpi-card">
      <div class="kpi-icon">🎯</div>
      <div class="kpi-label">Active Goals</div>
      <div class="kpi-value highlight">${activeCount}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon">✅</div>
      <div class="kpi-label">On Track</div>
      <div class="kpi-value highlight">${onTrack} / ${activeCount}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon">📅</div>
      <div class="kpi-label">Total Req. SIP</div>
      <div class="kpi-value">${fmtINRShort(reqTotalSIP)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon">💸</div>
      <div class="kpi-label">Your SIP Deployed</div>
      <div class="kpi-value highlight">${fmtINRShort(totalSIP)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon">🏦</div>
      <div class="kpi-label">Your LM Deployed</div>
      <div class="kpi-value highlight">${fmtINRShort(totalLM)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon">📈</div>
      <div class="kpi-label">Inflation Rate</div>
      <div class="kpi-value">${s.inflation}%</div>
    </div>
  `;

  // Summary goal cards (from Section 2)
  const cardsEl = document.getElementById('summaryCards');
  cardsEl.innerHTML = '';
  state.priorities.forEach((pr, i) => {
    if (!pr.goalId) return;
    const gd = goalData[pr.goalId];
    if (!gd) return;
    const pd = computePriorityRow(pr, goalData, s);
    const label = resolveGoalLabel(gd.tmpl, gd.goal.customName);
    const statusClass = pd.status === 'on' ? 'on-track' : pd.status === 'off' ? 'off-track' : 'inactive';
    const statusLabel = pd.status === 'on' ? '✅ On Track' : pd.status === 'off' ? '⚡ Invest More' : '—';

    const card = document.createElement('div');
    card.className = `sgc ${statusClass}`;
    card.innerHTML = `
      <div class="sgc-title">P${i+1} · ${label}</div>
      <div class="sgc-row"><span class="sgc-key">Target Date</span><span class="sgc-val">${gd.goal.targetDate || '—'}</span></div>
      <div class="sgc-row"><span class="sgc-key">Target Amount</span><span class="sgc-val teal">${gd.target ? fmtINRShort(gd.target) : '—'}</span></div>
      <div class="sgc-row"><span class="sgc-key">Projection</span><span class="sgc-val">${pd.projection ? fmtINRShort(pd.projection) : '—'}</span></div>
      <div class="sgc-row"><span class="sgc-key">Your SIP</span><span class="sgc-val">${fmtINR(parseFloat(pr.userSIP)||0)}/mo</span></div>
      <div class="sgc-row"><span class="sgc-key">Your LM</span><span class="sgc-val">${fmtINR(parseFloat(pr.userLM)||0)}</span></div>
      <div class="sgc-row"><span class="sgc-key">Status</span><span class="sgc-val">${statusLabel}</span></div>
    `;
    cardsEl.appendChild(card);
  });

  return { goalData };
}

// ── Toast notification ────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}