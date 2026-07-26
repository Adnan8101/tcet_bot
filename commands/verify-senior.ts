import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import { prisma } from '../database.js';

export const data = new SlashCommandBuilder()
 .setName('verify-senior')
 .setDescription('Verify a user as a senior (Admin only)')
 .addUserOption(option => option.setName('user')
 .setDescription('The user to verify')
 .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
 let isAdmin = false;
 if (interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageGuild)) {
 isAdmin = true;
 }
 const guildConfig = await prisma.guildConfig.findUnique({ where: { guild_id: interaction.guildId! } });
 const adminRoleId = guildConfig?.admin_role_id;
 const memberRoles = (interaction.member as any)?.roles;
 if (adminRoleId && memberRoles?.cache?.has(adminRoleId)) {
 isAdmin = true;
 }
 if (!isAdmin) {
 await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
 return;
 }

 const targetDiscordUser = interaction.options.getUser('user')!;
 let user = await prisma.user.findUnique({ where: { discord_id: targetDiscordUser.id } });
 if (!user) {
 user = await prisma.user.create({ data: { discord_id: targetDiscordUser.id } });
 }

 await prisma.user.update({
 where: { id: user.id },
 data: { role_tier: 'senior' }
 });

 await interaction.reply({ content: `Successfully verified ${targetDiscordUser.username} as a senior.`, ephemeral: true });
}
