// check-file-tables.js - 파일 관련 테이블 확인 및 생성
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: false
});

async function checkAndCreateFileTables() {
    try {
        console.log('📋 파일 관련 테이블 확인 시작...');

        // 1. 기존 테이블 확인
        const existingTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('photos', 'drawings')
    `);

        const tableNames = existingTables.rows.map(row => row.table_name);
        console.log('📊 기존 테이블:', tableNames);

        // 2. photos 테이블 생성/확인
        if (!tableNames.includes('photos')) {
            await pool.query(`
        CREATE TABLE photos (
          id SERIAL PRIMARY KEY,
          order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
          file_name VARCHAR(255) NOT NULL,
          file_path VARCHAR(500) NOT NULL,
          file_size INTEGER,
          upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          photo_type VARCHAR(50) DEFAULT 'order',
          description TEXT
        )
      `);
            console.log('✅ photos 테이블 생성 완료');
        } else {
            console.log('✅ photos 테이블 이미 존재');
        }

        // 3. drawings 테이블 생성/확인
        if (!tableNames.includes('drawings')) {
            await pool.query(`
        CREATE TABLE drawings (
          id SERIAL PRIMARY KEY,
          order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
          file_name VARCHAR(255) NOT NULL,
          file_path VARCHAR(500) NOT NULL,
          file_size INTEGER,
          upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          drawing_type VARCHAR(50) DEFAULT 'design',
          version INTEGER DEFAULT 1,
          is_approved BOOLEAN DEFAULT FALSE,
          description TEXT
        )
      `);
            console.log('✅ drawings 테이블 생성 완료');
        } else {
            console.log('✅ drawings 테이블 이미 존재');
        }

        // 4. 인덱스 생성
        await pool.query('CREATE INDEX IF NOT EXISTS idx_photos_order_id ON photos(order_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_drawings_order_id ON drawings(order_id)');
        console.log('✅ 인덱스 생성 완료');

        // 5. 테이블 구조 확인
        console.log('\n📊 photos 테이블 구조:');
        const photosColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'photos' 
      ORDER BY ordinal_position
    `);
        photosColumns.rows.forEach(col => {
            console.log(`  ✓ ${col.column_name}: ${col.data_type}`);
        });

        console.log('\n📊 drawings 테이블 구조:');
        const drawingsColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'drawings' 
      ORDER BY ordinal_position
    `);
        drawingsColumns.rows.forEach(col => {
            console.log(`  ✓ ${col.column_name}: ${col.data_type}`);
        });

        console.log('\n🎉 파일 관련 테이블 준비 완료!');
        console.log('💡 이제 파일 업로드 기능을 사용할 수 있습니다.');

    } catch (error) {
        console.error('❌ 테이블 확인/생성 실패:', error);
    } finally {
        await pool.end();
    }
}

checkAndCreateFileTables();