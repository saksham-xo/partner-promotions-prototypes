import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Search, X, Settings, AlertTriangle } from 'lucide-react';
import { useStore } from '../data/store';
import PageHeader from '../components/shared/PageHeader';
import ActionCard from '../components/shared/ActionCard';
import StatusPill from '../components/shared/StatusPill';
import Popover from '../components/shared/Popover';
import ApprovalWorkflow from '../components/ApprovalWorkflow';
import ActionModal from '../components/ActionModal';

export default function Claims() {
  const navigate = useNavigate();
  const { rules, invoices, showToast, devNotes, updateInvoiceStatus } = useStore();
  const [tab, setTab] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('all');
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [actionModal, setActionModal] = useState(null);

  const activeRuleIds = new Set(rules.filter(r => r.on && !r.archived).map(r => r.id));

  // Alerts are frozen at submission time — threshold changes do not retroactively flag old invoices.
  const activeAlerts = (inv) => inv.alerts.filter(a => a.system || activeRuleIds.has(a.ruleId));

  const pending = invoices.filter(i => i.status === 'pending');
  const byTab = tab === 'pending' ? pending : invoices;
  const list = typeFilter === 'all' ? byTab : byTab.filter(i => i.type === typeFilter);


  return (
    <div>
      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-4 px-6 flex items-center gap-4 mb-6 min-h-[86px]">
        <div className="w-[52px] h-[52px] bg-primary-light rounded-lg flex items-center justify-center shrink-0">
          <ClipboardCheck size={28} className="text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-text">Claims Management</h1>
          <p className="text-sm text-text-secondary mt-0.5 tracking-wide">Review and process invoice-based claims and rewards</p>
        </div>
        <button
          onClick={() => navigate('/partner-promotions/invoice-management/settings')}
          title="Settings"
          aria-label="Settings"
          className="p-2 border border-border rounded-lg text-text-secondary hover:text-text hover:border-text-secondary cursor-pointer transition-colors"
        >
          <Settings size={16} />
        </button>
      </div>

      {devNotes && (
        <div className="bg-[#E8F5E9] border border-[#A5D6A7] rounded-lg p-4 mb-6 text-[11px] text-[#1B5E20] leading-relaxed">
          <div className="font-semibold text-[#2E7D32] mb-1.5">Dev Notes — Claims List</div>
          <ul className="flex flex-col gap-1.5 list-disc pl-4">
            <li>The red ⚠ icon next to the amount appears <strong>only for custom alerts</strong>. Built-in alerts (Unable to fetch details, Line item sum mismatch, Duplicate invoice number) never show a row indicator.</li>
            <li>Alerts are frozen at submission and not re-evaluated live.</li>
          </ul>
        </div>
      )}

      <ActionCard
        title="Approval Workflow"
        subtitle={`${pending.length} invoices in queue`}
        buttonLabel="Start Approval"
        onButtonClick={() => setWorkflowOpen(true)}
      />

      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
        <div className="flex items-center border-b-2 border-border bg-bg px-4">
          {[
            { key: 'pending', label: `Pending Actions (${pending.length})` },
            { key: 'all', label: 'All Status' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-xs font-semibold border-b-[4px] -mb-[2px] cursor-pointer transition-colors ${
                tab === t.key
                  ? 'text-primary border-primary rounded-t'
                  : 'text-text-secondary border-transparent hover:text-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 mx-4 my-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#868CCC]" />
            <input type="text" placeholder="Search by Partner Name or Invoice Number" className="w-full pl-10 pr-10 py-2.5 border border-border rounded-lg text-[13px] text-text outline-none focus:border-primary placeholder:text-[#BDC5DA]" />
            <X size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary cursor-pointer" />
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="border border-border rounded-lg px-3 py-2.5 text-[13px] text-text outline-none focus:border-primary bg-surface"
          >
            <option value="all">All Types</option>
            <option value="Claims">Claims</option>
            <option value="Warranty">Warranty</option>
          </select>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border">Partner Name</th>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Claim ID</th>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Type</th>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Invoice Number</th>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Amount</th>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Claim Submitted On</th>
              {tab === 'all' && <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Status</th>}
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((inv, i) => {
              const origIdx = invoices.indexOf(inv);
              const invAlerts = activeAlerts(inv);
              return (
                <tr key={i} className="border-b border-border hover:bg-[#F5F5F5]">
                  <td className="px-4 py-3 font-medium relative">
                    <span className="inline-flex items-center gap-2">
                      {inv.partner || <span className="italic font-normal text-text-secondary">Missing</span>}
                      {!inv.partner && (
                        <span className="group relative inline-flex items-center">
                          <span className="relative flex h-2.5 w-2.5 shrink-0 cursor-help">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                          </span>
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 z-50 text-[10px] font-semibold text-primary bg-primary-light px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-sm">
                            Default alert example for the missing name claim
                          </span>
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{inv.claimId}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${inv.type === 'Claims' ? 'bg-[#E3F2FD] text-[#1565C0]' : 'bg-[#F3E5F5] text-[#7B1FA2]'}`}>
                      {inv.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    <span className="inline-flex items-center gap-2">
                      {inv.num || <span className="italic text-text-secondary font-sans">Missing</span>}
                      {!inv.num && (
                        <span className="group relative inline-flex items-center">
                          <span className="relative flex h-2.5 w-2.5 shrink-0 cursor-help">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                          </span>
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 z-50 text-[10px] font-semibold text-primary bg-primary-light px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-sm font-sans">
                            Configurable alert example
                          </span>
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-2">
                      <span>₹{inv.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      {invAlerts.some(a => !a.system) && (
                        <AlertTriangle size={14} className="text-[#C62828]" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{inv.date}</td>
                  {tab === 'all' && <td className="px-4 py-3"><StatusPill status={inv.status} /></td>}
                  <td className="px-4 py-3">
                    <Popover items={[
                      { label: 'View', onClick: () => navigate(`/partner-promotions/invoice-management/${origIdx}`) },
                      ...(inv.status === 'pending' ? [
                        { label: 'Approve', success: true, onClick: () => setActionModal({ kind: 'approve', inv, origIdx }) },
                        { label: 'Reject', danger: true, onClick: () => setActionModal({ kind: 'reject', inv, origIdx }) },
                      ] : []),
                    ]} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex items-center justify-end gap-4 px-4 py-2 border-t border-border text-[13px] text-text-secondary">
          <span>Rows per page:</span>
          <select className="bg-[rgba(63,81,181,0.1)] border-none rounded px-2 py-1 text-primary font-medium"><option>10</option></select>
          <span>1-{list.length} of {list.length}</span>
          <div className="flex gap-1">
            <button className="border border-border rounded w-7 h-7 text-text-secondary cursor-pointer">&lsaquo;</button>
            <button className="border border-border rounded w-7 h-7 text-text-secondary cursor-pointer">&rsaquo;</button>
          </div>
        </div>
      </div>

      {workflowOpen && (
        <ApprovalWorkflow onClose={() => setWorkflowOpen(false)} />
      )}

      {actionModal && (
        <ActionModal
          kind={actionModal.kind}
          invoiceNum={actionModal.inv.num}
          onClose={() => setActionModal(null)}
          onConfirm={() => {
            updateInvoiceStatus(actionModal.origIdx, actionModal.kind === 'approve' ? 'approved' : 'rejected');
            showToast(`${actionModal.inv.num} ${actionModal.kind === 'approve' ? 'approved' : 'rejected'}`);
            setActionModal(null);
          }}
        />
      )}
    </div>
  );
}
