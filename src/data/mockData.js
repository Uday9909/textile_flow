// ============================================================
// TextileFlow MES — Mock Data
// ============================================================

// Stage Pool — all possible stages with metadata
export const STAGE_POOL = [
  { id: 'grey', name: 'Grey', accent: '#9ca3af', expectedHours: 0.5 },
  { id: 'batching', name: 'Batching', accent: '#f59e0b', expectedHours: 1.5 },
  { id: 'scouring', name: 'Scouring', accent: '#14b8a6', expectedHours: 2 },
  { id: 'bleaching', name: 'Bleaching', accent: '#e2e8f0', expectedHours: 3 },
  { id: 'dyeing', name: 'Dyeing', accent: '#d97706', expectedHours: 4 },
  { id: 'hydro', name: 'Hydro', accent: '#06b6d4', expectedHours: 1 },
  { id: 'drying', name: 'Drying', accent: '#f97316', expectedHours: 2 },
  { id: 'printing', name: 'Printing', accent: '#ec4899', expectedHours: 3 },
  { id: 'brushing', name: 'Brushing', accent: '#0891b2', expectedHours: 1.5 },
  { id: 'compacting', name: 'Compacting', accent: '#64748b', expectedHours: 1 },
  { id: 'anti_pilling', name: 'Anti Pilling', accent: '#84cc16', expectedHours: 1.5 },
  { id: 'finishing', name: 'Finishing', accent: '#0d9488', expectedHours: 2 },
  { id: 'packing', name: 'Packing', accent: '#10b981', expectedHours: 1 },
  { id: 'dispatch', name: 'Dispatch', accent: '#22d3ee', expectedHours: 0.5 },
];

export const getStageById = (id) => STAGE_POOL.find(s => s.id === id);

// Default rates per process (₹/kg)
export const DEFAULT_RATES = {
  grey: 1,
  batching: 2,
  scouring: 4,
  bleaching: 5,
  dyeing: 12,
  hydro: 2,
  drying: 3,
  printing: 8,
  brushing: 2,
  compacting: 3,
  anti_pilling: 4,
  finishing: 5,
  packing: 1.5,
  dispatch: 0,
};

// Party-specific rate overrides
export const PARTY_RATES = {
  'Satya International': {
    dyeing: 14,
    finishing: 6,
    compacting: 3.5,
  },
  'Rajan Textiles': {
    dyeing: 11,
    brushing: 2.5,
  },
};

// Fabric types
export const FABRIC_TYPES = [
  'Cotton',
  'Polyester',
  'Cotton-Poly Blend',
  'Rayon',
  'Viscose',
  'Nylon',
  'Silk',
  'Linen',
  'Denim',
  'Fleece',
  'Terry Cotton',
  'Knitted Fabric',
];

// Department capacity (how many lots can be in-process simultaneously)
export const DEPT_CAPACITY = {
  grey: 2,
  batching: 2,
  scouring: 1,
  bleaching: 1,
  dyeing: 2,
  hydro: 3,
  drying: 3,
  printing: 1,
  brushing: 1,
  compacting: 1,
  anti_pilling: 1,
  finishing: 2,
  packing: 2,
  dispatch: 1,
};

// Workflow Templates
export const WORKFLOW_TEMPLATES = [
  {
    id: 'template_a',
    name: 'Template A — Standard Dyeing',
    description: 'Full dyeing workflow with hydro extraction and drying',
    stages: ['grey', 'batching', 'dyeing', 'hydro', 'drying', 'finishing', 'packing', 'dispatch'],
  },
  {
    id: 'template_b',
    name: 'Template B — Scouring & Dyeing',
    description: 'Scouring process before dyeing with brushing and compacting',
    stages: ['grey', 'scouring', 'dyeing', 'brushing', 'compacting', 'packing', 'dispatch'],
  },
  {
    id: 'template_c',
    name: 'Template C — Bleaching & Printing',
    description: 'Bleaching and printing workflow for patterned fabrics',
    stages: ['grey', 'bleaching', 'printing', 'finishing', 'packing', 'dispatch'],
  },
];

// Parties
export const PARTIES = [
  'Satya International',
  'Rajan Textiles',
  'Gupta Fabrics Pvt. Ltd.',
  'Sharma & Sons Exports',
  'Krishna Mills',
  'Naveen Dyeing Works',
  'Udaybir Singh',
];

// Sample lots at various stages
export const INITIAL_LOTS = [];

// Helper: get rate for a party + process
export function getRate(partyName, stageId) {
  const partyOverride = PARTY_RATES[partyName];
  if (partyOverride && partyOverride[stageId] !== undefined) {
    return { rate: partyOverride[stageId], source: 'Contract Rate' };
  }
  return { rate: DEFAULT_RATES[stageId] || 0, source: 'Standard Rate' };
}

// Helper: calculate total charges for a lot
export function calculateCharges(lot) {
  const charges = [];
  for (const stageId of lot.stages) {
    if (stageId === 'dispatch') continue; // No charge for dispatch
    const { rate, source } = getRate(lot.partyName, stageId);
    if (rate > 0) {
      const stage = getStageById(stageId);
      charges.push({
        stageId,
        stageName: stage?.name || stageId,
        rate,
        source,
        amount: Math.round(rate * lot.quantity * 100) / 100,
      });
    }
  }
  const total = charges.reduce((sum, c) => sum + c.amount, 0);
  return { charges, total: Math.round(total * 100) / 100 };
}

// Helper: generate unique ID
export function generateId() {
  return 'lot_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
}

// Helper: generate lot number
let lotCounter = 21118;
export function generateLotNumber() {
  return String(lotCounter++);
}
