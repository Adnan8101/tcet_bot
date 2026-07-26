import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '../database.js';
export const data = new SlashCommandBuilder()
 .setName('set-role-tier')
 .setDescription('Set your role tier.')
 .addStringOption(option => option.setName('tier')
 .setDescription('Your role tier')
 .setRequired(true)
 .addChoices(
 { name: 'Junior', value: 'Junior' },
 { name: 'Senior', value: 'Senior' },
 { name: 'Alumnus', value: 'Alumnus' }
 ));
export async function execute(interaction: ChatInputCommandInteraction) {
 const user = await prisma.user.findUnique({ where: { discord_id: interaction.user.id } });
 if (!user) {
 return interaction.reply({
 content: 'Your account is not initialized. Please run `/connect-linkedin` first.',
 ephemeral: true
 });
 }
 const tier = interaction.options.getString('tier', true);
 await prisma.user.update({
 where: { discord_id: interaction.user.id },
 data: {
 role_tier: tier
 }
 });
 await interaction.reply({
 content: `Your role tier has been set to **${tier}**.`,
 ephemeral: true
 });
}
