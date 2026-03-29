import { FormApprovalStatus, PrepareJoiningStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type FormComplianceItem = {
  templateId: string;
  formName: string;
  formCategory: string;
  isRequired: boolean;
  status: FormApprovalStatus | "MISSING";
  formId: string | null;
  detail: string;
};

export type PrepareJoiningComplianceSnapshot = {
  prepareJoiningId: string;
  principalId: string | null;
  principalName: string | null;
  requiredTemplateCount: number;
  approvedRequiredCount: number;
  missingRequiredForms: FormComplianceItem[];
  pendingRequiredForms: FormComplianceItem[];
  checklist: FormComplianceItem[];
  blockers: string[];
};

const ENFORCED_STATUSES = new Set<PrepareJoiningStatus>([
  PrepareJoiningStatus.READY,
  PrepareJoiningStatus.DISPATCHED,
]);

export async function ensurePrepareJoiningPrincipalForms(
  prepareJoiningId: string,
  principalId?: string | null
) {
  if (!principalId) {
    return [];
  }

  const templates = await prisma.principalFormTemplate.findMany({
    where: { principalId },
    orderBy: [{ displayOrder: "asc" }, { formName: "asc" }],
    select: {
      id: true,
      formName: true,
      formCategory: true,
      isRequired: true,
    },
  });

  const existingForms = await prisma.prepareJoiningForm.findMany({
    where: { prepareJoiningId },
    select: { templateId: true },
  });

  const existingTemplateIds = new Set(existingForms.map((form) => form.templateId));
  const missingTemplates = templates.filter((template) => !existingTemplateIds.has(template.id));

  if (missingTemplates.length > 0) {
    await prisma.prepareJoiningForm.createMany({
      data: missingTemplates.map((template) => ({
        prepareJoiningId,
        templateId: template.id,
        formData: {},
        status: FormApprovalStatus.DRAFT,
      })),
    });
  }

  return templates;
}

export async function getPrepareJoiningComplianceSnapshot(
  prepareJoiningId: string
): Promise<PrepareJoiningComplianceSnapshot | null> {
  const basePrepareJoining = await prisma.prepareJoining.findUnique({
    where: { id: prepareJoiningId },
    select: {
      id: true,
      principalId: true,
      principal: {
        select: {
          name: true,
          formTemplates: {
            orderBy: [{ displayOrder: "asc" }, { formName: "asc" }],
            select: {
              id: true,
              formName: true,
              formCategory: true,
              isRequired: true,
            },
          },
        },
      },
    },
  });

  if (!basePrepareJoining) {
    return null;
  }

  if (basePrepareJoining.principalId) {
    await ensurePrepareJoiningPrincipalForms(basePrepareJoining.id, basePrepareJoining.principalId);
  }

  const forms = await prisma.prepareJoiningForm.findMany({
    where: { prepareJoiningId },
    select: {
      id: true,
      status: true,
      templateId: true,
    },
  });

  const formMap = new Map(forms.map((form) => [form.templateId, form]));
  const checklist = basePrepareJoining.principal?.formTemplates.map((template) => {
    const form = formMap.get(template.id);
    const status: FormApprovalStatus | "MISSING" = form?.status ?? "MISSING";

    return {
      templateId: template.id,
      formName: template.formName,
      formCategory: template.formCategory,
      isRequired: template.isRequired,
      status,
      formId: form?.id ?? null,
      detail:
        status === "MISSING"
          ? "Required template has not been generated for this joining workflow."
          : status === FormApprovalStatus.APPROVED
            ? "Approved and available for joining clearance."
            : "Form exists but still requires completion or approval.",
    };
  }) ?? [];

  const missingRequiredForms = checklist.filter(
    (item) => item.isRequired && item.status === "MISSING"
  );
  const pendingRequiredForms = checklist.filter(
    (item) =>
      item.isRequired &&
      item.status !== "MISSING" &&
      item.status !== FormApprovalStatus.APPROVED
  );
  const blockers = [
    ...(basePrepareJoining.principalId
      ? []
      : ["Assign principal before moving this joining workflow to final review or dispatch."]),
    ...missingRequiredForms.map((item) => `Missing required principal form: ${item.formName}`),
    ...pendingRequiredForms.map((item) => `Required form not approved: ${item.formName}`),
  ];

  return {
    prepareJoiningId: basePrepareJoining.id,
    principalId: basePrepareJoining.principalId,
    principalName: basePrepareJoining.principal?.name ?? null,
    requiredTemplateCount: checklist.filter((item) => item.isRequired).length,
    approvedRequiredCount: checklist.filter(
      (item) => item.isRequired && item.status === FormApprovalStatus.APPROVED
    ).length,
    missingRequiredForms,
    pendingRequiredForms,
    checklist,
    blockers,
  };
}

export async function assertPrepareJoiningStatusTransition(
  prepareJoiningId: string,
  nextStatus: PrepareJoiningStatus
) {
  if (!ENFORCED_STATUSES.has(nextStatus)) {
    return null;
  }

  const snapshot = await getPrepareJoiningComplianceSnapshot(prepareJoiningId);
  if (!snapshot) {
    return null;
  }

  if (snapshot.blockers.length === 0) {
    return snapshot;
  }

  const error = new Error(
    `Prepare joining cannot move to ${nextStatus}: ${snapshot.blockers.join("; ")}`
  ) as Error & { statusCode?: number; snapshot?: PrepareJoiningComplianceSnapshot };

  error.statusCode = 400;
  error.snapshot = snapshot;
  throw error;
}
