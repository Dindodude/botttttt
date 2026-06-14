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
const BOT_VERSION = "2026-06-14-command-config-cases";
const COLOR = "#16a34a";
const ERROR_COLOR = "#ef4444";
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
const AUTOMOD_RULES = {
  invite: { label: "Discord invite link", delete: true, action: { action: "warn" } },
  blockedterm: { label: "Blocked slur/NSFW term", delete: true, action: { action: "warn" } }
};
const BLOCKED_TERM_PATTERNS = [
  /\bn[\W_]*i[\W_]*g[\W_]*g[\W_]*(a|e[\W_]*r|u[\W_]*h|o)\b/i,
  /\bf[\W_]*a[\W_]*g([\W_]*g[\W_]*o[\W_]*t)?\b/i,
  /\br[\W_]*e[\W_]*t[\W_]*a[\W_]*r[\W_]*d\b/i,
  /\bk[\W_]*y[\W_]*s\b/i,
  /\b(porn|porno|pornhub|xvideos|xnxx|onlyfans|nude|nudes|hentai|rule34|xxx|18\+)\b/i,
  /\bsex[\W_]*(video|pic|image|link|content)\b/i
];
const DISCORD_INVITE_PATTERN = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[a-z0-9-]+/i;
const URL_PATTERN = /https?:\/\/\S+/gi;
const MEDIA_URL_PATTERN = /(tenor\.com|giphy\.com|media\.discordapp\.net|cdn\.discordapp\.com|discordapp\.(net|com)\/attachments)/i;
const PLAYER_COMMAND_CHANNEL = "bot-commands";
const ADMIN_COMMANDS = new Set(["krupdate", "newplayersetup", "rolesetup", "autorole", "automod", "badword", "commandconfigure", "start", "starthere", "ticketpanel", "staffapp", "analytics", "backup", "restorebackup", "configreset", "reactionroles"]);
const STAFF_COMMANDS = new Set(["staffcommands", "event", "endevent", "staffstats", "givepoint", "claimticket", "add", "addinticket", "remove", "removefromticket", "warn", "unwarn", "warnings", "punish", "cases", "case", "removecase", "punishments", "tempban", "untempban", "kick", "ban", "unban", "timeout", "untimeout", "purge", "clear"]);
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
  setInterval(checkExpiredTempBans, 10 * 60 * 1000).unref();
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
    if (command === "reactionroles") return handleReactionRoles(message);
    if ((command === "start" && args[0]?.toLowerCase() === "here") || command === "starthere") return handleStartHereCommand(message);
    if (command === "rules") return handleRules(message);
    if (command === "help") return handleHelp(message);
    if (command === "suggest") return handleSuggest(message, args);
    if (command === "review") return handleReview(message);
    if (command === "ticketpanel") return handleTicketPanel(message);
    if (command === "staffapp") return handleStaffAppSetup(message);
    if (command === "bugreport") return handleBugReport(message);
    if (command === "event") return handleEvent(message);
    if (command === "endevent") return handleEndEvent(message);
    if (command === "rank" || command === "level") return handleRank(message);
    if (command === "leaderboard") return handleLeaderboard(message);
    if (command === "analytics") return handleAnalytics(message);
    if (command === "serverstats") return handleServerStats(message);
    if (command === "staffstats") return handleStaffStats(message);
    if (command === "givepoint") return handleGivePoint(message, args);
    if (command === "testerleaderboard") return handleTesterLeaderboard(message);
    if (command === "testerstats" || command.startsWith("testerstats")) return handleTesterStats(message);
    if (command === "claimticket") return handleClaimTicket(message);
    if (command === "add" || command === "addinticket") return handleTicketAdd(message);
    if (command === "remove" || command === "removefromticket") return handleTicketRemove(message);
    if (command === "warn") return handleWarn(message, args);
    if (command === "unwarn") return handleUnwarn(message, args);
    if (command === "warnings") return handleWarnings(message);
    if (command === "punish") return handlePunish(message, args);
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
  await sendWelcome(member);
  await sendNewMemberDm(member);
});

