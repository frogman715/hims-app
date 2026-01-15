# 📧 FEATURE SPEC 2: EMAIL NOTIFICATIONS
**Priority:** 🔴 CRITICAL  
**Timeline:** 2-3 days (Week 1-2)  
**Dev:** Dev A/B  
**Status:** Ready to implement  

---

## 🎯 OBJECTIVE
Send automated email notifications to crew members, officers, and administrators about important events (form status, document expiry, crew changes, etc.).

---

## 📋 REQUIREMENTS

### **Email Types to Send**

```
1. FORM NOTIFICATIONS
   - Form submitted → Officer notified
   - Form approved → Seafarer notified
   - Form rejected → Seafarer notified with reason
   - Form pending → Reminder after 3 days
   - Form expiring soon → Reminder 7 days before

2. DOCUMENT NOTIFICATIONS
   - Document expires in 30 days → Crew notified
   - Document expires in 7 days → Officer notified
   - Document uploaded → Admin notified
   - Document rejected → Crew notified

3. CREW NOTIFICATIONS
   - New assignment → Crew notified
   - Departure reminder → Crew notified (3 days before)
   - Sign-off scheduled → Crew notified
   - Document ready for pickup → Crew notified

4. ADMIN NOTIFICATIONS
   - New application → Admin notified
   - Bulk upload started → Admin notified
   - Sync error → Admin notified
   - High document expiry rate → Admin notified

5. DIGEST NOTIFICATIONS
   - Daily digest (optional) → Crew/Officer
   - Weekly summary → Admin
   - Monthly report → Management
```

### **Functional Requirements**

```
FR-1: Email on form status change
  - Trigger: Form status changes
  - Recipient: Form owner, assigned officer
  - Content: Status, next steps, action links

FR-2: Email on document expiry
  - Trigger: Document expiry date approaching
  - Recipient: Crew member, supervisor
  - Content: Document name, expiry date, renewal link

FR-3: Email on crew assignment
  - Trigger: New crew assignment created
  - Recipient: Assigned crew member
  - Content: Vessel, position, departure date

FR-4: Unsubscribe option
  - User can manage email preferences
  - User can unsubscribe from notification types
  - Preserve audit trail of preferences

FR-5: Email templates
  - Professional design
  - Logo and branding
  - Mobile responsive
  - Clear call-to-action
```

### **Non-Functional Requirements**

```
NFR-1: Performance
  - Email sent within 2 seconds of trigger
  - Use background jobs for batch sends
  - Queue system for high volume

NFR-2: Reliability
  - 99% delivery rate
  - Automatic retry on failure
  - Track email open/click rates
  - Handle bounces gracefully

NFR-3: Security
  - Encrypt email addresses
  - Use SendGrid (trusted provider)
  - Verify sender domain
  - SPF/DKIM/DMARC configured

NFR-4: Compliance
  - GDPR compliant (unsubscribe, preferences)
  - Privacy policy mentioned
  - Contact info in footer
  - No spam
```

---

## 🏗️ TECHNICAL DESIGN

### **Technology Stack**
```
Service: SendGrid (SendGrid API)
Library: @sendgrid/mail
Queue: Bull (optional, for background jobs)
Database: Store email logs in PostgreSQL
```

### **Architecture**

```
Event triggered (form approved, document expired, etc.)
  ↓
Call notification service
  ↓
Check user preferences (opted in?)
  ↓
Render email template
  ↓
Send via SendGrid API
  ↓
Log to database (email_logs table)
  ↓
Track delivery status
  ↓
Handle bounces/unsubscribes
```

### **File Structure**
```
src/
  lib/
    email/
      sender.ts                # Main email sending service
      templates.ts             # Template rendering
      queue.ts                 # Background job queue (optional)
      types.ts                 # Email types & interfaces
  app/api/
    email/
      send/route.ts           # Email sending API
      unsubscribe/route.ts    # Unsubscribe link handler
      preferences/route.ts    # User email preferences
  components/
    email/
      FormApprovedEmail.tsx   # Email component templates
      DocumentExpiryEmail.tsx
      etc.
database/migrations/
  add_email_logs_table.sql    # Email logging table
```

---

## 💻 CODE TEMPLATES

### **1. Email Sender Service**

