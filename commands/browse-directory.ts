import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '../database.js';

export const data = new SlashCommandBuilder()
 .setName('browse-directory')
 .setDescription('Browse all directory members by skill or role')
 .addStringOption(option => option.setName('skill')
 .setDescription('Skill or keyword (e.g. backend, AI)')
 .setRequired(false))
 .addStringOption(option => option.setName('role')
 .setDescription('Filter by role (junior, senior, alumnus)')
 .addChoices(
 { name: 'Junior', value: 'junior' },
 { name: 'Senior', value: 'senior' },
 { name: 'Alumnus', value: 'alumnus' }
 )
 .setRequired(false))
 .addIntegerOption(option =>
 option.setName('page')
 .setDescription('Page number')
 .setMinValue(1)
 .setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction) {
 await interaction.deferReply();
 const skill = interaction.options.getString('skill');
 const role = interaction.options.getString('role');
 const page = interaction.options.getInteger('page') || 1;
 const pageSize = 5;

 try {
 const query: any = {
 directory_visible: true,
 open_to_connect: true
 };

 if (role) query.role_tier = role;
 if (skill) {
 query.skills_tags = {
 has: skill.toLowerCase()
 };
 }

 const total = await prisma.user.count({ where: query });
 const members = await prisma.user.findMany({
 where: query,
 skip: (page - 1) * pageSize,
 take: pageSize,
 orderBy: { created_at: 'desc' }
 });

 if (members.length === 0) {
 await interaction.editReply('No members found matching your criteria.');
 return;
 }

 const embed = new EmbedBuilder().setFooter({ text: 'TCET AIML' })
 .setTitle('Alumni Directory')
 .setDescription(`Showing page ${page} of ${Math.ceil(total / pageSize)} (${total} total members)`)
 .setColor('#FFD700');

 for (const member of members) {
 const skills = (member.skills_tags || []).join(', ') || 'None';
 const headline = member.headline || 'N/A';
 embed.addFields({
 name: `${member.full_name || 'Anonymous'} - ${member.role_tier || 'User'}`,
 value: `**Headline:** ${headline}\n**Skills:** ${skills}`
 });
 }

 await interaction.editReply({ embeds: [embed] });
 } catch (error) {
 console.error(error);
 await interaction.editReply('An error occurred while browsing the directory.');
 }
}
