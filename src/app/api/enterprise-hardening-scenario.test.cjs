const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const {
  registerTsNode,
  withMockedModuleLoad,
} = require("../../lib/test-harness.cjs");

registerTsNode({
  transpileOnly: true,
  compilerOptions: {
    module: "commonjs",
    moduleResolution: "node",
  },
});

function createNextResponseMock() {
  return {
    json(body, init = {}) {
      return {
        status: init.status ?? 200,
        body,
        async json() {
          return body;
        },
      };
    },
  };
}

function createSharedState() {
  return {
    principals: [{ id: "pr-1", name: "Atlas", status: "ACTIVE" }],
    vessels: [{ id: "ves-1", name: "MV Alpha", status: "ACTIVE" }],
    crew: [],
    recruitments: [],
    applications: [],
    prepareJoinings: [],
    assignments: [],
    signOffs: [],
    auditLogs: [],
  };
}

function buildPrisma(state) {
  const prisma = {
    crew: {
      async create({ data }) {
        const crew = {
          id: `crew-${state.crew.length + 1}`,
          crewCode: `CRW-${state.crew.length + 1}`,
          fullName: data.fullName,
          rank: data.rank,
          phone: data.phone ?? null,
          email: data.email ?? null,
          nationality: data.nationality ?? null,
          status: data.status ?? "STANDBY",
          crewStatus: data.crewStatus ?? "AVAILABLE",
        };
        state.crew.push(crew);
        return crew;
      },
      async findUnique({ where }) {
        return state.crew.find((item) => item.id === where.id) ?? null;
      },
      async update({ where, data }) {
        const crew = state.crew.find((item) => item.id === where.id);
        Object.assign(crew, data);
        return crew;
      },
    },
    recruitment: {
      async findMany(args) {
        const updatedAtFilter = args?.where?.updatedAt?.lte;
        return state.recruitments
          .filter((item) => {
            if (updatedAtFilter) {
              return item.updatedAt <= updatedAtFilter;
            }
            return true;
          })
          .filter((item) => {
            const statuses = args?.where?.status?.in;
            if (statuses && !statuses.includes(item.status)) {
              return false;
            }
            const conditions = args?.where?.OR ?? [];
            if (!conditions.length) {
              return true;
            }
            return conditions.some((condition) => {
              if (condition.crew?.email) {
                return item.crew.email === condition.crew.email;
              }
              if (condition.crew?.phone) {
                return item.crew.phone === condition.crew.phone;
              }
              if (condition.crew?.fullName) {
                return (
                  item.crew.fullName === condition.crew.fullName &&
                  item.crew.rank === condition.crew.rank
                );
              }
              return false;
            });
          });
      },
      async create({ data, include }) {
        const crew = state.crew.find((item) => item.id === data.crewId);
        const recruitment = {
          id: `rec-${state.recruitments.length + 1}`,
          crewId: data.crewId,
          recruiterId: data.recruiterId,
          recruitmentDate: data.recruitmentDate,
          status: data.status,
          remarks: data.remarks ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
          crew,
        };
        state.recruitments.push(recruitment);
        return include ? recruitment : { ...recruitment, crew: undefined };
      },
    },
    principal: {
      async findUnique({ where, select }) {
        const principal = state.principals.find((item) => item.id === where.id) ?? null;
        if (!principal || !select) {
          return principal;
        }
        return Object.fromEntries(Object.keys(select).map((key) => [key, principal[key]]));
      },
    },
    application: {
      async findFirst({ where }) {
        return (
          state.applications.find((item) => {
            if (where.crewId && item.crewId !== where.crewId) return false;
            if (where.position && item.position !== where.position) return false;
            if (Object.prototype.hasOwnProperty.call(where, "principalId") && item.principalId !== where.principalId) return false;
            if (where.status?.in && !where.status.in.includes(item.status)) return false;
            if (where.status && typeof where.status === "string" && item.status !== where.status) return false;
            return true;
          }) ?? null
        );
      },
      async create({ data, include }) {
        const crew = state.crew.find((item) => item.id === data.crewId);
        const principal = data.principalId
          ? state.principals.find((item) => item.id === data.principalId) ?? null
          : null;
        const application = {
          id: `app-${state.applications.length + 1}`,
          crewId: data.crewId,
          position: data.position,
          principalId: data.principalId ?? null,
          vesselType: data.vesselType ?? null,
          applicationDate: data.applicationDate,
          status: data.status,
          remarks: data.remarks ?? null,
          attachments: data.attachments ?? null,
          createdAt: new Date(),
          crew: {
            ...crew,
            prepareJoinings: [],
          },
          principal,
        };
        state.applications.push(application);
        return include ? application : { ...application, crew: undefined, principal: undefined };
      },
      async update({ where, data }) {
        const application = state.applications.find((item) => item.id === where.id);
        Object.assign(application, data);
        return application;
      },
    },
    prepareJoining: {
      async findFirst({ where }) {
        return (
          state.prepareJoinings.find((item) => {
            if (where.crewId && item.crewId !== where.crewId) return false;
            if (where.status?.in && !where.status.in.includes(item.status)) return false;
            return true;
          }) ?? null
        );
      },
      async create({ data, include }) {
        const crew = state.crew.find((item) => item.id === data.crewId);
        const vessel = data.vesselId
          ? state.vessels.find((item) => item.id === data.vesselId) ?? null
          : null;
        const principal = data.principalId
          ? state.principals.find((item) => item.id === data.principalId) ?? null
          : null;
        const record = {
          id: `pj-${state.prepareJoinings.length + 1}`,
          crewId: data.crewId,
          vesselId: data.vesselId ?? null,
          principalId: data.principalId ?? null,
          status: data.status,
          medicalValid: data.medicalValid,
          orientationCompleted: data.orientationCompleted,
          ticketBooked: data.ticketBooked,
          hotelBooked: data.hotelBooked,
          transportArranged: data.transportArranged,
          createdAt: new Date(),
          updatedAt: new Date(),
          crew,
          vessel,
          principal: principal ? { ...principal, formTemplates: [] } : null,
          forms: [],
        };
        state.prepareJoinings.push(record);
        return include ? record : { ...record, crew: undefined };
      },
    },
    vessel: {
      async findUnique({ where, select }) {
        const vessel = state.vessels.find((item) => item.id === where.id) ?? null;
        if (!vessel || !select) {
          return vessel;
        }
        return Object.fromEntries(Object.keys(select).map((key) => [key, vessel[key]]));
      },
    },
    assignment: {
      async findFirst({ where }) {
        return (
          state.assignments.find((item) => {
            if (where.crewId && item.crewId !== where.crewId) return false;
            if (where.assignmentId && item.id !== where.assignmentId) return false;
            if (where.status?.in && !where.status.in.includes(item.status)) return false;
            return true;
          }) ?? null
        );
      },
      async create({ data, include }) {
        const crew = state.crew.find((item) => item.id === data.crewId);
        const vessel = state.vessels.find((item) => item.id === data.vesselId);
        const principal = state.principals.find((item) => item.id === data.principalId);
        const assignment = {
          id: `asg-${state.assignments.length + 1}`,
          crewId: data.crewId,
          vesselId: data.vesselId,
          principalId: data.principalId,
          rank: data.rank,
          startDate: data.startDate,
          endDate: data.endDate ?? null,
          status: "ACTIVE",
          crew,
          vessel,
          principal,
        };
        state.assignments.push(assignment);
        return include ? assignment : { ...assignment, crew: undefined };
      },
      async findUnique({ where, select }) {
        const assignment = state.assignments.find((item) => item.id === where.id) ?? null;
        if (!assignment || !select) {
          return assignment;
        }
        return Object.fromEntries(Object.keys(select).map((key) => [key, assignment[key]]));
      },
      async update({ where, data }) {
        const assignment = state.assignments.find((item) => item.id === where.id);
        Object.assign(assignment, data);
        return assignment;
      },
    },
    crewSignOff: {
      async findFirst({ where }) {
        return state.signOffs.find((item) => item.assignmentId === where.assignmentId) ?? null;
      },
      async create({ data }) {
        const signOff = {
          id: `so-${state.signOffs.length + 1}`,
          ...data,
        };
        state.signOffs.push(signOff);
        return signOff;
      },
    },
    auditLog: {
      async create({ data }) {
        state.auditLogs.push(data);
        return data;
      },
    },
    $transaction: async (callback) => callback(prisma),
  };

  return prisma;
}

