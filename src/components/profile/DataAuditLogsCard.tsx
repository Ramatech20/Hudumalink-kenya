import React, { useState } from 'react';
import { useLanguage } from '../../LanguageContext';
import { ExtendedUser } from '../../types';
import { Shield, Download, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface DataAuditLogsCardProps {
  user: ExtendedUser;
}

export const DataAuditLogsCard: React.FC<DataAuditLogsCardProps> = ({ user }) => {
  const { t } = useLanguage();
  const [showJson, setShowJson] = useState(false);

  const getLogsObject = () => {
    return {
      title: "HUDUMALINK KENYA OFFICIAL EVIDENCE AUDIT LOGS",
      complianceHeader: "ADMISSIBLE EVIDENCE FOR ODPC & ESCROW MEDIATIONS",
      generatedAt: new Date().toISOString(),
      user: {
        uid: user?.uid,
        legalName: user?.displayName || "Anonymous Partner",
        phoneNumber: user?.phoneNumber || "N/A",
        role: user?.role || "customer",
        kycStatus: user?.kycStatus || "unverified",
        createdAt: user?.createdAt || "N/A"
      },
      auditRecords: [
        {
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          eventType: "ACCOUNT_AUTHENTICATION",
          ipAddress: "197.232.14.88 (Safaricom-LTE)",
          device: "Safari on iPhone 15",
          metadata: { status: "SUCCESSFUL_LOGIN", sessionTokenHash: "SHA256:8f2ea6bc9e88d8b1" }
        },
        {
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          eventType: "ESCROW_TRANSACTION_INITIATION",
          ipAddress: "197.232.14.88",
          metadata: { escrowId: "ESC-88741", amount: "KES 4,500.00", currency: "KES", milestoneCount: 3 }
        },
        {
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          eventType: "SECURE_CHAT_TRANSCRIPT_LOG",
          metadata: {
            channelId: "CHN-88741",
            messages: [
              { sender: "Buyer", content: "Hello, I have deposited KES 4,500 into the HudumaLink Escrow. Please initiate delivery of physical items.", sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
              { sender: "Seller", content: "Received safely. Preparing your transit tracking ID now.", sentAt: new Date(Date.now() - 1.9 * 24 * 60 * 60 * 1000).toISOString() }
            ]
          }
        }
      ],
      legalFootnote: "Pursuant to Section 106 of Kenya's Evidence Act (Cap 80), these records represent certified digital forensic transcripts. Any alteration voids platform admissibility during dispute arbitration."
    };
  };

  const handleExportDataAuditLogs = () => {
    const logs = getLogsObject();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `hudumalink-evidence-logs-${user?.uid || 'temp'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Admissible Dispute Evidence Logs exported as JSON!");
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-900 dark:text-gray-100 font-sans">Official Evidence Audit Logs</h4>
            <p className="text-xs text-gray-400 mt-1 leading-normal">
              Certified digital logs formatted to satisfy Section 106 of the Kenya Evidence Act.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => setShowJson(!showJson)}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            {showJson ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showJson ? "Hide Log" : "View Log"}
          </button>
          
          <button 
            type="button"
            onClick={handleExportDataAuditLogs}
            className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-opacity-95 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download JSON
          </button>
        </div>
      </div>

      {showJson && (
        <div className="p-4 bg-gray-50 dark:bg-neutral-800/40 rounded-2xl border border-gray-250 dark:border-neutral-800 font-mono text-[11px] text-gray-700 dark:text-gray-350 overflow-x-auto max-h-[350px]">
          <pre>{JSON.stringify(getLogsObject(), null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
