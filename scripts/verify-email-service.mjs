import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

function loadEnv() {
  const projectRoot = process.cwd();
  const envFiles = [".env", ".env.local", ".env.production", ".env.production.local"];

  for (const file of envFiles) {
    const fullPath = path.join(projectRoot, file);
    if (!fs.existsSync(fullPath)) {
      continue;
    }

    const parsed = dotenv.parse(fs.readFileSync(fullPath));
    for (const [key, value] of Object.entries(parsed)) {
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}

function getConfig() {
  const provider = (process.env.EMAIL_PROVIDER || "nodemailer").toLowerCase();
  return {
    provider,
    from: process.env.EMAIL_FROM || "",
    host: process.env.SMTP_HOST || "",
    port: Number.parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    sendgridApiKey: process.env.SENDGRID_API_KEY || "",
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    awsRegion: process.env.AWS_REGION || "",
    mailgunApiKey: process.env.MAILGUN_API_KEY || "",
    mailgunDomain: process.env.MAILGUN_DOMAIN || "",
  };
}

function validateConfig(config) {
  const errors = [];

  if (!config.from) {
    errors.push("EMAIL_FROM is required");
  }

  switch (config.provider) {
    case "nodemailer":
    case "gmail":
      if (!config.host) errors.push("SMTP_HOST is required");
      if (!config.port) errors.push("SMTP_PORT is required");
      if (!config.user) errors.push("SMTP_USER is required");
      if (!config.pass) errors.push("SMTP_PASS is required");
      break;
    case "sendgrid":
      if (!config.sendgridApiKey) errors.push("SENDGRID_API_KEY is required");
      break;
    case "mailgun":
      if (!config.mailgunApiKey) errors.push("MAILGUN_API_KEY is required");
      if (!config.mailgunDomain) errors.push("MAILGUN_DOMAIN is required");
      break;
    case "aws_ses":
      if (!config.awsAccessKeyId) errors.push("AWS_ACCESS_KEY_ID is required");
      if (!config.awsSecretAccessKey) errors.push("AWS_SECRET_ACCESS_KEY is required");
      break;
    default:
      errors.push(`Unsupported EMAIL_PROVIDER: ${config.provider}`);
  }

  return errors;
}

async function verifyTransport(config) {
  if (config.provider !== "nodemailer" && config.provider !== "gmail") {
    return {
      status: "CONFIG_READY",
      verificationMode: "config_validation_only",
      message:
        "Provider credentials are present. Transport verification is only implemented for SMTP providers.",
    };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    ...(config.provider === "gmail" ? { service: "gmail" } : {}),
  });

  await transporter.verify();

  return {
    status: "VERIFIED",
    verificationMode: "smtp_transport",
    message: "SMTP transport is ready to send escalation and office notifications.",
  };
}

async function main() {
  loadEnv();

  const config = getConfig();
  const errors = validateConfig(config);

  if (errors.length > 0) {
    console.error(
      `[email-verify] ${new Date().toISOString()} ${JSON.stringify({
        status: "INVALID_CONFIGURATION",
        provider: config.provider,
        from: config.from || null,
        errors,
      })}`
    );
    process.exitCode = 1;
    return;
  }

  try {
    const verification = await verifyTransport(config);
    console.log(
      `[email-verify] ${new Date().toISOString()} ${JSON.stringify({
        provider: config.provider,
        from: config.from,
        secure: config.secure,
        host: config.host || null,
        port: Number.isFinite(config.port) ? config.port : null,
        ...verification,
      })}`
    );
  } catch (error) {
    console.error(
      `[email-verify] ${new Date().toISOString()} ${JSON.stringify({
        status: "FAILED",
        provider: config.provider,
        from: config.from,
        error: error instanceof Error ? error.message : String(error),
      })}`
    );
    process.exitCode = 1;
  }
}

main();
