const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const birthdayCommand = new SlashCommandBuilder()
  .setName('birthday')
  .setDescription('Send a birthday video from Google Drive')
  .addChannelOption(option =>
    option.setName('channel')
      .setDescription('The channel to post the message in')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('fileid')
      .setDescription('Google Drive file ID for the video')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('celebrantname')
      .setDescription('Name of the celebrant')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
  .toJSON();

  async function birthdayCommandHandler(interaction ,client) {
    await interaction.deferReply({ ephemeral: true });
    const channel = interaction.options.getChannel('channel');
    const fileId = interaction.options.getString('fileid');
    const celebrantName = interaction.options.getString('celebrantname');

    const safeName = celebrantName.replace(/\s+/g, '_');
    const destinationPath = `./video-${safeName}.mp4`;

    try {
      await downloadFile(fileId, destinationPath);
      
      const targetChannel = client.channels.cache.get(channel.id);
      if (!targetChannel) {
        throw new Error('Target channel not found');
      }
      
      await targetChannel.send({
        content: `Happy Birthday, ${celebrantName}! Enjoy your day!`,
        files: [destinationPath]
      });
      
      await interaction.editReply({ content: 'Birthday video sent successfully.' });
    } catch (error) {
      console.error('Error downloading or sending birthday video:', error);
      await interaction.editReply({ content: 'Failed to send birthday video.' });
    }

  }

  module.exports = { birthdayCommand, birthdayCommandHandler };