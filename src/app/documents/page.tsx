'use client';

import React, { useState } from 'react';
import { Plus, Settings } from 'lucide-react';
import Modal from '@/components/Modal';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';
import { Button } from '@/components/ui/Button';
import {
  DocumentUploadForm,
  DocumentList,
  ApprovalDashboard,
  DistributeModal,
  AcknowledgeModal,
} from '@/components/documents';

export default function DocumentManagementPage() {
  const [activeTab, setActiveTab] = useState<
    'documents' | 'approvals'
  >('documents');

  // Create Document Modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Distribute Modal
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [selectedDocumentId] = useState<string>('');
  const [selectedDocumentTitle] = useState<string>('');
  const [selectedDocCode] = useState<string>('');

  // Acknowledge Modal
  const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false);

  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateDocument = () => {
    setShowCreateModal(false);
    setRefreshKey((prev) => prev + 1);
  };

  const handleSelectDocument = () => {
    // Could open detail view here
    // console.log('Selected document:', document);
  };

  const handleApprovalAction = () => {
    // console.log(`${action} document ${documentId}`);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Document Control"
        title="Controlled document workspace"
        subtitle="Manage, review, approve, and acknowledge controlled documents across the office workflow."
        helperLinks={[
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/quality/forms/reference', label: 'Forms Library' },
        ]}
        highlights={[
          { label: 'Control Areas', value: 'Register + Approval', detail: 'Switch between live document records and approval queue from one desk.' },
          { label: 'Workflow Rule', value: 'One Controlled Source', detail: 'Use this workspace for official upload, review, distribution, and acknowledgement.' },
        ]}
        actions={(
          <Button type="button" size="sm" onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="h-4 w-4" />}>
            New Document
          </Button>
        )}
      />

      <section className="surface-card border-sky-200 bg-sky-50/70 p-5">
        <p className="text-sm font-semibold text-sky-900">How to use this workspace</p>
        <p className="mt-1 text-sm text-sky-800">
          Start in the document register to review controlled files, then move to approvals when a document is ready for release or acknowledgement handling.
        </p>
      </section>

      <section className="surface-card overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-white">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'documents'
                  ? 'border-cyan-700 text-cyan-800'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Documents
              </div>
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'approvals'
                  ? 'border-cyan-700 text-cyan-800'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Approvals
              </div>
            </button>
          </div>
        </div>

      <div className="p-6">
        {activeTab === 'documents' && (
          <DocumentList
            key={refreshKey}
            onSelectDocument={handleSelectDocument}
            onEditDocument={() => console.log('Edit')}
            onApproveDocument={() => setActiveTab('approvals')}
          />
        )}

        {activeTab === 'approvals' && (
          <ApprovalDashboard
            key={refreshKey}
            onApprovalAction={handleApprovalAction}
          />
        )}
      </div>
      </section>

      {/* Create Document Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Register Controlled Document"
        size="lg"
      >
        <DocumentUploadForm
          onSuccess={handleCreateDocument}
          onClose={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Distribute Modal */}
      <DistributeModal
        isOpen={showDistributeModal}
        onClose={() => setShowDistributeModal(false)}
        documentId={selectedDocumentId}
        documentTitle={selectedDocumentTitle}
        onSuccess={() => setRefreshKey((prev) => prev + 1)}
      />

      {/* Acknowledge Modal */}
      <AcknowledgeModal
        isOpen={showAcknowledgeModal}
        onClose={() => setShowAcknowledgeModal(false)}
        documentId={selectedDocumentId}
        documentCode={selectedDocCode}
        documentTitle="Document"
        onSuccess={() => setRefreshKey((prev) => prev + 1)}
      />
    </div>
  );
}
