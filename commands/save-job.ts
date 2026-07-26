import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '../database.js';
import { getJobDetails } from '../lib/jobs.js';

export const data = new SlashCommandBuilder()
 .setName('save-job')
 .setDescription('Save a job to track your application')
 .addStringOption(option => option.setName('job_id')
 .setDescription('The ID of the job to save')
 .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
 await interaction.deferReply({ ephemeral: true });
 const jobId = interaction.options.getString('job_id')!;

 try {
 // 1. Ensure user exists
 let user = await prisma.user.findUnique({ where: { discord_id: interaction.user.id } });
 if (!user) {
 user = await prisma.user.create({
 data: { discord_id: interaction.user.id }
 });
 }

 // 2. Check if already saved
 // Since Adzuna job IDs are strings and might be different from our uuid, we store it in job_url or create a separate field.
 // We will use job_url as the unique identifier for external jobs if it's the Adzuna URL.
 const job = await getJobDetails(jobId);
 if (!job) {
 await interaction.editReply('Could not find that job. It may have expired from cache — try `/browse-jobs` again and use the ID shown there.');
 return;
 }
 const existing = await prisma.jobApplication.findFirst({
 where: {
 user_id: user.id,
 job_url: job.url
 }
 });

 if (existing) {
 await interaction.editReply('You have already saved this job.');
 return;
 }

 // 3. Save job
 await prisma.jobApplication.create({
 data: {
 user_id: user.id,
 job_title: job.title,
 company: job.company,
 job_url: job.url,
 status: 'Saved',
 }
 });

 await interaction.editReply(`Successfully saved **${job.title}** at **${job.company}**!`);
 } catch (error) {
 console.error(error);
 await interaction.editReply('An error occurred while saving the job.');
 }
}
