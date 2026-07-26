import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction } from 'discord.js';
import { prisma } from '../database.js';

export const data = new SlashCommandBuilder()
 .setName('request-connect')
 .setDescription('Send a connection request to an alumni')
 .addUserOption(option => option.setName('user')
 .setDescription('The user to connect with')
 .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
 const targetDiscordUser = interaction.options.getUser('user')!;
 if (targetDiscordUser.id === interaction.user.id) {
 await interaction.reply({ content: 'You cannot connect with yourself.', ephemeral: true });
 return;
 }

 const requester = await prisma.user.findUnique({ where: { discord_id: interaction.user.id } });
 const targetUser = await prisma.user.findUnique({ where: { discord_id: targetDiscordUser.id } });

 if (!requester || !requester.linkedin_public_url) {
 await interaction.reply({ content: 'You must have a linked LinkedIn account to send connection requests.', ephemeral: true });
 return;
 }

 if (!targetUser) {
 await interaction.reply({ content: 'That user is not registered in the directory.', ephemeral: true });
 return;
 }

 if (!targetUser.directory_visible || !targetUser.open_to_connect) {
 await interaction.reply({ content: 'This user is not currently accepting connection requests.', ephemeral: true });
 return;
 }

 const existingRequest = await prisma.connectRequest.findFirst({
 where: {
 requester_id: requester.id,
 target_id: targetUser.id,
 status: 'pending'
 }
 });

 if (existingRequest) {
 await interaction.reply({ content: 'You already have a pending connection request with this user.', ephemeral: true });
 return;
 }
 const acceptedRequest = await prisma.connectRequest.findFirst({
 where: {
 OR: [
 { requester_id: requester.id, target_id: targetUser.id, status: 'accepted' },
 { requester_id: targetUser.id, target_id: requester.id, status: 'accepted' }
 ]
 }
 });

 if (acceptedRequest) {
 await interaction.reply({ content: 'You are already connected with this user!', ephemeral: true });
 return;
 }

 const request = await prisma.connectRequest.create({
 data: {
 requester_id: requester.id,
 target_id: targetUser.id,
 status: 'pending'
 }
 });

 const row = new ActionRowBuilder<ButtonBuilder>()
 .addComponents(
 new ButtonBuilder()
 .setCustomId(`accept_connect_${request.id}`)
 .setLabel('Accept')
 .setStyle(ButtonStyle.Success),
 new ButtonBuilder()
 .setCustomId(`decline_connect_${request.id}`)
 .setLabel('Decline')
 .setStyle(ButtonStyle.Danger)
 );

 try {
 await targetDiscordUser.send({
 content: `${interaction.user.username} wants to connect with you on LinkedIn.\nAccept to share each other's LinkedIn URLs.`,
 components: [row]
 });
 await interaction.reply({ content: 'Connection request sent successfully!', ephemeral: true });
 } catch (error) {
 console.error('Could not send DM to user', error);
 await interaction.reply({ content: 'Could not send the request. The user might have DMs disabled.', ephemeral: true });
 }
}

export async function handleConnectButton(interaction: ButtonInteraction) {
 const isAccept = interaction.customId.startsWith('accept_connect_');
 const requestId = interaction.customId.replace(isAccept ? 'accept_connect_' : 'decline_connect_', '');

 const request = await prisma.connectRequest.findUnique({ where: { id: requestId } });
 if (!request) {
 await interaction.reply({ content: 'Connection request not found.', ephemeral: true });
 return;
 }

 if (request.status !== 'pending') {
 await interaction.reply({ content: `This request was already ${request.status}.`, ephemeral: true });
 return;
 }

 if (isAccept) {
 await prisma.connectRequest.update({
 where: { id: requestId },
 data: { status: 'accepted' }
 });

 const requester = await prisma.user.findUnique({ where: { id: request.requester_id } });
 const target = await prisma.user.findUnique({ where: { id: request.target_id } });

 if (requester && target) {
 try {
 const requesterDiscord = await interaction.client.users.fetch(requester.discord_id);
 await requesterDiscord.send(`Your connection request to <@${target.discord_id}> was accepted!\nTheir LinkedIn: ${target.linkedin_public_url}`);
 } catch (e) {
 console.error('Could not DM requester', e);
 }
 await interaction.reply({ content: `You accepted the connection! Their LinkedIn is: ${requester.linkedin_public_url}`, ephemeral: true });
 }
 } else {
 await prisma.connectRequest.update({
 where: { id: requestId },
 data: { status: 'declined' }
 });

 const requester = await prisma.user.findUnique({ where: { id: request.requester_id } });
 if (requester) {
 try {
 const requesterDiscord = await interaction.client.users.fetch(requester.discord_id);
 await requesterDiscord.send(`Your networking request was not accepted.`);
 } catch (e) {
 console.error('Could not DM requester', e);
 }
 }

 await interaction.reply({ content: 'You declined the connection request.', ephemeral: true });
 }
}
