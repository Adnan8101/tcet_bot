import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '../database.js';

export const data = new SlashCommandBuilder()
 .setName('directory-card')
 .setDescription('Show a specific user\'s directory card')
 .addUserOption(option => option.setName('user')
 .setDescription('The discord user to lookup')
 .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
 await interaction.deferReply();
 const targetUser = interaction.options.getUser('user')!;

 try {
 const user = await prisma.user.findUnique({
 where: { discord_id: targetUser.id }
 });

 if (!user) {
 await interaction.editReply('This user is not registered in the directory.');
 return;
 }

 if (!user.directory_visible) {
 await interaction.editReply('This user has not opted into the directory.');
 return;
 }

 const embed = new EmbedBuilder().setFooter({ text: 'TCET AIML' })
 .setTitle(user.full_name || targetUser.tag)
 .setColor('#FFD700')
 .setThumbnail(user.profile_photo_url || targetUser.displayAvatarURL())
 .addFields(
 { name: 'Role', value: user.role_tier || 'N/A', inline: true },
 { name: 'Current Title', value: user.current_title || 'N/A', inline: true },
 { name: 'Headline', value: user.headline || 'N/A' },
 { name: 'Skills', value: (user.skills_tags || []).join(', ') || 'None listed' }
 );

 if (user.open_to_connect && user.linkedin_public_url) {
 embed.addFields({ name: 'LinkedIn URL', value: user.linkedin_public_url });
 }

 await interaction.editReply({ embeds: [embed] });
 } catch (error) {
 console.error(error);
 await interaction.editReply('An error occurred while fetching the directory card.');
 }
}
