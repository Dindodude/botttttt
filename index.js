require("dotenv").config();

const fs = require("fs");
const path = require("path");
const {
  ActionRowBuilder,
  AttachmentBuilder,
  ActivityType,
  AuditLogEvent,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  Partials,
  PermissionFlagsBits,
  PermissionsBitField
} = require("discord.js");
const {
  DATA_DIR,
  clearGuildSettings,
  getGuildData,
  getGuildSettings,
  reloadSettings,
  saveGuildData,
  saveGuildSettings
} = require("./storage");

const TOKEN = process.env.DISCORD_TOKEN;
const PREFIX = process.env.PREFIX || "!";
const BRAND = "Kaiju Reincarnated";
const BOT_VERSION = "2026-08-16-donation-leaderboard-only";
const COLOR = "#16a34a";
const ERROR_COLOR = "#ef4444";
const BAN_APPEAL_INVITE = "https://discord.gg/WQ4U3ARjue";
const XP_COOLDOWN = 60 * 1000;
const QUESTION_TIMEOUT = 2 * 60 * 1000;
const STAFF_APP_QUESTION_TIMEOUT = 20 * 60 * 1000;
const BACKUP_DIR = path.join(DATA_DIR, "backups");

const ROLE_NAMES = {
  owner: "👑 Owner",
  developer: "⚡ Developer",
  admin: "🛡️ Administrator",
  mod: "🔨 Moderator",
  trialMod: "📋 Trial Moderator",
  contributor: "🎨 Contributor",
  tester: "🧪 Tester",
  announcement: "📢 Announcement Ping",
  player: "🎮 Player",
  booster: "💎 Booster",
  tempBan: "⛔ Temp Banned"
};

const STAFF_ROLES = [ROLE_NAMES.owner, ROLE_NAMES.admin, ROLE_NAMES.mod, ROLE_NAMES.trialMod, ROLE_NAMES.developer];
const ADMIN_ROLES = [ROLE_NAMES.owner, ROLE_NAMES.admin];
const AUTO_JOIN_ROLES = [ROLE_NAMES.player, ROLE_NAMES.announcement];
const ROLE_ORDER = [
  ROLE_NAMES.owner,
  ROLE_NAMES.developer,
  ROLE_NAMES.admin,
  ROLE_NAMES.mod,
  ROLE_NAMES.trialMod,
  ROLE_NAMES.contributor,
  ROLE_NAMES.tester,
  ROLE_NAMES.booster,
  ROLE_NAMES.announcement,
  ROLE_NAMES.player,
  ROLE_NAMES.tempBan
];
const ROLE_STYLE = {
  [ROLE_NAMES.owner]: { color: "#facc15", hoist: true },
  [ROLE_NAMES.developer]: { color: "#06b6d4", hoist: true },
  [ROLE_NAMES.admin]: { color: "#ef4444", hoist: true },
  [ROLE_NAMES.mod]: { color: "#f97316", hoist: true },
  [ROLE_NAMES.trialMod]: { color: "#f59e0b", hoist: true },
  [ROLE_NAMES.contributor]: { color: "#ec4899", hoist: true },
  [ROLE_NAMES.tester]: { color: "#84cc16", hoist: true },
  [ROLE_NAMES.booster]: { color: "#a855f7", hoist: true },
  [ROLE_NAMES.announcement]: { color: "#374151", hoist: false },
  [ROLE_NAMES.player]: { color: "#9ca3af", hoist: false },
  [ROLE_NAMES.tempBan]: { color: "#111827", hoist: false }
};
const LEVEL_REWARD_ROLES = {
  1: { name: "Level 1", color: "#64748b" },
  5: { name: "Level 5", color: "#22c55e" },
  10: { name: "Level 10", color: "#3b82f6" },
  20: { name: "Level 20", color: "#a855f7" }
};
const DONATION_ROLE_TIERS = [
  { amount: 550, key: "550", label: "Alpha Access", perk: "Access to Alpha KR" },
  { amount: 1000, key: "1000", label: "Supporter", perk: "Supporter role and private supporter leaks" },
  { amount: 3500, key: "3500", label: "Super Fan", perk: "5,000 GCells on release and the Super Fan role" },
  { amount: 10000, key: "10000", label: "Mega Fan", perk: "VIP gamepass, 2,000 GCells, another gamepass, and the Mega Fan role" },
  { amount: 25000, key: "25000", label: "Ultimate Fan", perk: "Special credits, permanent early access, and private-server unreleased kaiju access" },
  { amount: 35000, key: "35000", label: "Ultra Plus Fan", perk: "Three gamepasses, the Ultra Plus Fan role, and a custom server role" },
  { amount: 50000, key: "50000", label: "Supreme Fan", perk: "Five gamepasses and the Supreme Fan role" }
];

const PLAYER_PERMS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.AddReactions,
  PermissionFlagsBits.UseExternalEmojis,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.CreateInstantInvite,
  PermissionFlagsBits.Connect,
  PermissionFlagsBits.Speak,
  PermissionFlagsBits.UseVAD
];

const EVERYONE_PERMS = PLAYER_PERMS.filter((permission) => permission !== PermissionFlagsBits.CreateInstantInvite);
const TRIAL_MOD_PERMS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.ManageMessages,
  PermissionFlagsBits.ModerateMembers
];
const MOD_PERMS = [
  ...TRIAL_MOD_PERMS,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.ViewAuditLog
];
const DEV_PERMS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.ManageMessages,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.ViewAuditLog
];
const TESTER_PERMS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.AddReactions,
  PermissionFlagsBits.CreatePublicThreads,
  PermissionFlagsBits.SendMessagesInThreads
];
const CONTRIBUTOR_PERMS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.AddReactions
];
const DANGEROUS_AUTO_ROLE_PERMS = [
  PermissionFlagsBits.Administrator,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.ManageRoles,
  PermissionFlagsBits.ManageMessages,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.ModerateMembers,
  PermissionFlagsBits.MentionEveryone
];

const STRUCTURE = [
  {
    category: "🌐 INFORMATION",
    channels: ["「👋」welcome", "「📜」rules", "「🚀」start-here", "「📣」announcements"]
  },
  {
    category: "💬 COMMUNITY",
    channels: ["「💬」general", "「🎬」clips-and-media", "「🖼️」fan-art", "「💡」suggestions", "「⭐」reviews", "「🙋」introductions", "「📊」polls"]
  },
  {
    category: "📢 UPDATES",
    channels: ["「📰」game-updates", "「👀」sneak-peeks", "「⚠️」known-bugs", "「🛠️」patch-notes", "「🎉」events"],
    readOnly: ["「📰」game-updates", "「👀」sneak-peeks", "「⚠️」known-bugs", "「🛠️」patch-notes"]
  },
  {
    category: "🧪 TESTING",
    channels: ["「🧪」test-server-info", "「🐛」bug-reports", "「📋」balance-feedback"],
    testerOnly: true
  },
  {
    category: "🎮 GAME",
    channels: ["「🦖」kaiju-discussion", "「📈」stats-and-builds", "「⚔️」battle-discussion"]
  },
  {
    category: "🛡️ STAFF",
    channels: ["「💬」staff-chat", "「📋」logs", "「📨」staff-applications", "「🚩」reports", "「📥」review-submissions", "「📥」suggestion-submissions", "「👥」join-logs", "「💬」message-logs", "「🛡️」mod-logs"],
    staffOnly: true
  },
  {
    category: "🎫 SUPPORT",
    channels: [],
    staffOnly: true
  },
  {
    category: "🎤 VOICE",
    voice: ["「🔊」General VC", "「🎮」Gaming VC", "「🛠️」Staff VC"]
  }
];

const TICKET_TYPES = {
  bug: "Bug Report",
  report: "Player Report",
  support: "Support",
  partnership: "Partnership"
};
const DAY_MS = 24 * 60 * 60 * 1000;
const AUTOMOD_RESET_MS = 14 * DAY_MS;
const AUTOMOD_SPAM_WINDOW_MS = 20 * 1000;
const GIVEAWAY_CHECK_MS = 60 * 1000;
const PUNISHMENT_RULES = {
  drama: { label: "Starting/provoking drama", first: { action: "warn" } },
  harassment: { label: "Harassment", first: { action: "warn" }, repeatTimeoutDays: 3 },
  slurs: { label: "Slurs", first: { action: "warn" }, severe: { action: "timeout", days: 3 } },
  discrimination: { label: "Discrimination", first: { action: "warn" }, severe: { action: "tempban", days: 31 } },
  disrespect: { label: "Disrespectful messages", first: { action: "warn" } },
  spam: { label: "Spam", first: { action: "warn" }, repeatTimeoutDays: 1 },
  advertising: { label: "Advertising", first: { action: "timeout", days: 3 } },
  nsfw: { label: "NSFW content", first: { action: "warn" }, severe: { action: "tempban", days: 31 } },
  gore: { label: "Gore content", first: { action: "warn" } },
  wrongchannel: { label: "Using channels wrongly", first: { action: "warn" } },
  vc: { label: "Voice channel disruption", first: { action: "warn" } },
  moddiscussion: { label: "Discussing moderation outside tickets", first: { action: "remind" } },
  impersonation: { label: "Impersonating staff", first: { action: "tempban", days: 14 } }
};
const STAFF_LOG_MAX_POINTS = 20;
const STAFF_LOG_RULES = [
  { key: "rude", section: "Verbal Warning", label: "Being rude to another person/staff", points: 0.5, action: { action: "warn" }, aliases: ["rude", "disrespect", "being rude"] },
  { key: "weird-message", section: "Verbal Warning", label: "Weird/inappropriate message", points: 1, action: { action: "warn" }, aliases: ["weird", "inappropriate", "gooner", "smash"] },
  { key: "spamming", section: "Verbal Warning", label: "Spamming", points: 0.5, action: { action: "warn" }, aliases: ["spam", "spamming"] },
  { key: "false-ticket", section: "Verbal Warning", label: "False ticket or fake report", points: 1.5, action: { action: "warn" }, aliases: ["false ticket", "fake ticket", "fake report"] },
  { key: "wrong-language", section: "Verbal Warning", label: "Speaking in the wrong language channel", points: 0.5, action: { action: "warn" }, aliases: ["wrong language", "language channel"] },
  { key: "light-nsfw", section: "Verbal Warning", label: "Light NSFW/suggestive content", points: 2, action: { action: "warn" }, aliases: ["light nsfw", "suggestive"] },
  { key: "fake-event", section: "Verbal Warning", label: "Fake event/giveaway", points: 1.5, action: { action: "warn" }, aliases: ["fake event", "fake giveaway", "giveaway"] },
  { key: "ping-everyone", section: "Timeout", label: "Pinged everyone/here", points: 1, action: { action: "timeout", minutes: 30 }, aliases: ["ping everyone", "ping here", "everyone"] },
  { key: "advertisement", section: "Timeout", label: "Advertisement", points: 1.5, action: { action: "timeout", hours: 2 }, aliases: ["advertise", "advertisement", "advertising", "ad"] },
  { key: "dev-info", section: "Timeout", label: "Asking developers for update information", points: 1.5, action: { action: "timeout", hours: 4 }, aliases: ["dev info", "update info", "asking devs", "requirements"] },
  { key: "bypassing-slurs", section: "Timeout", label: "Bypassing slurs", points: 3, action: { action: "timeout", hours: 5 }, aliases: ["bypass slur", "bypassing slurs", "hitler", "nword", "n-word"] },
  { key: "mild-nsfw", section: "Timeout", label: "Mild NSFW/gore/sexual content", points: 3, action: { action: "timeout", hours: 4 }, aliases: ["mild nsfw", "gore", "sexual content"] },
  { key: "ping-staff", section: "Timeout", label: "Pinging staff roles", points: 5, action: { action: "timeout", hours: 6 }, aliases: ["ping staff", "staff role", "founder", "manager", "admin role"] },
  { key: "ping-limited", section: "Timeout", label: "Pinging limited roles", points: 4, action: { action: "timeout", hours: 5 }, aliases: ["ping limited", "limited roles", "swan", "duck", "geese"] },
  { key: "ping-youtuber", section: "Timeout", label: "Pinging YouTubers", points: 3, action: { action: "timeout", hours: 4 }, aliases: ["ping youtuber", "youtuber", "creator ping"] },
  { key: "politics", section: "Timeout", label: "Politics", points: 6, action: { action: "timeout", days: 7 }, aliases: ["politics"] },
  { key: "hard-nsfw", section: "Ban", label: "Hard NSFW, hard gore, scary/bloody content", points: 10, action: { action: "ban" }, aliases: ["hard nsfw", "hard gore", "blood", "nudity"] },
  { key: "politics-v2", section: "Ban", label: "Extreme politics or hateful event discussion", points: 15, action: { action: "ban" }, aliases: ["politics v2", "9/11", "jew related", "bad events"] },
  { key: "scam-links", section: "Ban", label: "Scam/phishing links", points: 20, action: { action: "ban" }, aliases: ["scam", "phishing", "scam links", "free nitro"] },
  { key: "slurs", section: "Ban", label: "Slurs toward gender/race/etc.", points: 20, action: { action: "ban" }, aliases: ["slur", "slurs", "n word", "n-word", "faggot"] },
  { key: "suicidal-joking", section: "Timeout", label: "Suicidal comment, joking/context unclear", points: 6, action: { action: "timeout", days: 7 }, aliases: ["kys joke", "suicidal joke", "kill yourself joke"] },
  { key: "suicidal-serious", section: "Ban", label: "Serious suicidal comment toward someone", points: 20, action: { action: "ban" }, aliases: ["kys", "kill yourself", "suicidal serious"] }
];
const AUTOMOD_RULES = {
  invite: { label: "Discord invite link", delete: true, action: { action: "warn" } },
  blockedterm: { label: "Severe blocked slur", delete: true, action: { action: "timeout", days: 3 } },
  custombadword: { label: "Configured blocked word", delete: true, action: { action: "warn" } }
};
const BLOCKED_TERM_PATTERNS = [
  /\bf[\W_]*a[\W_]*g(?:[\W_]*g[\W_]*o[\W_]*t)?s?\b/i,
  /\bn[\W_]*i[\W_]*g[\W_]*g[\W_]*(?:a|e[\W_]*r)s?\b/i,
  /\bn[\W_]*i[\W_]*g[\W_]*g[\W_]*a[\W_]*w[\W_]*h[\W_]*o[\W_]*l[\W_]*e\b/i,
  /\bf[\W_]*o[\W_]*i[\W_]*d[\W_]*s?\b/i,
  /\bm[\W_]*o[\W_]*i[\W_]*d[\W_]*s?\b/i,
  /\br[\W_]*e[\W_]*t[\W_]*a[\W_]*r[\W_]*d(?:[\W_]*e[\W_]*d)?s?\b/i,
  /\bp[\W_]*o[\W_]*r[\W_]*c[\W_]*h[\W_-]*m[\W_]*o[\W_]*n[\W_]*k[\W_]*e[\W_]*y[\W_]*s?\b/i,
  /\bc[\W_]*u[\W_]*n[\W_]*t[\W_]*s?\b/i,
  /\bk[\W_]*(?:y[\W_]*)?k[\W_]*e[\W_]*s?\b/i,
  /\bj[\W_]*i[\W_]*g[\W_]*a[\W_]*b[\W_]*o[\W_]*o[\W_]*s?\b/i,
  /\bc[\W_]*o[\W_]*o[\W_]*n[\W_]*s?\b/i
];
const DISCORD_INVITE_PATTERN = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[a-z0-9-]+/i;
const URL_PATTERN = /https?:\/\/\S+/gi;
const MEDIA_URL_PATTERN = /(tenor\.com|giphy\.com|media\.discordapp\.net|cdn\.discordapp\.com|discordapp\.(net|com)\/attachments)/i;
const PLAYER_COMMAND_CHANNEL = "bot-commands";
const recentBotModerationActions = new Map();
const activeStaffApplications = new Set();
const activeDonationConfigurations = new Set();
const ADMIN_COMMANDS = new Set(["krupdate", "newplayersetup", "rolesetup", "autorole", "automod", "badword", "commandconfigure", "logconfigure", "botconfig", "start", "starthere", "ticketpanel", "ccpanel", "ccconfig", "staffapp", "analytics", "backup", "restorebackup", "configreset", "reactionroles", "donation", "donationremove"]);
const STAFF_COMMANDS = new Set(["staffcommands", "event", "endevent", "gcreate", "staffstats", "claimticket", "add", "addinticket", "remove", "removefromticket", "ccapprove", "ccdeny", "warn", "unwarn", "warnings", "punish", "log", "cases", "case", "removecase", "punishments", "tempban", "untempban", "kick", "ban", "unban", "timeout", "untimeout", "purge", "clear"]);
const STAFF_APP_QUESTIONS = [
  "What is your Discord username and ID?",
  "What is your age?",
  "What is your timezone?",
  "How often will you be able to take tickets and moderate the channels?",
  "How much active are you on a scale from 1 to 10?",
  "Do you have any prior experience of being staff? If yes, list them. If not, put N/A.",
  "Why would you like to become a moderator for Kaiju Reincarnated? Please list a detailed response.",
  "If two members were arguing in public channels, how would you handle the situation?",
  "What would you do if someone breaks the rules, but they are your friends?",
  "What would you do if you caught another mod abusing their powers?",
  "What would you do if a member DMs you to report another member?"
];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember, Partials.Reaction, Partials.User]
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Bot version: ${BOT_VERSION}`);
  console.log(`Data directory: ${DATA_DIR}`);
  rotateStatus();
  checkExpiredTempBans();
  checkGiveaways();
  refreshDonationLeaderboards().catch((error) => console.error("Donation leaderboard startup refresh failed:", error));
  setInterval(checkExpiredTempBans, 60 * 1000).unref();
  setInterval(checkGiveaways, GIVEAWAY_CHECK_MS).unref();
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  trackMessage(message);

  const settings = getGuildSettings(message.guild.id) || {};
  const prefix = settings.prefix || PREFIX;
  const content = message.content.trim();
  if (!content.startsWith(prefix)) {
    await handleAutoMod(message, settings).catch((error) => {
      console.error("AutoMod error:", error);
      logTo(message.guild, "mod-logs", "AutoMod Error", [
        field("User", `${message.author.tag} (${message.author.id})`),
        field("Channel", `${message.channel}`),
        field("Error", error.message)
      ]);
    });
    return;
  }

  const args = content.slice(prefix.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();
  if (!command) return;
  if (!isAllowedCommandUse(message, command, args, settings)) {
    await handleAutoMod(message, settings).catch(() => {});
    return;
  }

  try {
    if (command === "ping") return handlePing(message);
    if (command === "version") return handleVersion(message);
    if (command === "commands" || command === "command") return handleCommands(message);
    if (command === "staffcommands" || command === "staffcommand") return handleStaffCommands(message);
    if (command === "krupdate" || command === "newplayersetup") return handleKrUpdate(message);
    if (command === "rolesetup") return handleRoleSetup(message);
    if (command === "autorole") return handleAutoRole(message, args);
    if (command === "automod") return handleAutoModCommand(message, args);
    if (command === "badword") return handleBadWordCommand(message, args);
    if (command === "commandconfigure") return handleCommandConfigure(message, args);
    if (command === "logconfigure") return handleLogConfigure(message, args);
    if (command === "botconfig") return handleBotConfig(message, args);
    if (command === "reactionroles") return handleReactionRoles(message);
    if ((command === "start" && args[0]?.toLowerCase() === "here") || command === "starthere") return handleStartHereCommand(message);
    if (command === "rules") return handleRules(message);
    if (command === "help") return handleHelp(message);
    if (command === "suggest") return handleSuggest(message, args);
    if (command === "review") return handleReview(message);
    if (command === "ticketpanel") return handleTicketPanel(message);
    if (command === "ccpanel") return handleCcPanel(message);
    if (command === "ccconfig") return handleCcConfig(message, args);
    if (command === "ccapprove") return handleCcApprove(message, args);
    if (command === "ccdeny") return handleCcDeny(message, args);
    if (command === "staffapp") return handleStaffAppSetup(message);
    if (command === "bugreport") return handleBugReport(message);
    if (command === "event") return handleEvent(message);
    if (command === "endevent") return handleEndEvent(message);
    if (command === "gcreate") return handleGiveawayCreate(message);
    if (command === "rank" || command === "level") return handleRank(message);
    if (command === "leaderboard") return handleLeaderboard(message, args);
    if (command === "donation") return handleDonation(message, args);
    if (command === "donationremove") return handleDonationRemove(message, args);
    if (command === "analytics") return handleAnalytics(message);
    if (command === "serverstats") return handleServerStats(message);
    if (command === "staffstats") return handleStaffStats(message, args);
    if (command === "claimticket") return handleClaimTicket(message);
    if (command === "add" || command === "addinticket") return handleTicketAdd(message);
    if (command === "remove" || command === "removefromticket") return handleTicketRemove(message);
    if (command === "warn") return handleWarn(message, args);
    if (command === "unwarn") return handleUnwarn(message, args);
    if (command === "warnings") return handleWarnings(message);
    if (command === "punish") return handlePunish(message, args);
    if (command === "log") return handleStaffLog(message);
    if (command === "cases" || command === "case" || command === "punishments") return handleCases(message);
    if (command === "removecase") return handleRemoveCase(message, args);
    if (command === "tempban") return handleManualTempBan(message, args);
    if (command === "untempban") return handleUnTempBan(message, args);
    if (command === "kick") return handleKick(message, args);
    if (command === "ban") return handleBan(message, args);
    if (command === "unban") return handleUnban(message, args);
    if (command === "timeout") return handleTimeout(message, args);
    if (command === "untimeout") return handleUntimeout(message, args);
    if (command === "purge" || command === "clear") return handlePurge(message, args);
    if (command === "backup") return handleBackup(message);
    if (command === "restorebackup") return handleRestoreBackup(message, args);
    if (command === "configview") return handleConfigView(message);
    if (command === "configreload") return handleConfigReload(message);
    if (command === "configreset") return handleConfigReset(message);
    return message.reply(`I saw \`${prefix}${command}\`, but that command does not exist. Try \`${prefix}commands\`.`);
  } catch (error) {
    console.error(error);
    await message.reply("Something went wrong. Check the bot console/logs.");
  }

});

client.on("guildMemberAdd", async (member) => {
  const settings = getGuildSettings(member.guild.id) || {};
  const data = getGuildData(member.guild.id);
  data.analytics.joins += 1;
  saveGuildData(member.guild.id, data);

  await sendJoinLog(member, "Member Joined");
  if (settings.autoRoleEnabled !== false) await assignJoinRoles(member, settings);
  else await logTo(member.guild, "join-logs", "Auto Role Skipped", [field("User", `${member}`), field("Reason", "Auto role is disabled.")]);
  const donationTotal = Number(data.donations?.[member.id]?.total || 0);
  if (donationTotal > 0) await syncDonationRoles(member.guild, member.id, donationTotal, settings).catch((error) => {
    console.error("Donation role join sync failed:", error);
  });
  await sendWelcome(member);
  await sendNewMemberDm(member);
});

client.on("guildMemberRemove", async (member) => {
  const data = getGuildData(member.guild.id);
  data.analytics.leaves += 1;
  saveGuildData(member.guild.id, data);
  await sendJoinLog(member, "Member Left");

  if (consumeBotModerationAction(member.guild.id, "kick", member.id)) return;

  const kickLog = await fetchRecentAuditEntry(member.guild, AuditLogEvent.MemberKick, member.id);
  if (kickLog && kickLog.executor?.id !== client.user.id) {
    await logExternalModeration(member.guild, "Kick", member.user, kickLog.executor, kickLog.reason || "No reason provided");
  }
});

client.on("guildBanAdd", async (ban) => {
  if (consumeBotModerationAction(ban.guild.id, "ban", ban.user.id)) return;
  const banLog = await fetchRecentAuditEntry(ban.guild, AuditLogEvent.MemberBanAdd, ban.user.id);
  if (banLog?.executor?.id === client.user.id) return;
  await logExternalModeration(ban.guild, "Ban", ban.user, banLog?.executor, banLog?.reason || ban.reason || "No reason provided");
});

client.on("messageDelete", async (message) => {
  if (!message.guild || message.author?.bot) return;
  await logDeletedMessage(message);
});

client.on("messageUpdate", async (oldMessage, newMessage) => {
  if (!newMessage.guild || newMessage.author?.bot || oldMessage.content === newMessage.content) return;
  await logTo(newMessage.guild, "message-logs", "Message Edited", [
    field("User", `${newMessage.author.tag}`),
    field("Channel", `${newMessage.channel}`),
    field("Before", (oldMessage.content || "Unknown").slice(0, 800)),
    field("After", (newMessage.content || "Unknown").slice(0, 800))
  ]);
});

