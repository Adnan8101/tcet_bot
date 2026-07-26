import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import { prisma } from '../database.js';

export const data = new SlashCommandBuilder()
 .setName('config')
 .setDescription('Configure server channels and roles for the bot (Admin only)')
 .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
 .addChannelOption(option => option.setName('jobs_channel')
 .setDescription('Channel where jobs will be posted')
 .setRequired(false))
 .addChannelOption(option => option.setName('mod_logs_channel')
 .setDescription('Channel where reports and logs are sent')
 .setRequired(false))
 .addRoleOption(option => option.setName('admin_role')
 .setDescription('Role that grants admin access to bot commands')
 .setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction) {
 if (!interaction.guildId) {
 await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
 return;
 }

 const jobsChannel = interaction.options.getChannel('jobs_channel');
 const modLogsChannel = interaction.options.getChannel('mod_logs_channel');
 const adminRole = interaction.options.getRole('admin_role');

 if (!jobsChannel && !modLogsChannel && !adminRole) {
 const config = await prisma.guildConfig.findUnique({ where: { guild_id: interaction.guildId } });
 if (!config) {
 await interaction.reply({ content: 'No configuration found for this server. Use the options to set one up.', ephemeral: true });
 } else {
 let content = '**Current Configuration:**\n';
 content += `Jobs Channel: ${config.jobs_channel_id ? `<#${config.jobs_channel_id}>` : 'Not set'}\n`;
 content += `Mod Logs Channel: ${config.mod_logs_channel_id ? `<#${config.mod_logs_channel_id}>` : 'Not set'}\n`;
 content += `Admin Role: ${config.admin_role_id ? `<@&${config.admin_role_id}>` : 'Not set'}\n`;
 await interaction.reply({ content, ephemeral: true });
 }
 return;
 }

 const updateData: any = {};
 if (jobsChannel) updateData.jobs_channel_id = jobsChannel.id;
 if (modLogsChannel) updateData.mod_logs_channel_id = modLogsChannel.id;
 if (adminRole) updateData.admin_role_id = adminRole.id;

 await prisma.guildConfig.upsert({
 where: { guild_id: interaction.guildId },
 update: updateData,
 create: {
 guild_id: interaction.guildId,
 ...updateData
 }
 });

 await interaction.reply({ content: 'Server configuration updated successfully!', ephemeral: true });
}