client.on("guildMemberRemove", async (member) => {
  const data = getGuildData(member.guild.id);
  data.analytics.leaves += 1;
  saveGuildData(member.guild.id, data);
  await sendJoinLog(member, "Member Left");

  const kickLog = await fetchRecentAuditEntry(member.guild, AuditLogEvent.MemberKick, member.id);
  if (kickLog) {
    await logExternalModeration(member.guild, "Kick", member.user, kickLog.executor, kickLog.reason || "No reason provided");
  }
});

client.on("guildBanAdd", async (ban) => {
  const banLog = await fetchRecentAuditEntry(ban.guild, AuditLogEvent.MemberBanAdd, ban.user.id);
  await logExternalModeration(ban.guild, "Ban", ban.user, banLog?.executor, banLog?.reason || ban.reason || "No reason provided");
});

client.on("messageDelete", async (message) => {
  if (!message.guild || message.author?.bot) return;
  await logTo(message.guild, "message-logs", "Message Deleted", [
    field("User", `${message.author?.tag || "Unknown"}`),
    field("Channel", `${message.channel}`),
    field("Content", (message.content || "No content").slice(0, 1000))
  ]);
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
    if (interaction.customId.startsWith("ticket:")) return handleTicketButton(interaction);
    if (interaction.customId.startsWith("ticketclose:")) return closeTicket(interaction);
    if (interaction.customId.startsWith("ticketdelete:")) return deleteTicket(interaction);
    if (interaction.customId.startsWith("tickettranscript:")) return handleTicketTranscript(interaction);
    if (interaction.customId.startsWith("rr:")) return handleReactionRoleButton(interaction);
    if (interaction.customId.startsWith("staffapp:start:")) return handleStaffAppStart(interaction);
    if (interaction.customId.startsWith("staffappreview:")) return handleStaffAppReview(interaction);
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

function isBotCommandChannel(channel) {
  return stripStyle(channel.name) === PLAYER_COMMAND_CHANNEL;
}

function isAllowedCommandUse(message, command, args, settings = {}) {
  const commandKey = command === "start" && args[0]?.toLowerCase() === "here" ? "start" : command;
  const adminOnly = ADMIN_COMMANDS.has(commandKey);
  const staffOnly = STAFF_COMMANDS.has(commandKey);

  if (adminOnly) return isAdmin(message.member);
  if (staffOnly) return canUseStaffCommand(message.member, commandKey);
  if (isStaff(message.member)) return true;

  const allowedChannelId = settings.botCommandsChannelId;
  if (allowedChannelId && message.channel.id === allowedChannelId) return true;
  return isBotCommandChannel(message.channel);
}

function canUseStaffCommand(member, command) {
  if (!isStaff(member)) return false;

  if (["staffcommands", "staffstats", "claimticket", "add", "addinticket", "remove", "removefromticket", "warnings", "cases", "case", "punishments"].includes(command)) return true;
  if (["warn", "punish"].includes(command)) return canWarn(member);
  if (["timeout", "untimeout"].includes(command)) return canTimeout(member);
  if (["unwarn", "removecase"].includes(command)) return canManageWarnings(member);
  if (["purge", "clear"].includes(command)) return canPurge(member);
  if (["kick"].includes(command)) return canKick(member);
  if (["ban", "unban", "tempban", "untempban"].includes(command)) return canBan(member);
  if (["event", "endevent", "givepoint"].includes(command)) return isModerator(member);

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
            field("Filter", "Blocks Discord server invite links plus severe slur/NSFW terms."),
            field("Action", "Deletes the message, warns the user, and logs a case."),
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
  if (oldRules?.some((message) => message.author.id === client.user.id && message.embeds[0]?.title?.includes("Kaiju Reincarnated Rules"))) {
    summary.skipped.push("Rules embed");
    return;
  }

  await channel.send({ embeds: [buildRulesEmbed()] }).catch((error) => summary.errors.push(`Rules embed: ${error.message}`));
  summary.created.push("Rules embed");
}

function buildRulesEmbed() {
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
          field("Levels", "`!rank`, `!level`, `!leaderboard` are disabled because Noctaly handles levels."),
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
          field("Setup/Admin", "`!krupdate`, `!newplayersetup`, `!start here`, `!starthere`, `!rolesetup`, `!commandconfigure`, `!autorole`, `!automod`, `!badword`, `!reactionroles`, `!staffapp`, `!ticketpanel`"),
          field("Config/Admin", "`!configview`, `!configreload`, `!configreset`, `!backup`, `!restorebackup`, `!analytics`"),
          field("Tickets", "`!claimticket`, `!addinticket @user`, `!removefromticket @user`, legacy aliases: `!add @user`, `!remove @user`"),
          field("Trial Mod", "`!warn @user/id reason`, `!timeout @user/id minutes reason`, `!untimeout @user/id reason`, `!warnings @user/id`, `!cases @user/id`, `!case 12`, `!rules`"),
          field("Moderator+", "`!purge 25`, `!clear 25`, `!unwarn @user/id`, `!removecase @user/id case`, `!punish @user/id rule reason`, `!kick`, `!ban`, `!unban`, `!tempban`, `!untempban`"),
          field("Events/Stats", "`!event`, `!endevent`, `!staffstats`, `!serverstats`, `!givepoint @tester [amount] [reason]`, `!testerleaderboard`, `!testerstats @tester`")
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
  if (!suggestion) return message.reply(`Usage: \`${PREFIX}suggest [your suggestion]\``);

  await message.delete().catch(() => {});
  const publicChannel = findChannel(message.guild, "suggestions");
  const logChannel = findChannel(message.guild, "suggestion-submissions");
  const embed = baseEmbed("Community Suggestion")
    .setDescription(suggestion.slice(0, 4000))
    .addFields(field("Suggested by", message.author.tag, true));

  const sent = await publicChannel?.send({ embeds: [embed] }).catch(() => null);
  await sent?.react("👍").catch(() => {});
  await sent?.react("👎").catch(() => {});
  await logChannel?.send({ embeds: [embed.setTitle("Suggestion Submission")] }).catch(() => {});

  const data = getGuildData(message.guild.id);
  data.suggestions.push({ userId: message.author.id, text: suggestion, at: Date.now() });
  data.analytics.suggestions += 1;
  saveGuildData(message.guild.id, data);
}

async function handleReview(message) {
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
  await findChannel(message.guild, "reviews")?.send({ embeds: [embed] }).catch(() => {});
  await findChannel(message.guild, "review-submissions")?.send({ embeds: [embed] }).catch(() => {});

  const data = getGuildData(message.guild.id);
  data.reviews.push({ userId: message.author.id, rating, reason: reasonReply.content.trim(), at: Date.now() });
  data.analytics.reviews += 1;
  saveGuildData(message.guild.id, data);
}

async function handlePurge(message, args) {
  if (!canPurge(message.member)) return;

  const amount = Number(args[0] || 0);
  if (!amount || Number.isNaN(amount) || amount < 1 || amount > 100) {
    return message.reply("Usage: `!purge 1-100` or `!clear 1-100`");
  }

  const deleted = await message.channel.bulkDelete(amount + 1, true).catch(async (error) => {
    await message.reply(`Could not purge messages: ${error.message}`);
    return null;
  });
  if (!deleted) return;

  await logTo(message.guild, "mod-logs", "Messages Purged", [
    field("Channel", `${message.channel}`),
    field("Moderator", message.author.tag),
    field("Amount", Math.max(deleted.size - 1, 0), true)
  ]);
}

async function handleReactionRoles(message) {
  if (!isAdmin(message.member)) return message.reply("Only admins can create reaction role panels.");

  const mentionedRoles = [...message.mentions.roles.values()];
  const roles = mentionedRoles.length
    ? mentionedRoles
    : [findRole(message.guild, ROLE_NAMES.announcement)].filter(Boolean);

  const safeRoles = roles.filter((role) => !isUnsafeAutoRole(role));
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

  await interaction.reply({ content: "Check your DMs. You have 20 minutes for each question.", ephemeral: true });

  const dm = await interaction.user.createDM().catch(() => null);
  if (!dm) {
    return interaction.followUp({ content: "I could not DM you. Please open your DMs and click the button again.", ephemeral: true }).catch(() => {});
  }

  await dm.send(`Starting your ${BRAND} staff application. You have 20 minutes to answer each question.`).catch(() => null);

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
  data.staffApplications ||= {};
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
    status = "Approved";
    dmText = `Your staff application for ${interaction.guild.name} was approved. Welcome to the team.`;
    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    const role = findRole(interaction.guild, ROLE_NAMES.trialMod);
    if (member && role) {
      const botMember = interaction.guild.members.me;
      if (botMember.permissions.has(PermissionFlagsBits.ManageRoles) && botMember.roles.highest.comparePositionTo(role) > 0) {
        await member.roles.add(role, "Staff application approved").catch(() => {});
      }
    }
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
  if (!isStaff(interaction.member)) return interaction.reply({ content: "Only staff can close tickets.", ephemeral: true });
  await saveTicketTranscript(interaction.channel, interaction.user, "closed");
  await interaction.channel.permissionOverwrites.edit(interaction.customId.split(":")[1], { SendMessages: false }).catch(() => {});
  const data = getGuildData(interaction.guild.id);
  data.ticketMeta ||= {};
  if (data.ticketMeta[interaction.channel.id]) data.ticketMeta[interaction.channel.id].closedAt = Date.now();
  incrementStaffStat(interaction.guild.id, interaction.user.id, "closedTickets", 1);
  saveGuildData(interaction.guild.id, data);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`tickettranscript:${interaction.customId.split(":")[1]}:closed`).setLabel("Send Transcript").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`ticketdelete:${interaction.customId.split(":")[1]}:closed`).setLabel("Delete Ticket").setStyle(ButtonStyle.Danger)
  );
  await interaction.reply({ content: "Ticket closed. A transcript was sent to transcript logs.", components: [row] });
}

