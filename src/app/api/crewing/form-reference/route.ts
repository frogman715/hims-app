import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readdirSync, statSync } from "fs";
import { join } from "path";

const FORM_REFERENCE_PATH = join(
  process.cwd(),
  "src/form_reference"
);

interface Form {
  filename: string;
  type: string;
}

interface FormCategory {
  category: string;
  categoryCode: string;
  description: string;
  forms: Form[];
}

const CATEGORY_MAPPING: Record<string, { code: string; display: string; description: string }> = {
  "CR": {
    code: "hgf-cr",
    display: "HGF-CR - Crew Management",
    description: "Forms for crew management, contracts, and seafarer documentation. Includes recruitment, signing on/off, medical checks, and crew evaluations. These are blank templates - fill them with crew data as needed."
  },
  "AD": {
    code: "hgf-ad",
    display: "HGF-AD - Administration",
    description: "General company administration, personnel management, compliance documentation, and employee records. Includes insurance, training, and company policies. Blank templates for your use."
  },
  "AC": {
    code: "hgf-ac",
    display: "HGF-AC - Accounting",
    description: "Forms for accounting, payroll, invoicing, and financial documentation. Includes wage calculations, allotments, and billing records. Empty templates ready to be filled."
  },
  "INTEGRIS CO.,LTD": {
    code: "intergis",
    display: "INTEGRIS CO.,LTD - Partner Forms",
    description: "Specialized forms for partner company INTEGRIS CO.,LTD. Includes documentation templates for partner operations and compliance requirements."
  },
  "LUNDQVIST REDERIERNA": {
    code: "lundqvist",
    display: "LUNDQVIST REDERIERNA - Partner Forms",
    description: "Specialized forms for partner company LUNDQVIST REDERIERNA. Includes documentation templates for partner operations and compliance requirements."
  },
};

function loadForms(): FormCategory[] {
  const categories: FormCategory[] = [];

  try {
    const items = readdirSync(FORM_REFERENCE_PATH);

    for (const item of items) {
      const itemPath = join(FORM_REFERENCE_PATH, item);
      
      try {
        const stat = statSync(itemPath);
        
        if (stat.isDirectory() && CATEGORY_MAPPING[item]) {
          const mapping = CATEGORY_MAPPING[item];
          const forms: Form[] = [];

          try {
            const files = readdirSync(itemPath);
            for (const file of files) {
              const ext = file.split(".").pop()?.toLowerCase() || "";
              if (["xlsx", "xls", "docx", "doc", "pdf"].includes(ext)) {
                forms.push({
                  filename: file,
                  type: ext,
                });
              }
            }
          } catch (error) {
            console.error(`Error reading directory ${item}:`, error);
          }

          if (forms.length > 0) {
            categories.push({
              category: mapping.display,
              categoryCode: mapping.code,
              description: mapping.description,
              forms: forms.sort((a, b) => a.filename.localeCompare(b.filename)),
            });
          }
        }
      } catch (statError) {
        console.error(`Error accessing ${item}:`, statError);
      }
    }
  } catch (error) {
    console.error("Error loading forms:", error);
    throw new Error(`Failed to load form categories: ${String(error)}`);
  }

  return categories.sort((a, b) => a.categoryCode.localeCompare(b.categoryCode));
}

export const GET = async () => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Allow directors, HR staff, and system admins
    const userRoles = session.user?.roles || [];
    const hasAccess =
      userRoles.includes("DIRECTOR") ||
      userRoles.includes("HR") ||
      userRoles.includes("HR_ADMIN") ||
      session.user?.isSystemAdmin;

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const categories = loadForms();

    return NextResponse.json(
      { categories },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in form-reference API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
