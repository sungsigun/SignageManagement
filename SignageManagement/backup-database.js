// backup-database.js - 데이터베이스 백업 스크립트
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: false
});

class DatabaseBackup {
    constructor() {
        this.backupDir = './backups';
        this.maxBackups = 30; // 최대 백업 파일 수
        this.ensureBackupDirectory();
    }

    ensureBackupDirectory() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
            console.log('✅ 백업 디렉토리 생성:', this.backupDir);
        }
    }

    generateFilename() {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 19).replace(/[:.]/g, '-');
        return `signage_backup_${dateStr}.sql`;
    }

    async backupTable(tableName) {
        try {
            const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY id`);
            const rows = result.rows;

            if (rows.length === 0) {
                return `-- 테이블 ${tableName}에 데이터가 없습니다.\n\n`;
            }

            let sql = `-- 테이블 ${tableName} 백업 (${rows.length}개 행)\n`;
            sql += `DELETE FROM ${tableName};\n`;

            for (const row of rows) {
                const columns = Object.keys(row);
                const values = columns.map(col => {
                    const value = row[col];
                    if (value === null) return 'NULL';
                    if (typeof value === 'string') {
                        return `'${value.replace(/'/g, "''")}'`;
                    }
                    if (value instanceof Date) {
                        return `'${value.toISOString()}'`;
                    }
                    return value;
                });

                sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
            }

            sql += '\n';
            return sql;
        } catch (error) {
            console.error(`❌ 테이블 ${tableName} 백업 실패:`, error.message);
            return `-- 테이블 ${tableName} 백업 실패: ${error.message}\n\n`;
        }
    }

    async createFullBackup() {
        try {
            console.log('🔄 데이터베이스 백업 시작...');

            const filename = this.generateFilename();
            const filepath = path.join(this.backupDir, filename);

            let backupContent = '';

            // 백업 헤더
            backupContent += `-- 간판 제작 관리 시스템 데이터베이스 백업\n`;
            backupContent += `-- 생성일시: ${new Date().toLocaleString('ko-KR')}\n`;
            backupContent += `-- 파일명: ${filename}\n`;
            backupContent += `-- PostgreSQL 버전: ${(await pool.query('SELECT version()')).rows[0].version}\n\n`;

            // 외래키 제약조건 해제
            backupContent += `-- 외래키 제약조건 임시 해제\n`;
            backupContent += `SET session_replication_role = 'replica';\n\n`;

            // 테이블 백업 (순서 중요)
            const tables = ['customers', 'products', 'orders', 'order_status_history', 'photos', 'drawings'];

            for (const table of tables) {
                console.log(`📝 ${table} 테이블 백업 중...`);
                const tableBackup = await this.backupTable(table);
                backupContent += tableBackup;
            }

            // 시퀀스 재설정
            backupContent += `-- 시퀀스 재설정\n`;
            for (const table of tables) {
                backupContent += `SELECT setval('${table}_id_seq', COALESCE((SELECT MAX(id) FROM ${table}), 1));\n`;
            }
            backupContent += '\n';

            // 외래키 제약조건 복원
            backupContent += `-- 외래키 제약조건 복원\n`;
            backupContent += `SET session_replication_role = 'origin';\n\n`;

            backupContent += `-- 백업 완료: ${new Date().toLocaleString('ko-KR')}\n`;

            // 파일 저장
            fs.writeFileSync(filepath, backupContent, 'utf8');

            console.log('✅ 백업 완료:', filepath);
            console.log('📁 파일 크기:', (fs.statSync(filepath).size / 1024).toFixed(2), 'KB');

            // 통계 정보
            await this.printBackupStats();

            // 오래된 백업 파일 정리
            await this.cleanupOldBackups();

            return filepath;

        } catch (error) {
            console.error('❌ 백업 실패:', error);
            throw error;
        }
    }

    async printBackupStats() {
        try {
            const stats = {};
            const tables = ['customers', 'products', 'orders', 'order_status_history', 'photos', 'drawings'];

            for (const table of tables) {
                try {
                    const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
                    stats[table] = parseInt(result.rows[0].count);
                } catch (error) {
                    stats[table] = 0;
                }
            }

            console.log('\n📊 백업된 데이터 통계:');
            console.log(`   👥 고객: ${stats.customers}명`);
            console.log(`   📦 제품: ${stats.products}개`);
            console.log(`   📋 주문: ${stats.orders}건`);
            console.log(`   📝 상태 이력: ${stats.order_status_history}개`);
            console.log(`   📷 사진: ${stats.photos}개`);
            console.log(`   📐 도면: ${stats.drawings}개`);

        } catch (error) {
            console.log('⚠️ 통계 정보 조회 실패');
        }
    }

    async cleanupOldBackups() {
        try {
            const files = fs.readdirSync(this.backupDir)
                .filter(file => file.startsWith('signage_backup_') && file.endsWith('.sql'))
                .map(file => ({
                    name: file,
                    path: path.join(this.backupDir, file),
                    time: fs.statSync(path.join(this.backupDir, file)).mtime
                }))
                .sort((a, b) => b.time - a.time);

            if (files.length > this.maxBackups) {
                const filesToDelete = files.slice(this.maxBackups);
                console.log(`\n🗑️ 오래된 백업 파일 ${filesToDelete.length}개 삭제 중...`);

                for (const file of filesToDelete) {
                    fs.unlinkSync(file.path);
                    console.log(`   삭제: ${file.name}`);
                }
            }

            console.log(`\n📁 총 백업 파일: ${Math.min(files.length, this.maxBackups)}개`);

        } catch (error) {
            console.error('⚠️ 백업 파일 정리 실패:', error.message);
        }
    }

    async listBackups() {
        try {
            const files = fs.readdirSync(this.backupDir)
                .filter(file => file.startsWith('signage_backup_') && file.endsWith('.sql'))
                .map(file => {
                    const filepath = path.join(this.backupDir, file);
                    const stats = fs.statSync(filepath);
                    return {
                        name: file,
                        size: (stats.size / 1024).toFixed(2) + ' KB',
                        created: stats.mtime.toLocaleString('ko-KR')
                    };
                })
                .sort((a, b) => new Date(b.created) - new Date(a.created));

            if (files.length === 0) {
                console.log('📁 백업 파일이 없습니다.');
                return;
            }

            console.log('\n📁 백업 파일 목록:');
            files.forEach((file, index) => {
                console.log(`${index + 1}. ${file.name}`);
                console.log(`   크기: ${file.size}, 생성일: ${file.created}`);
            });

        } catch (error) {
            console.error('❌ 백업 목록 조회 실패:', error.message);
        }
    }

    async createScheduledBackup() {
        console.log('⏰ 정기 백업 실행...');
        const filepath = await this.createFullBackup();

        // 백업 성공 알림 (추후 이메일이나 슬랙 연동 가능)
        console.log('📧 백업 완료 알림을 보낼 수 있습니다.');

        return filepath;
    }
}

// 메인 실행 함수
async function main() {
    const backup = new DatabaseBackup();

    const command = process.argv[2];

    try {
        switch (command) {
            case 'list':
                await backup.listBackups();
                break;
            case 'scheduled':
                await backup.createScheduledBackup();
                break;
            default:
                await backup.createFullBackup();
        }
    } catch (error) {
        console.error('❌ 백업 프로세스 실패:', error);
        process.exit(1);
    } finally {
        await pool.end();
        console.log('\n🔌 데이터베이스 연결 종료');
    }
}

// 직접 실행 시에만 메인 함수 호출
if (require.main === module) {
    console.log('🗄️ 간판 관리 시스템 데이터베이스 백업 도구');
    console.log('=========================================');
    main();
}

module.exports = DatabaseBackup;