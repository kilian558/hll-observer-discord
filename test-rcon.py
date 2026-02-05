#!/usr/bin/env python3
"""
HLL RCON Connection Tester
Testet ob RCON-Credentials funktionieren
"""

import socket
import struct
import sys

HOST = '95.135.1.2'
PORT = 7779
PASSWORD = 'e366EsLCsgrj5UV'  # Aus deiner .env

class RconPacket:
    def __init__(self, id, type, body):
        self.id = id
        self.type = type
        self.body = body
    
    def encode(self):
        body_bytes = self.body.encode('utf-8') + b'\x00\x00'
        size = len(body_bytes) + 10
        return struct.pack('<iii', size, self.id, self.type) + body_bytes
    
    @staticmethod
    def decode(data):
        if len(data) < 12:
            return None
        size, id, type = struct.unpack('<iii', data[:12])
        body = data[12:-2].decode('utf-8', errors='ignore')
        return RconPacket(id, type, body)

def test_rcon():
    print(f"🔌 Verbinde zu {HOST}:{PORT}...")
    
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)
        sock.connect((HOST, PORT))
        print("✅ TCP-Verbindung hergestellt")
        
        # Auth-Paket senden
        auth_packet = RconPacket(0, 3, PASSWORD)
        sock.sendall(auth_packet.encode())
        print(f"📤 Auth-Paket gesendet (Passwort: {PASSWORD})")
        
        # Antwort empfangen (mehrfach versuchen)
        print("📥 Warte auf Antwort...")
        all_data = b''
        attempts = 0
        while attempts < 5:
            try:
                sock.settimeout(2)
                chunk = sock.recv(4096)
                if chunk:
                    all_data += chunk
                    print(f"📦 Chunk {attempts+1}: {len(chunk)} Bytes - {chunk.hex()}")
                    attempts += 1
                else:
                    break
            except socket.timeout:
                print(f"⏱️ Timeout nach {len(all_data)} Bytes")
                break
        
        data = all_data
        print(f"📦 Gesamt empfangen: {len(data)} Bytes")
        if data:
            print(f"📦 Hex: {data.hex()}")
        
        if len(data) >= 12:
            response = RconPacket.decode(data)
            print(f"📨 Response ID: {response.id}")
            print(f"📨 Response Type: {response.type}")
            print(f"📨 Response Body: '{response.body}'")
            
            if response.id == -1:
                print("❌ FEHLER: Falsches Passwort!")
                return False
            elif response.type == 2 or response.type == 0:
                print("✅ Authentifizierung erfolgreich!")
                
                # Test-Command senden
                cmd_packet = RconPacket(1, 2, 'get playerinfo')
                sock.sendall(cmd_packet.encode())
                print("📤 Test-Command gesendet: get playerinfo")
                
                cmd_response = sock.recv(8192)
                print(f"📦 Command Response: {len(cmd_response)} Bytes")
                if len(cmd_response) > 12:
                    response = RconPacket.decode(cmd_response)
                    print(f"📨 Body: {response.body[:200]}...")
                
                return True
            else:
                print(f"⚠️ Unerwartete Response Type: {response.type}")
                return False
        else:
            print(f"❌ Zu wenig Daten empfangen: {len(data)} Bytes")
            print(f"   Erwartet mindestens 12 Bytes, bekommen: {data.hex()}")
            return False
            
    except socket.timeout:
        print("❌ Timeout - Server antwortet nicht")
        return False
    except Exception as e:
        print(f"❌ Fehler: {e}")
        return False
    finally:
        sock.close()
        print("🔌 Verbindung geschlossen")

if __name__ == '__main__':
    success = test_rcon()
    sys.exit(0 if success else 1)