client.on("guildMemberUpdate", async (oldMember, newMember) => {
  if (oldMember.nickname !== newMember.nickname) {
    await logTo(newMember.guild, "mod-logs", "Nickname Changed", [
      field("User", `${newMember.user.tag}`),
      field("Before", oldMember.nickname || oldMember.user.username, true),
      field("After", newMember.nickname || newMember.user.username, true)
    ]);
  }

  if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
    await logTo(newMember.guild, "mod-logs", "Roles Changed", [
      field("User", `${newMember.user.tag}`),
      field("Roles", newMember.roles.cache.filter((role) => role.id !== newMember.guild.id).map((role) => role.name).join(", ").slice(0, 1000) || "None")
    ]);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  try {
    if (interaction.customId === "cc:apply") return handleCcApply(interaction);
    if (interaction.customId.startsWith("ticket:")) return handleTicketButton(interaction);
    if (interaction.customId.startsWith("ticketclose:")) return closeTicket(interaction);
    if (interaction.customId.startsWith("ticketdelete:")) return deleteTicket(interaction);
    if (interaction.customId.startsWith("tickettranscript:")) return handleTicketTranscript(interaction);
    if (interaction.customId.startsWith("rr:")) return handleReactionRoleButton(interaction);
    if (interaction.customId.startsWith("staffapp:start:")) return handleStaffAppStart(interaction);
    if (interaction.customId.startsWith("staffappreview:")) return handleStaffAppReview(interaction);
    if (interaction.customId.startsWith("stafflogvote:")) return handleStaffLogVote(interaction);
    if (interaction.customId.startsWith("giveaway:enter:")) return handleGiveawayEnter(interaction);
    if (interaction.customId.startsWith("guide:")) return handleGuideButton(interaction);
  } catch (error) {
    console.error(error);
    const reply = { content: "That button hit an error. Please tell staff.", ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(reply).catch(() => {});
    else await interaction.reply(reply).catch(() => {});
  }
});

function isAdmin(member) {
  return member.permissions.has(PermissionsBitField.Flags.Administrator)
    || ADMIN_ROLES.some((name) => member.roles.cache.some((role) => role.name === name));
}

function isOwner(member) {
  return member.guild.ownerId === member.id || member.roles.cache.some((role) => role.name === ROLE_NAMES.owner);
}

function isStaff(member) {
  return isAdmin(member) || STAFF_ROLES.some((name) => member.roles.cache.some((role) => role.name === name));
}

function isModerator(member) {
  return isAdmin(member) || member.roles.cache.some((role) => role.name === ROLE_NAMES.mod)
    || member.permissions.has(PermissionsBitField.Flags.KickMembers)
    || member.permissions.has(PermissionsBitField.Flags.BanMembers);
}

function isTrialModerator(member) {
  return isStaff(member) || member.permissions.has(PermissionsBitField.Flags.ModerateMembers);
}

function canWarn(member) {
  return isTrialModerator(member);
}

function canTimeout(member) {
  return isTrialModerator(member) && member.permissions.has(PermissionsBitField.Flags.ModerateMembers);
}

function canManageWarnings(member) {
  return isModerator(member);
}

function canKick(member) {
  return isModerator(member) && member.permissions.has(PermissionsBitField.Flags.KickMembers);
}

function canBan(member) {
  return isModerator(member) && member.permissions.has(PermissionsBitField.Flags.BanMembers);
}

function canPurge(member) {
  return isModerator(member) && member.permissions.has(PermissionsBitField.Flags.ManageMessages);
}

function canUseCcReview(member) {
  if (isAdmin(member)) return true;
  const settings = getGuildSettings(member.guild.id) || {};
  const reviewerRoleIds = Array.isArray(settings.ccReviewerRoleIds) ? settings.ccReviewerRoleIds : [];
  return reviewerRoleIds.some((roleId) => member.roles.cache.has(roleId));
}

function canManageTicket(member, channel) {
  if (!member || !channel?.guild) return false;
  if (isStaff(member)) return true;

  const meta = getTicketMetaForChannel(channel.guild.id, channel.id);
  if (!meta) return false;

  // CC ticket viewer roles are explicitly granted Manage Messages. Checking
  // effective channel permissions also supports custom roles added by admins.
  return typeof member.permissionsIn === "function"
    && member.permissionsIn(channel).has(PermissionFlagsBits.ManageMessages);
}

function markBotModerationAction(guildId, action, userId) {
  recentBotModerationActions.set(`${guildId}:${action}:${userId}`, Date.now());
}

function consumeBotModerationAction(guildId, action, userId) {
  const key = `${guildId}:${action}:${userId}`;
  const at = recentBotModerationActions.get(key);
  recentBotModerationActions.delete(key);
  return Number.isFinite(at) && Date.now() - at < 60 * 1000;
}

function canModerateTarget(actor, target, action = "moderate") {
  if (!target) return { ok: true };
  if (target.id === actor.id) return { ok: false, reason: `You cannot ${action} yourself.` };
  if (target.id === actor.guild.ownerId) return { ok: false, reason: `You cannot ${action} the server owner.` };
  if (actor.guild.members.me && target.id === actor.guild.members.me.id) return { ok: false, reason: `I cannot ${action} myself.` };

  if (actor.id !== actor.guild.ownerId && target.roles.highest.comparePositionTo(actor.roles.highest) >= 0) {
    return { ok: false, reason: `You cannot ${action} someone with an equal or higher role.` };
  }

  const botMember = actor.guild.members.me;
  if (!botMember || target.roles.highest.comparePositionTo(botMember.roles.highest) >= 0) {
    return { ok: false, reason: `I cannot ${action} someone with an equal or higher role than my bot role.` };
  }

  return { ok: true };
}

function isBotCommandChannel(channel) {
  return stripStyle(channel.name) === PLAYER_COMMAND_CHANNEL;
}

function isAllowedCommandUse(message, command, args, settings = {}) {
  const commandKey = command === "start" && args[0]?.toLowerCase() === "here" ? "start" : command;
  const adminOnly = ADMIN_COMMANDS.has(commandKey);
  const staffOnly = STAFF_COMMANDS.has(commandKey);

  if (adminOnly) return isAdmin(message.member);
  if (staffOnly) {
    // Let recognized staff reach the command handler so it can explain the
    // exact missing permission. Normal members still receive no command reply.
    if (isStaff(message.member)) return true;
    return canUseStaffCommand(message.member, commandKey, message.channel);
  }
  if (isStaff(message.member)) return true;

  const allowedChannelId = settings.botCommandsChannelId;
  if (allowedChannelId && message.channel.id === allowedChannelId) return true;
  return isBotCommandChannel(message.channel);
}

function canUseStaffCommand(member, command, channel = null) {
  if (["ccapprove", "ccdeny"].includes(command)) return canUseCcReview(member);
  if (["claimticket", "add", "addinticket", "remove", "removefromticket"].includes(command)) {
    return canManageTicket(member, channel);
  }
  if (!isStaff(member)) return false;

  if (["staffcommands", "staffstats", "claimticket", "add", "addinticket", "remove", "removefromticket", "warnings", "cases", "case", "punishments"].includes(command)) return true;
  if (["warn", "punish", "log"].includes(command)) return canWarn(member);
  if (["timeout", "untimeout"].includes(command)) return canTimeout(member);
  if (["unwarn", "removecase"].includes(command)) return canManageWarnings(member);
  if (["purge", "clear"].includes(command)) return canPurge(member);
  if (["kick"].includes(command)) return canKick(member);
  if (["ban", "unban", "tempban", "untempban"].includes(command)) return canBan(member);
  if (["event", "endevent", "gcreate"].includes(command)) return isModerator(member);

  return isModerator(member);
}

function findRole(guild, name) {
  return guild.roles.cache.find((role) => role.name === name) || null;
}

function stripStyle(name) {
  return name.replace(/^「[^」]+」/, "").toLowerCase();
}

function findChannel(guild, plainName) {
  return guild.channels.cache.find((channel) => stripStyle(channel.name) === plainName.toLowerCase()) || null;
}

function field(name, value, inline = false) {
  return { name, value: String(value || "None"), inline };
}

function baseEmbed(title, color = COLOR) {
  return new EmbedBuilder().setTitle(title).setColor(color).setTimestamp();
}

function rolePermissions(roleName) {
  if (roleName === ROLE_NAMES.owner || roleName === ROLE_NAMES.admin) return [PermissionFlagsBits.Administrator];
  if (roleName === ROLE_NAMES.mod) return MOD_PERMS;
  if (roleName === ROLE_NAMES.trialMod) return TRIAL_MOD_PERMS;
  if (roleName === ROLE_NAMES.developer) return DEV_PERMS;
  if (roleName === ROLE_NAMES.tester) return TESTER_PERMS;
  if (roleName === ROLE_NAMES.contributor) return CONTRIBUTOR_PERMS;
  if (roleName === ROLE_NAMES.announcement) return [];
  if (roleName === ROLE_NAMES.tempBan) return [];
  return PLAYER_PERMS;
}

function publicOverwrites(guild) {
  const player = findRole(guild, ROLE_NAMES.player);
  const overwrites = [
    { id: guild.roles.everyone.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.MentionEveryone] }
  ];

  if (player) {
    overwrites.push({
      id: player.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AddReactions,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.UseExternalEmojis,
        PermissionFlagsBits.CreatePublicThreads
      ],
      deny: [PermissionFlagsBits.MentionEveryone]
    });
  }

  overwrites.push(botFullOverwrite(guild));
  return overwrites;
}

function readOnlyOverwrites(guild) {
  const player = findRole(guild, ROLE_NAMES.player);
  const overwrites = [
    { id: guild.roles.everyone.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.CreatePublicThreads, PermissionFlagsBits.MentionEveryone] }
  ];

  if (player) {
    overwrites.push({
      id: player.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions],
      deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.CreatePublicThreads, PermissionFlagsBits.MentionEveryone]
    });
  }

  for (const role of getStaffRoleObjects(guild)) {
    overwrites.push({
      id: role.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages],
      deny: []
    });
  }

  overwrites.push(botFullOverwrite(guild));
  return overwrites;
}

function commandOnlyOverwrites(guild) {
  const player = findRole(guild, ROLE_NAMES.player);
  const overwrites = [
    { id: guild.roles.everyone.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions], deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.CreatePublicThreads, PermissionFlagsBits.MentionEveryone] }
  ];

  if (player) {
    overwrites.push({
      id: player.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions],
      deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.CreatePublicThreads, PermissionFlagsBits.MentionEveryone]
    });
  }

  for (const role of getStaffRoleObjects(guild)) {
    overwrites.push({
      id: role.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages],
      deny: []
    });
  }

  overwrites.push(botFullOverwrite(guild));
  return overwrites;
}

function pollsOverwrites(guild) {
  return commandOnlyOverwrites(guild);
}

function gameOverwrites(guild) {
  return publicOverwrites(guild);
}

function voiceOverwrites(guild) {
  const player = findRole(guild, ROLE_NAMES.player);
  const overwrites = [
    { id: guild.roles.everyone.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.MentionEveryone] }
  ];

  if (player) {
    overwrites.push({
      id: player.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.Stream, PermissionFlagsBits.UseVAD],
      deny: [PermissionFlagsBits.MentionEveryone]
    });
  }

  overwrites.push(botFullOverwrite(guild));
  return overwrites;
}

function staffVoiceOverwrites(guild) {
  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] }
  ];

  for (const role of getStaffRoleObjects(guild)) {
    overwrites.push({
      id: role.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.Stream, PermissionFlagsBits.UseVAD],
      deny: [PermissionFlagsBits.MentionEveryone]
    });
  }

  overwrites.push(botFullOverwrite(guild));
  return overwrites;
}

function botFullOverwrite(guild) {
  return {
    id: guild.members.me.id,
    allow: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.AddReactions,
      PermissionFlagsBits.Connect,
      PermissionFlagsBits.Speak,
      PermissionFlagsBits.Stream,
      PermissionFlagsBits.UseVAD
    ]
  };
}

function getStaffRoleObjects(guild) {
  return STAFF_ROLES.map((name) => findRole(guild, name)).filter(Boolean);
}

function oldPublicOverwrites(guild) {
  return [
    { id: guild.roles.everyone.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.MentionEveryone] },
    { id: guild.members.me.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ManageMessages] }
  ];
}

function staffOverwrites(guild) {
  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.MentionEveryone] },
    botFullOverwrite(guild)
  ];

  const viewOnly = [ROLE_NAMES.trialMod];
  const fullStaff = [ROLE_NAMES.owner, ROLE_NAMES.developer, ROLE_NAMES.admin, ROLE_NAMES.mod];

  for (const name of viewOnly) {
    const role = findRole(guild, name);
    if (role) {
      overwrites.push({
        id: role.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
        deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.MentionEveryone]
      });
    }
  }

  for (const name of fullStaff) {
    const role = findRole(guild, name);
    if (role) {
      overwrites.push({
        id: role.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages],
        deny: [PermissionFlagsBits.MentionEveryone]
      });
    }
  }

  return overwrites;
}

function testerOverwrites(guild) {
  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.MentionEveryone] }
  ];

  const player = findRole(guild, ROLE_NAMES.player);
  if (player) {
    overwrites.push({
      id: player.id,
      deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.MentionEveryone]
    });
  }

  for (const name of [...STAFF_ROLES, ROLE_NAMES.tester, ROLE_NAMES.developer]) {
    const role = findRole(guild, name);
    if (role) {
      overwrites.push({
        id: role.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.CreatePublicThreads,
          PermissionFlagsBits.SendMessagesInThreads
        ],
        deny: [PermissionFlagsBits.MentionEveryone]
      });
    }
  }

  overwrites.push(botFullOverwrite(guild));
  return overwrites;
}

async function handleKrUpdate(message) {
  if (!isAdmin(message.member)) return message.reply("Only admins can use `!krupdate`.");

  const summary = { created: [], skipped: [], permissions: [], errors: [] };
  await message.guild.roles.fetch();
  await applyRoleSetup(message.guild, summary);
  await applyStructure(message.guild, summary);
  await postStartGuide(message.guild, summary);
  await postRulesEmbed(message.guild, summary);

  const settings = getGuildSettings(message.guild.id) || {};
  const welcome = findChannel(message.guild, "welcome");
  const logs = findChannel(message.guild, "logs");
  const joinLogs = findChannel(message.guild, "join-logs");
  const botCommands = findChannel(message.guild, "bot-commands");
  const player = findRole(message.guild, ROLE_NAMES.player);
  const announcement = findRole(message.guild, ROLE_NAMES.announcement);

  saveGuildSettings(message.guild.id, {
    ...settings,
    prefix: settings.prefix || PREFIX,
    welcomeChannelId: welcome?.id || null,
    logsChannelId: logs?.id || null,
    joinLogsChannelId: joinLogs?.id || null,
    botCommandsChannelId: botCommands?.id || null,
    autoRoleId: player?.id || null,
    announcementRoleId: announcement?.id || null,
    autoRoleIds: [player?.id, announcement?.id].filter(Boolean),
    autoRoleEnabled: true,
    autoWelcomeEnabled: true,
    gameName: BRAND
  });

  await message.reply({
    embeds: [
      baseEmbed("Kaiju Reincarnated Update Complete")
        .setDescription("Created/checked the new server systems only. Existing channels and custom overwrites were preserved when possible.")
        .addFields(
          field("Created", list(summary.created)),
          field("Skipped", list(summary.skipped)),
          field("Permissions", list(summary.permissions)),
          field("Errors", list(summary.errors))
        )
    ]
  });
}

async function handleRoleSetup(message) {
  if (!isAdmin(message.member)) return message.reply("Only admins can use `!rolesetup`.");

  const summary = { created: [], skipped: [], permissions: [], errors: [] };
  await message.guild.roles.fetch();
  await applyRoleSetup(message.guild, summary);
  const levelRewardRoles = await ensureLevelRewardRoles(message.guild, summary);

  const settings = getGuildSettings(message.guild.id) || {};
  saveGuildSettings(message.guild.id, {
    ...settings,
    levelRewardRoles,
    roleSetupEnabled: true
  });

  await message.reply({
    embeds: [
      baseEmbed("Role Setup Complete")
        .setDescription("Role colors, display-separately settings, hierarchy, and level reward roles were updated. Level role IDs were saved to persistent config.")
        .addFields(
          field("Created", list(summary.created)),
          field("Skipped", list(summary.skipped)),
          field("Updated", list(summary.permissions)),
          field("Level rewards", Object.entries(levelRewardRoles).map(([level, roleId]) => `Level ${level}: <@&${roleId}>`).join("\n") || "None"),
          field("Errors", list(summary.errors))
        )
    ]
  });
}

async function handleAutoRole(message, args) {
  if (!isAdmin(message.member)) return message.reply("Only admins can use `!autorole`.");

  const settings = getGuildSettings(message.guild.id) || {};
  const action = (args.shift() || "status").toLowerCase();

  if (action === "status") {
    const roleIds = getConfiguredAutoRoleIds(message.guild, settings);
    return message.reply({
      embeds: [
        baseEmbed("Auto Role Settings")
          .addFields(
            field("Status", settings.autoRoleEnabled === false ? "Disabled" : "Enabled", true),
            field("Join Roles", roleIds.length ? roleIds.map((id) => `<@&${id}>`).join(", ") : "None"),
            field("Commands", "`!autorole off`, `!autorole on`, `!autorole clear`, `!autorole set @role @role2`, `!autorole add @role`, `!autorole remove @role`")
          )
      ]
    });
  }

  if (["off", "disable", "disabled"].includes(action)) {
    saveGuildSettings(message.guild.id, { ...settings, autoRoleEnabled: false });
    return message.reply("Auto role is now **off**. New members will not receive Player or Announcement Ping from the bot.");
  }

  if (["on", "enable", "enabled"].includes(action)) {
    saveGuildSettings(message.guild.id, { ...settings, autoRoleEnabled: true });
    return message.reply("Auto role is now **on**. Use `!autorole status` to check which roles will be assigned.");
  }

  if (action === "clear") {
    saveGuildSettings(message.guild.id, {
      ...settings,
      autoRoleEnabled: true,
      autoRoleIds: [],
      autoRoleId: null,
      announcementRoleId: null
    });
    return message.reply("Auto role list cleared. New members will receive **no** roles unless you run `!autorole set @role`.");
  }

  if (action === "default") {
    const roles = AUTO_JOIN_ROLES.map((name) => findRole(message.guild, name)).filter(Boolean);
    saveGuildSettings(message.guild.id, {
      ...settings,
      autoRoleEnabled: true,
      autoRoleIds: roles.map((role) => role.id),
      autoRoleId: roles.find((role) => role.name === ROLE_NAMES.player)?.id || null,
      announcementRoleId: roles.find((role) => role.name === ROLE_NAMES.announcement)?.id || null
    });
    return message.reply(`Auto role restored to default: ${roles.map((role) => `<@&${role.id}>`).join(", ") || "None found"}.`);
  }

  if (!["set", "add", "remove"].includes(action)) {
    return message.reply("Usage: `!autorole status`, `!autorole off`, `!autorole on`, `!autorole clear`, `!autorole set @role @role2`, `!autorole add @role`, `!autorole remove @role`.");
  }

  const mentionedRoles = [...message.mentions.roles.values()];
  if (!mentionedRoles.length) return message.reply("Please mention at least one role. Example: `!autorole set @Player @Announcement Ping`");

  const unsafe = mentionedRoles.filter((role) => isUnsafeAutoRole(role));
  if (unsafe.length) {
    return message.reply(`I will not use unsafe auto roles: ${unsafe.map((role) => `<@&${role.id}>`).join(", ")}. Auto roles cannot have admin, moderation, manage, or mass-ping permissions.`);
  }

  const botMember = message.guild.members.me;
  const tooHigh = mentionedRoles.filter((role) => botMember.roles.highest.comparePositionTo(role) <= 0);
  if (tooHigh.length) {
    return message.reply(`I cannot assign these roles because my bot role is not above them: ${tooHigh.map((role) => `<@&${role.id}>`).join(", ")}.`);
  }

  const current = getConfiguredAutoRoleIds(message.guild, settings);
  const mentionedIds = mentionedRoles.map((role) => role.id);
  let nextIds = mentionedIds;

  if (action === "add") nextIds = [...new Set([...current, ...mentionedIds])];
  if (action === "remove") nextIds = current.filter((id) => !mentionedIds.includes(id));

  saveGuildSettings(message.guild.id, {
    ...settings,
    autoRoleEnabled: true,
    autoRoleIds: nextIds,
    autoRoleId: nextIds[0] || null,
    announcementRoleId: nextIds[1] || null
  });

  return message.reply(`Auto role updated. New join roles: ${nextIds.length ? nextIds.map((id) => `<@&${id}>`).join(", ") : "None"}.`);
}

async function handleAutoModCommand(message, args) {
  if (!isAdmin(message.member)) return message.reply("Only admins can use `!automod`.");

  const settings = getGuildSettings(message.guild.id) || {};
  const action = (args[0] || "status").toLowerCase();

  if (action === "status") {
    return message.reply({
      embeds: [
        baseEmbed("AutoMod Settings")
          .addFields(
            field("Status", settings.autoModEnabled === false ? "Disabled" : "Enabled", true),
            field("Filter", "Blocks Discord server invite links, configured bad words, and severe slurs."),
            field("Action", "Deletes the message, applies the configured punishment, and logs a case."),
            field("Commands", "`!automod on`, `!automod off`, `!automod reset @user`")
          )
      ]
    });
  }

  if (["on", "enable", "enabled"].includes(action)) {
    saveGuildSettings(message.guild.id, { ...settings, autoModEnabled: true });
    return message.reply("AutoMod is now **on**.");
  }

  if (["off", "disable", "disabled"].includes(action)) {
    saveGuildSettings(message.guild.id, { ...settings, autoModEnabled: false });
    return message.reply("AutoMod is now **off**.");
  }

  if (action === "reset") {
    const user = message.mentions.users.first();
    if (!user) return message.reply("Usage: `!automod reset @user`");
    const data = getGuildData(message.guild.id);
    data.autoMod ||= {};
    delete data.autoMod[user.id];
    saveGuildData(message.guild.id, data);
    await logTo(message.guild, "mod-logs", "AutoMod Reset", [field("User", `${user.tag} (${user.id})`), field("Moderator", message.author.tag)]);
    return message.reply(`AutoMod records reset for ${user.tag}.`);
  }

  return message.reply("Usage: `!automod status`, `!automod on`, `!automod off`, `!automod reset @user`");
}

async function handleBadWordCommand(message, args) {
  if (!isAdmin(message.member)) return message.reply("Only admins can use `!badword`.");

  const settings = getGuildSettings(message.guild.id) || {};
  const action = (args.shift() || "list").toLowerCase();
  const current = Array.isArray(settings.badWords) ? settings.badWords : [];

  if (action === "list") {
    return message.reply({
      embeds: [
        baseEmbed("Bad Word Filter")
          .addFields(
            field("Words/Phrases", current.length ? current.map((word) => `\`${word}\``).join(", ").slice(0, 1024) : "None set."),
            field("Commands", "`!badword add word or phrase`, `!badword remove word or phrase`, `!badword clear`, `!badword list`")
          )
      ]
    });
  }

  if (action === "clear") {
    saveGuildSettings(message.guild.id, { ...settings, badWords: [] });
    return message.reply("Bad word list cleared.");
  }

  if (!["add", "remove", "delete"].includes(action)) {
    return message.reply("Usage: `!badword add word or phrase`, `!badword remove word or phrase`, `!badword clear`, `!badword list`");
  }

  const phrase = normalizeBadWord(args.join(" "));
  if (!phrase) return message.reply("Please type a word or phrase. Example: `!badword add bad phrase`");

  let next = current;
  if (action === "add") {
    next = [...new Set([...current, phrase])].sort((a, b) => a.localeCompare(b));
    saveGuildSettings(message.guild.id, { ...settings, badWords: next });
    return message.reply(`Added \`${phrase}\` to the bad word filter.`);
  }

  next = current.filter((word) => word !== phrase);
  saveGuildSettings(message.guild.id, { ...settings, badWords: next });
  return message.reply(current.includes(phrase) ? `Removed \`${phrase}\` from the bad word filter.` : `\`${phrase}\` was not in the bad word filter.`);
}

async function handleCommandConfigure(message, args) {
  if (!isAdmin(message.member)) return message.reply("Only admins can use `!commandconfigure`.");

  if ((args[0] || "").toLowerCase() === "status") {
    const settings = getGuildSettings(message.guild.id) || {};
    const channel = settings.botCommandsChannelId ? message.guild.channels.cache.get(settings.botCommandsChannelId) : findChannel(message.guild, PLAYER_COMMAND_CHANNEL);
    return message.reply(`Player command channel: ${channel || "not set"}.`);
  }

  const initialChannel = message.mentions.channels.first() || message.guild.channels.cache.get(cleanChannelId(args.join(" ")));
  if (!initialChannel) await message.reply("Mention the channel where regular player commands should work, like `#bot-commands`.");
  const reply = initialChannel ? null : await collectOneMessage(message.channel, message.author.id, QUESTION_TIMEOUT);
  const channel = initialChannel || reply?.mentions.channels.first() || message.guild.channels.cache.get(cleanChannelId(reply?.content || ""));

  if (!channel || channel.type !== ChannelType.GuildText) {
    return message.reply("That was not a valid text channel. Run `!commandconfigure` again and mention the channel.");
  }

  const settings = getGuildSettings(message.guild.id) || {};
  saveGuildSettings(message.guild.id, {
    ...settings,
    botCommandsChannelId: channel.id
  });

  await message.reply(`Regular player commands will now only work in ${channel}. Mod+ and staff permission commands can still be used in chat based on role permissions.`);
}

