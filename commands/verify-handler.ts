import {
  Interaction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  GuildMemberRoleManager
} from 'discord.js';
import { prisma } from '../database.js';

export async function handleVerifyButton(interaction: any) {
  if (interaction.customId !== 'verify_button') return;

  const modal = new ModalBuilder()
    .setCustomId('verify_modal')
    .setTitle('Student Verification');

  const divisionInput = new TextInputBuilder()
    .setCustomId('division')
    .setLabel('Division (A / B / C)')
    .setPlaceholder('e.g., A')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const rollNumberInput = new TextInputBuilder()
    .setCustomId('roll_number')
    .setLabel('Roll Number')
    .setPlaceholder('e.g., 100')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const actionRow1 = new ActionRowBuilder<TextInputBuilder>().addComponents(divisionInput);
  const actionRow2 = new ActionRowBuilder<TextInputBuilder>().addComponents(rollNumberInput);

  modal.addComponents(actionRow1, actionRow2);

  await interaction.showModal(modal);
}

export async function handleVerifyModalSubmit(interaction: any) {
  if (interaction.customId !== 'verify_modal') return;

  const divisionRaw = interaction.fields.getTextInputValue('division').trim().toUpperCase();
  const rollNumberRaw = interaction.fields.getTextInputValue('roll_number').trim();
  
  if (!/^\d+$/.test(rollNumberRaw)) {
    return interaction.reply({ content: '❌ Roll number must be numeric.', ephemeral: true });
  }
  
  if (!['A', 'B', 'C'].includes(divisionRaw)) {
    return interaction.reply({ content: '❌ Division must be A, B, or C.', ephemeral: true });
  }

  const rollNumber = parseInt(rollNumberRaw, 10);

  const student = await prisma.student.findFirst({
    where: {
      division: divisionRaw,
      roll_no: rollNumber
    }
  });

  if (!student) {
    return interaction.reply({ 
      content: '❌ Student not found.\nPlease check your Division and Roll Number.', 
      ephemeral: true 
    });
  }

  // Check if someone else (or this user) has already verified this student record in this guild
  const existingVerification = await prisma.verifiedStudent.findFirst({
    where: {
      guild_id: interaction.guildId,
      division: student.division,
      roll_no: student.roll_no
    }
  });

  if (existingVerification) {
    if (existingVerification.user_id === interaction.user.id) {
      return interaction.reply({ content: '❌ You have already verified this record.', ephemeral: true });
    }
    return interaction.reply({ content: '❌ This student record has already been verified by another Discord account.', ephemeral: true });
  }

  // Also check if this user has already verified any record in this guild
  const userVerification = await prisma.verifiedStudent.findUnique({
    where: {
      user_id: interaction.user.id
    }
  });

  if (userVerification) {
    return interaction.reply({ content: '❌ You have already verified a student record on this account.', ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setTitle('Student Found')
    .setDescription(`**Name:** ${student.name}\n**Division:** ${student.division}\n**Class:** ${student.class}\n**Roll No:** ${student.roll_no}`)
    .setColor('#0a66c2');

  const confirmBtn = new ButtonBuilder()
    .setCustomId(`confirm_verify_${student.id}`)
    .setLabel('Verify')
    .setStyle(ButtonStyle.Success);

  const cancelBtn = new ButtonBuilder()
    .setCustomId('cancel_verify')
    .setLabel('Cancel')
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmBtn, cancelBtn);

  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

export async function handleConfirmVerifyButton(interaction: any) {
  if (interaction.customId === 'cancel_verify') {
    await interaction.update({ content: 'Verification cancelled.', embeds: [], components: [] });
    return;
  }

  if (!interaction.customId.startsWith('confirm_verify_')) return;

  const studentId = interaction.customId.replace('confirm_verify_', '');
  
  const student = await prisma.student.findUnique({
    where: { id: studentId }
  });

  if (!student) {
    return interaction.update({ content: '❌ Student record no longer exists.', embeds: [], components: [] });
  }

  const config = await prisma.verificationConfig.findUnique({
    where: { guild_id: interaction.guildId }
  });

  if (!config) {
    return interaction.update({ content: '❌ Verification system is not configured for this server.', embeds: [], components: [] });
  }

  let roleToAssignId: string | null = config.third_year_role_id;

  try {
    const member = await interaction.guild?.members.fetch(interaction.user.id);
    if (!member) throw new Error('Member not found');
    
    const rolesManager = member.roles as GuildMemberRoleManager;
    
    // Always assign universal verified role
    await rolesManager.add(config.verified_role_id);
    
    if (roleToAssignId) {
      await rolesManager.add(roleToAssignId);
    }

    // Save to DB
    await prisma.verifiedStudent.create({
      data: {
        guild_id: interaction.guildId,
        user_id: interaction.user.id,
        division: student.division,
        roll_no: student.roll_no,
        student_name: student.name
      }
    });

    await interaction.update({ 
      content: '✅ Successfully verified and roles assigned!', 
      embeds: [], 
      components: [] 
    });
  } catch (error) {
    console.error('Error assigning verification roles:', error);
    await interaction.update({ 
      content: '❌ Verified, but failed to assign roles. Please ask an admin for help.', 
      embeds: [], 
      components: [] 
    });
  }
}
