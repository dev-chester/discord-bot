const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');


let lastScrape = 0; // ms epoch
const MIN_INTERVAL = 30 * 1000; // 30 s


const shoeSpecsCommand = new SlashCommandBuilder()
  .setName('shoe-specs')
  .setDescription('Get RunRepeat lab data for a running shoe')
  .addStringOption(o =>
    o.setName('query')
     .setDescription('Model name, e.g. "novablast 5"')
     .setRequired(true)
  );

const headers = {
  'User-Agent': 'Mozilla/5.0 (compatible; DiscordBot/1.0; +https://github.com/yourrepo)'
};

function grab(html, label, rx){
  return (html.match(new RegExp(`${label}[^\\d]+${rx}`, 'i'))||[])[1]||null;
}

/* ---------- helpers ---------- */
async function findProductUrl(query) {
    try {
        const q = encodeURIComponent(query);

        console.log(`https://runrepeat.com/search?q=${q}`)
        const { data } = await axios.get(
            `https://runrepeat.com/search?q=${q}`,
            { headers }
        );

        console.log("data:", data); // log first 100 chars for debugging
        const $ = cheerio.load(data);
        // first result link
        const first = $('a.result-card, a.flex').first().attr('href');
        if (first) return 'https://runrepeat.com' + first;
        // naive fallback slug
        return 'https://runrepeat.com/' + query.toLowerCase().replace(/\s+/g, '-');
    }catch(err){
      console.error("Error finding product URL:", err);
      return null;
    }
}

const cache = new Map();

async function scrapeSpecs(url) {
  if (cache.has(url) && Date.now() - cache.get(url).ts < 6*60*60*1000)
    return cache.get(url).data;

  const { data: html } = await axios.get(url, { headers });
  const $ = cheerio.load(html);

  const grab = (label, rx) => (html.match(new RegExp(`${label}[^\\d]+${rx}`, 'i'))||[])[1]||null;

  const rating   = grab('Audience verdict', '(\\d{1,3})');
  const drop     = grab('Drop', '([\\d.]+)\\s*mm');
  const weight   = grab('Weight', '([\\d.]+)\\s*oz');
//   const breath   = (html.match(/Breathability<\\/[^>]*>\\s*([^<]+)/i)||[])[1];
//   const widthCat = (html.match(/Width\\s*\\/\\s*fit<\\/[^>]*>\\s*([^<]+)/i)||[])[1];
  const toeBox   = grab('Toebox width[^\\d]+', '([\\d.]+)\\s*mm');
  const cons     = [];
  $('#__next').find('h3:contains("Cons") + ul li').each((_, li) =>
      cons.push($(li).text().trim()));

  const data = { rating, drop, weight, breath, widthCat, toeBox, cons, url };
  cache.set(url, { ts: Date.now(), data });
  return data;
}

async function shoeCommandHandler(interaction){
  await interaction.deferReply();
  const now = Date.now();

  if(now - lastScrape < MIN_INTERVAL){
    const waitSec = Math.ceil((MIN_INTERVAL - (now - lastScrape))/1000);
    return interaction.editReply(`⏳ Rate‑limit: please wait ${waitSec}s before the next lookup.`);
  }

  try{
    const query  = interaction.options.getString('query', true);
    console.log("query:", query);
    const pUrl   = await findProductUrl(query);
    console.log("product URL:", pUrl);
    const specs  = await scrapeSpecs(pUrl);

    lastScrape = Date.now(); // update the global timer here

    if(!specs.drop){
      throw new Error('Specs not found – typo?');
    }

    const embed = new EmbedBuilder()
      .setTitle(`RunRepeat lab data – ${query}`)
      .setURL(specs.url)
      .addFields(
        { name: 'Rating',        value: `${specs.rating}/100`, inline: true },
        { name: 'Drop',          value: `${specs.drop} mm`,     inline: true },
        { name: 'Weight',        value: `${specs.weight} oz`,   inline: true },
        // { name: 'Breathability', value: specs.breath ?? '—',    inline: true },
        // { name: 'Width',         value: specs.widthCat ?? '—',  inline: true },
        { name: 'Toebox width',  value: `${specs.toeBox} mm`,   inline: true }
      )
      .setDescription(
        specs.cons.length ? `**Cons**\n• ${specs.cons.join('\n• ')}` : 'No cons listed 🎉')
      .setFooter({ text: 'Data scraped from RunRepeat.com' });

    await interaction.editReply({ embeds: [embed] });
  } catch(err){
    console.error(err);
    await interaction.editReply('❌ Could not fetch that shoe – try again later.');
  }
}

module.exports = { shoeSpecsCommand, shoeCommandHandler };