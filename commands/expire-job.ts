import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField, TextChannel, EmbedBuilder } from 'discord.js';
import { prisma } from '../database.js';

export const data = new SlashCommandBuilder()
 .setName('expire-job')
 .setDescription('Expire a job listing early')
 .addStringOption(option => option.setName('job_id')
 .setDescription('The ID of the job')
 .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
 const jobId = interaction.options.getString('job_id')!;
 const user = await prisma.user.findUnique({ where: { discord_id: interaction.user.id } });

 if (!user) {
 await interaction.reply({ content: 'You are not registered.', ephemeral: true });
 return;
 }

 const job = await prisma.jobPosting.findUnique({ where: { id: jobId } });
 if (!job) {
 await interaction.reply({ content: 'Job not found.', ephemeral: true });
 return;
 }

 let isAdmin = false;
 if (interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageGuild)) {
 isAdmin = true;
 }
 const guildConfig = await prisma.guildConfig.findUnique({ where: { guild_id: interaction.guildId! } });
 const adminRoleId = guildConfig?.admin_role_id;

 // Type assertion for roles
 const memberRoles = (interaction.member as any)?.roles;
 if (adminRoleId && memberRoles?.cache?.has(adminRoleId)) {
 isAdmin = true;
 }
 if (job.posted_by_user_id !== user.id && !isAdmin) {
 await interaction.reply({ content: 'You do not have permission to expire this job.', ephemeral: true });
 return;
 }

 if (job.expires_at && job.expires_at < new Date()) {
 await interaction.reply({ content: 'This job is already expired.', ephemeral: true });
 return;
 }

 await prisma.jobPosting.update({
 where: { id: jobId },
 data: { expires_at: new Date() }
 });

 // Edit Discord message if it exists
 const jobsChannelId = guildConfig?.jobs_channel_id;
 if (job.channel_message_id && jobsChannelId) {
 const channel = interaction.client.channels.cache.get(jobsChannelId) as TextChannel;
 if (channel) {
 try {
 const message = await channel.messages.fetch(job.channel_message_id);
 if (message && message.embeds.length > 0) {
 const oldEmbed = message.embeds[0];
 const newEmbed = EmbedBuilder.from(oldEmbed)
 .setTitle(`[EXPIRED] ${oldEmbed.title}`)
 .setColor('#FFD700')
 .setFooter({ text: 'TCET AIML' });
 await message.edit({ embeds: [newEmbed], components: [] });
 }
 } catch (e) {
 console.error('Could not edit job message', e);
 }
 }
 }

 await interaction.reply({ content: 'Job expired successfully.', ephemeral: true });
}
