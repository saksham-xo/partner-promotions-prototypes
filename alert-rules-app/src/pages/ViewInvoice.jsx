import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '../data/store';
import StatusPill from '../components/shared/StatusPill';
import InvoiceDetail from '../components/shared/InvoiceDetail';
import OverrideModal from '../components/OverrideModal';
import ActionModal from '../components/ActionModal';

export default function ViewInvoice() {
  const { index } = useParams();
  const navigate = useNavigate();
  const { invoices, updateAlert, updateInvoiceStatus, showToast } = useStore();
  const idx = parseInt(index, 10);
  const inv = invoices[idx];

  const [overrideTarget, setOverrideTarget] = useState(null);
  const [actionModal, setActionModal] = useState(null);

  if (!inv) {
    return (
      <div className="text-center py-10 text-text-secondary">
        Invoice not found.
        <button onClick={() => navigate('/partner-promotions/invoice-management')} className="text-primary ml-2 cursor-pointer bg-transparent border-none font-medium">
          Back to Claims
        </button>
      </div>
    );
  }

  const handleAck = (ii, ai) => {
    updateAlert(ii, ai, { status: 'acknowledged' });
    showToast('Alert acknowledged');
  };

  const handleOverride = (ii, ai) => {
    setOverrideTarget({ ii, ai });
  };

  const handleOverrideConfirm = (reason) => {
    if (!overrideTarget) return;
    updateAlert(overrideTarget.ii, overrideTarget.ai, {
      status: 'overridden',
      overrideBy: 'saksham',
      overrideReason: reason,
    });
    setOverrideTarget(null);
    showToast('Alert overridden');
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate('/partner-promotions/invoice-management')}
          className="flex items-center gap-1 bg-transparent border-none text-primary text-[13px] font-medium cursor-pointer rounded p-1 hover:bg-primary-light"
        >
          <ChevronLeft size={16} />
        </button>
        <h2 className="text-lg font-semibold text-text">
          Invoice # {inv.num || <span className="text-text-secondary italic font-normal">Missing</span>}
        </h2>
        <StatusPill status={inv.status} />
        {inv.status === 'pending' && (
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => setActionModal('reject')}
              className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-block border border-block/30 hover:bg-block-bg cursor-pointer"
            >
              Reject
            </button>
            <button
              onClick={() => setActionModal('approve')}
              className="px-3 py-1.5 rounded-lg text-[13px] font-medium bg-success text-white hover:opacity-90 cursor-pointer"
            >
              Approve
            </button>
          </div>
        )}
      </div>

      <InvoiceDetail
        inv={inv}
        invoiceIdx={idx}
        onAck={handleAck}
        onOverride={handleOverride}
        showToast={showToast}
      />

      {overrideTarget && (
        <OverrideModal
          alert={inv.alerts[overrideTarget.ai]}
          onClose={() => setOverrideTarget(null)}
          onConfirm={handleOverrideConfirm}
          showToast={showToast}
        />
      )}

      {actionModal && (
        <ActionModal
          kind={actionModal}
          invoiceNum={inv.num}
          onClose={() => setActionModal(null)}
          onConfirm={() => {
            updateInvoiceStatus(idx, actionModal === 'approve' ? 'approved' : 'rejected');
            showToast(`${inv.num} ${actionModal === 'approve' ? 'approved' : 'rejected'}`);
            setActionModal(null);
          }}
        />
      )}
    </div>
  );
}
