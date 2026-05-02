// ── Default Settings ──────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  inflation: 6,     // %
  r1: 5,   // ≤12 mo
  r2: 8,   // 13-24
  r3: 9,   // 25-36
  r4: 11,  // 37-120
  r5: 10,  // >120
  retMult: 100000,
  retRate: 6,       // % withdrawal
};

// ── Goal Template List ─────────────────────────────────────────────
const GOAL_TEMPLATES = [
  { id: 'liquidity',    label: 'Liquidity / Emergency Fund',    isRetirement: false, childGoal: false },
  { id: 'primary',     label: 'Primary Residence',              isRetirement: false, childGoal: false },
  { id: 'secondary',   label: 'Secondary Residence / Plot',     isRetirement: false, childGoal: false },
  { id: 'retirement',  label: 'Retirement Corpus',              isRetirement: true,  childGoal: false },
  { id: 'c1edu',       label: 'Child 1 – Education',            isRetirement: false, childGoal: true,  childIdx: 1 },
  { id: 'c1marry',     label: 'Child 1 – Marriage',             isRetirement: false, childGoal: true,  childIdx: 1 },
  { id: 'c2edu',       label: 'Child 2 – Education',            isRetirement: false, childGoal: true,  childIdx: 2 },
  { id: 'c2marry',     label: 'Child 2 – Marriage',             isRetirement: false, childGoal: true,  childIdx: 2 },
  { id: 'c3edu',       label: 'Child 3 – Education',            isRetirement: false, childGoal: true,  childIdx: 3 },
  { id: 'c3marry',     label: 'Child 3 – Marriage',             isRetirement: false, childGoal: true,  childIdx: 3 },
  { id: 'asp1',        label: 'Aspiration Goal 1',              isRetirement: false, childGoal: false, custom: true },
  { id: 'asp2',        label: 'Aspiration Goal 2',              isRetirement: false, childGoal: false, custom: true },
  { id: 'asp3',        label: 'Aspiration Goal 3',              isRetirement: false, childGoal: false, custom: true },
  { id: 'asp4',        label: 'Aspiration Goal 4',              isRetirement: false, childGoal: false, custom: true },
  { id: 'cust1',       label: 'Custom Goal 1',                  isRetirement: false, childGoal: false, custom: true, userLabel: true },
  { id: 'cust2',       label: 'Custom Goal 2',                  isRetirement: false, childGoal: false, custom: true, userLabel: true },
  { id: 'cust3',       label: 'Custom Goal 3',                  isRetirement: false, childGoal: false, custom: true, userLabel: true },
  { id: 'cust4',       label: 'Custom Goal 4',                  isRetirement: false, childGoal: false, custom: true, userLabel: true },
  { id: 'cust5',       label: 'Custom Goal 5',                  isRetirement: false, childGoal: false, custom: true, userLabel: true },
  { id: 'cust6',       label: 'Custom Goal 6',                  isRetirement: false, childGoal: false, custom: true, userLabel: true },
];

// Number of priority slots in Section 2
const PRIORITY_COUNT = 8;

// Palette for charts
const CHART_PALETTE = [
  '#0d7377','#c9952a','#c0392b','#1e8449','#8e44ad',
  '#2980b9','#d35400','#27ae60','#e74c3c','#f39c12',
  '#16a085','#2c3e50','#7f8c8d','#6c5ce7','#fd79a8',
  '#00b894','#e17055','#a29bfe','#fdcb6e','#fab1a0',
];