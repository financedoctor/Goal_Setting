// ── Financial Calculation Engine ───────────────────────────────────
// Mirrors the Excel formulas in Formula_Reference_Guide.docx

/**
 * Parse a "Mon-YYYY" string or "Immediate" into months from today.
 * Returns 0 if blank/invalid.
 */
function parseMonths(raw) {
  if (!raw || raw.trim() === '') return 0;
  const s = raw.trim();
  if (s.toLowerCase() === 'immediate') return 1;

  // Accept "Mon-YYYY" or "MM/YYYY" or full date
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Try Mon-YYYY
  const m1 = s.match(/^([A-Za-z]{3})-(\d{4})$/);
  if (m1) {
    const mo = monthNames.findIndex(m => m.toLowerCase() === m1[1].toLowerCase());
    if (mo === -1) return 0;
    const target = new Date(+m1[2], mo, 1);
    const today  = new Date(); today.setDate(1); today.setHours(0,0,0,0);
    const diff = (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth());
    return Math.max(1, diff);
  }

  // Try YYYY-MM or MM/YYYY
  const m2 = s.match(/^(\d{4})-(\d{1,2})$/) || s.match(/^(\d{1,2})\/(\d{4})$/);
  if (m2) {
    let yr, mo;
    if (s.includes('-')) { yr = +m2[1]; mo = +m2[2] - 1; }
    else                 { mo = +m2[1] - 1; yr = +m2[2]; }
    const target = new Date(yr, mo, 1);
    const today  = new Date(); today.setDate(1); today.setHours(0,0,0,0);
    const diff = (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth());
    return Math.max(1, diff);
  }

  // Try native date
  const d = new Date(s);
  if (!isNaN(d)) {
    const today = new Date(); today.setDate(1); today.setHours(0,0,0,0);
    d.setDate(1);
    const diff = (d.getFullYear() - today.getFullYear()) * 12 + (d.getMonth() - today.getMonth());
    return Math.max(1, diff);
  }

  return 0;
}

/**
 * Return rate lookup based on months remaining (Section 1B).
 */
function getReturnRate(months, s) {
  if (months === 0)        return 0;
  if (months <= 12)        return s.r1 / 100;
  if (months <= 24)        return s.r2 / 100;
  if (months <= 36)        return s.r3 / 100;
  if (months <= 120)       return s.r4 / 100;
                           return s.r5 / 100;
}

/**
 * Excel FV(rate, nper, pmt, pv) → future value.
 * rate = periodic rate, nper = periods, pmt = payment, pv = present value.
 */
function excelFV(rate, nper, pmt, pv) {
  if (rate === 0) return -(pv + pmt * nper);
  const factor = Math.pow(1 + rate, nper);
  return -(pv * factor + pmt * ((factor - 1) / rate));
}

/**
 * Excel PMT(rate, nper, pv, fv) → periodic payment.
 */
function excelPMT(rate, nper, pv, fv) {
  fv = fv || 0;
  if (rate === 0) return -(pv + fv) / nper;
  const factor = Math.pow(1 + rate, nper);
  return -(pv * factor + fv) / ((factor - 1) / rate);
}

/**
 * Excel PV(rate, nper, pmt, fv) → present value.
 */
function excelPV(rate, nper, pmt, fv) {
  fv = fv || 0;
  if (rate === 0) return -(fv + pmt * nper);
  const factor = Math.pow(1 + rate, nper);
  return -(fv + pmt * ((factor - 1) / rate)) / factor;
}

/**
 * Round to nearest 500, minimum 1000.
 */
function roundTo500(val) {
  return Math.max(1000, Math.round(val / 500) * 500);
}

/**
 * Calculate target amount for a standard goal (Section 1C).
 */
function calcTargetStandard(currentVal, months, s) {
  if (months === 0 || currentVal === 0) return null;
  const rate = s.inflation / 100 / 12;
  return excelFV(rate, months, 0, -currentVal);
}

/**
 * Calculate target for Retirement Corpus (Section 1D).
 */
function calcTargetRetirement(units, months, s) {
  if (months === 0 || units === 0) return null;
  const monthlyNeed = units * s.retMult;
  const inflRate = s.inflation / 100 / 12;
  const futureMonthlyNeed = excelFV(inflRate, months, 0, -monthlyNeed);
  const annualNeed = futureMonthlyNeed * 12;
  return annualNeed / (s.retRate / 100);
}

/**
 * Required SIP (Section 1E).
 */
function calcSIP(target, months, s) {
  if (target === null || months === 0) return null;
  const rate = getReturnRate(months, s) / 12;
  const pmt = excelPMT(rate, months, 0, target);
  return roundTo500(-pmt);
}

/**
 * Required Lump Sum (Section 1F).
 */
function calcLumpSum(target, months, s) {
  if (target === null || months === 0) return null;
  const rate = getReturnRate(months, s) / 12;
  const pv = excelPV(rate, months, 0, target);
  return roundTo500(-pv);
}

/**
 * Projection at maturity given SIP + LM contribution (Section 2B).
 */
function calcProjection(months, ratePct, sipAmt, lmAmt) {
  if (months === 0) return 0;
  const rate = ratePct / 12;
  const sip = sipAmt || 0;
  const lm  = lmAmt  || 0;
  if (sip === 0 && lm === 0) return 0;
  return excelFV(rate, months, -sip, -lm);
}

/**
 * Compute all derived values for a single goal row.
 */
function computeGoalRow(goal, s) {
  const months = parseMonths(goal.targetDate);
  const currentVal = parseFloat(goal.currentVal) || 0;

  let target = null;
  if (goal.isRetirement) {
    target = calcTargetRetirement(currentVal, months, s);
  } else {
    target = calcTargetStandard(currentVal, months, s);
  }

  const reqSIP = calcSIP(target, months, s);
  const reqLM  = calcLumpSum(target, months, s);
  const returnRate = getReturnRate(months, s);

  return { months, target, reqSIP, reqLM, returnRate };
}

/**
 * Compute projection & status for a priority row.
 */
function computePriorityRow(pr, goalData, s) {
  if (!pr.goalId) return { projection: 0, target: null, status: 'na', addlSIP: null, addlLM: null };

  const gd = goalData[pr.goalId];
  if (!gd) return { projection: 0, target: null, status: 'na', addlSIP: null, addlLM: null };

  const { months, target, returnRate } = gd;
  const userSIP = parseFloat(pr.userSIP) || 0;
  const userLM  = parseFloat(pr.userLM)  || 0;

  if (months === 0 || target === null) return { projection: 0, target: null, status: 'na', addlSIP: null, addlLM: null };

  const projection = calcProjection(months, returnRate * 100, userSIP, userLM);
  const onTrack = projection >= target;

  // Additional SIP needed (holding LM constant)
  let addlSIP = null;
  if (!onTrack && months > 0) {
    const rate = returnRate / 12;
    const lmFV = excelFV(rate, months, 0, -userLM);
    const shortfall = target - lmFV;
    if (shortfall > 0) {
      const pmt = excelPMT(rate, months, 0, shortfall);
      addlSIP = roundTo500(-pmt);
    }
  }

  // Additional LM needed (holding SIP constant)
  let addlLM = null;
  if (!onTrack && months > 0) {
    const rate = returnRate / 12;
    const sipFV = excelFV(rate, months, -userSIP, 0);
    const shortfall = target - sipFV;
    if (shortfall > 0) {
      const pv = excelPV(rate, months, 0, shortfall);
      addlLM = roundTo500(-pv);
    }
  }

  return { projection, target, status: onTrack ? 'on' : 'off', addlSIP, addlLM };
}