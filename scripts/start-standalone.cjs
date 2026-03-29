const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const projectRoot = process.cwd();
const standaloneRoot = path.join(projectRoot, '.next/standalone');
const envFiles = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.production.local',
];

const PLACEHOLDER_PATTERNS = [
  /YOUR_SECURE_PASSWORD/i,
  /CHANGE_ME/i,
  /YOUR_[A-Z0-9_]+/i,
];

function isPlaceholder(value) {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
}

const resolvedEnv = {};

for (const file of envFiles) {
  const fullPath = path.join(projectRoot, file);
  if (!fs.existsSync(fullPath)) {
    continue;
  }

  const parsed = dotenv.parse(fs.readFileSync(fullPath));

  for (const [key, value] of Object.entries(parsed)) {
    if (isPlaceholder(value)) {
      continue;
    }

    process.env[key] = value;
    resolvedEnv[key] = value;
  }
}

if (fs.existsSync(standaloneRoot)) {
  const serializedEnv = Object.entries(resolvedEnv)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join('\n');

  for (const file of ['.env', '.env.production']) {
    fs.writeFileSync(path.join(standaloneRoot, file), `${serializedEnv}\n`);
  }
}

require(path.join(projectRoot, '.next/standalone/server.js'));
