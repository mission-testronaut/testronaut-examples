#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const DEFAULT_MISSION = "missions/login.mission.js";
const DEFAULT_OUTPUT_ROOT = "benchmarks/agent-mode-runs";
const DEFAULT_MODES = ["regular", "friendly", "hostile"];

function parseArgs(argv) {
  const args = {
    trials: 5,
    mission: DEFAULT_MISSION,
    baseUrl: undefined,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    modes: DEFAULT_MODES,
    sequential: false,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--trials" || arg === "-n") {
      args.trials = Number(next);
      index += 1;
    } else if (arg === "--mission") {
      args.mission = next;
      index += 1;
    } else if (arg === "--base-url") {
      args.baseUrl = next;
      index += 1;
    } else if (arg === "--output-root") {
      args.outputRoot = next;
      index += 1;
    } else if (arg === "--modes") {
      args.modes = next.split(",").map((mode) => mode.trim()).filter(Boolean);
      index += 1;
    } else if (arg === "--sequential") {
      args.sequential = true;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isInteger(args.trials) || args.trials < 1) {
    throw new Error("--trials must be a positive integer");
  }

  const unknownModes = args.modes.filter((mode) => !DEFAULT_MODES.includes(mode));
  if (unknownModes.length) {
    throw new Error(`Unknown mode(s): ${unknownModes.join(", ")}`);
  }

  return args;
}

function printHelp() {
  console.log(`
Usage:
  npm run benchmark:agent-modes -- --trials 10

Options:
  --trials, -n <number>     Runs per mode. Default: 5
  --mission <path>          Mission file to run. Default: ${DEFAULT_MISSION}
  --base-url <url>          Base app URL. Default: URL from .env/process env, stripped of mode params
  --modes <list>            Comma list: regular,friendly,hostile
  --sequential              Run all trials for one mode before the next mode
  --output-root <path>      Output folder. Default: ${DEFAULT_OUTPUT_ROOT}
  --dry-run                 Print planned runs without calling Testronaut
`);
}

async function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return {};

  const text = await readFile(filePath, "utf8");
  const values = {};

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }

  return values;
}

function stripModeParams(urlText) {
  const url = new URL(urlText);
  url.searchParams.delete("agentMode");
  url.searchParams.delete("agentHostile");
  url.searchParams.delete("hostileDelayMs");
  return url.toString();
}

function urlForMode(baseUrl, mode) {
  const url = new URL(stripModeParams(baseUrl));
  if (mode === "friendly") url.searchParams.set("agentMode", "true");
  if (mode === "hostile") url.searchParams.set("agentHostile", "true");
  return url.toString();
}

function makeRunPlan(modes, trials, sequential) {
  const plan = [];
  for (let trial = 1; trial <= trials; trial += 1) {
    for (const mode of modes) {
      plan.push({ mode, trial });
    }
  }

  if (sequential) {
    return [...plan].sort((a, b) => modes.indexOf(a.mode) - modes.indexOf(b.mode) || a.trial - b.trial);
  }

  return shuffle(plan);
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

async function readConfig() {
  const configPath = path.join(ROOT, "testronaut-config.json");
  const config = JSON.parse(await readFile(configPath, "utf8"));
  return {
    outputDir: config.outputDir ?? "missions/mission_reports",
    provider: config.provider ?? "",
    model: config.model ?? "",
    maxTurns: config.maxTurns ?? "",
  };
}

async function listReportFiles(outputDir) {
  if (!existsSync(outputDir)) return [];

  const entries = await readdir(outputDir);
  const files = [];

  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    const filePath = path.join(outputDir, entry);
    const fileStat = await stat(filePath);
    files.push({ filePath, mtimeMs: fileStat.mtimeMs });
  }

  return files.sort((a, b) => b.mtimeMs - a.mtimeMs);
}

async function findNewReport(outputDir, beforeFiles, runStartedAtMs) {
  const beforeSet = new Set(beforeFiles.map((file) => file.filePath));
  const afterFiles = await listReportFiles(outputDir);
  const newFiles = afterFiles.filter((file) => !beforeSet.has(file.filePath));
  if (newFiles.length) return newFiles[0].filePath;

  const changedFiles = afterFiles.filter((file) => file.mtimeMs >= runStartedAtMs - 1000);
  return changedFiles[0]?.filePath;
}

function testronautCommand(missionPath) {
  const localBin = path.join(ROOT, "node_modules", ".bin", "testronaut");
  if (existsSync(localBin)) return { command: localBin, args: [missionPath] };
  return { command: "npx", args: ["testronaut", missionPath] };
}

function runCommand({ command, args, env }) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      env,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("close", (exitCode) => resolve(exitCode ?? 1));
    child.on("error", () => resolve(1));
  });
}

