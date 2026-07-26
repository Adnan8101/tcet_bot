import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '../database.js';
export const data = new SlashCommandBuilder()
 .setName('disconnect-linkedin')
 .setDescription('Disconnect your LinkedIn account and hide from directory.');
export async function execute(interaction: ChatInputCommandInteraction) {
 const user = await prisma.user.findUnique({ where: { discord_id: interaction.user.id } });
 if (!user || !user.linkedin_sub) {
 return interaction.reply({
 content: 'Your LinkedIn account is not currently connected.',
 ephemeral: true
 });
 }
 await prisma.user.update({
 where: { discord_id: interaction.user.id },
 data: {
 linkedin_sub: null,
 linkedin_access_token: null,
 linkedin_refresh_token: null,
 token_expires_at: null,
 full_name: null,
 headline: null,
 profile_photo_url: null,
 linkedin_public_url: null,
 directory_visible: false,
 open_to_connect: false,
 }
 });
 await interaction.reply({
 content: 'Your LinkedIn account has been disconnected successfully.',
 ephemeral: true
 });
}
