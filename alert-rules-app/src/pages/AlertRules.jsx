import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronUp, ChevronDown, AlertTriangle, Info, Trash2, MoreHorizontal, Pencil, Upload, Download, ClipboardCheck } from 'lucide-react';
import { useStore } from '../data/store';

const attributeTypes = [
  { v: 'string', l: 'String' },
  { v: 'int', l: 'Numbers' },
  { v: 'float', l: 'Decimals' },
  { v: 'date', l: 'Date & Time' },
  { v: 'selection', l: 'Selection' },
];
const attributeTypeLabel = Object.fromEntries(attributeTypes.map(t => [t.v, t.l]));
// Exact colour pairs from giift-lbms rule_engine/constants.js `colorCode`
const attributeTypeColor = {
  selection: { color: '#CC5600', backgroundColor: '#FFEDE0' },
  float:     { color: '#144DFF', backgroundColor: '#E5F3FF' },
  int:       { color: '#144DFF', backgroundColor: '#E5F3FF' },
  string:    { color: '#CC8E00', backgroundColor: '#FDF7E8' },
  date:      { color: '#144DFF', backgroundColor: '#E5F3FF' },
};

const numericOps = [
  { v: 'equals', l: '=' }, { v: 'not_equals', l: '≠' },
  { v: 'gt', l: '>' }, { v: 'gte', l: '≥' },
  { v: 'lt', l: '<' }, { v: 'lte', l: '≤' },
];
const stringOps = [
  { v: 'equals', l: 'Equals' }, { v: 'contains', l: 'Contains' },
  { v: 'not_contains', l: "Doesn't contain" },
  { v: 'is_empty', l: 'Is empty' }, { v: 'is_not_empty', l: 'Is not empty' },
];
const booleanOps = [{ v: 'is_true', l: 'Yes' }, { v: 'is_false', l: 'No' }];
const noValueOps = ['is_empty', 'is_not_empty', 'is_true', 'is_false'];

const fieldIndex = {
  totalAmount:        { label: 'Invoice Amount', ops: numericOps, numeric: true },
  invoiceNo:          { label: 'Invoice Number', ops: stringOps },
  lineItemsMismatch:  { label: 'Line Items Total Mismatch', ops: booleanOps },
  ocrAmountMatch:     { label: 'Scanned Amount Matches Entered', ops: booleanOps },
  ocrConfidence:      { label: 'Confidence Score (%)', ops: numericOps, numeric: true },
  invoiceAge:         { label: 'Invoice Age (days)', ops: numericOps, numeric: true },
};

const defaultAlerts = [
  { id: 'DEF-01', name: 'Unable to fetch details', desc: 'Fires when invoice details are missing or unreadable by OCR.' },
  { id: 'DEF-02', name: 'Line item sum mismatch', desc: 'Fires when the sum of line items on the invoice does not match the total invoice amount.' },
  { id: 'DEF-03', name: 'Duplicate invoice number', desc: 'Fires when an invoice number has already been submitted previously by any retailer.' },
];

