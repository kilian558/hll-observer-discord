// HLL Map Koordinaten-Mapping
// Basierend auf den Map-Dimensionen aus dem go-let-observer Projekt

export const MAP_BOUNDS = {
  // Standardgröße für alle Maps
  width: 2000,  // Meter
  height: 2000, // Meter
  
  // Koordinaten-Offset (Zentrum der Map)
  centerX: 0,
  centerY: 0,
  
  // Min/Max Werte für Koordinaten-Normalisierung
  minX: -100000,
  maxX: 100000,
  minY: -100000,
  maxY: 100000
};

export const MAPS = {
  'carentan': {
    name: 'Carentan',
    fileName: 'carentan',
    bounds: MAP_BOUNDS
  },
  'foy': {
    name: 'Foy',
    fileName: 'foy',
    bounds: MAP_BOUNDS
  },
  'hill400': {
    name: 'Hill 400',
    fileName: 'hill400',
    bounds: MAP_BOUNDS
  },
  'hurtgen': {
    name: 'Hurtgen Forest',
    fileName: 'hurtgen',
    bounds: MAP_BOUNDS
  },
  'kursk': {
    name: 'Kursk',
    fileName: 'kursk',
    bounds: MAP_BOUNDS
  },
  'omaha': {
    name: 'Omaha Beach',
    fileName: 'omaha',
    bounds: MAP_BOUNDS
  },
  'phl': {
    name: 'Purple Heart Lane',
    fileName: 'phl',
    bounds: MAP_BOUNDS
  },
  'sme': {
    name: 'St. Mere Eglise',
    fileName: 'sme',
    bounds: MAP_BOUNDS
  },
  'smdm': {
    name: 'St. Marie Du Mont',
    fileName: 'smdm',
    bounds: MAP_BOUNDS
  },
  'stalingrad': {
    name: 'Stalingrad',
    fileName: 'stalingrad',
    bounds: MAP_BOUNDS
  },
  'utah': {
    name: 'Utah Beach',
    fileName: 'utah',
    bounds: MAP_BOUNDS
  },
  'remagen': {
    name: 'Remagen',
    fileName: 'remagen',
    bounds: MAP_BOUNDS
  },
  'kharkov': {
    name: 'Kharkov',
    fileName: 'kharkov',
    bounds: MAP_BOUNDS
  },
  'smolensk': {
    name: 'Smolensk',
    fileName: 'smolensk',
    bounds: MAP_BOUNDS
  },
  'elalamein': {
    name: 'El Alamein',
    fileName: 'elalamein',
    bounds: MAP_BOUNDS
  },
  'driel': {
    name: 'Driel',
    fileName: 'driel',
    bounds: MAP_BOUNDS
  },
  'elsenborn': {
    name: 'Elsenbornridge',
    fileName: 'elsenborn',
    bounds: MAP_BOUNDS
  },
  'mortain': {
    name: 'Mortain',
    fileName: 'mortain',
    bounds: MAP_BOUNDS
  },
  'tobruk': {
    name: 'Tobruk',
    fileName: 'tobruk',
    bounds: MAP_BOUNDS
  }
};

export function getMapInfo(mapName) {
  const normalizedName = mapName.toLowerCase().replace(/\s+/g, '');
  
  // Versuche direkte Übereinstimmung
  if (MAPS[normalizedName]) {
    return MAPS[normalizedName];
  }
  
  // Versuche partielle Übereinstimmung
  for (const [key, map] of Object.entries(MAPS)) {
    if (map.name.toLowerCase().replace(/\s+/g, '').includes(normalizedName) ||
        normalizedName.includes(key)) {
      return map;
    }
  }
  
  // Fallback
  return {
    name: 'Unknown Map',
    fileName: 'unknown',
    bounds: MAP_BOUNDS
  };
}

export function normalizeCoordinates(x, y, mapBounds = MAP_BOUNDS) {
  // Konvertiere Spiel-Koordinaten zu normalisierten 0-1 Werten
  const normalizedX = (x - mapBounds.minX) / (mapBounds.maxX - mapBounds.minX);
  const normalizedY = (y - mapBounds.minY) / (mapBounds.maxY - mapBounds.minY);
  
  return {
    x: Math.max(0, Math.min(1, normalizedX)),
    y: Math.max(0, Math.min(1, normalizedY))
  };
}

export function gameCoordinatesToCanvas(x, y, canvasWidth, canvasHeight, mapBounds = MAP_BOUNDS) {
  const normalized = normalizeCoordinates(x, y, mapBounds);
  
  return {
    x: normalized.x * canvasWidth,
    y: normalized.y * canvasHeight
  };
}
