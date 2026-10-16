// RiskWeave AI - Audit Trail & Review Packet Export Component
import React, { useState } from 'react';
import { 
  History, 
  ShieldCheck, 
  AlertTriangle, 
  Download, 
  Printer, 
  ExternalLink,
  CheckCircle2,
  Lock,
  X
} from 'lucide-react';
import { AuditEvent } from '../../shared/types';

interface AuditTrailViewProps {
  caseId: string;
  auditTrail: AuditEvent[];
  verificationResult: {
    valid: boolean;
    totalEvents: number;
    brokenSequence?: number;
    error?: string;
  };
  onDownloadPacket: () => void;
  onViewHtmlPacket: () => void;
  onVerifyChain: () => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  caseId,
  auditTrail,
  verificationResult,
  onDownloadPacket,
  onViewHtmlPacket,
  onVerifyChain
}) => {
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  return (
    <div className="space-y-6">
      {/* Header and Export Action Bar */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-700">Governance & Traceability</div>
          <h2 className="text-xl font-bold text-slate-900">Cryptographic Audit Chain & Review Packet</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable SHA-256 chained transaction events with tamper-evident payload hashes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onVerifyChain}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
            <span>Verify Hash Chain</span>
          </button>

          <button
            type="button"
            onClick={onViewHtmlPacket}
            className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded border border-teal-300 transition-colors flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5 text-teal-600" />
            <span>Print Review Packet</span>
          </button>

          <button
            type="button"
            onClick={onDownloadPacket}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded shadow-xs transition-colors flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Download JSON Packet</span>
          </button>
        </div>
      </div>

      {/* Cryptographic Chain Integrity Status Banner */}
      <div className={`p-4 rounded-lg border flex items-center justify-between ${
        verificationResult.valid
          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
          : 'bg-red-50 border-red-300 text-red-950'
      }`}>
        <div className="flex items-center gap-3">
          {verificationResult.valid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <div className="text-xs">
            <span className="font-bold text-sm">
              {verificationResult.valid ? 'Audit Chain Cryptographically Verified' : 'Audit Chain Violation Detected'}
            </span>
            <div className="text-slate-600 mt-0.5">
              {verificationResult.valid 
                ? `All ${verificationResult.totalEvents} sequential events validated with unbroken SHA-256 hash linking.`
                : `Integrity failure at sequence #${verificationResult.brokenSequence}: ${verificationResult.error}`}
            </div>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
          Algorithm: SHA-256 Canonical
        </div>
      </div>

      {/* Chronological Audit Event List */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Sequential Case Events ({auditTrail.length})
          </h3>
          <span className="text-xs text-slate-500 font-mono">Case: {caseId}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-4 w-14">Seq</th>
                <th className="py-2.5 px-4">Event Type</th>
                <th className="py-2.5 px-4">Server Timestamp (UTC)</th>
                <th className="py-2.5 px-4">Actor</th>
                <th className="py-2.5 px-4">Previous Hash</th>
                <th className="py-2.5 px-4">Event Hash</th>
                <th className="py-2.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {auditTrail.map(event => (
                <tr 
                  key={event.eventId}
                  onClick={() => setSelectedEvent(event)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                    #{event.sequence}
                  </td>

                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-800">
                    {event.eventType}
                  </td>

                  <td className="py-2.5 px-4 font-mono text-slate-600">
                    {new Date(event.serverTimestamp).toLocaleString()}
                  </td>

                  <td className="py-2.5 px-4 font-mono text-slate-700">
                    {event.actorId}
                  </td>

                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400 truncate max-w-[120px]" title={event.previousHash}>
                    {event.previousHash.substring(0, 12)}...
                  </td>

                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-800 font-bold truncate max-w-[120px]" title={event.eventHash}>
                    {event.eventHash.substring(0, 12)}...
                  </td>

                  <td className="py-2.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                      }}
                      className="text-teal-700 hover:text-teal-900 font-medium"
                    >
                      Payload
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Payload Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-5 space-y-4 border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono text-slate-500">Audit Event #{selectedEvent.sequence}</span>
                <h4 className="text-base font-bold text-slate-900 font-mono">{selectedEvent.eventType}</h4>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Event ID:</span>
                <span className="font-mono text-slate-800">{selectedEvent.eventId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Actor ID:</span>
                <span className="font-mono text-slate-800">{selectedEvent.actorId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Server Timestamp:</span>
                <span className="font-mono text-slate-800">{selectedEvent.serverTimestamp}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Previous Hash:</span>
                <span className="font-mono text-[11px] text-slate-700 break-all">{selectedEvent.previousHash}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Event Hash:</span>
                <span className="font-mono text-[11px] text-slate-900 font-bold break-all">{selectedEvent.eventHash}</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-700 mb-1">Signed Payload Data:</div>
              <pre className="p-3 bg-slate-50 rounded border border-slate-200 font-mono text-xs text-slate-800 overflow-x-auto">
                {JSON.stringify(selectedEvent.payload, null, 2)}
              </pre>
            </div>

            <button
              onClick={() => setSelectedEvent(null)}
              className="w-full py-2 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
