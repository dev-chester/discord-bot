// util-commands/myrunevent.js
const { SlashCommandBuilder } = require('discord.js');

const RACE_EVENTS = [
  'Grab Supertakbo',
  'Cabalen Half Marathon',
  'Makuleng Pulayi',
  'CCM32',
  'FTR2',
  'Takbo Tarlaqueño',
  'Cabalen Ultra',
  'Milo Marathon',
  'Manila Marathon',
  'Race for Life',
  'Pampanga Marathon',
  'Capas 32KM',
  'TBR2026'
];

const SIZES = ['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl'];

/* ---------- slash-command definition ---------- */
const myruneventCommand = new SlashCommandBuilder()
  .setName('myrunevent')
  .setDescription('Sign up for a running event')
  .addStringOption((o) =>
    o.setName('event')
      .setDescription('Choose your race')
      .setRequired(true)
      .addChoices(...RACE_EVENTS.map((e) => ({ name: e, value: e }))))
  .addStringOption((o) =>
    o.setName('name')
      .setDescription('Preferred name')
      .setRequired(true))
  .addNumberOption((o) =>
    o.setName('kilometers')
      .setDescription('Distance in km (decimals OK)')
      .setRequired(true)
      .setMinValue(0.1))
  .addStringOption((o) =>
    o.setName('size')
      .setDescription('Shirt size')
      .setRequired(true)
      .addChoices(...SIZES.map((s) => ({ name: s.toUpperCase(), value: s }))))
    .addStringOption((o) =>
    o.setName('target')
      .setDescription('Target time (OPTIONAL)')
      .setRequired(false));

/* ---------- interaction handler ---------- */
async function myruneventCommandHandler(interaction, client, db) {
  const race  = interaction.options.getString('event', true);
  const name  = interaction.options.getString('name', true);
  const km    = interaction.options.getNumber('kilometers', true);
  const target= interaction.options.getString('target') ?? '—';
  const size  = interaction.options.getString('size', true);

  if (db) {
    const stmt = db.prepare(
      `INSERT INTO run_signups
         (user_id, username, event, preferred_name,
          distance_km, target_time, size, ts)
       VALUES (?,?,?,?,?,?,?,?)`,
    );
    stmt.run(
      interaction.user.id,
      interaction.user.tag,
      race,
      name,
      km,
      target,
      size,
      Date.now(),
      (err) => err && console.error('DB insert error:', err.message),
    );
    stmt.finalize();
  }

  await interaction.reply({
    content:
      `**✅ Sign-up recorded!**\n` +
      `• Event: **${race}**\n` +
      `• Name: **${name}**\n` +
      `• Distance: **${km} km**\n` +
      `• Target: **${target}**\n` +
      `• Size: **${size.toUpperCase()}**`,
    ephemeral: false
  });
}

module.exports = { myruneventCommand, myruneventCommandHandler };