async function handleLogConfigure(message, args) {
  if (!isAdmin(message.member)) return message.reply("Only admins can use `!logconfigure`.");

  const settings = getGuildSettings(message.guild.id) || {};
  const current = settings.staffLogsChannelId ? message.guild.channels.cache.get(settings.staffLogsChannelId) : findChannel(message.guild, "staff-logs");
  const action = (args[0] || "status").toLowerCase();

  if (["status", "show", "view"].includes(action)) {
    return message.reply({
      embeds: [
        baseEmbed("Staff Log Configuration")
          .addFields(
            field("Log Channel", current ? `${current}` : "Not set. The bot will create/use #staff-logs."),
            field("Set Channel", "`!logconfigure #staff-logs`"),
            field("Reset", "`!logconfigure reset`")
          )
      ]
    });
  }

  if (["reset", "default", "clear"].includes(action)) {
    saveGuildSettings(message.guild.id, { ...settings, staffLogsChannelId: null });
    return message.reply("Staff log channel reset. `!log` will create/use `#staff-logs`.");
  }

  const channel = message.mentions.channels.first()
    || message.guild.channels.cache.get(cleanChannelId(args[0]))
    || findChannel(message.guild, args.join(" ").replace(/^#/, ""));

  if (!channel || channel.type !== ChannelType.GuildText) {
    return message.reply("Usage: `!logconfigure #staff-logs`, `!logconfigure status`, or `!logconfigure reset`.");
  }

  await channel.permissionOverwrites.edit(message.guild.members.me.id, {
    ViewChannel: true,
    SendMessages: true,
    EmbedLinks: true,
    AttachFiles: true,
    ReadMessageHistory: true
  }).catch(() => {});

  saveGuildSettings(message.guild.id, { ...settings, staffLogsChannelId: channel.id });
  return message.reply(`Staff logs from \`!log\` will now be sent to ${channel}.`);
}

async function handleBotConfig(message, args) {
  if (!isAdmin(message.member)) return message.reply("Only admins can use `!botconfig`.");

  const settings = getGuildSettings(message.guild.id) || {};
  const action = (args[0] || "status").toLowerCase();

  if (["status", "show", "view"].includes(action)) {
    const commandChannel = settings.botCommandsChannelId ? message.guild.channels.cache.get(settings.botCommandsChannelId) : findChannel(message.guild, PLAYER_COMMAND_CHANNEL);
    const staffLogs = settings.staffLogsChannelId ? message.guild.channels.cache.get(settings.staffLogsChannelId) : findChannel(message.guild, "staff-logs");
    return message.reply({
      embeds: [
        baseEmbed("Bot Configuration")
          .addFields(
            field("Prefix", settings.prefix || PREFIX, true),
            field("AutoMod", settings.autoModEnabled === false ? "Off" : "On", true),
            field("Player Command Channel", commandChannel ? `${commandChannel}` : "Not set"),
            field("Staff Log Channel", staffLogs ? `${staffLogs}` : "Not set"),
            field("Commands", "`!botconfig prefix !`, `!botconfig automod on/off`, `!botconfig commands #bot-commands`, `!botconfig stafflogs #staff-logs`")
          )
      ]
    });
  }

  if (action === "prefix") {
    const nextPrefix = args[1];
    if (!nextPrefix || nextPrefix.length > 5) return message.reply("Usage: `!botconfig prefix !`");
    saveGuildSettings(message.guild.id, { ...settings, prefix: nextPrefix });
    return message.reply(`Prefix updated to \`${nextPrefix}\`.`);
  }

  if (action === "automod") {
    const value = (args[1] || "").toLowerCase();
    if (!["on", "off", "enable", "disable", "enabled", "disabled"].includes(value)) return message.reply("Usage: `!botconfig automod on` or `!botconfig automod off`");
    const enabled = ["on", "enable", "enabled"].includes(value);
    saveGuildSettings(message.guild.id, { ...settings, autoModEnabled: enabled });
    return message.reply(`AutoMod is now **${enabled ? "on" : "off"}**.`);
  }

  if (["commands", "commandchannel", "botcommands"].includes(action)) {
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(cleanChannelId(args[1]));
    if (!channel || channel.type !== ChannelType.GuildText) return message.reply("Usage: `!botconfig commands #bot-commands`");
    saveGuildSettings(message.guild.id, { ...settings, botCommandsChannelId: channel.id });
    return message.reply(`Player commands are now limited to ${channel}.`);
  }

  if (["stafflogs", "logs", "logchannel"].includes(action)) {
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(cleanChannelId(args[1]));
    if (!channel || channel.type !== ChannelType.GuildText) return message.reply("Usage: `!botconfig stafflogs #staff-logs`");
    saveGuildSettings(message.guild.id, { ...settings, staffLogsChannelId: channel.id });
    return message.reply(`Staff logs will now go to ${channel}.`);
  }

  return message.reply("Usage: `!botconfig status`, `!botconfig prefix !`, `!botconfig automod on/off`, `!botconfig commands #channel`, `!botconfig stafflogs #channel`.");
}

async function handleStartHereCommand(message) {
  if (!isAdmin(message.member)) return message.reply("Only admins can use `!start here`.");

  const summary = { created: [], skipped: [], permissions: [], errors: [] };
  await postStartGuide(message.guild, summary);

  await message.reply({
    embeds: [
      baseEmbed("Start Here Guide")
        .setDescription("The Start Here guide has been created or refreshed.")
        .addFields(
          field("Created", list(summary.created)),
          field("Updated", list(summary.permissions)),
          field("Errors", list(summary.errors))
        )
    ]
  });
}

async function applyRoleSetup(guild, summary) {
  try {
    await guild.roles.everyone.setPermissions(EVERYONE_PERMS, "Kaiju Reincarnated safe everyone permissions");
    summary.permissions.push("@everyone safe permissions");
  } catch (error) {
    summary.errors.push(`@everyone: ${error.message}`);
  }

  for (const roleName of Object.values(ROLE_NAMES)) {
    let role = findRole(guild, roleName);
    const permissions = rolePermissions(roleName);
    const style = ROLE_STYLE[roleName] || {};

    try {
      if (!role) {
        role = await guild.roles.create({
          name: roleName,
          permissions,
          color: style.color,
          hoist: Boolean(style.hoist),
          reason: "Kaiju Reincarnated role setup"
        });
        summary.created.push(`Role: ${roleName}`);
      } else {
        summary.skipped.push(`Role: ${roleName}`);
        await role.edit({
          permissions,
          color: style.color,
          hoist: Boolean(style.hoist),
          reason: "Kaiju Reincarnated safe role permissions"
        });
      }
      summary.permissions.push(roleName);
    } catch (error) {
      summary.errors.push(`${roleName}: ${error.message}`);
    }
  }

  await applyRoleHierarchy(guild, summary);
}

async function ensureLevelRewardRoles(guild, summary) {
  const saved = {};

  for (const [level, config] of Object.entries(LEVEL_REWARD_ROLES)) {
    let role = findRole(guild, config.name);

    try {
      if (!role) {
        role = await guild.roles.create({
          name: config.name,
          permissions: [],
          color: config.color,
          hoist: false,
          mentionable: false,
          reason: "Kaiju Reincarnated level reward role setup"
        });
        summary.created.push(`Role: ${config.name}`);
      } else {
        await role.edit({
          permissions: [],
          color: config.color,
          hoist: false,
          mentionable: false,
          reason: "Kaiju Reincarnated level reward role update"
        });
        summary.skipped.push(`Role: ${config.name}`);
      }

      saved[level] = role.id;
      summary.permissions.push(`${config.name} reward role`);
    } catch (error) {
      summary.errors.push(`${config.name}: ${error.message}`);
    }
  }

  await applyLevelRoleHierarchy(guild, saved, summary);
  return saved;
}

async function applyLevelRoleHierarchy(guild, levelRewardRoles, summary) {
  const roles = Object.entries(levelRewardRoles)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([, roleId]) => guild.roles.cache.get(roleId))
    .filter((role) => role && guild.members.me.roles.highest.comparePositionTo(role) > 0);

  if (roles.length === 0) return;

  const playerRole = findRole(guild, ROLE_NAMES.player);
  const basePosition = playerRole ? playerRole.position + 1 : Math.max(1, guild.members.me.roles.highest.position - roles.length - ROLE_ORDER.length);
  const positions = [...roles].reverse().map((role, index) => ({
    role,
    position: basePosition + index
  }));

  try {
    await guild.roles.setPositions(positions, "Kaiju Reincarnated level role hierarchy");
    summary.permissions.push("Level role hierarchy");
  } catch (error) {
    summary.errors.push(`Level role hierarchy: ${error.message}`);
  }
}

async function applyRoleHierarchy(guild, summary) {
  const manageableRoles = ROLE_ORDER
    .map((roleName) => findRole(guild, roleName))
    .filter((role) => role && guild.members.me.roles.highest.comparePositionTo(role) > 0);

  if (manageableRoles.length === 0) return;

  const bottomPosition = Math.max(1, guild.members.me.roles.highest.position - manageableRoles.length);
  const positions = [...manageableRoles].reverse().map((role, index) => ({
    role,
    position: bottomPosition + index
  }));

  try {
    await guild.roles.setPositions(positions, "Kaiju Reincarnated role hierarchy");
    summary.permissions.push("Role hierarchy/order");
  } catch (error) {
    summary.errors.push(`Role hierarchy: ${error.message}`);
  }
}

async function applyStructure(guild, summary) {
  for (const section of STRUCTURE) {
    const category = await findOrCreateCategory(guild, section, summary);
    if (!category) continue;

    for (const channelName of section.channels || []) {
      await findOrCreateTextChannel(guild, category, channelName, section, summary);
    }

    for (const channelName of section.voice || []) {
      await findOrCreateVoiceChannel(guild, category, channelName, section, summary);
    }
  }
}

async function findOrCreateCategory(guild, section, summary) {
  const existing = guild.channels.cache.find((channel) => channel.type === ChannelType.GuildCategory && channel.name === section.category);
  const overwrites = categoryOverwrites(guild, section);

  if (existing) {
    summary.skipped.push(`Category: ${section.category}`);
    await existing.permissionOverwrites.set(overwrites, "Kaiju Reincarnated category permission update")
      .then(() => summary.permissions.push(`Category: ${section.category}`))
      .catch((error) => summary.errors.push(`Category ${section.category}: ${error.message}`));
    return existing;
  }

  try {
    const category = await guild.channels.create({ name: section.category, type: ChannelType.GuildCategory, permissionOverwrites: overwrites, reason: "Kaiju Reincarnated setup" });
    summary.created.push(`Category: ${section.category}`);
    return category;
  } catch (error) {
    summary.errors.push(`Category ${section.category}: ${error.message}`);
    return null;
  }
}

async function findOrCreateTextChannel(guild, category, channelName, section, summary) {
  const existing = guild.channels.cache.find((channel) => channel.type === ChannelType.GuildText && channel.name === channelName);
  const overwrites = textChannelOverwrites(guild, channelName, section);

  if (existing) {
    summary.skipped.push(`#${channelName}`);
    if (existing.parentId !== category.id) await existing.setParent(category.id, { lockPermissions: false }).catch(() => {});
    await existing.permissionOverwrites.set(overwrites, "Kaiju Reincarnated channel permission update")
      .then(() => summary.permissions.push(`#${channelName}`))
      .catch((error) => summary.errors.push(`#${channelName}: ${error.message}`));
    return existing;
  }

  try {
    const channel = await guild.channels.create({ name: channelName, type: ChannelType.GuildText, parent: category.id, permissionOverwrites: overwrites, reason: "Kaiju Reincarnated setup" });
    summary.created.push(`#${channelName}`);
    return channel;
  } catch (error) {
    summary.errors.push(`#${channelName}: ${error.message}`);
    return null;
  }
}

async function findOrCreateVoiceChannel(guild, category, channelName, section, summary) {
  const existing = guild.channels.cache.find((channel) => channel.type === ChannelType.GuildVoice && channel.name === channelName);
  const overwrites = voiceChannelOverwrites(guild, channelName);

  if (existing) {
    summary.skipped.push(channelName);
    if (existing.parentId !== category.id) await existing.setParent(category.id, { lockPermissions: false }).catch(() => {});
    await existing.permissionOverwrites.set(overwrites, "Kaiju Reincarnated voice permission update")
      .then(() => summary.permissions.push(channelName))
      .catch((error) => summary.errors.push(`${channelName}: ${error.message}`));
    return existing;
  }

  try {
    const channel = await guild.channels.create({ name: channelName, type: ChannelType.GuildVoice, parent: category.id, permissionOverwrites: overwrites, reason: "Kaiju Reincarnated setup" });
    summary.created.push(channelName);
    return channel;
  } catch (error) {
    summary.errors.push(`${channelName}: ${error.message}`);
    return null;
  }
}

function categoryOverwrites(guild, section) {
  if (section.staffOnly) return staffOverwrites(guild);
  if (section.testerOnly) return testerOverwrites(guild);
  return publicOverwrites(guild);
}

function textChannelOverwrites(guild, channelName, section) {
  const plainName = stripStyle(channelName);

  if (section.staffOnly) return staffOverwrites(guild);
  if (section.testerOnly) return testerOverwrites(guild);

  if (["welcome", "rules", "start-here", "announcements", "game-updates", "sneak-peeks", "known-bugs", "patch-notes", "events"].includes(plainName)) {
    return readOnlyOverwrites(guild);
  }

  if (["suggestions", "reviews"].includes(plainName)) {
    return commandOnlyOverwrites(guild);
  }

  if (plainName === "polls") {
    return pollsOverwrites(guild);
  }

  if (["kaiju-discussion", "stats-and-builds", "battle-discussion"].includes(plainName)) {
    return gameOverwrites(guild);
  }

  return publicOverwrites(guild);
}

function voiceChannelOverwrites(guild, channelName) {
  return stripStyle(channelName).toLowerCase().includes("staff") ? staffVoiceOverwrites(guild) : voiceOverwrites(guild);
}

async function postStartGuide(guild, summary) {
  const channel = findChannel(guild, "start-here");
  if (!channel) return;
  const ticketChannel = findChannel(guild, "tickets");
  const ticketText = ticketChannel
    ? `Go to ${ticketChannel} and click the ticket panel if you need private help, want to report a player, or need staff to review something.`
    : "Go to the tickets channel and click the ticket panel if you need private help, want to report a player, or need staff to review something.";

  const oldGuide = await channel.messages.fetch({ limit: 20 }).catch(() => null);
  const existingGuide = oldGuide?.find((message) => message.author.id === client.user.id && message.embeds[0]?.title?.includes("Start Here"));

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("guide:play").setLabel("How to Play").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("guide:community").setLabel("Community").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("guide:bugs").setLabel("Bugs & Feedback").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("guide:support").setLabel("Support").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("guide:rules").setLabel("Rules").setStyle(ButtonStyle.Secondary),
  );

  const payload = {
    embeds: [
      baseEmbed("Start Here - Kaiju Reincarnated")
        .setDescription("Welcome to the Kaiju Reincarnated community. This server is where players talk about the game, share creations, follow updates, join events, report issues, and get support from staff.")
        .addFields(
          field("Start Here", "Read the rules first, check announcements for official news, then jump into the community channels when you are ready."),
          field("Community", "Here you can talk about kaiju battles, builds, stats, and your own creations. You can also send us feedback or report bugs. Share your clips, participate in events, and have fun."),
          field("Game Talk", "Use the game channels for kaiju discussion, battle ideas, stats, builds, clips, media, fan art, and event conversations."),
          field("Bugs & Feedback", "Use `!bugreport` for bugs and `!suggest your idea` for suggestions. Clear details help staff and developers understand what happened."),
          field("Support", ticketText),
          field("Useful Commands", "`!help`, `!rules`, `!suggest`, `!review`, `!bugreport`, `!ticketpanel`")
        )
    ],
    components: [row]
  };

  if (existingGuide) {
    await existingGuide.edit(payload).catch((error) => summary.errors.push(`Start-here guide edit: ${error.message}`));
    summary.permissions.push("Updated start-here guide panel");
    return;
  }

  await channel.send(payload);
  summary.created.push("Start-here guide panel");
}

async function handleRules(message) {
  if (!isStaff(message.member)) {
    await message.reply({ embeds: [buildRulesEmbed()] }).catch(() => {});
    return;
  }

  const channel = findChannel(message.guild, "rules") || message.channel;
  const sent = await channel.send({ embeds: [buildRulesEmbed()] }).then(() => true).catch(async (error) => {
    console.error("Could not post rules embed", error);
    await message.channel.send({
      content: `I could not post in ${channel}. Check my **Send Messages** and **Embed Links** permissions there.`,
      embeds: [buildRulesEmbed()]
    }).catch(() => {});
    return false;
  });

  if (sent && channel.id !== message.channel.id) {
    await message.reply(`Rules embed posted in ${channel}.`).catch(() => {});
  }
}

async function postRulesEmbed(guild, summary) {
  const channel = findChannel(guild, "rules");
  if (!channel) return;

  const oldRules = await channel.messages.fetch({ limit: 20 }).catch(() => null);
  if (oldRules?.some((message) => message.author.id === client.user.id && /rules/i.test(message.embeds[0]?.title || ""))) {
    summary.skipped.push("Rules embed");
    return;
  }

  await channel.send({ embeds: [buildRulesEmbed()] }).catch((error) => summary.errors.push(`Rules embed: ${error.message}`));
  summary.created.push("Rules embed");
}

function buildRulesEmbedLegacy() {
  return baseEmbed("📋 Kaiju Reincarnated Rules", "#2563eb")
    .setDescription("🎮 **Welcome to Kaiju Reincarnated!**\n\nStaff use common sense when moderating. Anything not listed can still be actioned at staff discretion, and rules may be updated at any time.")
    .addFields(
      {
        name: "🤝 Behaviour",
        value: [
          "Be respectful to everyone.",
          "No harassment, slurs, disrespectful language, discrimination, or drama in chat.",
          "Do not provoke arguments or target other members."
        ].join("\n"),
        inline: false
      },
      {
        name: "🚫 Spam & Advertising",
        value: [
          "Do not spam, flood chats, or use excessive emojis.",
          "Advertising and self-promotion are not allowed unless approved as a game content creator."
        ].join("\n"),
        inline: false
      },
      {
        name: "⚠️ Content",
        value: [
          "No NSFW or 18+ content.",
          "Violent or gore content is not tolerated.",
          "Do not share personal information."
        ].join("\n"),
        inline: false
      },
      {
        name: "📂 Channel & Voice Usage",
        value: [
          "Use channels only for their intended purpose.",
          "No loud noises, soundboard spam, or disrespectful language in voice channels."
        ].join("\n"),
        inline: false
      },
      {
        name: "🛡️ Moderation",
        value: [
          "Do not discuss moderation issues in public chat. Open a ticket instead.",
          "Do not impersonate staff or backseat moderate.",
          "No ban evasion. Using alts to dodge punishment counts as a new offence."
        ].join("\n"),
        inline: false
      },
      {
        name: "🔗 Scams & Links",
        value: "No phishing, scam links, fake free Nitro/skins links, or suspicious downloads.",
        inline: false
      },
      {
        name: "🎮 In-Game Rules",
        value: [
          "No exploiting, bug abuse, alt farming, cheats, hacks, or unauthorised third-party software.",
          "Report bugs to staff. Bug abuse may result in a heavy punishment."
        ].join("\n"),
        inline: false
      },
      {
        name: "❗ Important",
        value: [
          "Follow Discord's Terms of Service and Community Guidelines.",
          "[Terms of Service](https://discord.com/terms) • [Community Guidelines](https://discord.com/guidelines) • [Privacy Policy](https://discord.com/privacy)"
        ].join("\n"),
        inline: false
      }
    )
    .setFooter({ text: "Use common sense. Staff may escalate punishments based on severity and history." });
}

function buildRulesEmbed() {
  return baseEmbed("📋 RULES", "#2563eb")
    .setDescription("@everyone\n━━━━━━━━━━━━━━━━━━━━━")
    .addFields(
      field("Behaviour", [
        "Be respectful to everyone.",
        "No harassment, no slurs, no disrespectful language, and no drama in any chat.",
        "Do not provoke arguments or target other members.",
        "No provoking any suicidal actions."
      ].join("\n")),
      field("Boundaries & Staff's Respect", [
        "No DMing developers and administrators if they don't allow it.",
        "No pinging developers and administrators+ unless they allow it.",
        "No constantly asking developers about updates.",
        "No harassment towards any staff member.",
        "You can DM mods and senior mods, but avoid DMing or disturbing developers and administrators unless they allow it."
      ].join("\n")),
      field("No Politics", "Do not talk about wars, political figures, political controversies, bad events, or royal families."),
      field("No Spam & Advertising", [
        "Do not spam, flood, or use excessive emojis in any channel.",
        "Advertising and self-promotion are not allowed unless approved as a game content creator."
      ].join("\n")),
      field("Content", [
        "No NSFW or 18+ content.",
        "No loud noises videos.",
        "No videos that could trigger epilepsy.",
        "Violent or gore content will not be tolerated whatsoever.",
        "Do not share ANY personal information."
      ].join("\n")),
      field("Channel Usage", "Use channels only for their intended purpose."),
      field("Voice Channels", "No loud noises, soundboard spam, or disrespectful language in voice channels."),
      field("Moderation", [
        "Do not discuss moderation issues in chat. Open a ticket instead.",
        "Do not impersonate staff.",
        "Do not backseat moderate.",
        "No ban evasion. Using alt accounts to dodge a punishment counts as a new offence."
      ].join("\n")),
      field("Scams & Links", "No phishing, scam links, fake free Nitro/skins links, or suspicious downloads."),
      field("🎮 IN-GAME RULES", "━━━━━━━━━━━━━━━━━━━━━"),
      field("Fair Play", [
        "No exploiting or abusing bugs/glitches, and no farming using alt accounts or friends.",
        "No cheats, hacks, or unauthorised third-party software.",
        "Report every bug you find to staff. Any bug abuse will result in a heavy punishment."
      ].join("\n")),
      field("❗ IMPORTANT", "━━━━━━━━━━━━━━━━━━━━━"),
      field("Follow Discord's Terms of Service", [
        "Anyone not following Discord's ToS will be punished instantly.",
        "[Terms of Service](https://discord.com/terms)",
        "[Community Guidelines](https://discord.com/guidelines)",
        "[Privacy Policy](https://discord.com/privacy)"
      ].join("\n")),
      field("Common Sense", "Anything not listed here can still be actioned at staff discretion, and rules may be updated at any time."),
      field("Banned Words", "foid and moid.")
    )
    .setFooter({ text: "Rules may be updated at any time." });
}

async function handleGuideButton(interaction) {
  const guide = interaction.customId.split(":")[1];
  const ticketChannel = findChannel(interaction.guild, "tickets");
  const ticketText = ticketChannel
    ? `Go to ${ticketChannel} and click the ticket panel for private help, player reports, or staff review.`
    : "Go to the tickets channel and click the ticket panel for private help, player reports, or staff review.";
  const text = {
    play: "Talk about kaiju battles, builds, stats, and strategies in the game channels. Watch announcements and events for official news and community activities.",
    community: "Share clips, media, fan art, builds, stats, battle ideas, feedback, and event talk in the community channels. Keep it respectful and use each channel for its purpose.",
    bugs: "Use `!bugreport` for bugs and `!suggest your idea` for feedback or suggestions. Include what happened, where it happened, and screenshots or clips if you have them.",
    support: ticketText,
    rules: "Read the rules channel before chatting. Be respectful, no NSFW, no harassment, no spam, no scams, and use common sense."
  }[guide] || "Use `!help` for commands.";

  await interaction.reply({ content: text, ephemeral: true });
}

function isUnsafeAutoRole(role) {
  return role.permissions.any(DANGEROUS_AUTO_ROLE_PERMS);
}

function getConfiguredAutoRoleIds(guild, settings = {}) {
  if (Array.isArray(settings.autoRoleIds)) return settings.autoRoleIds.filter((id) => guild.roles.cache.has(id));

  const savedIds = [settings.autoRoleId, settings.announcementRoleId].filter((id) => id && guild.roles.cache.has(id));
  if (savedIds.length) return savedIds;

  return AUTO_JOIN_ROLES.map((roleName) => findRole(guild, roleName)?.id).filter(Boolean);
}

async function assignJoinRoles(member, settings = {}) {
  const roleIds = getConfiguredAutoRoleIds(member.guild, settings);

  for (const roleId of roleIds) {
    const role = member.guild.roles.cache.get(roleId);
    if (!role) continue;

    if (isUnsafeAutoRole(role)) {
      await logTo(member.guild, "join-logs", "Auto Role Failed", [field("User", `${member}`), field("Role", role.name), field("Reason", "Role has unsafe permissions and was blocked.")]);
      continue;
    }

    if (!member.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles) || member.guild.members.me.roles.highest.comparePositionTo(role) <= 0) {
      await logTo(member.guild, "join-logs", "Auto Role Failed", [field("User", `${member}`), field("Role", role.name), field("Reason", "Bot role is not above this role or lacks Manage Roles.")]);
      continue;
    }

    await member.roles.add(role, "Auto role on join").catch((error) => logTo(member.guild, "join-logs", "Auto Role Failed", [field("User", `${member}`), field("Role", role.name), field("Reason", error.message)]));
  }
}

async function sendWelcome(member) {
  const channel = findChannel(member.guild, "welcome");
  if (!channel) return;

  await channel.send({
    content: `${member}`,
    allowedMentions: { users: [member.id] },
    embeds: [
      baseEmbed(`Welcome to ${member.guild.name}`)
        .setDescription(`Welcome ${member} to ${BRAND}! Read the rules, check #start-here, and enjoy the kaiju battles.`)
        .addFields(field("Member count", member.guild.memberCount, true))
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    ]
  }).catch(() => {});
}

async function sendNewMemberDm(member) {
  await member.send(`Welcome to ${BRAND}! Read the rules, check #start-here, and use !help in the server if you need commands.`)
    .catch(() => logTo(member.guild, "join-logs", "DM Failed", [field("User", `${member}`), field("Reason", "DMs are closed.")]));
}

async function sendJoinLog(member, title) {
  await logTo(member.guild, "join-logs", title, [
    field("User", `${member.user.tag} (${member.id})`),
    field("Account Created", `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`)
  ]);
}

async function handlePing(message) {
  await message.reply(`Pong. Bot is online. Version: \`${BOT_VERSION}\`. Prefix is \`${(getGuildSettings(message.guild.id) || {}).prefix || PREFIX}\`.`);
}

async function handleVersion(message) {
  await message.reply(`Running **${BRAND}** bot version \`${BOT_VERSION}\`.`);
}

async function handleCommands(message) {
  const settings = getGuildSettings(message.guild.id) || {};
  const commandChannel = settings.botCommandsChannelId ? message.guild.channels.cache.get(settings.botCommandsChannelId) : findChannel(message.guild, PLAYER_COMMAND_CHANNEL);
  await message.reply({
    embeds: [
      baseEmbed(`${BRAND} Player Commands`)
        .setDescription(`Player commands work in ${commandChannel || "#bot-commands"}.`)
        .addFields(
          field("General", "`!ping`, `!version`, `!commands`, `!help`, `!rules`, `!serverstats`"),
          field("Community", "`!review`, `!suggest [idea]`, `!bugreport`"),
          field("Levels", "`!rank` and `!level` are disabled because Noctaly handles levels."),
          field("Donations", "`!leaderboard` shows the Robux donation leaderboard."),
          field("Support", "Use the ticket panel in #tickets when you need private help."),
          field("Notes", "Staff commands are hidden from players. Staff can use `!staffcommands`.")
        )
    ]
  });
}

