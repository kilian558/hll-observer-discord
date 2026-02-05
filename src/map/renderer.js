import { createCanvas, registerFont } from 'canvas';
import { AttachmentBuilder } from 'discord.js';
import { getMapInfo, gameCoordinatesToCanvas } from '../rcon/maps.js';
import { config } from '../config.js';

const COLORS = {
  allies: {
    main: '#4A90E2',      // Hellblau
    outline: '#2E5C8A',   // Dunkelblau
    shadow: 'rgba(74, 144, 226, 0.3)'
  },
  axis: {
    main: '#E24A4A',      // Hellrot
    outline: '#8A2E2E',   // Dunkelrot
    shadow: 'rgba(226, 74, 74, 0.3)'
  },
  background: '#1a1a1a',
  grid: 'rgba(255, 255, 255, 0.1)',
  text: '#FFFFFF',
  textShadow: 'rgba(0, 0, 0, 0.8)'
};

export class MapRenderer {
  constructor(width = 1600, height = 1600) {
    this.width = width;
    this.height = height;
    this.canvas = createCanvas(width, height);
    this.ctx = this.canvas.getContext('2d');
  }

  clear() {
    this.ctx.fillStyle = COLORS.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawGrid(divisions = 10) {
    this.ctx.strokeStyle = COLORS.grid;
    this.ctx.lineWidth = 1;

    const cellWidth = this.width / divisions;
    const cellHeight = this.height / divisions;

    // Vertikale Linien
    for (let i = 0; i <= divisions; i++) {
      const x = i * cellWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }

    // Horizontale Linien
    for (let i = 0; i <= divisions; i++) {
      const y = i * cellHeight;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }

    // Grid-Beschriftung (A-J, 1-10)
    this.ctx.fillStyle = COLORS.text;
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const letters = 'ABCDEFGHIJ';
    for (let i = 0; i < divisions; i++) {
      // Buchstaben oben
      this.ctx.fillText(letters[i], (i + 0.5) * cellWidth, 20);
      // Zahlen links
      this.ctx.fillText((i + 1).toString(), 20, (i + 0.5) * cellHeight);
    }
  }

  drawPlayer(x, y, team, size = 12) {
    const color = team === 'allies' ? COLORS.allies : COLORS.axis;
    
    // Schatten/Glow-Effekt
    this.ctx.shadowColor = color.shadow;
    this.ctx.shadowBlur = 15;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;

    // Äußerer Ring
    this.ctx.beginPath();
    this.ctx.arc(x, y, size, 0, Math.PI * 2);
    this.ctx.fillStyle = color.outline;
    this.ctx.fill();

    // Innerer Punkt
    this.ctx.beginPath();
    this.ctx.arc(x, y, size * 0.7, 0, Math.PI * 2);
    this.ctx.fillStyle = color.main;
    this.ctx.fill();

    // Weißer Kern für bessere Sichtbarkeit
    this.ctx.beginPath();
    this.ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fill();

    // Reset Shadow
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
  }

  drawSquad(players, team) {
    if (players.length === 0) return;

    const color = team === 'allies' ? COLORS.allies : COLORS.axis;
    
    // Zeichne Verbindungslinien zwischen Squad-Mitgliedern
    this.ctx.strokeStyle = color.main;
    this.ctx.lineWidth = 2;
    this.ctx.globalAlpha = 0.3;

    for (let i = 0; i < players.length - 1; i++) {
      const p1 = players[i];
      const p2 = players[i + 1];
      
      this.ctx.beginPath();
      this.ctx.moveTo(p1.canvasX, p1.canvasY);
      this.ctx.lineTo(p2.canvasX, p2.canvasY);
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1.0;
  }

  drawHeader(mapName, gameState) {
    // Header-Hintergrund
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, 80);

    // Map-Name
    this.ctx.fillStyle = COLORS.text;
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(mapName, this.width / 2, 30);

    // Team-Scores
    this.ctx.font = 'bold 24px Arial';
    
    // Allies Score (links)
    this.ctx.fillStyle = COLORS.allies.main;
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Allies: ${gameState.alliedScore}`, 50, 60);

    // Axis Score (rechts)
    this.ctx.fillStyle = COLORS.axis.main;
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`Axis: ${gameState.axisScore}`, this.width - 50, 60);

    // Zeit & Spieleranzahl (Mitte)
    this.ctx.fillStyle = COLORS.text;
    this.ctx.textAlign = 'center';
    this.ctx.font = '20px Arial';
    this.ctx.fillText(
      `${gameState.remainingTime} | ${gameState.playerCount}/${gameState.maxPlayers}`,
      this.width / 2,
      60
    );
  }

  drawLegend() {
    const legendY = this.height - 60;
    const legendX = 50;

    // Legend-Hintergrund
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, this.height - 70, this.width, 70);

    // Allies
    this.drawPlayer(legendX, legendY, 'allies', 10);
    this.ctx.fillStyle = COLORS.text;
    this.ctx.font = '18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Allies', legendX + 25, legendY + 5);

    // Axis
    this.drawPlayer(legendX + 150, legendY, 'axis', 10);
    this.ctx.fillText('Axis', legendX + 175, legendY + 5);

    // Timestamp
    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.font = '16px Arial';
    const timestamp = new Date().toLocaleString('de-DE');
    this.ctx.fillText(`Aktualisiert: ${timestamp}`, this.width - 50, legendY + 5);
  }

  async renderMap(mapName, players, gameState) {
    this.clear();

    const mapInfo = getMapInfo(mapName);
    
    // Grid zeichnen
    this.drawGrid(10);

    // Header mit Map-Info und Scores
    this.drawHeader(mapInfo.name, gameState);

    // Spieler nach Teams gruppieren
    const alliedPlayers = [];
    const axisPlayers = [];

    for (const player of players) {
      const coords = gameCoordinatesToCanvas(
        player.position.x,
        player.position.y,
        this.width,
        this.height,
        mapInfo.bounds
      );

      player.canvasX = coords.x;
      player.canvasY = coords.y;

      if (player.team === 'allies') {
        alliedPlayers.push(player);
      } else {
        axisPlayers.push(player);
      }
    }

    // Zeichne alle Spieler
    for (const player of players) {
      this.drawPlayer(
        player.canvasX,
        player.canvasY,
        player.team,
        config.bot.playerDotSize
      );
    }

    // Legende
    this.drawLegend();

    return this.canvas.toBuffer('image/png');
  }

  toDiscordAttachment(filename = 'hll-map.png') {
    const buffer = this.canvas.toBuffer('image/png');
    return new AttachmentBuilder(buffer, { name: filename });
  }
}

export async function generateMapImage(mapName, players, gameState) {
  const renderer = new MapRenderer(
    config.bot.mapImageWidth,
    config.bot.mapImageHeight
  );
  
  const buffer = await renderer.renderMap(mapName, players, gameState);
  return new AttachmentBuilder(buffer, { name: 'hll-map.png' });
}
