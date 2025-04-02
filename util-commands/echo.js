const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const echoCommand = new SlashCommandBuilder()
.setName('echo')
.setDescription('Echo a message in a specified channel using multi-line input')
.addChannelOption(option =>
  option.setName('channel')
    .setDescription('The channel to post the message in')
    .setRequired(true)
)
.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
.toJSON();    

async function echoCommandHandler(interaction) {
  const channel = interaction.options.getChannel('channel');
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
    
    const modal = new ModalBuilder()
      .setCustomId(`echoModal|${channel.id}`) 
      .setTitle('Enter Your Message');
    
    const messageInput = new TextInputBuilder()
      .setCustomId('echoMessage')
      .setLabel('Your Message')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Type your message here (multi-line supported)...')
      .setRequired(true);
    
    const actionRow = new ActionRowBuilder().addComponents(messageInput);
    modal.addComponents(actionRow);
    
    await interaction.showModal(modal);
}

async function modalSubmitHandler(interaction) {
  console.log('Modal submission received:', interaction.customId); 
    try {
      await interaction.deferReply({ ephemeral: true });
      const messageContent = interaction.fields.getTextInputValue('echoMessage');
      console.log('Message content:', messageContent);
      const [_, channelId] = interaction.customId.split('|'); 
      const targetChannel = interaction.guild.channels.cache.get(channelId);
      
      if (!targetChannel) {
        return interaction.editReply({ content: 'Channel not found.' });
      }
    
      await targetChannel.send(messageContent);
      await interaction.editReply({ content: 'Message sent!' });
    } catch (error) {
      console.error('Error sending echo message:', error);
      await interaction.editReply({ content: 'Failed to send message in that channel.' });
    }
    return; 
}

module.exports = { echoCommand, echoCommandHandler, modalSubmitHandler };