const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

const PAGE_SIZE = 5;  // Number of events per page
const eventCache = new Map();  // messageId -> { events, timestamp }

const upcomingEventsCommand = new SlashCommandBuilder()
  .setName('upcoming-events')
  .setDescription('View upcoming run events');

async function fetchEvents(API_URL) {
  try {
    const response = await axios.get(API_URL);
    return response.data.data || [];
  } catch (err) {
    console.error('❌ Failed to fetch events:', err.message);
    return null;
  }
}

function buildEventsEmbed(events, page) {
  const embed = new EmbedBuilder()
    .setTitle(`🏃 Upcoming Run Events (Page ${page + 1})`)
    .setColor(0x00AEFF)
    .setTimestamp();

  const start = page * PAGE_SIZE;
  const pageEvents = events.slice(start, start + PAGE_SIZE);

  pageEvents.forEach(event => {
    const dateStr = new Date(event.date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const distances = event.categories.map(c => c.name).join(', ');

    embed.addFields({
      name: `🏁 **${event.name}**`,
      value: `📅 **${dateStr}**\n📍 **${event.locationCity}, ${event.locationStateOrProvince.name}**\n📏 **${distances}**`,
      inline: false
    });
  });

  return embed;
}

function buildPaginationRow(page, totalPages) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`prev_${page}`)
      .setLabel('⬅ Prev')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`next_${page}`)
      .setLabel('Next ➡')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),
    new ButtonBuilder()
      .setCustomId(`refresh_${page}`)
      .setLabel('🔄 Refresh')
      .setStyle(ButtonStyle.Primary)
  );
}

async function upcomingEventsHandler(interaction, API_URL) {
  await interaction.deferReply();

  const events = await fetchEvents(API_URL);

  if (!events) {
    await interaction.editReply('❌ Could not fetch events. Please try again later.');
    return;
  }

  if (events.length === 0) {
    await interaction.editReply('📭 No upcoming events found.');
    return;
  }

  const totalPages = Math.ceil(events.length / PAGE_SIZE);
  const page = 0;

  const embed = buildEventsEmbed(events, page);
  const row = buildPaginationRow(page, totalPages);

  await interaction.editReply({
    embeds: [embed],
    components: [row]
  });

  // Optionally, cache events in memory if you'd rather not re-fetch on button press
}
async function handleUpcomingEventsButton(interaction, API_URL) {
  const [action, rawPage] = interaction.customId.split('_', 2);
  let currentPage = parseInt(rawPage, 10);
  if (isNaN(currentPage)) currentPage = 0;

  let newPage = currentPage;
  if (action === 'prev') {
    newPage = Math.max(currentPage - 1, 0);
  } else if (action === 'next') {
    newPage = currentPage + 1;
  }

  await interaction.deferUpdate();

  let events;
  if (action === 'refresh') {
    // Only fetch new data on refresh
    events = await fetchEvents(API_URL);
    if (!events || events.length === 0) {
      await interaction.message.edit({
        content: '📭 No upcoming events found.',
        embeds: [],
        components: []
      });
      eventCache.delete(interaction.message.id);
      return;
    }
    eventCache.set(interaction.message.id, { events, timestamp: Date.now() });
  } else {
    // For prev/next, use cached data
    const cache = eventCache.get(interaction.message.id);
    if (!cache) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`refresh_${currentPage}`)
          .setLabel('🔄 Refresh')
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.message.edit({
        content: '⚠ Data expired or missing. Please refresh.',
        embeds: [],
        components: [row]
      });

      await interaction.followUp({
        content: '⚠ Please click Refresh to reload events.',
        ephemeral: true
      });

      return;
    }
    events = cache.events;
  }

  const totalPages = Math.ceil(events.length / PAGE_SIZE);
  newPage = Math.min(newPage, totalPages - 1);

  const embed = buildEventsEmbed(events, newPage);
  const row = buildPaginationRow(newPage, totalPages);

  await interaction.message.edit({
    embeds: [embed],
    components: [row]
  });
}


module.exports = {
  upcomingEventsCommand,
  upcomingEventsHandler,
  handleUpcomingEventsButton
};
