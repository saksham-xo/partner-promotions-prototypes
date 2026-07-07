import { useState, createContext, useContext } from 'react';

const StoreContext = createContext();

const initialRules = [
  { id: 'RULE-001', name: 'High value invoice', desc: 'Flag invoices exceeding amount threshold for review', behavior: 'flag', groups: [[{ f: 'totalAmount', op: 'gte', val: '' }]], acts: ['flag_invoice', 'require_review'], on: false, by: 'Admin', at: '15 Mar, 2026' },
];

const initialInvoices = [
  // Custom alert — High value invoice (RULE-001). Red indicator on list.
  { claimId: 1257, type: 'Claims', num: 'INV-2026-05100', partner: 'SADGURU AGENCY', member: 'M-44021', amount: 78500, date: '14 Apr, 2026 09:22:10', invDate: '12 Apr, 2026', status: 'pending', ocrConfidence: 95, supplier: 'SADGURU AGENCY', customer: 'HEALTH MART CHEMIST', authDist: 'SADGURU AGENCY', partnerId: '5567890', totalClaims: 8, lastClaim: '14 Apr, 2026', lineItems: [{ code: 'PHR-101', name: 'Insulin Pen 3ml', qty: 50, price: 1200, amount: 60000 }, { code: 'PHR-102', name: 'Glucose Monitor Kit', qty: 25, price: 740, amount: 18500 }], alerts: [{ ruleId: 'RULE-001', ruleName: 'High value invoice', msg: 'Invoice value \u20b978,500 exceeds threshold of \u20b950,000' }], pastInvoices: [] },
  // Built-in alert — Line item sum mismatch. Amber banner in detail.
  { claimId: 1209, type: 'Claims', num: 'FE-25-310468', partner: 'FOCUS MEDISALES', member: 'M-70184', amount: 5200, date: '13 Apr, 2026 13:47:59', invDate: '08 Apr, 2026', status: 'pending', ocrConfidence: 72, supplier: 'FOCUS MEDISALES PVT LTD', customer: 'Priya Retail', authDist: 'FOCUS MEDISALES PVT LTD', partnerId: '9012345', totalClaims: 5, lastClaim: '13 Apr, 2026', lineItems: [{ code: 'MED-2201', name: 'TAIXIN FORCE DRY SYRUP', qty: 10, price: 285, amount: 2850 }, { code: 'MED-2205', name: 'MAGNALOR TONIC CAPS', qty: 15, price: 135.67, amount: 2035 }], alerts: [{ system: true, ruleName: 'Line item sum mismatch', msg: 'Line items sum to \u20b94,885 but invoice total is \u20b95,200 (difference: \u20b9315)' }], pastInvoices: [] },
  // Built-in alert — Duplicate invoice number. Shares INV-2026-05201 with claim 1180.
  { claimId: 1195, type: 'Warranty', num: 'INV-2026-05201', partner: 'NEW GARODIA DISTRIBUTORS', member: 'M-55498', amount: 1387, date: '10 Apr, 2026 21:03:30', invDate: '10 Apr, 2026', status: 'pending', ocrConfidence: 91, supplier: 'NEW GARODIA DISTRIBUTORS', customer: 'dia medical', authDist: 'NEW GARODIA DISTRIBUTORS', partnerId: '1234567', totalClaims: 3, lastClaim: '10 Apr, 2026', lineItems: [{ code: 'PHR-002', name: 'Paracetamol 500mg', qty: 20, price: 69.35, amount: 1387 }], alerts: [{ system: true, ruleName: 'Duplicate invoice number', msg: 'Invoice number INV-2026-05201 has been submitted previously' }], pastInvoices: [] },
  // Auto-approved invoice — matched AR-001 (Low Value Claims, scan quality 94%). No alerts.
  { claimId: 1190, type: 'Claims', num: '250007300387493', partner: 'SADGURU AGENCY', member: 'M-42017', amount: 2009, date: '10 Apr, 2026 10:08:45', invDate: '09 Apr, 2026', status: 'approved', ocrConfidence: 94, autoApprovedByRuleId: 'AR-001', supplier: 'SADGURU AGENCY', customer: 'HEALTH MART CHEMIST', authDist: 'SADGURU AGENCY', partnerId: '5567890', totalClaims: 8, lastClaim: '10 Apr, 2026', lineItems: [{ code: 'PHR-003', name: 'Antibiotic Tab', qty: 4, price: 502.25, amount: 2009 }], alerts: [], pastInvoices: [] },
  // Custom alert — High value invoice (RULE-001). Red indicator on list.
  { claimId: 1185, type: 'Claims', num: '140556', partner: 'Unknown Pharma Dist.', member: 'M-33102', amount: 62350, date: '10 Apr, 2026 17:33:12', invDate: '08 Apr, 2026', status: 'pending', ocrConfidence: 67, supplier: 'Unknown Pharma Dist.', customer: 'City Chemist', authDist: 'Metro Distributors', partnerId: '7890123', totalClaims: 1, lastClaim: '10 Apr, 2026', lineItems: [{ code: 'PHR-004', name: 'Injection Vial 10ml', qty: 120, price: 382.71, amount: 45925.20 }, { code: 'PHR-006', name: 'Syringe Pack 5ml', qty: 200, price: 82.12, amount: 16424.80 }], alerts: [{ ruleId: 'RULE-001', ruleName: 'High value invoice', msg: 'Invoice value \u20b962,350 exceeds threshold of \u20b950,000' }], pastInvoices: [] },
  // Built-in alert — Duplicate invoice number. Shares INV-2026-05201 with claim 1195.
  { claimId: 1180, type: 'Claims', num: 'INV-2026-05201', partner: 'FOCUS MEDISALES', member: 'M-60215', amount: 4592.53, date: '09 Apr, 2026 14:20:05', invDate: '08 Apr, 2026', status: 'pending', ocrConfidence: 89, supplier: 'FOCUS MEDISALES PVT LTD', customer: 'Sunrise Pharmacy', authDist: 'FOCUS MEDISALES PVT LTD', partnerId: '9012345', totalClaims: 7, lastClaim: '09 Apr, 2026', lineItems: [{ code: 'PHR-004', name: 'Injection Vial 10ml', qty: 12, price: 382.71, amount: 4592.53 }], alerts: [{ system: true, ruleName: 'Duplicate invoice number', msg: 'Invoice number INV-2026-05201 has been submitted previously' }], pastInvoices: [] },
  // Built-in alert — Unable to fetch details. OCR could not extract line items.
  { claimId: 1175, type: 'Claims', num: '25000730046250B', partner: 'SUDHIR MEDICAL STORES', member: 'M-51207', amount: 2047, date: '09 Apr, 2026 11:42:18', invDate: '07 Mar, 2026', status: 'pending', ocrConfidence: 42, supplier: 'SUDHIR MEDICAL STORES', customer: 'SUDHIR MEDICAL STORES', authDist: 'SUDHIR MEDICAL STORES', partnerId: '5567890', totalClaims: 3, lastClaim: '09 Apr, 2026', lineItems: [], alerts: [{ system: true, ruleName: 'Unable to fetch details', msg: 'OCR could not extract line items from the submitted invoice' }], pastInvoices: [] },
  // Clean invoice — no alerts. Green banner in detail.
  { claimId: 1170, type: 'Claims', num: 'INV-2026-05308', partner: 'GREENLEAF PHARMA', member: 'M-63104', amount: 1845, date: '08 Apr, 2026 18:21:07', invDate: '06 Apr, 2026', status: 'pending', ocrConfidence: 92, supplier: 'GREENLEAF PHARMA', customer: 'GREENLEAF CHEMIST', authDist: 'GREENLEAF PHARMA', partnerId: '4433221', totalClaims: 4, lastClaim: '08 Apr, 2026', lineItems: [{ code: 'PHR-008', name: 'Iron Supplement Tab', qty: 15, price: 123, amount: 1845 }], alerts: [], pastInvoices: [] },
];

