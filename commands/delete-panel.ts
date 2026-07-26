import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  TextChannel
} from 'discord.js';
import { prisma } from '../database.js';

export const data = new SlashCommandBuilder()
  .setName('delete-panel')
  .setDescription('Delete the verification panel and configuration (Admin only)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) return;

  await interaction.deferReply({ ephemeral: true });

  try {
    const config = await prisma.verificationConfig.findUnique({
      where: { guild_id: interaction.guildId }
    });

    if (!config) {
      return interaction.editReply('❌ No verification panel configuration found for this server.');
    }

    // Try to delete the panel message if it exists
    if (config.panel_message_id && config.verify_channel_id) {
      try {
        const channel = await interaction.guild?.channels.fetch(config.verify_channel_id) as TextChannel;
        if (channel) {
          const message = await channel.messages.fetch(config.panel_message_id);
          if (message) {
            await message.delete();
          }
        }
      } catch (err) {
        console.warn('Could not delete panel message, it may have already been deleted manually.', err);
      }
    }

    // Delete the configuration
    await prisma.verificationConfig.delete({
      where: { guild_id: interaction.guildId }
    });

    await interaction.editReply('✅ Successfully deleted the verification panel and its configuration.');
  } catch (error) {
    console.error('Error in delete-panel command:', error);
    await interaction.editReply('❌ There was an error trying to delete the verification panel.');
  }
}
