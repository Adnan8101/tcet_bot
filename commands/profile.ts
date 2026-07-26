import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder,
 ModalBuilder,
 TextInputBuilder,
 TextInputStyle,
 ActionRowBuilder,
 ModalSubmitInteraction
} from 'discord.js';
import { prisma } from '../database.js';
export const myProfileCommand = {
 data: new SlashCommandBuilder()
 .setName('my-profile')
 .setDescription('View your Alumni Connect profile.'),
 async execute(interaction: ChatInputCommandInteraction) {
 const user = await prisma.user.findUnique({ where: { discord_id: interaction.user.id } });
 if (!user || !user.linkedin_sub) {
 return interaction.reply({
 content: 'Your LinkedIn account is not connected. Use `/connect-linkedin` first.',
 ephemeral: true
 });
 }
 const embed = new EmbedBuilder().setFooter({ text: 'Super Premium User' })
 .setTitle(`Profile: ${user.full_name || 'Unknown'}`)
 .setDescription(user.headline || 'No headline set')
 .setColor('#FFD700')
 .addFields(
 { name: 'Current Title', value: user.current_title || 'None', inline: true },
 { name: 'Role Tier', value: user.role_tier || 'None', inline: true },
 { name: 'Skills', value: user.skills_tags.length > 0 ? user.skills_tags.join(', ') : 'None' },
 { name: 'Directory Visible', value: user.directory_visible ? 'Yes' : 'No', inline: true },
 { name: 'Networking Status', value: user.open_to_connect ? 'Open to Connect' : 'Closed', inline: true }
 );
 if (user.profile_photo_url) {
 embed.setThumbnail(user.profile_photo_url);
 }
 await interaction.reply({ embeds: [embed], ephemeral: true });
 }
};
export const editProfileCommand = {
 data: new SlashCommandBuilder()
 .setName('edit-directory-profile')
 .setDescription('Edit your Alumni Connect profile and directory settings.'),
 async execute(interaction: ChatInputCommandInteraction) {
 const user = await prisma.user.findUnique({ where: { discord_id: interaction.user.id } });
 if (!user || !user.linkedin_sub) {
 return interaction.reply({
 content: 'Your LinkedIn account is not connected. Use `/connect-linkedin` first.',
 ephemeral: true
 });
 }
 const modal = new ModalBuilder()
 .setCustomId('editProfileModal')
 .setTitle('Edit Profile');
 const titleInput = new TextInputBuilder()
 .setCustomId('currentTitle')
 .setLabel('Current Title')
 .setStyle(TextInputStyle.Short)
 .setRequired(false)
 .setValue(user.current_title || '');
 const skillsInput = new TextInputBuilder()
 .setCustomId('skillsTags')
 .setLabel('Skills (comma separated)')
 .setStyle(TextInputStyle.Paragraph)
 .setRequired(false)
 .setValue(user.skills_tags.join(', '));
 const directoryInput = new TextInputBuilder()
 .setCustomId('directoryVisible')
 .setLabel('Visible in Directory? (yes/no)')
 .setStyle(TextInputStyle.Short)
 .setRequired(true)
 .setValue(user.directory_visible ? 'yes' : 'no');
 const connectInput = new TextInputBuilder()
 .setCustomId('openToConnect')
 .setLabel('Allow Networking Requests? (yes/no)')
 .setStyle(TextInputStyle.Short)
 .setRequired(true)
 .setValue(user.open_to_connect ? 'yes' : 'no');
 modal.addComponents(
 new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
 new ActionRowBuilder<TextInputBuilder>().addComponents(skillsInput),
 new ActionRowBuilder<TextInputBuilder>().addComponents(directoryInput),
 new ActionRowBuilder<TextInputBuilder>().addComponents(connectInput)
 );
 await interaction.showModal(modal);
 }
};
export async function handleModalSubmit(interaction: ModalSubmitInteraction) {
 const currentTitle = interaction.fields.getTextInputValue('currentTitle');
 const skillsTagsStr = interaction.fields.getTextInputValue('skillsTags');
 const directoryVisibleStr = interaction.fields.getTextInputValue('directoryVisible').toLowerCase().trim();
 const openToConnectStr = interaction.fields.getTextInputValue('openToConnect').toLowerCase().trim();
 const skills_tags = skillsTagsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
 const directory_visible = ['yes', 'y', 'true', '1'].includes(directoryVisibleStr);
 const open_to_connect = ['yes', 'y', 'true', '1'].includes(openToConnectStr);
 await prisma.user.update({
 where: { discord_id: interaction.user.id },
 data: {
 current_title: currentTitle,
 skills_tags: skills_tags,
 directory_visible,
 open_to_connect
 }
 });
 await interaction.reply({ content: 'Your profile has been updated successfully!', ephemeral: true });
}
