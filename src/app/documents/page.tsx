'use client';

import React, { useState } from 'react';
import { Plus, Settings } from 'lucide-react';
import Modal from '@/components/Modal';
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

  // Acknowledge Modal
  const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false);

  // Selected document for modals
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [selectedDocumentTitle, setSelectedDocumentTitle] = useState<string>('');
  const [selectedDocCode, setSelectedDocCode] = useState<string>('');

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Document Control
              </h1>
              <p className="text-gray-600 mt-2">
                Manage, approve, and acknowledge documents
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              New Document
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'documents'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Documents
              </div>
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'approvals'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Approvals
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      {/* Create Document Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Document"
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
