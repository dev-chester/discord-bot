const { SlashCommandBuilder } = require('discord.js');
const { calculateTrainingPaces, calculateVDOT, createPacesEmbed } = require('../util');

const mypaceCommand = new SlashCommandBuilder()
  .setName('mypace')
  .setDescription('Recommended training paces based from Daniels Running Formula')
  .addStringOption(option =>
    option.setName('distance')
      .setDescription('Preferred training distance')
      .setRequired(true)
      .addChoices(
        { name: '5 KM', value: '5' },
        { name: '10 KM', value: '10' },
        { name: 'Half Marathon', value: '21.1' },
        { name: 'Marathon', value: '42.195' },
      )
    )
  .addStringOption(option =>
    option.setName('time')
      .setDescription('Recent Personal Best Time (HH:MM:SS)')
      .setRequired(true)
  )
  .addBooleanOption(option =>
    option.setName('wantshare')
      .setDescription('You want to share your training paces to the channel?')
      .setRequired(true)
  )
  .toJSON();

async function mypaceCommandHandler(interaction, client) {
    const distance = parseFloat(interaction.options.getString('distance'));
    const time = interaction.options.getString('time');
    const isShare = !(interaction.options.getBoolean('wantshare'));
  try {
    const {showVdot, vdot} = calculateVDOT(time, distance);
    console.log('debug  ---  ', vdot, showVdot, time, distance);
    const result = calculateTrainingPaces(vdot, distance, time, showVdot);
    const embed = createPacesEmbed(result);
    await interaction.reply({ embeds: [embed], ephemeral: isShare });
  } catch (error) {
    console.error(error);
  }
}


  module.exports = { mypaceCommand, mypaceCommandHandler };