async function handleStaffCommands(message) {
  if (!isStaff(message.member)) return;

  await message.reply({
    embeds: [
      baseEmbed(`${BRAND} Staff Commands`)
        .addFields(
          field("Setup/Admin", "`!krupdate`, `!newplayersetup`, `!start here`, `!starthere`, `!rolesetup`, `!botconfig`, `!commandconfigure`, `!logconfigure`, `!autorole`, `!automod`, `!badword`, `!reactionroles`, `!staffapp`, `!ticketpanel`, `!ccpanel`, `!ccconfig`, `!leaderboard configure`"),
          field("Config/Admin", "`!configview`, `!configreload`, `!configreset`, `!backup`, `!restorebackup`, `!analytics`"),
          field("Tickets", "`!claimticket`, `!addinticket @user`, `!removefromticket @user`, `!ccapprove @user`, `!ccdeny @user reason`, legacy aliases: `!add @user`, `!remove @user`"),
          field("Trial Mod", "`!log`, `!warn @user/id reason`, `!timeout @user/id 30m/2h/3d reason`, `!untimeout @user/id reason`, `!warnings @user/id`, `!cases @user/id`, `!case 12`, `!rules`"),
          field("Moderator+", "`!purge 25`, `!clear 25`, `!unwarn @user/id`, `!removecase @user/id case`, `!punish @user/id rule reason`, `!kick`"),
          field("Ban Members Permission", "`!ban`, `!unban`, `!tempban @user/id 30m/12h/14d reason`, `!untempban`"),
          field("Events/Stats", "`!event`, `!endevent`, `!gcreate`, `!staffstats`, `!serverstats`, `!leaderboard`, `!donation @user amount`, `!donationremove @user amount`")
        )
    ]
  });
}

async function handleHelp(message) {
  await message.reply({
    embeds: [
      baseEmbed(`${BRAND} Help`)
        .addFields(
          field("Players", "Use `!commands` in the configured bot command channel."),
          field("Staff", "Use `!staffcommands` to see setup, ticket, moderation, case, event, and config commands.")
        )
    ]
  });
}

async function handleSuggest(message, args) {
  const suggestion = args.join(" ").trim();
  const prefix = (getGuildSettings(message.guild.id) || {}).prefix || PREFIX;
  if (!suggestion) return message.reply(`Usage: \`${prefix}suggest [your suggestion]\``);

  const publicChannel = findChannel(message.guild, "suggestions");
  const logChannel = findChannel(message.guild, "suggestion-submissions");
  if (!publicChannel) return message.reply("I could not find the suggestions channel. Ask an admin to run the server setup command.");

  await message.delete().catch(() => {});
  const embed = baseEmbed("Community Suggestion")
    .setDescription(suggestion.slice(0, 4000))
    .addFields(field("Suggested by", message.author.tag, true));

  const sent = await publicChannel.send({ embeds: [embed] }).catch(() => null);
  if (!sent) return message.channel.send("I could not post the suggestion. Check my Send Messages and Embed Links permissions.").catch(() => {});
  await sent?.react("👍").catch(() => {});
  await sent?.react("👎").catch(() => {});
  await logChannel?.send({ embeds: [embed.setTitle("Suggestion Submission")] }).catch(() => {});

  const data = getGuildData(message.guild.id);
  data.suggestions.push({ userId: message.author.id, text: suggestion, at: Date.now() });
  data.analytics.suggestions += 1;
  saveGuildData(message.guild.id, data);
}

async function handleReview(message) {
  const publicChannel = findChannel(message.guild, "reviews");
  if (!publicChannel) return message.reply("I could not find the reviews channel. Ask an admin to run the server setup command.");

  const ratingReply = await ask(message, "How many stars? 1-5", (reply) => /^[1-5]$/.test(reply.content.trim()));
  if (!ratingReply) return;
  const reasonReply = await ask(message, "Why did you give this rating? Type `skip` to leave it blank.");
  if (!reasonReply) return;

  const rating = Number(ratingReply.content.trim());
  const stars = "⭐".repeat(rating);
  const reason = reasonReply.content.trim().toLowerCase() === "skip" ? "" : ` “${reasonReply.content.trim().slice(0, 300)}”`;
  const line = `${rating} ${stars}${reason} - ${message.member.displayName}`;
  await Promise.all([message.delete().catch(() => {}), ratingReply.delete().catch(() => {}), reasonReply.delete().catch(() => {})]);

  const embed = baseEmbed("Community Review").setDescription(line);
  const sent = await publicChannel.send({ embeds: [embed] }).catch(() => null);
  if (!sent) return message.channel.send("I could not post the review. Check my Send Messages and Embed Links permissions.").catch(() => {});
  await findChannel(message.guild, "review-submissions")?.send({ embeds: [embed] }).catch(() => {});

  const data = getGuildData(message.guild.id);
  data.reviews.push({ userId: message.author.id, rating, reason: reasonReply.content.trim(), at: Date.now() });
  data.analytics.reviews += 1;
  saveGuildData(message.guild.id, data);
}

async function handlePurge(message, args) {
  if (!canPurge(message.member)) return message.reply("Only Moderator+ with Manage Messages can purge messages.");

  const amount = Number(args[0] || 0);
  if (!amount || Number.isNaN(amount) || amount < 1 || amount > 100) {
    return message.reply("Usage: `!purge 1-100` or `!clear 1-100`");
  }

  await message.delete().catch(() => {});
  const deleted = await message.channel.bulkDelete(amount, true).catch(async (error) => {
    await message.channel.send(`Could not purge messages: ${error.message}`).catch(() => {});
    return null;
  });
  if (!deleted) return;

  await logTo(message.guild, "mod-logs", "Messages Purged", [
    field("Channel", `${message.channel}`),
    field("Moderator", message.author.tag),
    field("Amount", deleted.size, true)
  ]);
}

async function handleReactionRoles(message) {
  if (!isAdmin(message.member)) return message.reply("Only admins can create reaction role panels.");

  const mentionedRoles = [...message.mentions.roles.values()];
  const roles = mentionedRoles.length
    ? mentionedRoles
    : [findRole(message.guild, ROLE_NAMES.announcement)].filter(Boolean);

  const safeRoles = roles.filter((role) => !isUnsafeAutoRole(role)).slice(0, 25);
  if (!safeRoles.length) return message.reply("Mention at least one safe role. Example: `!reactionroles @Announcement Ping`");

  const components = [];
  for (let i = 0; i < safeRoles.length; i += 5) {
    components.push(new ActionRowBuilder().addComponents(
      safeRoles.slice(i, i + 5).map((role) => new ButtonBuilder()
        .setCustomId(`rr:${role.id}`)
        .setLabel(role.name.replace(/^.+?\s/, "").slice(0, 80))
        .setStyle(ButtonStyle.Secondary))
    ));
  }

  await message.channel.send({
    embeds: [
      baseEmbed("Reaction Roles")
        .setDescription("Click a button to add or remove that role.")
        .addFields(field("Roles", safeRoles.map((role) => `<@&${role.id}>`).join("\n")))
    ],
    components
  });
  await message.reply("Reaction role panel posted.");
}

async function handleReactionRoleButton(interaction) {
  const roleId = interaction.customId.split(":")[1];
  const role = interaction.guild.roles.cache.get(roleId) || await interaction.guild.roles.fetch(roleId).catch(() => null);
  if (!role || isUnsafeAutoRole(role)) return interaction.reply({ content: "That role is not available.", ephemeral: true });

  const member = interaction.member;
  const botMember = interaction.guild.members.me;
  if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles) || botMember.roles.highest.comparePositionTo(role) <= 0) {
    return interaction.reply({ content: "I cannot manage that role. Move my bot role above it.", ephemeral: true });
  }

  if (member.roles.cache.has(role.id)) {
    await member.roles.remove(role, "Reaction role toggle");
    return interaction.reply({ content: `Removed ${role.name}.`, ephemeral: true });
  }

  await member.roles.add(role, "Reaction role toggle");
  return interaction.reply({ content: `Added ${role.name}.`, ephemeral: true });
}

async function handleTicketPanel(message) {
  if (!isAdmin(message.member)) return message.reply("Only admins can send the ticket panel.");

  const row = new ActionRowBuilder().addComponents(
    Object.entries(TICKET_TYPES).slice(0, 5).map(([id, label]) => new ButtonBuilder().setCustomId(`ticket:${id}`).setLabel(label).setStyle(ButtonStyle.Primary))
  );

  await message.channel.send({
    embeds: [baseEmbed("Support Tickets").setDescription("Choose the ticket type that matches what you need.")],
    components: [row]
  });
}

async function handleCcPanel(message) {
  if (!isAdmin(message.member)) return message.reply("Only admins can send the CC panel.");

  await message.channel.send({
    embeds: [buildCcPanelEmbed(message.guild)],
    components: [buildCcPanelRow()]
  });

  await message.reply("Content Creator application panel posted.");
}

function replyWithoutMentions(message, content) {
  return message.reply({
    content,
    allowedMentions: { parse: [], repliedUser: false }
  });
}

async function handleCcConfig(message, args) {
  if (!isAdmin(message.member)) return message.reply("Only admins can use `!ccconfig`.");

  const settings = getGuildSettings(message.guild.id) || {};
  const action = (args.shift() || "status").toLowerCase();
  const role = getConfiguredCcRole(message.guild, settings);
  const reviewerRoles = getConfiguredCcReviewerRoles(message.guild, settings);
  const ticketViewerRoles = getConfiguredCcTicketViewerRoles(message.guild, settings);

  if (["status", "show", "view"].includes(action)) {
    return message.reply({
      embeds: [
        baseEmbed("Content Creator Configuration")
          .addFields(
            field("CC Role", role ? role.name : "Not set. Use `!ccconfig role @Content Creator`."),
            field("Who Can Approve/Deny", reviewerRoles.length ? reviewerRoles.map((reviewerRole) => reviewerRole.name).join(", ") : "Admins only"),
            field("Who Can See CC Tickets", ticketViewerRoles.length ? ticketViewerRoles.map((viewerRole) => viewerRole.name).join(", ") : "No roles set. Use `!ccconfig ticketroles @role`."),
            field("Approve Message", settings.ccApproveMessage || "Default approval message"),
            field("Deny Message", settings.ccDenyMessage || "Default denial message"),
            field("Commands", "`!ccconfig role @role`, `!ccconfig reviewers @role @role2`, `!ccconfig ticketroles @role @role2`, `!ccconfig clearreviewers`, `!ccconfig clearticketroles`, `!ccconfig approvemessage text`, `!ccconfig denymessage text`, `!ccconfig resetmessages`")
          )
      ],
      allowedMentions: { parse: [], repliedUser: false }
    });
  }

  if (action === "role") {
    const targetRole = message.mentions.roles.first() || message.guild.roles.cache.get(cleanRoleId(args[0]));
    if (!targetRole) return message.reply("Mention the role to give on approval. Example: `!ccconfig role @Content Creator`");
    if (isUnsafeAutoRole(targetRole)) return message.reply("I will not configure an admin, moderation, manage, or mass-ping role as the Content Creator approval role.");
    const roleError = getRoleManageError(message.guild, targetRole);
    if (roleError) return message.reply(roleError);

    saveGuildSettings(message.guild.id, { ...settings, ccRoleId: targetRole.id });
    return replyWithoutMentions(message, `Content Creator approval role set to ${targetRole.name}.`);
  }

  if (["reviewers", "approvers", "allowed"].includes(action)) {
    const roles = getRolesFromArgs(message, args);
    if (!roles.length) return message.reply("Mention who can approve/deny CC applications. Example: `!ccconfig reviewers @Administrator @Manager`");

    saveGuildSettings(message.guild.id, { ...settings, ccReviewerRoleIds: roles.map((reviewerRole) => reviewerRole.id) });
    const synced = await syncCcTicketViewerPermissions(message.guild);
    return replyWithoutMentions(message, `CC approver roles updated: ${roles.map((reviewerRole) => reviewerRole.name).join(", ")}. Synced ${synced} open CC ticket(s).`);
  }

  if (["ticketroles", "viewers", "visibility", "ticketviewers"].includes(action)) {
    const roles = getRolesFromArgs(message, args);
    if (!roles.length) return message.reply("Mention the roles that should see CC tickets. Example: `!ccconfig ticketroles @Administrator @CC Manager`");

    saveGuildSettings(message.guild.id, { ...settings, ccTicketViewerRoleIds: roles.map((viewerRole) => viewerRole.id) });
    const synced = await syncCcTicketViewerPermissions(message.guild);
    return replyWithoutMentions(message, `CC ticket visibility updated. Only the applicant, bot, and these roles will see CC tickets: ${roles.map((viewerRole) => viewerRole.name).join(", ")}. Synced ${synced} open CC ticket(s).`);
  }

  if (["clearreviewers", "clearapprovers"].includes(action)) {
    saveGuildSettings(message.guild.id, { ...settings, ccReviewerRoleIds: [] });
    const synced = await syncCcTicketViewerPermissions(message.guild);
    return message.reply(`CC approver roles cleared. Only admins can approve/deny now. Synced ${synced} open CC ticket(s).`);
  }

  if (["clearticketroles", "clearviewers", "clearvisibility"].includes(action)) {
    saveGuildSettings(message.guild.id, { ...settings, ccTicketViewerRoleIds: [] });
    const synced = await syncCcTicketViewerPermissions(message.guild);
    return message.reply(`CC ticket viewer roles cleared. CC tickets will fall back to approver roles if they are set. Synced ${synced} open CC ticket(s).`);
  }

  if (["approvemessage", "approvedmessage"].includes(action)) {
    const text = args.join(" ").trim();
    if (!text) return message.reply("Usage: `!ccconfig approvemessage Your Content Creator application was approved!`");
    saveGuildSettings(message.guild.id, { ...settings, ccApproveMessage: text.slice(0, 1000) });
    return message.reply("CC approval DM message updated.");
  }

  if (["denymessage", "deniedmessage"].includes(action)) {
    const text = args.join(" ").trim();
    if (!text) return message.reply("Usage: `!ccconfig denymessage Unfortunately, you did not fit the Content Creator requirements.`");
    saveGuildSettings(message.guild.id, { ...settings, ccDenyMessage: text.slice(0, 1000) });
    return message.reply("CC denial DM message updated.");
  }

  if (["resetmessages", "clearmessages"].includes(action)) {
    saveGuildSettings(message.guild.id, { ...settings, ccApproveMessage: null, ccDenyMessage: null });
    return message.reply("CC approval/denial messages reset to default.");
  }

  return message.reply("Usage: `!ccconfig status`, `!ccconfig role @role`, `!ccconfig reviewers @role`, `!ccconfig ticketroles @role`, `!ccconfig clearreviewers`, `!ccconfig clearticketroles`, `!ccconfig approvemessage text`, `!ccconfig denymessage text`, `!ccconfig resetmessages`.");
}

async function handleCcApply(interaction) {
  const guild = interaction.guild;
  const data = getGuildData(guild.id);
  data.tickets ||= {};

  const existing = data.tickets[`${interaction.user.id}:cc`];
  if (existing && guild.channels.cache.has(existing)) {
    return interaction.reply({ content: `You already have an open Content Creator ticket: <#${existing}>`, ephemeral: true });
  }

  if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return interaction.reply({ content: "I need Manage Channels permission to create CC tickets.", ephemeral: true });
  }

  const category = await ensureCcTicketCategory(guild);
  const channelName = `cc-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 90) || `cc-${interaction.user.id}`;
  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: category?.id || null,
    permissionOverwrites: buildCcTicketOverwrites(guild, interaction.user.id),
    reason: "Content Creator application ticket"
  }).catch((error) => {
    console.error("CC ticket create failed:", error);
    return null;
  });

  if (!channel) return interaction.reply({ content: "I could not create your CC ticket. Please tell staff.", ephemeral: true });

  data.tickets[`${interaction.user.id}:cc`] = channel.id;
  data.ticketMeta ||= {};
  data.ticketMeta[channel.id] = {
    ownerId: interaction.user.id,
    type: "cc",
    claimedBy: null,
    createdAt: Date.now(),
    closedAt: null
  };
  data.analytics ||= {};
  data.analytics.tickets = (data.analytics.tickets || 0) + 1;
  saveGuildData(guild.id, data);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ticketclose:${interaction.user.id}:cc`).setLabel("Close Ticket").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`tickettranscript:${interaction.user.id}:cc`).setLabel("Transcript").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`ticketdelete:${interaction.user.id}:cc`).setLabel("Delete Ticket").setStyle(ButtonStyle.Danger)
  );

  await channel.send({
    content: `${interaction.user}`,
    embeds: [buildCcTicketEmbed(interaction.user)],
    components: [row]
  });

  await interaction.reply({ content: `Created your Content Creator application ticket: ${channel}`, ephemeral: true });
}

async function handleCcApprove(message, args) {
  if (!canUseCcReview(message.member)) return message.reply("You are not configured to approve Content Creator applications.");

  const { user } = await resolveCcApplicant(message, args);
  if (!user) return message.reply("Usage: `!ccapprove @user` or run `!ccapprove` inside that user's CC ticket.");

  const member = await message.guild.members.fetch(user.id).catch(() => null);
  if (!member) return message.reply("That user is not in this server, so I cannot give them the Content Creator role.");

  const targetCheck = canModerateTarget(message.member, member, "approve");
  if (!targetCheck.ok) return message.reply(targetCheck.reason);

  const settings = getGuildSettings(message.guild.id) || {};
  const role = getConfiguredCcRole(message.guild, settings);
  if (!role) return message.reply("No Content Creator role is configured. Run `!ccconfig role @Content Creator` first.");

  const roleError = getRoleManageError(message.guild, role);
  if (roleError) return message.reply(roleError);

  await member.roles.add(role, `CC application approved by ${message.author.tag}`);
  markCcTicketReviewed(message.guild.id, message.channel.id, "Approved", message.author.id);

  const dmText = settings.ccApproveMessage || `Your Content Creator application in ${message.guild.name} was approved. You now have the Content Creator role.`;
  await user.send(dmText).catch(() => message.channel.send({
    content: `Content Creator application approved for ${user.tag}. Their DMs are closed.`,
    allowedMentions: { parse: [] }
  }).catch(() => {}));

  await logTo(message.guild, "logs", "CC Application Approved", [
    field("Applicant", `${user.tag} (${user.id})`),
    field("Reviewer", `${message.author.tag} (${message.author.id})`),
    field("Role Given", role.name)
  ]);

  await replyWithoutMentions(message, `Content Creator role given to ${user.tag}.`);
}

async function handleCcDeny(message, args) {
  if (!canUseCcReview(message.member)) return message.reply("You are not configured to deny Content Creator applications.");

  const resolved = await resolveCcApplicant(message, args);
  const user = resolved.user;
  if (!user) return message.reply("Usage: `!ccdeny @user reason` or run `!ccdeny reason` inside that user's CC ticket.");

  const member = await message.guild.members.fetch(user.id).catch(() => null);
  const targetCheck = canModerateTarget(message.member, member, "deny");
  if (!targetCheck.ok) return message.reply(targetCheck.reason);

  const settings = getGuildSettings(message.guild.id) || {};
  const reason = resolved.remainingArgs.join(" ").trim();
  const defaultText = `Unfortunately, you did not fit the Content Creator requirements for ${message.guild.name}. You can improve your content and try again later.`;
  const dmText = `${settings.ccDenyMessage || defaultText}${reason ? `\nReason: ${reason}` : ""}`;

  markCcTicketReviewed(message.guild.id, message.channel.id, "Denied", message.author.id);
  await user.send(dmText).catch(() => message.channel.send({
    content: `Content Creator application denied for ${user.tag}. Their DMs are closed. ${reason || "Unfortunately, they did not fit the requirements."}`,
    allowedMentions: { parse: [] }
  }).catch(() => {}));

  await logTo(message.guild, "logs", "CC Application Denied", [
    field("Applicant", `${user.tag} (${user.id})`),
    field("Reviewer", `${message.author.tag} (${message.author.id})`),
    field("Reason", reason || "Did not fit the requirements")
  ]);

  await replyWithoutMentions(message, `Content Creator application denied for ${user.tag}.`);
}

function buildCcPanelEmbed(guild) {
  const icon = guild.iconURL({ size: 256 });
  const embed = baseEmbed("Kaiju Reincarnated CC Requirements and Benefits", "#f59e0b")
    .setDescription("Apply for the Content Creator program below. Please read the requirements before opening a ticket.")
    .addFields(
      field("Requirements", [
        "1. 3 videos on Kaiju Reincarnated.",
        "2. Must have `discord.gg/kaijureincarnated` in all 3 videos and comments.",
        "3. At least 1000 TikTok followers OR",
        "4. At least 750 YouTube followers."
      ].join("\n")),
      field("Benefits", [
        "A dedicated spot to post your videos.",
        "300 Robux if your video hits 20k+ views.",
        "Content Creator role."
      ].join("\n")),
      field("How to Apply", "Click the button below and send staff your TikTok/YouTube proof, video link, and follower proof inside the private ticket.")
    )
    .setFooter({ text: "Kaiju Reincarnated Content Creator Program" });

  if (icon) embed.setThumbnail(icon);
  return embed;
}

function buildCcPanelRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("cc:apply")
      .setLabel("Apply for Content Creator")
      .setStyle(ButtonStyle.Success)
  );
}

function buildCcTicketEmbed(user) {
  return baseEmbed("Content Creator Application Ticket", "#f59e0b")
    .setDescription("Staff will review your Content Creator application here. Send your proof in this channel.")
    .addFields(
      field("Applicant", `${user} (${user.id})`),
      field("Send These", [
        "1. Your TikTok or YouTube profile link.",
        "2. Screenshot/proof of follower count.",
        "3. Video link showing `discord.gg/kaijureincarnated` in the video and comments.",
        "4. Anything else staff should know."
      ].join("\n")),
      field("Staff Commands", "`!ccapprove` to approve inside this ticket, or `!ccdeny reason` to deny.")
    );
}

async function ensureCcTicketCategory(guild) {
  const existing = guild.channels.cache.find((channel) => (
    channel.type === ChannelType.GuildCategory
    && ["support", "ticket", "content creator"].some((word) => stripStyle(channel.name).includes(word))
  ));
  if (existing) return existing;

  return guild.channels.create({
    name: "CONTENT CREATOR APPLICATIONS",
    type: ChannelType.GuildCategory,
    permissionOverwrites: staffOverwrites(guild),
    reason: "Content Creator application tickets"
  }).catch(() => null);
}

function buildCcTicketOverwrites(guild, userId) {
  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.MentionEveryone] },
    botFullOverwrite(guild),
    {
      id: userId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles
      ],
      deny: [PermissionFlagsBits.MentionEveryone]
    }
  ];

  for (const role of getConfiguredCcTicketViewerRoles(guild)) {
    overwrites.push({
      id: role.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages
      ],
      deny: [PermissionFlagsBits.MentionEveryone]
    });
  }

  return uniqueOverwrites(overwrites);
}

function uniqueOverwrites(overwrites) {
  const byId = new Map();
  for (const overwrite of overwrites) {
    if (!byId.has(overwrite.id)) byId.set(overwrite.id, overwrite);
  }
  return [...byId.values()];
}

function getConfiguredCcRole(guild, settings = getGuildSettings(guild.id) || {}) {
  if (settings.ccRoleId) {
    const configured = guild.roles.cache.get(settings.ccRoleId);
    if (configured) return configured;
  }

  return guild.roles.cache.find((role) => normalizeRoleName(role.name) === "content creator")
    || guild.roles.cache.find((role) => normalizeRoleName(role.name).includes("content creator"))
    || null;
}

function getConfiguredCcReviewerRoles(guild, settings = getGuildSettings(guild.id) || {}) {
  const roleIds = Array.isArray(settings.ccReviewerRoleIds) ? settings.ccReviewerRoleIds : [];
  return roleIds.map((roleId) => guild.roles.cache.get(roleId)).filter(Boolean);
}

function getConfiguredCcTicketViewerRoles(guild, settings = getGuildSettings(guild.id) || {}) {
  const configuredViewerIds = Array.isArray(settings.ccTicketViewerRoleIds) ? settings.ccTicketViewerRoleIds : [];
  const viewerRoles = configuredViewerIds.map((roleId) => guild.roles.cache.get(roleId)).filter(Boolean);
  if (viewerRoles.length) return viewerRoles;

  // If admins only configured approvers, reuse those roles for ticket visibility.
  return getConfiguredCcReviewerRoles(guild, settings);
}

function normalizeRoleName(name = "") {
  return stripStyle(name).replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase();
}

function getRolesFromArgs(message, args) {
  const roles = [...message.mentions.roles.values()];
  for (const value of args) {
    const role = message.guild.roles.cache.get(cleanRoleId(value));
    if (role && !roles.some((existing) => existing.id === role.id)) roles.push(role);
  }
  return roles;
}

function cleanRoleId(value = "") {
  const match = String(value).match(/\d{15,25}/);
  return match?.[0] || null;
}

function getRoleManageError(guild, role) {
  const botMember = guild.members.me;
  if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) return "I need Manage Roles permission to give that role.";
  if (botMember.roles.highest.comparePositionTo(role) <= 0) return "I cannot give that role because my bot role is not above it.";
  return null;
}

async function resolveCcApplicant(message, args) {
  const explicitUser = await resolveUserArgument(message, args[0]);
  if (explicitUser) return { user: explicitUser, remainingArgs: args.slice(1) };

  const meta = getTicketMetaForChannel(message.guild.id, message.channel.id);
  if (meta?.type === "cc" && meta.ownerId) {
    const user = await message.client.users.fetch(meta.ownerId).catch(() => null);
    if (user) return { user, remainingArgs: args };
  }

  return { user: null, remainingArgs: args };
}

function markCcTicketReviewed(guildId, channelId, status, reviewerId) {
  const data = getGuildData(guildId);
  data.ticketMeta ||= {};
  if (data.ticketMeta[channelId]?.type === "cc") {
    data.ticketMeta[channelId].ccStatus = status;
    data.ticketMeta[channelId].ccReviewedBy = reviewerId;
    data.ticketMeta[channelId].ccReviewedAt = Date.now();
    saveGuildData(guildId, data);
  }
}

async function syncCcTicketViewerPermissions(guild) {
  const data = getGuildData(guild.id);
  data.ticketMeta ||= {};
  let synced = 0;

  for (const [channelId, meta] of Object.entries(data.ticketMeta)) {
    if (meta?.type !== "cc" || !meta.ownerId) continue;
    const channel = guild.channels.cache.get(channelId);
    if (!channel || channel.type !== ChannelType.GuildText) continue;

    const didSync = await channel.permissionOverwrites.set(
      buildCcTicketOverwrites(guild, meta.ownerId),
      "Sync Content Creator ticket visibility"
    ).then(() => {
      synced += 1;
      return true;
    }).catch((error) => {
      console.error("CC ticket permission sync failed:", error);
      return false;
    });
    if (!didSync) continue;

    if (meta.claimedBy) {
      const claimer = await guild.members.fetch(meta.claimedBy).catch(() => null);
      if (claimer) await hideClaimedTicketFromOtherMods(channel, claimer, meta.ownerId);
    }
    if (meta.closedAt) await lockTicketParticipants(channel, meta, meta.claimedBy);
  }

  return synced;
}

