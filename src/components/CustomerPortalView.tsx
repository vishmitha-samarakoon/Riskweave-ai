import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  Send, 
  Download, 
  Printer, 
  Trash2, 
  Save, 
  HelpCircle, 
  Clock, 
  ArrowLeft, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  CustomerPortalData, 
  CustomerUploadedDoc, 
  CustomerMessage, 
  CustomerSubmissionReceipt 
} from '../../shared/types';

interface CustomerPortalViewProps {
  caseId: string;
  allCaseIds?: string[];
  onSelectCase?: (caseId: string) => void;
  onExitPortal?: () => void;
}

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({
  caseId,
  allCaseIds = ['RW-001', 'RW-002', 'RW-003', 'RW-004', 'RW-005'],
  onSelectCase,
  onExitPortal
}) => {
  const [portalData, setPortalData] = useState<CustomerPortalData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(caseId);

  // Draft state
  const [draftStatement, setDraftStatement] = useState<string>('');
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);

  // Upload state
  const [selectedDocType, setSelectedDocType] = useState<string>('Proof of Residential Address');
  const [uploadNote, setUploadNote] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat message state
  const [chatInput, setChatInput] = useState<string>('');
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);

  // Receipt Modal / View
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Load portal data
  useEffect(() => {
    fetchPortalData(selectedCaseId);
  }, [selectedCaseId]);

  const fetchPortalData = async (cid: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/customer-portal/${cid}`);
      if (res.ok) {
        const data: CustomerPortalData = await res.json();
        setPortalData(data);
        setDraftStatement(data.explanationDraft || '');
      }
    } catch (err) {
      console.error('Failed to load customer portal data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const res = await fetch(`/api/customer-portal/${selectedCaseId}/draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: draftStatement })
      });
      if (res.ok) {
        setDraftSavedAt(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Failed to save draft:', err);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);

    try {
      const fileSizeFormatted = `${(file.size / 1024).toFixed(1)} KB`;
      const res = await fetch(`/api/customer-portal/${selectedCaseId}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: selectedDocType,
          fileName: file.name,
          fileSize: fileSizeFormatted,
          notes: uploadNote
        })
      });

      if (res.ok) {
        await fetchPortalData(selectedCaseId);
        setUploadNote('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Failed to upload document:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      const res = await fetch(`/api/customer-portal/${selectedCaseId}/documents/${docId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchPortalData(selectedCaseId);
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setIsSendingMessage(true);
    try {
      const res = await fetch(`/api/customer-portal/${selectedCaseId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'CUSTOMER',
          senderName: portalData?.customerName || 'Applicant',
          content: chatInput.trim()
        })
      });
      if (res.ok) {
        setChatInput('');
        await fetchPortalData(selectedCaseId);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSubmitPackage = async () => {
    if (!portalData || portalData.uploadedDocs.length === 0) {
      alert('Please upload at least one required document before submitting.');
      return;
    }

    try {
      const res = await fetch(`/api/customer-portal/${selectedCaseId}/submit`, {
        method: 'POST'
      });
      if (res.ok) {
        await fetchPortalData(selectedCaseId);
        setShowReceiptModal(true);
      }
    } catch (err) {
      console.error('Failed to submit package:', err);
    }
  };

  if (isLoading && !portalData) {
    return (
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-12 text-center text-slate-500 text-xs">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
        <span>Loading secure verification portal...</span>
      </div>
    );
  }

  const requestedItems = portalData?.requestedItems || [];
  const allFulfilled = requestedItems.every(r => !r.required || r.fulfilled);
  const isSubmitted = portalData?.portalStatus === 'DOCUMENTS_SUBMITTED' || portalData?.portalStatus === 'UNDER_REVIEW';
  const isCorrection = portalData?.portalStatus === 'CORRECTION_REQUIRED';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Experience Banner & Preview Case Selector */}
      <div className="bg-slate-900 text-slate-300 px-4 py-2.5 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-semibold text-white">External Customer Experience Shell</span>
          <span className="text-slate-400 hidden sm:inline">— Zero internal risk scores or fraud notes exposed to applicant</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-400">Simulate Applicant:</span>
            <select
              value={selectedCaseId}
              onChange={(e) => {
                setSelectedCaseId(e.target.value);
                if (onSelectCase) onSelectCase(e.target.value);
              }}
              className="bg-slate-800 border border-slate-700 text-teal-300 font-semibold rounded px-2 py-0.5"
            >
              {allCaseIds.map(id => (
                <option key={id} value={id}>Case {id}</option>
              ))}
            </select>
          </div>

          {onExitPortal && (
            <button
              onClick={onExitPortal}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Workstation</span>
            </button>
          )}
        </div>
      </div>

      {/* Customer Portal Clean Card */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        {/* Customer Bank Header */}
        <div className="bg-gradient-to-r from-teal-800 to-slate-900 text-white p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center font-bold text-white text-base border border-white/20">
                  <ShieldCheck className="w-5 h-5 text-teal-300" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                    Apex Retail Bank
                  </h1>
                  <p className="text-xs text-teal-200">Secure Document & Identity Verification Portal</p>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs">
              <div className="flex items-center sm:justify-end gap-1.5 text-teal-200 font-medium">
                <Lock className="w-3.5 h-3.5" />
                <span>256-Bit TLS Bank-Grade Encryption</span>
              </div>
              <div className="mt-1 text-slate-300 font-mono text-[11px]">
                Application Ref: <strong>{portalData?.applicationId || `APP-${selectedCaseId}`}</strong>
              </div>
              <div className="text-slate-300 text-[11px]">
                Applicant: <strong>{portalData?.customerName}</strong>
              </div>
            </div>
          </div>

          {/* Stepper Indicator */}
          <div className="mt-8 pt-6 border-t border-teal-700/50">
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="space-y-1">
                <div className="w-6 h-6 rounded-full bg-emerald-400 text-slate-900 font-bold mx-auto flex items-center justify-center text-xs">
                  ✓
                </div>
                <div className="font-semibold text-white">1. Request Sent</div>
                <div className="text-[10px] text-teal-200 hidden sm:block">Bank reviewed intake</div>
              </div>

              <div className="space-y-1">
                <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-xs font-bold ${
                  portalData?.uploadedDocs && portalData.uploadedDocs.length > 0 
                    ? 'bg-emerald-400 text-slate-900' 
                    : 'bg-white text-teal-900 ring-2 ring-teal-300'
                }`}>
                  {portalData?.uploadedDocs && portalData.uploadedDocs.length > 0 ? '✓' : '2'}
                </div>
                <div className="font-semibold text-white">2. Upload Proof</div>
                <div className="text-[10px] text-teal-200 hidden sm:block">Provide documents</div>
              </div>

              <div className="space-y-1">
                <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-xs font-bold ${
                  isSubmitted ? 'bg-emerald-400 text-slate-900' : 'bg-teal-900/80 text-teal-300 border border-teal-600'
                }`}>
                  {isSubmitted ? '✓' : '3'}
                </div>
                <div className="font-semibold text-white">3. Review Submission</div>
                <div className="text-[10px] text-teal-200 hidden sm:block">Verification in progress</div>
              </div>

              <div className="space-y-1">
                <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-xs font-bold ${
                  portalData?.portalStatus === 'VERIFIED_COMPLETED' ? 'bg-emerald-400 text-slate-900' : 'bg-teal-900/80 text-teal-400 border border-teal-600'
                }`}>
                  4
                </div>
                <div className="font-semibold text-white">4. Completed</div>
                <div className="text-[10px] text-teal-200 hidden sm:block">Final onboarding notice</div>
              </div>
            </div>
          </div>
        </div>

        {/* Portal Body Content */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Status Alert Banner */}
          {isCorrection ? (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Action Required: Document Correction Requested</span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                Our verification team reviewed your previous submission and noted an item requiring clarification or re-upload. Please check the requested items below and upload an updated copy.
              </p>
            </div>
          ) : isSubmitted ? (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg text-xs space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Documents Successfully Submitted & Locked for Review</span>
                </div>
                {portalData?.receipt && (
                  <button
                    onClick={() => setShowReceiptModal(true)}
                    className="text-xs text-teal-700 hover:text-teal-900 font-bold underline flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Official Receipt</span>
                  </button>
                )}
              </div>
              <p className="text-emerald-800 leading-relaxed">
                Thank you! Your documents have been securely delivered to our verification specialists. You will receive an email confirmation once the assessment is finalized.
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-xs text-slate-700 leading-relaxed">
              <div className="font-semibold text-slate-900 mb-1">What we need from you</div>
              To comply with banking regulations and protect your account from unauthorized opening, please upload the requested items below. Your progress is saved as you go.
            </div>
          )}

          {/* SECTION 1: Requested Items Checklist */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs">1</span>
              <span>Requested Documents & Information</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {requestedItems.map(item => (
                <div 
                  key={item.id} 
                  className={`p-4 rounded-lg border text-xs space-y-2 transition-colors ${
                    item.fulfilled 
                      ? 'bg-emerald-50/70 border-emerald-200 text-slate-800' 
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      {item.fulfilled ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                      )}
                      <span>{item.title}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.fulfilled 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : item.required 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.fulfilled ? 'Uploaded' : item.required ? 'Required' : 'Optional'}
                    </span>
                  </div>

                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: Document Upload Workspace */}
          <div className="space-y-4 pt-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs">2</span>
              <span>Upload Supporting Files</span>
            </h2>

            {!isSubmitted && (
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center space-y-4 hover:border-teal-500 transition-colors">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-xs text-slate-700">
                    <label htmlFor="file-upload" className="font-semibold text-teal-700 hover:text-teal-800 cursor-pointer">
                      Click to choose a file
                    </label>{' '}
                    <span>or drag and drop here</span>
                  </div>
                  <p className="text-[11px] text-slate-400">PDF, PNG, JPG or TIFF up to 25 MB</p>
                </div>

                <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-left pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Document Category</label>
                    <select
                      value={selectedDocType}
                      onChange={(e) => setSelectedDocType(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
                    >
                      <option value="Proof of Residential Address">Proof of Residential Address</option>
                      <option value="Government Photo ID (Driver's License / Passport)">Government Photo ID</option>
                      <option value="Household Lease or Deed Agreement">Household Lease or Deed</option>
                      <option value="Explanation Letter">Explanation Letter</option>
                      <option value="Bank Statement / Financial Document">Bank Statement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Optional Note for Reviewer</label>
                    <input
                      type="text"
                      placeholder="e.g. Electric bill dated Sept 15"
                      value={uploadNote}
                      onChange={(e) => setUploadNote(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors inline-flex items-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Validating & Uploading...' : 'Select File to Upload'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Uploaded Documents List */}
            {portalData?.uploadedDocs && portalData.uploadedDocs.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Attached Documents ({portalData.uploadedDocs.length})</span>
                  <span className="text-[11px] text-slate-500 font-normal">All files scanned for integrity</span>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                  {portalData.uploadedDocs.map(doc => (
                    <div key={doc.id} className="p-3.5 flex items-center justify-between gap-4 text-xs hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{doc.fileName}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>{doc.documentType}</span>
                            <span>•</span>
                            <span>{doc.fileSize}</span>
                            <span>•</span>
                            <span>Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                          </div>
                          {doc.notes && (
                            <div className="text-[11px] text-slate-600 italic mt-0.5">Note: {doc.notes}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {doc.status === 'CORRECTION_REQUESTED' ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            Correction Needed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Verified
                          </span>
                        )}

                        {!isSubmitted && (
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Remove document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
                No documents uploaded yet. Choose a file above to begin.
              </div>
            )}
          </div>

          {/* SECTION 3: Additional Customer Statement & Draft Saving */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs">3</span>
                <span>Explanation or Context Statement (Optional)</span>
              </h2>
              {draftSavedAt && (
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Draft saved at {draftSavedAt}</span>
                </span>
              )}
            </div>

            <textarea
              rows={3}
              value={draftStatement}
              onChange={(e) => setDraftStatement(e.target.value)}
              disabled={isSubmitted}
              placeholder="If you have any context regarding your address, co-residents, or secondary devices, please share here..."
              className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
            />

            {!isSubmitted && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isSavingDraft ? 'Saving...' : 'Save Progress as Draft'}</span>
                </button>
              </div>
            )}
          </div>

          {/* SECTION 4: Secure Question Thread (Messaging with Bank Officer) */}
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-600" />
              <span>Questions & Official Messages</span>
            </h2>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="max-h-56 overflow-y-auto space-y-2.5 pr-2">
                {portalData?.messages && portalData.messages.length > 0 ? (
                  portalData.messages.map(msg => {
                    const isFromCustomer = msg.sender === 'CUSTOMER';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isFromCustomer ? 'items-end' : 'items-start'}`}
                      >
                        <div className="text-[10px] text-slate-400 mb-0.5 px-1 flex items-center gap-1">
                          <span>{msg.senderName}</span>
                          <span>•</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div
                          className={`max-w-md p-3 rounded-lg text-xs leading-relaxed ${
                            isFromCustomer
                              ? 'bg-teal-700 text-white rounded-br-none shadow-xs'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-3 text-slate-400 text-xs">
                    No messages yet. Send a question below if you need help with your documents.
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-200">
                <input
                  type="text"
                  placeholder="Ask a question about document requirements or timeline..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  disabled={isSendingMessage || !chatInput.trim()}
                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>

          {/* Submission Action Bar */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              {allFulfilled ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>All requested verification items provided.</span>
                </span>
              ) : (
                <span className="text-amber-700 font-semibold flex items-center gap-1">
                  <Info className="w-4 h-4 text-amber-600" />
                  <span>Please fulfill required items to expedite your review.</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {portalData?.receipt && (
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(true)}
                  className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Receipt</span>
                </button>
              )}

              {!isSubmitted ? (
                <button
                  type="button"
                  onClick={handleSubmitPackage}
                  disabled={!portalData?.uploadedDocs || portalData.uploadedDocs.length === 0}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Documents for Verification</span>
                </button>
              ) : (
                <div className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Submission Locked (Under Active Review)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* OFFICIAL DIGITAL RECEIPT MODAL */}
      {showReceiptModal && portalData?.receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 text-xs text-slate-800">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="text-teal-800 font-bold uppercase tracking-wider text-[11px]">Apex Retail Bank</div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Verification Submission Receipt</h3>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-lg text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Status: Confirmed Received</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Your verification documents have been registered in our bank audit vault. Keep this receipt for your records.
              </p>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Receipt Code:</span>
                <span className="font-mono font-bold text-slate-900">{portalData.receipt.receiptId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Acknowledgement No:</span>
                <span className="font-mono font-bold text-teal-700">{portalData.receipt.acknowledgementCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Applicant:</span>
                <span className="font-semibold text-slate-800">{portalData.receipt.customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Submitted At:</span>
                <span>{new Date(portalData.receipt.submittedAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Cryptographic Checksum:</span>
                <span className="font-mono text-[10px] text-slate-600">{portalData.receipt.checksum}</span>
              </div>
              <div className="pt-1">
                <span className="text-slate-500 block mb-1">Attached Documents ({portalData.receipt.documentsCount}):</span>
                <ul className="list-disc pl-4 text-slate-700 space-y-0.5">
                  {portalData.receipt.documentNames.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-1.5 bg-teal-600 text-white rounded font-semibold hover:bg-teal-500"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
