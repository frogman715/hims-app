import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import { readdirSync } from "fs";
import { join } from "path";

interface FormCategory {
  id: string;
  name: string;
  description: string;
  forms: Array<{
    id: string;
    filename: string;
    category: string;
    type: "xlsx" | "docx" | "doc" | "xls" | "pdf";
  }>;
}

const FORM_REFERENCE_PATH = join(
  process.cwd(),
  "src/form_reference"
);

const CATEGORIES = [
  { id: "CR", name: "HGF-CR", label: "Crew Management" },
  { id: "AD", name: "HGF-AD", label: "Administration" },
  { id: "AC", name: "HGF-AC", label: "Accounting" },
  { id: "INTEGRIS CO.,LTD", name: "INTERGIS", label: "INTERGIS CO.,LTD" },
  { id: "LUNDQVIST REDERIERNA", name: "LUNDQVIST", label: "LUNDQVIST REDERIERNA" },
];

function getFileType(filename: string): "xlsx" | "docx" | "doc" | "xls" | "pdf" {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (ext === "xlsx" || ext === "xls") return "xlsx";
  if (ext === "docx" || ext === "doc") return "docx";
  return "pdf";
}

function loadForms(): FormCategory[] {
  const categories: FormCategory[] = [
    {
      id: "hgf-cr",
      name: "HGF-CR (Crew Management)",
      description: "Hanmarine Global Forms - Crew Related",
      forms: [],
    },
    {
      id: "hgf-ad",
      name: "HGF-AD (Administration)",
      description: "Hanmarine Global Forms - Administration",
      forms: [],
    },
    {
      id: "hgf-ac",
      name: "HGF-AC (Accounting)",
      description: "Hanmarine Global Forms - Accounting",
      forms: [],
    },
    {
      id: "intergis",
      name: "INTERGIS CO.,LTD",
      description: "INTERGIS Company Forms",
      forms: [],
    },
    {
      id: "lundqvist",
      name: "LUNDQVIST REDERIERNA",
      description: "LUNDQVIST REDERIERNA Forms",
      forms: [],
    },
  ];

  try {
    // Load CR forms
    const crPath = join(FORM_REFERENCE_PATH, "CR");
    const crFiles = readdirSync(crPath);
    categories[0].forms = crFiles
      .filter((f) => !f.startsWith("."))
      .map((filename, idx) => ({
        id: `cr-${idx}`,
        filename,
        category: "CR",
        type: getFileType(filename),
      }));

    // Load AD forms
    const adPath = join(FORM_REFERENCE_PATH, "AD");
    const adFiles = readdirSync(adPath);
    categories[1].forms = adFiles
      .filter((f) => !f.startsWith("."))
      .map((filename, idx) => ({
        id: `ad-${idx}`,
        filename,
        category: "AD",
        type: getFileType(filename),
      }));

    // Load AC forms
    const acPath = join(FORM_REFERENCE_PATH, "AC");
    const acFiles = readdirSync(acPath);
    categories[2].forms = acFiles
      .filter((f) => !f.startsWith("."))
      .map((filename, idx) => ({
        id: `ac-${idx}`,
        filename,
        category: "AC",
        type: getFileType(filename),
      }));

    // Load INTERGIS forms
    const intergisPath = join(FORM_REFERENCE_PATH, "INTEGRIS CO.,LTD");
    const intergisFiles = readdirSync(intergisPath);
    categories[3].forms = intergisFiles
      .filter((f) => !f.startsWith("."))
      .map((filename, idx) => ({
        id: `intergis-${idx}`,
        filename,
        category: "INTERGIS CO.,LTD",
        type: getFileType(filename),
      }));

    // Load LUNDQVIST forms
    const lundqvistPath = join(FORM_REFERENCE_PATH, "LUNDQVIST REDERIERNA");
    const lundqvistFiles = readdirSync(lundqvistPath);
    categories[4].forms = lundqvistFiles
      .filter((f) => !f.startsWith("."))
      .map((filename, idx) => ({
        id: `lundqvist-${idx}`,
        filename,
        category: "LUNDQVIST REDERIERNA",
        type: getFileType(filename),
      }));
  } catch (error) {
    console.error("Error loading forms:", error);
  }

  return categories;
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
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error in form reference GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
