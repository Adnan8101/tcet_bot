import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { searchJobs, redis } from '../lib/jobs.js';

export const data = new SlashCommandBuilder()
 .setName('browse-jobs')
 .setDescription('Browse available external jobs')
 .addStringOption(option => option.setName('keyword')
 .setDescription('Job title or keyword (e.g. AI, Backend)')
 .setRequired(false))
 .addStringOption(option => option.setName('location')
 .setDescription('Location (e.g. London, Remote)')
 .setRequired(false))
 .addBooleanOption(option => option.setName('remote')
 .setDescription('Remote jobs only')
 .setRequired(false))
 .addIntegerOption(option =>
 option.setName('page')
 .setDescription('Page number')
 .setMinValue(1)
 .setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction) {
 await interaction.deferReply();
 const keyword = interaction.options.getString('keyword') || undefined;
 const location = interaction.options.getString('location') || undefined;
 const remote = interaction.options.getBoolean('remote') || false;
 const page = interaction.options.getInteger('page') || 1;
 const userId = interaction.user.id;

 // Rate Limiting (100 requests / user / day)
 if (redis) {
 const rateLimitKey = `rate_limit:jobs:${userId}`;
 const requests = await redis.incr(rateLimitKey);
 if (requests === 1) {
 // Set expiration for 24 hours
 await redis.expire(rateLimitKey, 86400);
 }
 if (requests > 100) {
 await interaction.editReply('You have reached your daily limit of 100 job searches.');
 return;
 }
 }

 // Caching (10 minutes)
 let cachedData = null;
 const cacheKey = `jobs:${keyword}:${location}:${remote}:${page}`;
 if (redis) {
 const cached = await redis.get(cacheKey);
 if (cached) {
 cachedData = JSON.parse(cached);
 }
 }

 let results, total;

 if (cachedData) {
 results = cachedData.results;
 total = cachedData.total;
 } else {
 let searchLocation = location;
 if (remote) {
 searchLocation = searchLocation ? `${searchLocation} Remote` : 'Remote';
 }
 const response = await searchJobs({ keyword, location: searchLocation, page });
 results = response.results;
 total = response.total;

 if (redis) {
 await redis.set(cacheKey, JSON.stringify(response), 'EX', 600); // 10 minutes
 }
 }

 if (results.length === 0) {
 await interaction.editReply('No jobs found matching your criteria.');
 return;
 }

 const embed = new EmbedBuilder().setFooter({ text: 'Super Premium User' })
 .setTitle('Job Listings')
 .setDescription(`Showing page ${page} (${total} total jobs found)`)
 .setColor('#FFD700');

 for (const job of results) {
 embed.addFields({
 name: `${job.title} @ ${job.company}`,
 value: `**Location:** ${job.location}\n**Salary:** ${job.salary}\n**ID:** ${job.id}\n[Apply Here](${job.url})`
 });
 }

 await interaction.editReply({ embeds: [embed] });
}
