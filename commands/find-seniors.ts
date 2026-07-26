import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '../database.js';

export const data = new SlashCommandBuilder()
 .setName('find-seniors')
 .setDescription('Find senior alumni by skills')
 .addStringOption(option => option.setName('skill')
 .setDescription('Skill or keyword to search for (e.g. react, backend, AI)')
 .setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction) {
 await interaction.deferReply();
 const skill = interaction.options.getString('skill');
 try {
 const query: any = {
 role_tier: 'senior',
 directory_visible: true,
 open_to_connect: true
 };

 if (skill) {
 // NOTE: Prisma PostgreSQL arrays do not support case-insensitive 'has' out of the box nicely without raw queries,
 // but assuming the tags are stored consistently lowercase.
 query.skills_tags = {
 has: skill.toLowerCase()
 };
 }

 const seniors = await prisma.user.findMany({
 where: query,
 take: 10
 });

 if (seniors.length === 0) {
 await interaction.editReply('No senior alumni found matching your search.');
 return;
 }

 const embeds = seniors.map((user: any) => {
 const embed = new EmbedBuilder().setFooter({ text: 'TCET AIML' })
 .setTitle(user.full_name || 'Anonymous Senior')
 .setColor('#FFD700')
 .addFields(
 { name: 'Headline', value: user.headline || 'N/A' },
 { name: 'Current Title', value: user.current_title || 'N/A' },
 { name: 'Skills', value: (user.skills_tags || []).join(', ') || 'None listed' }
 );
 if (user.linkedin_public_url) {
 embed.addFields({ name: 'LinkedIn', value: user.linkedin_public_url });
 }
 return embed;
 });

 await interaction.editReply({ embeds });
 } catch (error) {
 console.error(error);
 await interaction.editReply('An error occurred while searching the directory.');
 }
}