async function handleStaffAppSetup(message) {
  if (!isOwner(message.member)) return message.reply("Only the server owner can use `!staffapp`.");

  await message.reply("Mention the channel where staff application results should be sent.");
  const reply = await collectOneMessage(message.channel, message.author.id, QUESTION_TIMEOUT);
  if (!reply) return message.reply("Staff application setup timed out.");

  const resultChannel = reply.mentions.channels.first()
    || message.guild.channels.cache.get(cleanChannelId(reply.content));

  if (!resultChannel || resultChannel.type !== ChannelType.GuildText) {
    return message.reply("That is not a valid text channel. Run `!staffapp` again and mention a channel.");
  }
  const resultPermissions = resultChannel.permissionsFor(message.guild.members.me);
  if (!resultPermissions?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
    return message.reply(`I need View Channel, Send Messages, and Embed Links in ${resultChannel}.`);
  }

  const data = getGuildData(message.guild.id);
  data.staffAppConfig ||= {};
  data.staffAppConfig.resultChannelId = resultChannel.id;
  saveGuildData(message.guild.id, data);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`staffapp:start:${resultChannel.id}`)
      .setLabel("Apply for Staff")
      .setStyle(ButtonStyle.Primary)
  );

  await message.channel.send({
    embeds: [
      baseEmbed("Staff Applications")
        .setDescription("Click the button below to apply for staff. The bot will DM you the questions one by one.")
        .addFields(field("Results Channel", `${resultChannel}`))
    ],
    components: [row]
  });

  await message.reply(`Staff application panel posted. Results will go to ${resultChannel}.`);
}

async function handleStaffAppStart(interaction) {
  const resultChannelId = interaction.customId.split(":")[2];
  const resultChannel = interaction.guild.channels.cache.get(resultChannelId);
  if (!resultChannel) return interaction.reply({ content: "The staff application result channel no longer exists. Tell the owner to run `!staffapp` again.", ephemeral: true });

  const sessionKey = `${interaction.guild.id}:${interaction.user.id}`;
  if (activeStaffApplications.has(sessionKey)) {
    return interaction.reply({ content: "You already have a staff application in progress in your DMs.", ephemeral: true });
  }
  activeStaffApplications.add(sessionKey);

  await interaction.reply({ content: "Check your DMs. You have 20 minutes for each question.", ephemeral: true });

  try {
    const dm = await interaction.user.createDM().catch(() => null);
    if (!dm) {
      await interaction.followUp({ content: "I could not DM you. Please open your DMs and click the button again.", ephemeral: true }).catch(() => {});
      return;
    }

    const started = await dm.send(`Starting your ${BRAND} staff application. You have 20 minutes to answer each question.`).catch(() => null);
    if (!started) {
      await interaction.followUp({ content: "I could not send you a DM. Enable server-member DMs and click the button again.", ephemeral: true }).catch(() => {});
      return;
    }

    const answers = [];
    for (const question of STAFF_APP_QUESTIONS) {
      const answer = await askDmQuestion(dm, interaction.user.id, question, STAFF_APP_QUESTION_TIMEOUT);
      if (!answer) {
        await dm.send("Application timed out. Click the application button again when you are ready.").catch(() => {});
        return;
      }
      answers.push(answer);
    }

    const appId = Date.now().toString(36);
    const data = getGuildData(interaction.guild.id);
    data.staffApplications[appId] = {
      id: appId,
      userId: interaction.user.id,
      userTag: interaction.user.tag,
      answers,
      status: "Pending",
      resultChannelId,
      createdAt: Date.now()
    };
    saveGuildData(interaction.guild.id, data);

    const row = buildStaffAppReviewRow(interaction.user.id, appId);
    const sent = await resultChannel.send({
      embeds: [buildStaffApplicationEmbed(interaction.user, answers, "Pending")],
      components: [row]
    }).catch(() => null);

    if (sent) {
      data.staffApplications[appId].messageId = sent.id;
      saveGuildData(interaction.guild.id, data);
      await dm.send("Your staff application was submitted. Staff will review it soon.").catch(() => {});
    } else {
      await dm.send("I could not submit your application because the result channel is unavailable. Please tell staff.").catch(() => {});
    }
  } finally {
    activeStaffApplications.delete(sessionKey);
  }
}

async function handleStaffAppReview(interaction) {
  if (!isOwner(interaction.member)) return interaction.reply({ content: "Only the server owner can review staff applications.", ephemeral: true });

  const [, action, userId, appId] = interaction.customId.split(":");
  const data = getGuildData(interaction.guild.id);
  const app = data.staffApplications?.[appId];
  if (!app) return interaction.reply({ content: "That application record was not found.", ephemeral: true });

  let status = "Pending";
  let dmText = "";

  if (action === "approve") {
    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    const role = findRole(interaction.guild, ROLE_NAMES.trialMod);
    if (!member) return interaction.reply({ content: "The applicant is no longer in this server, so I cannot approve them.", ephemeral: true });
    if (!role) return interaction.reply({ content: "The Trial Moderator role does not exist. Run `!rolesetup` first.", ephemeral: true });
    if (!member.manageable) return interaction.reply({ content: "I cannot manage that applicant. Move my bot role above their highest role.", ephemeral: true });
    const roleError = getRoleManageError(interaction.guild, role);
    if (roleError) return interaction.reply({ content: roleError, ephemeral: true });

    const assignError = await member.roles.add(role, "Staff application approved").then(() => null).catch((error) => error);
    if (assignError) return interaction.reply({ content: `I could not give the Trial Moderator role: ${assignError.message}`, ephemeral: true });

    status = "Approved";
    dmText = `Your staff application for ${interaction.guild.name} was approved. Welcome to the team.`;
  }

  if (action === "decline") {
    status = "Declined";
    dmText = `Your staff application for ${interaction.guild.name} was declined.`;
  }

  if (action === "interview") {
    status = "Interview";
    dmText = `Staff wants to interview you for your ${interaction.guild.name} staff application. Please wait for the owner to contact you.`;
  }

  app.status = status;
  app.reviewedBy = interaction.user.id;
  app.reviewedAt = Date.now();
  saveGuildData(interaction.guild.id, data);

  const applicant = await interaction.client.users.fetch(userId).catch(() => null);
  if (applicant && dmText) await applicant.send(dmText).catch(() => {});

  await interaction.update({
    embeds: [buildStaffApplicationEmbed(applicant || { tag: app.userTag, id: userId }, app.answers, status)],
    components: [buildStaffAppReviewRow(userId, appId)]
  });
}

async function handleStaffLogVote(interaction) {
  if (!isAdmin(interaction.member)) {
    await interaction.reply({ content: "Only admins can approve, deny, or star staff logs.", ephemeral: true });
    return;
  }

  const [, vote, rawCaseId] = interaction.customId.split(":");
  const caseId = Number(rawCaseId);
  if (!caseId || Number.isNaN(caseId)) {
    await interaction.reply({ content: "That staff log button is missing its case ID.", ephemeral: true });
    return;
  }

  const data = getGuildData(interaction.guild.id);
  data.staffLogVotes ||= {};
  const record = data.staffLogVotes[caseId] ||= { up: [], down: [], star: [] };

  for (const key of ["up", "down", "star"]) {
    record[key] = record[key].filter((userId) => userId !== interaction.user.id);
  }
  if (record[vote]) record[vote].push(interaction.user.id);

  saveGuildData(interaction.guild.id, data);
  await interaction.reply({
    content: `Recorded ${vote === "up" ? "approval" : vote === "down" ? "denial" : "star"} for staff log case #${caseId}.`,
    ephemeral: true
  });
}

function buildStaffApplicationEmbed(user, answers, status) {
  const color = status === "Approved" ? "#22c55e" : status === "Declined" ? "#ef4444" : status === "Interview" ? "#f59e0b" : COLOR;
  return baseEmbed(`Staff Application - ${status}`, color)
    .setDescription(`Applicant: <@${user.id}> (${user.tag || user.id})`)
    .addFields(STAFF_APP_QUESTIONS.map((question, index) => field(`${index + 1}. ${question}`, (answers[index] || "No answer").slice(0, 300))))
    .setFooter({ text: "Owner-only review buttons. Interview can be changed later." });
}

function buildStaffAppReviewRow(userId, appId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`staffappreview:approve:${userId}:${appId}`).setLabel("Approved").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`staffappreview:decline:${userId}:${appId}`).setLabel("Decline").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`staffappreview:interview:${userId}:${appId}`).setLabel("Interview").setStyle(ButtonStyle.Primary)
  );
}

async function handleTicketButton(interaction) {
  const type = interaction.customId.split(":")[1];
  if (!TICKET_TYPES[type]) {
    return interaction.reply({ content: "That ticket option is no longer available. Please use the newest ticket panel.", ephemeral: true });
  }
  if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return interaction.reply({ content: "I need Manage Channels permission to create tickets.", ephemeral: true });
  }

  const data = getGuildData(interaction.guild.id);
  const existing = Object.entries(data.tickets).find(([key, channelId]) => key.startsWith(`${interaction.user.id}:`) && interaction.guild.channels.cache.has(channelId));
  if (existing) return interaction.reply({ content: `You already have an open ticket: <#${existing[1]}>`, ephemeral: true });

  const category = interaction.guild.channels.cache.find((channel) => channel.type === ChannelType.GuildCategory && channel.name === "🎫 SUPPORT")
    || await interaction.guild.channels.create({ name: "🎫 SUPPORT", type: ChannelType.GuildCategory, permissionOverwrites: staffOverwrites(interaction.guild) });

  const overwrites = [
    { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
    { id: interaction.guild.members.me.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
    ...STAFF_ROLES.map((name) => findRole(interaction.guild, name)).filter(Boolean).map((role) => ({ id: role.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }))
  ];

  const channel = await interaction.guild.channels.create({
    name: `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, ""),
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: overwrites,
    reason: "Support ticket"
  });

  data.tickets[`${interaction.user.id}:${type}`] = channel.id;
  data.ticketMeta ||= {};
  data.ticketMeta[channel.id] = {
    ownerId: interaction.user.id,
    type,
    claimedBy: null,
    createdAt: Date.now(),
    closedAt: null
  };
  data.analytics.tickets += 1;
  saveGuildData(interaction.guild.id, data);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ticketclose:${interaction.user.id}:${type}`).setLabel("Close Ticket").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`tickettranscript:${interaction.user.id}:${type}`).setLabel("Transcript").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`ticketdelete:${interaction.user.id}:${type}`).setLabel("Delete Ticket").setStyle(ButtonStyle.Danger)
  );

  await channel.send({ content: `${interaction.user}`, embeds: [baseEmbed(`${TICKET_TYPES[type]} Ticket`).setDescription("Staff will help you here. Explain the issue clearly.")], components: [row] });
  await interaction.reply({ content: `Created ${channel}`, ephemeral: true });
}

async function closeTicket(interaction) {
  if (!canManageTicket(interaction.member, interaction.channel)) {
    return interaction.reply({ content: "Only staff or a configured ticket role can close tickets.", ephemeral: true });
  }
  const meta = getTicketMetaForChannel(interaction.guild.id, interaction.channel.id);
  if (!meta) return interaction.reply({ content: "This ticket is not registered in storage.", ephemeral: true });
  if (meta.closedAt) return interaction.reply({ content: "This ticket is already closed.", ephemeral: true });

  const transcriptSaved = await saveTicketTranscript(interaction.channel, interaction.user, "closed");
  await lockTicketParticipants(interaction.channel, meta, interaction.user.id);
  const data = getGuildData(interaction.guild.id);
  data.ticketMeta ||= {};
  if (data.ticketMeta[interaction.channel.id]) data.ticketMeta[interaction.channel.id].closedAt = Date.now();
  incrementStaffStat(interaction.guild.id, interaction.user.id, "closedTickets", 1);
  saveGuildData(interaction.guild.id, data);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`tickettranscript:${interaction.customId.split(":")[1]}:closed`).setLabel("Send Transcript").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`ticketdelete:${interaction.customId.split(":")[1]}:closed`).setLabel("Delete Ticket").setStyle(ButtonStyle.Danger)
  );
  await interaction.reply({
    content: transcriptSaved
      ? "Ticket closed. A transcript was sent to transcript logs."
      : "Ticket closed, but I could not send the transcript. Check my access to #transcript-logs.",
    components: [row]
  });
}

async function deleteTicket(interaction) {
  if (!canManageTicket(interaction.member, interaction.channel)) {
    return interaction.reply({ content: "Only staff or a configured ticket role can delete tickets.", ephemeral: true });
  }
  if (!getTicketMetaForChannel(interaction.guild.id, interaction.channel.id)) {
    return interaction.reply({ content: "This ticket is not registered in storage.", ephemeral: true });
  }

  const transcriptSaved = await saveTicketTranscript(interaction.channel, interaction.user, "deleted");
  if (!transcriptSaved) {
    return interaction.reply({
      content: "I did not delete the ticket because its transcript could not be saved. Check my access to #transcript-logs and try again.",
      ephemeral: true
    });
  }
  const data = getGuildData(interaction.guild.id);
  data.ticketMeta ||= {};
  delete data.ticketMeta[interaction.channel.id];
  for (const [key, channelId] of Object.entries(data.tickets || {})) {
    if (channelId === interaction.channel.id) delete data.tickets[key];
  }
  incrementStaffStat(interaction.guild.id, interaction.user.id, "deletedTickets", 1);
  saveGuildData(interaction.guild.id, data);
  await interaction.reply("Deleting ticket...");
  await interaction.channel.delete("Ticket deleted").catch(() => {});
}

async function handleClaimTicket(message) {
  if (!canManageTicket(message.member, message.channel)) return message.reply("Only staff or a configured ticket role can claim tickets.");
  const meta = getTicketMetaForChannel(message.guild.id, message.channel.id);
  if (!meta) return message.reply("This command only works inside a ticket channel.");
  if (meta.closedAt) return message.reply("This ticket is already closed.");
  if (meta.claimedBy) return message.reply(`This ticket is already claimed by <@${meta.claimedBy}>.`);

  const data = getGuildData(message.guild.id);
  data.ticketMeta[message.channel.id].claimedBy = message.author.id;
  incrementStaffStat(message.guild.id, message.author.id, "claimedTickets", 1);
  saveGuildData(message.guild.id, data);
  await hideClaimedTicketFromOtherMods(message.channel, message.member, meta.ownerId);
  await message.channel.send(`${message.author} claimed this ticket.`);
}

async function handleTicketAdd(message) {
  if (!canManageTicket(message.member, message.channel)) return message.reply("Only staff or a configured ticket role can add people to tickets.");
  const member = message.mentions.members.first();
  if (!member) return message.reply("Usage: `!addinticket @user`");
  const meta = getTicketMetaForChannel(message.guild.id, message.channel.id);
  if (!meta) return message.reply("This command only works inside a ticket channel.");
  if (meta.closedAt) return message.reply("This ticket is already closed.");

  await message.channel.permissionOverwrites.edit(member.id, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true
  });
  await message.channel.send(`${member} was added to this ticket by ${message.author}.`);
}

async function handleTicketRemove(message) {
  if (!canManageTicket(message.member, message.channel)) return message.reply("Only staff or a configured ticket role can remove people from tickets.");
  const member = message.mentions.members.first();
  if (!member) return message.reply("Usage: `!removefromticket @user`");
  const meta = getTicketMetaForChannel(message.guild.id, message.channel.id);
  if (!meta) return message.reply("This command only works inside a ticket channel.");
  if (meta.closedAt) return message.reply("This ticket is already closed.");
  if (member.id === meta.ownerId) return message.reply("You cannot remove the ticket owner from their own ticket.");
  if (member.id === message.guild.members.me.id) return message.reply("You cannot remove the bot from a ticket.");

  await message.channel.permissionOverwrites.delete(member.id).catch(() => {});
  await message.channel.send(`${member} was removed from this ticket by ${message.author}.`);
}

async function handleTicketTranscript(interaction) {
  if (!canManageTicket(interaction.member, interaction.channel)) {
    return interaction.reply({ content: "Only staff or a configured ticket role can send transcripts.", ephemeral: true });
  }
  if (!getTicketMetaForChannel(interaction.guild.id, interaction.channel.id)) {
    return interaction.reply({ content: "This ticket is not registered in storage.", ephemeral: true });
  }
  const saved = await saveTicketTranscript(interaction.channel, interaction.user, "manual transcript");
  await interaction.reply({
    content: saved ? "Transcript sent to transcript logs." : "I could not send the transcript. Check my access to #transcript-logs.",
    ephemeral: true
  });
}

async function hideClaimedTicketFromOtherMods(channel, claimerMember, ownerId) {
  const guild = channel.guild;
  const keepVisible = new Set([ownerId, claimerMember.id, guild.members.me.id]);
  const meta = getTicketMetaForChannel(guild.id, channel.id);
  const rolesToHide = new Map(getStaffRoleObjects(guild).map((role) => [role.id, role]));

  if (meta?.type === "cc") {
    for (const role of [...getConfiguredCcTicketViewerRoles(guild), ...getConfiguredCcReviewerRoles(guild)]) {
      rolesToHide.set(role.id, role);
    }
  }

  for (const role of rolesToHide.values()) {
    if ([ROLE_NAMES.owner, ROLE_NAMES.admin].includes(role.name) || role.permissions.has(PermissionFlagsBits.Administrator)) {
      await channel.permissionOverwrites.edit(role.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      }).catch(() => {});
      continue;
    }

    await channel.permissionOverwrites.edit(role.id, { ViewChannel: false }).catch(() => {});
  }

  for (const id of keepVisible) {
    if (!id) continue;
    await channel.permissionOverwrites.edit(id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true
    }).catch(() => {});
  }
}

async function lockTicketParticipants(channel, meta, actingUserId) {
  const keepSending = new Set([
    channel.guild.members.me.id,
    actingUserId,
    meta.claimedBy
  ].filter(Boolean));

  for (const overwrite of channel.permissionOverwrites.cache.values()) {
    if (channel.guild.roles.cache.has(overwrite.id) || keepSending.has(overwrite.id)) continue;
    await channel.permissionOverwrites.edit(overwrite.id, { SendMessages: false }).catch(() => {});
  }
}

async function handleStaffStats(message, args = []) {
  if (!isStaff(message.member)) return message.reply("Only staff can view staff stats.");
  const target = await resolveUserArgument(message, args[0]) || message.author;
  const data = getGuildData(message.guild.id);
  const stats = data.staffStats?.[target.id] || {};
  const staffLogCases = (data.cases || []).filter((entry) => entry.type === "Staff Log" && entry.moderatorId === target.id);
  const approved = staffLogCases.filter((entry) => (data.staffLogVotes?.[entry.id]?.up || []).length > 0).length;
  const declined = staffLogCases.filter((entry) => (data.staffLogVotes?.[entry.id]?.down || []).length > 0).length;
  const starred = staffLogCases.filter((entry) => (data.staffLogVotes?.[entry.id]?.star || []).length > 0).length;

  await message.reply({
    embeds: [
      baseEmbed(`Staff Stats - ${target.tag}`)
        .addFields(
          field("Claimed Tickets", stats.claimedTickets || 0, true),
          field("Closed Tickets", stats.closedTickets || 0, true),
          field("Deleted Tickets", stats.deletedTickets || 0, true),
          field("Staff Logs", stats.logs || 0, true),
          field("Approved Logs", approved, true),
          field("Declined Logs", declined, true),
          field("Starred Logs", starred, true),
          field("Punishments", stats.punishments || 0, true)
        )
    ]
  });
}

function getTicketMetaForChannel(guildId, channelId) {
  return getGuildData(guildId).ticketMeta?.[channelId] || null;
}

async function saveTicketTranscript(channel, staffUser, action) {
  const messages = await fetchTicketTranscriptMessages(channel);
  if (!messages) return false;

  const lines = messages
    .map((message) => `[${message.createdAt.toISOString()}] ${message.author.tag}: ${message.content || "[no text content]"}${message.attachments.size ? ` Attachments: ${message.attachments.map((attachment) => attachment.url).join(", ")}` : ""}`);
  const transcript = [
    `Transcript for #${channel.name}`,
    `Action: ${action}`,
    `Staff: ${staffUser.tag} (${staffUser.id})`,
    `Created: ${new Date().toISOString()}`,
    "",
    ...lines
  ].join("\n");
  const attachment = new AttachmentBuilder(Buffer.from(transcript, "utf8"), {
    name: `transcript-${channel.name}-${Date.now()}.txt`
  });
  const logChannel = await ensureTranscriptLogChannel(channel.guild) || findChannel(channel.guild, "logs") || findChannel(channel.guild, "mod-logs");

  if (!logChannel) return false;

  return Boolean(await logChannel.send({
    embeds: [baseEmbed("Ticket Transcript").addFields(field("Ticket", `${channel.name}`, true), field("Action", action, true), field("Staff", staffUser.tag, true))],
    files: [attachment]
  }).catch(() => null));
}

async function fetchTicketTranscriptMessages(channel, limit = 1000) {
  const messages = [];
  let before;

  while (messages.length < limit) {
    const batch = await channel.messages.fetch({
      limit: Math.min(100, limit - messages.length),
      ...(before ? { before } : {})
    }).catch(() => null);

    if (!batch) return null;
    if (!batch.size) break;
    messages.push(...batch.values());
    before = batch.last()?.id;
    if (batch.size < 100) break;
  }

  return messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
}

async function ensureTranscriptLogChannel(guild) {
  const existing = findChannel(guild, "transcript-logs");
  if (existing) return existing;

  const staffCategory = guild.channels.cache.find((channel) => channel.type === ChannelType.GuildCategory && stripStyle(channel.name).includes("staff"));
  return guild.channels.create({
    name: "transcript-logs",
    type: ChannelType.GuildText,
    parent: staffCategory?.id || null,
    permissionOverwrites: staffOverwrites(guild),
    reason: "Ticket transcript logs"
  }).catch(() => null);
}

async function ensureStaffLogsChannel(guild) {
  const settings = getGuildSettings(guild.id) || {};
  const configured = settings.staffLogsChannelId ? guild.channels.cache.get(settings.staffLogsChannelId) : null;
  if (configured?.type === ChannelType.GuildText) return configured;

  const existing = findChannel(guild, "staff-logs");
  if (existing) return existing;

  const staffCategory = guild.channels.cache.find((channel) => channel.type === ChannelType.GuildCategory && stripStyle(channel.name).includes("staff"));
  const created = await guild.channels.create({
    name: "staff-logs",
    type: ChannelType.GuildText,
    parent: staffCategory?.id || null,
    permissionOverwrites: staffOverwrites(guild),
    reason: "Staff guideline logs"
  }).catch(() => null);
  return created || findChannel(guild, "logs") || findChannel(guild, "mod-logs");
}

async function handleBugReport(message) {
  const title = await ask(message, "Bug title?");
  if (!title) return;
  const description = await ask(message, "Describe the bug.");
  if (!description) return;
  const steps = await ask(message, "How can staff reproduce it?");
  if (!steps) return;
  const screenshots = await ask(message, "Screenshot/video link? Type `none` if you do not have one.");
  if (!screenshots) return;

  await findChannel(message.guild, "bug-reports")?.send({
    embeds: [
      baseEmbed("Bug Report", ERROR_COLOR)
        .addFields(
          field("Title", title.content),
          field("Description", description.content),
          field("Steps", steps.content),
          field("Screenshots", screenshots.content),
          field("Reported by", `${message.author}`)
        )
    ]
  }).catch(() => message.reply("I could not post in the bug reports channel."));
}

async function handleEvent(message) {
  if (!isModerator(message.member)) return message.reply("Only Moderator+ can create events.");
  const title = await ask(message, "Event title?");
  if (!title) return;
  const description = await ask(message, "Event description?");
  if (!description) return;
  const time = await ask(message, "Event time?");
  if (!time) return;
  const prize = await ask(message, "Prize/reward? Type `none` if there is none.");
  if (!prize) return;

  const channel = findChannel(message.guild, "events") || message.channel;
  const sent = await channel.send({
    embeds: [
      baseEmbed(title.content)
        .setDescription(description.content)
        .addFields(field("Time", time.content, true), field("Prize", prize.content, true), field("Host", `${message.author}`, true))
    ]
  });

  const data = getGuildData(message.guild.id);
  data.events[sent.id] = { title: title.content, channelId: channel.id, messageId: sent.id, ended: false, at: Date.now() };
  saveGuildData(message.guild.id, data);
}

async function handleEndEvent(message) {
  if (!isModerator(message.member)) return message.reply("Only Moderator+ can end events.");
  const data = getGuildData(message.guild.id);
  const active = Object.entries(data.events).find(([, event]) => !event.ended);
  if (!active) return message.reply("No active event found.");
  active[1].ended = true;
  saveGuildData(message.guild.id, data);
  await message.reply(`Ended event: **${active[1].title}**`);
}

