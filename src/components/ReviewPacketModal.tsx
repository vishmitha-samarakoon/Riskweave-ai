// RiskWeave AI - Print-Ready HTML Review Packet Viewer Modal
import React from 'react';
import { Printer, X, Download } from 'lucide-react';

interface ReviewPacketModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
  caseId: string;
}

export const ReviewPacketModal: React.FC<ReviewPacketModalProps> = ({
  isOpen,
  onClose,
  htmlContent,
  caseId
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">Formal Compliance Document</span>
            <h3 className="text-base font-bold text-slate-900">Case Review Packet ({caseId})</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded shadow-xs flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-slate-100">
          <div className="max-w-3xl mx-auto bg-white p-8 rounded shadow-xs border border-slate-200">
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </div>
        </div>
      </div>
    </div>
  );
};
