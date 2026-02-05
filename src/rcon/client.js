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
    this.messageId = 0;
    this.pendingResponses = new Map();
  }

  async connect() {
    try {
      console.log(`🔌 Verbinde mit RCON Server: ${this.host}:${this.port}`);
      
      return new Promise((resolve, reject) => {
        this.socket = new net.Socket();
        // WICHTIG: Kein Encoding setzen - RCON ist binär!

        this.socket.connect(this.port, this.host, async () => {
          console.log('🔗 TCP-Verbindung hergestellt');
          
          try {
            await this.authenticate();
            console.log('✅ RCON Verbindung hergestellt');
            this.authenticated = true;
            this.reconnectAttempts = 0;
            resolve(true);
          } catch (authError) {
            reject(authError);
          }
        });

        this.socket.on('data', (data) => {
          console.log(`📥 Empfange ${data.length} Bytes:`, data.toString('hex').substring(0, 100) + (data.length > 50 ? '...' : ''));
          this.handleData(data);
        });

        this.socket.on('error', (err) => {
          console.error('❌ RCON Socket Fehler:', err.message);
          this.authenticated = false;
          this.handleDisconnect();
          reject(err);
        });

        this.socket.on('close', () => {
          console.log('🔌 RCON Verbindung geschlossen');
          this.authenticated = false;
          this.handleDisconnect();
        });

        this.socket.setTimeout(15000);
        this.socket.on('timeout', () => {
          console.error('⏱️ RCON Timeout');
          this.socket.destroy();
          reject(new Error('Connection timeout'));
        });
      });
    } catch (error) {
      console.error('❌ RCON Verbindung fehlgeschlagen:', error.message);
      console.error('   Host:', this.host);
      console.error('   Port:', this.port);
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

  async authenticate() {
    // HLL/Source RCON Authentifizierung
    const response = await this.sendRawCommand(3, this.password);
    if (response.type === 2) {
      console.log('🔐 RCON Authentifizierung erfolgreich');
      return true;
    } else {
      throw new Error('RCON Authentifizierung fehlgeschlagen - falsches Passwort?');
    }
  }

  sendRawCommand(type, command) {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.destroyed) {
        reject(new Error('Socket nicht verbunden'));
        return;
      }

      const id = this.messageId++;
      const cmdBuffer = Buffer.from(command, 'utf8');
      const size = 10 + cmdBuffer.length;
      
      const buffer = Buffer.alloc(size + 4);
      buffer.writeInt32LE(size, 0);
      buffer.writeInt32LE(id, 4);
      buffer.writeInt32LE(type, 8);
      cmdBuffer.copy(buffer, 12);
      buffer.writeInt8(0, 12 + cmdBuffer.length);
      buffer.writeInt8(0, 12 + cmdBuffer.length + 1);

      console.log(`📤 Sende RCON Paket: Type=${type}, ID=${id}, Size=${size}, Command="${command}"`);
      console.log(`📤 Raw Bytes (${buffer.length}):`, buffer.toString('hex').match(/.{1,2}/g).join(' '));

      this.pendingResponses.set(id, { 
        resolve, 
        reject, 
        timeout: setTimeout(() => {
          console.log(`⏱️ Timeout für Command ID ${id} (Type ${type})`);
          this.pendingResponses.delete(id);
          reject(new Error('Command timeout'));
        }, 10000) 
      });

      this.socket.write(buffer);
    });
  }

  handleData(data) {
    try {
      const responses = this.parseResponses(data);
      console.log(`✅ ${responses.length} Response(s) geparst`);
      
      for (const response of responses) {
        console.log(`📨 Response: ID=${response.id}, Type=${response.type}, Body="${response.body.substring(0, 50)}${response.body.length > 50 ? '...' : ''}"}`);
        const pending = this.pendingResponses.get(response.id);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingResponses.delete(response.id);
          pending.resolve(response);
        } else {
          console.log(`⚠️ Keine pending Response für ID ${response.id}`);
        }
      }
    } catch (error) {
      console.error('Fehler beim Parsen der RCON-Antwort:', error);
    }
  }

  parseResponses(data) {
    const responses = [];
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    let offset = 0;

    while (offset < buffer.length) {
      if (offset + 4 > buffer.length) break;
      
      const size = buffer.readInt32LE(offset);
      if (offset + 4 + size > buffer.length) break;
      
      const id = buffer.readInt32LE(offset + 4);
      const type = buffer.readInt32LE(offset + 8);
      const bodyLength = size - 10;
      
      // Body ohne die beiden Null-Bytes am Ende
      let body = '';
      if (bodyLength > 0) {
        body = buffer.toString('utf8', offset + 12, offset + 12 + bodyLength);
      }

      responses.push({ id, type, body });
      offset += 4 + size;
    }

    return responses;
  }

  async sendCommand(command) {
    if (!this.authenticated || !this.socket) {
      throw new Error('RCON nicht verbunden oder authentifiziert');
    }

    try {
      const response = await this.sendRawCommand(2, command);
      return response.body || '';
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
  }

  parsePlayerInfo(response) {
    const players = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
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
