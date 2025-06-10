// create-products-table.js - 제품 테이블 생성 및 기본 데이터 삽입
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

async function createProductsTable() {
    try {
        console.log('🛠️ 제품 테이블 생성 시작...');

        // 1. products 테이블 생성
        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                unit_price INTEGER NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ products 테이블 생성 완료');

        // 2. 기본 제품 데이터 확인
        const existingProducts = await pool.query('SELECT COUNT(*) as count FROM products');
        const productCount = parseInt(existingProducts.rows[0].count);

        if (productCount === 0) {
            console.log('📦 기본 제품 데이터 삽입 중...');

            // 3. 기본 제품 데이터 삽입
            await pool.query(`
                INSERT INTO products (name, unit_price, description) VALUES 
                ('LED 간판', 250000, '평방미터당 가격 - 밝고 선명한 LED 조명'),
                ('아크릴 간판', 150000, '평방미터당 가격 - 투명하고 깔끔한 아크릴'),
                ('네온사인', 300000, '평방미터당 가격 - 화려한 네온 효과'),
                ('스틸간판', 120000, '평방미터당 가격 - 내구성이 뛰어난 스틸'),
                ('현수막', 15000, '평방미터당 가격 - 저렴하고 실용적'),
                ('채널간판', 280000, '평방미터당 가격 - 고급스러운 입체 간판'),
                ('동판간판', 350000, '평방미터당 가격 - 전통적이고 고급스러운 동판'),
                ('목재간판', 180000, '평방미터당 가격 - 자연스럽고 따뜻한 느낌')
            `);
            console.log('✅ 기본 제품 8개 삽입 완료');
        } else {
            console.log(`ℹ️ 기존 제품 ${productCount}개가 이미 존재합니다.`);
        }

        // 4. 제품 목록 확인
        const products = await pool.query('SELECT * FROM products ORDER BY unit_price');
        console.log('\n📋 현재 제품 목록:');
        products.rows.forEach(product => {
            console.log(`  ${product.id}: ${product.name} - ₩${product.unit_price.toLocaleString()} (${product.description})`);
        });

        // 5. 테이블 구조 확인
        const columns = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'products' 
            ORDER BY ordinal_position
        `);

        console.log('\n📊 products 테이블 구조:');
        columns.rows.forEach(col => {
            console.log(`  ✓ ${col.column_name}: ${col.data_type} (null: ${col.is_nullable})`);
        });

        console.log('\n🎉 제품 테이블 준비 완료!');
        console.log('💡 이제 제품 관리 기능을 사용할 수 있습니다.');

    } catch (error) {
        console.error('❌ 제품 테이블 생성 실패:', error);

        if (error.code === 'ECONNREFUSED') {
            console.log('\n🔧 PostgreSQL 서버 연결 실패');
            console.log('1. PostgreSQL 서비스가 실행 중인지 확인하세요');
        } else if (error.message.includes('database') && error.message.includes('does not exist')) {
            console.log('\n🔧 데이터베이스가 존재하지 않습니다');
            console.log('1. .env 파일에서 DB_NAME=postgres로 변경하세요');
        }

        console.log('\n📝 오류 상세:');
        console.log(`코드: ${error.code}`);
        console.log(`메시지: ${error.message}`);
    } finally {
        await pool.end();
        console.log('\n🔌 데이터베이스 연결 종료');
    }
}

createProductsTable();