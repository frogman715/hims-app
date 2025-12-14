// scripts/prismaClient.js
require('ts-node/register'); // supaya bisa import TypeScript
require('dotenv').config();

const { prisma } = require('../src/lib/prisma');

module.exports = { prisma };
