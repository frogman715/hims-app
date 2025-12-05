import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/admin/seed-form-templates - Seed form templates for principals
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only DIRECTOR can seed
    if (session?.user?.role !== "DIRECTOR") {
      return NextResponse.json(
        { error: "Only Director can seed form templates" },
        { status: 403 }
      );
    }

    const results = {
      principalsCreated: 0,
      principalsFound: 0,
      templatesCreated: 0,
      errors: [] as string[],
    };

    // INTEGRIS CO.,LTD templates
    let integrisPrincipal = await prisma.principal.findFirst({
      where: { name: { contains: "INTEGRIS", mode: "insensitive" } },
    });

    if (!integrisPrincipal) {
      integrisPrincipal = await prisma.principal.create({
        data: {
          name: "INTEGRIS CO.,LTD",
          companyCode: "INTEGRIS",
          country: "Singapore",
          address: "Singapore",
          contactPerson: "N/A",
          email: "info@integris.com.sg",
          phone: "+65 0000 0000",
          contractStart: new Date(),
          contractEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
          status: "ACTIVE",
        },
      });
      results.principalsCreated++;
    } else {
      results.principalsFound++;
    }

    const integrisTemplates = [
      {
        formName: "Medical History Checking List",
        formCategory: "MEDICAL",
        templatePath: "src/form_reference/INTEGRIS CO.,LTD/MEDICAL HISTORY CHECKING LIST.docx",
        isRequired: true,
        displayOrder: 1,
        description: "Complete medical history checklist for seafarers",
      },
      {
        formName: "Next of Kin Declaration",
        formCategory: "DECLARATION",
        templatePath: "src/form_reference/INTEGRIS CO.,LTD/NEXT_OF_KIN_DECLARATION.docx",
        isRequired: true,
        displayOrder: 2,
        description: "Emergency contact and next of kin information",
      },
      {
        formName: "Report of General Education for Foreigner",
        formCategory: "TRAINING",
        templatePath: "src/form_reference/INTEGRIS CO.,LTD/Report of General Education for Foreigner.docx",
        isRequired: true,
        displayOrder: 3,
        description: "General education report for foreign crew members",
      },
      {
        formName: "Training Schedule for Foreigner",
        formCategory: "TRAINING",
        templatePath: "src/form_reference/INTEGRIS CO.,LTD/Training Schedule for Foreigner.docx",
        isRequired: true,
        displayOrder: 4,
        description: "Training schedule and curriculum for foreign crew",
      },
      {
        formName: "Training Record INTEGRIS",
        formCategory: "TRAINING",
        templatePath: "src/form_reference/INTEGRIS CO.,LTD/Training record INTERGIS.xlsx",
        isRequired: true,
        displayOrder: 5,
        description: "Detailed training record spreadsheet",
      },
    ];

    for (const template of integrisTemplates) {
      try {
        const existing = await prisma.principalFormTemplate.findFirst({
          where: {
            principalId: integrisPrincipal.id,
            formName: template.formName,
          },
        });

        if (!existing) {
          await prisma.principalFormTemplate.create({
            data: {
              principalId: integrisPrincipal.id,
              ...template,
            },
          });
          results.templatesCreated++;
        }
      } catch (error) {
        results.errors.push(`Failed to create ${template.formName} for INTEGRIS: ${error}`);
      }
    }

    // LUNDQVIST REDERIERNA templates
    let lundqvistPrincipal = await prisma.principal.findFirst({
      where: { name: { contains: "LUNDQVIST", mode: "insensitive" } },
    });

    if (!lundqvistPrincipal) {
      lundqvistPrincipal = await prisma.principal.create({
        data: {
          name: "LUNDQVIST REDERIERNA",
          companyCode: "LUNDQVIST",
          country: "Sweden",
          address: "Sweden",
          contactPerson: "N/A",
          email: "info@lundqvist.se",
          phone: "+46 0000 0000",
          contractStart: new Date(),
          contractEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
          status: "ACTIVE",
        },
      });
      results.principalsCreated++;
    } else {
      results.principalsFound++;
    }

    const lundqvistTemplates = [
      {
        formName: "Medical History Checking List",
        formCategory: "MEDICAL",
        templatePath: "src/form_reference/LUNDQVIST REDERIERNA/MEDICAL HISTORY CHECKING LIST.docx",
        isRequired: true,
        displayOrder: 1,
        description: "Complete medical history checklist for seafarers",
      },
      {
        formName: "Next of Kin Declaration",
        formCategory: "DECLARATION",
        templatePath: "src/form_reference/LUNDQVIST REDERIERNA/NEXT_OF_KIN_DECLARATION.docx",
        isRequired: true,
        displayOrder: 2,
        description: "Emergency contact and next of kin information",
      },
      {
        formName: "Declaration of Safety Regulations",
        formCategory: "SAFETY",
        templatePath: "src/form_reference/LUNDQVIST REDERIERNA/Declaration of Safety Regulations.docx",
        isRequired: true,
        displayOrder: 3,
        description: "Acknowledgment of safety regulations and procedures",
      },
      {
        formName: "LUNDQVIST REDERIERNA General Information",
        formCategory: "DECLARATION",
        templatePath: "src/form_reference/LUNDQVIST REDERIERNA/LUNDQVIST REDERIERNA.docx",
        isRequired: false,
        displayOrder: 4,
        description: "General company information and policies",
      },
    ];

    for (const template of lundqvistTemplates) {
      try {
        const existing = await prisma.principalFormTemplate.findFirst({
          where: {
            principalId: lundqvistPrincipal.id,
            formName: template.formName,
          },
        });

        if (!existing) {
          await prisma.principalFormTemplate.create({
            data: {
              principalId: lundqvistPrincipal.id,
              ...template,
            },
          });
          results.templatesCreated++;
        }
      } catch (error) {
        results.errors.push(`Failed to create ${template.formName} for LUNDQVIST: ${error}`);
      }
    }

    return NextResponse.json({
      message: "Form templates seeded successfully",
      results,
    });
  } catch (error) {
    console.error("Error seeding form templates:", error);
    return NextResponse.json(
      { error: "Failed to seed form templates", details: String(error) },
      { status: 500 }
    );
  }
}
