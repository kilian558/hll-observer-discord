import { REST, Routes } from 'discord.js';
import { config, validateConfig } from './config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

validateConfig();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  if (command.data) {
    commands.push(command.data.toJSON());
    console.log(`✓ Lade Command: ${command.data.name}`);
  }
}

const rest = new REST().setToken(config.discord.token);

try {
  console.log(`🔄 Registriere ${commands.length} Slash Commands...`);

  let data;
  
  if (config.discord.guildId) {
    // Guild-spezifisch (schneller für Development)
    data = await rest.put(
      Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
      { body: commands }
    );
    console.log(`✅ ${data.length} Guild-Commands erfolgreich registriert!`);
  } else {
    // Global (dauert bis zu 1 Stunde für Deployment)
    data = await rest.put(
      Routes.applicationCommands(config.discord.clientId),
      { body: commands }
    );
    console.log(`✅ ${data.length} Globale Commands erfolgreich registriert!`);
  }

} catch (error) {
  console.error('❌ Fehler beim Registrieren der Commands:', error);
}
