#!/usr/bin/env node

import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const MCP_DIR = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(MCP_DIR, '..');
const MISSIONS_ROOT = path.join(PROJECT_ROOT, 'missions');
const SUITES_ROOT = path.join(MISSIONS_ROOT, 'suites');
const CONFIG_PATH = path.join(PROJECT_ROOT, 'testronaut-config.json');
const CLI_PATH = path.join(PROJECT_ROOT, 'node_modules', 'testronaut', 'bin', 'cli.js');
const MAX_OUTPUT_BYTES = 20 * 1024 * 1024;

async function loadConfig() {
  try {
    return JSON.parse(await fs.readFile(CONFIG_PATH, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return {};
    throw new Error(`Could not read testronaut-config.json: ${error.message}`);
  }
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

export async function resolveMission(mission) {
  if (typeof mission !== 'string' || !mission.trim()) {
    throw new Error('Mission must be a non-empty path.');
  }

  const requested = mission.trim().replaceAll('\\', '/');
  const relative = requested.startsWith('missions/') ? requested.slice('missions/'.length) : requested;
  const resolved = path.resolve(MISSIONS_ROOT, relative);

  if (!isInside(MISSIONS_ROOT, resolved)) {
    throw new Error(`Mission must be inside ${path.relative(PROJECT_ROOT, MISSIONS_ROOT)}.`);
  }
  if (!/\.mission\.(?:js|ts)$/i.test(resolved)) {
    throw new Error('Mission must end in .mission.js or .mission.ts.');
  }

  const stat = await fs.stat(resolved).catch(() => null);
  if (!stat?.isFile()) throw new Error(`Mission not found: ${mission}`);

  return path.relative(PROJECT_ROOT, resolved).replaceAll(path.sep, '/');
}

const artifactNamePattern = /^[a-z][a-z0-9-]{1,63}$/;

function assertArtifactName(name, kind) {
  if (!artifactNamePattern.test(name)) {
    throw new Error(`${kind} name must be 2-64 lowercase letters, numbers, or hyphens, starting with a letter.`);
  }
}

function variableName(name) {
  return `${name.replace(/-([a-z0-9])/g, (_, character) => character.toUpperCase())}Mission`;
}

export function renderMission({ name, title, objective, steps, successCriteria, tags = [], requiresLogin = true }) {
  assertArtifactName(name, 'Mission');
  const missionVariable = variableName(name);
  const missionTitle = title?.trim() || name.split('-').join(' ');
  const instructions = [
    `Objective: ${objective.trim()}`,
    '',
    'Steps:',
    ...steps.map((step, index) => `${index + 1}. ${step.trim()}`),
    '',
    `Success criteria: ${(successCriteria || `Complete every step and verify the objective: ${objective}`).trim()}`,
    'Report SUCCESS only when the success criteria are visibly satisfied. Otherwise report FAILURE with the unmet criterion.',
  ].join('\n');
  const imports = [
    "import { runMissions } from 'testronaut';",
    "import { applyMissionPolicies } from './policies.js';",
    ...(requiresLogin ? ["import { loginPrerequisite } from './login.mission.js';"] : []),
  ];
  const runOptions = requiresLogin
    ? `{ preMission: [loginPrerequisite], mission: ${missionVariable}, tags }`
    : `{ mission: ${missionVariable}, tags }`;

  return `${imports.join('\n')}\n\n`
    + `export const tags = ${JSON.stringify(tags)};\n\n`
    + `export const ${missionVariable} = applyMissionPolicies(${JSON.stringify(instructions)});\n\n`
    + `export async function executeMission() {\n`
    + `  return await runMissions(${runOptions}, ${JSON.stringify(missionTitle)});\n`
    + `}\n`;
}

export async function createMissionArtifact(input, { missionsRoot = MISSIONS_ROOT } = {}) {
  assertArtifactName(input.name, 'Mission');
  const filePath = path.join(missionsRoot, `${input.name}.mission.js`);
  await fs.mkdir(missionsRoot, { recursive: true });
  try {
    await fs.writeFile(filePath, renderMission(input), { encoding: 'utf8', flag: 'wx' });
  } catch (error) {
    if (error?.code === 'EEXIST') throw new Error(`Mission already exists: ${input.name}`);
    throw error;
  }
  return {
    name: input.name,
    file: path.relative(PROJECT_ROOT, filePath).replaceAll(path.sep, '/'),
    tags: input.tags || [],
    requiresLogin: input.requiresLogin ?? true,
  };
}

function suitePath(name, suitesRoot = SUITES_ROOT) {
  assertArtifactName(name, 'Suite');
  return path.join(suitesRoot, `${name}.suite.json`);
}

export async function loadSuite(name, { suitesRoot = SUITES_ROOT } = {}) {
  const filePath = suitePath(name, suitesRoot);
  let suite;
  try {
    suite = JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') throw new Error(`Suite not found: ${name}`);
    throw new Error(`Could not read suite ${name}: ${error.message}`);
  }
  if (!Array.isArray(suite.missions) || !['isolated', 'shared-auth'].includes(suite.session)) {
    throw new Error(`Suite ${name} has an invalid manifest.`);
  }
  return { suite, filePath };
}

export async function createSuiteArtifact(input, { suitesRoot = SUITES_ROOT } = {}) {
  assertArtifactName(input.name, 'Suite');
  const missions = await Promise.all(input.missions.map(resolveMission));
  const now = new Date().toISOString();
  const suite = {
    schemaVersion: 1,
    name: input.name,
    description: input.description?.trim() || '',
    session: input.session || 'isolated',
    missions,
    createdAt: now,
    updatedAt: now,
  };
  const filePath = suitePath(input.name, suitesRoot);
  await fs.mkdir(suitesRoot, { recursive: true });
  try {
    await fs.writeFile(filePath, `${JSON.stringify(suite, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
  } catch (error) {
    if (error?.code === 'EEXIST') throw new Error(`Suite already exists: ${input.name}`);
    throw error;
  }
  return { suite, file: path.relative(PROJECT_ROOT, filePath).replaceAll(path.sep, '/') };
}

export async function updateSuiteArtifact(input, { suitesRoot = SUITES_ROOT } = {}) {
  const { suite, filePath } = await loadSuite(input.name, { suitesRoot });
  const additions = await Promise.all((input.addMissions || []).map(resolveMission));
  const removals = new Set(await Promise.all((input.removeMissions || []).map(resolveMission)));
  const missions = [...new Set([...suite.missions.filter(mission => !removals.has(mission)), ...additions])];
  if (!missions.length) throw new Error('A suite must contain at least one mission.');
  const updated = {
    ...suite,
    ...(input.description !== undefined ? { description: input.description.trim() } : {}),
    ...(input.session ? { session: input.session } : {}),
    missions,
    updatedAt: new Date().toISOString(),
  };
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
  await fs.rename(temporaryPath, filePath);
  return { suite: updated, file: path.relative(PROJECT_ROOT, filePath).replaceAll(path.sep, '/') };
}

function parseJsonOutput(stdout, stderr) {
  try {
    return JSON.parse(stdout);
  } catch {
    const detail = stderr.trim() || stdout.trim() || 'The CLI produced no output.';
    throw new Error(`Testronaut did not return valid JSON: ${detail.slice(0, 2000)}`);
  }
}

export function runCli(args, { timeoutSeconds = 600 } = {}) {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 20 || (major === 20 && minor < 17)) {
    return Promise.reject(new Error(
      `Testronaut 2.1 requires Node.js 20.17 or newer; this MCP server is running on ${process.versions.node}.`,
    ));
  }

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI_PATH, ...args, '--json', '--quiet'], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, TESTRONAUT_HUMAN_INPUT: 'false' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let outputBytes = 0;
    let settled = false;

    const finish = callback => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback();
    };
    const collect = target => chunk => {
      outputBytes += chunk.length;
      if (outputBytes > MAX_OUTPUT_BYTES) {
        child.kill('SIGTERM');
        finish(() => reject(new Error('Testronaut output exceeded the 20 MB safety limit.')));
        return;
      }
      if (target === 'stdout') stdout += chunk;
      else stderr += chunk;
    };

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', collect('stdout'));
    child.stderr.on('data', collect('stderr'));
    child.on('error', error => finish(() => reject(error)));
    child.on('close', (exitCode, signal) => finish(() => {
      try {
        resolve({ exitCode, signal, result: parseJsonOutput(stdout, stderr), stderr: stderr.trim() || undefined });
      } catch (error) {
        reject(error);
      }
    }));

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      finish(() => reject(new Error(`Testronaut timed out after ${timeoutSeconds} seconds.`)));
    }, timeoutSeconds * 1000);
  });
}

async function reportDirectory() {
  const config = await loadConfig();
  return path.resolve(PROJECT_ROOT, config.outputDir || 'missions/mission_reports');
}

export async function latestReport() {
  const directory = await reportDirectory();
  const entries = await fs.readdir(directory, { withFileTypes: true }).catch(error => {
    if (error?.code === 'ENOENT') return [];
    throw error;
  });
  const reports = entries
    .filter(entry => entry.isFile() && /^run_\d+\.json$/.test(entry.name))
    .map(entry => entry.name)
    .sort((a, b) => Number(b.slice(4, -5)) - Number(a.slice(4, -5)));

  if (!reports.length) return null;
  const jsonPath = path.join(directory, reports[0]);
  const report = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
  return {
    runId: report.runId,
    startTime: report.startTime,
    endTime: report.endTime,
    durationMs: report.durationMs,
    summary: report.summary,
    missions: (report.missions || []).map(mission => ({
      name: mission.missionName,
      file: mission.file,
      status: mission.status,
      durationMs: mission.durationMs,
    })),
    jsonReport: path.relative(PROJECT_ROOT, jsonPath).replaceAll(path.sep, '/'),
    htmlReport: path.relative(PROJECT_ROOT, jsonPath.replace(/\.json$/, '.html')).replaceAll(path.sep, '/'),
  };
}

function toolResult(value, isError = false) {
  return {
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    structuredContent: value,
    ...(isError ? { isError: true } : {}),
  };
}

export function createServer() {
  const server = new McpServer(
    { name: '🧑‍🚀 Testronaut', version: '0.1.0' },
    { instructions: 'Use list_missions before selecting tests. Use dryRun when checking a plan. Mission runs operate a real browser and may change the configured test application.' },
  );

  server.registerTool('list_missions', {
    title: '🧑‍🚀 List Testronaut missions',
    description: 'List the mission files and tags available in this Testronaut project without running them.',
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, async () => {
    const run = await runCli(['list'], { timeoutSeconds: 30 });
    return toolResult({ ...run.result, exitCode: run.exitCode });
  });

  server.registerTool('create_mission', {
    title: '🧑‍🚀 Create a Testronaut mission',
    description: 'Create a new version-controlled JavaScript mission from structured intent. Refuses to overwrite existing missions.',
    inputSchema: {
      name: z.string().regex(artifactNamePattern).describe('Stable kebab-case name, such as route-persistence.'),
      title: z.string().min(1).max(120).optional().describe('Human-readable report label.'),
      objective: z.string().min(1).max(2000),
      steps: z.array(z.string().min(1).max(2000)).min(1).max(50),
      successCriteria: z.string().min(1).max(2000).optional(),
      tags: z.array(z.string().regex(/^[a-z0-9][a-z0-9-]{0,31}$/)).max(20).default([]),
      requiresLogin: z.boolean().default(true),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  }, async input => toolResult(await createMissionArtifact(input)));

  server.registerTool('validate_mission', {
    title: '🧑‍🚀 Validate a Testronaut mission',
    description: 'Load an existing mission and resolve its Testronaut execution plan without launching a browser.',
    inputSchema: {
      mission: z.string().describe('Mission path relative to missions/.'),
      timeoutSeconds: z.number().int().min(10).max(120).default(30),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, async ({ mission, timeoutSeconds }) => {
    const safeMission = await resolveMission(mission);
    const run = await runCli([safeMission, '--dry-run'], { timeoutSeconds });
    return toolResult({ ...run.result, exitCode: run.exitCode }, run.exitCode !== 0);
  });

  server.registerTool('create_suite', {
    title: '🧑‍🚀 Create a Testronaut suite',
    description: 'Create a persistent JSON suite manifest containing an ordered set of existing missions. Refuses to overwrite an existing suite.',
    inputSchema: {
      name: z.string().regex(artifactNamePattern).describe('Stable kebab-case suite name.'),
      description: z.string().max(1000).optional(),
      missions: z.array(z.string()).min(1).max(50),
      session: z.enum(['isolated', 'shared-auth']).default('isolated'),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  }, async input => toolResult(await createSuiteArtifact(input)));

  server.registerTool('update_suite', {
    title: '🧑‍🚀 Update a Testronaut suite',
    description: 'Add or remove validated missions from an existing suite and optionally change its description or session mode.',
    inputSchema: {
      name: z.string().regex(artifactNamePattern),
      addMissions: z.array(z.string()).max(50).default([]),
      removeMissions: z.array(z.string()).max(50).default([]),
      description: z.string().max(1000).optional(),
      session: z.enum(['isolated', 'shared-auth']).optional(),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  }, async input => {
    const hasChange = input.addMissions.length || input.removeMissions.length
      || input.description !== undefined || input.session !== undefined;
    if (!hasChange) throw new Error('Provide at least one suite change.');
    return toolResult(await updateSuiteArtifact(input));
  });

  server.registerTool('run_mission', {
    title: '🧑‍🚀 Run a Testronaut mission',
    description: 'Run one existing mission in a real browser, or resolve its execution plan with dryRun. This can modify the configured test application.',
    inputSchema: {
      mission: z.string().describe('Mission path relative to missions/, such as login.mission.js.'),
      dryRun: z.boolean().default(false).describe('Resolve the plan without launching a browser.'),
      screenshots: z.boolean().default(true).describe('Capture screenshots during the run.'),
      timeoutSeconds: z.number().int().min(10).max(3600).default(600),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  }, async ({ mission, dryRun, screenshots, timeoutSeconds }) => {
    const safeMission = await resolveMission(mission);
    const args = [safeMission];
    if (dryRun) args.push('--dry-run');
    if (!screenshots) args.push('--no-screenshots');
    const run = await runCli(args, { timeoutSeconds });
    return toolResult({ ...run.result, exitCode: run.exitCode }, run.exitCode !== 0);
  });

  server.registerTool('run_suite', {
    title: '🧑‍🚀 Run a Testronaut mission suite',
    description: 'Run a saved suite or an inline ordered mission set. Shared-auth preserves login state between missions. This can modify the configured test application.',
    inputSchema: {
      suite: z.string().regex(artifactNamePattern).optional().describe('Saved suite name. Use either suite or missions.'),
      missions: z.array(z.string()).min(1).max(50).optional().describe('Inline ordered mission paths. Use either missions or suite.'),
      session: z.enum(['isolated', 'shared-auth']).optional().describe('Override the saved suite session mode, or configure an inline suite.'),
      dryRun: z.boolean().default(false),
      screenshots: z.boolean().default(true),
      timeoutSeconds: z.number().int().min(10).max(7200).default(1200),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  }, async ({ suite, missions, session, dryRun, screenshots, timeoutSeconds }) => {
    if ((!suite && !missions) || (suite && missions)) {
      throw new Error('Provide exactly one of suite or missions.');
    }
    let selectedMissions = missions;
    let selectedSession = session || 'isolated';
    if (suite) {
      const loaded = await loadSuite(suite);
      selectedMissions = loaded.suite.missions;
      selectedSession = session || loaded.suite.session;
    }
    const safeMissions = await Promise.all(selectedMissions.map(resolveMission));
    const args = [`--session=${selectedSession}`, ...safeMissions];
    if (dryRun) args.push('--dry-run');
    if (!screenshots) args.push('--no-screenshots');
    const run = await runCli(args, { timeoutSeconds });
    return toolResult({ ...run.result, exitCode: run.exitCode }, run.exitCode !== 0);
  });

  server.registerTool('get_latest_report', {
    title: '🧑‍🚀 Get latest Testronaut report',
    description: 'Return a compact summary and local paths for the most recent Testronaut JSON and HTML reports.',
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, async () => toolResult((await latestReport()) || { message: 'No Testronaut reports were found.' }));

  return server;
}
