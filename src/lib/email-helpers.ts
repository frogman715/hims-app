/**
 * Email Helper Functions
 * Specific email templates for document expiry and crew notifications
 */

export function documentExpiryReminderTemplate(data: {
  crewName: string;
  documentType: string;
  expiryDate: string;
  daysUntilExpiry: number;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const urgency = data.daysUntilExpiry <= 7 ? "URGENT" : "REMINDER";
  const colorCode = data.daysUntilExpiry <= 7 ? "#dc2626" : "#f59e0b";

  return {
    subject: `[${urgency}] ${data.documentType} Expiring Soon - ${data.expiryDate}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #333;
              line-height: 1.6;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, ${colorCode} 0%, #f97316 100%);
              color: white;
              padding: 25px;
              border-radius: 8px 8px 0 0;
              text-align: center;
            }
            .header h2 {
              margin: 0;
              font-size: 20px;
              font-weight: bold;
            }
            .content {
              background-color: #f9fafb;
              padding: 25px;
              border: 1px solid #e5e7eb;
              border-bottom: none;
            }
            .footer {
              background-color: #f3f4f6;
              text-align: center;
              padding: 15px;
              font-size: 12px;
              color: #666;
              border: 1px solid #e5e7eb;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, ${colorCode} 0%, #f97316 100%);
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 15px 0;
              font-weight: bold;
              transition: transform 0.2s;
            }
            .button:hover {
              transform: scale(1.05);
            }
            .info-box {
              background-color: white;
              padding: 15px;
              margin: 15px 0;
              border-left: 4px solid ${colorCode};
              border-radius: 4px;
            }
            .info-box strong {
              display: block;
              color: ${colorCode};
              margin-bottom: 5px;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .alert-badge {
              display: inline-block;
              background-color: ${colorCode};
              color: white;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .checklist {
              background-color: white;
              padding: 15px;
              margin: 15px 0;
              border-left: 4px solid #10b981;
              border-radius: 4px;
            }
            .checklist-item {
              display: flex;
              margin-bottom: 8px;
              font-size: 14px;
            }
            .checklist-item::before {
              content: '→';
              color: #10b981;
              font-weight: bold;
              margin-right: 10px;
              min-width: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="alert-badge">${urgency}</div>
              <h2>Document Expiry Reminder</h2>
            </div>
            <div class="content">
              <p>Hi <strong>${data.crewName}</strong>,</p>
              
              <p>This is to remind you that your <strong>${data.documentType}</strong> is expiring soon.</p>
              
              <div class="info-box">
                <strong>Document Type</strong>
                ${data.documentType}
              </div>
              
              <div class="info-box">
                <strong>Expiry Date</strong>
                ${data.expiryDate}
              </div>
              
              <div class="info-box">
                <strong>Days Until Expiry</strong>
                <span style="color: ${colorCode}; font-weight: bold; font-size: 18px;">
                  ${data.daysUntilExpiry} days
                </span>
              </div>
              
              <div class="checklist">
                <div class="checklist-item">Start renewal process immediately if expiring within 30 days</div>
                <div class="checklist-item">Contact your supervisor for document renewal assistance</div>
                <div class="checklist-item">Submit new documentation through the HIMS portal</div>
                <div class="checklist-item">Ensure all certifications are current before signing on</div>
              </div>
              
              <p>Please take immediate action to renew your document and avoid any disruption to your assignment.</p>
              
              <p style="text-align: center;">
                <a href="${data.dashboardUrl}" class="button">View Details in HIMS</a>
              </p>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                If you believe this notification is in error or have already renewed this document, please contact the HR department immediately.
              </p>
              
              <p style="margin-top: 20px;">
                Best regards,<br>
                <strong>HIMS Crewing Management System</strong>
              </p>
            </div>
            <div class="footer">
              <p>© 2026 HIMS - Human Resource Management System</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Medical Check-up Reminder
 */
export function medicalCheckupReminderTemplate(data: {
  crewName: string;
  checkupType: string;
  dueDate: string;
  scheduleUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Medical Check-up Due - ${data.checkupType}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0891b2; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; border: 1px solid #e5e7eb; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; background-color: #0891b2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #0891b2; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Medical Check-up Reminder</h2>
            </div>
            <div class="content">
              <p>Hi ${data.crewName},</p>
              
              <p>You have a medical check-up due:</p>
              
              <div class="info-box">
                <strong>Check-up Type:</strong> ${data.checkupType}<br>
                <strong>Due Date:</strong> ${data.dueDate}
              </div>
              
              <p>Please schedule your appointment at the approved medical center to ensure compliance with international maritime regulations.</p>
              
              <p style="text-align: center;">
                <a href="${data.scheduleUrl}" class="button">Schedule Now</a>
              </p>
              
              <p>Thank you,<br>HIMS System</p>
            </div>
            <div class="footer">
              <p>© 2026 HIMS - Crewing Management System</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}
