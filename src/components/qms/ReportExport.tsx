'use client';

import React, { useState } from 'react';
import { Download, Mail, Clock, AlertCircle } from 'lucide-react';

interface ReportExportProps {
  reportId: string;
  reportTitle: string;
  onExportComplete?: () => void;
}

interface ExportStatus {
  type: 'idle' | 'exporting' | 'emailing' | 'scheduling' | 'success' | 'error';
  message?: string;
}

/**
 * ReportExport Component - UI for exporting and distributing reports
 * Supports PDF/Excel export and email scheduling
 */
export default function ReportExport({ reportId, reportTitle, onExportComplete }: ReportExportProps) {
  const [status, setStatus] = useState<ExportStatus>({ type: 'idle' });
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [schedule, setSchedule] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle PDF export
   */
  const handlePDFExport = async () => {
    setIsLoading(true);
    setStatus({ type: 'exporting', message: 'Generating PDF...' });

    try {
      const response = await fetch(`/api/qms/reports/${reportId}/export?format=pdf`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('PDF export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatus({ type: 'success', message: 'PDF exported successfully' });
      setTimeout(() => setStatus({ type: 'idle' }), 3000);
      onExportComplete?.();
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Export failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Excel export
   */
  const handleExcelExport = async () => {
    setIsLoading(true);
    setStatus({ type: 'exporting', message: 'Generating Excel...' });

    try {
      const response = await fetch(`/api/qms/reports/${reportId}/export?format=excel`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Excel export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportTitle.replace(/[^a-z0-9]/gi, '_')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatus({ type: 'success', message: 'Excel exported successfully' });
      setTimeout(() => setStatus({ type: 'idle' }), 3000);
      onExportComplete?.();
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Export failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle email distribution
   */
  const handleEmailDistribution = async () => {
    if (!emailRecipients.trim()) {
      setStatus({ type: 'error', message: 'Please enter at least one email address' });
      return;
    }

    const recipients = emailRecipients
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (recipients.length === 0) {
      setStatus({ type: 'error', message: 'No valid email addresses provided' });
      return;
    }

    setIsLoading(true);
    setStatus({ type: 'emailing', message: 'Sending emails...' });

    try {
      const response = await fetch(`/api/qms/reports/${reportId}/export?format=pdf&email=${recipients.join('&email=')}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Email distribution failed');
      }

      setStatus({
        type: 'success',
        message: `Report sent to ${recipients.length} recipient(s)`,
      });
      setEmailRecipients('');
      setShowEmailForm(false);
      setTimeout(() => setStatus({ type: 'idle' }), 3000);
      onExportComplete?.();
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Distribution failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle schedule creation
   */
  const handleScheduleCreation = async () => {
    if (!emailRecipients.trim()) {
      setStatus({ type: 'error', message: 'Please enter at least one email address' });
      return;
    }

    const recipients = emailRecipients
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (recipients.length === 0) {
      setStatus({ type: 'error', message: 'No valid email addresses provided' });
      return;
    }

    setIsLoading(true);
    setStatus({ type: 'scheduling', message: `Scheduling ${schedule} distribution...` });

    try {
      const response = await fetch(`/api/qms/reports/${reportId}/distributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          schedule,
          provider: 'nodemailer',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Schedule creation failed');
      }

      await response.json();

      setStatus({
        type: 'success',
        message: `Report scheduled for ${schedule} distribution`,
      });
      setEmailRecipients('');
      setShowScheduleForm(false);
      setTimeout(() => setStatus({ type: 'idle' }), 3000);
      onExportComplete?.();
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Scheduling failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Messages */}
      {status.type !== 'idle' && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 ${
            status.type === 'success'
              ? 'bg-green-50 text-green-900 border border-green-200'
              : status.type === 'error'
                ? 'bg-red-50 text-red-900 border border-red-200'
                : 'bg-blue-50 text-blue-900 border border-blue-200'
          }`}
        >
          {status.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {status.type === 'success' && <div className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600">✓</div>}
          {['exporting', 'emailing', 'scheduling'].includes(status.type) && (
            <div className="w-5 h-5 flex-shrink-0 mt-0.5 animate-spin text-blue-600">⟳</div>
          )}
          <div>
            <p className="font-medium">{status.message}</p>
          </div>
        </div>
      )}

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handlePDFExport}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </button>

        <button
          onClick={handleExcelExport}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Download className="w-4 h-4" />
          Export Excel
        </button>

        <button
          onClick={() => {
            setShowEmailForm(!showEmailForm);
            setShowScheduleForm(false);
          }}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Mail className="w-4 h-4" />
          Email Report
        </button>

        <button
          onClick={() => {
            setShowScheduleForm(!showScheduleForm);
            setShowEmailForm(false);
          }}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Clock className="w-4 h-4" />
          Schedule Delivery
        </button>
      </div>

      {/* Email Distribution Form */}
      {showEmailForm && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
          <h4 className="font-semibold text-purple-900">Send Report via Email</h4>
          <textarea
            placeholder="Enter email addresses (comma-separated)"
            value={emailRecipients}
            onChange={(e) => setEmailRecipients(e.target.value)}
            className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={3}
            disabled={isLoading}
          />
          <div className="flex gap-2">
            <button
              onClick={handleEmailDistribution}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
            >
              Send Now
            </button>
            <button
              onClick={() => setShowEmailForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Schedule Form */}
      {showScheduleForm && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-3">
          <h4 className="font-semibold text-orange-900">Schedule Recurring Delivery</h4>
          <textarea
            placeholder="Enter email addresses (comma-separated)"
            value={emailRecipients}
            onChange={(e) => setEmailRecipients(e.target.value)}
            className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            rows={3}
            disabled={isLoading}
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-orange-900">Frequency:</label>
            <select
              value={schedule}
              onChange={(e) => setSchedule(e.target.value as 'daily' | 'weekly' | 'monthly')}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleScheduleCreation}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition"
            >
              Schedule
            </button>
            <button
              onClick={() => setShowScheduleForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
