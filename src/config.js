import dotenv from 'dotenv';
dotenv.config();

export const config = {
  discord: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    guildId: process.env.DISCORD_GUILD_ID,
    updateChannelId: process.env.UPDATE_CHANNEL_ID,
  },
  rcon: {
    host: process.env.RCON_HOST,
    port: parseInt(process.env.RCON_PORT) || 27210,
    password: process.env.RCON_PASSWORD,
  },
  bot: {
    updateInterval: parseInt(process.env.UPDATE_INTERVAL) || 60,
    mapImageWidth: parseInt(process.env.MAP_IMAGE_WIDTH) || 1600,
    mapImageHeight: parseInt(process.env.MAP_IMAGE_HEIGHT) || 1600,
    playerDotSize: parseInt(process.env.PLAYER_DOT_SIZE) || 12,
  }
};

export function validateConfig() {
  const required = [
    'DISCORD_TOKEN',
    'DISCORD_CLIENT_ID',
    'RCON_HOST',
    'RCON_PASSWORD'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Fehlende Umgebungsvariablen:', missing.join(', '));
    console.error('Bitte erstelle eine .env Datei basierend auf .env.example');
    process.exit(1);
  }

  console.log('✅ Konfiguration validiert');
  return true;
}
