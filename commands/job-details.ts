import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
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
  const job = await prisma.jobPosting.findFirst({
  where: {
  id: { startsWith: jobId, mode: 'insensitive' }
  }
  });
  if (!job) {
  await interaction.editReply('Could not find that job. Make sure you entered the correct ID.');
  return;
  }

  // Increment view count
  await prisma.jobPosting.update({
    where: { id: job.id },
    data: { view_count: { increment: 1 } }
  });

  const shortId = job.id.substring(0, 5).toUpperCase();
  const embed = new EmbedBuilder()
  .setTitle(job.title)
  .setURL(job.apply_url)
  .setColor('#FFD700')
  .addFields(
  { name: 'Company', value: job.company, inline: true },
  { name: 'Description', value: job.description.substring(0, 1024) || 'No description available.' }
  )
  .setFooter({ text: `ID: ${shortId}` });

 await interaction.editReply({ embeds: [embed] });
 } catch (error) {
 console.error(error);
 await interaction.editReply('An error occurred while fetching job details.');
 }
}