async function deleteTicket(interaction) {
  if (!isStaff(interaction.member)) return interaction.reply({ content: "Only staff can delete tickets.", ephemeral: true });
  await saveTicketTranscript(interaction.channel, interaction.user, "deleted");
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
  if (!isStaff(message.member)) return message.reply("Only staff can claim tickets.");
  const meta = getTicketMetaForChannel(message.guild.id, message.channel.id);
  if (!meta) return message.reply("This command only works inside a ticket channel.");
  if (meta.claimedBy) return message.reply(`This ticket is already claimed by <@${meta.claimedBy}>.`);

  const data = getGuildData(message.guild.id);
  data.ticketMeta[message.channel.id].claimedBy = message.author.id;
  incrementStaffStat(message.guild.id, message.author.id, "claimedTickets", 1);
  saveGuildData(message.guild.id, data);
  await hideClaimedTicketFromOtherMods(message.channel, message.member, meta.ownerId);
  await message.channel.send(`${message.author} claimed this ticket.`);
}

async function handleTicketAdd(message) {
  if (!isStaff(message.member)) return message.reply("Only staff can add people to tickets.");
  const member = message.mentions.members.first();
  if (!member) return message.reply("Usage: `!addinticket @user`");
  if (!getTicketMetaForChannel(message.guild.id, message.channel.id)) return message.reply("This command only works inside a ticket channel.");

  await message.channel.permissionOverwrites.edit(member.id, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true
  });
  await message.channel.send(`${member} was added to this ticket by ${message.author}.`);
}

