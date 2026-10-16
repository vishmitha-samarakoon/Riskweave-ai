// RiskWeave AI - Evidence JSON/CSV Importer Modal
import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, X, FileText } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  onCommitSuccess: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  caseId,
  onCommitSuccess
}) => {
  const [inputText, setInputText] = useState<string>(`[
  {
    "evidenceType": "PAYROLL_VERIFICATION",
    "sourceLocator": "Direct Bureau Direct Deposit Log #88120",
    "structuredFacts": {
      "employer": "Northwest Health System",
      "payrollMatch": true,
      "tenureMonths": 24
    },
    "verificationStatus": "VERIFIED",
    "freshnessClass": "FRESH",
    "independenceGroup": "GRP-PAYROLL-DIRECT"
  }
]`);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleValidate = () => {
    try {
      const parsed = JSON.parse(inputText);
      if (!Array.isArray(parsed)) {
        setValidationResult({ valid: false, rowErrors: [{ row: 1, error: 'Must be an array of evidence objects' }] });
        return;
      }
      const errors: any[] = [];
      parsed.forEach((item, idx) => {
        if (!item.evidenceType) errors.push({ row: idx + 1, error: 'Missing evidenceType' });
        if (!item.sourceLocator) errors.push({ row: idx + 1, error: 'Missing sourceLocator' });
      });

      setValidationResult({
        valid: errors.length === 0,
        totalRecords: parsed.length,
        rowErrors: errors
      });
      setStatusMessage(errors.length === 0 ? 'Dry-run validation passed!' : 'Validation failed with row errors.');
    } catch (err: any) {
      setValidationResult({ valid: false, rowErrors: [{ row: 1, error: `Invalid JSON: ${err.message}` }] });
    }
  };

  const handleCommit = async () => {
    setIsSubmitting(true);
    try {
      const parsed = JSON.parse(inputText);
      const res = await fetch('/api/imports/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, records: parsed })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage('Evidence records successfully committed into case ledger.');
        onCommitSuccess();
        setTimeout(onClose, 1200);
      }
    } catch (err: any) {
      setStatusMessage(`Commit failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full p-5 space-y-4 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">Batch Ingestion</span>
            <h3 className="text-base font-bold text-slate-900">Import Evidence Records</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-slate-600 space-y-1">
          <p>
            Paste JSON evidence records conforming to schema. Content is treated strictly as untrusted input.
          </p>
          <div className="text-[11px] text-slate-500 font-mono">
            Target Case: {caseId}
          </div>
        </div>

        <textarea
          rows={8}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full p-3 font-mono text-xs border border-slate-300 rounded bg-slate-50 focus:bg-white"
        />

        {validationResult && (
          <div className={`p-3 rounded text-xs border ${
            validationResult.valid ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
          }`}>
            <div className="font-semibold flex items-center gap-1.5">
              {validationResult.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
              <span>{statusMessage}</span>
            </div>
            {validationResult.rowErrors && validationResult.rowErrors.length > 0 && (
              <ul className="list-disc list-inside mt-1 text-[11px] text-red-700">
                {validationResult.rowErrors.map((re: any, idx: number) => (
                  <li key={idx}>Row {re.row}: {re.error}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={handleValidate}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300"
          >
            Validate Dry-Run
          </button>
          <button
            type="button"
            onClick={handleCommit}
            disabled={!validationResult?.valid || isSubmitting}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 rounded shadow-xs"
          >
            {isSubmitting ? 'Committing...' : 'Commit to Case'}
          </button>
        </div>
      </div>
    </div>
  );
};