async function handleGiveawayCreate(message) {
  if (!isModerator(message.member)) return message.reply("Only Moderator+ can create giveaways.");

  const prize = await ask(message, "What is the giveaway prize? Example: `500 Robux`, `Gamepass`, `Nitro`, etc.");
  if (!prize) return;

  const durationReply = await ask(message, "How long should it last? Example: `30m`, `2h`, `3d`, or `1 day`.", (reply) => Boolean(parseGiveawayDuration(reply.content)));
  if (!durationReply) return;
  const duration = parseGiveawayDuration(durationReply.content);

  const winnersReply = await ask(message, "How many winners? Type a number like `1`, `2`, or `3`.", (reply) => {
    const count = Number(reply.content.trim());
    return Number.isInteger(count) && count >= 1 && count <= 25;
  });
  if (!winnersReply) return;
  const winnersCount = Number(winnersReply.content.trim());

  const channelReply = await ask(message, "Where should I post it? Mention a channel or type `here`.");
  if (!channelReply) return;
  const channel = /^here$/i.test(channelReply.content.trim())
    ? message.channel
    : channelReply.mentions.channels.first() || message.guild.channels.cache.get(cleanChannelId(channelReply.content));
  if (!channel || channel.type !== ChannelType.GuildText) return message.reply("That was not a valid text channel. Run `!gcreate` again.");

  const giveawayId = Date.now().toString(36);
  const giveaway = {
    id: giveawayId,
    guildId: message.guild.id,
    channelId: channel.id,
    messageId: null,
    hostId: message.author.id,
    prize: prize.content.trim(),
    winnersCount,
    entries: [],
    endsAt: Date.now() + duration.ms,
    ended: false,
    createdAt: Date.now()
  };

  const sent = await channel.send({
    embeds: [buildGiveawayEmbed(giveaway)],
    components: [buildGiveawayRow(giveaway)]
  }).catch(() => null);

  if (!sent) return message.reply("I could not post the giveaway in that channel. Check my permissions.");

  giveaway.messageId = sent.id;
  const data = getGuildData(message.guild.id);
  data.giveaways ||= {};
  data.giveaways[giveawayId] = giveaway;
  saveGuildData(message.guild.id, data);

  await message.reply(`Giveaway created in ${channel}: **${giveaway.prize}** ending <t:${Math.floor(giveaway.endsAt / 1000)}:R>.`);
}

async function handleGiveawayEnter(interaction) {
  const giveawayId = interaction.customId.split(":")[2];
  const data = getGuildData(interaction.guild.id);
  const giveaway = data.giveaways?.[giveawayId];

  if (!giveaway) return interaction.reply({ content: "That giveaway was not found.", ephemeral: true });
  if (giveaway.ended || Date.now() >= giveaway.endsAt) return interaction.reply({ content: "That giveaway already ended.", ephemeral: true });

  giveaway.entries ||= [];
  if (giveaway.entries.includes(interaction.user.id)) {
    return interaction.reply({ content: "You are already entered in this giveaway.", ephemeral: true });
  }

  giveaway.entries.push(interaction.user.id);
  saveGuildData(interaction.guild.id, data);

  await interaction.update({
    embeds: [buildGiveawayEmbed(giveaway)],
    components: [buildGiveawayRow(giveaway)]
  }).catch(async () => {
    await interaction.reply({ content: "You entered the giveaway.", ephemeral: true }).catch(() => {});
  });
}

function buildGiveawayEmbed(giveaway, winners = []) {
  const ended = giveaway.ended;
  const title = ended ? "Giveaway Ended" : "Giveaway";
  const embed = baseEmbed(title, ended ? "#64748b" : "#f59e0b")
    .setDescription(`Prize: **${giveaway.prize}**`)
    .addFields(
      field("Winners", giveaway.winnersCount, true),
      field("Entries", giveaway.entries?.length || 0, true),
      field("Hosted By", `<@${giveaway.hostId}>`, true),
      field(ended ? "Ended" : "Ends", `<t:${Math.floor(giveaway.endsAt / 1000)}:${ended ? "F" : "R"}>`)
    )
    .setFooter({ text: ended ? "Giveaway closed" : "Click Enter Giveaway to join" });

  if (ended) {
    embed.addFields(field("Winner(s)", winners.length ? winners.map((id) => `<@${id}>`).join(", ") : "No valid entries"));
  }

  return embed;
}

function buildGiveawayRow(giveaway) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`giveaway:enter:${giveaway.id}`)
      .setLabel(giveaway.ended ? "Giveaway Ended" : "Enter Giveaway")
      .setStyle(giveaway.ended ? ButtonStyle.Secondary : ButtonStyle.Success)
      .setDisabled(Boolean(giveaway.ended))
  );
}

async function checkGiveaways() {
  for (const guild of client.guilds.cache.values()) {
    const data = getGuildData(guild.id);
    data.giveaways ||= {};
    let changed = false;

    for (const giveaway of Object.values(data.giveaways)) {
      if (giveaway.ended || Date.now() < giveaway.endsAt) continue;
      await endGiveaway(guild, giveaway).catch((error) => console.error("Giveaway end error:", error));
      changed = true;
    }

    if (changed) saveGuildData(guild.id, data);
  }
}

async function endGiveaway(guild, giveaway) {
  const data = getGuildData(guild.id);
  const fresh = data.giveaways?.[giveaway.id] || giveaway;
  if (fresh.ended) return;

  const entries = [...new Set(fresh.entries || [])];
  const winners = pickRandom(entries, Math.min(fresh.winnersCount || 1, entries.length));
  fresh.ended = true;
  fresh.winnerIds = winners;
  fresh.endedAt = Date.now();
  data.giveaways[fresh.id] = fresh;
  saveGuildData(guild.id, data);

  const channel = guild.channels.cache.get(fresh.channelId) || await guild.channels.fetch(fresh.channelId).catch(() => null);
  const message = channel ? await channel.messages.fetch(fresh.messageId).catch(() => null) : null;

  if (message) {
    await message.edit({
      embeds: [buildGiveawayEmbed(fresh, winners)],
      components: [buildGiveawayRow(fresh)]
    }).catch(() => {});
  }

  if (channel) {
    await channel.send(winners.length
      ? `Giveaway ended for **${fresh.prize}**. Winner(s): ${winners.map((id) => `<@${id}>`).join(", ")}`
      : `Giveaway ended for **${fresh.prize}**, but there were no valid entries.`
    ).catch(() => {});
  }
}

function pickRandom(items, count) {
  const copy = [...items];
  const winners = [];

  while (copy.length && winners.length < count) {
    const index = Math.floor(Math.random() * copy.length);
    winners.push(copy.splice(index, 1)[0]);
  }

  return winners;
}

function parseGiveawayDuration(input = "") {
  return parseTimeoutDuration(String(input).trim().split(/\s+/), 365 * DAY_MS);
}

async function handleXp(message) {
  return null;
}

async function applyLevelRewardRoles(member, level, settings) {
  const rewardRoles = settings.levelRewardRoles || {};

  for (const [requiredLevel, roleId] of Object.entries(rewardRoles)) {
    if (level < Number(requiredLevel)) continue;

    const role = member.guild.roles.cache.get(roleId) || await member.guild.roles.fetch(roleId).catch(() => null);
    if (!role || member.roles.cache.has(role.id)) continue;

    const botMember = member.guild.members.me;
    if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles) || botMember.roles.highest.comparePositionTo(role) <= 0) {
      await logTo(member.guild, "logs", "Level Reward Failed", [
        field("User", `${member}`),
        field("Role", role.name),
        field("Reason", "Bot role is not above the reward role or lacks Manage Roles.")
      ]);
      continue;
    }

    await member.roles.add(role, `Reached level ${requiredLevel}`).catch((error) => logTo(member.guild, "logs", "Level Reward Failed", [
      field("User", `${member}`),
      field("Role", role.name),
      field("Reason", error.message)
    ]));
  }
}

async function handleRank(message) {
  await message.reply("The built-in level system is disabled because Noctaly is handling levels now.");
}

function parseDonationAmount(value = "") {
  const normalized = String(value).replace(/[,_\s]/g, "");
  if (!/^\d+$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

function getEligibleDonationTierThresholds(total) {
  const safeTotal = Math.max(0, Number(total) || 0);
  return DONATION_ROLE_TIERS.filter((tier) => safeTotal >= tier.amount).map((tier) => tier.amount);
}

function formatRobux(amount) {
  return `${Math.max(0, Number(amount) || 0).toLocaleString("en-US")} Robux`;
}

function escapeLeaderboardText(value = "Unknown User") {
  return String(value).replace(/([\\`*_~|>])/g, "\\$1").slice(0, 80);
}

function buildDonationLeaderboardEmbed(guild) {
  const data = getGuildData(guild.id);
  const entries = Object.entries(data.donations || {})
    .map(([userId, record]) => ({
      userId,
      total: Math.max(0, Number(record?.total ?? record) || 0),
      userTag: record?.userTag || userId,
      updatedAt: Number(record?.updatedAt) || 0
    }))
    .filter((entry) => entry.total > 0)
    .sort((a, b) => b.total - a.total || a.updatedAt - b.updatedAt);

  const leaders = entries.slice(0, 20).map((entry, index) => {
    const member = guild.members.cache.get(entry.userId);
    const cachedUser = client.users.cache.get(entry.userId);
    const name = member?.displayName || cachedUser?.globalName || cachedUser?.username || entry.userTag;
    return `**${index + 1}. ${escapeLeaderboardText(name)}** - ${formatRobux(entry.total)}`;
  });

  const totalDonated = entries.reduce((sum, entry) => sum + entry.total, 0);
  return baseEmbed("Kaiju Reincarnated Donation Leaderboard", "#f59e0b")
    .setDescription(leaders.length ? leaders.join("\n") : "No donations have been recorded yet.")
    .setFooter({ text: `${entries.length} donor(s) | ${formatRobux(totalDonated)} total` });
}

async function updateDonationLeaderboard(guild) {
  const settings = getGuildSettings(guild.id) || {};
  if (!settings.donationLeaderboardChannelId) {
    return { ok: false, error: "No donation leaderboard channel is configured." };
  }

  const channel = guild.channels.cache.get(settings.donationLeaderboardChannelId)
    || await guild.channels.fetch(settings.donationLeaderboardChannelId).catch(() => null);
  if (!channel || !channel.isTextBased() || !channel.messages) {
    return { ok: false, error: "The configured donation leaderboard channel no longer exists or is not a text channel." };
  }

  const permissions = channel.permissionsFor(guild.members.me);
  if (!permissions?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
    return { ok: false, error: "I need View Channel, Send Messages, and Embed Links in the donation leaderboard channel." };
  }

  let boardMessage = null;
  if (settings.donationLeaderboardMessageId) {
    boardMessage = await channel.messages.fetch(settings.donationLeaderboardMessageId).catch(() => null);
    if (boardMessage?.author.id !== client.user.id) boardMessage = null;
  }

  const payload = {
    embeds: [buildDonationLeaderboardEmbed(guild)],
    allowedMentions: { parse: [] }
  };

  if (boardMessage) {
    await boardMessage.edit(payload);
    return { ok: true, created: false, channel, message: boardMessage };
  }

  boardMessage = await channel.send(payload);
  saveGuildSettings(guild.id, { donationLeaderboardMessageId: boardMessage.id });
  return { ok: true, created: true, channel, message: boardMessage };
}

async function syncDonationRoles(guild, userId, total, settings = getGuildSettings(guild.id) || {}) {
  const result = { added: [], removed: [], errors: [], deferred: false };
  const member = guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
  if (!member) {
    result.deferred = true;
    return result;
  }

  const eligible = new Set(getEligibleDonationTierThresholds(total));
  const seenRoleIds = new Set();

  for (const tier of DONATION_ROLE_TIERS) {
    const roleId = settings.donationTierRoleIds?.[tier.key];
    if (!roleId || seenRoleIds.has(roleId)) continue;
    seenRoleIds.add(roleId);

    const role = guild.roles.cache.get(roleId) || await guild.roles.fetch(roleId).catch(() => null);
    if (!role) {
      result.errors.push(`${tier.label}: configured role was not found`);
      continue;
    }

    const shouldHave = eligible.has(tier.amount);
    const hasRole = member.roles.cache.has(role.id);
    if (shouldHave === hasRole) continue;

    if (shouldHave && isUnsafeAutoRole(role)) {
      result.errors.push(`${role.name}: unsafe permissions prevent automatic assignment`);
      continue;
    }

    const roleError = getRoleManageError(guild, role);
    if (roleError) {
      result.errors.push(`${role.name}: ${roleError}`);
      continue;
    }

    try {
      if (shouldHave) {
        await member.roles.add(role, `Donation total reached ${formatRobux(tier.amount)}`);
        result.added.push(role.name);
      } else {
        await member.roles.remove(role, `Donation total fell below ${formatRobux(tier.amount)}`);
        result.removed.push(role.name);
      }
    } catch (error) {
      result.errors.push(`${role.name}: ${error.message}`);
    }
  }

  return result;
}

async function syncAllDonationRoles(guild, settings = getGuildSettings(guild.id) || {}) {
  const data = getGuildData(guild.id);
  const summary = { donors: 0, added: 0, removed: 0, errors: [] };

  for (const [userId, record] of Object.entries(data.donations || {})) {
    const total = Number(record?.total ?? record) || 0;
    if (total <= 0) continue;
    const result = await syncDonationRoles(guild, userId, total, settings);
    summary.donors += 1;
    summary.added += result.added.length;
    summary.removed += result.removed.length;
    summary.errors.push(...result.errors);
  }

  return summary;
}

async function removeObsoleteDonationRoles(guild, oldSettings, nextSettings) {
  const oldRoleIds = new Set(Object.values(oldSettings.donationTierRoleIds || {}).filter(Boolean));
  const nextRoleIds = new Set(Object.values(nextSettings.donationTierRoleIds || {}).filter(Boolean));
  const obsoleteRoleIds = [...oldRoleIds].filter((roleId) => !nextRoleIds.has(roleId));
  const result = { removed: 0, errors: [] };
  if (!obsoleteRoleIds.length) return result;

  const donorIds = Object.keys(getGuildData(guild.id).donations || {});
  for (const userId of donorIds) {
    const member = guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
    if (!member) continue;

    for (const roleId of obsoleteRoleIds) {
      if (!member.roles.cache.has(roleId)) continue;
      const role = guild.roles.cache.get(roleId) || await guild.roles.fetch(roleId).catch(() => null);
      if (!role) continue;
      const roleError = getRoleManageError(guild, role);
      if (roleError) {
        result.errors.push(`${role.name}: ${roleError}`);
        continue;
      }

      await member.roles.remove(role, "Donation reward role configuration changed")
        .then(() => { result.removed += 1; })
        .catch((error) => result.errors.push(`${role.name}: ${error.message}`));
    }
  }

  return result;
}

async function collectDonationConfigReply(message, question) {
  await message.channel.send(question);
  const reply = await collectOneMessage(message.channel, message.author.id, QUESTION_TIMEOUT);
  if (!reply) await message.channel.send("Donation leaderboard configuration timed out. Run `!leaderboard configure` to start again.");
  return reply;
}

async function handleDonationLeaderboardConfigure(message) {
  if (!isAdmin(message.member)) return message.reply("Only admins can configure the donation leaderboard.");

  const sessionKey = `${message.guild.id}:${message.author.id}`;
  if (activeDonationConfigurations.has(sessionKey)) return message.reply("You already have a donation leaderboard configuration in progress.");
  activeDonationConfigurations.add(sessionKey);

  try {
    const channelReply = await collectDonationConfigReply(
      message,
      "Mention the text channel for the automatically updated donation leaderboard, or type `here` to use this channel."
    );
    if (!channelReply) return null;

    const channel = channelReply.content.trim().toLowerCase() === "here"
      ? message.channel
      : channelReply.mentions.channels.first() || message.guild.channels.cache.get(cleanChannelId(channelReply.content));
    if (!channel || ![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(channel.type)) {
      return message.reply("That was not a valid server text channel. Run `!leaderboard configure` again.");
    }

    const channelPermissions = channel.permissionsFor(message.guild.members.me);
    if (!channelPermissions?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
      return message.reply("I need View Channel, Send Messages, and Embed Links in that channel before it can hold the leaderboard.");
    }

    const tierRoleIds = {};
    const selectedRoleIds = new Set();
    for (const tier of DONATION_ROLE_TIERS) {
      const reply = await collectDonationConfigReply(
        message,
        `Mention the **${tier.label}** role for the **${formatRobux(tier.amount)}** tier, or type \`none\` to skip it. Perk: ${tier.perk}.`
      );
      if (!reply) return null;
      if (["none", "skip"].includes(reply.content.trim().toLowerCase())) continue;

      const role = reply.mentions.roles.first() || message.guild.roles.cache.get(cleanRoleId(reply.content));
      if (!role || role.id === message.guild.roles.everyone.id) {
        return message.reply(`That was not a valid role for ${tier.label}. Run \`!leaderboard configure\` again.`);
      }
      if (selectedRoleIds.has(role.id)) {
        return message.reply(`The ${role.name} role was already selected for another donation tier. Each tier needs a different role.`);
      }
      if (isUnsafeAutoRole(role)) {
        return message.reply(`I will not automatically assign ${role.name} because it has admin, moderation, management, or mass-ping permissions.`);
      }
      const roleError = getRoleManageError(message.guild, role);
      if (roleError) return message.reply(`${role.name}: ${roleError}`);

      selectedRoleIds.add(role.id);
      tierRoleIds[tier.key] = role.id;
    }

    const oldSettings = getGuildSettings(message.guild.id) || {};
    if (oldSettings.donationLeaderboardChannelId && oldSettings.donationLeaderboardChannelId !== channel.id && oldSettings.donationLeaderboardMessageId) {
      const oldChannel = message.guild.channels.cache.get(oldSettings.donationLeaderboardChannelId)
        || await message.guild.channels.fetch(oldSettings.donationLeaderboardChannelId).catch(() => null);
      const oldBoard = oldChannel?.isTextBased()
        ? await oldChannel.messages.fetch(oldSettings.donationLeaderboardMessageId).catch(() => null)
        : null;
      if (oldBoard?.author.id === client.user.id) await oldBoard.delete().catch(() => {});
    }

    const nextSettings = saveGuildSettings(message.guild.id, {
      ...oldSettings,
      donationLeaderboardChannelId: channel.id,
      donationLeaderboardMessageId: oldSettings.donationLeaderboardChannelId === channel.id
        ? oldSettings.donationLeaderboardMessageId || null
        : null,
      donationTierRoleIds: tierRoleIds
    });

    const obsoleteRoleSync = await removeObsoleteDonationRoles(message.guild, oldSettings, nextSettings);
    const roleSync = await syncAllDonationRoles(message.guild, nextSettings);
    roleSync.removed += obsoleteRoleSync.removed;
    roleSync.errors.push(...obsoleteRoleSync.errors);
    const leaderboard = await updateDonationLeaderboard(message.guild).catch((error) => ({ ok: false, error: error.message }));
    const roleList = DONATION_ROLE_TIERS.flatMap((tier) => {
      const role = message.guild.roles.cache.get(tierRoleIds[tier.key]);
      return role ? [`${formatRobux(tier.amount)}: ${role.name}`] : [];
    });

    return message.reply({
      embeds: [
        baseEmbed("Donation Leaderboard Configured", "#f59e0b")
          .addFields(
            field("Leaderboard Channel", channel.name),
            field("Automatic Roles", roleList.length ? roleList.join("\n") : "No automatic roles configured"),
            field("Existing Donors Synced", `${roleSync.donors} checked; ${roleSync.added} role(s) added; ${roleSync.removed} role(s) removed`),
            field("Leaderboard", leaderboard.ok ? `Ready in ${channel.name}` : leaderboard.error),
            field("Errors", roleSync.errors.length ? roleSync.errors.slice(0, 10).join("\n") : "None")
          )
          .setFooter({ text: "Reward roles are cumulative and update whenever a donation changes." })
      ],
      allowedMentions: { parse: [], repliedUser: false }
    });
  } finally {
    activeDonationConfigurations.delete(sessionKey);
  }
}

async function handleLeaderboard(message, args = []) {
  if (["configure", "config", "setup"].includes((args[0] || "").toLowerCase())) {
    return handleDonationLeaderboardConfigure(message);
  }

  const settings = getGuildSettings(message.guild.id) || {};
  if (settings.donationLeaderboardChannelId) {
    const updated = await updateDonationLeaderboard(message.guild).catch((error) => ({ ok: false, error: error.message }));
    if (message.channel.id === settings.donationLeaderboardChannelId && updated.ok) {
      return replyWithoutMentions(message, `Donation leaderboard updated: ${updated.message.url}`);
    }
  }

  await message.reply({
    embeds: [buildDonationLeaderboardEmbed(message.guild)],
    allowedMentions: { parse: [], repliedUser: false }
  });
}

async function changeDonation(message, args, direction) {
  if (!isAdmin(message.member)) return message.reply("Only admins can add or remove recorded donations.");

  const user = await resolveUserArgument(message, args[0]);
  const amount = parseDonationAmount(args.slice(1).join(""));
  const commandName = direction > 0 ? "donation" : "donationremove";
  if (!user || !amount) return message.reply(`Usage: \`!${commandName} @user donationAmount\`. Example: \`!${commandName} @user 1,000\`.`);

  const data = getGuildData(message.guild.id);
  data.donations ||= {};
  const currentRecord = data.donations[user.id];
  const oldTotal = Math.max(0, Number(currentRecord?.total ?? currentRecord) || 0);
  if (direction < 0 && oldTotal <= 0) return message.reply(`${user.tag} has no recorded donations to remove.`);

  const newTotal = direction > 0 ? oldTotal + amount : Math.max(0, oldTotal - amount);
  const changedAmount = Math.abs(newTotal - oldTotal);
  if (newTotal > 0) {
    data.donations[user.id] = { total: newTotal, userTag: user.tag, updatedAt: Date.now() };
  } else {
    delete data.donations[user.id];
  }
  saveGuildData(message.guild.id, data);

  const settings = getGuildSettings(message.guild.id) || {};
  const roleSync = await syncDonationRoles(message.guild, user.id, newTotal, settings);
  const leaderboard = await updateDonationLeaderboard(message.guild).catch((error) => ({ ok: false, error: error.message }));
  const action = direction > 0 ? "Added" : "Removed";
  const roleChanges = [
    roleSync.added.length ? `Added: ${roleSync.added.join(", ")}` : null,
    roleSync.removed.length ? `Removed: ${roleSync.removed.join(", ")}` : null,
    roleSync.deferred ? "Role sync deferred until the donor rejoins the server." : null,
    roleSync.errors.length ? `Errors: ${roleSync.errors.join("; ")}` : null
  ].filter(Boolean).join("\n") || "No role changes";

  await logTo(message.guild, "logs", `Donation ${action}`, [
    field("Donor", `${user.tag} (${user.id})`),
    field("Amount", formatRobux(changedAmount), true),
    field("New Total", formatRobux(newTotal), true),
    field("Updated By", `${message.author.tag} (${message.author.id})`),
    field("Reward Roles", roleChanges)
  ]);

  await message.reply({
    embeds: [
      baseEmbed(`Donation ${action}`, direction > 0 ? "#22c55e" : "#ef4444")
        .addFields(
          field("Donor", `${user.tag} (${user.id})`),
          field("Change", `${direction > 0 ? "+" : "-"}${formatRobux(changedAmount)}`, true),
          field("New Total", formatRobux(newTotal), true),
          field("Reward Roles", roleChanges),
          field("Leaderboard", leaderboard.ok ? `Updated in ${leaderboard.channel.name}` : `${leaderboard.error} Run \`!leaderboard configure\`.`)
        )
    ],
    allowedMentions: { parse: [], repliedUser: false }
  });
}

async function handleDonation(message, args) {
  return changeDonation(message, args, 1);
}

async function handleDonationRemove(message, args) {
  return changeDonation(message, args, -1);
}

async function refreshDonationLeaderboards() {
  for (const guild of client.guilds.cache.values()) {
    const settings = getGuildSettings(guild.id) || {};
    if (!settings.donationLeaderboardChannelId) continue;
    await updateDonationLeaderboard(guild).catch((error) => console.error(`Donation leaderboard refresh failed for ${guild.id}:`, error));
  }
}

async function handleAnalytics(message) {
  if (!isAdmin(message.member)) return message.reply("Only admins can use `!analytics`.");
  const data = getGuildData(message.guild.id).analytics;
  const topChannel = Object.entries(data.channelMessages).sort(([, a], [, b]) => b - a)[0];
  await message.reply({
    embeds: [
      baseEmbed("Server Analytics")
        .addFields(
          field("Messages", data.messages, true),
          field("Joins", data.joins, true),
          field("Leaves", data.leaves, true),
          field("Tickets", data.tickets, true),
          field("Suggestions", data.suggestions, true),
          field("Reviews", data.reviews, true),
          field("Punishments", data.punishments, true),
          field("Top channel", topChannel ? `<#${topChannel[0]}> (${topChannel[1]})` : "None", true)
        )
    ]
  });
}

async function handleServerStats(message) {
  const data = getGuildData(message.guild.id);
  await message.reply({
    embeds: [
      baseEmbed("Server Stats")
        .addFields(
          field("Members", message.guild.memberCount, true),
          field("Open tickets", Object.values(data.tickets).filter((id) => message.guild.channels.cache.has(id)).length, true),
          field("Suggestions", data.suggestions.length, true),
          field("Reviews", data.reviews.length, true)
        )
    ]
  });
}

async function handleWarn(message, args) {
  if (!canWarn(message.member)) return message.reply("Only staff with warning permission can warn users.");
  const user = await resolveUserArgument(message, args[0]);
  if (!user) return message.reply("Usage: `!warn @user-or-id reason`");
  const member = await message.guild.members.fetch(user.id).catch(() => null);
  const targetCheck = canModerateTarget(message.member, member, "warn");
  if (!targetCheck.ok) return message.reply(targetCheck.reason);
  const reason = args.slice(1).join(" ") || "No reason provided";
  const data = getGuildData(message.guild.id);
  data.warnings[user.id] ||= [];
  const caseId = addCase(data, {
    type: "Warn",
    userId: user.id,
    userTag: user.tag,
    moderatorId: message.author.id,
    moderatorTag: message.author.tag,
    reason
  });
  data.warnings[user.id].push({ caseId, reason, moderatorId: message.author.id, at: Date.now() });
  saveGuildData(message.guild.id, data);
  await user.send(`You were warned in ${message.guild.name}: ${reason}`).catch(() => {});
  await logModeration(message.guild, "Warn", user, message.author, `${reason} | Case #${caseId}`);
  await message.reply(`Warned ${user.tag}. Case #${caseId}.`);
}

async function handleWarnings(message) {
  if (!canWarn(message.member)) return message.reply("Only staff can view warnings.");
  const user = await resolveUserArgument(message, [...message.content.trim().split(/\s+/)].slice(1)[0]) || message.author;
  const warnings = getGuildData(message.guild.id).warnings[user.id] || [];
  await message.reply({ embeds: [baseEmbed(`Warnings for ${user.tag}`).setDescription(warnings.map((warning, index) => `${index + 1}. Case #${warning.caseId || "old"} - ${warning.reason} - <@${warning.moderatorId}>`).join("\n") || "No warnings.")] });
}

async function handleUnwarn(message, args) {
  if (!canManageWarnings(message.member)) return message.reply("Only Moderator+ can remove warnings.");

  const user = await resolveUserArgument(message, args[0]);
  if (!user) return message.reply("Usage: `!unwarn @user-or-id [warning number/case id] [reason]`");
  const member = await message.guild.members.fetch(user.id).catch(() => null);
  const targetCheck = canModerateTarget(message.member, member, "remove warnings from");
  if (!targetCheck.ok) return message.reply(targetCheck.reason);

  const data = getGuildData(message.guild.id);
  const warnings = data.warnings[user.id] || [];
  if (!warnings.length) return message.reply(`${user.tag} has no warnings.`);

  const requested = args[1] ? Number(String(args[1]).replace("#", "")) : null;
  let index = warnings.length - 1;
  if (requested && !Number.isNaN(requested)) {
    const byCase = warnings.findIndex((warning) => Number(warning.caseId) === requested);
    index = byCase >= 0 ? byCase : requested - 1;
  }

  if (index < 0 || index >= warnings.length) return message.reply("That warning number/case id was not found.");

  const removed = warnings.splice(index, 1)[0];
  const reason = args.slice(requested ? 2 : 1).join(" ") || "Warning removed";
  const caseId = addCase(data, {
    type: "Unwarn",
    userId: user.id,
    userTag: user.tag,
    moderatorId: message.author.id,
    moderatorTag: message.author.tag,
    reason,
    details: `Removed warning case #${removed.caseId || "old"}`
  });

  saveGuildData(message.guild.id, data);
  await logModeration(message.guild, "Unwarn", user, message.author, `${reason} | Removed warning: ${removed.reason} | Case #${caseId}`);
  await message.reply(`Removed a warning from ${user.tag}. Case #${caseId}.`);
}

async function handlePunish(message, args) {
  if (!canWarn(message.member)) return message.reply("Only staff with moderation permissions can use `!punish`.");

  const user = await resolveUserArgument(message, args[0]);
  const ruleKey = normalizePunishmentRule(args[1]);
  const rawReason = args.slice(2).join(" ").trim();
  const severe = /\b(severe|bad|very bad|racism|homophobia|image|images|disgusting|porn)\b/i.test(rawReason);

  if (!user || !ruleKey) {
    await message.reply({
      embeds: [
        baseEmbed("Punishment Usage", ERROR_COLOR)
          .setDescription("Usage: `!punish @user rule [reason/severity]`\nReply to the rule-breaking message when using this command and the bot will delete that message if possible.")
          .addFields(field("Rules", Object.keys(PUNISHMENT_RULES).map((key) => `\`${key}\` - ${PUNISHMENT_RULES[key].label}`).join("\n").slice(0, 1024)))
      ]
    });
    return;
  }

  const member = await message.guild.members.fetch(user.id).catch(() => null);
  const targetCheck = canModerateTarget(message.member, member, "punish");
  if (!targetCheck.ok) return message.reply(targetCheck.reason);

  const referencedMessage = await fetchReferencedMessage(message);
  const deleted = referencedMessage ? await referencedMessage.delete().then(() => true).catch(() => false) : false;
  const data = getGuildData(message.guild.id);
  data.punishments ||= {};
  const record = data.punishments[user.id] ||= { history: [], counts: {} };
  const nextCount = (record.counts[ruleKey] || 0) + 1;
  let punishment = limitPunishmentForMember(determinePunishment(ruleKey, nextCount, severe), message.member);
  if (!member && punishment.action === "timeout") punishment = { action: "warn" };
  const reason = rawReason || PUNISHMENT_RULES[ruleKey].label;
  const evidence = referencedMessage?.content || "No replied message content.";

  record.counts[ruleKey] = nextCount;
  record.history.push({
    rule: ruleKey,
    action: punishment.action,
    days: punishment.days || null,
    reason,
    moderatorId: message.author.id,
    evidence,
    deleted,
    at: Date.now()
  });
  const caseId = addCase(data, {
    type: formatPunishment(punishment),
    userId: user.id,
    userTag: user.tag,
    moderatorId: message.author.id,
    moderatorTag: message.author.tag,
    reason,
    details: `${PUNISHMENT_RULES[ruleKey].label}; offense count ${nextCount}; deleted message: ${deleted ? "yes" : "no"}`
  });

  if (punishment.action === "warn") {
    data.warnings[user.id] ||= [];
    data.warnings[user.id].push({ caseId, reason: `${PUNISHMENT_RULES[ruleKey].label}: ${reason}`, moderatorId: message.author.id, at: Date.now() });
  }

  data.analytics.punishments += 1;
  saveGuildData(message.guild.id, data);

  const actionError = await applyPunishmentAction(message.guild, user, member, punishment, reason, message.author)
    .then(() => null)
    .catch((error) => error);
  if (actionError) {
    const caseEntry = data.cases.find((entry) => entry.id === caseId);
    if (caseEntry) caseEntry.details = `${caseEntry.details}; action failed: ${actionError.message}`;
    saveGuildData(message.guild.id, data);
  }
  await logPunishment(message.guild, user, message.author, ruleKey, punishment, reason, evidence, deleted, nextCount, caseId);
  await message.reply(actionError
    ? `Case #${caseId} was saved, but I could not apply **${formatPunishment(punishment)}**: ${actionError.message}`
    : `Punishment applied to **${user.tag}**: **${formatPunishment(punishment)}** for **${PUNISHMENT_RULES[ruleKey].label}**. Case #${caseId}.`
  );
}

async function handleStaffLog(message) {
  if (!canWarn(message.member)) return message.reply("Only staff with moderation permissions can use `!log`.");

  await message.channel.send("Staff log started. Send the user's mention or user ID.");
  const userReply = await collectOneMessage(message.channel, message.author.id);
  if (!userReply) return message.channel.send("Timed out. Please run `!log` again.");

  const user = await resolveUserArgument(userReply, userReply.content);
  if (!user) return message.channel.send("I could not find that user. Run `!log` again and send a valid mention or user ID.");

  const member = await message.guild.members.fetch(user.id).catch(() => null);
  const targetCheck = canModerateTarget(message.member, member, "log/punish");
  if (!targetCheck.ok) return message.channel.send(targetCheck.reason);

  await message.channel.send({
    embeds: [
      baseEmbed("Choose Guideline Rule")
        .setDescription("Reply with a rule key or a close name, like `spamming`, `verbal warning spamming`, `advertisement`, `slurs`, or `hard nsfw`.")
        .addFields(...buildStaffLogRuleFields())
    ]
  });
  const ruleReply = await collectOneMessage(message.channel, message.author.id);
  if (!ruleReply) return message.channel.send("Timed out. Please run `!log` again.");

  const rule = findStaffLogRule(ruleReply.content);
  if (!rule) return message.channel.send("I could not match that to a staff guideline rule. Run `!log` again and use one of the rule keys shown.");

  await message.channel.send("Send proof now. A screenshot attachment, message link, or clear text proof is okay.");
  const proofReply = await collectOneMessage(message.channel, message.author.id, 5 * 60 * 1000);
  if (!proofReply) return message.channel.send("Timed out waiting for proof. Please run `!log` again.");

  await message.channel.send("Any extra notes? Type `none` if there are no notes.");
  const notesReply = await collectOneMessage(message.channel, message.author.id);
  if (!notesReply) return message.channel.send("Timed out. Please run `!log` again.");

  const proof = getMessageProof(proofReply);
  const notes = /^none$/i.test(notesReply.content.trim()) ? "None" : notesReply.content.trim();
  const referencedMessage = await fetchReferencedMessage(message);
  const deleted = referencedMessage ? await referencedMessage.delete().then(() => true).catch(() => false) : false;
  const data = getGuildData(message.guild.id);
  data.staffLogPoints ||= {};
  data.warnings ||= {};
  data.analytics ||= { punishments: 0, joins: 0, leaves: 0, messages: 0, tickets: 0, suggestions: 0, reviews: 0, channelMessages: {}, activeUsers: {} };
  data.analytics.punishments = (data.analytics.punishments || 0) + 1;

  const pointRecord = data.staffLogPoints[user.id] ||= { points: 0, history: [] };
  const beforePoints = Number(pointRecord.points || 0);
  const recommended = determineStaffLogPunishment(rule, beforePoints);
  let applied = limitPunishmentForMember(recommended, message.member);
  if (!member && applied.action === "timeout") applied = { action: "warn" };
  const totalPoints = recommended.action === "ban" ? STAFF_LOG_MAX_POINTS : Math.min(STAFF_LOG_MAX_POINTS, beforePoints + rule.points);
  const needsAdmin = formatPunishment(applied) !== formatPunishment(recommended);
  const reason = `${rule.section}: ${rule.label}`;

  pointRecord.points = totalPoints;
  pointRecord.history.push({
    ruleKey: rule.key,
    points: rule.points,
    totalPoints,
    recommended: formatPunishment(recommended),
    applied: formatPunishment(applied),
    moderatorId: message.author.id,
    proof,
    notes,
    at: Date.now()
  });

  const caseId = addCase(data, {
    type: "Staff Log",
    userId: user.id,
    userTag: user.tag,
    moderatorId: message.author.id,
    moderatorTag: message.author.tag,
    reason,
    details: `Rule ${rule.key}; points ${rule.points}; total ${totalPoints}/${STAFF_LOG_MAX_POINTS}; recommended ${formatPunishment(recommended)}; applied ${formatPunishment(applied)}`
  });

  if (applied.action === "warn") {
    data.warnings[user.id] ||= [];
    data.warnings[user.id].push({ caseId, reason, moderatorId: message.author.id, at: Date.now() });
  }

  const staff = data.staffStats?.[message.author.id] || { claimedTickets: 0, closedTickets: 0, deletedTickets: 0, punishments: 0, logs: 0 };
  data.staffStats ||= {};
  staff.logs = (staff.logs || 0) + 1;
  staff.punishments = (staff.punishments || 0) + 1;
  data.staffStats[message.author.id] = staff;
  saveGuildData(message.guild.id, data);

  const actionError = await applyPunishmentAction(message.guild, user, member, applied, `${reason} | Case #${caseId}`, message.author)
    .then(() => null)
    .catch((error) => error);

  const logChannel = await ensureStaffLogsChannel(message.guild);
  const embed = baseEmbed(`Staff Log Case #${caseId}`, needsAdmin ? ERROR_COLOR : COLOR)
    .setDescription(actionError ? "Guideline log created, but Discord blocked the action. Check bot permissions/role hierarchy." : needsAdmin ? "Recommended action is above this staff member's permissions. Admin review is needed." : "Guideline log created and action applied.")
    .addFields(
      field("Rule Broken", `${rule.section} - ${rule.label}`),
      field("User", `${user.tag} (${user.id})`),
      field("User Points", `${totalPoints}/${STAFF_LOG_MAX_POINTS}`, true),
      field("Points Added", rule.points, true),
      field("Staff Punishment", formatPunishment(applied), true),
      field("Recommended", formatPunishment(recommended), true),
      field("Staff", `${message.author.tag} (${message.author.id})`),
      field("Additional Action", needsAdmin ? "Yes - admin review needed" : "No", true),
      field("Broken Message Deleted", deleted ? "Yes" : "No", true),
      field("Proof", proof.slice(0, 1000)),
      field("Notes", notes.slice(0, 1000)),
      ...(actionError ? [field("Action Error", actionError.message.slice(0, 1000))] : [])
    )
    .setFooter({ text: "Admins can use the buttons to approve, deny, or star the log." });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`stafflogvote:down:${caseId}`).setEmoji("👎").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`stafflogvote:up:${caseId}`).setEmoji("👍").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`stafflogvote:star:${caseId}`).setEmoji("⭐").setStyle(ButtonStyle.Secondary)
  );

  if (logChannel) await logChannel.send({ embeds: [embed], components: [row] }).catch(() => {});
  await message.reply(`Staff log created for **${user.tag}**. Case #${caseId}. Applied: **${formatPunishment(applied)}**.`);
}