```typescript
// src/lib/email/sender.ts

import sgMail from '@sendgrid/mail';
import { prisma } from '@/lib/db';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export enum EmailType {
  FORM_SUBMITTED = 'form_submitted',
  FORM_APPROVED = 'form_approved',
  FORM_REJECTED = 'form_rejected',
  DOCUMENT_EXPIRING = 'document_expiring',
  CREW_ASSIGNMENT = 'crew_assignment',
  CREW_DEPARTURE = 'crew_departure',
  ADMIN_ALERT = 'admin_alert',
}

export interface EmailNotification {
  type: EmailType;
  recipientId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  templateId: string;
  data: Record<string, any>;
}

export async function sendEmail(notification: EmailNotification) {
  try {
    // Check user preferences
    const preferences = await prisma.emailPreference.findUnique({
      where: { userId: notification.recipientId },
    });

    if (preferences && !preferences[`notify_${notification.type}`]) {
      console.log(`User ${notification.recipientId} opted out of ${notification.type}`);
      return;
    }

    // Create email
    const msg = {
      to: notification.recipientEmail,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: notification.subject,
      templateId: notification.templateId,
      dynamicTemplateData: notification.data,
      trackingSettings: {
        clickTracking: { enabled: true },
        openTracking: { enabled: true },
        subscriptionTracking: {
          enabled: true,
          text: 'Unsubscribe <a href="unsubscribe"></a>',
          html: 'Unsubscribe <a href="unsubscribe">here</a>',
        },
      },
    };

    // Send email
    const [response] = await sgMail.send(msg);

    // Log to database
    await prisma.emailLog.create({
      data: {
        recipientId: notification.recipientId,
        recipientEmail: notification.recipientEmail,
        type: notification.type,
        subject: notification.subject,
        status: 'sent',
        sendgridId: response.headers['x-message-id'],
        data: JSON.stringify(notification.data),
      },
    });

    return response;
  } catch (error) {
    console.error('Email sending error:', error);

    // Log failure
    await prisma.emailLog.create({
      data: {
        recipientId: notification.recipientId,
        recipientEmail: notification.recipientEmail,
        type: notification.type,
        subject: notification.subject,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: JSON.stringify(notification.data),
      },
    });

    throw error;
  }
}

export async function sendBulkEmails(notifications: EmailNotification[]) {
  const results = await Promise.allSettled(
    notifications.map(n => sendEmail(n))
  );

  return {
    successful: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
    results,
  };
}
```

### **2. Email Notification Handler**

