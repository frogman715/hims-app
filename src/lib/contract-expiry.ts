export type ContractExpiryBand =
  | "EXPIRED"
  | "CRITICAL"
  | "URGENT"
  | "FOLLOW_UP"
  | "EARLY_WARNING"
  | "OK";

export type ContractAlertThresholds = {
  earlyWarningDays: number;
  followUpDays: number;
  urgentDays: number;
  criticalDays: number;
};

export type ContractLike = {
  id: string;
  crewId: string;
  vesselId?: string | null;
  contractNumber?: string | null;
  contractEnd: string | Date;
  status?: string | null;
  vessel?: {
    id?: string | null;
    name?: string | null;
  } | null;
  principal?: {
    name?: string | null;
  } | null;
};

export type ContractExpiryAlert = {
  contractId: string;
  crewId: string;
  vesselId: string | null;
  contractNumber: string | null;
  contractEnd: string;
  daysRemaining: number;
  band: ContractExpiryBand;
  nextAction: string;
};

export const CONTRACT_ALERT_THRESHOLDS: ContractAlertThresholds = {
  earlyWarningDays: 90,
  followUpDays: 60,
  urgentDays: 45,
  criticalDays: 30,
};

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function getContractExpiryBand(
  daysRemaining: number,
  thresholds: ContractAlertThresholds = CONTRACT_ALERT_THRESHOLDS
): ContractExpiryBand {
  if (daysRemaining < 0) return "EXPIRED";
  if (daysRemaining <= thresholds.criticalDays) return "CRITICAL";
  if (daysRemaining <= thresholds.urgentDays) return "URGENT";
  if (daysRemaining <= thresholds.followUpDays) return "FOLLOW_UP";
  if (daysRemaining <= thresholds.earlyWarningDays) return "EARLY_WARNING";
  return "OK";
}

export function getContractExpiryNextAction(daysRemaining: number) {
  if (daysRemaining < 0) {
    return "Contract already expired. Escalate to director review, confirm relief plan, and close onboard exposure immediately.";
  }
  if (daysRemaining <= 30) {
    return "Critical. Finalize renewal or confirm reliever and sign-off arrangement immediately.";
  }
  if (daysRemaining <= 45) {
    return "Urgent. Start renewal decision, reliever planning, and vessel follow-up now.";
  }
  if (daysRemaining <= 60) {
    return "Follow up with operational team on renewal readiness or replacement planning.";
  }
  if (daysRemaining <= 90) {
    return "Early warning. Keep contract extension and relief planning visible.";
  }
  return "Monitor contract validity on the normal onboard review cycle.";
}

export function buildContractExpiryAlert(
  contract: ContractLike,
  referenceDate = new Date()
): ContractExpiryAlert {
  const endDate = startOfDay(new Date(contract.contractEnd));
  const today = startOfDay(referenceDate);
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return {
    contractId: contract.id,
    crewId: contract.crewId,
    vesselId: contract.vesselId ?? contract.vessel?.id ?? null,
    contractNumber: contract.contractNumber ?? null,
    contractEnd: endDate.toISOString(),
    daysRemaining,
    band: getContractExpiryBand(daysRemaining),
    nextAction: getContractExpiryNextAction(daysRemaining),
  };
}

export function selectLatestRelevantContract<T extends ContractLike>(
  contracts: T[],
  vesselId?: string | null
): T | null {
  const activeContracts = contracts.filter((contract) => {
    const status = (contract.status ?? "").toUpperCase();
    return !["COMPLETED", "TERMINATED", "CANCELLED"].includes(status);
  });

  const vesselMatched = vesselId
    ? activeContracts.filter((contract) => (contract.vesselId ?? contract.vessel?.id ?? null) === vesselId)
    : activeContracts;

  const pool = vesselMatched.length > 0 ? vesselMatched : activeContracts;
  if (pool.length === 0) return null;

  return [...pool].sort(
    (left, right) => new Date(right.contractEnd).getTime() - new Date(left.contractEnd).getTime()
  )[0];
}
