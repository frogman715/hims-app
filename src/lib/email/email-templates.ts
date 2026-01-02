/**
 * Email Templates
 * HTML templates untuk berbagai email notification
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

/**
 * Email template untuk form submission confirmation
 */
export function submissionConfirmationTemplate(data: {
  crewName: string;
  formName: string;
  formCode: string;
  submissionId: string;
  submittedAt: string;
  dashboardUrl: string;
}): EmailTemplate {
  return {
    subject: `Form Submission Confirmed - ${data.formCode}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; }
            .button { display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2563eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Form Submission Confirmed ✓</h2>
            </div>
            <div class="content">
              <p>Halo ${data.crewName},</p>
              
              <p>Form <strong>${data.formName}</strong> (${data.formCode}) telah berhasil disubmit.</p>
              
              <div class="info-box">
                <p><strong>Submission ID:</strong> ${data.submissionId}</p>
                <p><strong>Submitted At:</strong> ${data.submittedAt}</p>
                <p><strong>Status:</strong> <span style="color: #059669;">SUBMITTED</span></p>
              </div>
              
              <p>Form Anda sekarang dalam review. Tim manager akan memeriksa dan memberikan feedback dalam waktu singkat.</p>
              
              <p>
                <a href="${data.dashboardUrl}" class="button">View Submission</a>
              </p>
              
              <p>Terima kasih,<br>HIMS System</p>
            </div>
            <div class="footer">
              <p>© 2026 HIMS - Crewing Management System | Do not reply to this email</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Email template untuk form approval
 */
export function approvalNotificationTemplate(data: {
  crewName: string;
  formName: string;
  formCode: string;
  approverName: string;
  approvalRemarks: string;
  approvedAt: string;
  dashboardUrl: string;
}): EmailTemplate {
  return {
    subject: `Form Approved ✓ - ${data.formCode}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #059669; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; }
            .button { display: inline-block; background-color: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #059669; }
            .success-badge { background-color: #dcfce7; color: #166534; padding: 5px 10px; border-radius: 3px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🎉 Form Approved!</h2>
            </div>
            <div class="content">
              <p>Halo ${data.crewName},</p>
              
              <p>Selamat! Form <strong>${data.formName}</strong> (${data.formCode}) telah <span class="success-badge">DISETUJUI</span></p>
              
              <div class="info-box">
                <p><strong>Approver:</strong> ${data.approverName}</p>
                <p><strong>Approved At:</strong> ${data.approvedAt}</p>
                <p><strong>Remarks:</strong> ${data.approvalRemarks || '—'}</p>
              </div>
              
              <p>Form Anda sekarang dalam status APPROVED. Anda dapat melanjutkan dengan tahap berikutnya.</p>
              
              <p>
                <a href="${data.dashboardUrl}" class="button">View Details</a>
              </p>
              
              <p>Terima kasih,<br>HIMS System</p>
            </div>
            <div class="footer">
              <p>© 2026 HIMS - Crewing Management System | Do not reply to this email</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Email template untuk form rejection
 */
export function rejectionNotificationTemplate(data: {
  crewName: string;
  formName: string;
  formCode: string;
  rejectionReason: string;
  rejectedAt: string;
  dashboardUrl: string;
}): EmailTemplate {
  return {
    subject: `Form Revision Needed - ${data.formCode}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; }
            .button { display: inline-block; background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .info-box { background-color: #fef2f2; padding: 15px; margin: 10px 0; border-left: 4px solid #dc2626; }
            .warning-badge { background-color: #fee2e2; color: #991b1b; padding: 5px 10px; border-radius: 3px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>⚠️ Revision Needed</h2>
            </div>
            <div class="content">
              <p>Halo ${data.crewName},</p>
              
              <p>Form <strong>${data.formName}</strong> (${data.formCode}) memerlukan <span class="warning-badge">REVISI</span></p>
              
              <div class="info-box">
                <p><strong>Alasan Penolakan:</strong></p>
                <p>${data.rejectionReason}</p>
                <p style="margin-top: 10px; font-size: 12px; color: #666;"><strong>Tanggal:</strong> ${data.rejectedAt}</p>
              </div>
              
              <p>Silakan periksa form Anda dan lakukan perbaikan sesuai dengan alasan di atas. Setelah selesai, submit kembali untuk review.</p>
              
              <p>
                <a href="${data.dashboardUrl}" class="button">Edit & Resubmit</a>
              </p>
              
              <p>Jika ada pertanyaan, hubungi tim manager.<br>Terima kasih,<br>HIMS System</p>
            </div>
            <div class="footer">
              <p>© 2026 HIMS - Crewing Management System | Do not reply to this email</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Email template untuk document expiry warning
 */
export function documentExpiryWarningTemplate(data: {
  crewName: string;
  documentTitle: string;
  expiryDate: string;
  daysUntilExpiry: number;
  dashboardUrl: string;
}): EmailTemplate {
  return {
    subject: `Document Expiry Warning - ${data.documentTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f59e0b; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; }
            .button { display: inline-block; background-color: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .warning-box { background-color: #fffbeb; padding: 15px; margin: 10px 0; border-left: 4px solid #f59e0b; }
            .alert-badge { background-color: #fde68a; color: #92400e; padding: 5px 10px; border-radius: 3px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>⏰ Document Expiry Alert</h2>
            </div>
            <div class="content">
              <p>Halo ${data.crewName},</p>
              
              <p>Dokumen Anda <strong>${data.documentTitle}</strong> akan segera expired.</p>
              
              <div class="warning-box">
                <p><strong>Expiry Date:</strong> ${data.expiryDate}</p>
                <p><strong>Days Until Expiry:</strong> <span class="alert-badge">${data.daysUntilExpiry} hari</span></p>
              </div>
              
              <p>Silakan segera update atau renew dokumen Anda untuk memastikan kelengkapan administrasi.</p>
              
              <p>
                <a href="${data.dashboardUrl}" class="button">Update Documents</a>
              </p>
              
              <p>Terima kasih,<br>HIMS System</p>
            </div>
            <div class="footer">
              <p>© 2026 HIMS - Crewing Management System | Do not reply to this email</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Email template untuk missing documents notification
 */
export function missingDocumentsTemplate(data: {
  crewName: string;
  submissionId: string;
  missingDocuments: string[];
  requiredBy: string;
  dashboardUrl: string;
}): EmailTemplate {
  const docList = data.missingDocuments.map((doc) => `<li>${doc}</li>`).join('');

  return {
    subject: `Missing Documents Required - Action Needed`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f59e0b; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; }
            .button { display: inline-block; background-color: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #f59e0b; }
            ul { padding-left: 20px; }
            li { margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📋 Missing Documents</h2>
            </div>
            <div class="content">
              <p>Halo ${data.crewName},</p>
              
              <p>Submission Anda masih memerlukan dokumen-dokumen berikut:</p>
              
              <div class="info-box">
                <ul>
                  ${docList}
                </ul>
                <p style="margin-top: 15px;"><strong>Required by:</strong> ${data.requiredBy}</p>
              </div>
              
              <p>Silakan upload dokumen-dokumen yang masih kurang untuk melanjutkan proses review.</p>
              
              <p>
                <a href="${data.dashboardUrl}" class="button">Upload Documents</a>
              </p>
              
              <p>Terima kasih,<br>HIMS System</p>
            </div>
            <div class="footer">
              <p>© 2026 HIMS - Crewing Management System | Do not reply to this email</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Email template untuk approval request (ke manager)
 */
export function approvalRequestTemplate(data: {
  managerName: string;
  crewName: string;
  formName: string;
  formCode: string;
  submittedAt: string;
  dashboardUrl: string;
}): EmailTemplate {
  return {
    subject: `New Form Submission Awaiting Review - ${data.formCode}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; }
            .button { display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2563eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📝 New Submission Awaiting Review</h2>
            </div>
            <div class="content">
              <p>Halo ${data.managerName},</p>
              
              <p>Ada form baru yang memerlukan review Anda:</p>
              
              <div class="info-box">
                <p><strong>Crew:</strong> ${data.crewName}</p>
                <p><strong>Form:</strong> ${data.formName} (${data.formCode})</p>
                <p><strong>Submitted:</strong> ${data.submittedAt}</p>
              </div>
              
              <p>Silakan review submission ini dan berikan approval atau rejection dengan catatan yang lengkap.</p>
              
              <p>
                <a href="${data.dashboardUrl}" class="button">Review Submission</a>
              </p>
              
              <p>Terima kasih,<br>HIMS System</p>
            </div>
            <div class="footer">
              <p>© 2026 HIMS - Crewing Management System | Do not reply to this email</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}
