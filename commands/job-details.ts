import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getJobDetails } from '../lib/jobs.js';
import { prisma } from '../database.js';

export const data = new SlashCommandBuilder()
 .setName('job-details')
 .setDescription('Get full details of a specific job by ID')
 .addStringOption(option => option.setName('job_id')
 .setDescription('The ID of the job')
 .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
 await interaction.deferReply();
 const jobId = interaction.options.getString('job_id')!;

 try {
 const job = await getJobDetails(jobId);
 // Check if it's stored in our DB to increment view count (assuming we store local jobs too)
 // If it's a completely external Adzuna job we might just not have a DB record yet unless saved.
 // For now we'll just show the details.
 const embed = new EmbedBuilder()
 .setTitle(job.title)
 .setURL(job.url)
 .setColor('#FFD700')
 .addFields(
 { name: 'Company', value: job.company, inline: true },
 { name: 'Location', value: job.location, inline: true },
 { name: 'Salary', value: job.salary },
 { name: 'Description', value: job.description.substring(0, 1024) || 'No description available.' }
 )
 .setFooter({ text: `ID: ${job.id}` });

 await interaction.editReply({ embeds: [embed] });
 } catch (error) {
 console.error(error);
 await interaction.editReply('An error occurred while fetching job details.');
 }
}
