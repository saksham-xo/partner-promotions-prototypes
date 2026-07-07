import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '../data/store';

const SETTINGS_PATH = '/partner-promotions/invoice-management/settings';

const attributeTypes = [
  { v: 'string', l: 'String' },
  { v: 'int', l: 'Numbers' },
  { v: 'float', l: 'Decimals' },
  { v: 'date', l: 'Date & Time' },
  { v: 'selection', l: 'Selection' },
];

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

export default function CreateInvoiceAttribute() {
  const navigate = useNavigate();
  const { invoiceAttributes, addInvoiceAttribute, showToast } = useStore();
  const [draft, setDraft] = useState({ name: '', apiKey: '', type: 'string', masterSource: 'Customer' });

  const save = () => {
    const name = draft.name.trim();
    const apiKey = draft.apiKey.trim() || slugify(name);
    if (!name) { showToast('Attribute name is required'); return; }
    if (invoiceAttributes.some(a => a.name.toLowerCase() === name.toLowerCase())) {
      showToast('An attribute with this name already exists');
      return;
    }
    if (invoiceAttributes.some(a => a.apiKey === apiKey)) {
      showToast('API & File Key must be unique');
      return;
    }
    const id = addInvoiceAttribute({ name, apiKey, type: draft.type, masterSource: draft.masterSource });
    showToast(`"${name}" invoice attribute created`);
    navigate(`${SETTINGS_PATH}/invoice-attributes/${id}`);
  };

  return (
    <div>
      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-4 px-6 flex items-center gap-3 mb-6">
        <button onClick={() => navigate(SETTINGS_PATH)} className="hover:bg-bg rounded-lg p-2 cursor-pointer transition-colors">
          <ChevronLeft size={20} className="text-text" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-text">Add New Invoice Attribute</h1>
          <p className="text-sm text-text-secondary mt-0.5">Validates OCR-scanned invoice fields against verified master data (e.g. scanned stockist name against a verified stockist list).</p>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text">Attribute Details</h2>
          <p className="text-xs text-text-secondary mt-1">You can add attributes based on how you want to map them in the rule engine.</p>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1.5">Attribute Name</label>
            <input
              type="text"
              value={draft.name}
              onChange={e => setDraft(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Stockist Name"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-text outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1.5">Data Type</label>
            <select
              value={draft.type}
              onChange={e => setDraft(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-text outline-none focus:border-primary bg-surface"
            >
              {attributeTypes.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1.5">API & File Key</label>
            <input
              type="text"
              value={draft.apiKey}
              onChange={e => setDraft(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder={draft.name ? slugify(draft.name) : 'auto-generated from name'}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-text outline-none focus:border-primary font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1.5">Validated Against</label>
            <select
              value={draft.masterSource}
              onChange={e => setDraft(prev => ({ ...prev, masterSource: e.target.value }))}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-text outline-none focus:border-primary bg-surface"
            >
              <option value="Customer">Customer</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
          <button onClick={() => navigate(SETTINGS_PATH)} className="text-primary px-4 py-2 rounded text-sm font-medium hover:bg-bg cursor-pointer">
            Cancel
          </button>
          <button onClick={save} className="bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#354499] cursor-pointer">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
