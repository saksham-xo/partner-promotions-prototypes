import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '../data/store';

const SETTINGS_PATH = '/partner-promotions/invoice-management/settings';

const invoiceFields = [
  { v: 'Supplier Name', l: 'Supplier Name', type: 'string' },
  { v: 'Date', l: 'Date', type: 'date' },
];

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

export default function CreateInvoiceAttribute() {
  const navigate = useNavigate();
  const { invoiceAttributes, addInvoiceAttribute, showToast } = useStore();
  const [invoiceField, setInvoiceField] = useState(invoiceFields[0].v);

  const save = () => {
    const name = invoiceField;
    const apiKey = slugify(name);
    const type = invoiceFields.find(f => f.v === invoiceField).type;
    if (invoiceAttributes.some(a => a.invoiceField === invoiceField)) {
      showToast(`An Invoice Attribute for "${invoiceField}" already exists`);
      return;
    }
    const id = addInvoiceAttribute({ name, apiKey, type, invoiceField });
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
          <p className="text-sm text-text-secondary mt-0.5">Validates a scanned invoice field against master data you upload for it.</p>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text">Attribute Details</h2>
          <p className="text-xs text-text-secondary mt-1">Select which scanned invoice field this attribute validates.</p>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1.5">Invoice Field</label>
            <select
              value={invoiceField}
              onChange={e => setInvoiceField(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-text outline-none focus:border-primary bg-surface"
            >
              {invoiceFields.map(f => <option key={f.v} value={f.v}>{f.l}</option>)}
            </select>
            <p className="text-xs text-text-secondary mt-1.5">
              API &amp; File Key: <span className="font-mono text-text">{slugify(invoiceField)}</span> — name the CSV column for this attribute's master data upload accordingly.
            </p>
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