function parseDateMs(value) {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : undefined;
}

function extractMetrics(report, reportPath, measuredDurationMs, exitCode, mode, trial, url) {
  const mission = report?.missions?.[0] ?? {};
  const steps = Array.isArray(mission.steps) ? mission.steps : [];
  const finalStep = [...steps].reverse().find((step) => Number.isFinite(Number(step.totalTokensUsed)));
  const totalTokens = Number(finalStep?.totalTokensUsed) || maxNumber(steps.map((step) => step.totalTokensUsed)) || 0;
  const sumStepTokens = sumNumbers(steps.map((step) => step.tokensUsed));
  const startMs = parseDateMs(report?.startTime);
  const endMs = parseDateMs(report?.endTime);
  const reportDurationMs = startMs && endMs ? endMs - startMs : undefined;
  const status = mission.status ?? (report?.summary?.failed > 0 ? "failed" : report?.summary?.passed > 0 ? "passed" : "unknown");
  const retryCount = steps.filter((step) => Number(step.retryAttempt) > 1).length;
  const finalSummary = [...steps].reverse().find((step) => step.summary || step.result)?.summary ?? "";

  return {
    mode,
    trial,
    status,
    exitCode,
    durationMs: reportDurationMs ?? measuredDurationMs,
    measuredDurationMs,
    reportDurationMs: reportDurationMs ?? "",
    totalTokens,
    sumStepTokens,
    turns: steps.length,
    retries: retryCount,
    runId: report?.runId ?? path.basename(reportPath ?? ""),
    reportPath: reportPath ? path.relative(ROOT, reportPath) : "",
    missionName: mission.missionName ?? "",
    url,
    finalSummary,
  };
}

function sumNumbers(values) {
  return values.reduce((sum, value) => {
    const number = Number(value);
    return Number.isFinite(number) ? sum + number : sum;
  }, 0);
}

function maxNumber(values) {
  const numbers = values.map(Number).filter(Number.isFinite);
  return numbers.length ? Math.max(...numbers) : 0;
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows) {
  const headers = [
    "mode",
    "trial",
    "status",
    "exitCode",
    "durationMs",
    "measuredDurationMs",
    "reportDurationMs",
    "totalTokens",
    "sumStepTokens",
    "turns",
    "retries",
    "runId",
    "reportPath",
    "missionName",
    "url",
    "finalSummary",
  ];

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
}

function stats(values) {
  const numbers = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!numbers.length) {
    return { n: 0, mean: "", median: "", p90: "", min: "", max: "", sd: "" };
  }

  const mean = numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
  const variance = numbers.length > 1
    ? numbers.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (numbers.length - 1)
    : 0;

  return {
    n: numbers.length,
    mean,
    median: percentile(numbers, 0.5),
    p90: percentile(numbers, 0.9),
    min: numbers[0],
    max: numbers[numbers.length - 1],
    sd: Math.sqrt(variance),
  };
}

function percentile(sortedNumbers, point) {
  const index = (sortedNumbers.length - 1) * point;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedNumbers[lower];
  return sortedNumbers[lower] + (sortedNumbers[upper] - sortedNumbers[lower]) * (index - lower);
}

function formatNumber(value, digits = 0) {
  if (value === "" || value === undefined || value === null || Number.isNaN(value)) return "";
  return Number(value).toFixed(digits);
}

function summarizeByMode(rows, modes) {
  return modes.map((mode) => {
    const modeRows = rows.filter((row) => row.mode === mode);
    const passed = modeRows.filter((row) => row.status === "passed").length;
    return {
      mode,
      runs: modeRows.length,
      passed,
      failed: modeRows.length - passed,
      successRate: modeRows.length ? passed / modeRows.length : 0,
      duration: stats(modeRows.map((row) => row.durationMs)),
      tokens: stats(modeRows.map((row) => row.totalTokens)),
      turns: stats(modeRows.map((row) => row.turns)),
      retries: stats(modeRows.map((row) => row.retries)),
    };
  });
}

