/**
 * Seed HGF Forms with sample data
 * Creates 8 complete HGF forms with fields and validation rules
 */

import { PrismaClient } from '@prisma/client';

export const seedHGFForms = async (prisma: PrismaClient) => {
  const forms = [
    {
      formCode: 'HGF-CR-01',
      procedureId: 'PROC-CR-001',
      name: 'Documents Checklist',
      description: 'Comprehensive checklist for seafarer documentation verification',
      formType: 'CHECKLIST',
      fieldsJson: [
        {
          id: 'doc-sirb',
          name: 'sirb_verified',
          label: 'SIRB Verified',
          type: 'checkbox',
          required: true,
        },
        {
          id: 'doc-passport',
          name: 'passport_verified',
          label: 'Passport Verified',
          type: 'checkbox',
          required: true,
        },
        {
          id: 'doc-stcw',
          name: 'stcw_verified',
          label: 'STCW Certificates Verified',
          type: 'checkbox',
          required: true,
        },
        {
          id: 'doc-medical',
          name: 'medical_verified',
          label: 'Medical Certificate Verified',
          type: 'checkbox',
          required: true,
        },
        {
          id: 'doc-visa',
          name: 'visa_verified',
          label: 'Visa Verified',
          type: 'checkbox',
          required: true,
        },
        {
          id: 'doc-training',
          name: 'training_verified',
          label: 'Training Certificates Verified',
          type: 'checkbox',
          required: true,
        },
        {
          id: 'doc-flag',
          name: 'flag_state_verified',
          label: 'Flag State Requirements Verified',
          type: 'checkbox',
          required: true,
        },
        {
          id: 'doc-police',
          name: 'police_clearance_verified',
          label: 'Police Clearance Verified',
          type: 'checkbox',
          required: true,
        },
        {
          id: 'remarks',
          name: 'checklist_remarks',
          label: 'Remarks',
          type: 'textarea',
          required: false,
          placeholder: 'Any additional notes or comments',
        },
      ],
      requiredDocs: [
        { code: 'SIRB', title: 'SIRB', required: true },
        { code: 'PASSPORT', title: 'Passport', required: true },
        { code: 'STCW', title: 'STCW Certificates', required: true },
        { code: 'MEDICAL', title: 'Medical Certificate', required: true },
        { code: 'VISA', title: 'Visa', required: true },
        { code: 'TRAINING', title: 'Training Certificates', required: true },
        { code: 'FLAG_STATE', title: 'Flag State Requirements', required: true },
        { code: 'POLICE', title: 'Police Clearance', required: true },
      ],
    },
    {
      formCode: 'HGF-CR-02',
      procedureId: 'PROC-CR-002',
      name: 'Application for Employment',
      description: 'Standard application form for seafarer employment',
      formType: 'APPLICATION',
      fieldsJson: [
        {
          id: 'full-name',
          name: 'fullName',
          label: 'Full Name',
          type: 'text',
          required: true,
          placeholder: 'Enter full name',
        },
        {
          id: 'dob',
          name: 'dateOfBirth',
          label: 'Date of Birth',
          type: 'date',
          required: true,
        },
        {
          id: 'nationality',
          name: 'nationality',
          label: 'Nationality',
          type: 'text',
          required: true,
          placeholder: 'Enter nationality',
        },
        {
          id: 'position',
          name: 'position',
          label: 'Applied Position',
          type: 'select',
          required: true,
          options: [
            { label: 'Chief Officer', value: 'CHIEF_OFFICER' },
            { label: 'Second Officer', value: 'SECOND_OFFICER' },
            { label: 'Chief Engineer', value: 'CHIEF_ENGINEER' },
            { label: 'Second Engineer', value: 'SECOND_ENGINEER' },
            { label: 'Bosun', value: 'BOSUN' },
            { label: 'Carpenter', value: 'CARPENTER' },
          ],
        },
        {
          id: 'experience-years',
          name: 'experienceYears',
          label: 'Years of Experience',
          type: 'number',
          required: true,
        },
        {
          id: 'email',
          name: 'email',
          label: 'Email Address',
          type: 'email',
          required: true,
          placeholder: 'example@email.com',
        },
        {
          id: 'phone',
          name: 'phone',
          label: 'Phone Number',
          type: 'text',
          required: true,
          placeholder: '+62812345678',
        },
        {
          id: 'passport-number',
          name: 'passportNumber',
          label: 'Passport Number',
          type: 'text',
          required: true,
          placeholder: 'Enter passport number',
        },
        {
          id: 'seamanbook',
          name: 'seamanBookNumber',
          label: 'Seaman Book Number',
          type: 'text',
          required: true,
          placeholder: 'Enter seaman book number',
        },
        {
          id: 'agreement',
          name: 'agreeToTerms',
          label: 'I agree to the terms and conditions',
          type: 'checkbox',
          required: true,
        },
        {
          id: 'cover-letter',
          name: 'coverLetter',
          label: 'Cover Letter',
          type: 'textarea',
          required: false,
          placeholder: 'Tell us why you\'re interested in this position',
        },
      ],
      validationJson: null,
    },
    {
      formCode: 'HGF-CR-03',
      procedureId: 'PROC-CR-003',
      name: 'Pre-Deployment Health Check',
      description: 'Health verification form before vessel deployment',
      formType: 'VERIFICATION',
      fieldsJson: [
        {
          id: 'health-check-date',
          name: 'healthCheckDate',
          label: 'Health Check Date',
          type: 'date',
          required: true,
        },
        {
          id: 'clinic-name',
          name: 'clinicName',
          label: 'Clinic Name',
          type: 'text',
          required: true,
          placeholder: 'Enter clinic name',
        },
        {
          id: 'doctor-name',
          name: 'doctorName',
          label: 'Doctor Name',
          type: 'text',
          required: true,
          placeholder: 'Enter doctor name',
        },
        {
          id: 'health-status',
          name: 'healthStatus',
          label: 'Health Status',
          type: 'select',
          required: true,
          options: [
            { label: 'Fit for Work', value: 'FIT' },
            { label: 'Fit with Restrictions', value: 'FIT_WITH_RESTRICTIONS' },
            { label: 'Not Fit for Work', value: 'NOT_FIT' },
          ],
        },
        {
          id: 'medical-notes',
          name: 'medicalNotes',
          label: 'Medical Notes',
          type: 'textarea',
          required: false,
          placeholder: 'Any medical notes or observations',
        },
      ],
      requiredDocs: [
        { code: 'MEDICAL_REPORT', title: 'Medical Report', required: true },
      ],
    },
  ];

  for (const formData of forms) {
    try {
      const existingForm = await prisma.hGFForm.findUnique({
        where: { formCode: formData.formCode },
      });

      if (!existingForm) {
        await prisma.hGFForm.create({
          data: {
            ...formData,
            isActive: true,
            version: 1,
          },
        });
        console.log(`✓ Created form: ${formData.formCode}`);
      } else {
        console.log(`⊘ Form already exists: ${formData.formCode}`);
      }
    } catch (error) {
      console.error(`✗ Error creating form ${formData.formCode}:`, error);
    }
  }
};
