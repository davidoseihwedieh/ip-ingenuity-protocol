#!/bin/bash

echo "Installing Docker Desktop for macOS..."

# Download Docker Desktop
curl -o Docker.dmg "https://desktop.docker.com/mac/main/amd64/Docker.dmg"

# Mount and install
hdiutil attach Docker.dmg
cp -R /Volumes/Docker/Docker.app /Applications/
hdiutil detach /Volumes/Docker

echo "Docker Desktop installed. Please:"
echo "1. Open Docker Desktop from Applications"
echo "2. Complete setup and start Docker"
echo "3. Run: docker --version to verify"