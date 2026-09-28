# Freckles for your AI agent

[Freckles](https://frecklescloud.com) keeps every step your AI agent takes as a version with a picture of your app, so you can always go back, and puts your app online when you're ready.

You need a Freckles account ([sign in or ask for an invitation](https://app.frecklescloud.com)) and [Node.js](https://nodejs.org) 22 or newer.

## Connect your agent

### Claude Code

In Claude Code, type:

```
/plugin marketplace add freckles-cloud/freckles
/plugin install freckles@freckles
```

### Codex

```bash
codex mcp add freckles -- npx -y github:freckles-cloud/freckles
```

### GitHub Copilot in VS Code

[Install in VS Code](https://insiders.vscode.dev/redirect/mcp/install?name=freckles&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22github%3Afreckles-cloud%2Ffreckles%22%5D%7D), or run:

```bash
code --add-mcp '{"name":"freckles","command":"npx","args":["-y","github:freckles-cloud/freckles"]}'
```

### Cursor

[Add to Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=freckles&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsImdpdGh1YjpmcmVja2xlcy1jbG91ZC9mcmVja2xlcyJdfQ==)

### Any other agent that supports MCP

```json
{ "mcpServers": { "freckles": { "command": "npx", "args": ["-y", "github:freckles-cloud/freckles"] } } }
```

## Then

Ask your agent to build something. The first time, it shows you a link and a short code: open the link, check the code, and your computer is connected. From then on every finished step appears in [Freckles](https://app.frecklescloud.com) with a picture.

Pictures use Google Chrome or Microsoft Edge if you have one of them installed.
