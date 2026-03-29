const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const {
  documentExpiryReminderTemplate,
  medicalCheckupReminderTemplate,
} = require("./email-helpers.ts");

test("document expiry reminder template escalates subject and HTML for urgent documents", () => {
  const urgent = documentExpiryReminderTemplate({
    crewName: "Jane Doe",
    documentType: "Passport",
    expiryDate: "2026-04-01",
    daysUntilExpiry: 5,
    dashboardUrl: "https://hims.example.com/documents",
  });

  assert.equal(urgent.subject, "[URGENT] Passport Expiring Soon - 2026-04-01");
  assert.match(urgent.html, /Jane Doe/);
  assert.match(urgent.html, /5 days/);
  assert.match(urgent.html, /https:\/\/hims\.example\.com\/documents/);

  const reminder = documentExpiryReminderTemplate({
    crewName: "John Roe",
    documentType: "Medical Certificate",
    expiryDate: "2026-05-01",
    daysUntilExpiry: 20,
    dashboardUrl: "https://hims.example.com/dashboard",
  });
  assert.equal(reminder.subject, "[REMINDER] Medical Certificate Expiring Soon - 2026-05-01");
});

test("medical checkup reminder template keeps schedule data in subject and body", () => {
  const template = medicalCheckupReminderTemplate({
    crewName: "Crew One",
    checkupType: "Annual Medical",
    dueDate: "2026-05-10",
    scheduleUrl: "https://hims.example.com/medical",
  });

  assert.equal(template.subject, "Medical Check-up Due - Annual Medical");
  assert.match(template.html, /Crew One/);
  assert.match(template.html, /2026-05-10/);
  assert.match(template.html, /https:\/\/hims\.example\.com\/medical/);
});
