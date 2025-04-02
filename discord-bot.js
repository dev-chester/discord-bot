const { Client, GatewayIntentBits, REST, Routes, ActivityType
  , Partials
 } = require('discord.js');
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { getYearWeekPH } = require('./util.js');
const { handleAssignRoleCommand, handleWelcomeMessage, handleReaction } = require('./handlers.js');
const { pingCommand, pingCommandHandler } = require('./util-commands/ping.js');
const { echoCommand, modalSubmitHandler, echoCommandHandler } = require('./util-commands/echo.js');
const { birthdayCommand, birthdayCommandHandler } = require('./util-commands/birthday.js');
const { mypaceCommand, mypaceCommandHandler } = require('./util-commands/mypace.js');

const BOT_TOKEN = process.env.BOT_TOKEN;

const DiscordChannels = Object.freeze({
  TEST_BOT_CHANNEL: '1355041376261242930',
  FOR_EDITING: '1352292209843769466',
  WELCOME: '1344927218576523314',
  ASSIGN_ROLES: '1354676827196624897',
  INTRODUCE_YOURSELF: '1345290175881805835',
  GENERAL_CHAT: '1344928073157578752',
  ASK_ABOUT_RUNNING: '1345000074371141654',
  RUNNING_TECH: '1345000176854630530',
  MULTISPORTS_CHAT: '1345013264253452358',
  MARKET_PLACE: '1351123492489138230',
  EXCLUSIVE_DISCOUNTS: '1354664249036898305',
  CAPAS: '1345011573126860890',
  CLARK_CITY: '1344944899115712512',
  CONCEPCION: '1351373023294394469',
  CRESENDO: '1344944382415081575',
  NEW_CLARK_CITY: '1344944024112594964',
  TARLAC_CITY: '1344944489139273769',
  LSD: '1344949309950656532',
  MUL: '1345322831159889972',
});

const DiscordRoles = Object.freeze({
  ADMINS: '1344937172012109905',
  MODS: '1344937246767321168',
  NCCBOT: '1351750009108037705',
  VERIFIED_MEMBERS: '1345287302007619615',
  CPN: '1354452739895201895',
  NCC: '1354453078891561012',
  CRC: '1354455400530841803',
  CRK: '1354456115756273814',
  TAR: '1354464484499915044',
  LSD: '1354465434182877484',
  SPD: '1354465941504921640',
  MUL: '1354983742271393974',
  NEW_MEMBERS: '1345288326806241392'
});

const DiscordGuild = Object.freeze({
  GUILD_ID: '1344925981978263552'
});

const DiscordClient = Object.freeze({
  CLIENT_ID: '1346065995692773416'
});


const { year, week } = getYearWeekPH();
const dbFilename = `strava_${year}_week_${week}.db`;

// const dbPath = path.resolve(__dirname, `../../ncc/strava-auth/${dbFilename}`); 
// const db = new sqlite3.Database(dbPath, (err) => {
//   if (err) {
//     console.error("Error opening database:", err.message);
//   } else {
//     console.log("Connected to SQLite database.");
//   }
// });


async function sendAlertAndMarkActivity(activity, channel) {
  try {
    // Send the alert message to the Discord channel.
    await channel.send(`New Activity Alert!
Athlete ID: ${activity.athlete_id}
Name: ${activity.name}
Distance: ${(activity.distance / 1000).toFixed(2)} km
Moving Time: ${activity.moving_time} sec`);

    // Once the message is sent, update the record in the database.
    const updateQuery = `UPDATE activities SET synced = 1 WHERE activity_id = ?`;
    db.run(updateQuery, [activity.activity_id], function (err) {
      if (err) {
        console.error(`Error updating alerted status for activity ${activity.activity_id}:`, err.message);
      } else {
        console.log(`Activity ${activity.activity_id} marked as alerted.`);
      }
    });
  } catch (err) {
    console.error(`Error sending message for activity ${activity.activity_id}:`, err);
  }
}


// Polling function to check for new activities
function checkNewActivities() {
  console.log("Checking for new activities...");
  // Query activities added after the last checked timestamp.
  const query = `
    SELECT *
    FROM activities
    WHERE synced = 0
    ORDER BY created_at ASC
  `;
  db.all(query, (err, rows) => {
    console.log("Rows:", rows);
    if (err) {
      return console.error("Error querying activities:", err.message);
    }
    if (rows && rows.length > 0) {
      // Get the channel where you want to post the updates.
      const channel = client.channels.cache.get(DiscordChannels.TEST_BOT_CHANNEL); // Replace with your channel ID
      if (!channel) {
        return console.error("Channel not found.");
      }
      
      // Process each activity sequentially.
    rows.forEach(activity => {
      sendAlertAndMarkActivity(activity, channel);
    });
    }
  });
}


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Reaction, Partials.User]
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    client.user.setPresence({
      status: 'online',
      activities: [{
        name: 'with code: https://github.com/dev-chester/discord-bot',
        type: ActivityType.Playing ,
        url: "https://github.com/dev-chester/discord-bot"
      }]
    });
    console.log("Presence set successfully.");
  } catch (error) {
    console.error("Error setting presence:", error);
  }
});

client.on('messageReactionAdd', (reaction, user) => {
  handleReaction(reaction, user, true);
});

client.on('messageReactionRemove', (reaction, user) => {
  handleReaction(reaction, user, false);
});


client.on('messageCreate', async message => {
  console.log(message.channel.id, " " , message.content);

  if (message.author.bot) return;

  if (message.channel.id === DiscordChannels.ASSIGN_ROLES) {
    await handleAssignRoleCommand(message);
  } else if (message.channel.id === DiscordChannels.WELCOME) {
    await handleWelcomeMessage(message);
  }
});

const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

(async () => {
  try {
    console.log('Started refreshing slash commands.');
    await rest.put(
      Routes.applicationGuildCommands(DiscordClient.CLIENT_ID, DiscordGuild.GUILD_ID),
      { body: [ 
          pingCommand, 
          echoCommand, 
          birthdayCommand, 
          mypaceCommand
        ] }
    );
    console.log('Successfully registered slash commands.');
  } catch (error) {
    console.error('Error registering slash commands:', error);
  }
})();

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});


client.on('interactionCreate', async interaction => {
  if (interaction.isModalSubmit() && interaction.customId.startsWith('echoModal|')) {
    await modalSubmitHandler(interaction);
  }

  if (interaction.commandName === 'echo') {
    await echoCommandHandler(interaction);
  }

  if (!interaction.isChatInputCommand()) return; 
  
  if (interaction.commandName === 'ping') {
    pingCommandHandler(interaction);
  }

  if (interaction.commandName === 'birthday') {
    await birthdayCommandHandler(interaction, client);
  }

  if (interaction.commandName === 'mypace'){
    await mypaceCommandHandler(interaction, client);
  }

});

client.login(BOT_TOKEN);
