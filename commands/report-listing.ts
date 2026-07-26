import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ModalSubmitInteraction, EmbedBuilder, TextChannel } from 'discord.js';
import { prisma } from '../database.js';

export const data = new SlashCommandBuilder()
 .setName('report-listing')
 .setDescription('Report a job listing')
 .addStringOption(option => option.setName('job_id')
 .setDescription('The ID of the job')
 .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
 const jobId = interaction.options.getString('job_id')!;

 const job = await prisma.jobPosting.findUnique({ where: { id: jobId } });
 if (!job) {
 await interaction.reply({ content: 'Job not found.', ephemeral: true });
 return;
 }

 const modal = new ModalBuilder()
 .setCustomId(`reportModal_${jobId}`)
 .setTitle('Report Job Listing');

 const reasonInput = new TextInputBuilder()
 .setCustomId('reportReason')
 .setLabel('Reason for reporting')
 .setStyle(TextInputStyle.Paragraph)
 .setRequired(true);

 modal.addComponents(
 new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput)
 );

 await interaction.showModal(modal);
}

export async function handleReportModalSubmit(interaction: ModalSubmitInteraction) {
 const jobId = interaction.customId.replace('reportModal_', '');
 const reason = interaction.fields.getTextInputValue('reportReason');

 const user = await prisma.user.findUnique({ where: { discord_id: interaction.user.id } });
 if (!user) {
 await interaction.reply({ content: 'You must be registered to report listings.', ephemeral: true });
 return;
 }

 await prisma.report.create({
 data: {
 job_id: jobId,
 reporter_id: user.id,
 reason
 }
 });

 const guildConfig = await prisma.guildConfig.findUnique({ where: { guild_id: interaction.guildId! } });
 const modLogsChannelId = guildConfig?.mod_logs_channel_id;
 if (modLogsChannelId) {
 const channel = interaction.client.channels.cache.get(modLogsChannelId) as TextChannel;
 if (channel) {
 const embed = new EmbedBuilder().setFooter({ text: 'Super Premium User' })
 .setTitle('New Job Report')
 .addFields(
 { name: 'Job ID', value: jobId },
 { name: 'Reported By', value: `<@${interaction.user.id}>` },
 { name: 'Reason', value: reason }
 )
 .setColor('#FFD700')
 .setTimestamp();
 await channel.send({ embeds: [embed] }).catch(console.error);
 }
 }

 await interaction.reply({ content: 'Your report has been submitted to the moderators.', ephemeral: true });
}
