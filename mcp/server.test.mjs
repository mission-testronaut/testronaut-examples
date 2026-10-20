import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  createMissionArtifact,
  createServer,
  createSuiteArtifact,
  latestReport,
  reconcileSuiteRun,
  renderMission,
  resolveMission,
  updateSuiteArtifact,
  withSuiteRunLock,
} from './server.mjs';

test('mission paths are restricted to the missions directory', async () => {
  assert.equal(await resolveMission('login.mission.js'), 'missions/login.mission.js');
  await assert.rejects(resolveMission('../package.json'), /inside|end in/);
  await assert.rejects(resolveMission('files/crew-briefing-among-us.txt'), /end in/);
});

test('latestReport returns a compact report when reports exist', async () => {
  const report = await latestReport();
  if (report) {
    assert.match(report.runId, /^run_\d+$/);
    assert.ok(Array.isArray(report.missions));
    assert.equal('steps' in (report.missions[0] || {}), false);
  }
});

test('latestReport selects an exact run ID', async () => {
  const reportsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'testronaut-reports-'));
  try {
    const makeReport = runId => JSON.stringify({
      runId,
      summary: { totalMissions: 0, passed: 0, recovered: 0, failed: 0 },
      missions: [],
    });
    await fs.writeFile(path.join(reportsRoot, 'run_100.json'), makeReport('run_100'));
    await fs.writeFile(path.join(reportsRoot, 'run_200.json'), makeReport('run_200'));
    assert.equal((await latestReport('run_100', { reportsRoot })).runId, 'run_100');
    assert.equal(await latestReport('run_300', { reportsRoot }), null);
    await assert.rejects(latestReport('../run_100', { reportsRoot }), /runId/);
  } finally {
    await fs.rm(reportsRoot, { recursive: true, force: true });
  }
});

test('suite reconciliation exposes stderr and omitted missions', () => {
  const value = reconcileSuiteRun({
    exitCode: 1,
    stderr: 'Error running mission: missions/shipMapIframe.mission.js',
    result: {
      runId: 'run_123',
      missions: [{ file: 'missions/route-persistence.mission.js', status: 'passed' }],
    },
  }, [
    'missions/shipMapIframe.mission.js',
    'missions/route-persistence.mission.js',
  ]);
  assert.equal(value.exitCode, 1);
  assert.match(value.stderr, /shipMapIframe/);
  assert.deepEqual(value.missingMissions, ['missions/shipMapIframe.mission.js']);
});

test('suite lock rejects overlapping runs and releases after completion', async () => {
  let release;
  const first = withSuiteRunLock(() => new Promise(resolve => { release = resolve; }));
  await assert.rejects(withSuiteRunLock(async () => {}), /already running/);
  release('done');
  assert.equal(await first, 'done');
  assert.equal(await withSuiteRunLock(async () => 'next'), 'next');
});

test('mission authoring renders structured input without executable interpolation', async () => {
  const source = renderMission({
    name: 'route-persistence',
    objective: 'Keep `${danger}` as inert mission text.',
    steps: ['Refresh the page.', 'Verify the route remains locked.'],
    successCriteria: 'The confirmation remains visible.',
    tags: ['navigation', 'regression'],
    requiresLogin: true,
  });
  assert.match(source, /export const routePersistenceMission/);
  assert.match(source, /loginPrerequisite/);
  assert.match(source, /`\$\{danger\}`/);

  const missionsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'testronaut-missions-'));
  try {
    const created = await createMissionArtifact({
      name: 'route-persistence',
      objective: 'Keep the route after refresh.',
      steps: ['Refresh.', 'Verify the route.'],
      tags: [],
      requiresLogin: false,
    }, { missionsRoot });
    assert.equal(created.name, 'route-persistence');
    await assert.rejects(createMissionArtifact({
      name: 'route-persistence',
      objective: 'Do not overwrite.',
      steps: ['Stop.'],
      tags: [],
    }, { missionsRoot }), /already exists/);
  } finally {
    await fs.rm(missionsRoot, { recursive: true, force: true });
  }
});

test('suite authoring creates and updates a persistent manifest', async () => {
  const suitesRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'testronaut-suites-'));
  try {
    const created = await createSuiteArtifact({
      name: 'navigation-regression',
      description: 'Navigation coverage',
      missions: ['login.mission.js', 'shipMapIframe.mission.js'],
      session: 'shared-auth',
    }, { suitesRoot });
    assert.deepEqual(created.suite.missions, [
      'missions/login.mission.js',
      'missions/shipMapIframe.mission.js',
    ]);
    const updated = await updateSuiteArtifact({
      name: 'navigation-regression',
      addMissions: ['logout.mission.js'],
      removeMissions: ['login.mission.js'],
      session: 'isolated',
    }, { suitesRoot });
    assert.deepEqual(updated.suite.missions, [
      'missions/shipMapIframe.mission.js',
      'missions/logout.mission.js',
    ]);
    assert.equal(updated.suite.session, 'isolated');
  } finally {
    await fs.rm(suitesRoot, { recursive: true, force: true });
  }
});

test('MCP server advertises tools and answers a local report request', async () => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createServer();
  const client = new Client({ name: 'testronaut-test', version: '0.1.0' });

  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    const tools = await client.listTools();
    assert.deepEqual(tools.tools.map(tool => tool.name).sort(), [
      'create_mission',
      'create_suite',
      'get_latest_report',
      'list_missions',
      'run_mission',
      'run_suite',
      'update_suite',
      'validate_mission',
    ]);
    assert.ok(tools.tools.every(tool => tool.title.startsWith('🧑‍🚀 ')));
    const result = await client.callTool({ name: 'get_latest_report', arguments: {} });
    assert.equal(result.isError, undefined);
    assert.ok(result.structuredContent.runId || result.structuredContent.message);
  } finally {
    await client.close();
    await server.close();
  }
});
