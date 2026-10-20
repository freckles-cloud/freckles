// The Freckles mod: shows where the app's versions stand, inside Claude Code.
//
//  - A band above the prompt: the version the app is on, what it says, when it was saved, and whether there is
//    work not yet saved as a version. Only in a folder that Freckles keeps (so it never shows up elsewhere).
//  - A /versions command: the last versions with their number, day and one-line summary, and how to go back.
//
// It reads the app's own history with `git log` and `git status` in the session's folder, and Freckles' local
// record of the app. It sends nothing anywhere, calls no model, and costs nothing. The numbers are the same ones the
// Freckles page and `save_version` show: a version's number is its place in the history.

let app // { name } for a folder Freckles keeps, or false when it isn't one
let snap = { version: 0, summary: "", at: 0, unsaved: 0 }
let known = false

const ago = (ms) => {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000))
  if (s < 90) return "just now"
  const m = Math.round(s / 60)
  if (m < 90) return m + " min ago"
  const h = Math.round(m / 60)
  if (h < 36) return h + " h ago"
  return Math.round(h / 24) + " days ago"
}

const short = (text, max) => (text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text)

/** What the band says. Exported through the module's default for the tests, never called by Claude Code. */
export function bandText(s) {
  if (!s.version) return ""
  const parts = ["Freckles", "v" + s.version]
  if (s.summary) parts.push(short(s.summary, 60))
  if (s.at) parts.push("saved " + ago(s.at))
  parts.push(s.unsaved ? s.unsaved + (s.unsaved === 1 ? " change" : " changes") + " not saved yet" : "everything saved")
  return parts.join(" · ")
}

export function versionsText(lines) {
  if (!lines.length) return "No versions yet."
  const rows = lines.map((l) => {
    const [n, at, summary] = l
    return "v" + n + "  " + ago(at) + "  " + short(summary, 90)
  })
  return rows.join("\n") + "\n\nTo go back to one, ask: “go back to version N”. Nothing is lost."
}

async function git($, args) {
  try {
    const r = await $.process.run(["git", ...args])
    return r.exitCode === 0 ? String(r.stdout).trim() : ""
  } catch {
    return ""
  }
}

/** Is this folder one Freckles keeps? Freckles' record of each app names its folder. */
async function frecklesApp($) {
  try {
    const home = await $.env.get("HOME")
    if (!home) return false
    const dir = home + "/.cloud-for-personal/apps"
    if (!(await $.fs.exists(dir))) return false
    const here = await $.session.cwd()
    for (const entry of await $.fs.list(dir)) {
      if (entry.kind !== "directory") continue
      const file = dir + "/" + entry.name + "/app.json"
      if (!(await $.fs.exists(file))) continue
      try {
        const record = JSON.parse(await $.fs.read(file))
        if (record.path && (here === record.path || here.startsWith(record.path + "/"))) return { name: record.path.split("/").pop() }
      } catch {
        // A record that can't be read isn't this one.
      }
    }
  } catch {
    // Not knowing is the same as not being a Freckles app: the band stays away.
  }
  return false
}

async function refresh($) {
  if (!known) {
    app = await frecklesApp($)
    known = true
  }
  if (!app) return
  const count = await git($, ["rev-list", "--count", "HEAD"])
  const last = await git($, ["log", "-1", "--format=%ct|%s"])
  const dirty = await git($, ["status", "--porcelain"])
  const [ct, ...rest] = last.split("|")
  snap = {
    version: Number(count) || 0,
    summary: rest.join("|"),
    at: ct ? Number(ct) * 1000 : 0,
    unsaved: dirty ? dirty.split("\n").filter(Boolean).length : 0,
  }
  $.ui.invalidate("ui.render")
}

export function register(on) {
  on("session.start", async ($, e, next) => {
    // A new session, or a reloaded mod, starts from nothing.
    app = undefined
    known = false
    snap = { version: 0, summary: "", at: 0, unsaved: 0 }
    // Look now and then keep looking: the band stays true while the agent saves versions.
    await refresh($)
    $.clock.every(30000, () => refresh($))
    try {
      await $.command.register({ name: "versions", description: "Show this app's saved versions", argumentHint: "[how many]" })
    } catch {
      // Another plugin has the name: the band still works.
    }
    return next(e)
  })

  on("turn.complete", async ($, e, next) => {
    await refresh($)
    return next(e)
  })

  on("command.run", { command: "versions" }, async ($, e) => {
    if (known && !app) return { text: "This folder isn't an app Freckles keeps, so there are no versions to show." }
    const n = Math.min(30, Math.max(1, Number(e.args) || 10))
    const out = await git($, ["log", "-n", String(n), "--format=%ct|%s"])
    const total = Number(await git($, ["rev-list", "--count", "HEAD"])) || 0
    const lines = out
      .split("\n")
      .filter(Boolean)
      .map((row, i) => {
        const [ct, ...rest] = row.split("|")
        return [total - i, Number(ct) * 1000, rest.join("|")]
      })
    return { text: versionsText(lines) }
  })

  on("ui.render", { component: "AbovePrompt" }, async ($, e, next) => {
    const text = bandText(snap)
    if (!app || !text) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    // Keep whatever the mods after this one draw in the band, and put the Freckles line first.
    const rest = await next(e)
    return Box({ flexDirection: "column", children: [Text({ dimColor: true, children: [text] }), rest] })
  })
}
