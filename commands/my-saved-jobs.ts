import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '../database.js';

export const data = new SlashCommandBuilder()
 .setName('my-saved-jobs')
 .setDescription('View your saved jobs and applications');

export async function execute(interaction: ChatInputCommandInteraction) {
 await interaction.deferReply({ ephemeral: true });

 try {
 const user = await prisma.user.findUnique({ where: { discord_id: interaction.user.id } });
 if (!user) {
 await interaction.editReply('You are not registered. Connect your profile first.');
 return;
 }

 const applications = await prisma.jobApplication.findMany({
 where: { user_id: user.id },
 orderBy: { created_at: 'desc' }
 });

 if (applications.length === 0) {
 await interaction.editReply('You have no saved jobs. Use `/save-job` to track your applications.');
 return;
 }

 const embed = new EmbedBuilder().setFooter({ text: 'Super Premium User' })
 .setTitle('My Saved Jobs')
 .setColor('#FFD700');

 for (const app of applications) {
 const date = app.applied_at ? app.applied_at.toDateString() : app.created_at.toDateString();
 embed.addFields({
 name: `${app.job_title} @ ${app.company}`,
 value: `**Status:** ${app.status}\n**Date:** ${date}\n[Link](${app.job_url})`
 });
 }

 await interaction.editReply({ embeds: [embed] });
 } catch (error) {
 console.error(error);
 await interaction.editReply('An error occurred while fetching your saved jobs.');
 }
}
