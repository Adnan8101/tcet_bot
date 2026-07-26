import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '../database.js';

export const data = new SlashCommandBuilder()
 .setName('update-job-status')
 .setDescription('Update the status of a saved job')
 .addStringOption(option => option.setName('job_title_or_company')
 .setDescription('Part of the job title or company name to identify the job')
 .setRequired(true))
 .addStringOption(option => option.setName('status')
 .setDescription('The new status')
 .addChoices(
 { name: 'Applied', value: 'Applied' },
 { name: 'Interviewing', value: 'Interviewing' },
 { name: 'Offer', value: 'Offer' },
 { name: 'Rejected', value: 'Rejected' },
 { name: 'Saved', value: 'Saved' }
 )
 .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
 await interaction.deferReply({ ephemeral: true });
 const searchTerm = interaction.options.getString('job_title_or_company')!.toLowerCase();
 const status = interaction.options.getString('status')!;

 try {
 const user = await prisma.user.findUnique({ where: { discord_id: interaction.user.id } });
 if (!user) {
 await interaction.editReply('You are not registered.');
 return;
 }

 const applications = await prisma.jobApplication.findMany({
 where: { user_id: user.id }
 });

 const matchingApp = applications.find(app => app.job_title.toLowerCase().includes(searchTerm) || app.company.toLowerCase().includes(searchTerm)
 );

 if (!matchingApp) {
 await interaction.editReply('No matching saved job found. Please try a different search term.');
 return;
 }

 await prisma.jobApplication.update({
 where: { id: matchingApp.id },
 data: {
 status,
 applied_at: status === 'Applied' && !matchingApp.applied_at ? new Date() : undefined
 }
 });

 await interaction.editReply(`Updated status of **${matchingApp.job_title} @ ${matchingApp.company}** to **${status}**.`);
 } catch (error) {
 console.error(error);
 await interaction.editReply('An error occurred while updating the job status.');
 }
}