function loadRoute(moduleRelativePath, mocks) {
  const modulePath = path.join(process.cwd(), moduleRelativePath);
  delete require.cache[require.resolve(modulePath)];

  return withMockedModuleLoad(
    {
      "next/server": { NextResponse: createNextResponseMock() },
      "next-auth": { getServerSession: mocks.getServerSession },
      "@/lib/auth": { authOptions: { provider: "mock" } },
      "@/lib/prisma": { prisma: mocks.prisma },
      "@/lib/office-api-access": { ensureOfficeApiPathAccess: () => null },
      "@/lib/permission-middleware": {
        PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS", EDIT_ACCESS: "EDIT_ACCESS" },
        checkPermission: () => true,
        applicationsGuard: () => true,
      },
      "@/lib/error-handler": {
        ApiError: class ApiError extends Error {
          constructor(statusCode, message, code) {
            super(message);
            this.statusCode = statusCode;
            this.code = code;
          }
        },
        handleApiError(error) {
          return {
            status: error.statusCode ?? 500,
            body: { error: error.message, code: error.code },
            async json() {
              return this.body;
            },
          };
        },
      },
      "@/lib/recruitment-flow": {
        getRecruitmentStatusLabel(value) {
          return value;
        },
        isRecruitmentStatus() {
          return true;
        },
      },
      "@/lib/application-flow-state": {
        parseApplicationFlowState(value) {
          return value ? JSON.parse(value) : { cvReadyAt: null, cvReadyBy: null };
        },
        resolveHgiApplicationStage({ hasPrepareJoining, status }) {
          return hasPrepareJoining ? "PREPARE_JOINING" : status;
        },
        stringifyApplicationFlowState(_current, patch) {
          return JSON.stringify(patch);
        },
      },
      "@/lib/crewing-hardening": {
        ACTIVE_APPLICATION_STATUSES: ["RECEIVED", "REVIEWING", "INTERVIEW", "PASSED", "OFFERED", "ACCEPTED"],
        ACTIVE_PREPARE_JOINING_STATUSES: ["PENDING", "DOCUMENTS", "MEDICAL", "TRAINING", "TRAVEL", "READY", "DISPATCHED"],
      },
      "@/lib/data-quality-hardening": {
        ACTIVE_RECRUITMENT_STATUSES: ["APPLICANT", "SCREENING", "INTERVIEW", "SELECTED", "APPROVED", "ON_HOLD"],
        detectDuplicateRecruitmentGroups(items) {
          const grouped = new Map();
          for (const item of items) {
            const key = `${item.crew.email || item.crew.phone || `${item.crew.fullName}:${item.crew.rank}`}`;
            const count = grouped.get(key) ?? 0;
            grouped.set(key, count + 1);
          }
          return [...grouped.entries()]
            .filter(([, count]) => count > 1)
            .map(([key]) => ({ key }));
        },
      },
      "@/lib/prepare-joining-schemas": {
        prepareJoiningCreateSchema: {
          safeParse(value) {
            return { success: true, data: value };
          },
        },
      },
      "@/lib/prepare-joining-enforcement": {
        ensurePrepareJoiningPrincipalForms: async () => {},
        getPrepareJoiningComplianceSnapshot: async () => null,
      },
      "@/lib/document-control": {
        summarizeCrewCompleteness() {
          return {
            status: "READY",
            nextAction: "Ready",
            missing: [],
            needsReview: [],
            expired: [],
          };
        },
      },
      "@/lib/prepare-joining-continuity": {
        getPrepareJoiningContinuity() {
          return { status: "READY", nextAction: "Proceed" };
        },
      },
    },
    () => require(modulePath)
  );
}

