import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel
} from 'discord.js';
import { prisma } from '../database.js';

export const data = new SlashCommandBuilder()
  .setName('setup-panel')
  .setDescription('Setup the student verification panel (Admin only)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addRoleOption(option =>
    option.setName('verified_role')
      .setDescription('Universal verified role given to all verified students')
      .setRequired(true))
  .addRoleOption(option =>
    option.setName('tt')
      .setDescription('Third Year role')
      .setRequired(true))
  .addChannelOption(option =>
    option.setName('verify_channel')
      .setDescription('Channel where the verification panel will be sent')
      .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) return;

  const verifiedRole = interaction.options.getRole('verified_role', true);
  const ttRole = interaction.options.getRole('tt', true);
  const verifyChannel = interaction.options.getChannel('verify_channel', true) as TextChannel;

  await interaction.deferReply({ ephemeral: true });

  try {
    const embed = new EmbedBuilder()
      .setTitle('🎓 TCET Student Verification')
      .setDescription('Verify yourself to gain access to the server.\n\nYou will need:\n• Division (A / B / C)\n• Roll Number\n\nClick the button below to begin.')
      .setColor('#0a66c2');

    const button = new ButtonBuilder()
      .setCustomId('verify_button')
      .setLabel('Verify')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    const message = await verifyChannel.send({ embeds: [embed], components: [row] });

    // Save config to DB with the panel message ID
    await prisma.verificationConfig.upsert({
      where: { guild_id: interaction.guildId },
      update: {
        verified_role_id: verifiedRole.id,
        third_year_role_id: ttRole.id,
        verify_channel_id: verifyChannel.id,
        panel_message_id: message.id
      },
      create: {
        guild_id: interaction.guildId,
        verified_role_id: verifiedRole.id,
        third_year_role_id: ttRole.id,
        verify_channel_id: verifyChannel.id,
        panel_message_id: message.id
      }
    });

    await interaction.editReply('✅ Verification panel successfully configured and sent to the channel!');
  } catch (error) {
    console.error('Error in setup-panel:', error);
    await interaction.editReply('❌ There was an error configuring the verification panel.');
  }
}
