import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import crypto from 'crypto';
import { prisma } from '../database.js';
export const data = new SlashCommandBuilder()
 .setName('connect-linkedin')
 .setDescription('Connect your LinkedIn account securely.');
export async function execute(interaction: ChatInputCommandInteraction) {
 const state = crypto.randomBytes(16).toString('hex');
 await prisma.user.upsert({
 where: { discord_id: interaction.user.id },
 update: {}, create: {
 discord_id: interaction.user.id,
 }
 });
 const statePayload = Buffer.from(JSON.stringify({
 discord_id: interaction.user.id,
 nonce: state
 })).toString('base64');
 const hmac = crypto.createHmac('sha256', process.env.ENCRYPTION_KEY!).update(statePayload).digest('hex');
 const secureState = `${statePayload}.${hmac}`;
 const websiteUrl = process.env.WEBSITE_URL || 'https://aiml-discord.vercel.app';
 const connectUrl = `${websiteUrl}/auth/linkedin?state=${secureState}`;
 const embed = new EmbedBuilder().setFooter({ text: 'Super Premium User' })
 .setTitle(' Connect LinkedIn')
 .setDescription('Click the link below to securely connect your LinkedIn account. This link is unique to you.')
 .setURL(connectUrl)
 .setColor('#FFD700'); await interaction.reply({
 content: 'Please check your DMs!',
 ephemeral: true
 });
 try {
 await interaction.user.send({ embeds: [embed] });
 } catch (error) {
 await interaction.followUp({
 content: 'I could not DM you. Please check your privacy settings and try again.',
 ephemeral: true
 });
 }
}
