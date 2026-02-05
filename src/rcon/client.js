import { Rcon } from 'rcon-client';
import { EventEmitter } from 'events';

export class RconClient extends EventEmitter {
  constructor(host, port, password) {
    super();
    this.host = host;
    this.port = port;
    this.password = password;
    this.rcon = null;
    this.authenticated = false;
    this.reconnectDelay = 5000;
    this.maxReconnectAttempts = 5;
    this.reconnectAttempts = 0;
  }

  async connect() {
    try {
      this.rcon = await Rcon.connect({
        host: this.host,
        port: this.port,
        password: this.password,
        timeout: 5000
      });

      console.log(`🔌 Verbunden mit RCON Server: ${this.host}:${this.port}`);
      console.log('✅ RCON Verbindung hergestellt');
      this.authenticated = true;
      this.reconnectAttempts = 0;

      return true;
    } catch (error) {
      console.error('❌ RCON Verbindung fehlgeschlagen:', error.message);
      this.authenticated = false;
      this.handleDisconnect();
      throw error;
    }
  }

  handleDisconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Versuche Wiederverbindung (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connect().catch(console.error), this.reconnectDelay);
    } else {
      console.error('❌ Max Wiederverbindungsversuche erreicht');
      this.emit('maxReconnectAttemptsReached');
    }
  }

  async sendCommand(command) {
    if (!this.authenticated || !this.rcon) {
      throw new Error('RCON nicht verbunden oder authentifiziert');
    }

    try {
      const response = await this.rcon.execute(command);
      return response;
    } catch (error) {
      console.error('Fehler beim Senden des RCON-Befehls:', error.message);
      throw error;
    }
  }

  async getPlayerInfo() {
    try {
      const response = await this.sendCommand('get playerinfo');
      return this.parsePlayerInfo(response);
    } catch (error) {
      console.error('Fehler beim Abrufen der Spielerinformationen:', error);
      return [];
    }
  }send

  parsePlayerInfo(response) {
    const players = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      // HLL Format: Name: Team: Role: Kills: Deaths: X: Y
      // Beispiel: "Player1 : Allies : Rifleman : 5 : 2 : 12345.67 : -9876.54"
      const parts = line.split(':').map(s => s.trim());
      
      if (parts.length >= 7) {
        players.push({
          name: parts[0],
          team: parts[1].toLowerCase(),
          role: parts[2],
          kills: parseInt(parts[3]) || 0,
          deaths: parseInt(parts[4]) || 0,
          position: {
            x: parseFloat(parts[5]) || 0,
            y: parseFloat(parts[6]) || 0
          }
        });
      }
    }
    
    return players;
  }

  async getCurrentMap() {
    try {
      const response = await this.sendCommand('get map');
      return this.parseMapInfo(response);
    } catch (error) {
      console.error('Fehler beim Abrufen der Map-Informationen:', error);
      return 'unknown';
    }
  }

  parseMapInfo(response) {
    // HLL gibt Map-Namen zurück wie "SME_P", "Carentan_P" etc.
    const match = response.match(/(\w+)(?:_P)?/);
    if (match) {
      return match[1].toLowerCase();
    }
    return 'unknown';
  }

  async getGameState() {
    try {
      const response = await this.sendCommand('get gamestate');
      return this.parseGameState(response);
    } catch (error) {
      console.error('Fehler beim Abrufen des Spielstatus:', error);
      return {
        alliedScore: 0,
        axisScore: 0,
        remainingTime: '00:00:00',
        playerCount: 0,
        maxPlayers: 100
      };
    }
  }

  parseGameState(response) {
    const state = {
      alliedScore: 0,
      axisScore: 0,
      remainingTime: '00:00:00',
      playerCount: 0,
      maxPlayers: 100
    };

    const lines = response.split('\n');
    for (const line of lines) {
      const lower = line.toLowerCase();
      
      if (lower.includes('allied')) {
        const match = line.match(/(\d+)/);
        if (match) state.alliedScore = parseInt(match[1]);
      } else if (lower.includes('axis')) {
        const match = line.match(/(\d+)/);
        if (match) state.axisScore = parseInt(match[1]);
      } else if (lower.includes('time') || lower.includes('remaining')) {
        const match = line.match(/(\d{1,2}):(\d{2}):(\d{2})/);
        if (match) state.remainingTime = `${match[1].padStart(2, '0')}:${match[2]}:${match[3]}`;
      } else if (lower.includes('player')) {
        const match = line.match(/(\d+)\s*\/\s*(\d+)/);
        if (match) {
          state.playerCount = parseInt(match[1]);
          state.maxPlayers = parseInt(match[2]);
        }
      }
    }

    return state;
  }

  disconnect() {
    if (this.rcon) {
      this.rcon.end();
      this.rcon = null;
      this.authenticated = false;
    }
  }
}

export async function createRconClient(host, port, password) {
  const client = new RconClient(host, port, password);
  await client.connect();
  return client;
}
