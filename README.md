# Freckles for your AI agent

[Freckles](https://frecklescloud.com) keeps every step your AI agent takes as a version with a picture of your app, so you can always go back, and puts your app online when you're ready.

You need a Freckles account ([sign in or ask for an invitation](https://app.frecklescloud.com)) and [Node.js](https://nodejs.org) 22 or newer.

## New to this? Start here

You don't need to know how to code, and you don't need the Terminal.

1. **Get the Claude app** (claude.com, Mac or Windows) and open its **Code** tab.
2. **Make a new empty folder** for your app (Documents → New Folder, named like "My clinic page") and choose it in the Code tab.
3. **Paste this to Claude:** *Please add the Freckles plugin to Claude. Run `claude plugin marketplace add freckles-cloud/freckles` and then `claude plugin install freckles@freckles`. Check that Node.js is installed first: if it isn't, tell me what to install and why, in plain words.* When it asks permission to run a command, click Allow.
4. **Quit the Claude app, open it again**, go back to the Code tab, and say: **Connect to Freckles**. It shows a web link and a short pairing code (not a text message). Open the link, check the code matches, and approve. The first time, Freckles also asks for your mobile number once, to check you're a real person.
5. **Turn on Auto mode** (the mode selector in the row under the message box). Otherwise Claude stops to ask before every small action. Freckles saves a version after every step, so you can always go back.
6. **Say what you want to build.** Something like: *I'm not technical, so please explain things in plain words. I want to build a page where patients of my clinic can book a visit. Before you build anything, ask me a few short questions, then tell me in two sentences what you'll build and wait for my yes. Save every step with Freckles.*

Already have an app on GitHub or on your computer? There is a step-by-step guide on your Freckles page under **Your agent**.

## Connect your agent (the technical way)

### Claude Code

In the Terminal (this also works if you use Claude in the desktop app):

```bash
claude plugin marketplace add freckles-cloud/freckles
claude plugin install freckles@freckles
```

Then start a new Claude Code session. In Claude Code in a terminal you can type `/plugin marketplace add freckles-cloud/freckles` and `/plugin install freckles@freckles` instead.

### Codex

```bash
codex mcp add freckles -- npx -y github:freckles-cloud/freckles
```

### GitHub Copilot in VS Code

[Install in VS Code](https://insiders.vscode.dev/redirect/mcp/install?name=freckles&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22github%3Afreckles-cloud%2Ffreckles%22%5D%7D), or run:

```bash
code --add-mcp '{"name":"freckles","command":"npx","args":["-y","github:freckles-cloud/freckles"]}'
```

Then open Copilot Chat, switch to **Agent** mode, click the tools button and turn on **freckles**. If VS Code asks to start or trust the server, say yes. If it won't start, VS Code can't find Node.js: install it from nodejs.org, then quit and reopen VS Code.

### Cursor

[Add to Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=freckles&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsImdpdGh1YjpmcmVja2xlcy1jbG91ZC9mcmVja2xlcyJdfQ==)

### Any other agent that supports MCP

```json
{ "mcpServers": { "freckles": { "command": "npx", "args": ["-y", "github:freckles-cloud/freckles"] } } }
```

## Then

Ask your agent: "Connect to Freckles". The first time, it shows you a link and a short code: open the link, check the code, and your computer is connected. From then on every finished step appears in [Freckles](https://app.frecklescloud.com) with a picture.

Pictures use Google Chrome or Microsoft Edge if you have one of them installed.

## Updating

Your Freckles page tells you when your agent's plugin is out of date, and your agent hears about it too. To update in Claude Code (this also works for the Claude desktop app), tell it "Update the Freckles plugin", or run:

```bash
claude plugin marketplace update freckles
claude plugin update freckles@freckles
```

Then quit and reopen your agent. With Codex, Copilot or Cursor, restarting the agent is enough; if it still shows the old tools, clear npx's saved copy (`rm -rf ~/.npm/_npx` on a Mac or Linux).

## The status dot on Windows

Ask your agent to "install the Freckles dot". It puts three small dots next to the clock: green when your online apps are answering, amber when one needs a look, red when one isn't answering, grey when this computer isn't connected yet.
