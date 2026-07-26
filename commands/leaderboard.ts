import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { prisma } from '../database.js';

export const data = new SlashCommandBuilder()
 .setName('leaderboard')
 .setDescription('View the community leaderboard for this month');

export async function execute(interaction: ChatInputCommandInteraction) {
 await interaction.deferReply();

 const now = new Date();
 const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

 // 1. Top Job Posters this month
 const topPosters = await prisma.jobPosting.groupBy({
 by: ['posted_by_user_id'],
 _count: { id: true },
 where: { created_at: { gte: startOfMonth },
 posted_by_user_id: { not: null }
 },
 orderBy: { _count: { id: 'desc' } },
 take: 10
 });

 let topPostersText = '';
 let posterRank = 1;
 for (const poster of topPosters) {
 if (!poster.posted_by_user_id) continue;
 const user = await prisma.user.findUnique({ where: { id: poster.posted_by_user_id } });
 if (user && user.directory_visible) {
 topPostersText += `${posterRank}. <@${user.discord_id}> - ${poster._count.id} jobs\n`;
 posterRank++;
 if (posterRank > 5) break;
 }
 }

 // 2. Most Accepted Connections this month
 const acceptedRequests = await prisma.connectRequest.findMany({
 where: {
 status: 'accepted',
 updated_at: { gte: startOfMonth }
 }
 });

 const connectionCounts: Record<string, number> = {};
 for (const req of acceptedRequests) {
 connectionCounts[req.requester_id] = (connectionCounts[req.requester_id] || 0) + 1;
 connectionCounts[req.target_id] = (connectionCounts[req.target_id] || 0) + 1;
 }

 const sortedConnections = Object.entries(connectionCounts)
 .sort((a, b) => b[1] - a[1]);

 let topConnectorsText = '';
 let connectorRank = 1;
 for (const [userId, count] of sortedConnections) {
 const user = await prisma.user.findUnique({ where: { id: userId } });
 if (user && user.directory_visible) {
 topConnectorsText += `${connectorRank}. <@${user.discord_id}> - ${count} connections\n`;
 connectorRank++;
 if (connectorRank > 5) break;
 }
 }

 const embed = new EmbedBuilder().setFooter({ text: 'Super Premium User' })
 .setTitle(` Leaderboard - ${now.toLocaleString('default', { month: 'long' })}`)
 .setColor('#FFD700');

 if (topPostersText) {
 embed.addFields({ name: 'Top Job Posters', value: topPostersText, inline: false });
 } else {
 embed.addFields({ name: 'Top Job Posters', value: 'No jobs posted yet this month.', inline: false });
 }

 if (topConnectorsText) {
 embed.addFields({ name: 'Most Accepted Connections', value: topConnectorsText, inline: false });
 } else {
 embed.addFields({ name: 'Most Accepted Connections', value: 'No new connections this month.', inline: false });
 }

 await interaction.editReply({ embeds: [embed] });
}
