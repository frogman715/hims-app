type CrewDocumentRow = {
  docType: string;
  expiryDate: Date | null;
  crew: {
    fullName: string;
    id: string;
  };
};

type ContractRow = {
  id: string;
  contractNumber: string;
  contractEnd: Date;
  status: string;
  crew: {
    fullName: string;
    id: string;
  };
  crewId: string;
  vesselId: string | null;
  vessel: {
    name: string;
  } | null;
  principal: {
    name: string;
  } | null;
};

type AssignmentRow = {
  status: string;
  crew: {
    fullName: string;
    rank: string | null;
  };
  vessel: {
    name: string;
    principal: {
      name: string;
    } | null;
  };
  principal: {
    name: string;
  } | null;
};

type CrewIssueGroup = Array<{
  name: string;
  crewId: string;
  documents: Array<{
    type: string;
    expiryDate: Date | null;
    daysUntilExpiry: number;
  }>;
  contracts: Array<{
    vesselName: string;
    expiryDate: Date;
    daysUntilExpiry: number;
    assignmentId: string;
  }>;
}>;

export function groupCrewDocumentsByCrew(crewWithExpiringDocuments: CrewDocumentRow[]) {
  return Object.values(
    crewWithExpiringDocuments.reduce<Record<string, {
      name: string;
      crewId: string;
      documents: Array<{ type: string; expiryDate: Date | null; daysUntilExpiry: number }>;
    }>>((acc, doc) => {
      const crewName = doc.crew.fullName;
      if (!acc[crewName]) {
        acc[crewName] = {
          name: crewName,
          crewId: doc.crew.id,
          documents: [],
        };
      }

      acc[crewName].documents.push({
        type: doc.docType || "Unknown",
        expiryDate: doc.expiryDate,
        daysUntilExpiry: doc.expiryDate
          ? Math.ceil((doc.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      });

      return acc;
    }, {})
  );
}

export function groupCrewContractsByCrew(
  crewWithExpiringContracts: ContractRow[],
  buildContractAlert: (contract: {
    id: string;
    crewId: string;
    vesselId: string | null;
    contractNumber: string;
    contractEnd: Date;
    status: string;
  }) => {
    daysRemaining: number;
    band: string;
    nextAction: string;
  }
) {
  return Object.values(
    crewWithExpiringContracts.reduce<Record<string, {
      name: string;
      crewId: string;
      contracts: Array<{
        vesselName: string;
        principalName: string;
        expiryDate: Date;
        daysUntilExpiry: number;
        band: string;
        nextAction: string;
        assignmentId: string;
      }>;
    }>>((acc, contract) => {
      const crewName = contract.crew.fullName;
      if (!acc[crewName]) {
        acc[crewName] = {
          name: crewName,
          crewId: contract.crew.id,
          contracts: [],
        };
      }

      const alert = buildContractAlert({
        id: contract.id,
        crewId: contract.crew.id,
        vesselId: contract.vesselId,
        contractNumber: contract.contractNumber,
        contractEnd: contract.contractEnd,
        status: contract.status,
      });

      acc[crewName].contracts.push({
        vesselName: contract.vessel?.name || "Unassigned Vessel",
        principalName: contract.principal?.name || "Unassigned Principal",
        expiryDate: contract.contractEnd,
        daysUntilExpiry: alert.daysRemaining,
        band: alert.band,
        nextAction: alert.nextAction,
        assignmentId: contract.id,
      });

      return acc;
    }, {})
  );
}

export function buildCrewMovementItems(recentAssignments: AssignmentRow[]) {
  return recentAssignments.map((assignment) => ({
    seafarer: assignment.crew.fullName,
    rank: assignment.crew.rank || "N/A",
    principal: assignment.vessel.principal?.name || assignment.principal?.name || "Unassigned Principal",
    vessel: assignment.vessel.name,
    status: assignment.status,
    nextAction:
      assignment.status === "PLANNED"
        ? "Prepare for sign-on"
        : assignment.status === "ASSIGNED"
          ? "Finalize deployment"
          : "Onboard",
  }));
}

export function buildExpiringItems(crewWithIssues: CrewIssueGroup) {
  const expiringItems: Array<{
    seafarer: string;
    type: string;
    name: string;
    expiryDate: string;
    daysLeft: number;
  }> = [];

  crewWithIssues.forEach((crew) => {
    crew.documents.forEach((doc) => {
      if (doc.expiryDate) {
        expiringItems.push({
          seafarer: crew.name,
          type: doc.type,
          name: doc.type,
          expiryDate: doc.expiryDate.toISOString(),
          daysLeft: doc.daysUntilExpiry,
        });
      }
    });

    crew.contracts.forEach((contract) => {
      expiringItems.push({
        seafarer: crew.name,
        type: "CONTRACT",
        name: `${contract.vesselName} Contract`,
        expiryDate: contract.expiryDate.toISOString(),
        daysLeft: contract.daysUntilExpiry,
      });
    });
  });

  return expiringItems.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 10);
}

export function buildContractExpiryItems(crewWithContracts: Array<{
  name: string;
  crewId: string;
  contracts: Array<{
    vesselName: string;
    principalName: string;
    expiryDate: Date;
    daysUntilExpiry: number;
    band: string;
    nextAction: string;
  }>;
}>) {
  return crewWithContracts
    .flatMap((crew) =>
      crew.contracts.map((contract) => ({
        seafarer: crew.name,
        crewId: crew.crewId,
        vessel: contract.vesselName,
        principal: contract.principalName,
        expiryDate: contract.expiryDate.toISOString(),
        daysLeft: contract.daysUntilExpiry,
        band: contract.band,
        nextAction: contract.nextAction,
        link: "/crewing/crew-list",
      }))
    )
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 8);
}
