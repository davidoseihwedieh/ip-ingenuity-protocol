const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BackupManager {
    constructor() {
        this.backupDir = process.env.BACKUP_DIR || '/tmp/ip-ingenuity-backups';
        this.retentionDays = 30;
        this.ensureBackupDir();
    }

    ensureBackupDir() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    async backupDatabase() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `database-${timestamp}.sql`;
        const filepath = path.join(this.backupDir, filename);

        try {
            // PostgreSQL backup command
            const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres@localhost/ip_ingenuity';
            execSync(`pg_dump "${dbUrl}" > "${filepath}"`, { stdio: 'inherit' });
            
            console.log(`✅ Database backup created: ${filename}`);
            return { success: true, file: filename, size: this.getFileSize(filepath) };
        } catch (error) {
            console.error('❌ Database backup failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    async backupFiles() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `files-${timestamp}.tar.gz`;
        const filepath = path.join(this.backupDir, filename);

        try {
            const sourceDir = '/Volumes/DOH/ip-ingenuity-protocol';
            execSync(`tar -czf "${filepath}" -C "${path.dirname(sourceDir)}" "${path.basename(sourceDir)}"`, { stdio: 'inherit' });
            
            console.log(`✅ File backup created: ${filename}`);
            return { success: true, file: filename, size: this.getFileSize(filepath) };
        } catch (error) {
            console.error('❌ File backup failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    async backupContracts() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `contracts-${timestamp}.json`;
        const filepath = path.join(this.backupDir, filename);

        try {
            const contractsData = {
                timestamp: Date.now(),
                contracts: {
                    multiSigWallet: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
                    timeLock: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
                    securityAudit: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
                    ipToken: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318'
                },
                network: 'localhost',
                blockNumber: 'latest'
            };

            fs.writeFileSync(filepath, JSON.stringify(contractsData, null, 2));
            
            console.log(`✅ Contract backup created: ${filename}`);
            return { success: true, file: filename, size: this.getFileSize(filepath) };
        } catch (error) {
            console.error('❌ Contract backup failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    async createFullBackup() {
        console.log('🔄 Starting full backup...');
        
        const results = await Promise.all([
            this.backupDatabase(),
            this.backupFiles(),
            this.backupContracts()
        ]);

        const summary = {
            timestamp: Date.now(),
            database: results[0],
            files: results[1],
            contracts: results[2],
            success: results.every(r => r.success)
        };

        // Save backup summary
        const summaryFile = path.join(this.backupDir, `backup-summary-${Date.now()}.json`);
        fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

        console.log(`📊 Backup completed. Success: ${summary.success}`);
        return summary;
    }

    cleanOldBackups() {
        const cutoffDate = Date.now() - (this.retentionDays * 24 * 60 * 60 * 1000);
        
        try {
            const files = fs.readdirSync(this.backupDir);
            let deletedCount = 0;

            files.forEach(file => {
                const filepath = path.join(this.backupDir, file);
                const stats = fs.statSync(filepath);
                
                if (stats.mtime.getTime() < cutoffDate) {
                    fs.unlinkSync(filepath);
                    deletedCount++;
                }
            });

            console.log(`🗑️  Cleaned ${deletedCount} old backup files`);
            return deletedCount;
        } catch (error) {
            console.error('❌ Cleanup failed:', error.message);
            return 0;
        }
    }

    getFileSize(filepath) {
        try {
            const stats = fs.statSync(filepath);
            return Math.round(stats.size / 1024 / 1024 * 100) / 100; // MB
        } catch {
            return 0;
        }
    }

    listBackups() {
        try {
            const files = fs.readdirSync(this.backupDir);
            return files.map(file => {
                const filepath = path.join(this.backupDir, file);
                const stats = fs.statSync(filepath);
                return {
                    name: file,
                    size: this.getFileSize(filepath),
                    created: stats.mtime,
                    type: file.includes('database') ? 'database' : 
                          file.includes('files') ? 'files' : 
                          file.includes('contracts') ? 'contracts' : 'summary'
                };
            }).sort((a, b) => b.created - a.created);
        } catch (error) {
            console.error('❌ Failed to list backups:', error.message);
            return [];
        }
    }

    scheduleBackups() {
        console.log('⏰ Scheduling automatic backups...');
        
        // Daily full backup at 2 AM
        const dailyBackup = () => {
            const now = new Date();
            if (now.getHours() === 2 && now.getMinutes() === 0) {
                this.createFullBackup();
                this.cleanOldBackups();
            }
        };

        setInterval(dailyBackup, 60000); // Check every minute
        console.log('✅ Backup scheduler started');
    }
}

if (require.main === module) {
    const backup = new BackupManager();
    backup.createFullBackup();
}

module.exports = BackupManager;