```typescript
// src/lib/email/notifications.ts

import { sendEmail, EmailType, EmailNotification } from './sender';
import { prisma } from '@/lib/db';

export async function notifyFormApproved(formId: string) {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: {
      seafarer: true,
      formType: true,
      approvedBy: true,
    },
  });

  if (!form) return;

  // Email to seafarer
  await sendEmail({
    type: EmailType.FORM_APPROVED,
    recipientId: form.seafarerId,
    recipientEmail: form.seafarer.email,
    recipientName: form.seafarer.fullName,
    subject: `${form.formType.name} Approved`,
    templateId: process.env.SENDGRID_FORM_APPROVED_TEMPLATE!,
    data: {
      seafarerName: form.seafarer.fullName,
      formType: form.formType.name,
      approvedBy: form.approvedBy?.fullName,
      approvedDate: new Date(form.updatedAt).toLocaleDateString('id-ID'),
      nextSteps: 'You can now download and print your form.',
      actionUrl: `${process.env.NEXTAUTH_URL}/forms/${formId}`,
    },
  });
}

export async function notifyDocumentExpiring(documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      seafarer: true,
      documentType: true,
    },
  });

  if (!document) return;

  const daysUntilExpiry = Math.ceil(
    (new Date(document.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  // Email to crew
  await sendEmail({
    type: EmailType.DOCUMENT_EXPIRING,
    recipientId: document.seafarerId,
    recipientEmail: document.seafarer.email,
    recipientName: document.seafarer.fullName,
    subject: `Document Expiring Soon: ${document.documentType.name}`,
    templateId: process.env.SENDGRID_DOCUMENT_EXPIRING_TEMPLATE!,
    data: {
      seafarerName: document.seafarer.fullName,
      documentName: document.documentType.name,
      expiryDate: new Date(document.expiryDate).toLocaleDateString('id-ID'),
      daysRemaining: daysUntilExpiry,
      renewalUrl: `${process.env.NEXTAUTH_URL}/documents/${documentId}/renew`,
    },
  });
}

export async function notifyCrewAssignment(assignmentId: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      seafarer: true,
      vessel: true,
      position: true,
    },
  });

  if (!assignment) return;

  await sendEmail({
    type: EmailType.CREW_ASSIGNMENT,
    recipientId: assignment.seafarerId,
    recipientEmail: assignment.seafarer.email,
    recipientName: assignment.seafarer.fullName,
    subject: `New Assignment: ${assignment.vessel.name}`,
    templateId: process.env.SENDGRID_CREW_ASSIGNMENT_TEMPLATE!,
    data: {
      seafarerName: assignment.seafarer.fullName,
      vesselName: assignment.vessel.name,
      position: assignment.position.name,
      joinDate: new Date(assignment.joinDate).toLocaleDateString('id-ID'),
      signOffDate: assignment.signOffDate ? new Date(assignment.signOffDate).toLocaleDateString('id-ID') : 'TBD',
      detailsUrl: `${process.env.NEXTAUTH_URL}/crew/${assignment.seafarerId}/assignments/${assignmentId}`,
    },
  });
}

export async function notifyAdminAlert(title: string, message: string, severity: 'info' | 'warning' | 'error') {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
  });

  const emailNotifications = admins.map(admin => ({
    type: EmailType.ADMIN_ALERT as EmailType,
    recipientId: admin.id,
    recipientEmail: admin.email,
    recipientName: admin.fullName,
    subject: `[${severity.toUpperCase()}] ${title}`,
    templateId: process.env.SENDGRID_ADMIN_ALERT_TEMPLATE!,
    data: {
      adminName: admin.fullName,
      alertTitle: title,
      alertMessage: message,
      severity,
      timestamp: new Date().toLocaleString('id-ID'),
    },
  }));

  return Promise.all(emailNotifications.map(sendEmail));
}
```

### **3. Email Preferences Management**

```typescript
// src/app/api/email/preferences/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const preferences = await prisma.emailPreference.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(preferences || {
    userId: session.user.id,
    notify_form_submitted: true,
    notify_form_approved: true,
    notify_form_rejected: true,
    notify_document_expiring: true,
    notify_crew_assignment: true,
    notify_crew_departure: true,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  const preferences = await prisma.emailPreference.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      ...body,
    },
    update: body,
  });

  return NextResponse.json(preferences);
}
```

### **4. Database Migration**

```sql
-- database/migrations/add_email_tables.sql

CREATE TABLE "EmailPreference" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "notify_form_submitted" BOOLEAN NOT NULL DEFAULT true,
  "notify_form_approved" BOOLEAN NOT NULL DEFAULT true,
  "notify_form_rejected" BOOLEAN NOT NULL DEFAULT true,
  "notify_document_expiring" BOOLEAN NOT NULL DEFAULT true,
  "notify_crew_assignment" BOOLEAN NOT NULL DEFAULT true,
  "notify_crew_departure" BOOLEAN NOT NULL DEFAULT true,
  "notify_admin_alert" BOOLEAN NOT NULL DEFAULT true,
  "unsubscribed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "EmailLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "recipientId" TEXT NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "sendgridId" TEXT,
  "error" TEXT,
  "data" TEXT,
  "openedAt" TIMESTAMP,
  "clickedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX "EmailLog_recipientId_idx" ON "EmailLog"("recipientId");
CREATE INDEX "EmailLog_createdAt_idx" ON "EmailLog"("createdAt");
CREATE INDEX "EmailLog_status_idx" ON "EmailLog"("status");
```

### **5. Integration with Form Status Change**

```typescript
// src/app/api/forms/[id]/status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/db';
import { notifyFormApproved } from '@/lib/email/notifications';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { status } = await req.json();

  const form = await prisma.form.update({
    where: { id: params.id },
    data: { status },
    include: { seafarer: true },
  });

  // Trigger email notification
  if (status === 'APPROVED') {
    // Queue email send (don't wait)
    notifyFormApproved(form.id).catch(error => {
      console.error('Failed to send approval email:', error);
    });
  }

  return NextResponse.json(form);
}
```

