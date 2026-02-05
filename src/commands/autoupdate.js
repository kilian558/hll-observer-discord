import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { config } from '../config.js';

export const data = new SlashCommandBuilder()
  .setName('autoupdate')
  .setDescription('Konfiguriert automatische Map-Updates')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(subcommand =>
    subcommand
      .setName('start')
      .setDescription('Startet automatische Updates in diesem Channel')
      .addIntegerOption(option =>
        option.setName('interval')
          .setDescription('Update-Intervall in Sekunden (30-3600)')
          .setRequired(false)
          .setMinValue(30)
          .setMaxValue(3600)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('stop')
      .setDescription('Stoppt automatische Updates'));

export async function execute(interaction, rconClient, bot) {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'start') {
    const interval = interaction.options.getInteger('interval') || config.bot.updateInterval;
    
    bot.autoUpdateChannelId = interaction.channelId;
    bot.autoUpdateInterval = interval * 1000;
    
    // Starte Auto-Update
    if (bot.autoUpdateTimer) {
      clearInterval(bot.autoUpdateTimer);
    }
    
    bot.startAutoUpdate();

    await interaction.reply({
      content: `✅ Automatische Updates aktiviert! Map wird alle ${interval} Sekunden in diesem Channel aktualisiert.`,
      ephemeral: true
    });

  } else if (subcommand === 'stop') {
    if (bot.autoUpdateTimer) {
      clearInterval(bot.autoUpdateTimer);
      bot.autoUpdateTimer = null;
      bot.autoUpdateChannelId = null;
      
      await interaction.reply({
        content: '✅ Automatische Updates gestoppt.',
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: '⚠️ Automatische Updates sind nicht aktiv.',
        ephemeral: true
      });
    }
  }
}
