require("dotenv").config();

const fs = require("fs");
const path = require("path");
const {
  ActionRowBuilder,
  ActivityType,
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
const BOT_VERSION = "2026-06-06-rules-punishments-v2";
const COLOR = "#16a34a";
const ERROR_COLOR = "#ef4444";
const XP_COOLDOWN = 60 * 1000;
const QUESTION_TIMEOUT = 2 * 60 * 1000;
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
  appeal: "Ban Appeal",
  support: "Support",
  partnership: "Partnership"
};
const DAY_MS = 24 * 60 * 60 * 1000;
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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
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
  await handleXp(message);

  const settings = getGuildSettings(message.guild.id) || {};
  const prefix = settings.prefix || PREFIX;
  const content = message.content.trim();
  if (!content.startsWith(prefix)) return;

  const args = content.slice(prefix.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();
  if (!command) return;

  try {
    if (command === "ping") return handlePing(message);
    if (command === "version") return handleVersion(message);
    if (command === "commands") return handleCommands(message);
    if (command === "krupdate" || command === "newplayersetup") return handleKrUpdate(message);
    if (command === "rolesetup") return handleRoleSetup(message);
    if (command === "rules") return handleRules(message);
    if (command === "help") return handleHelp(message);
    if (command === "suggest") return handleSuggest(message, args);
    if (command === "review") return handleReview(message);
    if (command === "ticketpanel") return handleTicketPanel(message);
    if (command === "bugreport") return handleBugReport(message);
    if (command === "event") return handleEvent(message);
    if (command === "endevent") return handleEndEvent(message);
    if (command === "rank" || command === "level") return handleRank(message);
    if (command === "leaderboard") return handleLeaderboard(message);
    if (command === "analytics") return handleAnalytics(message);
    if (command === "serverstats") return handleServerStats(message);
    if (command === "warn") return handleWarn(message, args);
    if (command === "warnings") return handleWarnings(message);
    if (command === "punish") return handlePunish(message, args);
    if (command === "punishments") return handlePunishments(message);
    if (command === "tempban") return handleManualTempBan(message, args);
    if (command === "untempban") return handleUnTempBan(message, args);
    if (command === "kick") return handleKick(message, args);
    if (command === "ban") return handleBan(message, args);
    if (command === "timeout") return handleTimeout(message, args);
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
  await assignJoinRoles(member);
  await sendWelcome(member);
  await sendNewMemberDm(member);
});

