import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);

// packages/mcp/src/hook.ts
import { basename as basename2 } from "node:path";

// packages/core/src/git.ts
import { execFile } from "node:child_process";
import { promisify } from "node:util";
var run = promisify(execFile);
var GitError = class extends Error {
  args;
  stderr;
  constructor(args, stderr) {
    super(`git ${args.join(" ")} failed: ${stderr.trim()}`);
    this.name = "GitError";
    this.args = args;
    this.stderr = stderr;
  }
};
async function git(cwd, ...args) {
  try {
    const { stdout } = await run("git", args, { cwd, maxBuffer: 64 * 1024 * 1024 });
    return stdout.trimEnd();
  } catch (err) {
    const e = err;
    throw new GitError(args, e.stderr ?? e.message);
  }
}
async function unsaved(cwd) {
  try {
    const out = await git(cwd, "status", "--porcelain");
    return out.split("\n").filter(Boolean).map((line) => line.slice(3).trim()).filter(Boolean);
  } catch {
    return [];
  }
}

// packages/core/src/store.ts
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
var ROOT = process.env.CFP_HOME ?? join(homedir(), ".cloud-for-personal");
function appDir(appId) {
  return join(ROOT, "apps", appId);
}
function sidePath(appId) {
  return join(appDir(appId), "app.json");
}
async function readSide(appId) {
  try {
    return JSON.parse(await readFile(sidePath(appId), "utf8"));
  } catch {
    return void 0;
  }
}
async function listAppIds() {
  try {
    const entries = await readdir(join(ROOT, "apps"), { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

// packages/core/src/versions.ts
var FIELD = "";
var RECORD = "";
var FORMAT = ["%H", "%s", "%b", "%aI", "%an"].join(FIELD) + RECORD;

// packages/mcp/src/cloud.ts
import { chmod, mkdir as mkdir2, mkdtemp, readFile as readFile2, rm, writeFile as writeFile2 } from "node:fs/promises";
import { homedir as homedir2 } from "node:os";
import { basename, dirname, join as join2 } from "node:path";

// packages/publish/src/this-computer.ts
import { exec as exec2, execFile as execFile3 } from "node:child_process";
import { promisify as promisify3 } from "node:util";

// packages/publish/src/resources.ts
var KIND_EXPLAINS = {
  pages: "What people see when they open the link.",
  information: "Anything the app remembers \u2014 bookings, messages, a list people add to.",
  files: "Pictures and documents that people upload through the app.",
  keys: "Passwords the app needs to talk to other services. Never visible to anyone using it.",
  address: "The web address people type to reach it.",
  email: "Lets your app send messages to people."
};

// packages/publish/src/information.ts
import { DatabaseSync } from "node:sqlite";

// packages/publish/src/runtime.ts
var IDLE_MS = 5 * 60 * 1e3;

// packages/publish/src/lay-out.ts
import { exec, execFile as execFile2 } from "node:child_process";
import { promisify as promisify2 } from "node:util";
var run2 = promisify2(exec);
var runFile = promisify2(execFile2);

// packages/publish/src/this-computer.ts
var run3 = promisify3(exec2);
var runFile2 = promisify3(execFile3);

// packages/publish/src/azure-read.ts
import { exec as exec3 } from "node:child_process";
import { promisify as promisify4 } from "node:util";
var run4 = promisify4(exec3);
var KINDS = {
  "microsoft.web/staticsites": { kind: "pages", what: "The pages people see." },
  "microsoft.web/sites": { kind: "pages", what: "The app people reach." },
  "microsoft.communication/emailservices": { kind: "email", what: "Sends email from your app." },
  "microsoft.communication/communicationservices": {
    kind: "email",
    what: "Lets your app send messages."
  },
  "microsoft.dbforpostgresql/flexibleservers": {
    kind: "information",
    what: KIND_EXPLAINS.information
  },
  "microsoft.sql/servers": { kind: "information", what: KIND_EXPLAINS.information },
  "microsoft.documentdb/databaseaccounts": {
    kind: "information",
    what: KIND_EXPLAINS.information
  },
  "microsoft.storage/storageaccounts": { kind: "files", what: KIND_EXPLAINS.files },
  "microsoft.keyvault/vaults": { kind: "keys", what: KIND_EXPLAINS.keys },
  "microsoft.app/containerapps": { kind: "pages", what: "The app people reach." },
  // What an app on Container Apps runs on: part of its pages, never shown as things of their own.
  "microsoft.app/managedenvironments": { kind: "pages", what: "Where the app runs, asleep between visits." },
  "microsoft.containerregistry/registries": { kind: "pages", what: "Keeps each built version of the app, ready to run." },
  "microsoft.operationalinsights/workspaces": { kind: "pages", what: "Keeps the app's logs, for finding problems." },
  "microsoft.managedidentity/userassignedidentities": { kind: "keys", what: "How the app proves who it is to its other parts, with no passwords." },
  "microsoft.app/managedenvironments/managedcertificates": { kind: "address", what: "The certificate that keeps its address private (https)." }
};

// packages/publish/src/plans.ts
var HOURS = 730;
var SWA_STANDARD = 662.62;
var PG_B1MS = 1.47 * HOURS;
var PG_B2S = 5.86 * HOURS;
var PLANS = [
  {
    id: "site",
    name: "Just pages",
    suits: "A site that shows things: a landing page, a menu, a portfolio.",
    tradeoff: "It cannot remember anything. No bookings, no messages, no lists people add to.",
    monthlyMinor: Math.round(SWA_STANDARD),
    currency: "GBP",
    behind: ["Azure Static Web Apps, Standard"]
  },
  {
    id: "small",
    name: "Pages and information",
    suits: "An app that remembers things for a handful of people: bookings, enquiries, a shared list.",
    tradeoff: "It slows down if a lot of people arrive at once. Fine for a few at a time, not for a rush.",
    monthlyMinor: Math.round(SWA_STANDARD + PG_B1MS),
    currency: "GBP",
    behind: ["Azure Static Web Apps, Standard", "PostgreSQL Flexible Server, B1MS"]
  },
  {
    id: "busy",
    name: "Ready for a crowd",
    suits: "An app a lot of people use at the same time, or one holding a great deal of information.",
    tradeoff: "It costs several times more, and most small apps never need it.",
    monthlyMinor: Math.round(SWA_STANDARD + PG_B2S),
    currency: "GBP",
    behind: ["Azure Static Web Apps, Standard", "PostgreSQL Flexible Server, B2S"]
  }
];

// packages/publish/src/budget.ts
import { exec as exec4 } from "node:child_process";
import { promisify as promisify5 } from "node:util";
var run5 = promisify5(exec4);

// packages/publish/src/inventory.ts
import { execFile as execFile4 } from "node:child_process";
import { promisify as promisify6 } from "node:util";
var run6 = promisify6(execFile4);

// packages/mcp/src/cloud.ts
var HOME = process.env.CFP_HOME ?? join2(homedir2(), ".cloud-for-personal");
var CONFIG = join2(HOME, "secrets", "companion.json");
var QUEUE = join2(HOME, "companion-queue.json");
var DEFAULT_URL = "https://app.frecklescloud.com";
var NotConnected = class extends Error {
  constructor() {
    super("This computer isn't connected to Freckles online yet. Call connect_freckles.");
  }
};
async function readConfig() {
  const url = process.env.FRECKLES_URL;
  try {
    const c = JSON.parse(await readFile2(CONFIG, "utf8"));
    return url && url !== c.url ? { url } : c;
  } catch {
    return { url: url ?? DEFAULT_URL };
  }
}
async function api(c, method, path, body) {
  let res;
  try {
    res = await fetch(`${c.url}${path}`, {
      method,
      headers: { "content-type": "application/json", ...c.token ? { authorization: `Bearer ${c.token}` } : {} },
      body: body === void 0 ? void 0 : JSON.stringify(body),
      signal: AbortSignal.timeout(6e4)
    });
  } catch (err) {
    throw new Error(`Freckles online (${c.url}) couldn't be reached: ${err instanceof Error ? err.message : err}`);
  }
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    const e = data;
    if (res.status === 401) throw new NotConnected();
    throw new Error(`${e?.error ?? `Freckles refused (${res.status})`}${e?.detail ? ` [${JSON.stringify(e.detail)}]` : ""}`);
  }
  return data;
}
async function whatsNew(appId) {
  const c = await readConfig();
  if (!c.token) return [];
  return api(c, "GET", `/api/v1/events${appId ? `?app=${appId}` : ""}`);
}
function describeEvents(events) {
  if (!events.length) return "Nothing new from Freckles.";
  return events.map(
    (e) => e.level === "request" ? `REQUEST FROM THE PERSON, queued on the Freckles page (${e.at}): ${e.agent}
  Tell them you've got it and confirm before acting; if it adds cost, say how much first.` : `${e.level === "problem" ? "PROBLEM" : e.level === "attention" ? "Needs attention" : "Note"} (${e.at}): ${e.human}
  Detail for the agent: ${e.agent}`
  ).join("\n");
}

// packages/mcp/src/hook.ts
var mode = process.argv[2];
var input = JSON.parse(await readStdin() || "{}");
async function readStdin() {
  let s = "";
  for await (const chunk of process.stdin) s += chunk;
  return s;
}
async function appHere(cwd) {
  if (!cwd) return void 0;
  for (const id of await listAppIds()) {
    const side = await readSide(id);
    if (side?.path && (cwd === side.path || cwd.startsWith(`${side.path}/`))) return { id, side };
  }
  return void 0;
}
function within(p, ms, fallback) {
  return Promise.race([p.catch(() => fallback), new Promise((r) => setTimeout(() => r(fallback), ms))]);
}
var say = (event, context) => process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: context } }));
try {
  const here = await appHere(input.cwd);
  const appId = here?.side.cloud?.appId;
  if ((mode === "session-start" || mode === "prompt") && appId) {
    const events = await within(whatsNew(appId), 8e3, []);
    if (events.length) {
      say(
        mode === "session-start" ? "SessionStart" : "UserPromptSubmit",
        `Freckles has news${here ? ` about ${basename2(here.side.path)}` : ""} you haven't seen. Tell the person in plain words, and fix what you can:
${describeEvents(events)}`
      );
    }
  } else if (mode === "stop" && here && !input.stop_hook_active) {
    const changed = await unsaved(here.side.path);
    if (changed.length) {
      process.stdout.write(
        JSON.stringify({
          decision: "block",
          reason: `${basename2(here.side.path)} has changes that aren't saved as a version yet (${changed.length} file${changed.length === 1 ? "" : "s"}). If this step is finished and working, save it with save_version and a one-line summary of what the app does differently, in plain words. If it isn't finished, say so to the person and stop.`
        })
      );
    }
  }
} catch {
}
