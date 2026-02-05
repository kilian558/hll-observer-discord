import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { generateMapImage } from '../map/renderer.js';

export const data = new SlashCommandBuilder()
  .setName('map')
  .setDescription('Zeigt die aktuelle HLL Server-Map mit Spielerpositionen');

export async function execute(interaction, rconClient) {
  await interaction.deferReply();

  try {
    // Hole aktuelle Daten vom Server
    const [players, mapName, gameState] = await Promise.all([
      rconClient.getPlayerInfo(),
      rconClient.getCurrentMap(),
      rconClient.getGameState()
    ]);

    if (players.length === 0) {
      await interaction.editReply({
        content: '⚠️ Keine Spieler auf dem Server gefunden.',
        ephemeral: true
      });
      return;
    }

    // Generiere Map-Bild
    const mapAttachment = await generateMapImage(mapName, players, gameState);

    // Statistiken berechnen
    const alliedCount = players.filter(p => p.team === 'allies').length;
    const axisCount = players.filter(p => p.team === 'axis').length;

    // Embed erstellen
    const embed = new EmbedBuilder()
      .setTitle('🗺️ HLL Server Map')
      .setDescription(`**${mapName}**`)
      .setColor(0x4A90E2)
      .addFields(
        { name: '🔵 Allies', value: `${alliedCount} Spieler\nScore: ${gameState.alliedScore}`, inline: true },
        { name: '🔴 Axis', value: `${axisCount} Spieler\nScore: ${gameState.axisScore}`, inline: true },
        { name: '⏱️ Verbleibende Zeit', value: gameState.remainingTime, inline: true }
      )
      .setImage('attachment://hll-map.png')
      .setTimestamp()
      .setFooter({ text: `Spieler: ${gameState.playerCount}/${gameState.maxPlayers}` });

    await interaction.editReply({
      embeds: [embed],
      files: [mapAttachment]
    });

  } catch (error) {
    console.error('Fehler beim Ausführen des /map Befehls:', error);
    await interaction.editReply({
      content: '❌ Fehler beim Abrufen der Server-Daten. Bitte versuche es später erneut.',
      ephemeral: true
    });
  }
}
