const fs = require("fs");
const path = require("path");

const source = fs.readFileSync(path.join(__dirname, "index.js"), "utf8").replace(/^\uFEFF/, "");
const failures = [];

const messageRouter = source.match(/client\.on\("messageCreate"[\s\S]*?client\.on\("guildMemberAdd"/)?.[0] || "";
const routedCommands = new Set(
  [...messageRouter.matchAll(/command\s*===\s*"([^"]+)"/g)].map((match) => match[1])
);

const handlerReferences = [
  ...source.matchAll(/return\s+(handle[A-Za-z0-9_]+)\s*\(/g),
  ...source.matchAll(/return\s+(closeTicket|deleteTicket)\s*\(/g)
].map((match) => match[1]);

const handlerDefinitions = new Set(
  [...source.matchAll(/(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(/g)].map((match) => match[1])
);

for (const handler of new Set(handlerReferences)) {
  if (!handlerDefinitions.has(handler)) failures.push(`Missing handler definition: ${handler}`);
}

for (const setName of ["ADMIN_COMMANDS", "STAFF_COMMANDS"]) {
  const body = source.match(new RegExp(`const ${setName} = new Set\\(\\[([\\s\\S]*?)\\]\\);`))?.[1] || "";
  const commands = [...body.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  for (const command of commands) {
    if (!routedCommands.has(command)) failures.push(`${setName} contains an unrouted command: ${command}`);
  }
}

const interactionRouter = source.match(/client\.on\("interactionCreate"[\s\S]*?function isAdmin/)?.[0] || "";
const requiredButtons = [
  "cc:apply",
  "ticket:",
  "ticketclose:",
  "ticketdelete:",
  "tickettranscript:",
  "rr:",
  "staffapp:start:",
  "staffappreview:",
  "stafflogvote:",
  "giveaway:enter:",
  "guide:"
];

for (const customId of requiredButtons) {
  if (!interactionRouter.includes(`"${customId}"`)) failures.push(`Missing button route: ${customId}`);
}

for (const command of ["leaderboard", "donation", "donationremove"]) {
  if (!routedCommands.has(command)) failures.push(`Missing donation-system command route: ${command}`);
}
if (!source.includes("donationLeaderboardChannelId") || !source.includes("donationTierRoleIds")) {
  failures.push("Donation leaderboard persistent configuration is missing.");
}
const donationEmbedSection = source.match(/function buildDonationLeaderboardEmbed[\s\S]*?async function updateDonationLeaderboard/)?.[0] || "";
if (/Milestones|Automatic Reward Roles|Premium Milestones/.test(donationEmbedSection)) {
  failures.push("The public donation leaderboard contains non-leaderboard milestone or role details.");
}

if (!source.includes("https://discord.gg/WQ4U3ARjue")) failures.push("Ban appeal invite is not current.");
if (source.includes("https://discord.gg/Zv7uGG3SYj")) failures.push("Old ban appeal invite is still present.");

const ccCommandSection = source.match(/async function handleCcConfig[\s\S]*?function buildCcPanelEmbed/)?.[0] || "";
if (/<@&\$\{/.test(ccCommandSection) || /\$\{(?:role|targetRole)\}/.test(ccCommandSection)) {
  failures.push("Content Creator command replies contain a role mention.");
}
if (!ccCommandSection.includes("allowedMentions: { parse: []")) {
  failures.push("Content Creator command replies do not explicitly disable mentions.");
}

if (failures.length) {
  console.error("Command verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Command verification passed: ${routedCommands.size} command names/aliases and ${new Set(handlerReferences).size} referenced handlers checked.`);
