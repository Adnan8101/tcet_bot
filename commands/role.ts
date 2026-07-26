import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '../database.js';
export const data = new SlashCommandBuilder()
 .setName('set-role-tier')
 .setDescription('Set your role tier.')
 .addStringOption(option => option.setName('tier')
 .setDescription('Your role tier')
 .setRequired(true)
 .addChoices(
 { name: 'Junior', value: 'junior' },
 { name: 'Senior', value: 'senior' },
 { name: 'Alumnus', value: 'alumnus' }
 ));
export async function execute(interaction: ChatInputCommandInteraction) {
 const user = await prisma.user.findUnique({ where: { discord_id: interaction.user.id } });
 if (!user) {
 return interaction.reply({
 content: 'Your account is not initialized. Please run `/connect-linkedin` first.',
 ephemeral: true
 });
 }
 // Stored lowercase so it matches the role_tier filters used by /find-seniors,
 // /find-juniors, /browse-directory and the /post-job permission check.
 const tier = interaction.options.getString('tier', true);
 await prisma.user.update({
 where: { discord_id: interaction.user.id },
 data: {
 role_tier: tier
 }
 });
 await interaction.reply({
 content: `Your role tier has been set to **${tier.charAt(0).toUpperCase()}${tier.slice(1)}**.`,
 ephemeral: true
 });
}
