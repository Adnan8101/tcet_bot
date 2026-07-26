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
  .addRoleOption(option =>
    option.setName('st')
      .setDescription('Second Year role')
      .setRequired(true))
  .addRoleOption(option =>
    option.setName('bt')
      .setDescription('BTech role')
      .setRequired(true))
  .addRoleOption(option =>
    option.setName('alumni')
      .setDescription('Alumni role')
      .setRequired(true))
  .addChannelOption(option =>
    option.setName('verify_channel')
      .setDescription('Channel where the verification panel will be sent')
      .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) return;

  const verifiedRole = interaction.options.getRole('verified_role', true);
  const ttRole = interaction.options.getRole('tt', true);
  const stRole = interaction.options.getRole('st', true);
  const btRole = interaction.options.getRole('bt', true);
  const alumniRole = interaction.options.getRole('alumni', true);
  const verifyChannel = interaction.options.getChannel('verify_channel', true) as TextChannel;

  await interaction.deferReply({ ephemeral: true });

  try {
    // Save config to DB
    await prisma.verificationConfig.upsert({
      where: { guild_id: interaction.guildId },
      update: {
        verified_role_id: verifiedRole.id,
        third_year_role_id: ttRole.id,
        second_year_role_id: stRole.id,
        btech_role_id: btRole.id,
        alumni_role_id: alumniRole.id,
        verify_channel_id: verifyChannel.id
      },
      create: {
        guild_id: interaction.guildId,
        verified_role_id: verifiedRole.id,
        third_year_role_id: ttRole.id,
        second_year_role_id: stRole.id,
        btech_role_id: btRole.id,
        alumni_role_id: alumniRole.id,
        verify_channel_id: verifyChannel.id
      }
    });

    const embed = new EmbedBuilder()
      .setTitle('🎓 TCET Student Verification')
      .setDescription('Verify yourself to gain access to the server.\n\nYou will need:\n• Division (A / B / C)\n• Roll Number\n\nClick the button below to begin.')
      .setColor('#0a66c2');

    const button = new ButtonBuilder()
      .setCustomId('verify_button')
      .setLabel('Verify')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    await verifyChannel.send({ embeds: [embed], components: [row] });

    await interaction.editReply('✅ Verification panel successfully configured and sent to the channel!');
  } catch (error) {
    console.error('Error in setup-panel:', error);
    await interaction.editReply('❌ There was an error configuring the verification panel.');
  }
}
