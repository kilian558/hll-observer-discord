# 🎮 HLL Observer Discord Bot

Ein professioneller Discord Bot für **Hell Let Loose**, der Echtzeit-Serverdaten visualisiert und die Map mit farbigen Teampositionierungen (blaue und rote Punkte) im Discord anzeigt.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Discord.js](https://img.shields.io/badge/Discord.js-14.x-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

- 🗺️ **Live Map-Visualisierung** - Zeigt alle Spielerpositionen auf der Map
  - 🔵 Blaue Punkte für Allies
  - 🔴 Rote Punkte für Axis
  - Grid-Overlay mit Koordinaten (A-J, 1-10)
  - Team-Scores und verbleibende Spielzeit

- 📊 **Server-Statistiken** - Detaillierte Spieler- und Serverinformationen
  - Aktuelle Map und Spieleranzahl
  - Top 5 Spieler nach Kills
  - Team-Verteilung und Scores

- 🔄 **Auto-Update System** - Automatische Map-Updates im Discord Channel
  - Konfigurierbare Update-Intervalle (30-3600 Sekunden)
  - Alte Nachrichten werden automatisch gelöscht
  - Saubere Channel-Ansicht

- 🎯 **Slash Commands**
  - `/map` - Zeigt aktuelle Server-Map mit Spielerpositionen
  - `/server` - Server-Status und Statistiken
  - `/players` - Spielerliste mit Filter nach Team
  - `/autoupdate start/stop` - Steuert automatische Updates

- 🚀 **Production-Ready**
  - PM2-Integration für 24/7 Betrieb
  - Automatische Wiederverbindung bei RCON-Ausfällen
  - Ausführliches Logging
  - Graceful Shutdown

## 📋 Voraussetzungen

- **Node.js** 18.x oder höher
- **npm** oder **yarn**
- **Discord Bot Token** ([Discord Developer Portal](https://discord.com/developers/applications))
- **HLL RCON Server** Zugriff (Host, Port, Passwort)
- **Linux Server** (empfohlen für PM2)

## 🔧 Installation

### 1. Repository klonen

\`\`\`bash
cd /pfad/zu/deinem/bot
git clone <dein-repository> hll-observer-discord
cd hll-observer-discord
\`\`\`

### 2. Dependencies installieren

\`\`\`bash
npm install
\`\`\`

**Wichtig für Canvas auf Linux:**
\`\`\`bash
# Ubuntu/Debian
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# CentOS/RHEL
sudo yum install gcc-c++ cairo-devel pango-devel libjpeg-turbo-devel giflib-devel
\`\`\`

### 3. Umgebungsvariablen konfigurieren

Erstelle eine \`.env\` Datei basierend auf \`.env.example\`:

\`\`\`bash
cp .env.example .env
nano .env
\`\`\`

**Erforderliche Konfiguration:**

\`\`\`env
# Discord Bot Configuration
DISCORD_TOKEN=dein_discord_bot_token
DISCORD_CLIENT_ID=deine_client_id
DISCORD_GUILD_ID=deine_guild_id

# HLL RCON Server
RCON_HOST=123.456.789.0
RCON_PORT=27210
RCON_PASSWORD=dein_rcon_passwort

# Optional: Auto-Update Channel
UPDATE_CHANNEL_ID=1234567890123456789
UPDATE_INTERVAL=60

# Map-Rendering Einstellungen
MAP_IMAGE_WIDTH=1600
MAP_IMAGE_HEIGHT=1600
PLAYER_DOT_SIZE=12
\`\`\`

### 4. Discord Bot erstellen

1. Gehe zu [Discord Developer Portal](https://discord.com/developers/applications)
2. Erstelle eine neue Application
3. Gehe zu **Bot** und erstelle einen Bot
4. Kopiere den **Token** in deine \`.env\`
5. Aktiviere unter **Privileged Gateway Intents**:
   - ✅ Server Members Intent (optional)
   - ✅ Message Content Intent (optional)

6. Gehe zu **OAuth2 → URL Generator**
   - Scopes: \`bot\`, \`applications.commands\`
   - Bot Permissions: 
     - Send Messages
     - Embed Links
     - Attach Files
     - Use Slash Commands
   - Kopiere die URL und lade den Bot auf deinen Server ein

### 5. Commands registrieren

\`\`\`bash
npm run deploy
\`\`\`

## 🚀 Bot starten

### Development (ohne PM2)

\`\`\`bash
npm start
\`\`\`

### Production mit PM2

#### PM2 installieren (falls noch nicht installiert)

\`\`\`bash
npm install -g pm2
\`\`\`

#### Bot mit PM2 starten

\`\`\`bash
npm run pm2:start
\`\`\`

#### PM2 Commands

\`\`\`bash
# Bot Status anzeigen
pm2 status

# Logs ansehen
npm run pm2:logs
# oder
pm2 logs hll-observer-bot

# Bot stoppen
npm run pm2:stop

# Bot neustarten
npm run pm2:restart

# Bot aus PM2 entfernen
npm run pm2:delete

# PM2 beim Systemstart automatisch starten
pm2 startup
pm2 save
\`\`\`

## 📖 Verwendung

### Slash Commands

#### `/map`
Zeigt die aktuelle Server-Map mit allen Spielerpositionen.

- Blaue Punkte = Allies
- Rote Punkte = Axis
- Grid mit Koordinaten
- Team-Scores und Zeitanzeige

#### `/server`
Zeigt Server-Statistiken:
- Aktuelle Map
- Spieleranzahl
- Team-Scores
- Top 5 Spieler nach Kills

#### `/players [team]`
Zeigt eine sortierte Spielerliste:
- Optional nach Team filtern (\`allies\` oder \`axis\`)
- Sortiert nach Kills
- Zeigt K/D-Verhältnis und Rolle

#### `/autoupdate start [interval]`
Startet automatische Map-Updates im aktuellen Channel.
- \`interval\`: Update-Intervall in Sekunden (30-3600)
- Standard: 60 Sekunden
- ⚠️ Nur für Administratoren

#### `/autoupdate stop`
Stoppt automatische Updates.

## 🎨 Anpassungen

### Map-Rendering anpassen

Bearbeite [src/map/renderer.js](src/map/renderer.js):

\`\`\`javascript
const COLORS = {
  allies: {
    main: '#4A90E2',      // Hauptfarbe ändern
    outline: '#2E5C8A',   // Randfarbe ändern
  },
  axis: {
    main: '#E24A4A',      // Hauptfarbe ändern
    outline: '#8A2E2E',   // Randfarbe ändern
  }
};
\`\`\`

### Punkt-Größe anpassen

In der \`.env\`:
\`\`\`env
PLAYER_DOT_SIZE=15  # Größer = deutlicher sichtbar
\`\`\`

### Update-Intervall ändern

Standard ist 60 Sekunden. Ändern in \`.env\`:
\`\`\`env
UPDATE_INTERVAL=120  # 2 Minuten
\`\`\`

## 🛠️ Projektstruktur

\`\`\`
hll-observer-discord/
├── src/
│   ├── commands/           # Slash Commands
│   │   ├── map.js         # /map Command
│   │   ├── server.js      # /server Command
│   │   ├── players.js     # /players Command
│   │   └── autoupdate.js  # /autoupdate Command
│   ├── map/
│   │   └── renderer.js    # Canvas Map-Rendering
│   ├── rcon/
│   │   ├── client.js      # RCON Client
│   │   └── maps.js        # Map-Daten & Koordinaten
│   ├── config.js          # Konfiguration
│   ├── deploy-commands.js # Command Deployment
│   └── index.js           # Haupteinstiegspunkt
├── logs/                  # PM2 Logs (auto-generiert)
├── .env.example          # Beispiel-Konfiguration
├── .gitignore
├── ecosystem.config.js   # PM2 Konfiguration
├── package.json
└── README.md
\`\`\`

## 🐛 Troubleshooting

### Bot startet nicht

1. Prüfe \`.env\` Datei:
   \`\`\`bash
   cat .env
   \`\`\`

2. Prüfe Node.js Version:
   \`\`\`bash
   node --version  # Sollte >= 18.x sein
   \`\`\`

3. Prüfe PM2 Logs:
   \`\`\`bash
   pm2 logs hll-observer-bot --lines 50
   \`\`\`

### RCON Verbindung fehlschlägt

1. Prüfe Firewall-Regeln:
   \`\`\`bash
   telnet YOUR_RCON_HOST 27210
   \`\`\`

2. Prüfe RCON-Credentials in \`.env\`

3. Teste RCON mit einem Tool wie [HLLLogUtilities](https://github.com/MarechJ/hll_rcon_tool)

### Canvas Installation schlägt fehl

**Linux:**
\`\`\`bash
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
npm install canvas --build-from-source
\`\`\`

**Windows:**
- Installiere [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
- Dann: \`npm install canvas\`

### Commands erscheinen nicht im Discord

1. Commands erneut deployen:
   \`\`\`bash
   npm run deploy
   \`\`\`

2. Bot neu einladen mit korrekten Permissions

3. Warte bis zu 1 Stunde (bei globalen Commands)

### Map wird nicht richtig gerendert

1. Prüfe Koordinaten-Daten in [src/rcon/maps.js](src/rcon/maps.js)
2. Passe \`MAP_BOUNDS\` an wenn nötig
3. Erhöhe \`PLAYER_DOT_SIZE\` in \`.env\`

## 📝 Logs

PM2 erstellt automatisch Log-Dateien:

\`\`\`bash
# Alle Logs
pm2 logs hll-observer-bot

# Nur Error-Logs
tail -f logs/error.log

# Nur Output-Logs
tail -f logs/out.log
\`\`\`

## 🔐 Sicherheit

- ⚠️ **Niemals** \`.env\` in Git committen
- Verwende starke RCON-Passwörter
- Beschränke Bot-Permissions im Discord
- Halte Dependencies aktuell: \`npm audit fix\`

## 📊 Performance

- Empfohlene Update-Intervalle:
  - **30-60s** für aktive Überwachung
  - **120-300s** für passive Überwachung
  - **> 300s** bei vielen Spielern

- Memory Usage: ~150-200 MB
- CPU Usage: < 5% (bei 60s Update-Intervall)

## 🤝 Contributing

Contributions sind willkommen! Bitte erstelle einen Pull Request.

## 📜 License

MIT License - siehe LICENSE Datei für Details.

## 🙏 Credits

Basierend auf [go-let-observer](https://github.com/zMoooooritz/go-let-observer) von zMoooooritz.

## 📞 Support

Bei Fragen oder Problemen erstelle ein Issue auf GitHub.

---

**Viel Spaß mit dem HLL Observer Discord Bot! 🎮**
