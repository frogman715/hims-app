// Prisma configuration for migrations
// This is only used by Prisma CLI, not by the application
module.exports = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://hims_user:Hanmarine23@localhost:5432/hims_prod',
    },
  },
};
