import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('players')
  .setDescription('Zeigt eine Liste aller Spieler auf dem Server')
  .addStringOption(option =>
    option.setName('team')
      .setDescription('Filtere nach Team')
      .setRequired(false)
      .addChoices(
        { name: 'Allies', value: 'allies' },
        { name: 'Axis', value: 'axis' }
      ));

export async function execute(interaction, rconClient) {
  await interaction.deferReply();

  try {
    const players = await rconClient.getPlayerInfo();
    const teamFilter = interaction.options.getString('team');

    let filteredPlayers = players;
    if (teamFilter) {
      filteredPlayers = players.filter(p => p.team === teamFilter);
    }

    if (filteredPlayers.length === 0) {
      await interaction.editReply({
        content: '⚠️ Keine Spieler gefunden.',
        ephemeral: true
      });
      return;
    }

    // Sortiere nach Kills
    filteredPlayers.sort((a, b) => b.kills - a.kills);

    // Erstelle Spielerliste (max 25 wegen Embed-Limit)
    const playerList = filteredPlayers.slice(0, 25).map((p, i) => {
      const teamEmoji = p.team === 'allies' ? '🔵' : '🔴';
      return `${i + 1}. ${teamEmoji} **${p.name}** - ${p.role}\nK/D: ${p.kills}/${p.deaths}`;
    }).join('\n\n');

    const embed = new EmbedBuilder()
      .setTitle('👥 Spielerliste')
      .setDescription(playerList || 'Keine Spieler')
      .setColor(teamFilter === 'allies' ? 0x4A90E2 : teamFilter === 'axis' ? 0xE24A4A : 0xFFFFFF)
      .setTimestamp()
      .setFooter({ text: `Gesamt: ${filteredPlayers.length} Spieler` });

    if (filteredPlayers.length > 25) {
      embed.addFields({ 
        name: '⚠️ Hinweis', 
        value: `Zeige ${25} von ${filteredPlayers.length} Spielern` 
      });
    }

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Fehler beim Ausführen des /players Befehls:', error);
    await interaction.editReply({
      content: '❌ Fehler beim Abrufen der Spielerdaten.',
      ephemeral: true
    });
  }
}