client.on("guildMemberRemove", async (member) => {
  const data = getGuildData(member.guild.id);
  data.analytics.leaves += 1;
  saveGuildData(member.guild.id, data);
  await sendJoinLog(member, "Member Left");
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

function isStaff(member) {
  return isAdmin(member) || STAFF_ROLES.some((name) => member.roles.cache.some((role) => role.name === name));
}

function isModerator(member) {
  return isStaff(member) || member.permissions.has(PermissionsBitField.Flags.ModerateMembers);
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
  const player = findRole(message.guild, ROLE_NAMES.player);
  const announcement = findRole(message.guild, ROLE_NAMES.announcement);

  saveGuildSettings(message.guild.id, {
    ...settings,
    prefix: settings.prefix || PREFIX,
    welcomeChannelId: welcome?.id || null,
    logsChannelId: logs?.id || null,
    joinLogsChannelId: joinLogs?.id || null,
    autoRoleId: player?.id || null,
    announcementRoleId: announcement?.id || null,
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

  const oldGuide = await channel.messages.fetch({ limit: 20 }).catch(() => null);
  if (oldGuide?.some((message) => message.author.id === client.user.id && message.embeds[0]?.title?.includes("Start Here"))) {
    summary.skipped.push("Start-here guide");
    return;
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("guide:play").setLabel("How to Play").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("guide:bugs").setLabel("Report Bugs").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("guide:suggest").setLabel("Suggestions").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("guide:rules").setLabel("Rules").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("guide:tester").setLabel("Tester Info").setStyle(ButtonStyle.Secondary)
  );

  await channel.send({
    embeds: [
      baseEmbed("Start Here - Kaiju Reincarnated")
        .setDescription("Welcome to the official Kaiju Reincarnated community. Read the rules, watch announcements for updates, report bugs clearly, and use tickets when you need support.")
        .addFields(
          field("Useful commands", "`!help`, `!suggest`, `!review`, `!bugreport`, `!ticketpanel`, `!rank`"),
          field("Community", "Talk kaiju battles, builds, stats, sneak peeks, feedback, clips, and events.")
        )
    ],
    components: [row]
  });
  summary.created.push("Start-here guide panel");
}

async function handleRules(message) {
  if (!isModerator(message.member)) {
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
  const text = {
    play: "Watch #game-updates and #start-here, join community chat, and follow event posts for game sessions and kaiju battle info.",
    bugs: "Use `!bugreport` or post in the bug report area. Include what happened, how to reproduce it, and screenshots if possible.",
    suggest: "Use `!suggest your idea` so the community can vote and staff can review it.",
    rules: "Read the rules channel. Be respectful, no NSFW, no harassment, no spam, and use common sense.",
    tester: "Tester channels are for approved testers. Share clear bugs, balance feedback, and test results."
  }[guide] || "Use `!help` for commands.";

  await interaction.reply({ content: text, ephemeral: true });
}

async function assignJoinRoles(member) {
  for (const roleName of AUTO_JOIN_ROLES) {
    const role = findRole(member.guild, roleName);
    if (!role) continue;

    if (!member.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles) || member.guild.members.me.roles.highest.comparePositionTo(role) <= 0) {
      await logTo(member.guild, "join-logs", "Auto Role Failed", [field("User", `${member}`), field("Role", roleName), field("Reason", "Bot role is not above this role or lacks Manage Roles.")]);
      continue;
    }

    await member.roles.add(role, "Auto role on join").catch((error) => logTo(member.guild, "join-logs", "Auto Role Failed", [field("User", `${member}`), field("Role", roleName), field("Reason", error.message)]));
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
  await message.reply({
    embeds: [
      baseEmbed(`${BRAND} Commands`)
        .setDescription("If this message appears, prefix commands are working.")
        .addFields(
          field("Setup", "`!krupdate`, `!rolesetup`, `!rules`"),
          field("General", "`!ping`, `!commands`, `!help`, `!rank`, `!leaderboard`, `!review`, `!suggest`, `!bugreport`"),
          field("Support", "`!ticketpanel`"),
          field("Moderation", "`!punish`, `!punishments`, `!warn`, `!warnings`, `!tempban`, `!untempban`, `!kick`, `!ban`, `!timeout`")
        )
    ]
  });
}

async function handleHelp(message) {
  await message.reply({
    embeds: [
      baseEmbed(`${BRAND} Help`)
        .addFields(
          field("General Commands", "`!help`, `!rank`, `!leaderboard`, `!review`, `!suggest`, `!bugreport`"),
          field("Support Commands", "`!ticketpanel`"),
          field("Game Commands", "`!event`, `!endevent`, `!serverstats`"),
          field("Moderation Commands", "`!punish`, `!punishments`, `!warn`, `!warnings`, `!tempban`, `!untempban`, `!kick`, `!ban`, `!timeout`, `!rules`, `!analytics`")
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
  data.analytics.tickets += 1;
  saveGuildData(interaction.guild.id, data);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ticketclose:${interaction.user.id}:${type}`).setLabel("Close Ticket").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`ticketdelete:${interaction.user.id}:${type}`).setLabel("Delete Ticket").setStyle(ButtonStyle.Danger)
  );

  await channel.send({ content: `${interaction.user}`, embeds: [baseEmbed(`${TICKET_TYPES[type]} Ticket`).setDescription("Staff will help you here. Explain the issue clearly.")], components: [row] });
  await interaction.reply({ content: `Created ${channel}`, ephemeral: true });
}

async function closeTicket(interaction) {
  if (!isStaff(interaction.member)) return interaction.reply({ content: "Only staff can close tickets.", ephemeral: true });
  await interaction.channel.permissionOverwrites.edit(interaction.customId.split(":")[1], { SendMessages: false }).catch(() => {});
  await interaction.reply("Ticket closed.");
}

async function deleteTicket(interaction) {
  if (!isStaff(interaction.member)) return interaction.reply({ content: "Only staff can delete tickets.", ephemeral: true });
  await interaction.reply("Deleting ticket...");
  await interaction.channel.delete("Ticket deleted").catch(() => {});
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
  const data = getGuildData(message.guild.id);
  const settings = getGuildSettings(message.guild.id) || {};
  const user = data.xp[message.author.id] ||= { xp: 0, level: 0, lastXp: 0 };
  if (Date.now() - user.lastXp < XP_COOLDOWN) return;

  const gained = Math.floor(Math.random() * 11) + 10;
  user.xp += gained;
  user.lastXp = Date.now();
  const newLevel = Math.floor(Math.sqrt(user.xp / 100));
  if (newLevel > user.level) {
    user.level = newLevel;
    await applyLevelRewardRoles(message.member, newLevel, settings);
    await message.channel.send(`${message.author} reached level **${newLevel}**!`).catch(() => {});
  }
  saveGuildData(message.guild.id, data);
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
  const data = getGuildData(message.guild.id);
  const user = data.xp[message.author.id] || { xp: 0, level: 0 };
  const nextLevelXp = (user.level + 1) ** 2 * 100;
  await message.reply({ embeds: [baseEmbed("Rank Card").addFields(field("Level", user.level, true), field("XP", `${user.xp}/${nextLevelXp}`, true))] });
}

async function handleLeaderboard(message) {
  const data = getGuildData(message.guild.id);
  const leaders = Object.entries(data.xp).sort(([, a], [, b]) => b.xp - a.xp).slice(0, 10);
  await message.reply({
    embeds: [baseEmbed("XP Leaderboard").setDescription(leaders.map(([id, stats], index) => `${index + 1}. <@${id}> - Level ${stats.level} (${stats.xp} XP)`).join("\n") || "No XP yet.")]
  });
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
  if (!isModerator(message.member)) return message.reply("Only moderators can warn users.");
  const user = message.mentions.users.first();
  if (!user) return message.reply("Usage: `!warn @user reason`");
  const reason = args.slice(1).join(" ") || "No reason provided";
  const data = getGuildData(message.guild.id);
  data.warnings[user.id] ||= [];
  data.warnings[user.id].push({ reason, moderatorId: message.author.id, at: Date.now() });
  data.analytics.punishments += 1;
  saveGuildData(message.guild.id, data);
  await user.send(`You were warned in ${message.guild.name}: ${reason}`).catch(() => {});
  await logModeration(message.guild, "Warn", user, message.author, reason);
  await message.reply(`Warned ${user.tag}.`);
}

async function handleWarnings(message) {
  if (!isModerator(message.member)) return message.reply("Only moderators can view warnings.");
  const user = message.mentions.users.first() || message.author;
  const warnings = getGuildData(message.guild.id).warnings[user.id] || [];
  await message.reply({ embeds: [baseEmbed(`Warnings for ${user.tag}`).setDescription(warnings.map((warning, index) => `${index + 1}. ${warning.reason} - <@${warning.moderatorId}>`).join("\n") || "No warnings.")] });
}

async function handlePunish(message, args) {
  if (!isModerator(message.member)) return message.reply("Only moderators can use `!punish`.");

  const user = message.mentions.users.first();
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
  const punishment = determinePunishment(ruleKey, nextCount, severe);
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

  if (punishment.action === "warn") {
    data.warnings[user.id] ||= [];
    data.warnings[user.id].push({ reason: `${PUNISHMENT_RULES[ruleKey].label}: ${reason}`, moderatorId: message.author.id, at: Date.now() });
  }

  data.analytics.punishments += 1;
  saveGuildData(message.guild.id, data);

  await applyPunishmentAction(message.guild, user, member, punishment, reason, message.author);
  await logPunishment(message.guild, user, message.author, ruleKey, punishment, reason, evidence, deleted, nextCount);
  await message.reply(`Punishment applied to **${user.tag}**: **${formatPunishment(punishment)}** for **${PUNISHMENT_RULES[ruleKey].label}**.`);
}

async function handlePunishments(message) {
  if (!isModerator(message.member)) return message.reply("Only moderators can view punishments.");

  const user = message.mentions.users.first() || message.author;
  const record = getGuildData(message.guild.id).punishments?.[user.id];

  if (!record?.history?.length) {
    await message.reply(`${user.tag} has no punishment history.`);
    return;
  }

  await message.reply({
    embeds: [
      baseEmbed(`Punishments for ${user.tag}`)
        .setDescription(record.history.slice(-10).map((entry, index) => [
          `**${index + 1}. ${PUNISHMENT_RULES[entry.rule]?.label || entry.rule}**`,
          `Action: ${entry.action}${entry.days ? ` (${entry.days}d)` : ""}`,
          `Reason: ${entry.reason}`,
          `Moderator: <@${entry.moderatorId}>`
        ].join("\n")).join("\n\n").slice(0, 4000))
    ]
  });
}

async function handleManualTempBan(message, args) {
  if (!isModerator(message.member)) return message.reply("Only moderators can tempban users.");

  const user = message.mentions.users.first();
  const days = Number(args[1] || 14);
  const reason = args.slice(2).join(" ") || "Manual temporary ban";

  if (!user || Number.isNaN(days) || days < 1) {
    await message.reply("Usage: `!tempban @user days reason`");
    return;
  }

  await applyTempBan(message.guild, user, days, reason, message.author);
  await message.reply(`Temporarily banned **${user.tag}** for **${days} day(s)**.`);
}

async function handleUnTempBan(message, args) {
  if (!isModerator(message.member)) return message.reply("Only moderators can remove tempbans.");

  const userId = message.mentions.users.first()?.id || args[0];
  if (!userId) {
    await message.reply("Usage: `!untempban @user` or `!untempban userId`");
    return;
  }

  const data = getGuildData(message.guild.id);
  data.tempBans ||= {};
  delete data.tempBans[userId];
  saveGuildData(message.guild.id, data);
  await message.guild.members.unban(userId, `Tempban removed by ${message.author.tag}`).catch(() => {});
  await logTo(message.guild, "mod-logs", "Tempban Removed", [field("User ID", userId), field("Moderator", message.author.tag)]);
  await message.reply("Tempban removed if that user was banned.");
}

async function handleKick(message, args) {
  if (!isModerator(message.member)) return message.reply("Only moderators can kick users.");
  const member = message.mentions.members.first();
  if (!member) return message.reply("Usage: `!kick @user reason`");
  const reason = args.slice(1).join(" ") || "No reason provided";
  await member.send(`You were kicked from ${message.guild.name}: ${reason}`).catch(() => {});
  await member.kick(reason);
  await logModeration(message.guild, "Kick", member.user, message.author, reason);
  await message.reply(`Kicked ${member.user.tag}.`);
}

async function handleBan(message, args) {
  if (!isModerator(message.member)) return message.reply("Only moderators can ban users.");
  const member = message.mentions.members.first();
  if (!member) return message.reply("Usage: `!ban @user reason`");
  const reason = args.slice(1).join(" ") || "No reason provided";
  await member.send(`You were banned from ${message.guild.name}: ${reason}`).catch(() => {});
  await member.ban({ reason });
  await logModeration(message.guild, "Ban", member.user, message.author, reason);
  await message.reply(`Banned ${member.user.tag}.`);
}

async function handleTimeout(message, args) {
  if (!isModerator(message.member)) return message.reply("Only moderators can timeout users.");
  const member = message.mentions.members.first();
  const minutes = Number(args[1] || 10);
  if (!member || Number.isNaN(minutes)) return message.reply("Usage: `!timeout @user minutes reason`");
  const reason = args.slice(2).join(" ") || "No reason provided";
  await member.timeout(minutes * 60 * 1000, reason);
  await logModeration(message.guild, "Timeout", member.user, message.author, `${minutes} minutes - ${reason}`);
  await message.reply(`Timed out ${member.user.tag}.`);
}

async function logModeration(guild, action, user, moderator, reason) {
  const data = getGuildData(guild.id);
  data.analytics.punishments += 1;
  saveGuildData(guild.id, data);
  await logTo(guild, "mod-logs", action, [field("User", `${user.tag} (${user.id})`), field("Moderator", `${moderator.tag}`), field("Reason", reason)]);
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

async function logPunishment(guild, user, moderator, ruleKey, punishment, reason, evidence, deleted, count) {
  await logTo(guild, "mod-logs", "Punishment Applied", [
    field("User", `${user.tag} (${user.id})`),
    field("Moderator", moderator.tag),
    field("Rule", PUNISHMENT_RULES[ruleKey].label, true),
    field("Offense Count", count, true),
    field("Action", formatPunishment(punishment), true),
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

async function logTo(guild, channelName, title, fields) {
  const channel = findChannel(guild, channelName);
  if (!channel) return;
  await channel.send({ embeds: [baseEmbed(title).addFields(fields).setFooter({ text: BRAND })] }).catch(() => {});
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
