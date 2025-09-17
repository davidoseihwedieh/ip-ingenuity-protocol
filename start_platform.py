#!/usr/bin/env python3
import subprocess
import sys
import os
import time
import webbrowser
from threading import Thread

def install_requirements():
    """Install required packages"""
    print("Installing requirements...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Requirements installed successfully")
    except subprocess.CalledProcessError:
        print("❌ Failed to install requirements")
        sys.exit(1)

def start_backend():
    """Start the Flask backend server"""
    print("Starting backend server...")
    os.chdir("backend")
    subprocess.run([sys.executable, "tokenization_server.py"])

def main():
    print("🚀 Starting IP Tokenization Platform...")
    print("=" * 50)
    
    # Install requirements
    install_requirements()
    
    # Start backend in a separate thread
    backend_thread = Thread(target=start_backend, daemon=True)
    backend_thread.start()
    
    # Wait for server to start
    print("⏳ Waiting for server to start...")
    time.sleep(3)
    
    # Open browser
    print("🌐 Opening browser...")
    webbrowser.open("http://localhost:5001")
    
    print("\n✅ Platform is running!")
    print("📍 Backend API: http://localhost:5001")
    print("🌐 Frontend: http://localhost:5001")
    print("\n🔧 Features available:")
    print("   • Create IP token campaigns")
    print("   • Set milestones and deliverables")
    print("   • Invest in IP tokens")
    print("   • Track campaign progress")
    print("   • Manage portfolio")
    print("\n⚠️  Note: This is a demo version using SQLite database")
    print("   For production, integrate with actual blockchain network")
    
    try:
        # Keep main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down platform...")
        sys.exit(0)

if __name__ == "__main__":
    main()