async function handleTicketRemove(message) {
  if (!isStaff(message.member)) return message.reply("Only staff can remove people from tickets.");
  const member = message.mentions.members.first();
  if (!member) return message.reply("Usage: `!removefromticket @user`");
  if (!getTicketMetaForChannel(message.guild.id, message.channel.id)) return message.reply("This command only works inside a ticket channel.");

  await message.channel.permissionOverwrites.delete(member.id).catch(() => {});
  await message.channel.send(`${member} was removed from this ticket by ${message.author}.`);
}

async function handleTicketTranscript(interaction) {
  if (!isStaff(interaction.member)) return interaction.reply({ content: "Only staff can send ticket transcripts.", ephemeral: true });
  await saveTicketTranscript(interaction.channel, interaction.user, "manual transcript");
  await interaction.reply({ content: "Transcript sent to transcript logs.", ephemeral: true });
}

async function hideClaimedTicketFromOtherMods(channel, claimerMember, ownerId) {
  const guild = channel.guild;
  const keepVisible = new Set([ownerId, claimerMember.id, guild.members.me.id]);

  for (const roleName of STAFF_ROLES) {
    const role = findRole(guild, roleName);
    if (!role) continue;

    if ([ROLE_NAMES.owner, ROLE_NAMES.admin].includes(roleName)) {
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

async function handleStaffStats(message) {
  if (!isStaff(message.member)) return message.reply("Only staff can view staff stats.");
  const target = message.mentions.users.first() || message.author;
  const stats = getGuildData(message.guild.id).staffStats?.[target.id] || {};

  await message.reply({
    embeds: [
      baseEmbed(`Staff Stats - ${target.tag}`)
        .addFields(
          field("Claimed Tickets", stats.claimedTickets || 0, true),
          field("Closed Tickets", stats.closedTickets || 0, true),
          field("Deleted Tickets", stats.deletedTickets || 0, true),
          field("Punishments", stats.punishments || 0, true)
        )
    ]
  });
}

async function handleGivePoint(message, args) {
  if (!isStaff(message.member)) return message.reply("Only staff can give tester points.");
  const user = message.mentions.users.first();
  const amount = Number(args.find((arg) => /^-?\d+$/.test(arg)) || 1);
  const reason = args.filter((arg) => !arg.startsWith("<@") && !/^-?\d+$/.test(arg)).join(" ") || "Tester contribution";
  if (!user || Number.isNaN(amount)) return message.reply("Usage: `!givepoint @tester [amount] [reason]`");

  const data = getGuildData(message.guild.id);
  data.testerPoints ||= {};
  const stats = data.testerPoints[user.id] ||= { points: 0, history: [] };
  stats.points += amount;
  stats.history.push({ amount, reason, staffId: message.author.id, at: Date.now() });
  saveGuildData(message.guild.id, data);

  await logTo(message.guild, "logs", "Tester Point Given", [
    field("Tester", `${user.tag} (${user.id})`),
    field("Points", amount, true),
    field("Total", stats.points, true),
    field("Staff", message.author.tag),
    field("Reason", reason)
  ]);
  await message.reply(`Gave **${amount}** tester point(s) to **${user.tag}**. Total: **${stats.points}**.`);
}

async function handleTesterLeaderboard(message) {
  const data = getGuildData(message.guild.id);
  const leaders = Object.entries(data.testerPoints || {})
    .sort(([, a], [, b]) => (b.points || 0) - (a.points || 0))
    .slice(0, 10);

  await message.reply({
    embeds: [
      baseEmbed("Tester Leaderboard")
        .setDescription(leaders.map(([userId, stats], index) => `${index + 1}. <@${userId}> - **${stats.points || 0}** points`).join("\n") || "No tester points yet.")
    ]
  });
}

async function handleTesterStats(message) {
  const user = message.mentions.users.first() || message.author;
  const stats = getGuildData(message.guild.id).testerPoints?.[user.id] || { points: 0, history: [] };

  await message.reply({
    embeds: [
      baseEmbed(`Tester Stats - ${user.tag}`)
        .addFields(
          field("Points", stats.points || 0, true),
          field("Recent Points", (stats.history || []).slice(-5).map((entry) => `${entry.amount > 0 ? "+" : ""}${entry.amount} - ${entry.reason} (<@${entry.staffId}>)`).join("\n") || "No point history.")
        )
    ]
  });
}

function getTicketMetaForChannel(guildId, channelId) {
  return getGuildData(guildId).ticketMeta?.[channelId] || null;
}

async function saveTicketTranscript(channel, staffUser, action) {
  const messages = await channel.messages.fetch({ limit: 100 }).catch(() => null);
  if (!messages) return;

  const lines = [...messages.values()]
    .reverse()
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

  if (logChannel) {
    await logChannel.send({
      embeds: [baseEmbed("Ticket Transcript").addFields(field("Ticket", `${channel.name}`, true), field("Action", action, true), field("Staff", staffUser.tag, true))],
      files: [attachment]
    }).catch(() => {});
  }
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
  if (!isStaff(message.member)) return message.reply("Only staff can create events.");
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
  if (!isStaff(message.member)) return message.reply("Only staff can end events.");
  const data = getGuildData(message.guild.id);
  const active = Object.entries(data.events).find(([, event]) => !event.ended);
  if (!active) return message.reply("No active event found.");
  active[1].ended = true;
  saveGuildData(message.guild.id, data);
  await message.reply(`Ended event: **${active[1].title}**`);
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

async function handleLeaderboard(message) {
  await message.reply("The built-in leaderboard is disabled because Noctaly is handling levels now.");
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
  data.analytics.punishments += 1;
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
  if (member && isStaff(member)) {
    await message.reply("I will not punish staff members with this command.");
    return;
  }

  const referencedMessage = await fetchReferencedMessage(message);
  const deleted = referencedMessage ? await referencedMessage.delete().then(() => true).catch(() => false) : false;
  const data = getGuildData(message.guild.id);
  data.punishments ||= {};
  const record = data.punishments[user.id] ||= { history: [], counts: {} };
  const nextCount = (record.counts[ruleKey] || 0) + 1;
  const punishment = limitPunishmentForMember(determinePunishment(ruleKey, nextCount, severe), message.member);
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

  await applyPunishmentAction(message.guild, user, member, punishment, reason, message.author);
  await logPunishment(message.guild, user, message.author, ruleKey, punishment, reason, evidence, deleted, nextCount, caseId);
  await message.reply(`Punishment applied to **${user.tag}**: **${formatPunishment(punishment)}** for **${PUNISHMENT_RULES[ruleKey].label}**. Case #${caseId}.`);
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
  const days = Number(args[1] || 14);
  const reason = args.slice(2).join(" ") || "Manual temporary ban";

  if (!user || Number.isNaN(days) || days < 1) {
    await message.reply("Usage: `!tempban @user-or-id days reason`");
    return;
  }

  await applyTempBan(message.guild, user, days, reason, message.author);
  const data = getGuildData(message.guild.id);
  const caseId = addCase(data, {
    type: "Tempban",
    userId: user.id,
    userTag: user.tag,
    moderatorId: message.author.id,
    moderatorTag: message.author.tag,
    reason,
    details: `${days} day(s)`
  });
  saveGuildData(message.guild.id, data);
  await message.reply(`Temporarily banned **${user.tag}** for **${days} day(s)**.`);
}

async function handleUnTempBan(message, args) {
  if (!canBan(message.member)) return message.reply("Only Moderator+ with Ban Members can remove tempbans.");

  const userId = message.mentions.users.first()?.id || args[0];
  if (!userId) {
    await message.reply("Usage: `!untempban @user` or `!untempban userId`");
    return;
  }

  const data = getGuildData(message.guild.id);
  data.tempBans ||= {};
  delete data.tempBans[userId];
  const caseId = addCase(data, {
    type: "Untempban",
    userId,
    userTag: userId,
    moderatorId: message.author.id,
    moderatorTag: message.author.tag,
    reason: "Temporary ban removed"
  });
  saveGuildData(message.guild.id, data);
  await message.guild.members.unban(userId, `Tempban removed by ${message.author.tag}`).catch(() => {});
  await logTo(message.guild, "mod-logs", "Tempban Removed", [field("User ID", userId), field("Moderator", message.author.tag), field("Case", `#${caseId}`)]);
  await message.reply(`Tempban removed if that user was banned. Case #${caseId}.`);
}

async function handleKick(message, args) {
  if (!canKick(message.member)) return message.reply("Only Moderator+ with Kick Members can kick users.");
  const member = await resolveMemberArgument(message, args[0]);
  if (!member) return message.reply("Usage: `!kick @user-or-id reason`");
  const reason = args.slice(1).join(" ") || "No reason provided";
  await member.send(`You were kicked from ${message.guild.name}: ${reason}`).catch(() => {});
  await member.kick(reason);
  await logModeration(message.guild, "Kick", member.user, message.author, reason);
  await message.reply(`Kicked ${member.user.tag}.`);
}

async function handleBan(message, args) {
  if (!canBan(message.member)) return message.reply("Only Moderator+ with Ban Members can ban users.");
  const user = await resolveUserArgument(message, args[0]);
  if (!user) return message.reply("Usage: `!ban @user-or-id reason`");
  const reason = args.slice(1).join(" ") || "No reason provided";
  await user.send(`You were banned from ${message.guild.name}: ${reason}`).catch(() => {});
  await message.guild.members.ban(user.id, { reason });
  await logModeration(message.guild, "Ban", user, message.author, reason);
  await message.reply(`Banned ${user.tag}.`);
}

async function handleTimeout(message, args) {
  if (!canTimeout(message.member)) return message.reply("Only staff with Timeout Members can timeout users.");
  const member = await resolveMemberArgument(message, args[0]);
  const minutes = Number(args[1] || 10);
  if (!member || Number.isNaN(minutes)) return message.reply("Usage: `!timeout @user-or-id minutes reason`");
  const reason = args.slice(2).join(" ") || "No reason provided";
  await member.timeout(minutes * 60 * 1000, reason);
  await logModeration(message.guild, "Timeout", member.user, message.author, `${minutes} minutes - ${reason}`);
  await message.reply(`Timed out ${member.user.tag}.`);
}

async function handleUnban(message, args) {
  if (!canBan(message.member)) return message.reply("Only Moderator+ with Ban Members can unban users.");
  const user = await resolveUserArgument(message, args[0]);
  const userId = user?.id || args[0];
  if (!userId) return message.reply("Usage: `!unban userId reason`");
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
    if (!member) return;
    const duration = Math.min((punishment.days || 1) * DAY_MS, 28 * DAY_MS);
    await user.send(`You were muted in ${guild.name} for ${punishment.days || 1} day(s): ${reason}`).catch(() => {});
    await member.timeout(duration, `${reason} - ${moderator.tag}`);
    return;
  }

  if (punishment.action === "tempban") {
    await applyTempBan(guild, user, punishment.days || 14, reason, moderator);
    return;
  }

  if (punishment.action === "ban") {
    await user.send(`You were permanently banned from ${guild.name}: ${reason}`).catch(() => {});
    await guild.members.ban(user.id, { reason: `${reason} - ${moderator.tag}` });
  }
}

async function applyTempBan(guild, user, days, reason, moderator) {
  const data = getGuildData(guild.id);
  data.tempBans ||= {};
  data.tempBans[user.id] = {
    userId: user.id,
    userTag: user.tag,
    reason,
    moderatorId: moderator.id,
    expiresAt: Date.now() + days * DAY_MS,
    createdAt: Date.now()
  };
  saveGuildData(guild.id, data);

  await user.send(`You were temporarily banned from ${guild.name} for ${days} day(s): ${reason}`).catch(() => {});
  await guild.members.ban(user.id, { reason: `${reason} - tempban ${days}d - ${moderator.tag}` });
  await logTo(guild, "mod-logs", "Temporary Ban", [
    field("User", `${user.tag} (${user.id})`),
    field("Moderator", moderator.tag),
    field("Duration", `${days} day(s)`, true),
    field("Expires", `<t:${Math.floor((Date.now() + days * DAY_MS) / 1000)}:F>`, true),
    field("Reason", reason)
  ]);
}

async function checkExpiredTempBans() {
  for (const guild of client.guilds.cache.values()) {
    const data = getGuildData(guild.id);
    data.tempBans ||= {};
    let changed = false;

    for (const [userId, tempBan] of Object.entries(data.tempBans)) {
      if (Date.now() < tempBan.expiresAt) continue;

      await guild.members.unban(userId, "Temporary ban expired").catch(() => {});
      await logTo(guild, "mod-logs", "Temporary Ban Expired", [
        field("User", `${tempBan.userTag || userId}`),
        field("Reason", tempBan.reason)
      ]);
      delete data.tempBans[userId];
      changed = true;
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
  await dm.send(question).catch(() => null);
  const reply = await collectOneMessage(dm, userId, timeout);
  return reply?.content?.trim() || null;
}

function cleanChannelId(value = "") {
  const match = String(value).match(/\d{15,25}/);
  return match?.[0] || null;
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

  await message.author.send(`Your message in ${message.guild.name} was removed because it broke the server AutoMod filter.`).catch(() => {});
  await logAutoModAction(message, rule, result, punishment, deleted, caseId);
}

function detectAutoModInfraction(message) {
  const content = message.content || "";
  if (DISCORD_INVITE_PATTERN.test(content)) return { ruleKey: "invite", reason: "Discord server invite link detected." };
  if (BLOCKED_TERM_PATTERNS.some((pattern) => pattern.test(content))) return { ruleKey: "blockedterm", reason: "Blocked slur or NSFW term detected." };
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

if (!TOKEN) {
  console.error("Missing DISCORD_TOKEN in .env or host environment variables.");
  process.exit(1);
}

client.login(TOKEN);
