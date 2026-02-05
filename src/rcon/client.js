import net from 'net';
import { EventEmitter } from 'events';

export class RconClient extends EventEmitter {
  constructor(host, port, password) {
    super();
    this.host = host;
    this.port = port;
    this.password = password;
    this.socket = null;
    this.authenticated = false;
    this.reconnectDelay = 5000;
    this.maxReconnectAttempts = 5;
    this.reconnectAttempts = 0;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.socket = new net.Socket();
      
      this.socket.connect(this.port, this.host, () => {
        console.log(`🔌 Verbunden mit RCON Server: ${this.host}:${this.port}`);
        this.authenticate().then(resolve).catch(reject);
      });

      this.socket.on('error', (err) => {
        console.error('❌ RCON Socket Fehler:', err.message);
        this.handleDisconnect();
        reject(err);
      });

      this.socket.on('close', () => {
        console.log('🔌 RCON Verbindung geschlossen');
        this.authenticated = false;
        this.handleDisconnect();
      });

      this.socket.setTimeout(10000);
      this.socket.on('timeout', () => {
        console.error('⏱️ RCON Timeout');
        this.socket.destroy();
      });
    });
  }

  async authenticate() {
    // Simplified RCON authentication
    // For production, use proper RCON protocol implementation
    console.log('🔐 Authentifizierung mit RCON Server...');
    this.authenticated = true;
    this.reconnectAttempts = 0;
    return true;
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
    if (!this.authenticated || !this.socket) {
      throw new Error('RCON nicht verbunden oder authentifiziert');
    }

    return new Promise((resolve, reject) => {
      let response = '';

      const dataHandler = (data) => {
        response += data.toString();
      };

      this.socket.on('data', dataHandler);

      this.socket.write(command + '\n', (err) => {
        if (err) {
          this.socket.off('data', dataHandler);
          reject(err);
          return;
        }

        setTimeout(() => {
          this.socket.off('data', dataHandler);
          resolve(response);
        }, 500);
      });
    });
  }

  async getPlayerInfo() {
    try {
      const response = await this.sendCommand('get playerinfo');
      return this.parsePlayerInfo(response);
    } catch (error) {
      console.error('Fehler beim Abrufen der Spielerinformationen:', error);
      return [];
    }
  }

  parsePlayerInfo(response) {
    const players = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      // Parse format: "Name : Team : Role : Kills : Deaths : X : Y"
      const match = line.match(/(.+?)\s*:\s*(.+?)\s*:\s*(.+?)\s*:\s*(\d+)\s*:\s*(\d+)\s*:\s*(-?\d+\.?\d*)\s*:\s*(-?\d+\.?\d*)/);
      
      if (match) {
        players.push({
          name: match[1].trim(),
          team: match[2].trim().toLowerCase(),
          role: match[3].trim(),
          kills: parseInt(match[4]),
          deaths: parseInt(match[5]),
          position: {
            x: parseFloat(match[6]),
            y: parseFloat(match[7])
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
      return null;
    }
  }

  parseMapInfo(response) {
    const lines = response.split('\n');
    for (const line of lines) {
      if (line.includes('Current map:')) {
        return line.split(':')[1].trim();
      }
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
        remainingTime: '00:00:00'
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
      if (line.includes('allied')) {
        const match = line.match(/(\d+)/);
        if (match) state.alliedScore = parseInt(match[1]);
      } else if (line.includes('axis')) {
        const match = line.match(/(\d+)/);
        if (match) state.axisScore = parseInt(match[1]);
      } else if (line.includes('time')) {
        const match = line.match(/(\d{2}:\d{2}:\d{2})/);
        if (match) state.remainingTime = match[1];
      } else if (line.includes('players')) {
        const match = line.match(/(\d+)\/(\d+)/);
        if (match) {
          state.playerCount = parseInt(match[1]);
          state.maxPlayers = parseInt(match[2]);
        }
      }
    }

    return state;
  }

  disconnect() {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
      this.authenticated = false;
    }
  }
}

export async function createRconClient(host, port, password) {
  const client = new RconClient(host, port, password);
  await client.connect();
  return client;
}
