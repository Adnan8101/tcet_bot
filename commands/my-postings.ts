import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { prisma } from '../database.js';

export const data = new SlashCommandBuilder()
 .setName('my-postings')
 .setDescription('View your posted jobs');

export async function execute(interaction: ChatInputCommandInteraction) {
 const user = await prisma.user.findUnique({ where: { discord_id: interaction.user.id } });

 if (!user) {
 await interaction.reply({ content: 'You are not registered.', ephemeral: true });
 return;
 }

 const jobs = await prisma.jobPosting.findMany({
 where: { posted_by_user_id: user.id },
 orderBy: { created_at: 'desc' }
 });

 if (jobs.length === 0) {
 await interaction.reply({ content: 'You have not posted any jobs.', ephemeral: true });
 return;
 }

 const embed = new EmbedBuilder().setFooter({ text: 'TCET AIML' })
 .setTitle('Your Job Postings')
 .setColor('#FFD700');

 for (const job of jobs.slice(0, 10)) { // limit to 10 for embed fields
 const isExpired = job.expires_at && job.expires_at < new Date();
 const status = isExpired ? ' Expired' : ' Active';
 embed.addFields({
 name: `${job.title} at ${job.company}`,
 value: `**Status:** ${status} | **Views:** ${job.view_count} | **Clicks:** ${job.click_count}\n**ID:** \`${job.id}\``,
 inline: false
 });
 }

 await interaction.reply({ embeds: [embed], ephemeral: true });
}