async function handleCases(message) {
  if (!canWarn(message.member)) return message.reply("Only staff can view cases.");

  const targetArg = [...message.content.trim().split(/\s+/)].slice(1)[0];
  const caseNumber = Number(String(targetArg || "").replace("#", ""));
  const data = getGuildData(message.guild.id);

  if (caseNumber && !Number.isNaN(caseNumber)) {
    const entry = (data.cases || []).find((item) => Number(item.id) === caseNumber);
    if (!entry) return message.reply(`Case #${caseNumber} was not found.`);
    return message.reply({
      embeds: [
        baseEmbed(`Case #${entry.id} - ${entry.type}`)
          .addFields(
            field("User", `<@${entry.userId}> (${entry.userId})`),
            field("Moderator", entry.moderatorId === "unknown" ? "Unknown" : `<@${entry.moderatorId}> (${entry.moderatorId})`),
            field("Reason", entry.reason),
            field("Details", entry.details || "None"),
            field("Time", `<t:${Math.floor(entry.at / 1000)}:F>`)
          )
      ]
    });
  }

  const user = await resolveUserArgument(message, targetArg);
  const cases = (data.cases || []).filter((entry) => !user || entry.userId === user.id).slice(-15).reverse();

  if (!cases.length) {
    await message.reply(user ? `${user.tag} has no cases.` : "No cases found.");
    return;
  }

  await message.reply({
    embeds: [
      baseEmbed(user ? `Cases for ${user.tag}` : "Recent Cases")
        .setDescription(cases.map((entry) => [
          `**Case #${entry.id} - ${entry.type}**`,
          `User: <@${entry.userId}> (${entry.userId})`,
          `Moderator: <@${entry.moderatorId}>`,
          `Reason: ${entry.reason}`,
          entry.details ? `Details: ${entry.details}` : null,
          `Time: <t:${Math.floor(entry.at / 1000)}:R>`
        ].filter(Boolean).join("\n")).join("\n\n").slice(0, 4000))
    ]
  });
}

async function handleRemoveCase(message, args) {
  if (!canManageWarnings(message.member)) return message.reply("Only Moderator+ can remove cases.");

  const user = await resolveUserArgument(message, args[0]);
  const caseId = Number(String(args[1] || "").replace("#", ""));
  if (!user || !caseId || Number.isNaN(caseId)) return message.reply("Usage: `!removecase @user-or-id caseNumber`");
  const member = await message.guild.members.fetch(user.id).catch(() => null);
  const targetCheck = canModerateTarget(message.member, member, "remove cases from");
  if (!targetCheck.ok) return message.reply(targetCheck.reason);

  const data = getGuildData(message.guild.id);
  data.cases ||= [];
  const index = data.cases.findIndex((entry) => Number(entry.id) === caseId && entry.userId === user.id);
  if (index < 0) return message.reply(`Case #${caseId} was not found for ${user.tag}.`);

  const [removed] = data.cases.splice(index, 1);
  if (data.warnings?.[user.id]) {
    data.warnings[user.id] = data.warnings[user.id].filter((warning) => Number(warning.caseId) !== caseId);
  }

  const auditCaseId = addCase(data, {
    type: "Case Removed",
    userId: user.id,
    userTag: user.tag,
    moderatorId: message.author.id,
    moderatorTag: message.author.tag,
    reason: `Removed case #${caseId}`,
    details: `${removed.type}: ${removed.reason}`
  });

  saveGuildData(message.guild.id, data);
  await logTo(message.guild, "mod-logs", "Case Removed", [
    field("User", `${user.tag} (${user.id})`),
    field("Removed Case", `#${caseId}`, true),
    field("Audit Case", `#${auditCaseId}`, true),
    field("Moderator", message.author.tag),
    field("Original", `${removed.type}: ${removed.reason}`.slice(0, 1000))
  ]);
  await message.reply(`Removed case #${caseId} from ${user.tag}. Audit case #${auditCaseId} was created.`);
}

async function handleManualTempBan(message, args) {
  if (!canBan(message.member)) return message.reply("Only Moderator+ with Ban Members can tempban users.");

  const user = await resolveUserArgument(message, args[0]);
  const duration = parseTempBanDuration(args.slice(1));
  const reason = duration
    ? args.slice(1 + duration.consumed).join(" ") || "Manual temporary ban"
    : "Manual temporary ban";

  if (!user || !duration) {
    await message.reply("Usage: `!tempban @user-or-id 30m reason`, `!tempban @user-or-id 12h reason`, or `!tempban @user-or-id 14d reason`. A plain number still means days.");
    return;
  }
  const member = await message.guild.members.fetch(user.id).catch(() => null);
  const targetCheck = canModerateTarget(message.member, member, "tempban");
  if (!targetCheck.ok) return message.reply(targetCheck.reason);
  const botError = getBotModerationError(message.guild, member, PermissionFlagsBits.BanMembers, "ban", "bannable");
  if (botError) return message.reply(botError);

  const actionError = await applyTempBan(message.guild, user, duration, reason, message.author)
    .then(() => null)
    .catch((error) => error);
  if (actionError) return message.reply(`I could not apply that temporary ban: ${actionError.message}`);

  const data = getGuildData(message.guild.id);
  const caseId = addCase(data, {
    type: "Tempban",
    userId: user.id,
    userTag: user.tag,
    moderatorId: message.author.id,
    moderatorTag: message.author.tag,
    reason,
    details: duration.label
  });
  data.analytics.punishments += 1;
  const staff = data.staffStats[message.author.id] ||= {};
  staff.punishments = (staff.punishments || 0) + 1;
  saveGuildData(message.guild.id, data);
  await message.reply(`Temporarily banned **${user.tag}** for **${duration.label}**. Case #${caseId}.`);
}

async function handleUnTempBan(message, args) {
  if (!canBan(message.member)) return message.reply("Only Moderator+ with Ban Members can remove tempbans.");

  const userId = message.mentions.users.first()?.id || cleanUserId(args[0]);
  if (!userId) {
    await message.reply("Usage: `!untempban @user` or `!untempban userId`");
    return;
  }

  if (!message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
    return message.reply("I need the **Ban Members** permission to remove a temporary ban.");
  }

  const data = getGuildData(message.guild.id);
  data.tempBans ||= {};
  const record = data.tempBans[userId] || null;
  const banLookup = await fetchGuildBan(message.guild, userId)
    .then((ban) => ({ ban, error: null }))
    .catch((error) => ({ ban: null, error }));
  if (banLookup.error) return message.reply(`I could not check that temporary ban: ${banLookup.error.message}`);
  const existingBan = banLookup.ban;
  const unbanError = existingBan
    ? await message.guild.members.unban(userId, `Tempban removed by ${message.author.tag}`).then(() => null).catch((error) => error)
    : null;
  if (unbanError) return message.reply(`I could not remove that temporary ban: ${unbanError.message}`);

  delete data.tempBans[userId];
  const caseId = addCase(data, {
    type: "Untempban",
    userId,
    userTag: record?.userTag || existingBan?.user?.tag || userId,
    moderatorId: message.author.id,
    moderatorTag: message.author.tag,
    reason: "Temporary ban removed"
  });
  saveGuildData(message.guild.id, data);
  await logTo(message.guild, "mod-logs", "Tempban Removed", [field("User ID", userId), field("Moderator", message.author.tag), field("Case", `#${caseId}`)]);
  await message.reply(`${existingBan ? "Tempban removed" : "No active Discord ban was found; any stale tempban record was cleared"}. Case #${caseId}.`);
}

async function handleKick(message, args) {
  if (!canKick(message.member)) return message.reply("Only Moderator+ with Kick Members can kick users.");
  const member = await resolveMemberArgument(message, args[0]);
  if (!member) return message.reply("Usage: `!kick @user-or-id reason`");
  const targetCheck = canModerateTarget(message.member, member, "kick");
  if (!targetCheck.ok) return message.reply(targetCheck.reason);
  const botError = getBotModerationError(message.guild, member, PermissionFlagsBits.KickMembers, "kick", "kickable");
  if (botError) return message.reply(botError);
  const reason = args.slice(1).join(" ") || "No reason provided";
  await member.send(`You were kicked from ${message.guild.name}: ${reason}`).catch(() => {});
  markBotModerationAction(message.guild.id, "kick", member.id);
  await member.kick(reason);
  await logModeration(message.guild, "Kick", member.user, message.author, reason);
  await message.reply(`Kicked ${member.user.tag}.`);
}

async function handleBan(message, args) {
  if (!canBan(message.member)) return message.reply("Only Moderator+ with Ban Members can ban users.");
  const user = await resolveUserArgument(message, args[0]);
  if (!user) return message.reply("Usage: `!ban @user-or-id reason`");
  const member = await message.guild.members.fetch(user.id).catch(() => null);
  const targetCheck = canModerateTarget(message.member, member, "ban");
  if (!targetCheck.ok) return message.reply(targetCheck.reason);
  const botError = getBotModerationError(message.guild, member, PermissionFlagsBits.BanMembers, "ban", "bannable");
  if (botError) return message.reply(botError);
  const reason = args.slice(1).join(" ") || "No reason provided";
  await user.send(banDmText(message.guild, reason)).catch(() => {});
  markBotModerationAction(message.guild.id, "ban", user.id);
  await message.guild.members.ban(user.id, { reason });
  await logModeration(message.guild, "Ban", user, message.author, reason);
  await message.reply(`Banned ${user.tag}.`);
}

async function handleTimeout(message, args) {
  if (!canTimeout(message.member)) return message.reply("Only staff with Timeout Members can timeout users.");
  const member = await resolveMemberArgument(message, args[0]);
  const duration = parseTimeoutDuration(args.slice(1));
  if (!member || !duration) {
    return message.reply("Usage: `!timeout @user-or-id 30m reason`, `!timeout @user-or-id 2h reason`, or `!timeout @user-or-id 3d reason`");
  }
  const targetCheck = canModerateTarget(message.member, member, "timeout");
  if (!targetCheck.ok) return message.reply(targetCheck.reason);
  const botError = getBotModerationError(message.guild, member, PermissionFlagsBits.ModerateMembers, "timeout", "moderatable");
  if (botError) return message.reply(botError);

  const reason = args.slice(1 + duration.consumed).join(" ") || "No reason provided";
  await member.timeout(duration.ms, `${duration.label} - ${reason}`);
  await logModeration(message.guild, "Timeout", member.user, message.author, `${duration.label} - ${reason}`);
  await message.reply(`Timed out ${member.user.tag} for **${duration.label}**.`);
}

async function handleUnban(message, args) {
  if (!canBan(message.member)) return message.reply("Only Moderator+ with Ban Members can unban users.");
  const user = await resolveUserArgument(message, args[0]);
  const userId = user?.id || cleanUserId(args[0]);
  if (!userId) return message.reply("Usage: `!unban userId reason`");
  if (!message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
    return message.reply("I need the **Ban Members** permission to unban users.");
  }
  const reason = args.slice(1).join(" ") || "No reason provided";
  await message.guild.members.unban(userId, `${reason} - ${message.author.tag}`);
  const data = getGuildData(message.guild.id);
  const caseId = addCase(data, {
    type: "Unban",
    userId,
    userTag: user?.tag || userId,
    moderatorId: message.author.id,
    moderatorTag: message.author.tag,
    reason
  });
  saveGuildData(message.guild.id, data);
  await logTo(message.guild, "mod-logs", "Unban", [field("User ID", userId), field("Moderator", message.author.tag), field("Reason", `${reason} | Case #${caseId}`)]);
  await message.reply(`Unbanned user ID ${userId}. Case #${caseId}.`);
}

async function handleUntimeout(message, args) {
  if (!canTimeout(message.member)) return message.reply("Only staff with Timeout Members can remove timeouts.");
  const member = await resolveMemberArgument(message, args[0]);
  if (!member) return message.reply("Usage: `!untimeout @user-or-id reason`");
  const targetCheck = canModerateTarget(message.member, member, "untimeout");
  if (!targetCheck.ok) return message.reply(targetCheck.reason);
  const botError = getBotModerationError(message.guild, member, PermissionFlagsBits.ModerateMembers, "remove timeouts from", "moderatable");
  if (botError) return message.reply(botError);
  const reason = args.slice(1).join(" ") || "No reason provided";
  await member.timeout(null, `${reason} - ${message.author.tag}`);
  const data = getGuildData(message.guild.id);
  const caseId = addCase(data, {
    type: "Untimeout",
    userId: member.id,
    userTag: member.user.tag,
    moderatorId: message.author.id,
    moderatorTag: message.author.tag,
    reason
  });
  saveGuildData(message.guild.id, data);
  await logModeration(message.guild, "Untimeout", member.user, message.author, `${reason} | Case #${caseId}`);
  await message.reply(`Removed timeout from ${member.user.tag}. Case #${caseId}.`);
}

async function logModeration(guild, action, user, moderator, reason) {
  const data = getGuildData(guild.id);
  data.analytics.punishments += 1;
  const staff = data.staffStats?.[moderator.id] || { claimedTickets: 0, closedTickets: 0, deletedTickets: 0, punishments: 0 };
  data.staffStats ||= {};
  staff.punishments = (staff.punishments || 0) + 1;
  data.staffStats[moderator.id] = staff;
  if (!/case\s*#/i.test(reason)) {
    const caseId = addCase(data, {
      type: action,
      userId: user.id,
      userTag: user.tag,
      moderatorId: moderator.id,
      moderatorTag: moderator.tag,
      reason
    });
    reason = `${reason} | Case #${caseId}`;
  }
  saveGuildData(guild.id, data);
  await logTo(guild, "mod-logs", action, [field("User", `${user.tag} (${user.id})`), field("Moderator", `${moderator.tag}`), field("Reason", reason)]);
}

async function resolveUserArgument(message, value) {
  const mentioned = message.mentions.users.first();
  if (mentioned && (!value || value.includes(mentioned.id))) return mentioned;

  const userId = cleanUserId(value);
  if (!userId) return null;
  return message.client.users.fetch(userId).catch(() => null);
}

async function resolveMemberArgument(message, value) {
  const mentioned = message.mentions.members.first();
  if (mentioned && (!value || value.includes(mentioned.id))) return mentioned;

  const userId = cleanUserId(value);
  if (!userId) return null;
  return message.guild.members.fetch(userId).catch(() => null);
}

