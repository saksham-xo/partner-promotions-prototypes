import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '../data/store';

export default function InvoiceMappingForm() {
  const navigate = useNavigate();
  const { id: apiKey } = useParams();
  const { invoiceAttributes, addInvoiceAttributeRecord, showToast } = useStore();
  const target = invoiceAttributes.find(a => a.apiKey === apiKey) || null;
  const managePath = `/partner-promotions/invoice-management/settings/invoice-attributes/${apiKey}`;
  const [draft, setDraft] = useState({ keyValue: '' });

  const save = () => {
    const keyValue = draft.keyValue.trim();
    if (!keyValue) { showToast('Value is required'); return; }
    addInvoiceAttributeRecord(target.id, { keyValue });
    showToast('Mapping added');
    navigate(managePath);
  };

  return (
    <div>
      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-4 px-6 flex items-center gap-3 mb-6">
        <button onClick={() => navigate(managePath)} className="hover:bg-bg rounded-lg p-2 cursor-pointer transition-colors">
          <ChevronLeft size={20} className="text-text" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-text">Add Mapping</h1>
          <p className="text-sm text-text-secondary mt-0.5">{target?.name || 'Invoice Attribute'} master value</p>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text">Mapping Details</h2>
          <p className="text-xs text-text-secondary mt-1">Add a value to the master list.</p>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1.5">{target?.name || 'Invoice Attribute'} Value</label>
            <input
              type="text"
              value={draft.keyValue}
              onChange={e => setDraft(prev => ({ ...prev, keyValue: e.target.value }))}
              placeholder="e.g. SADGURU AGENCY"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-text outline-none focus:border-primary font-mono"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
          <button onClick={() => navigate(managePath)} className="text-primary px-4 py-2 rounded text-sm font-medium hover:bg-bg cursor-pointer">
            Cancel
          </button>
          <button onClick={save} className="bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#354499] cursor-pointer">
            Save Mapping
          </button>
        </div>
      </div>
    </div>
  );
}
