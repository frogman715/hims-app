import { prisma } from "@/lib/prisma";

type RequirementRule = {
  code: string;
  label: string;
  rationale: string;
};

function getFlagRequirements(flag: string): RequirementRule[] {
  const normalized = flag.toUpperCase();
  const baseline: RequirementRule[] = [
    {
      code: "MLC-SEA",
      label: "SEA / contract validity",
      rationale: "Crew employment terms must be valid before deployment.",
    },
    {
      code: "STCW-DOC",
      label: "Passport, seaman book, and STCW validity",
      rationale: "Core statutory documentation must remain valid through rotation.",
    },
  ];

  if (normalized.includes("PANAMA") || normalized.includes("BAHAMAS")) {
    baseline.push({
      code: "FLAG-CERT",
      label: "Flag state certificate set",
      rationale: "Additional flag-specific certificates may be required before sign-on.",
    });
  }

  if (normalized.includes("NETHERLAND") || normalized.includes("NL")) {
    baseline.push({
      code: "SCHENGEN",
      label: "Schengen visa review",
      rationale: "Travel and joining plan may require Schengen readiness.",
    });
  }

  if (normalized.includes("INDONESIA")) {
    baseline.push({
      code: "DEPHUB",
      label: "Dephub verification",
      rationale: "Company-side Indonesian certificate verification remains relevant.",
    });
  }

  return baseline;
}

function getPrincipalRequirements(country: string): RequirementRule[] {
  const normalized = country.toUpperCase();
  const rules: RequirementRule[] = [
    {
      code: "OWNER-APPROVAL",
      label: "Principal approval before mobilization",
      rationale: "Deployment should follow owner or principal acceptance.",
    },
  ];

  if (normalized.includes("INDONESIA")) {
    rules.push({
      code: "SIUPAK",
      label: "Agency and licensing compliance",
      rationale: "Principal operations must remain aligned with Indonesian agency requirements.",
    });
  }

  return rules;
}

export type RequirementMatrixGroup = {
  principalId: string;
  principalName: string;
  country: string;
  agreementExpiry: string | null;
  vessels: Array<{
    vesselId: string;
    vesselName: string;
    flag: string;
    vesselType: string;
    requirements: RequirementRule[];
  }>;
};

export async function getRequirementMatrix() {
  const principals = await prisma.principal.findMany({
    orderBy: { name: "asc" },
    include: {
      vessels: {
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
      },
    },
  });

  return {
    generatedAt: new Date().toISOString(),
    principals: principals.map((principal): RequirementMatrixGroup => {
      const principalRules = getPrincipalRequirements(principal.country);
      return {
        principalId: principal.id,
        principalName: principal.name,
        country: principal.country,
        agreementExpiry: principal.agreementExpiry?.toISOString() ?? null,
        vessels: principal.vessels.map((vessel) => ({
          vesselId: vessel.id,
          vesselName: vessel.name,
          flag: vessel.flag,
          vesselType: vessel.type,
          requirements: [...principalRules, ...getFlagRequirements(vessel.flag)],
        })),
      };
    }),
  };
}
