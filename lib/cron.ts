import cron from 'node-cron';
import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import { prisma } from '../database.js';

export function startCronJobs(client: Client) {
  // 1. Auto-expire jobs (Runs every hour)
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Running auto-expire jobs check...');
    try {
      const expiredJobs = await prisma.jobPosting.findMany({
        where: {
          expires_at: { lt: new Date() },
          channel_message_id: { not: null },
          guild_id: { not: null }
        }
      });

      for (const job of expiredJobs) {
        if (!job.guild_id || !job.channel_message_id) continue;
        
        const guildConfig = await prisma.guildConfig.findUnique({ where: { guild_id: job.guild_id } });
        const jobsChannelId = guildConfig?.jobs_channel_id;

        if (jobsChannelId) {
          const channel = client.channels.cache.get(jobsChannelId) as TextChannel;
          if (channel) {
            try {
              const message = await channel.messages.fetch(job.channel_message_id);
              if (message && message.embeds.length > 0) {
                const oldEmbed = message.embeds[0];
                if (!oldEmbed.title?.startsWith('[EXPIRED]')) {
                  const newEmbed = EmbedBuilder.from(oldEmbed)
                    .setTitle(`[EXPIRED] ${oldEmbed.title}`)
                    .setColor('#ff0000')
                    .setFooter({ text: 'This job has expired.' });
                  await message.edit({ embeds: [newEmbed], components: [] });
                }
              }
            } catch (e) {
              console.error(`[CRON] Could not edit expired job message ${job.id}`);
            }
          }
        }
      }
    } catch (e) {
      console.error('[CRON] Error in auto-expire jobs', e);
    }
  });

  // 2. Connection reminder (Runs daily at noon)
  cron.schedule('0 12 * * *', async () => {
    console.log('[CRON] Running connection reminders...');
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const pendingRequests = await prisma.connectRequest.findMany({
        where: {
          status: 'pending',
          created_at: { lt: threeDaysAgo },
          updated_at: { lt: threeDaysAgo } 
        }
      });

      for (const request of pendingRequests) {
        const target = await prisma.user.findUnique({ where: { id: request.target_id } });
        const requester = await prisma.user.findUnique({ where: { id: request.requester_id } });
        if (target && requester) {
          try {
            const discordUser = await client.users.fetch(target.discord_id);
            await discordUser.send(`Reminder: You have a pending connection request from <@${requester.discord_id}>.`);
            await prisma.connectRequest.update({ where: { id: request.id }, data: { updated_at: new Date() } });
          } catch (e) {
            console.error(`[CRON] Could not DM user ${target.discord_id}`);
          }
        }
      }
    } catch (e) {
      console.error('[CRON] Error in connection reminder', e);
    }
  });

  // 3. Job expiry reminder (Runs daily at 10 AM)
  cron.schedule('0 10 * * *', async () => {
    console.log('[CRON] Running job expiry reminders...');
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const expiringJobs = await prisma.jobPosting.findMany({
        where: {
          expires_at: {
            gte: new Date(),
            lt: tomorrow
          }
        }
      });

      for (const job of expiringJobs) {
        if (!job.posted_by_user_id) continue;
        const owner = await prisma.user.findUnique({ where: { id: job.posted_by_user_id } });
        if (owner) {
          try {
            const discordUser = await client.users.fetch(owner.discord_id);
            await discordUser.send(`Reminder: Your job posting "**${job.title}**" is expiring in less than 24 hours.`);
          } catch (e) {
            console.error(`[CRON] Could not DM job owner ${owner.discord_id}`);
          }
        }
      }
    } catch (e) {
      console.error('[CRON] Error in job expiry reminder', e);
    }
  });
}
