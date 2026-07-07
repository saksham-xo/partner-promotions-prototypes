import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Upload, Download } from 'lucide-react';
import { useStore } from '../data/store';

const SETTINGS_PATH = '/partner-promotions/invoice-management/settings';
const PAGE_SIZE = 5;

function Toggle({ checked, onChange, title }) {
  return (
    <label title={title} className="relative inline-block w-9 h-5 shrink-0 mt-0.5 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <span className="absolute inset-0 bg-gray-300 rounded-full transition-colors peer-checked:bg-toggle-on" />
      <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
    </label>
  );
}

export default function ManageLookupAttribute() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { matchKeys, toggleMatchKeyRecord, showToast } = useStore();
  const target = matchKeys.find(k => k.id === id) || null;

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const fileInputRef = useRef(null);

  if (!target) {
    return (
      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-6 text-center text-sm text-text-secondary">
        Lookup Attribute not found.
        <div className="mt-3">
          <button onClick={() => navigate(SETTINGS_PATH)} className="text-primary font-medium hover:underline cursor-pointer">Back to Settings</button>
        </div>
      </div>
    );
  }

  const filteredRecords = target.records.filter(r =>
    r.keyValue.toLowerCase().includes(search.toLowerCase()) ||
    r.skuCode.toLowerCase().includes(search.toLowerCase())
  );
  const pagedRecords = filteredRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openUploadModal = () => { setUploadFile(null); setShowUploadModal(true); };
  const handleUploadFile = (e) => {
    const file = e.target.files[0];
    if (file) setUploadFile(file);
  };
  const submitUpload = () => {
    setShowUploadModal(false);
    showToast(`${target.name} mapping file uploaded — processing records`);
  };
  const downloadSample = () => {
    const rows = [
      `${target.apiKey},product_code,status`,
      '046L23PK,502896,N',
      '512K24TB,514812,N',
      '3311K25CP,514355,N',
    ];
    const blob = new Blob([rows.join('\n') + '\n'], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_lookup_attributes.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Sample file downloaded');
  };

  return (
    <div>
      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-4 px-6 flex items-center gap-3 mb-6">
        <button onClick={() => navigate(SETTINGS_PATH)} className="hover:bg-bg rounded-lg p-2 cursor-pointer transition-colors">
          <ChevronLeft size={20} className="text-text" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-text">Manage {target.name}</h1>
          <p className="text-sm text-text-secondary mt-0.5">Search, add, edit, or bulk-upload {target.name} &amp; Product Code mappings.</p>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-border">
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder={`Search by ${target.name} or Product Code`}
            className="flex-1 px-3 py-2 border border-border rounded-lg text-sm text-text outline-none focus:border-primary"
          />
          <button
            onClick={openUploadModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-primary border border-primary/30 hover:bg-primary-light cursor-pointer whitespace-nowrap"
          >
            <Upload size={14} /> Upload CSV
          </button>
          <button
            onClick={() => navigate(`/partner-promotions/invoice-management/settings/lookup-attributes/${id}/mapping/create`)}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-[#354499] cursor-pointer whitespace-nowrap"
          >
            + Add Mapping
          </button>
        </div>
        <div className="px-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-secondary text-xs">
                <th className="py-2 pr-3 font-medium">{target.name}</th>
                <th className="py-2 pr-3 font-medium">Product Code</th>
                <th className="py-2 pr-3 font-medium">Active</th>
              </tr>
            </thead>
            <tbody>
              {pagedRecords.length === 0 ? (
                <tr><td colSpan={3} className="py-8 text-center text-text-secondary text-sm">No mappings found.</td></tr>
              ) : pagedRecords.map(r => (
                <tr key={r.id} className="border-t border-border">
                  <td className="py-2.5 pr-3 font-mono text-xs text-text">{r.keyValue}</td>
                  <td className="py-2.5 pr-3 font-mono text-xs text-text">{r.skuCode}</td>
                  <td className="py-2.5 pr-3">
                    <Toggle checked={r.active} onChange={() => toggleMatchKeyRecord(id, r.id)} title="Once uploaded, records can only be disabled — not edited" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-border text-xs text-text-secondary">
          <span>
            {filteredRecords.length === 0
              ? '0 records'
              : `${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, filteredRecords.length)} of ${filteredRecords.length}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-1 rounded border border-border disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-bg"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => (p * PAGE_SIZE < filteredRecords.length ? p + 1 : p))}
              disabled={page * PAGE_SIZE >= filteredRecords.length}
              className="px-2 py-1 rounded border border-border disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-bg"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={() => { showToast(`${target.name} mappings saved`); navigate(SETTINGS_PATH); }}
          disabled={target.records.length === 0}
          className="bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#354499] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center" onClick={() => setShowUploadModal(false)}>
          <div className="bg-surface rounded-lg shadow-xl w-[480px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <div className="text-base font-semibold text-text">Upload {target.name} Mapping</div>
                <p className="text-xs text-text-secondary mt-1">Upload {target.name} → Product Code records in bulk to populate this mapping table.</p>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="bg-transparent border-none cursor-pointer text-xl text-text-secondary">&times;</button>
            </div>
            <div className="p-5">
              <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleUploadFile} />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg py-9 px-4 text-center cursor-pointer hover:border-primary hover:bg-bg/40 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg border border-primary/30 text-primary flex items-center justify-center mx-auto mb-3">
                  <Upload size={16} />
                </div>
                <div className="text-sm font-semibold text-text mb-1">{uploadFile ? uploadFile.name : 'Upload File'}</div>
                <div className="text-xs text-text-secondary">{uploadFile ? 'File selected — click to replace' : 'Upto 25,000 records & .csv file'}</div>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <button onClick={downloadSample} className="text-sm font-medium text-primary hover:underline cursor-pointer flex items-center gap-1.5">
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
    </div>
  );
}
