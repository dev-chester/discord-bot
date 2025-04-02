async function handleAssignRoleCommand(message) {
    if (message.content !== "assignrole" || message.author.id !== "319371747268755457") return; //me chester
  
    try {
      const roleMessage = await message.channel.send(
        "Hit the icon below with your usual routes!: \n 🟪 : [CPN] Runners from Concepcion \n 🟧 : [NCC] Runners from New Clark City \n 🟫 : [CRC] Runners from Ayala Cresendo, Tarlac  \n 🟩 : [CRK] Runners from Clark, Pampanga \n 🟦 : [TAR] Runners from Tarlac City \n ⬜ : [LSD] Long Slow Distance Run Invites \n ⬛ : [SPD] Speed Run Invites \n 🟨 : [MUL] Multisport Invites"
      );
      
      const emojis = ['🟪', '🟧', '🟫', '🟩', '🟦', '⬜', '⬛', '🟨'];
      for (const emoji of emojis) {
        await roleMessage.react(emoji);
      }
    } catch (error) {
      console.error('Error in handleAssignRoleCommand:', error);
    }
  }

async function handleWelcomeMessage(message){

  const fbRegex = /^FB:\s*(https?:\/\/(?:www\.)?facebook\.com\/\S+)/m;

  const match = message.content.match(fbRegex);
  if (match) {
    const fbLink = match[1];
    console.log('Extracted FB Link:', fbLink);
    try {
      await message.member.roles.add(VERIFIED_MEMBER_ROLE_ID);
      await message.member.roles.remove(process.env.NEW_MEMBER_ROLE_ID);
      
      message.reply(`You have been assigned the "Verified Member" role! Enjoy your stay.`);
    } catch (error) {
      console.error('Error in handleWelcomeMessage:', error);
      message.reply("There seems to be a problem assigning role and changing nickname.");
    }
  } else {
    console.log('Message does not contain a valid FB link.');
  }
}


async function handleReaction(reaction, user, add = true) {
    if (user.bot) return;
  
    if (reaction.message.partial) await reaction.message.fetch();
    if (reaction.partial) await reaction.fetch();
  
    const member = reaction.message.guild.members.cache.get(user.id);
    if (!member) return;
  
    const roleMappings = {
      '🟪': 'CPN',
      '🟧': 'NCC',
      '🟫': 'CRC',
      '🟩': 'CRK',
      '🟦': 'TAR',
      '⬜': 'LSD',
      '⬛': 'SPD',
      '🟨': 'MUL'
    };
  
    const roleName = roleMappings[reaction.emoji.name];
    if (!roleName) return;
  
    const role = reaction.message.guild.roles.cache.find((r) => r.name === roleName);
    if (!role) {
      console.error(`Role not found: ${roleName}`);
      return;
    }
  
    try {
      if (add) {
        await member.roles.add(role);
        console.log(`Added role ${roleName} to ${user.tag}`);
      } else {
        await member.roles.remove(role);
        console.log(`Removed role ${roleName} from ${user.tag}`);
      }
    } catch (error) {
      console.error(`Error modifying roles: ${error}`);
    }
  }
  

  module.exports = { handleAssignRoleCommand, handleWelcomeMessage, handleReaction };