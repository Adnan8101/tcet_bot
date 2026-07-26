import 'dotenv/config';
import { Client, GatewayIntentBits, Partials, Collection, Events, REST, Routes, Interaction } from 'discord.js';
import * as connectCmd from './commands/connect.js';
import * as disconnectCmd from './commands/disconnect.js';
import * as profileCmd from './commands/profile.js';
import * as roleCmd from './commands/role.js';
import * as findSeniorsCmd from './commands/find-seniors.js';
import * as findJuniorsCmd from './commands/find-juniors.js';
import * as browseDirectoryCmd from './commands/browse-directory.js';
import * as directoryCardCmd from './commands/directory-card.js';
import * as browseJobsCmd from './commands/browse-jobs.js';
import * as jobDetailsCmd from './commands/job-details.js';
import * as saveJobCmd from './commands/save-job.js';
import * as mySavedJobsCmd from './commands/my-saved-jobs.js';
import * as updateJobStatusCmd from './commands/update-job-status.js';

import * as postJobCmd from './commands/post-job.js';
import * as expireJobCmd from './commands/expire-job.js';
import * as myPostingsCmd from './commands/my-postings.js';
import * as requestConnectCmd from './commands/request-connect.js';
import * as reportListingCmd from './commands/report-listing.js';
import * as verifySeniorCmd from './commands/verify-senior.js';
import * as leaderboardCmd from './commands/leaderboard.js';
import * as configCmd from './commands/config.js';

import { startCronJobs } from './lib/cron.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
  partials: [Partials.Channel]
});

const commands = [
  connectCmd,
  disconnectCmd,
  profileCmd.myProfileCommand,
  profileCmd.editProfileCommand,
  roleCmd,
  findSeniorsCmd,
  findJuniorsCmd,
  browseDirectoryCmd,
  directoryCardCmd,
  browseJobsCmd,
  jobDetailsCmd,
  saveJobCmd,
  mySavedJobsCmd,
  updateJobStatusCmd,
  postJobCmd,
  expireJobCmd,
  myPostingsCmd,
  requestConnectCmd,
  reportListingCmd,
  verifySeniorCmd,
  leaderboardCmd,
  configCmd
];

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  
  startCronJobs(readyClient);

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!);
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
      { body: commands.map(c => c.data.toJSON()) },
    );
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
});

async function replyWithError(interaction: Interaction): Promise<void> {
  if (!interaction.isRepliable()) return;
  const content = 'There was an error while processing that. Please try again.';
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content, ephemeral: true });
    } else {
      await interaction.reply({ content, ephemeral: true });
    }
  } catch (replyError) {
    console.error('Could not send error response to interaction', replyError);
  }
}

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = commands.find(c => c.data.name === interaction.commandName);
      if (!command) return;
      await command.execute(interaction as any);
    } else if (interaction.isModalSubmit()) {
      if (interaction.customId === 'editProfileModal') {
        await profileCmd.handleModalSubmit(interaction);
      } else if (interaction.customId === 'postJobModal') {
        await postJobCmd.handleModalSubmit(interaction);
      } else if (interaction.customId.startsWith('reportModal_')) {
        await reportListingCmd.handleReportModalSubmit(interaction);
      }
    } else if (interaction.isButton()) {
      if (interaction.customId.startsWith('accept_connect_') || interaction.customId.startsWith('decline_connect_')) {
        await requestConnectCmd.handleConnectButton(interaction as any);
      }
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    await replyWithError(interaction);
  }
});

// A single failed DB call or Discord API error inside an interaction handler must never
// take the whole process down — log it and keep the bot alive.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

client.login(process.env.DISCORD_BOT_TOKEN);
