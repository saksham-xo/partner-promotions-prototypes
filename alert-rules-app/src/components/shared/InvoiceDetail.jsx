import { Pencil, ChevronLeft, Image, Zap, Info, AlertTriangle, FileX } from 'lucide-react';
import { useStore } from '../../data/store';
import StatusPill from './StatusPill';
import BehaviorPill from './BehaviorPill';

function AutoApprovalBanner({ rule }) {
  return (
    <div className="bg-[#E8F5E9] border border-success rounded-lg p-3 px-4 mb-4">
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-full bg-success flex items-center justify-center shrink-0">
          <Zap size={14} className="text-white" fill="white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-[#2E7D32]">Auto-approved</span>
            <span className="text-[13px] text-text">·</span>
            <span className="text-[13px] font-medium text-text">{rule ? rule.name : 'Unknown rule'}</span>
            {rule?.id && (
              <span className="text-[10px] font-mono text-text-secondary bg-surface border border-[#A5D6A7] rounded px-1.5 py-0.5">{rule.id}</span>
            )}
          </div>
          {rule?.minScanQuality && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] text-text-secondary">Rule threshold (≥)</span>
              <span className="text-[12px] font-medium text-text">{rule.minScanQuality}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AlertBanner({ alert }) {
  const isBuiltIn = alert.system === true;
  const styles = isBuiltIn
    ? { wrap: 'bg-flag-bg border-[#FFE0B2]', icon: 'text-flag' }
    : { wrap: 'bg-block-bg border-[#FFCDD2]', icon: 'text-block' };
  const Icon = isBuiltIn ? Info : AlertTriangle;
  return (
    <div className={`rounded-lg p-3 px-4 mb-2 border ${styles.wrap}`}>
      <div className="flex items-center gap-2.5">
        <Icon size={20} className={`shrink-0 ${styles.icon}`} />
        <div className="flex-1 font-medium text-[13px] text-text">{alert.ruleName}</div>
      </div>
    </div>
  );
}

function AlertsSection({ inv }) {
  if (inv.alerts.length === 0) {
    return (
      <div className="bg-[#E8F5E9] border border-success rounded-lg p-3 px-4 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full border-2 border-success flex items-center justify-center shrink-0 text-success">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
        </div>
        <span className="text-[13px] font-medium text-[#2E7D32]">No discrepancies found</span>
      </div>
    );
  }

  return (
    <div>
      {inv.alerts.map((alert, ai) => (
        <AlertBanner key={ai} alert={alert} />
      ))}
    </div>
  );
}

function inr(n) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const TIER_STYLE = {
  high: { bg: 'bg-[rgba(76,175,80,0.13)]', text: 'text-success', label: 'MATCH' },
  medium: { bg: 'bg-pending-bg', text: 'text-[#B8860B]', label: 'NEEDS REVIEW' },
  low: { bg: 'bg-[rgba(244,67,54,0.13)]', text: 'text-block', label: 'NO MATCH' },
};

function ConfidencePill({ tier }) {
  const s = TIER_STYLE[tier];
  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold text-center whitespace-nowrap ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

// Scan & match flow: (1) Batch ID scanned from OCR is looked up against the Batch ID
// master — an exact hit resolves the SKU directly ("MATCH"). (2) No batch match (stale
// master, bad OCR read, or a non-Lupin line item) falls back to product-name fuzzy
// matching — while a match key master exists, this fallback is surfaced as "NEEDS REVIEW"
// (score > 0.3) since it isn't the trusted Batch ID source; the expectation is these get
// resolved manually (mapped/corrected or dropped as non-Lupin) rather than left standing.
// (3) No batch match and fuzzy score ≤ 0.3 (or no match key master configured at all) is
// an unresolved line item — "NO MATCH".
function resolveLineItem(li, inv, matchKeys, catalogueRecords) {
  const batchMaster = matchKeys.find(k => k.apiKey === 'batch_id');
  const batchRecord = li.batchId && batchMaster?.records.find(r => r.keyValue === li.batchId && r.active);
  if (batchRecord) {
    const catalogItem = catalogueRecords.find(c => c.code === batchRecord.skuCode);
    return { tier: 'high', code: batchRecord.skuCode, name: catalogItem?.name || li.name, subtext: null };
  }
  if (li.fuzzyScore != null) {
    if (li.fuzzyScore > 0.3) {
      const subtext = li.fuzzyName && li.fuzzyName !== li.name ? li.fuzzyName : null;
      return { tier: 'medium', code: li.fuzzyCode || '-', name: li.name, subtext };
    }
    return { tier: 'low', code: '-', name: li.name, subtext: null };
  }
  // Legacy line items with a pre-assigned code but no scan metadata — bucket off the invoice's OCR confidence.
  const bucket = inv.ocrConfidence >= 80 ? 'high' : inv.ocrConfidence >= 60 ? 'medium' : 'low';
  return { tier: bucket, code: li.code || '-', name: li.name, subtext: null };
}

const TIMELINE_STYLES = {
  Submitted: { bg: '#eef2ff', color: '#5b8df6', label: 'Claim Submitted' },
  Approved: { bg: '#e8f5e9', color: '#4caf50', label: 'Claim Approved' },
  Rejected: { bg: '#ffebee', color: '#f44336', label: 'Claim Rejected' },
};

function buildTimeline(inv) {
  const entries = [{ action: 'Submitted', at: inv.date, note: 'Claim submitted by Source', attachment: 'receipt_image.jpg' }];
  if (inv.status === 'approved') entries.push({ action: 'Approved', at: inv.date, note: inv.autoApprovedByRuleId ? 'Auto-approved by rule engine' : 'Approved by reviewer' });
  if (inv.status === 'rejected') entries.push({ action: 'Rejected', at: inv.date, note: 'Rejected by reviewer' });
  return entries;
}

export default function InvoiceDetail({ inv, invoiceIdx, showToast }) {
  const { rules, invoices, approveRules, devNotes, matchKeys, catalogueRecords } = useStore();
  const activeRuleIds = new Set(rules.filter(r => r.on && !r.archived).map(r => r.id));
  const autoApprovalRule = inv.autoApprovedByRuleId
    ? approveRules.find(r => r.id === inv.autoApprovedByRuleId)
    : null;

  // Alerts are frozen at submission time — threshold changes do not retroactively flag old invoices.
  const allAlerts = inv.alerts.filter(a => a.system || activeRuleIds.has(a.ruleId));
  return (
    <div className="grid grid-cols-[2fr_1fr] gap-6">
      {/* Left column */}
      <div>
        {/* Invoice Details */}
        <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-text">Invoice Details</h3>
            <button className="flex items-center gap-1 text-[#1976d2] text-sm font-medium bg-transparent border-none cursor-pointer hover:underline" onClick={() => showToast('Edit Fields')}>
              <Pencil size={14} /> Edit Fields
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 gap-x-6">
            <div>
              <div className="text-xs text-[#666] mb-1">Invoice Number</div>
              <div className="text-sm font-medium">
                {inv.num || <span className="italic text-text-secondary">Missing</span>}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#666] mb-1">Invoice Amount</div>
              <div className="text-sm text-text font-medium">{inr(inv.amount)}</div>
            </div>
            <div className="row-span-3">
              <div className="text-xs text-[#666] mb-1">Invoice Preview</div>
              <div className="bg-[#F0F0F0] border border-border rounded h-[140px] flex items-center justify-center text-text-secondary text-[11px]">
                <Image size={16} className="text-text-secondary" />
              </div>
            </div>
            <div>
              <div className="text-xs text-[#666] mb-1">Retailer</div>
              <div className="text-sm font-medium">
                {inv.partner || <span className="italic text-text-secondary">Missing</span>}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#666] mb-1">Customer</div>
              <div className="text-sm text-text font-medium">{inv.customer}</div>
            </div>
            <div>
              <div className="text-xs text-[#666] mb-1">Claim Submitted On</div>
              <div className="text-sm text-text font-medium">{inv.date}</div>
            </div>
            <div>
              <div className="text-xs text-[#666] mb-1">Invoice Date</div>
              <div className="text-sm text-text font-medium">{inv.invDate}</div>
            </div>
            <div>
              <div className="text-xs text-[#666] mb-1">Claim Status</div>
              <StatusPill status={inv.status} />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-text">Line Items</h3>
            <button className="flex items-center gap-1 text-[#1976d2] text-sm font-medium bg-transparent border-none cursor-pointer hover:underline" onClick={() => showToast('Edit Fields')}>
              <Pencil size={14} /> Edit Fields
            </button>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border">Line Item ID</th>
                <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border">Confidence</th>
                <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border">Product Code</th>
                <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border">Product Name</th>
                <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-right border-b border-border">Qty</th>
                <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-right border-b border-border">Unit Price</th>
                <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-right border-b border-border">Amount</th>
              </tr>
            </thead>
            {inv.lineItems.length > 0 && (
              <tbody>
                {inv.lineItems.map((li, i) => {
                  const r = resolveLineItem(li, inv, matchKeys, catalogueRecords);
                  return (
                    <tr key={i} className={`border-b border-border hover:bg-[#F5F5F5] ${r.tier === 'low' ? 'bg-[#FFF6E8]' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">#{89221 + i}</td>
                      <td className="px-4 py-3"><ConfidencePill tier={r.tier} /></td>
                      <td className="px-4 py-3 font-mono text-xs">{r.code}</td>
                      <td className="px-4 py-3">
                        {r.name}
                        {r.subtext && <div className="text-xs text-text-secondary italic">{r.subtext}</div>}
                      </td>
                      <td className="px-4 py-3 text-right">{li.qty}</td>
                      <td className="px-4 py-3 text-right">{inr(li.price)}</td>
                      <td className="px-4 py-3 text-right font-medium">{inr(li.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
          {inv.lineItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 bg-bg/50">
              <FileX size={56} className="text-[#B0BEC5] mb-4" strokeWidth={1.5} />
              <div className="text-base font-semibold text-text mb-1">No Data Found</div>
              <div className="text-sm text-text-secondary">No records could be fetched during OCR process</div>
            </div>
          )}
        </div>

        {/* Partner Details */}
        <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-5 mb-5">
          <h3 className="text-base font-semibold text-text mb-4">Partner Details</h3>
          <div className="flex gap-8 mb-5">
            <div>
              <div className="text-xs text-[#666] mb-1">Partner Name</div>
              <div className="text-sm font-medium">
                {inv.partner || <span className="italic text-text-secondary">Missing</span>}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#666] mb-1">Partner ID</div>
              <div className="text-sm text-text font-medium">{inv.partnerId}</div>
            </div>
            <div>
              <div className="text-xs text-[#666] mb-1">Total Claims</div>
              <div className="text-sm text-text font-medium">{inv.totalClaims}</div>
            </div>
            <div>
              <div className="text-xs text-[#666] mb-1">Last Claim</div>
              <div className="text-sm text-text font-medium">{inv.lastClaim}</div>
            </div>
          </div>
          <div className="text-sm font-semibold text-text mb-3">Past Invoices Claimed</div>
          <div className="flex gap-4 overflow-x-auto py-1">
            {inv.pastInvoices.length > 0 ? inv.pastInvoices.map((p, i) => (
              <div key={i} className="min-w-[180px] border border-border rounded-lg p-3 bg-[#FAFAFA] shrink-0">
                <div className="w-full h-12 bg-border rounded flex items-center justify-center text-[10px] text-text-secondary mb-2">
                  <Image size={16} />
                </div>
                <div className="text-xs font-medium text-text">{p}</div>
                <div className="mt-1"><StatusPill status="pending" /></div>
              </div>
            )) : (
              <div className="text-text-secondary text-[13px]">No past invoices</div>
            )}
          </div>
        </div>

        {/* QR Details — Warranty claims only */}
        {inv.type === 'Warranty' && inv.warranty && (
          <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-5 mb-5">
            <h3 className="text-base font-semibold text-text mb-4">QR Details</h3>
            <div className="grid grid-cols-3 gap-4 gap-x-6">
              <div>
                <div className="text-xs text-[#666] mb-1">Reference Id</div>
                <div className="text-sm font-medium">#{inv.warranty.qrId}</div>
              </div>
              <div>
                <div className="text-xs text-[#666] mb-1">Product ID</div>
                <div className="text-sm font-medium font-mono">{inv.lineItems[0]?.code}</div>
              </div>
              <div>
                <div className="text-xs text-[#666] mb-1">Product Name</div>
                <div className="text-sm font-medium">{inv.lineItems[0]?.name}</div>
              </div>
              <div>
                <div className="text-xs text-[#666] mb-1">Warranty Duration</div>
                <div className="text-sm font-medium">{inv.warranty.durationValue} {inv.warranty.durationUnit}</div>
              </div>
            </div>
          </div>
        )}

        {/* Reward Points */}
        <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-5">
          <h3 className="text-base font-semibold text-text mb-4">Reward Points</h3>
          <div className="text-base font-semibold text-text">
            {inv.status === 'rejected' ? 'N/A' : '0 Points'}
          </div>
        </div>
      </div>

      {/* Right column */}
      <div>
        {/* Timeline */}
        <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-5 mb-5">
          <h3 className="text-base font-semibold text-text mb-4">Timeline</h3>
          {buildTimeline(inv).map((entry, i, arr) => {
            const style = TIMELINE_STYLES[entry.action];
            return (
              <div key={i} className="flex gap-3 items-start relative">
                {i < arr.length - 1 && (
                  <div className="absolute left-4 top-8 bottom-0 w-px bg-border" style={{ height: 'calc(100% - 8px)' }} />
                )}
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10" style={{ backgroundColor: style.bg }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: style.color }} />
                </div>
                <div className={i < arr.length - 1 ? 'pb-5' : ''}>
                  <div className="text-[13px] font-medium text-text">{entry.note}</div>
                  <div className="text-xs text-text-secondary mt-1">{entry.at}</div>
                  <div className="flex gap-2 mt-1.5 items-center">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: style.bg, color: style.color }}>{style.label}</span>
                    {entry.attachment && (
                      <a href="#" className="text-xs text-primary no-underline" onClick={(e) => { e.preventDefault(); showToast('Opening receipt'); }}>{entry.attachment}</a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Auto-approval banner */}
        {inv.status === 'approved' && inv.autoApprovedByRuleId && (
          <AutoApprovalBanner rule={autoApprovalRule} />
        )}

        {/* Alerts */}
        <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-text">Alerts</h3>
          </div>
          {devNotes && (
            <div className="bg-[#E8F5E9] border border-[#A5D6A7] rounded-lg p-3 mb-3 text-[11px] text-[#1B5E20] leading-relaxed">
              <div className="font-semibold text-[#2E7D32] mb-1">Dev Notes — Alert colour coding</div>
              <ul className="flex flex-col gap-1 list-disc pl-4">
                <li><strong>Red</strong> banner → custom alert (configured in Claims Settings, e.g. High value invoice).</li>
                <li><strong>Amber</strong> banner → built-in alert (Unable to fetch details, Line item sum mismatch, Duplicate invoice number). Always on, backend-managed.</li>
                <li><strong>Green</strong> "No discrepancies found" → invoice passed every built-in and custom check at submission.</li>
                <li>Alerts are evaluated at invoice submission. Toggle change or threshold edits for an alert will not reflect on previously uploaded invoices.</li>
              </ul>
            </div>
          )}
          <AlertsSection inv={{ ...inv, alerts: allAlerts }} />
        </div>
      </div>
    </div>
  );
}
