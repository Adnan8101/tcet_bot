import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  GuildMemberRoleManager
} from 'discord.js';
import { prisma } from '../database.js';

export const data = new SlashCommandBuilder()
  .setName('clear-data')
  .setDescription('Clear verification data for a specific user (Admin only)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addUserOption(option =>
    option.setName('user')
      .setDescription('The user whose verification record should be cleared')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) return;

  const targetUser = interaction.options.getUser('user', true);

  await interaction.deferReply({ ephemeral: true });

  try {
    const verifiedRecord = await prisma.verifiedStudent.findUnique({
      where: { user_id: targetUser.id }
    });

    if (!verifiedRecord) {
      return interaction.editReply(`❌ ${targetUser.tag} does not have an active verification record.`);
    }

    // Delete the verified student record
    await prisma.verifiedStudent.delete({
      where: { user_id: targetUser.id }
    });

    // Also clear the user's connected data (LinkedIn details, applications, etc.)
    const userRecord = await prisma.user.findUnique({
      where: { discord_id: targetUser.id }
    });

    if (userRecord) {
      // Delete user's job applications
      await prisma.jobApplication.deleteMany({ where: { user_id: userRecord.id } });
      
      // Delete user's saved searches
      await prisma.savedSearch.deleteMany({ where: { user_id: userRecord.id } });
      
      // Delete user's connect requests (both sent and received)
      await prisma.connectRequest.deleteMany({
        where: { OR: [{ requester_id: userRecord.id }, { target_id: userRecord.id }] }
      });
      
      // Delete user's reports
      await prisma.report.deleteMany({ where: { reporter_id: userRecord.id } });
      
      // Nullify posted_by_user_id on their job postings to keep the job but anonymize it
      await prisma.jobPosting.updateMany({
        where: { posted_by_user_id: userRecord.id },
        data: { posted_by_user_id: null }
      });
      
      // Finally delete the user record
      await prisma.user.delete({ where: { id: userRecord.id } });
    }

    // Optionally attempt to remove roles if they are in the guild
    try {
      const config = await prisma.verificationConfig.findUnique({
        where: { guild_id: interaction.guildId }
      });
      
      const member = await interaction.guild?.members.fetch(targetUser.id);
      
      if (member && config) {
        const rolesManager = member.roles as GuildMemberRoleManager;
        const rolesToRemove = [
          config.verified_role_id,
          config.third_year_role_id
        ].filter(Boolean) as string[];

        // Remove any associated verification roles they might have
        await rolesManager.remove(rolesToRemove);
      }
    } catch (e) {
      console.error('Failed to remove roles from user during clear-data:', e);
      // Non-fatal, just means they might not be in the server or bot lacks perms
    }

    await interaction.editReply(`✅ Successfully cleared the verification record and all connected data for ${targetUser.tag}. They can now verify again.`);
  } catch (error) {
    console.error('Error in clear-data command:', error);
    await interaction.editReply('❌ There was an error trying to clear the data.');
  }
}
