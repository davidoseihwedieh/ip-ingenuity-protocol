#!/usr/bin/env python3
import os
import sys
import subprocess
import webbrowser
import time

def main():
    print("🚀 Starting IP Tokenization Platform...")
    
    # Change to backend directory
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    if not os.path.exists(backend_dir):
        print("❌ Backend directory not found")
        return
    
    os.chdir(backend_dir)
    
    print("📍 Starting server at http://localhost:5001")
    print("🌐 Opening browser...")
    
    # Open browser after short delay
    import threading
    def open_browser():
        time.sleep(2)
        webbrowser.open("http://localhost:5001")
    
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Start Flask server
    try:
        subprocess.run([sys.executable, "tokenization_server.py"])
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")

if __name__ == "__main__":
    main()