const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const projectRoot = process.cwd();
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
  }
}

require(path.join(projectRoot, '.next/standalone/server.js'));
