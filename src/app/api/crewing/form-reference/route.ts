import { NextRequest, NextResponse } from "next/server";
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
    description: "Forms untuk manajemen crew, kontrak, dan dokumentasi seafarer (pelaut). Includes recruitment, signing on/off, medical checks, dan crew evaluations."
  },
  "AD": {
    code: "hgf-ad",
    display: "HGF-AD - Administration",
    description: "Forms administrasi general company, personnel management, compliance documentation, dan employee records. Termasuk insurance, training, dan company policies."
  },
  "AC": {
    code: "hgf-ac",
    display: "HGF-AC - Accounting",
    description: "Forms untuk accounting, payroll, invoicing, dan financial documentation. Termasuk wage calculations, allotments, dan billing records."
  },
  "INTEGRIS CO.,LTD": {
    code: "intergis",
    display: "INTEGRIS CO.,LTD - Partner Forms",
    description: "Formulir khusus untuk partner company INTEGRIS CO.,LTD. Includes specialized documentation untuk partner operations dan compliance."
  },
  "LUNDQVIST REDERIERNA": {
    code: "lundqvist",
    display: "LUNDQVIST REDERIERNA - Partner Forms",
    description: "Formulir khusus untuk partner company LUNDQVIST REDERIERNA. Includes specialized documentation untuk partner operations dan compliance."
  },
};

function loadForms(): FormCategory[] {
  const categories: FormCategory[] = [];

  try {
    const items = readdirSync(FORM_REFERENCE_PATH);

    for (const item of items) {
      const itemPath = join(FORM_REFERENCE_PATH, item);
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
    }
  } catch (error) {
    console.error("Error loading forms:", error);
  }

  return categories.sort((a, b) => a.categoryCode.localeCompare(b.categoryCode));
}

export const GET = async (request: NextRequest) => {
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