export default function AlertRules() {
  const navigate = useNavigate();
  const { rules, toggleRule, saveRule, showToast, devNotes, globalAttributes, matchKeys, addMatchKey, deleteMatchKey, addMatchKeyRecord, updateMatchKeyRecord, toggleMatchKeyRecord, invoiceAttributes, addInvoiceAttribute, deleteInvoiceAttribute } = useStore();

  const [showMatchKeyModal, setShowMatchKeyModal] = useState(false);
  const [matchKeyDraft, setMatchKeyDraft] = useState({ name: '', apiKey: '' });

  const MATCH_KEY_PAGE_SIZE = 5;
  const [showManageMatchKey, setShowManageMatchKey] = useState(false);
  const [manageMatchKeyId, setManageMatchKeyId] = useState(null);
  const [matchKeySearch, setMatchKeySearch] = useState('');
  const [matchKeyPage, setMatchKeyPage] = useState(1);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [mappingDraft, setMappingDraft] = useState({ id: null, keyValue: '', skuCode: '' });

  const openManageMatchKey = (matchKeyId) => {
    setManageMatchKeyId(matchKeyId);
    setMatchKeySearch('');
    setMatchKeyPage(1);
    setShowManageMatchKey(true);
  };
  const manageMatchKeyTarget = matchKeys.find(k => k.id === manageMatchKeyId) || null;
  const filteredMappingRecords = manageMatchKeyTarget
    ? manageMatchKeyTarget.records.filter(r =>
        r.keyValue.toLowerCase().includes(matchKeySearch.toLowerCase()) ||
        r.skuCode.toLowerCase().includes(matchKeySearch.toLowerCase()))
    : [];
  const pagedMappingRecords = filteredMappingRecords.slice(
    (matchKeyPage - 1) * MATCH_KEY_PAGE_SIZE,
    matchKeyPage * MATCH_KEY_PAGE_SIZE
  );

  const openMappingModal = (record = null) => {
    setMappingDraft(record ? { id: record.id, keyValue: record.keyValue, skuCode: record.skuCode } : { id: null, keyValue: '', skuCode: '' });
    setShowMappingModal(true);
  };
  const saveMapping = () => {
    const keyValue = mappingDraft.keyValue.trim();
    const skuCode = mappingDraft.skuCode.trim();
    if (!keyValue || !skuCode) { showToast(`${manageMatchKeyTarget?.name || 'Match key'} value and SKU code are both required`); return; }
    if (mappingDraft.id) {
      updateMatchKeyRecord(manageMatchKeyId, mappingDraft.id, { keyValue, skuCode });
      showToast('Mapping updated');
    } else {
      addMatchKeyRecord(manageMatchKeyId, { keyValue, skuCode });
      showToast('Mapping added');
    }
    setShowMappingModal(false);
  };
  const [openAccordions, setOpenAccordions] = useState({ global: true, local: true, invoice: true, lorem: true });
  const [openKebab, setOpenKebab] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const fileInputRef = useRef(null);

  const openUploadModal = () => { setUploadFile(null); setShowUploadModal(true); };
  const handleUploadFile = (e) => {
    const file = e.target.files[0];
    if (file) setUploadFile(file);
  };
  const submitUpload = () => {
    setShowUploadModal(false);
    showToast('SKU Master file uploaded — table updated');
  };

  const [showInvoiceAttrModal, setShowInvoiceAttrModal] = useState(false);
  const [invoiceAttrDraft, setInvoiceAttrDraft] = useState({ name: '', apiKey: '', type: 'string', masterSource: '' });
  const [showMasterUploadModal, setShowMasterUploadModal] = useState(false);
  const [masterUploadFile, setMasterUploadFile] = useState(null);
  const [masterUploadTarget, setMasterUploadTarget] = useState(null);
  const masterFileInputRef = useRef(null);

  const openInvoiceAttrModal = () => {
    setInvoiceAttrDraft({ name: '', apiKey: '', type: 'string', masterSource: '' });
    setShowInvoiceAttrModal(true);
  };
  const openMasterUploadModal = (attr) => { setMasterUploadFile(null); setMasterUploadTarget(attr); setShowMasterUploadModal(true); };
  const handleMasterUploadFile = (e) => {
    const file = e.target.files[0];
    if (file) setMasterUploadFile(file);
  };
  const submitMasterUpload = () => {
    setShowMasterUploadModal(false);
    showToast(`${masterUploadTarget?.masterSource || 'Master data'} uploaded — processing records`);
  };

  const toggleAccordion = (key) => setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));

  const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  const openMatchKeyModal = () => {
    setMatchKeyDraft({ name: '', apiKey: '' });
    setShowMatchKeyModal(true);
  };

  const saveMatchKey = () => {
    const name = matchKeyDraft.name.trim();
    const apiKey = matchKeyDraft.apiKey.trim() || slugify(name);
    if (!name) { showToast('Match key name is required'); return; }
    if (matchKeys.some(k => k.name.toLowerCase() === name.toLowerCase())) {
      showToast('A match key with this name already exists');
      return;
    }
    if (matchKeys.some(k => k.apiKey === apiKey)) {
      showToast('API & File Key must be unique');
      return;
    }
    addMatchKey({ name, apiKey });
    showToast(`"${name}" match key created`);
    setShowMatchKeyModal(false);
  };

  const saveInvoiceAttribute = () => {
    const name = invoiceAttrDraft.name.trim();
    const apiKey = invoiceAttrDraft.apiKey.trim() || slugify(name);
    if (!name) { showToast('Attribute name is required'); return; }
    if (invoiceAttributes.some(a => a.name.toLowerCase() === name.toLowerCase())) {
      showToast('An attribute with this name already exists');
      return;
    }
    if (invoiceAttributes.some(a => a.apiKey === apiKey)) {
      showToast('API & File Key must be unique');
      return;
    }
    const masterSource = invoiceAttrDraft.masterSource.trim() || `${name} Master`;
    addInvoiceAttribute({ name, apiKey, type: invoiceAttrDraft.type, masterSource });
    showToast(`"${name}" invoice attribute created`);
    setShowInvoiceAttrModal(false);
  };

  const ruleHasEmptyCondition = (rule) =>
    rule.groups.some(g => g.some(c => !noValueOps.includes(c.op) && !c.val));

  const [drafts, setDrafts] = useState({});
  const [pendingConfirm, setPendingConfirm] = useState(null);

  const draftKey = (ruleId, gi, ci) => `${ruleId}:${gi}:${ci}`;

  const valueFor = (rule, gi, ci) => {
    const k = draftKey(rule.id, gi, ci);
    if (k in drafts) return drafts[k];
    return rule.groups[gi][ci].val ?? '';
  };

  const handleDraft = (rule, gi, ci, newVal) => {
    setDrafts(prev => ({ ...prev, [draftKey(rule.id, gi, ci)]: newVal }));
  };

  const handleCommit = (rule, gi, ci) => {
    const k = draftKey(rule.id, gi, ci);
    if (!(k in drafts)) return;
    const draftVal = drafts[k];
    const originalVal = rule.groups[gi][ci].val ?? '';
    if (draftVal === originalVal) {
      setDrafts(prev => { const next = { ...prev }; delete next[k]; return next; });
      return;
    }
    const field = fieldIndex[rule.groups[gi][ci].f];
    if (field?.numeric && draftVal !== '' && !(parseFloat(draftVal) > 0)) {
      showToast('Value must be greater than zero');
      setDrafts(prev => { const next = { ...prev }; delete next[k]; return next; });
      return;
    }
    if (!rule.on) {
      const nextGroups = rule.groups.map((g, i) =>
        i !== gi ? g : g.map((c, j) => j === ci ? { ...c, val: draftVal } : c)
      );
      saveRule({ ...rule, groups: nextGroups });
      setDrafts(prev => { const next = { ...prev }; delete next[k]; return next; });
      return;
    }
    setPendingConfirm({ kind: 'threshold', rule, gi, ci, newVal: draftVal, originalVal });
  };

  const clearDraft = (rule, gi, ci) => {
    setDrafts(prev => { const next = { ...prev }; delete next[draftKey(rule.id, gi, ci)]; return next; });
  };

  const handleToggleRequest = (rule) => {
    // Activating a rule that has no threshold yet is a pending state —
    // audit fires when the threshold is saved, not on the toggle itself.
    if (!rule.on && ruleHasEmptyCondition(rule)) {
      toggleRule(rule.id);
      return;
    }
    setPendingConfirm({ kind: 'toggle', rule });
  };

  const handleCancelDraft = (rule, gi, ci) => {
    clearDraft(rule, gi, ci);
    if (rule.on && ruleHasEmptyCondition(rule)) {
      toggleRule(rule.id);
    }
  };

  const acceptPending = () => {
    if (pendingConfirm.kind === 'toggle') {
      const { rule } = pendingConfirm;
      toggleRule(rule.id);
      showToast(`"${rule.name}" ${rule.on ? 'deactivated' : 'activated'} — logged to audit trail`);
    } else {
      const { rule, gi, ci, newVal } = pendingConfirm;
      const nextGroups = rule.groups.map((g, i) =>
        i !== gi ? g : g.map((c, j) => j === ci ? { ...c, val: newVal } : c)
      );
      saveRule({ ...rule, groups: nextGroups });
      showToast(`"${rule.name}" threshold updated — logged to audit trail`);
      clearDraft(rule, gi, ci);
    }
    setPendingConfirm(null);
  };

  const cancelPending = () => {
    if (pendingConfirm.kind === 'threshold') {
      const { rule, gi, ci } = pendingConfirm;
      clearDraft(rule, gi, ci);
    }
    setPendingConfirm(null);
  };

  return (
    <div>
      {/* Page header */}
      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-4 px-6 flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/partner-promotions/invoice-management')} className="hover:bg-bg rounded-lg p-2 cursor-pointer transition-colors">
          <ChevronLeft size={20} className="text-text" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-text">Claims Settings</h1>
          <p className="text-sm text-text-secondary mt-0.5">Configure alerts for invoice claims processing</p>
        </div>
      </div>

      {devNotes && (
        <div className="bg-[#E8F5E9] border border-[#A5D6A7] rounded-lg p-4 mb-6 text-[11px] text-[#1B5E20] leading-relaxed">
          <div className="font-semibold text-[#2E7D32] mb-1.5">Dev Notes — Claims Settings</div>
          <ul className="flex flex-col gap-1.5 list-disc pl-4">
            <li><strong>Built-in alerts</strong> ship enabled by default. They can only be disabled from the backend — no UI path to toggle them off. The card's toggle is display-only.</li>
            <li>The <strong>Edit Claims Settings</strong> permission gates exactly two actions on this page: toggling custom alerts on/off, and updating the threshold value. Nothing else on this screen is editable.</li>
            <li><strong>Audit trail:</strong> every custom-alert state change is recorded — toggling an existing configured rule on/off, and threshold changes on an active rule. The "Save Alert Changes" modal fires before an audit-worthy change persists: Accept commits + writes the audit entry; Cancel reverts and writes nothing.</li>
            <li><strong>Toggle first, then set threshold.</strong> The threshold input is disabled until the rule is toggled on. When activating a rule that has no threshold yet, the toggle flips on silently — activation is a <em>pending</em> state until the threshold is saved, at which point one audit entry covers both. Clicking Cancel in that pending state reverts the toggle back off; the session leaves no trace.</li>
            <li><strong>Threshold values</strong> must be greater than zero. Decimals allowed.</li>
            <li><strong>Threshold change impact — alerts are frozen at submission.</strong> Changing a threshold does not retroactively re-flag or un-flag existing claims:
              <ul className="list-[circle] pl-4 mt-1 flex flex-col gap-0.5">
                <li><em>Decrease</em> (e.g. 50k → 20k): past ₹40k claims stay unflagged. Only claims submitted after the change get evaluated at the new 20k threshold.</li>
                <li><em>Increase</em> (e.g. 50k → 100k): past ₹75k claims stay flagged (snapshot preserved). New ₹75k claims no longer flag.</li>
                <li><em>Rule toggled off</em>: existing alerts stamped with that ruleId disappear from the list and detail view. Snapshot on the invoice is preserved — toggling back on restores them.</li>
              </ul>
            </li>
          </ul>
        </div>
      )}

      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
        <div className="px-6 py-6 flex flex-col gap-7">
          {/* Default Alerts */}
          <section className="flex flex-col gap-3">
            <div>
              <h2 className="text-sm font-semibold text-text">Built-in Alerts</h2>
              <p className="text-xs text-text-secondary mt-0.5">Enabled by default. Run on every invoice at submission. No configuration required.</p>
            </div>
            <div className="flex flex-col gap-2">
              {defaultAlerts.map(a => (
                <div key={a.id} className="bg-surface border border-border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <Toggle checked={true} disabled />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-text mb-0.5">{a.name}</h3>
                      <p className="text-[13px] text-text-secondary leading-snug">{a.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Custom Alerts */}
          <section className="flex flex-col gap-3">
            <div>
              <h2 className="text-sm font-semibold text-text">Custom Alerts</h2>
              <p className="text-xs text-text-secondary mt-0.5">Matching invoices display a warning icon next to their amount on the Claims list. Condition changes are recorded in the audit trail.</p>
            </div>
            {rules.length === 0 ? (
              <div className="text-center py-10 text-text-secondary text-sm">No custom alerts configured.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {rules.map(r => (
                  <div key={r.id} className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-4">
                      <Toggle
                        checked={r.on}
                        onChange={() => handleToggleRequest(r)}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-text mb-0.5">{r.name}</h3>
                        {r.desc && <p className="text-[13px] text-text-secondary leading-snug">{r.desc}</p>}
                      </div>
                    </div>
                    {r.groups?.length > 0 && r.groups[0].length > 0 && (
                      <div className="pl-[52px] flex flex-col gap-2">
                        {r.groups.map((grp, gi) => (
                          grp.map((c, ci) => {
                            const field = fieldIndex[c.f];
                            const isNoValue = noValueOps.includes(c.op);
                            const opMatch = field?.ops.find(o => o.v === c.op);
                            const k = draftKey(r.id, gi, ci);
                            const hasDraft = k in drafts && drafts[k] !== (c.val ?? '');
                            const inputDisabled = !r.on;
                            return (
                              <div key={`${gi}-${ci}`} className="flex flex-col gap-2">
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="px-3 py-2.5 border border-border rounded-lg text-sm text-text bg-bg/50 cursor-not-allowed">{field?.label || c.f}</div>
                                  <div className="px-3 py-2.5 border border-border rounded-lg text-sm text-text bg-bg/50 cursor-not-allowed">{opMatch?.l || c.op}</div>
                                  {isNoValue ? (
                                    <div className="px-3 py-2.5 border border-border rounded-lg text-sm text-text-secondary bg-bg/30 italic">No value needed</div>
                                  ) : (
                                    <div className="relative">
                                      <input
                                        type={field?.numeric ? 'number' : 'text'}
                                        {...(field?.numeric ? { min: '0.01', step: 'any' } : {})}
                                        required
                                        disabled={inputDisabled}
                                        value={valueFor(r, gi, ci)}
                                        onChange={e => handleDraft(r, gi, ci, e.target.value)}
                                        onKeyDown={e => {
                                          if (e.key === 'Enter') { e.preventDefault(); handleCommit(r, gi, ci); }
                                          else if (e.key === 'Escape') { e.preventDefault(); handleCancelDraft(r, gi, ci); }
                                        }}
                                        placeholder="Value *"
                                        title={inputDisabled ? 'Enable this alert to set a threshold value' : 'Enter a value and click Save'}
                                        className={`w-full px-3 py-2.5 pr-9 border border-border rounded-lg text-sm text-text outline-none focus:border-primary placeholder:text-[#BDC5DA] ${inputDisabled ? 'bg-bg/50 cursor-not-allowed text-text-secondary' : 'bg-surface'}`}
                                      />
                                      {!inputDisabled && (
                                        <Pencil size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#868CCC] pointer-events-none" />
                                      )}
                                    </div>
                                  )}
                                </div>
                                {hasDraft && !inputDisabled && (
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => handleCancelDraft(r, gi, ci)}
                                      className="text-primary px-3 py-1.5 rounded text-sm font-medium hover:bg-bg cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleCommit(r, gi, ci)}
                                      className="bg-primary text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#354499] cursor-pointer"
                                    >
                                      Save
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SKU Master */}
          <section className="flex flex-col gap-3">
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="w-full flex items-center justify-between px-4 py-3.5 bg-surface border-b border-[#dadcee]">
                <button onClick={() => toggleAccordion('global')} className="flex-1 flex items-center justify-between cursor-pointer">
                  <span className="text-left">
                    <span className="text-sm font-semibold text-text flex items-center gap-1.5">
                      SKU Master fields
                      <span className="relative group">
                        <Info size={13} className="text-text-secondary" />
                        <div className="hidden group-hover:block absolute left-0 top-5 z-20 w-80 bg-surface border border-border rounded-lg shadow-lg p-3 text-xs text-text-secondary font-normal normal-case text-left">
                          <p className="font-semibold text-text mb-1.5">How a scanned line item resolves to a SKU</p>
                          <p className="mb-1.5">Scanned invoices reliably carry only <span className="font-medium text-text">Material Name</span> — Material Code is rarely present or legible.</p>
                          <ol className="list-decimal list-inside space-y-1">
                            <li><span className="font-medium text-text">Line Item Lookup Attributes</span> (configured separately below, if set for this client) — checked first, only if scanned. An exact match resolves the line item immediately with high confidence.</li>
                            <li><span className="font-medium text-text">Material Code</span> — checked next, only if scanned. An exact match against this master resolves the line item with high confidence.</li>
                            <li><span className="font-medium text-text">Material Name</span> — always present, so this is the base signal. Fuzzy-matched against this master; match strength drives the confidence score used to approve, flag for review, or reject.</li>
                          </ol>
                        </div>
                      </span>
                    </span>
                    <span className="text-xs text-text-secondary font-normal block mt-0.5">The catalogue table for this client — Material Code, Material Name, Brand Name. Replaces the Plum dependency; the CSV upload populates this table directly.</span>
                  </span>
                  {openAccordions.global ? <ChevronUp size={16} className="text-text-secondary shrink-0" /> : <ChevronDown size={16} className="text-text-secondary shrink-0" />}
                </button>
              </div>
              {openAccordions.global && (
                <>
                <div className="flex justify-end px-4 py-3 border-b border-border bg-surface">
                  <button onClick={openUploadModal} className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#354499] cursor-pointer">
                    <Upload size={14} /> Upload SKU Master
                  </button>
                </div>
                <table className="w-full border-t border-border">
                  <thead>
                    <tr>
                      {['Attribute name', 'Data type', 'API & File Key', 'Field is unique', 'Field is mandatory', 'Actions'].map(h => (
                        <th key={h} className="text-left text-sm font-semibold px-4 py-2.5 bg-[#F6FAFC] text-[#4F516E] whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {globalAttributes.map(a => (
                      <tr key={a.id} className="border-t border-border">
                        <td className="px-4 py-3 text-sm text-text">{a.name}</td>
                        <td className="px-4 py-3">
                          <span className="highlight-span" style={attributeTypeColor[a.type]}>{attributeTypeLabel[a.type]}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary font-mono">{a.apiKey}</td>
                        <td className="px-4 py-3 text-sm text-text">{a.unique ? 'True' : 'False'}</td>
                        <td className="px-4 py-3 text-sm text-text">{a.mandatory ? 'True' : 'False'}</td>
                        <td className="px-4 py-3">
                          <button disabled title="Structure is system-defined" className="p-1 text-text-secondary/50 cursor-not-allowed">
                            <MoreHorizontal size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </>
              )}
            </div>
          </section>

          {/* Line Item Lookup Attributes */}
          <section className="flex flex-col gap-3">
            <div className="border border-border rounded-lg overflow-visible">
              <div className="w-full flex items-center justify-between px-4 py-3.5 bg-surface border-b border-[#dadcee] rounded-t-lg">
                <button onClick={() => toggleAccordion('local')} className="flex-1 flex items-center justify-between cursor-pointer">
                  <span className="text-left">
                    <span className="text-sm font-semibold text-text flex items-center gap-1.5">
                      Line Item Lookup Attributes
                      <span className="relative group">
                        <Info size={13} className="text-text-secondary" />
                        <div className="hidden group-hover:block absolute left-0 top-5 z-20 w-80 bg-surface border border-border rounded-lg shadow-lg p-3 text-xs text-text-secondary font-normal normal-case text-left">
                          <p className="mb-1.5">A separate, optional table used only to resolve a scanned line item to a SKU — e.g. <span className="font-medium text-text">Batch ID</span> for Lupin. Not every client needs one (Stanley Becker / SBD does not).</p>
                          <p>Fixed 2-column schema: the match key value and the SKU / product code it maps to. No other fields — the CSV populates this table directly, with no processing.</p>
                        </div>
                      </span>
                    </span>
                    <span className="text-xs text-text-secondary font-normal block mt-0.5">Client-specific lookup used to resolve OCR line items to a SKU — separate from the SKU Master catalogue above.</span>
                  </span>
                  {openAccordions.local ? <ChevronUp size={16} className="text-text-secondary shrink-0" /> : <ChevronDown size={16} className="text-text-secondary shrink-0" />}
                </button>
              </div>
              {openAccordions.local && (
                matchKeys.length === 0 ? (
                  <div className="flex flex-col items-center text-center py-10 px-4">
                    <div className="w-11 h-11 rounded-full bg-[#FFF1E7] flex items-center justify-center mb-3">
                      <ClipboardCheck size={20} className="text-[#EA6C1E]" />
                    </div>
                    <p className="text-sm text-text mb-4">No match key configured — matching relies on Material Code / Material Name only.</p>
                    <button onClick={openMatchKeyModal} className="bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#354499] cursor-pointer">
                      + Add Match Key
                    </button>
                  </div>
                ) : (
                  <>
                  <div className="flex justify-end px-4 py-3 border-b border-border bg-surface">
                    <button onClick={openMatchKeyModal} className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#354499] cursor-pointer">
                      + Add Match Key
                    </button>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr>
                        {['Match key name', 'Data type', 'API & File Key', 'Mapped records', 'Actions'].map(h => (
                          <th key={h} className="text-left text-sm font-semibold px-4 py-2.5 bg-[#F6FAFC] text-[#4F516E] whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matchKeys.map(a => (
                        <tr key={a.id} className="border-t border-border">
                          <td className="px-4 py-3 text-sm text-text">{a.name}</td>
                          <td className="px-4 py-3">
                            <span className="highlight-span" style={attributeTypeColor[a.type]}>{attributeTypeLabel[a.type]}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-text-secondary font-mono">{a.apiKey}</td>
                          <td className="px-4 py-3 text-sm text-text">{a.records.length}</td>
                          <td className="px-4 py-3 relative">
                            <button onClick={() => setOpenKebab(openKebab === a.id ? null : a.id)} className="p-1 text-text-secondary hover:text-text cursor-pointer">
                              <MoreHorizontal size={16} />
                            </button>
                            {openKebab === a.id && (
                              <div className="absolute right-4 top-9 z-10 bg-surface border border-border rounded-lg shadow-lg w-44 py-1" onMouseLeave={() => setOpenKebab(null)}>
                                <button
                                  onClick={() => { openManageMatchKey(a.id); setOpenKebab(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-bg cursor-pointer"
                                >
                                  <Pencil size={14} /> Manage Mappings
                                </button>
                                <button
                                  onClick={() => { deleteMatchKey(a.id); showToast(`"${a.name}" match key deleted`); setOpenKebab(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-bg cursor-pointer"
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </>
                )
              )}
            </div>
          </section>

          {/* Invoice Detail Validation Attributes */}
          <section className="flex flex-col gap-3">
            <div className="border border-border rounded-lg overflow-visible">
              <div className="w-full flex items-center justify-between px-4 py-3.5 bg-surface border-b border-[#dadcee] rounded-t-lg">
                <button onClick={() => toggleAccordion('invoice')} className="flex-1 flex items-center justify-between cursor-pointer">
                  <span className="text-left">
                    <span className="text-sm font-semibold text-text block">Invoice Detail Validation Attributes</span>
                    <span className="text-xs text-text-secondary font-normal block mt-0.5">Header-level fields, each validated against its own master data — e.g. scanned stockist name against a verified stockist list.</span>
                  </span>
                  {openAccordions.invoice ? <ChevronUp size={16} className="text-text-secondary shrink-0" /> : <ChevronDown size={16} className="text-text-secondary shrink-0" />}
                </button>
              </div>
              {openAccordions.invoice && (
                invoiceAttributes.length === 0 ? (
                  <div className="flex flex-col items-center text-center py-10 px-4">
                    <div className="w-11 h-11 rounded-full bg-[#FFF1E7] flex items-center justify-center mb-3">
                      <ClipboardCheck size={20} className="text-[#EA6C1E]" />
                    </div>
                    <p className="text-sm text-text mb-4">Add invoice-level fields validated against master data.</p>
                    <button onClick={openInvoiceAttrModal} className="bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#354499] cursor-pointer">
                      + Add New Invoice Attribute
                    </button>
                  </div>
                ) : (
                  <>
                  <div className="flex justify-end px-4 py-3 border-b border-border bg-surface">
                    <button onClick={openInvoiceAttrModal} className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#354499] cursor-pointer">
                      + Add New Invoice Attribute
                    </button>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr>
                        {['Attribute name', 'Data type', 'API & File Key', 'Validated against', 'Actions'].map(h => (
                          <th key={h} className="text-left text-sm font-semibold px-4 py-2.5 bg-[#F6FAFC] text-[#4F516E] whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceAttributes.map(a => (
                        <tr key={a.id} className="border-t border-border">
                          <td className="px-4 py-3 text-sm text-text">{a.name}</td>
                          <td className="px-4 py-3">
                            <span className="highlight-span" style={attributeTypeColor[a.type]}>{attributeTypeLabel[a.type]}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-text-secondary font-mono">{a.apiKey}</td>
                          <td className="px-4 py-3 text-sm text-text">{a.masterSource}</td>
                          <td className="px-4 py-3 relative">
                            <button onClick={() => setOpenKebab(openKebab === a.id ? null : a.id)} className="p-1 text-text-secondary hover:text-text cursor-pointer">
                              <MoreHorizontal size={16} />
                            </button>
                            {openKebab === a.id && (
                              <div className="absolute right-4 top-9 z-10 bg-surface border border-border rounded-lg shadow-lg w-44 py-1" onMouseLeave={() => setOpenKebab(null)}>
                                <button
                                  onClick={() => { openMasterUploadModal(a); setOpenKebab(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-bg cursor-pointer"
                                >
                                  <Upload size={14} /> Upload Master Data
                                </button>
                                <button
                                  onClick={() => { deleteInvoiceAttribute(a.id); showToast(`"${a.name}" attribute deleted`); setOpenKebab(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-bg cursor-pointer"
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </>
                )
              )}
            </div>
          </section>

          {/* Lorem Ipsum Attributes */}
          <section className="flex flex-col gap-3">
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="w-full flex items-center justify-between px-4 py-3.5 bg-surface border-b border-[#dadcee] rounded-t-lg">
                <button onClick={() => toggleAccordion('lorem')} className="flex-1 flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-semibold text-text">Lorem Ipsum Attributes</span>
                  {openAccordions.lorem ? <ChevronUp size={16} className="text-text-secondary shrink-0" /> : <ChevronDown size={16} className="text-text-secondary shrink-0" />}
                </button>
              </div>
              {openAccordions.lorem && (
                <div className="flex flex-col items-center text-center py-10 px-4">
                  <div className="w-11 h-11 rounded-full bg-[#FFF1E7] flex items-center justify-center mb-3">
                    <ClipboardCheck size={20} className="text-[#EA6C1E]" />
                  </div>
                  <p className="text-sm text-text mb-4">Add lorem ipsum attributes which are required to run your loyalty logic</p>
                  <button className="bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#354499] cursor-pointer">
                    + Add New Lorem Ipsum Attribute
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {showMatchKeyModal && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center" onClick={() => setShowMatchKeyModal(false)}>
          <div className="bg-surface rounded-lg shadow-xl w-[440px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="text-base font-semibold text-text">Add Match Key</span>
              <button onClick={() => setShowMatchKeyModal(false)} className="bg-transparent border-none cursor-pointer text-xl text-text-secondary">&times;</button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1.5">Match Key Name</label>
                <input
                  type="text"
                  value={matchKeyDraft.name}
                  onChange={e => setMatchKeyDraft(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Batch ID"
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-text outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1.5">API & File Key</label>
                <input
                  type="text"
                  value={matchKeyDraft.apiKey}
                  onChange={e => setMatchKeyDraft(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder={matchKeyDraft.name ? slugify(matchKeyDraft.name) : 'auto-generated from name'}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-text outline-none focus:border-primary font-mono"
                />
              </div>
              <p className="text-xs text-text-secondary">Table structure is fixed — {matchKeyDraft.name || 'match key'} value + SKU / product code. The uploaded CSV populates it directly.</p>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
              <button onClick={() => setShowMatchKeyModal(false)} className="text-primary px-4 py-2 rounded text-sm font-medium hover:bg-bg cursor-pointer">
                Cancel
              </button>
              <button onClick={saveMatchKey} className="bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#354499] cursor-pointer">
                Save Match Key
              </button>
            </div>
          </div>
        </div>
      )}

      {showManageMatchKey && manageMatchKeyTarget && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center" onClick={() => setShowManageMatchKey(false)}>
          <div className="bg-surface rounded-lg shadow-xl w-[760px] max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <div className="text-base font-semibold text-text">Manage {manageMatchKeyTarget.name}</div>
                <p className="text-xs text-text-secondary mt-1">Search, add, edit, or bulk-upload {manageMatchKeyTarget.name} → SKU code mappings.</p>
              </div>
              <button onClick={() => setShowManageMatchKey(false)} className="bg-transparent border-none cursor-pointer text-xl text-text-secondary">&times;</button>
            </div>
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border">
              <input
                type="text"
                value={matchKeySearch}
                onChange={e => { setMatchKeySearch(e.target.value); setMatchKeyPage(1); }}
                placeholder={`Search by ${manageMatchKeyTarget.name} or SKU code`}
                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm text-text outline-none focus:border-primary"
              />
              <button
                onClick={() => openMasterUploadModal({ name: manageMatchKeyTarget.name, masterSource: `${manageMatchKeyTarget.name} Mapping` })}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-primary border border-primary/30 hover:bg-primary-light cursor-pointer whitespace-nowrap"
              >
                <Upload size={14} /> Upload CSV
              </button>
              <button
                onClick={() => openMappingModal()}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-[#354499] cursor-pointer whitespace-nowrap"
              >
                + Add Mapping
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-text-secondary text-xs">
                    <th className="py-2 pr-3 font-medium">{manageMatchKeyTarget.name}</th>
                    <th className="py-2 pr-3 font-medium">SKU / Product Code</th>
                    <th className="py-2 pr-3 font-medium">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedMappingRecords.length === 0 ? (
                    <tr><td colSpan={3} className="py-8 text-center text-text-secondary text-sm">No mappings found.</td></tr>
                  ) : pagedMappingRecords.map(r => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="py-2.5 pr-3 font-mono text-xs text-text">{r.keyValue}</td>
                      <td className="py-2.5 pr-3 font-mono text-xs text-text">{r.skuCode}</td>
                      <td className="py-2.5 pr-3">
                        <Toggle checked={r.active} onChange={() => toggleMatchKeyRecord(manageMatchKeyId, r.id)} title="Once uploaded, records can only be disabled — not edited" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-border text-xs text-text-secondary">
              <span>
                {filteredMappingRecords.length === 0
                  ? '0 records'
                  : `${(matchKeyPage - 1) * MATCH_KEY_PAGE_SIZE + 1}-${Math.min(matchKeyPage * MATCH_KEY_PAGE_SIZE, filteredMappingRecords.length)} of ${filteredMappingRecords.length}`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMatchKeyPage(p => Math.max(1, p - 1))}
                  disabled={matchKeyPage === 1}
                  className="px-2 py-1 rounded border border-border disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-bg"
                >
                  Prev
                </button>
                <button
                  onClick={() => setMatchKeyPage(p => (p * MATCH_KEY_PAGE_SIZE < filteredMappingRecords.length ? p + 1 : p))}
                  disabled={matchKeyPage * MATCH_KEY_PAGE_SIZE >= filteredMappingRecords.length}
                  className="px-2 py-1 rounded border border-border disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-bg"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMappingModal && (
        <div className="fixed inset-0 bg-black/40 z-[110] flex items-center justify-center" onClick={() => setShowMappingModal(false)}>
          <div className="bg-surface rounded-lg shadow-xl w-[400px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="text-base font-semibold text-text">{mappingDraft.id ? 'Edit Mapping' : 'Add Mapping'}</span>
              <button onClick={() => setShowMappingModal(false)} className="bg-transparent border-none cursor-pointer text-xl text-text-secondary">&times;</button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1.5">{manageMatchKeyTarget?.name || 'Match Key'} Value</label>
                <input
                  type="text"
                  value={mappingDraft.keyValue}
                  onChange={e => setMappingDraft(prev => ({ ...prev, keyValue: e.target.value }))}
                  placeholder="e.g. 046L23PK"
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-text outline-none focus:border-primary font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1.5">SKU / Product Code</label>
                <input
                  type="text"
                  value={mappingDraft.skuCode}
                  onChange={e => setMappingDraft(prev => ({ ...prev, skuCode: e.target.value }))}
                  placeholder="e.g. 502896"
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-text outline-none focus:border-primary font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
              <button onClick={() => setShowMappingModal(false)} className="text-primary px-4 py-2 rounded text-sm font-medium hover:bg-bg cursor-pointer">
                Cancel
              </button>
              <button onClick={saveMapping} className="bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#354499] cursor-pointer">
                Save Mapping
              </button>
            </div>
          </div>
        </div>
      )}

      {showInvoiceAttrModal && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center" onClick={() => setShowInvoiceAttrModal(false)}>
          <div className="bg-surface rounded-lg shadow-xl w-[440px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="text-base font-semibold text-text">Add Invoice Attribute</span>
              <button onClick={() => setShowInvoiceAttrModal(false)} className="bg-transparent border-none cursor-pointer text-xl text-text-secondary">&times;</button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1.5">Attribute Name</label>
                <input
                  type="text"
                  value={invoiceAttrDraft.name}
                  onChange={e => setInvoiceAttrDraft(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Stockist Name"
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-text outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1.5">Data Type</label>
                <select
                  value={invoiceAttrDraft.type}
                  onChange={e => setInvoiceAttrDraft(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-text outline-none focus:border-primary bg-surface"
                >
                  {attributeTypes.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1.5">API & File Key</label>
                <input
                  type="text"
                  value={invoiceAttrDraft.apiKey}
                  onChange={e => setInvoiceAttrDraft(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder={invoiceAttrDraft.name ? slugify(invoiceAttrDraft.name) : 'auto-generated from name'}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-text outline-none focus:border-primary font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1.5">Validated Against (Master Data)</label>
                <input
                  type="text"
                  value={invoiceAttrDraft.masterSource}
                  onChange={e => setInvoiceAttrDraft(prev => ({ ...prev, masterSource: e.target.value }))}
                  placeholder="e.g. Verified Stockist Master"
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-text outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
              <button onClick={() => setShowInvoiceAttrModal(false)} className="text-primary px-4 py-2 rounded text-sm font-medium hover:bg-bg cursor-pointer">
                Cancel
              </button>
              <button onClick={saveInvoiceAttribute} className="bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#354499] cursor-pointer">
                Save Attribute
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingConfirm && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center" onClick={cancelPending}>
          <div className="bg-surface rounded-lg shadow-xl w-[480px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-block" />
                <span className="text-base font-semibold text-text">Save Alert Changes</span>
              </div>
              <button onClick={cancelPending} className="bg-transparent border-none cursor-pointer text-xl text-text-secondary">&times;</button>
            </div>
            <div className="p-5">
              <p className="text-sm text-text leading-relaxed">
                This action will be recorded in the Audit Trail. Click "Accept" to save your changes.
              </p>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
              <button
                onClick={cancelPending}
                className="text-primary px-4 py-2 rounded text-sm font-medium hover:bg-bg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={acceptPending}
                className="bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#354499] cursor-pointer"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center" onClick={() => setShowUploadModal(false)}>
          <div className="bg-surface rounded-lg shadow-xl w-[480px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <div className="text-base font-semibold text-text">Upload SKU Master</div>
                <p className="text-xs text-text-secondary mt-1">Upload file to add or update Material Code, Material Name, and Brand Name in bulk. Populates the SKU Master table directly.</p>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="bg-transparent border-none cursor-pointer text-xl text-text-secondary">&times;</button>
            </div>
            <div className="p-5">
              <input type="file" ref={fileInputRef} accept=".csv,.xlsx" className="hidden" onChange={handleUploadFile} />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg py-9 px-4 text-center cursor-pointer hover:border-primary hover:bg-bg/40 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg border border-primary/30 text-primary flex items-center justify-center mx-auto mb-3">
                  <Upload size={16} />
                </div>
                <div className="text-sm font-semibold text-text mb-1">{uploadFile ? uploadFile.name : 'Upload File'}</div>
                <div className="text-xs text-text-secondary">{uploadFile ? 'File selected — click to replace' : 'Upto 50,000 records & .xlsx, .csv file'}</div>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <button onClick={() => showToast('Sample file downloaded')} className="text-sm font-medium text-primary hover:underline cursor-pointer flex items-center gap-1.5">
                <Download size={14} /> Download Sample File
              </button>
              <div className="flex gap-2">
                <button onClick={() => setShowUploadModal(false)} className="text-primary px-4 py-2 rounded text-sm font-medium hover:bg-bg cursor-pointer">Cancel</button>
                <button onClick={submitUpload} disabled={!uploadFile} className="bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#354499] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMasterUploadModal && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center" onClick={() => setShowMasterUploadModal(false)}>
          <div className="bg-surface rounded-lg shadow-xl w-[480px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <div className="text-base font-semibold text-text">Upload {masterUploadTarget?.masterSource || 'Master Data'}</div>
                <p className="text-xs text-text-secondary mt-1">Upload verified {masterUploadTarget?.name} records to validate scanned invoice details against.</p>
              </div>
              <button onClick={() => setShowMasterUploadModal(false)} className="bg-transparent border-none cursor-pointer text-xl text-text-secondary">&times;</button>
            </div>
            <div className="p-5">
              <input type="file" ref={masterFileInputRef} accept=".csv,.xlsx" className="hidden" onChange={handleMasterUploadFile} />
              <div
                onClick={() => masterFileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg py-9 px-4 text-center cursor-pointer hover:border-primary hover:bg-bg/40 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg border border-primary/30 text-primary flex items-center justify-center mx-auto mb-3">
                  <Upload size={16} />
                </div>
                <div className="text-sm font-semibold text-text mb-1">{masterUploadFile ? masterUploadFile.name : 'Upload File'}</div>
                <div className="text-xs text-text-secondary">{masterUploadFile ? 'File selected — click to replace' : 'Upto 50,000 records & .xlsx, .csv file'}</div>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <button onClick={() => showToast('Sample file downloaded')} className="text-sm font-medium text-primary hover:underline cursor-pointer flex items-center gap-1.5">
                <Download size={14} /> Download Sample File
              </button>
              <div className="flex gap-2">
                <button onClick={() => setShowMasterUploadModal(false)} className="text-primary px-4 py-2 rounded text-sm font-medium hover:bg-bg cursor-pointer">Cancel</button>
                <button onClick={submitMasterUpload} disabled={!masterUploadFile} className="bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#354499] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({ checked, onChange, disabled = false, title }) {
  return (
    <label title={title} className={`relative inline-block w-9 h-5 shrink-0 mt-0.5 ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only peer"
      />
      <span className="absolute inset-0 bg-gray-300 rounded-full transition-colors peer-checked:bg-toggle-on" />
      <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
    </label>
  );
}
