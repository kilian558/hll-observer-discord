import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('server')
  .setDescription('Zeigt Informationen über den HLL Server');

export async function execute(interaction, rconClient) {
  await interaction.deferReply();

  try {
    const [players, mapName, gameState] = await Promise.all([
      rconClient.getPlayerInfo(),
      rconClient.getCurrentMap(),
      rconClient.getGameState()
    ]);

    const alliedPlayers = players.filter(p => p.team === 'allies');
    const axisPlayers = players.filter(p => p.team === 'axis');

    // Top Spieler nach Kills
    const topKillers = [...players]
      .sort((a, b) => b.kills - a.kills)
      .slice(0, 5)
      .map((p, i) => `${i + 1}. ${p.name} - ${p.kills} Kills`)
      .join('\n') || 'Keine Daten';

    const embed = new EmbedBuilder()
      .setTitle('📊 HLL Server Status')
      .setColor(0x00FF00)
      .addFields(
        { name: '🗺️ Map', value: mapName, inline: true },
        { name: '👥 Spieler', value: `${gameState.playerCount}/${gameState.maxPlayers}`, inline: true },
        { name: '⏱️ Zeit', value: gameState.remainingTime, inline: true },
        { name: '🔵 Allies', value: `${alliedPlayers.length} Spieler\nScore: ${gameState.alliedScore}`, inline: true },
        { name: '🔴 Axis', value: `${axisPlayers.length} Spieler\nScore: ${gameState.axisScore}`, inline: true },
        { name: '\u200B', value: '\u200B', inline: true },
        { name: '🏆 Top 5 Spieler', value: topKillers }
      )
      .setTimestamp()
      .setFooter({ text: 'HLL Observer Bot' });

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Fehler beim Ausführen des /server Befehls:', error);
    await interaction.editReply({
      content: '❌ Fehler beim Abrufen der Server-Daten.',
      ephemeral: true
    });
  }
}
