import { Client, GatewayIntentBits, Collection, EmbedBuilder } from 'discord.js';
import { config, validateConfig } from './config.js';
import { createRconClient } from './rcon/client.js';
import { generateMapImage } from './map/renderer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validiere Konfiguration
validateConfig();

// Discord Client erstellen
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

// Commands Collection
client.commands = new Collection();
client.rconClient = null;
client.autoUpdateTimer = null;
client.autoUpdateChannelId = config.discord.updateChannelId;
client.autoUpdateInterval = config.bot.updateInterval * 1000;
client.lastMapMessage = null;

// Commands laden
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    console.log(`✓ Command geladen: ${command.data.name}`);
  }
}

// Auto-Update Funktion
async function sendMapUpdate() {
  if (!client.autoUpdateChannelId || !client.rconClient) return;

  try {
    const channel = await client.channels.fetch(client.autoUpdateChannelId);
    if (!channel) return;

    const [players, mapName, gameState] = await Promise.all([
      client.rconClient.getPlayerInfo(),
      client.rconClient.getCurrentMap(),
      client.rconClient.getGameState()
    ]);

    if (players.length === 0) return;

    const mapAttachment = await generateMapImage(mapName, players, gameState);

    const alliedCount = players.filter(p => p.team === 'allies').length;
    const axisCount = players.filter(p => p.team === 'axis').length;

    const embed = new EmbedBuilder()
      .setTitle('🗺️ Live Server Map')
      .setDescription(`**${mapName}**`)
      .setColor(0x4A90E2)
      .addFields(
        { name: '🔵 Allies', value: `${alliedCount} Spieler\nScore: ${gameState.alliedScore}`, inline: true },
        { name: '🔴 Axis', value: `${axisCount} Spieler\nScore: ${gameState.axisScore}`, inline: true },
        { name: '⏱️ Zeit', value: gameState.remainingTime, inline: true }
      )
      .setImage('attachment://hll-map.png')
      .setTimestamp()
      .setFooter({ text: `Auto-Update | ${gameState.playerCount}/${gameState.maxPlayers}` });

    // Lösche alte Nachricht wenn vorhanden
    if (client.lastMapMessage) {
      try {
        await client.lastMapMessage.delete();
      } catch (err) {
        // Nachricht wurde bereits gelöscht oder existiert nicht mehr
      }
    }

    // Sende neue Nachricht
    client.lastMapMessage = await channel.send({
      embeds: [embed],
      files: [mapAttachment]
    });

    console.log(`✓ Map-Update gesendet: ${new Date().toLocaleTimeString('de-DE')}`);

  } catch (error) {
    console.error('Fehler beim Auto-Update:', error);
  }
}

// Start Auto-Update
client.startAutoUpdate = function() {
  if (this.autoUpdateTimer) {
    clearInterval(this.autoUpdateTimer);
  }

  console.log(`🔄 Auto-Update gestartet (alle ${this.autoUpdateInterval / 1000}s)`);
  
  // Erste Update sofort
  sendMapUpdate();
  
  // Dann regelmäßig
  this.autoUpdateTimer = setInterval(() => {
    sendMapUpdate();
  }, this.autoUpdateInterval);
};

// Event: Bot ist bereit
client.once('ready', async () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Bot ist online als ${client.user.tag}`);
  console.log(`📊 Auf ${client.guilds.cache.size} Server(n)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // RCON Client verbinden
  try {
    console.log('🔌 Verbinde mit RCON Server...');
    client.rconClient = await createRconClient(
      config.rcon.host,
      config.rcon.port,
      config.rcon.password
    );
    console.log('✅ RCON Verbindung hergestellt');

    // Auto-Update starten wenn Channel konfiguriert ist
    if (client.autoUpdateChannelId) {
      client.startAutoUpdate();
    }

  } catch (error) {
    console.error('❌ RCON Verbindung fehlgeschlagen:', error.message);
    console.error('Bot läuft weiter, aber Commands werden nicht funktionieren.');
  }

  // Bot-Status setzen
  client.user.setActivity('Hell Let Loose', { type: 'WATCHING' });
});

// Event: Slash Command Interaktionen
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  // Prüfe ob RCON verbunden ist
  if (!client.rconClient || !client.rconClient.authenticated) {
    await interaction.reply({
      content: '❌ RCON Server ist nicht verbunden. Bitte kontaktiere einen Administrator.',
      ephemeral: true
    });
    return;
  }

  try {
    await command.execute(interaction, client.rconClient, client);
  } catch (error) {
    console.error(`Fehler beim Ausführen von ${interaction.commandName}:`, error);
    
    const errorMessage = {
      content: '❌ Es ist ein Fehler beim Ausführen dieses Commands aufgetreten.',
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Fahre Bot herunter...');
  
  if (client.autoUpdateTimer) {
    clearInterval(client.autoUpdateTimer);
  }
  
  if (client.rconClient) {
    client.rconClient.disconnect();
  }
  
  await client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Fahre Bot herunter...');
  
  if (client.autoUpdateTimer) {
    clearInterval(client.autoUpdateTimer);
  }
  
  if (client.rconClient) {
    client.rconClient.disconnect();
  }
  
  await client.destroy();
  process.exit(0);
});

// Error Handler
process.on('unhandledRejection', error => {
  console.error('Unhandled Promise Rejection:', error);
});

// Bot starten
client.login(config.discord.token);
