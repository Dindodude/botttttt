# Kaiju Reincarnated Discord Bot

This is a separate bot package for a brand new **Kaiju Reincarnated** Discord server.

It does not include Death Pit commands or Kaiju Alpha hosting systems.

## Setup

1. Create a Discord bot in the Discord Developer Portal.
2. Enable these privileged intents:
   - Server Members Intent
   - Message Content Intent
3. Invite the bot with these permissions:
   - Administrator is easiest for first setup, or manually grant Manage Roles, Manage Channels, Manage Messages, Kick Members, Ban Members, Moderate Members, View Audit Log, Send Messages, Embed Links.
4. Put your token in your host environment variable:
   - `DISCORD_TOKEN`
5. Start the bot:
   - `npm install`
   - `npm start`

## JustRunMy.App Build

This project includes a `Dockerfile` for JustRunMy.App Git deployments. Make sure your JustRun app has this environment variable set:

```text
DISCORD_TOKEN=your_bot_token
```

The bot is a worker/background app, so it does not need a website port.

If JustRun shows a run command field, use:

```text
node /bot/index.js
```

The Docker image stores code in `/bot` on purpose so an `/app` volume cannot hide updated code. Persistent bot data should use:

```text
/app/data
```

## First Command

Run this in your new Discord server:

```text
!krupdate
```

## Automated JustRunMy.App Git Deploy

If JustRunMy.App gives you a Git deploy URL, you can deploy without uploading ZIP files.

In PowerShell, set the deploy URL for the current terminal:

```powershell
$env:JUSTRUN_GIT_URL="paste-your-justrun-git-url-here"
```

If JustRunMy.App tells you to push to a special deploy ref, set that too:

```powershell
$env:JUSTRUN_GIT_REF="HEAD:paste-deploy-ref-here"
```

Then run:

```powershell
.\deploy-justrun.ps1 -Message "update bot"
```

Do not commit your bot token or JustRun Git token into files. Keep them in environment variables or host secrets.

## Fully Automated GitHub Deploy

The repo includes `.github/workflows/deploy-justrun-docker.yml`.

Use this if JustRun Git deploy is not updating the running bot correctly. This workflow builds the Docker image in GitHub Actions and pushes it to JustRun's Docker registry on every push to `main` or `master`.

Add these GitHub repository secrets:

```text
JUSTRUN_REGISTRY
JUSTRUN_REGISTRY_USER
JUSTRUN_REGISTRY_PASSWORD
JUSTRUN_IMAGE
```

Example values:

```text
JUSTRUN_REGISTRY=jdr-g97dt38x.justrunmy.app
JUSTRUN_IMAGE=jdr-g97dt38x.justrunmy.app/g97dt38x
```

Use your JustRun Docker username/password for the other two secrets.

In JustRun's Docker Push Deployment page, enable:

```text
Automatically deploy after push
```

The workflow pushes this tag:

```text
v1_autodeploy
```

Important: do not mount a volume over `/app`, or any Docker image can still be hidden by old files. Persistent storage should be `/app/data` only.

This creates/checks:

- Kaiju Reincarnated categories
- Public, testing, staff, support, and voice channels
- Safe role permissions
- Welcome, auto role, join logs, start guide
- Suggestions, reviews, tickets, bug reports, XP, events, moderation, analytics, backups, and config commands

## Main Commands

- `!krupdate` - admin setup/update command for the new server
- `!rolesetup` - admin role colors, display-separately, hierarchy, and level reward roles
- `!help` - command guide
- `!suggest [idea]` - submit a suggestion
- `!review` - submit a review
- `!ticketpanel` - admin ticket panel
- `!bugreport` - guided bug report
- `!rank`, `!leaderboard`, `!level` - XP system
- `!event`, `!endevent` - staff event posts
- `!warn`, `!warnings`, `!kick`, `!ban`, `!timeout` - moderation
- `!analytics`, `!serverstats` - stats
- `!backup`, `!restorebackup`, `!configview`, `!configreload`, `!configreset` - config tools

## Auto Roles

New members automatically receive:

- `🎮 Player`
- `📢 Announcement Ping`

The bot checks role hierarchy before assigning roles. Keep the bot role above the roles it manages.

## Level Reward Roles

Run:

```text
!rolesetup
```

This creates and saves these level reward roles:

- `Level 1`
- `Level 5`
- `Level 10`
- `Level 20`

The role IDs are saved in `data/settings.json`, so they keep working after bot restarts and code updates as long as your host keeps the data files.