export function StoreProvider({ children }) {
  const [rules, setRules] = useState(initialRules);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [toast, setToast] = useState(null);
  const [devNotes, setDevNotes] = useState(false);
  const toggleDevNotes = () => setDevNotes(prev => !prev);

  // SKU Master — fixed catalogue schema, replaces the Plum dependency. One row per SKU, populated directly by CSV upload.
  const globalAttributes = [
    { id: 'GATTR-001', name: 'Material Code', type: 'string', apiKey: 'product_code', unique: true, mandatory: true },
    { id: 'GATTR-002', name: 'Material Name', type: 'string', apiKey: 'product_name', unique: false, mandatory: true },
    { id: 'GATTR-003', name: 'Brand Name', type: 'string', apiKey: 'brand_name', unique: false, mandatory: false },
  ];

  // Additional Match Key — optional, client-specific (e.g. Batch ID for Lupin, not needed for SBD). Fixed 2-column
  // schema (key value + SKU code) used only to resolve a scanned line item to a SKU; CSV populates the table directly.
  const [matchKeys, setMatchKeys] = useState([
    {
      id: 'MKEY-001', name: 'Batch ID', apiKey: 'batch_id', type: 'string',
      records: [
        { id: 'MKREC-001', keyValue: '046L23PK', skuCode: '502896', active: true },
        { id: 'MKREC-002', keyValue: '512K24TB', skuCode: '514812', active: true },
        { id: 'MKREC-003', keyValue: '3311K25CP', skuCode: '514355', active: true },
        { id: 'MKREC-004', keyValue: '9927L24SY', skuCode: '503541', active: true },
        { id: 'MKREC-005', keyValue: '7742K23TB', skuCode: '514341', active: false },
        { id: 'MKREC-006', keyValue: '1180L22PK', skuCode: '502896', active: true },
      ],
    },
  ]);
  const addMatchKey = (key) => {
    setMatchKeys(prev => [...prev, { ...key, id: 'MKEY-' + String(prev.length + 1).padStart(3, '0'), type: 'string', records: [] }]);
  };
  const deleteMatchKey = (id) => {
    setMatchKeys(prev => prev.filter(k => k.id !== id));
  };
  const addMatchKeyRecord = (matchKeyId, record) => {
    setMatchKeys(prev => prev.map(k => k.id !== matchKeyId ? k : {
      ...k,
      records: [...k.records, { ...record, id: 'MKREC-' + String(k.records.length + 1).padStart(3, '0'), active: true }],
    }));
  };
  const updateMatchKeyRecord = (matchKeyId, recordId, updates) => {
    setMatchKeys(prev => prev.map(k => k.id !== matchKeyId ? k : {
      ...k,
      records: k.records.map(r => r.id === recordId ? { ...r, ...updates } : r),
    }));
  };
  const toggleMatchKeyRecord = (matchKeyId, recordId) => {
    setMatchKeys(prev => prev.map(k => k.id !== matchKeyId ? k : {
      ...k,
      records: k.records.map(r => r.id === recordId ? { ...r, active: !r.active } : r),
    }));
  };

  const [invoiceAttributes, setInvoiceAttributes] = useState([
    { id: 'IATTR-001', name: 'Stockist Name', type: 'string', apiKey: 'stockist_name', masterSource: 'Verified Stockist Master', recordCount: 3 },
  ]);
  const addInvoiceAttribute = (attr) => {
    setInvoiceAttributes(prev => [...prev, { ...attr, id: 'IATTR-' + String(prev.length + 1).padStart(3, '0'), recordCount: 0 }]);
  };
  const deleteInvoiceAttribute = (id) => {
    setInvoiceAttributes(prev => prev.filter(a => a.id !== id));
  };

  const [approveRules, setApproveRules] = useState([
    { id: 'AR-001', name: 'Low Value Claims', priority: 1, on: true, minScanQuality: '80', desc: 'Auto-approve claims under ₹10,000 with a readable scan.', groups: [[{ f: 'totalAmount', op: 'lte', val: '10000' }]] },
  ]);
  const toggleApproveRule = (id) => setApproveRules(prev => prev.map(r => r.id === id ? { ...r, on: !r.on } : r));
  const saveApproveRule = (rule) => {
    setApproveRules(prev => {
      const idx = prev.findIndex(r => r.id === rule.id);
      if (idx >= 0) return prev.map(r => r.id === rule.id ? rule : r);
      return [...prev, { ...rule, id: 'AR-' + String(prev.length + 1).padStart(3, '0'), priority: prev.length + 1 }];
    });
  };
  const reorderApproveRules = (from, to) => {
    setApproveRules(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated.map((r, i) => ({ ...r, priority: i + 1 }));
    });
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const toggleRule = (id) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, on: !r.on } : r));
  };

  const saveRule = (rule) => {
    setRules(prev => {
      const idx = prev.findIndex(r => r.id === rule.id);
      if (idx >= 0) return prev.map(r => r.id === rule.id ? rule : r);
      return [...prev, { ...rule, id: 'RULE-' + String(prev.length + 1).padStart(3, '0') }];
    });
  };

  const deleteRule = (id) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const archiveRule = (id) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, on: false, archived: true } : r));
  };

  const duplicateRule = (id) => {
    setRules(prev => {
      const src = prev.find(r => r.id === id);
      if (!src) return prev;
      return [...prev, { ...JSON.parse(JSON.stringify(src)), id: 'RULE-' + String(prev.length + 1).padStart(3, '0'), name: src.name + ' (copy)', on: false }];
    });
  };

  const updateAlert = (invoiceIdx, alertIdx, updates) => {
    setInvoices(prev => prev.map((inv, i) => {
      if (i !== invoiceIdx) return inv;
      return { ...inv, alerts: inv.alerts.map((a, j) => j === alertIdx ? { ...a, ...updates } : a) };
    }));
  };

  return (
    <StoreContext.Provider value={{ rules, invoices, toast, showToast, toggleRule, saveRule, deleteRule, duplicateRule, archiveRule, updateAlert, devNotes, toggleDevNotes, approveRules, toggleApproveRule, saveApproveRule, reorderApproveRules, globalAttributes, matchKeys, addMatchKey, deleteMatchKey, addMatchKeyRecord, updateMatchKeyRecord, toggleMatchKeyRecord, invoiceAttributes, addInvoiceAttribute, deleteInvoiceAttribute }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
