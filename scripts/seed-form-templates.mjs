import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedFormTemplates() {
  console.log('🌱 Seeding form templates...');

  // Get existing principals
  const integris = await prisma.principal.findFirst({
    where: { name: { contains: 'INTEGRIS', mode: 'insensitive' } }
  });

  const lundqvist = await prisma.principal.findFirst({
    where: { name: { contains: 'LUNDQVIST', mode: 'insensitive' } }
  });

  // INTEGRIS Forms
  if (integris) {
    console.log(`  Creating forms for INTEGRIS (${integris.id})`);
    
    await prisma.principalFormTemplate.createMany({
      data: [
        {
          principalId: integris.id,
          formName: 'Medical History Checking List',
          formCategory: 'MEDICAL',
          templatePath: 'src/form_reference/INTEGRIS CO.,LTD/MEDICAL HISTORY CHECKING LIST.docx',
          isRequired: true,
          displayOrder: 1,
          description: 'Comprehensive medical history form for crew members'
        },
        {
          principalId: integris.id,
          formName: 'Next of Kin Declaration',
          formCategory: 'DECLARATION',
          templatePath: 'src/form_reference/INTEGRIS CO.,LTD/NEXT_OF_KIN_DECLARATION.docx',
          isRequired: true,
          displayOrder: 2,
          description: 'Emergency contact and next of kin information'
        },
        {
          principalId: integris.id,
          formName: 'Report of General Education for Foreigner',
          formCategory: 'TRAINING',
          templatePath: 'src/form_reference/INTEGRIS CO.,LTD/Report of General Education for Foreigner.docx',
          isRequired: true,
          displayOrder: 3,
          description: 'General education and training report for foreign crew'
        },
        {
          principalId: integris.id,
          formName: 'Training Schedule for Foreigner',
          formCategory: 'TRAINING',
          templatePath: 'src/form_reference/INTEGRIS CO.,LTD/Training Schedule for Foreigner.docx',
          isRequired: true,
          displayOrder: 4,
          description: 'Detailed training schedule and timeline'
        },
        {
          principalId: integris.id,
          formName: 'Training Record INTEGRIS',
          formCategory: 'TRAINING',
          templatePath: 'src/form_reference/INTEGRIS CO.,LTD/Training record INTERGIS.xlsx',
          isRequired: true,
          displayOrder: 5,
          description: 'Complete training record log'
        }
      ],
      skipDuplicates: true
    });
  }

  // LUNDQVIST Forms
  if (lundqvist) {
    console.log(`  Creating forms for LUNDQVIST (${lundqvist.id})`);
    
    await prisma.principalFormTemplate.createMany({
      data: [
        {
          principalId: lundqvist.id,
          formName: 'Medical History Checking List',
          formCategory: 'MEDICAL',
          templatePath: 'src/form_reference/LUNDQVIST REDERIERNA/MEDICAL HISTORY CHECKING LIST.docx',
          isRequired: true,
          displayOrder: 1,
          description: 'Medical history form for Lundqvist vessels'
        },
        {
          principalId: lundqvist.id,
          formName: 'Next of Kin Declaration',
          formCategory: 'DECLARATION',
          templatePath: 'src/form_reference/LUNDQVIST REDERIERNA/NEXT_OF_KIN_DECLARATION.docx',
          isRequired: true,
          displayOrder: 2,
          description: 'Emergency contact declaration'
        },
        {
          principalId: lundqvist.id,
          formName: 'Declaration of Safety Regulations',
          formCategory: 'SAFETY',
          templatePath: 'src/form_reference/LUNDQVIST REDERIERNA/Declaration of Safety Regulations.docx',
          isRequired: true,
          displayOrder: 3,
          description: 'Safety regulations acknowledgment and declaration'
        },
        {
          principalId: lundqvist.id,
          formName: 'LUNDQVIST General Information',
          formCategory: 'DECLARATION',
          templatePath: 'src/form_reference/LUNDQVIST REDERIERNA/LUNDQVIST REDERIERNA.docx',
          isRequired: false,
          displayOrder: 4,
          description: 'General company information and requirements'
        }
      ],
      skipDuplicates: true
    });
  }

  // If principals don't exist, create them
  if (!integris) {
    console.log('  ⚠️  INTEGRIS principal not found, creating...');
    const newIntegris = await prisma.principal.create({
      data: {
        name: 'INTEGRIS CO., LTD',
        country: 'Japan',
        status: 'ACTIVE'
      }
    });

    await prisma.principalFormTemplate.createMany({
      data: [
        {
          principalId: newIntegris.id,
          formName: 'Medical History Checking List',
          formCategory: 'MEDICAL',
          templatePath: 'src/form_reference/INTEGRIS CO.,LTD/MEDICAL HISTORY CHECKING LIST.docx',
          isRequired: true,
          displayOrder: 1
        },
        {
          principalId: newIntegris.id,
          formName: 'Next of Kin Declaration',
          formCategory: 'DECLARATION',
          templatePath: 'src/form_reference/INTEGRIS CO.,LTD/NEXT_OF_KIN_DECLARATION.docx',
          isRequired: true,
          displayOrder: 2
        },
        {
          principalId: newIntegris.id,
          formName: 'Report of General Education for Foreigner',
          formCategory: 'TRAINING',
          templatePath: 'src/form_reference/INTEGRIS CO.,LTD/Report of General Education for Foreigner.docx',
          isRequired: true,
          displayOrder: 3
        },
        {
          principalId: newIntegris.id,
          formName: 'Training Schedule for Foreigner',
          formCategory: 'TRAINING',
          templatePath: 'src/form_reference/INTEGRIS CO.,LTD/Training Schedule for Foreigner.docx',
          isRequired: true,
          displayOrder: 4
        },
        {
          principalId: newIntegris.id,
          formName: 'Training Record INTEGRIS',
          formCategory: 'TRAINING',
          templatePath: 'src/form_reference/INTEGRIS CO.,LTD/Training record INTERGIS.xlsx',
          isRequired: true,
          displayOrder: 5
        }
      ]
    });
  }

  if (!lundqvist) {
    console.log('  ⚠️  LUNDQVIST principal not found, creating...');
    const newLundqvist = await prisma.principal.create({
      data: {
        name: 'LUNDQVIST REDERIERNA',
        country: 'Sweden',
        status: 'ACTIVE'
      }
    });

    await prisma.principalFormTemplate.createMany({
      data: [
        {
          principalId: newLundqvist.id,
          formName: 'Medical History Checking List',
          formCategory: 'MEDICAL',
          templatePath: 'src/form_reference/LUNDQVIST REDERIERNA/MEDICAL HISTORY CHECKING LIST.docx',
          isRequired: true,
          displayOrder: 1
        },
        {
          principalId: newLundqvist.id,
          formName: 'Next of Kin Declaration',
          formCategory: 'DECLARATION',
          templatePath: 'src/form_reference/LUNDQVIST REDERIERNA/NEXT_OF_KIN_DECLARATION.docx',
          isRequired: true,
          displayOrder: 2
        },
        {
          principalId: newLundqvist.id,
          formName: 'Declaration of Safety Regulations',
          formCategory: 'SAFETY',
          templatePath: 'src/form_reference/LUNDQVIST REDERIERNA/Declaration of Safety Regulations.docx',
          isRequired: true,
          displayOrder: 3
        },
        {
          principalId: newLundqvist.id,
          formName: 'LUNDQVIST General Information',
          formCategory: 'DECLARATION',
          templatePath: 'src/form_reference/LUNDQVIST REDERIERNA/LUNDQVIST REDERIERNA.docx',
          isRequired: false,
          displayOrder: 4
        }
      ]
    });
  }

  const count = await prisma.principalFormTemplate.count();
  console.log(`✅ Form templates seeded! Total: ${count}`);
}

seedFormTemplates()
  .catch((e) => {
    console.error('❌ Error seeding form templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
