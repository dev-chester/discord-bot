const { SlashCommandBuilder } = require('discord.js');
const pingCommand = new SlashCommandBuilder()        
  .setName('ping')                                   
  .setDescription('Replies with Pong!') 
  .toJSON();    

  async function pingCommandHandler(interaction) {
    await interaction.reply('Pong!');
  }

  module.exports = { pingCommand, pingCommandHandler };