---

## 📧 EMAIL TEMPLATE GUIDE

### **SendGrid Dynamic Template Setup**

1. Go to SendGrid Dashboard
2. Create new Dynamic Template for each email type:
   - Form Approved
   - Form Rejected
   - Document Expiring
   - Crew Assignment
   - Admin Alert

3. Use placeholder syntax: `{{seafarerName}}`, `{{formType}}`, etc.

Example template:

```html
<mjml>
  <mj-body background-color="#f4f4f4">
    <mj-section background-color="#003d5c">
      <mj-column>
        <mj-image src="https://hanmarine.co/logo.png" width="200px" />
        <mj-text align="center" color="#fff" font-size="20px">
          {{emailTitle}}
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section background-color="#fff" padding="20px">
      <mj-column>
        <mj-text font-size="16px">
          Dear {{recipientName}},
        </mj-text>
        <mj-text>
          {{emailBody}}
        </mj-text>
        <mj-button href="{{actionUrl}}" background-color="#003d5c">
          {{actionText}}
        </mj-button>
      </mj-column>
    </mj-section>

    <mj-section background-color="#f4f4f4" padding="10px">
      <mj-column>
        <mj-text font-size="12px" align="center" color="#666">
          <a href="{{unsubscribeUrl}}">Manage Email Preferences</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

---

## 🧪 TESTING CHECKLIST

### **Unit Tests**
```
[ ] Email service initializes correctly
[ ] Email preference check works
[ ] Template data injection works
[ ] Error handling on API failure
[ ] Bulk email sending
[ ] Database logging works
```

### **Integration Tests**
```
[ ] Form approval triggers email
[ ] Document expiry triggers email
[ ] Crew assignment triggers email
[ ] Email preferences respected
[ ] Unsubscribe works
[ ] Email log created correctly
```

### **Functional Tests**
```
[ ] User receives email on form approval
[ ] User receives email on document expiry
[ ] User receives email on assignment
[ ] User can change email preferences
[ ] User can unsubscribe
[ ] Admin receives alerts
[ ] Email contains correct data
[ ] Email links work
```

### **Performance Tests**
```
[ ] Email sent within 2 seconds
[ ] Bulk sends don't timeout
[ ] No memory leaks
[ ] Database queries optimized
```

---

## 📦 DEPENDENCIES

```bash
npm install @sendgrid/mail
npm install bull  # Optional, for background jobs
npm install mjml  # Optional, for email template building
```

---

## ⚙️ ENVIRONMENT SETUP

### **1. Create SendGrid Account**
- Sign up at sendgrid.com
- Verify sender domain
- Create API key

### **2. Add to `.env.local`**
```env
SENDGRID_API_KEY=your_api_key_here
SENDGRID_FROM_EMAIL=noreply@hanmarine.co
SENDGRID_FORM_APPROVED_TEMPLATE=d-template_id
SENDGRID_DOCUMENT_EXPIRING_TEMPLATE=d-template_id
SENDGRID_CREW_ASSIGNMENT_TEMPLATE=d-template_id
SENDGRID_ADMIN_ALERT_TEMPLATE=d-template_id
```

### **3. Run Prisma Migration**
```bash
npx prisma migrate dev --name add_email_tables
npx prisma generate
```

---

## 📋 TASKS BREAKDOWN

**Day 1 (3 hours):**
- [ ] Setup SendGrid account
- [ ] Create email sender service
- [ ] Create database migration

**Day 2 (3 hours):**
- [ ] Create notification handlers
- [ ] Create SendGrid templates
- [ ] Integrate with form status

**Day 3 (2 hours):**
- [ ] Create preferences UI
- [ ] Test all email types
- [ ] Create PR & code review

---

## ✅ ACCEPTANCE CRITERIA

- ✅ Users receive emails on form approval
- ✅ Users receive emails on document expiry
- ✅ Users receive emails on assignment
- ✅ Users can manage email preferences
- ✅ Unsubscribe works
- ✅ 99% email delivery rate
- ✅ Email logs tracked in database

---

**Status: Ready to implement 🚀**
**Start: Jan 15, 2026**
**End: Jan 24, 2026**
