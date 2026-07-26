import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '../database.js';

export const data = new SlashCommandBuilder()
 .setName('find-juniors')
 .setDescription('Find junior alumni by skills')
 .addStringOption(option => option.setName('skill')
 .setDescription('Skill or keyword to search for (e.g. react, backend, AI)')
 .setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction) {
 await interaction.deferReply();
 const skill = interaction.options.getString('skill');
 try {
 const query: any = {
 role_tier: 'junior',
 directory_visible: true,
 open_to_connect: true
 };

 if (skill) {
 query.skills_tags = {
 has: skill.toLowerCase()
 };
 }

 const juniors = await prisma.user.findMany({
 where: query,
 take: 10
 });

 if (juniors.length === 0) {
 await interaction.editReply('No junior alumni found matching your search.');
 return;
 }

 const embeds = juniors.map((user: any) => {
 const embed = new EmbedBuilder().setFooter({ text: 'TCET AIML' })
 .setTitle(user.full_name || 'Anonymous Junior')
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