function markdownReport({ rows, modes, config, mission, baseUrl, runDir, startedAt, completedAt, plan }) {
  const summary = summarizeByMode(rows, modes);
  const csvPath = path.relative(ROOT, path.join(runDir, "results.csv"));
  const jsonPath = path.relative(ROOT, path.join(runDir, "results.json"));

  return `# Agent Mode Benchmark Report

Generated: ${completedAt.toISOString()}

## Setup

- Mission: \`${mission}\`
- Base URL: \`${baseUrl}\`
- Provider/model: \`${config.provider}/${config.model}\`
- Max turns: \`${config.maxTurns}\`
- Planned runs: ${plan.length}
- Started: ${startedAt.toISOString()}
- Completed: ${completedAt.toISOString()}
- Raw CSV: \`${csvPath}\`
- Raw JSON: \`${jsonPath}\`

## Summary By Mode

| Mode | Runs | Pass | Fail | Success % | Median Duration ms | Mean Duration ms | P90 Duration ms | Median Tokens | Mean Tokens | P90 Tokens | Median Turns | Median Retries |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${summary.map((item) => `| ${item.mode} | ${item.runs} | ${item.passed} | ${item.failed} | ${formatNumber(item.successRate * 100, 1)} | ${formatNumber(item.duration.median)} | ${formatNumber(item.duration.mean)} | ${formatNumber(item.duration.p90)} | ${formatNumber(item.tokens.median)} | ${formatNumber(item.tokens.mean)} | ${formatNumber(item.tokens.p90)} | ${formatNumber(item.turns.median, 1)} | ${formatNumber(item.retries.median, 1)} |`).join("\n")}

## Run Order

${plan.map((item, index) => `${index + 1}. ${item.mode} trial ${item.trial}`).join("\n")}

## Interpretation Notes

- Prefer medians and p90s over means when runs are noisy.
- Compare success rate before comparing speed or token usage; failed runs can be shorter or longer for the wrong reason.
- Use \`sumStepTokens\` from the CSV as a secondary token metric if \`totalTokens\` looks inconsistent for a particular Testronaut version.
- Repeat with at least 20 to 30 trials per mode before drawing strong conclusions.
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dotEnv = await loadDotEnv(path.join(ROOT, ".env"));
  const config = await readConfig();
  const baseUrl = stripModeParams(args.baseUrl ?? process.env.URL ?? dotEnv.URL ?? "http://localhost:5173/");
  const outputDir = path.resolve(ROOT, config.outputDir);
  const runStamp = new Date().toISOString().replaceAll(":", "-").replace(/\.\d{3}Z$/, "Z");
  const runDir = path.resolve(ROOT, args.outputRoot, runStamp);
  const plan = makeRunPlan(args.modes, args.trials, args.sequential);
  const startedAt = new Date();

  await mkdir(runDir, { recursive: true });
  await writeFile(path.join(runDir, "plan.json"), JSON.stringify({ args, baseUrl, plan, config }, null, 2));

  console.log(`Benchmark output: ${path.relative(ROOT, runDir)}`);
  console.log(`Mission: ${args.mission}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Runs: ${plan.length}`);

  if (args.dryRun) {
    for (const [index, item] of plan.entries()) {
      console.log(`[dry-run ${index + 1}/${plan.length}] ${item.mode} trial ${item.trial}: ${urlForMode(baseUrl, item.mode)}`);
    }
    return;
  }

  const rows = [];
  const command = testronautCommand(args.mission);

  for (const [index, item] of plan.entries()) {
    const url = urlForMode(baseUrl, item.mode);
    console.log(`\n[${index + 1}/${plan.length}] ${item.mode} trial ${item.trial}`);
    console.log(`URL=${url}`);

    const beforeFiles = await listReportFiles(outputDir);
    const runStartedAtMs = Date.now();
    const exitCode = await runCommand({
      command: command.command,
      args: command.args,
      env: {
        ...dotEnv,
        ...process.env,
        URL: url,
        BENCHMARK_MODE: item.mode,
        BENCHMARK_TRIAL: String(item.trial),
      },
    });
    const measuredDurationMs = Date.now() - runStartedAtMs;
    const reportPath = await findNewReport(outputDir, beforeFiles, runStartedAtMs);

    let report = {};
    if (reportPath) {
      report = JSON.parse(await readFile(reportPath, "utf8"));
    }

    const row = extractMetrics(report, reportPath, measuredDurationMs, exitCode, item.mode, item.trial, url);
    rows.push(row);

    await writeFile(path.join(runDir, "results.json"), JSON.stringify(rows, null, 2));
    await writeFile(path.join(runDir, "results.csv"), `${toCsv(rows)}\n`);
    await writeFile(path.join(runDir, "report.md"), markdownReport({
      rows,
      modes: args.modes,
      config,
      mission: args.mission,
      baseUrl,
      runDir,
      startedAt,
      completedAt: new Date(),
      plan,
    }));

    console.log(`status=${row.status} durationMs=${row.durationMs} totalTokens=${row.totalTokens} turns=${row.turns} retries=${row.retries}`);
  }

  const completedAt = new Date();
  const report = markdownReport({
    rows,
    modes: args.modes,
    config,
    mission: args.mission,
    baseUrl,
    runDir,
    startedAt,
    completedAt,
    plan,
  });

  await writeFile(path.join(runDir, "report.md"), report);
  console.log(`\nDone. Report: ${path.relative(ROOT, path.join(runDir, "report.md"))}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
