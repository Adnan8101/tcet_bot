import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '../database.js';
import { redis } from '../lib/jobs.js';

export const data = new SlashCommandBuilder()
 .setName('browse-jobs')
 .setDescription('Browse available external jobs')
 .addStringOption(option => option.setName('keyword')
 .setDescription('Job title or keyword (e.g. AI, Backend)')
 .setRequired(false))
 .addIntegerOption(option =>
 option.setName('page')
 .setDescription('Page number')
 .setMinValue(1)
 .setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction) {
 await interaction.deferReply();
  const keyword = interaction.options.getString('keyword') || undefined;
  const page = interaction.options.getInteger('page') || 1;
  const userId = interaction.user.id;

  // Rate Limiting (100 requests / user / day)
  if (redis) {
    const rateLimitKey = `rate_limit:jobs:${userId}`;
    const requests = await redis.incr(rateLimitKey);
    if (requests === 1) {
      await redis.expire(rateLimitKey, 86400);
    }
    if (requests > 100) {
      await interaction.editReply('You have reached your daily limit of 100 job searches.');
      return;
    }
  }

  const take = 5;
  const skip = (page - 1) * take;

  let whereClause: any = {};
  if (keyword) {
    whereClause = {
      OR: [
        { title: { contains: keyword, mode: 'insensitive' } },
        { company: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } }
      ]
    };
  }

  const [results, total] = await Promise.all([
    prisma.jobPosting.findMany({
      where: whereClause,
      skip,
      take,
      orderBy: { created_at: 'desc' }
    }),
    prisma.jobPosting.count({ where: whereClause })
  ]);

  if (results.length === 0) {
    await interaction.editReply('No jobs found matching your criteria.');
    return;
  }

  const embed = new EmbedBuilder().setFooter({ text: 'Super Premium User' })
    .setTitle('Job Listings')
    .setDescription(`Showing page ${page} (${total} total jobs found)`)
    .setColor('#FFD700');

  for (const job of results) {
    const shortId = job.id.substring(0, 5).toUpperCase();
    let tagsStr = '';
    if (job.tags && job.tags.length > 0) {
      tagsStr = `\n**Tags:** ${job.tags.join(', ')}`;
    }
    embed.addFields({
      name: `${job.title} @ ${job.company}`,
      value: `**ID:** ${shortId}${tagsStr}\n[Apply Here](${job.apply_url})`
    });
  }

  await interaction.editReply({ embeds: [embed] });
}
