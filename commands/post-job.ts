import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ModalSubmitInteraction, EmbedBuilder, TextChannel } from 'discord.js';
import { prisma } from '../database.js';
import { randomUUID } from 'crypto';

export const data = new SlashCommandBuilder()
 .setName('post-job')
 .setDescription('Post a job to the community');

export async function execute(interaction: ChatInputCommandInteraction) {
 const user = await prisma.user.findUnique({ where: { discord_id: interaction.user.id } });
 if (!user || (user.role_tier !== 'senior' && user.role_tier !== 'alumnus')) {
 await interaction.reply({ content: 'Only verified seniors or alumni can post jobs.', ephemeral: true });
 return;
 }

 const modal = new ModalBuilder()
 .setCustomId('postJobModal')
 .setTitle('Post a Job');

 const titleInput = new TextInputBuilder()
 .setCustomId('jobTitle')
 .setLabel('Job Title')
 .setStyle(TextInputStyle.Short)
 .setRequired(true);

 const companyInput = new TextInputBuilder()
 .setCustomId('jobCompany')
 .setLabel('Company')
 .setStyle(TextInputStyle.Short)
 .setRequired(true);

 const descInput = new TextInputBuilder()
 .setCustomId('jobDesc')
 .setLabel('Description')
 .setStyle(TextInputStyle.Paragraph)
 .setRequired(true);

 const urlInput = new TextInputBuilder()
 .setCustomId('jobUrl')
 .setLabel('Apply URL')
 .setStyle(TextInputStyle.Short)
 .setRequired(true);

 const tagsInput = new TextInputBuilder()
 .setCustomId('jobTags')
 .setLabel('Tags (comma separated)')
 .setStyle(TextInputStyle.Short)
 .setRequired(false);

 modal.addComponents(
 new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
 new ActionRowBuilder<TextInputBuilder>().addComponents(companyInput),
 new ActionRowBuilder<TextInputBuilder>().addComponents(descInput),
 new ActionRowBuilder<TextInputBuilder>().addComponents(urlInput),
 new ActionRowBuilder<TextInputBuilder>().addComponents(tagsInput)
 );

 await interaction.showModal(modal);
}

export async function handleModalSubmit(interaction: ModalSubmitInteraction) {
 const title = interaction.fields.getTextInputValue('jobTitle');
 const company = interaction.fields.getTextInputValue('jobCompany');
 const description = interaction.fields.getTextInputValue('jobDesc');
 const applyUrl = interaction.fields.getTextInputValue('jobUrl');
 const tagsString = interaction.fields.getTextInputValue('jobTags');
 const tags = tagsString ? tagsString.split(',').map(t => t.trim()).filter(t => t.length > 0) : [];

 const user = await prisma.user.findUnique({ where: { discord_id: interaction.user.id } });
 if (!user) {
 await interaction.reply({ content: 'You are not registered.', ephemeral: true });
 return;
 }

 // Set expiry to 30 days from now
 const expiresAt = new Date();
 expiresAt.setDate(expiresAt.getDate() + 30);

 // Send to jobs channel
 const guildConfig = await prisma.guildConfig.findUnique({ where: { guild_id: interaction.guildId! } });
 const jobsChannelId = guildConfig?.jobs_channel_id;
 if (!jobsChannelId) {
 await interaction.reply({ content: 'Jobs channel is not configured. Ask an admin to use /config.', ephemeral: true });
 return;
 }

 const channel = interaction.client.channels.cache.get(jobsChannelId) as TextChannel;
 if (!channel) {
 await interaction.reply({ content: 'Jobs channel not found. Contact an admin.', ephemeral: true });
 return;
 }

  const jobId = randomUUID();
  const shortId = jobId.substring(0, 5).toUpperCase();

  const embed = new EmbedBuilder()
  .setTitle(`${title} at ${company}`)
  .setDescription(description)
  .setURL(applyUrl)
  .setColor('#FFD700')
  .setAuthor({ name: user.full_name || interaction.user.username, iconURL: user.profile_photo_url || undefined })
  .addFields(
  { name: 'Apply Here', value: applyUrl }
  )
  .setFooter({ text: `ID: ${shortId} • Expires on ${expiresAt.toDateString()}` })
  .setTimestamp();

 if (tags.length > 0) {
 embed.addFields({ name: 'Tags', value: tags.join(', ') });
 }

 const message = await channel.send({ embeds: [embed] });

  await prisma.jobPosting.create({
  data: {
  id: jobId,
  posted_by_user_id: user.id,
  title,
  company,
  description,
  apply_url: applyUrl,
  tags,
  channel_message_id: message.id,
  expires_at: expiresAt,
  guild_id: interaction.guildId
  }
  });

 await interaction.reply({ content: `Job posted successfully in <#${jobsChannelId}>!`, ephemeral: true });
}