test("enterprise workflow scenario covers recruitment to sign-off with state transitions and audit trail", async () => {
  const state = createSharedState();
  const prisma = buildPrisma(state);
  const mocks = {
    prisma,
    getServerSession: async () => ({
      user: {
        id: "user-1",
        roles: ["DIRECTOR", "CDMO", "OPERATIONAL", "HR_ADMIN"],
        role: "DIRECTOR",
      },
    }),
  };

  const recruitmentsRoute = loadRoute("src/app/api/recruitments/route.ts", mocks);
  const applicationsRoute = loadRoute("src/app/api/applications/route.ts", mocks);
  const prepareJoiningRoute = loadRoute("src/app/api/prepare-joining/route.ts", mocks);
  const assignmentsRoute = loadRoute("src/app/api/assignments/route.ts", mocks);
  const signOffRoute = loadRoute("src/app/api/crewing/sign-off/route.ts", mocks);

  const recruitmentResponse = await recruitmentsRoute.POST({
    async json() {
      return {
        candidateName: "Crew One",
        position: "Chief Officer",
        email: "crew.one@example.com",
        nationality: "Indonesia",
      };
    },
  });

  assert.equal(recruitmentResponse.status, 201);
  assert.equal(state.recruitments.length, 1);
  assert.equal(state.crew.length, 1);

  const crewId = state.crew[0].id;

  const applicationResponse = await applicationsRoute.POST({
    async json() {
      return {
        crewId,
        position: "Chief Officer",
        principalId: "pr-1",
      };
    },
  });

  assert.equal(applicationResponse.status, 201);
  assert.equal(state.applications.length, 1);
  state.applications[0].status = "ACCEPTED";

  const prepareJoiningResponse = await prepareJoiningRoute.POST({
    async json() {
      return {
        crewId,
        vesselId: "ves-1",
        principalId: "pr-1",
        status: "PENDING",
      };
    },
  });

  assert.equal(prepareJoiningResponse.status, 201);
  assert.equal(state.prepareJoinings.length, 1);

  const assignmentResponse = await assignmentsRoute.POST({
    async json() {
      return {
        crewId,
        vesselId: "ves-1",
        principalId: "pr-1",
        rank: "Chief Officer",
        startDate: "2026-03-29T00:00:00.000Z",
      };
    },
  });

  assert.equal(assignmentResponse.status, 201);
  assert.equal(state.assignments.length, 1);
  assert.equal(state.assignments[0].status, "ACTIVE");

  const signOffResponse = await signOffRoute.POST({
    async json() {
      return {
        crewId,
        assignmentId: state.assignments[0].id,
        signOffDate: "2026-06-10T00:00:00.000Z",
        passportReceived: true,
        seamanBookReceived: true,
      };
    },
  });

  assert.equal(signOffResponse.status, 201);
  assert.equal(state.signOffs.length, 1);
  assert.equal(state.crew[0].status, "OFF_SIGNED");
  assert.equal(state.assignments[0].status, "COMPLETED");
  assert.deepEqual(
    state.auditLogs.map((entry) => entry.action),
    [
      "RECRUITMENT_CREATED",
      "APPLICATION_CREATED",
      "PREPARE_JOINING_CREATED",
      "CREW_SIGN_OFF_CREATED",
    ]
  );
});
