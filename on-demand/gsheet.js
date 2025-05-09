const { SlashCommandBuilder } = require('discord.js');
const assignRoleGsheet = new SlashCommandBuilder()        
  .setName('assignrole-from-gsheet')                                   
  .setDescription('On-demand command to assign roles based from Google Sheets') 
  .toJSON();    

  async function assignRoleFromGsheetHandler(interaction) {
    await interaction.reply('Assigning discord roles based from Google Sheet...');
  }

  module.exports = { assignRoleGsheet, assignRoleFromGsheetHandler };