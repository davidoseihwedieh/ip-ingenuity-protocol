#!/usr/bin/env python3
"""
IP Ingenuity Platform Launcher
Starts the complete IP upload and token generation system
"""

import subprocess
import sys
import os
import time
import webbrowser
from pathlib import Path

def check_dependencies():
    """Check if required Python packages are installed"""
    required_packages = ['flask', 'werkzeug']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"Installing missing packages: {', '.join(missing_packages)}")
        subprocess.check_call([sys.executable, '-m', 'pip', 'install'] + missing_packages)

def start_backend():
    """Start the Flask backend server"""
    print("🚀 Starting IP Ingenuity Backend Server...")
    
    # Change to the correct directory
    os.chdir(Path(__file__).parent)
    
    # Start the backend server
    backend_process = subprocess.Popen([
        sys.executable, 'ip-upload-backend.py'
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    return backend_process

def start_frontend():
    """Start a simple HTTP server for the frontend"""
    print("🌐 Starting Frontend Server...")
    
    # Start simple HTTP server for frontend
    frontend_process = subprocess.Popen([
        sys.executable, '-m', 'http.server', '8000'
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    return frontend_process

def main():
    print("=" * 60)
    print("🔥 IP INGENUITY PROTOCOL - PLATFORM LAUNCHER")
    print("=" * 60)
    print()
    
    try:
        # Check and install dependencies
        check_dependencies()
        
        # Start backend server
        backend_process = start_backend()
        
        # Wait a moment for backend to start
        time.sleep(3)
        
        # Start frontend server
        frontend_process = start_frontend()
        
        # Wait a moment for frontend to start
        time.sleep(2)
        
        print("✅ Backend Server: http://localhost:5001")
        print("✅ Frontend Server: http://localhost:8000")
        print("✅ IP Upload Page: http://localhost:8000/ip-upload.html")
        print()
        print("🎯 FEATURES AVAILABLE:")
        print("   • Upload IP files or text content")
        print("   • Generate blockchain timestamps")
        print("   • Earn tokens for IP contributions")
        print("   • Verify IP ownership and authenticity")
        print("   • View real-time platform statistics")
        print()
        print("📱 Opening IP Upload page in your browser...")
        
        # Open the IP upload page in browser
        webbrowser.open('http://localhost:8000/ip-upload.html')
        
        print()
        print("🔧 SYSTEM STATUS:")
        print("   Backend API: Running on port 5001")
        print("   Frontend UI: Running on port 8000")
        print("   Database: SQLite (ip_registry.db)")
        print("   File Storage: uploads/ directory")
        print()
        print("⚡ QUICK TEST:")
        print("   1. Enter your wallet address")
        print("   2. Upload an IP file or enter text")
        print("   3. Earn tokens instantly!")
        print("   4. View your IP on the blockchain")
        print()
        print("Press Ctrl+C to stop all servers...")
        
        # Keep the script running
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 Shutting down servers...")
            backend_process.terminate()
            frontend_process.terminate()
            print("✅ All servers stopped successfully!")
            
    except Exception as e:
        print(f"❌ Error starting platform: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()