#!/usr/bin/env python3
import subprocess
import os

def commit_and_push():
    """Commit new IP platform files to GitHub"""
    
    files_to_add = [
        'ip-upload-backend.py',
        'ip-upload.html', 
        'start-ip-platform.py',
        'requirements-ip-platform.txt',
        'Procfile',
        'runtime.txt',
        'app.py'
    ]
    
    # Add files
    for file in files_to_add:
        subprocess.run(['git', 'add', file])
    
    # Commit
    subprocess.run(['git', 'commit', '-m', 'Add functional IP upload platform with token generation'])
    
    # Push
    subprocess.run(['git', 'push', 'origin', 'main'])
    
    print("✅ Files committed and pushed to GitHub!")

if __name__ == "__main__":
    commit_and_push()