function getBotModerationError(guild, member, permission, action, capability) {
  const botMember = guild.members.me;
  if (!botMember?.permissions.has(permission)) {
    return `I need the required Discord permission to ${action} members. Check my bot role permissions.`;
  }
  if (member && capability && member[capability] === false) {
    return `I cannot ${action} that member. Move my bot role above their highest role and check my permissions.`;
  }
  return null;
}

function cleanUserId(value = "") {
  const match = String(value).match(/\d{15,25}/);
  return match?.[0] || null;
}

function addCase(data, entry) {
  data.cases ||= [];
  const nextId = (data.nextCaseId || 1);
  data.nextCaseId = nextId + 1;
  data.cases.push({
    id: nextId,
    at: Date.now(),
    ...entry
  });
  return nextId;
}

async function logExternalModeration(guild, action, user, moderator, reason) {
  const moderatorLabel = moderator ? `${moderator.tag} (${moderator.id})` : "Unknown from audit log";
  const data = getGuildData(guild.id);
  const caseId = addCase(data, {
    type: `External ${action}`,
    userId: user.id,
    userTag: user.tag,
    moderatorId: moderator?.id || "unknown",
    moderatorTag: moderator?.tag || "Unknown",
    reason: reason || "No reason provided"
  });
  saveGuildData(guild.id, data);
  await logTo(guild, "mod-logs", `External ${action}`, [
    field("User", `${user.tag} (${user.id})`),
    field("Moderator", moderatorLabel),
    field("Reason", `${reason || "No reason provided"} | Case #${caseId}`)
  ]);
}

async function fetchRecentAuditEntry(guild, type, targetId) {
  if (!guild.members.me.permissions.has(PermissionFlagsBits.ViewAuditLog)) return null;

  const logs = await guild.fetchAuditLogs({ type, limit: 5 }).catch(() => null);
  const entry = logs?.entries.find((auditEntry) => {
    const isTarget = auditEntry.target?.id === targetId;
    const isRecent = Date.now() - auditEntry.createdTimestamp < 15 * 1000;
    return isTarget && isRecent;
  });

  return entry || null;
}

function incrementStaffStat(guildId, userId, key, amount = 1) {
  const data = getGuildData(guildId);
  data.staffStats ||= {};
  const stats = data.staffStats[userId] ||= { claimedTickets: 0, closedTickets: 0, deletedTickets: 0, punishments: 0 };
  stats[key] = (stats[key] || 0) + amount;
  saveGuildData(guildId, data);
}

function normalizePunishmentRule(value = "") {
  const key = value.toLowerCase().replace(/[^a-z]/g, "");
  const aliases = {
    drama: "drama",
    harassment: "harassment",
    harass: "harassment",
    slur: "slurs",
    slurs: "slurs",
    discrimination: "discrimination",
    discrim: "discrimination",
    disrespect: "disrespect",
    disrespectful: "disrespect",
    spam: "spam",
    advertising: "advertising",
    ad: "advertising",
    ads: "advertising",
    nsfw: "nsfw",
    gore: "gore",
    channel: "wrongchannel",
    channels: "wrongchannel",
    wrongchannel: "wrongchannel",
    vc: "vc",
    voice: "vc",
    mod: "moddiscussion",
    moderation: "moddiscussion",
    moddiscussion: "moddiscussion",
    impersonation: "impersonation",
    impersonating: "impersonation"
  };

  return aliases[key] && PUNISHMENT_RULES[aliases[key]] ? aliases[key] : null;
}

function determinePunishment(ruleKey, count, severe) {
  const rule = PUNISHMENT_RULES[ruleKey];

  if (count === 1) {
    if (severe && rule.severe) return rule.severe;
    return rule.first;
  }

  if (count === 2) {
    if (ruleKey === "moddiscussion") return { action: "warn" };
    if (rule.repeatTimeoutDays) return { action: "timeout", days: rule.repeatTimeoutDays };
    if (rule.first.action === "timeout") return { action: "tempban", days: 14 };
    if (rule.first.action === "tempban") return { action: "tempban", days: Math.max(31, (rule.first.days || 14) * 2) };
    return { action: "timeout", days: 1 };
  }

  if (count === 3) {
    return { action: "tempban", days: severe ? 31 : 14 };
  }

  return { action: "ban" };
}

function limitPunishmentForMember(punishment, member) {
  if (punishment.action === "ban" && !canBan(member)) return canTimeout(member) ? { action: "timeout", days: 3 } : { action: "warn" };
  if (punishment.action === "tempban" && !canBan(member)) return canTimeout(member) ? { action: "timeout", days: Math.min(punishment.days || 3, 3) } : { action: "warn" };
  if (punishment.action === "timeout" && !canTimeout(member)) return { action: "warn" };
  return punishment;
}

function determineStaffLogPunishment(rule, currentPoints) {
  const total = currentPoints + rule.points;
  if (rule.action.action === "ban" || total >= STAFF_LOG_MAX_POINTS) return { action: "ban" };
  return rule.action;
}

function findStaffLogRule(input = "") {
  const cleaned = normalizeRuleText(input);
  return STAFF_LOG_RULES.find((rule) => {
    if (normalizeRuleText(rule.key) === cleaned) return true;
    if (normalizeRuleText(rule.label) === cleaned) return true;
    return rule.aliases.some((alias) => cleaned.includes(normalizeRuleText(alias)) || normalizeRuleText(alias).includes(cleaned));
  }) || null;
}

function normalizeRuleText(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function buildStaffLogRuleFields() {
  const grouped = STAFF_LOG_RULES.reduce((acc, rule) => {
    acc[rule.section] ||= [];
    acc[rule.section].push(`\`${rule.key}\` - ${rule.label} (${rule.points} pts, ${formatPunishment(rule.action)})`);
    return acc;
  }, {});

  return Object.entries(grouped).map(([section, rules]) => field(section, rules.join("\n").slice(0, 1024)));
}

function getMessageProof(message) {
  const attachments = message.attachments.map((attachment) => attachment.url);
  return [message.content.trim(), ...attachments].filter(Boolean).join("\n") || "No proof provided";
}

function punishmentDurationMs(punishment) {
  if (punishment.minutes) return punishment.minutes * 60 * 1000;
  if (punishment.hours) return punishment.hours * 60 * 60 * 1000;
  return Math.min((punishment.days || 1) * DAY_MS, 28 * DAY_MS);
}

function parseTimeoutDuration(args = [], maxMs = 28 * DAY_MS) {
  const first = String(args[0] || "").trim().toLowerCase();
  if (!first) return null;

  const compact = first.match(/^(\d+(?:\.\d+)?)(m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days)?$/);
  if (!compact) return null;

  const amount = Number(compact[1]);
  if (!amount || Number.isNaN(amount) || amount <= 0) return null;

  let unit = compact[2] || "m";
  let consumed = 1;

  if (!compact[2] && args[1]) {
    const maybeUnit = String(args[1]).trim().toLowerCase();
    if (/^(m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days)$/.test(maybeUnit)) {
      unit = maybeUnit;
      consumed = 2;
    }
  }

  const normalized = unit.startsWith("h") ? "hours" : unit.startsWith("d") ? "days" : "minutes";
  const ms = normalized === "days"
    ? amount * DAY_MS
    : normalized === "hours"
      ? amount * 60 * 60 * 1000
      : amount * 60 * 1000;

  if (ms > maxMs) return null;

  const labelAmount = Number.isInteger(amount) ? amount : Number(amount.toFixed(2));
  const singular = labelAmount === 1;
  const labelUnit = normalized === "days" ? (singular ? "day" : "days") : normalized === "hours" ? (singular ? "hour" : "hours") : (singular ? "minute" : "minutes");

  return {
    ms,
    label: `${labelAmount} ${labelUnit}`,
    consumed
  };
}

function parseTempBanDuration(args = []) {
  const first = String(args[0] || "").trim().toLowerCase();
  if (!first) return null;

  const separatedUnit = String(args[1] || "").trim().toLowerCase();
  if (/^\d+(?:\.\d+)?$/.test(first) && /^(m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days)$/.test(separatedUnit)) {
    return parseTimeoutDuration(args, 365 * DAY_MS);
  }

  // Keep the original beginner-friendly behavior: a plain number means days.
  if (/^\d+(?:\.\d+)?$/.test(first)) {
    const days = Number(first);
    const ms = days * DAY_MS;
    if (!days || ms > 365 * DAY_MS) return null;
    return {
      ms,
      label: `${days} ${days === 1 ? "day" : "days"}`,
      consumed: 1
    };
  }

  return parseTimeoutDuration(args, 365 * DAY_MS);
}

async function fetchReferencedMessage(message) {
  if (!message.reference?.messageId) return null;
  return message.channel.messages.fetch(message.reference.messageId).catch(() => null);
}

async function applyPunishmentAction(guild, user, member, punishment, reason, moderator) {
  if (punishment.action === "remind") {
    await user.send(`Please open a ticket in ${guild.name} for moderation issues instead of discussing them in public chat.`).catch(() => {});
    return;
  }

  if (punishment.action === "warn") {
    await user.send(`You were warned in ${guild.name}: ${reason}`).catch(() => {});
    return;
  }

  if (punishment.action === "timeout") {
    if (!member) throw new Error("That user is not currently in the server, so they cannot be timed out.");
    const botError = getBotModerationError(guild, member, PermissionFlagsBits.ModerateMembers, "timeout", "moderatable");
    if (botError) throw new Error(botError);
    const duration = punishmentDurationMs(punishment);
    await user.send(`You were muted in ${guild.name} for ${formatPunishment(punishment)}: ${reason}`).catch(() => {});
    await member.timeout(duration, `${reason} - ${moderator.tag}`);
    return;
  }

  if (punishment.action === "tempban") {
    await applyTempBan(guild, user, punishment.days || 14, reason, moderator);
    return;
  }

  if (punishment.action === "ban") {
    const botError = getBotModerationError(guild, member, PermissionFlagsBits.BanMembers, "ban", "bannable");
    if (botError) throw new Error(botError);
    await user.send(banDmText(guild, reason)).catch(() => {});
    markBotModerationAction(guild.id, "ban", user.id);
    await guild.members.ban(user.id, { reason: `${reason} - ${moderator.tag}` });
  }
}

async function applyTempBan(guild, user, durationInput, reason, moderator) {
  const duration = typeof durationInput === "number"
    ? { ms: durationInput * DAY_MS, label: `${durationInput} ${durationInput === 1 ? "day" : "days"}` }
    : durationInput;

  if (!duration?.ms || duration.ms <= 0) throw new Error("Invalid temporary ban duration.");
  if (!guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
    throw new Error("The bot needs Ban Members permission to apply temporary bans.");
  }

  const member = await guild.members.fetch(user.id).catch(() => null);
  if (member && !member.bannable) {
    throw new Error("The bot role must be above the target member's highest role.");
  }

  const existingBan = await fetchGuildBan(guild, user.id);
  if (existingBan) throw new Error("That user is already banned from this server.");

  const createdAt = Date.now();
  const expiresAt = createdAt + duration.ms;
  await user.send(banDmText(guild, reason, duration.label)).catch(() => {});
  markBotModerationAction(guild.id, "ban", user.id);
  await guild.members.ban(user.id, { reason: `${reason} - tempban ${duration.label} - ${moderator.tag}` });

  // Save only after Discord confirms the ban so failed actions never become
  // permanent stale records that later commands mistake for active tempbans.
  const data = getGuildData(guild.id);
  data.tempBans[user.id] = {
    userId: user.id,
    userTag: user.tag,
    reason,
    moderatorId: moderator.id,
    duration: duration.label,
    expiresAt,
    createdAt
  };
  saveGuildData(guild.id, data);

  await logTo(guild, "mod-logs", "Temporary Ban", [
    field("User", `${user.tag} (${user.id})`),
    field("Moderator", moderator.tag),
    field("Duration", duration.label, true),
    field("Expires", `<t:${Math.floor(expiresAt / 1000)}:F>`, true),
    field("Reason", reason)
  ]);
}

async function fetchGuildBan(guild, userId) {
  try {
    return await guild.bans.fetch(userId);
  } catch (error) {
    if (Number(error?.code) === 10026) return null;
    throw error;
  }
}

async function checkExpiredTempBans() {
  for (const guild of client.guilds.cache.values()) {
    const data = getGuildData(guild.id);
    data.tempBans ||= {};
    let changed = false;

    for (const [userId, tempBan] of Object.entries(data.tempBans)) {
      const expiresAt = Number(tempBan.expiresAt);
      if (!Number.isFinite(expiresAt) || Date.now() < expiresAt) continue;

      try {
        const existingBan = await fetchGuildBan(guild, userId);
        if (existingBan) await guild.members.unban(userId, "Temporary ban expired");
        await logTo(guild, "mod-logs", "Temporary Ban Expired", [
          field("User", `${tempBan.userTag || userId}`),
          field("Reason", tempBan.reason || "No reason provided")
        ]);
        delete data.tempBans[userId];
        changed = true;
      } catch (error) {
        console.error(`Could not expire tempban for ${userId} in ${guild.id}:`, error);
        await logTo(guild, "mod-logs", "Temporary Ban Expiration Failed", [
          field("User", `${tempBan.userTag || userId}`),
          field("Error", error.message),
          field("Retry", "The bot kept this record and will retry automatically.")
        ]);
      }
    }

    if (changed) saveGuildData(guild.id, data);
  }
}

async function logPunishment(guild, user, moderator, ruleKey, punishment, reason, evidence, deleted, count, caseId) {
  incrementStaffStat(guild.id, moderator.id, "punishments", 1);
  await logTo(guild, "mod-logs", "Punishment Applied", [
    field("User", `${user.tag} (${user.id})`),
    field("Moderator", moderator.tag),
    field("Rule", PUNISHMENT_RULES[ruleKey].label, true),
    field("Offense Count", count, true),
    field("Action", formatPunishment(punishment), true),
    field("Case", `#${caseId}`, true),
    field("Reason", reason),
    field("Broken Message Deleted", deleted ? "Yes" : "No", true),
    field("Evidence", evidence.slice(0, 1000))
  ]);
}

function formatPunishment(punishment) {
  if (punishment.action === "timeout" && punishment.minutes) return `Timeout ${punishment.minutes}m`;
  if (punishment.action === "timeout" && punishment.hours) return `Timeout ${punishment.hours}h`;
  if (punishment.action === "timeout") return `Timeout ${punishment.days || 1}d`;
  if (punishment.action === "tempban") return `Tempban ${punishment.days || 14}d`;
  if (punishment.action === "ban") return "Permanent ban";
  if (punishment.action === "remind") return "Ticket reminder";
  return "Warn";
}

async function handleBackup(message) {
  if (!isAdmin(message.member)) return message.reply("Only admins can use `!backup`.");
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const fileName = `${message.guild.id}-${Date.now()}.json`;
  fs.writeFileSync(path.join(BACKUP_DIR, fileName), JSON.stringify({ settings: getGuildSettings(message.guild.id), data: getGuildData(message.guild.id) }, null, 2));
  await message.reply(`Backup saved: \`${fileName}\``);
}

async function handleRestoreBackup(message, args) {
  if (!isAdmin(message.member)) return message.reply("Only admins can use `!restorebackup`.");
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const backups = fs.readdirSync(BACKUP_DIR).filter((file) => file.startsWith(`${message.guild.id}-`)).sort();
  const fileName = args[0] || backups.at(-1);
  if (!fileName || !backups.includes(fileName)) return message.reply("Backup not found.");
  const backup = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, fileName), "utf8"));
  if (backup.settings) saveGuildSettings(message.guild.id, backup.settings);
  if (backup.data) saveGuildData(message.guild.id, backup.data);
  await message.reply(`Restored bot config/data from \`${fileName}\`.`);
}

async function handleConfigView(message) {
  if (!isAdmin(message.member)) return message.reply("Only admins can use `!configview`.");
  const settings = getGuildSettings(message.guild.id) || {};
  await message.reply({ embeds: [baseEmbed("Config").setDescription(`\`\`\`json\n${JSON.stringify(settings, null, 2).slice(0, 3500)}\n\`\`\``)] });
}

async function handleConfigReload(message) {
  if (!isAdmin(message.member)) return message.reply("Only admins can use `!configreload`.");
  reloadSettings();
  await message.reply("Config reloaded from storage.");
}

async function handleConfigReset(message) {
  if (!isAdmin(message.member)) return message.reply("Only admins can use `!configreset`.");
  clearGuildSettings(message.guild.id);
  await message.reply("Config reset. Run `!krupdate` again when ready.");
}

async function ask(message, question, validate = () => true) {
  await message.channel.send(question);
  const collected = await message.channel.awaitMessages({
    filter: (reply) => reply.author.id === message.author.id,
    max: 1,
    time: QUESTION_TIMEOUT
  }).catch(() => null);
  const reply = collected?.first();
  if (!reply) {
    await message.channel.send("Timed out. Please run the command again.");
    return null;
  }
  if (!validate(reply)) {
    await message.channel.send("That answer was not valid. Please run the command again.");
    return null;
  }
  return reply;
}

async function collectOneMessage(channel, userId, timeout = QUESTION_TIMEOUT) {
  const collected = await channel.awaitMessages({
    filter: (reply) => reply.author.id === userId,
    max: 1,
    time: timeout
  }).catch(() => null);
  return collected?.first() || null;
}

async function askDmQuestion(dm, userId, question, timeout) {
  const sent = await dm.send(question).catch(() => null);
  if (!sent) return null;
  const reply = await collectOneMessage(dm, userId, timeout);
  return reply?.content?.trim() || null;
}

function cleanChannelId(value = "") {
  const match = String(value).match(/\d{15,25}/);
  return match?.[0] || null;
}

function banDmText(guild, reason, duration = null) {
  return [
    `You were ${duration ? `temporarily banned from ${guild.name} for ${duration}` : `banned from ${guild.name}`}.`,
    `Reason: ${reason}`,
    `You can appeal in this Discord server: ${BAN_APPEAL_INVITE}`
  ].join("\n");
}

async function logDeletedMessage(message) {
  const channel = findChannel(message.guild, "message-logs");
  if (!channel) return;

  const media = getDeletedMessageMedia(message);
  const embed = baseEmbed("Message Deleted")
    .addFields(
      field("User", `${message.author?.tag || "Unknown"} (${message.author?.id || "unknown"})`),
      field("Channel", `${message.channel}`),
      field("Content", (message.content || media.firstUrl || "No text content.").slice(0, 1000))
    )
    .setFooter({ text: BRAND });

  if (media.imageUrl) embed.setImage(media.imageUrl);
  if (media.urls.length) embed.addFields(field("Media / Attachments", media.urls.slice(0, 5).join("\n").slice(0, 1000)));

  await channel.send({ content: media.firstUrl || undefined, embeds: [embed] }).catch(() => {});
}

function getDeletedMessageMedia(message) {
  const attachmentUrls = message.attachments?.map((attachment) => attachment.url) || [];
  const contentUrls = (message.content || "").match(URL_PATTERN) || [];
  const urls = [...new Set([...attachmentUrls, ...contentUrls])];
  const imageUrl = urls.find((url) => isRenderableMediaUrl(url)) || null;

  return {
    urls,
    imageUrl,
    firstUrl: urls[0] || null
  };
}

function isRenderableMediaUrl(url = "") {
  return /\.(png|jpe?g|gif|webp)(?:\?.*)?$/i.test(url)
    || /media\.discordapp\.net|cdn\.discordapp\.com|tenor\.com\/view|media\.tenor\.com|c.tenor\.com|giphy\.com|media\.giphy\.com/i.test(url);
}

async function logTo(guild, channelName, title, fields) {
  const channel = findChannel(guild, channelName);
  if (!channel) return;
  await channel.send({ embeds: [baseEmbed(title).addFields(fields).setFooter({ text: BRAND })] }).catch(() => {});
}

async function handleAutoMod(message, settings = {}) {
  if (settings.autoModEnabled === false) return;
  if (isStaff(message.member)) return;

  const result = detectAutoModInfraction(message, settings);
  if (!result) return;

  const rule = AUTOMOD_RULES[result.ruleKey];
  const deleted = await message.delete().then(() => true).catch(() => false);
  const data = getGuildData(message.guild.id);
  data.autoMod ||= {};
  const record = data.autoMod[message.author.id] ||= { history: [] };
  const now = Date.now();

  record.lastAt = now;
  record.history = (record.history || []).filter((entry) => now - entry.at < AUTOMOD_RESET_MS);
  record.history.push({
    rule: result.ruleKey,
    label: rule.label,
    content: message.content.slice(0, 500),
    channelId: message.channel.id,
    deleted,
    at: now
  });

  const punishment = rule.action;
  const caseId = addCase(data, {
    type: result.ruleKey === "invite" ? "AutoMod Invite Block" : "AutoMod Blocked Term",
    userId: message.author.id,
    userTag: message.author.tag,
    moderatorId: client.user.id,
    moderatorTag: client.user.tag,
    reason: `${rule.label}: ${result.reason}`,
    details: `Deleted message: ${deleted ? "yes" : "no"}`
  });
  data.warnings[message.author.id] ||= [];
  data.warnings[message.author.id].push({
    caseId,
    reason: `AutoMod: ${rule.label} (${result.reason})`,
    moderatorId: client.user.id,
    at: now
  });

  data.analytics.punishments += 1;
  saveGuildData(message.guild.id, data);

  const actionError = await applyPunishmentAction(message.guild, message.author, message.member, punishment, `AutoMod: ${rule.label}`, client.user)
    .then(() => null)
    .catch((error) => error);

  await message.author.send(`Your message in ${message.guild.name} was removed because it broke the server AutoMod filter. Action: ${formatPunishment(punishment)}.`).catch(() => {});
  if (actionError) {
    await logTo(message.guild, "mod-logs", "AutoMod Action Failed", [
      field("User", `${message.author.tag} (${message.author.id})`),
      field("Action", formatPunishment(punishment), true),
      field("Error", actionError.message)
    ]);
  }
  await logAutoModAction(message, rule, result, punishment, deleted, caseId);
}

function detectAutoModInfraction(message, settings = getGuildSettings(message.guild.id) || {}) {
  const content = message.content || "";
  if (DISCORD_INVITE_PATTERN.test(content)) return { ruleKey: "invite", reason: "Discord server invite link detected." };
  if (BLOCKED_TERM_PATTERNS.some((pattern) => pattern.test(content))) return { ruleKey: "blockedterm", reason: "Severe blocked slur detected." };
  const customMatch = findBadWordMatch(content, settings.badWords || []);
  if (customMatch) return { ruleKey: "custombadword", reason: `Configured blocked word detected: ${customMatch}` };
  return null;
}

function getRecentAuthorMessages(message) {
  const data = getGuildData(message.guild.id);
  data.autoModRecent ||= {};
  const now = Date.now();
  const userRecent = (data.autoModRecent[message.author.id] || []).filter((entry) => now - entry.at < AUTOMOD_SPAM_WINDOW_MS);
  userRecent.push({
    at: now,
    normalized: normalizeSpamText(message.content),
    mentions: message.mentions.users.size + message.mentions.roles.size + (message.mentions.everyone ? 3 : 0),
    urls: (message.content.match(URL_PATTERN) || []).filter((url) => !MEDIA_URL_PATTERN.test(url)).length
  });
  data.autoModRecent[message.author.id] = userRecent.slice(-10);
  saveGuildData(message.guild.id, data);
  return userRecent.slice(0, -1);
}

function normalizeSpamText(content) {
  return content.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 200);
}

function normalizeBadWord(value = "") {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 80);
}

function findBadWordMatch(content, badWords = []) {
  if (!Array.isArray(badWords) || !badWords.length) return null;

  const normalizedContent = ` ${normalizeBadWord(content)} `;
  return badWords
    .map((word) => normalizeBadWord(word))
    .filter(Boolean)
    .find((word) => normalizedContent.includes(` ${word} `)) || null;
}

function determineAutoModPunishment(strikes) {
  if (strikes <= 3) return { action: "warn" };
  if (strikes <= 5) return { action: "timeout", days: 1 };
  if (strikes <= 7) return { action: "tempban", days: 7 };
  if (strikes <= 9) return { action: "tempban", days: 31 };
  return { action: "ban" };
}

async function logAutoModAction(message, rule, result, punishment, deleted, caseId) {
  await logTo(message.guild, "mod-logs", "AutoMod Action", [
    field("User", `${message.author.tag} (${message.author.id})`),
    field("Channel", `${message.channel}`),
    field("Infraction", rule.label, true),
    field("Action", formatPunishment(punishment), true),
    field("Case", `#${caseId}`, true),
    field("Message Deleted", deleted ? "Yes" : "No", true),
    field("Reason", result.reason),
    field("Content", (message.content || "No text content.").slice(0, 1000))
  ]);
}

function trackMessage(message) {
  const data = getGuildData(message.guild.id);
  data.analytics.messages += 1;
  data.analytics.channelMessages[message.channel.id] = (data.analytics.channelMessages[message.channel.id] || 0) + 1;
  data.analytics.activeUsers[message.author.id] = Date.now();
  saveGuildData(message.guild.id, data);
}

function rotateStatus() {
  const statuses = [
    () => "Kaiju Reincarnated",
    (guild) => `${guild.memberCount} Players`,
    () => "New Sneak Peeks",
    (guild) => `${Object.values(getGuildData(guild.id).tickets || {}).filter((id) => guild.channels.cache.has(id)).length} Open Tickets`
  ];
  let index = 0;

  setInterval(() => {
    const guild = client.guilds.cache.first();
    if (!guild) return;
    client.user.setActivity(statuses[index % statuses.length](guild), { type: ActivityType.Watching });
    index += 1;
  }, 3 * 60 * 1000).unref();
}

function list(items) {
  return items.length ? items.slice(0, 20).join("\n").slice(0, 1024) : "None";
}

if (require.main === module) {
  if (!TOKEN) {
    console.error("Missing DISCORD_TOKEN in .env or host environment variables.");
    process.exit(1);
  }

  client.login(TOKEN);
}

module.exports = {
  BAN_APPEAL_INVITE,
  cleanUserId,
  getEligibleDonationTierThresholds,
  parseDonationAmount,
  parseTempBanDuration,
  parseTimeoutDuration
};
