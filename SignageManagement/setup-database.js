// setup-database.js - 데이터베이스 초기 설정 스크립트
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

async function setupDatabase() {
    const client = await pool.connect();

    try {
        console.log('🗄️  데이터베이스 설정을 시작합니다...\n');

        // 1. 고객 테이블
        console.log('📝 고객 테이블 생성 중...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                phone VARCHAR(20) UNIQUE NOT NULL,
                address TEXT,
                memo TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. 제품 테이블
        console.log('📦 제품 테이블 생성 중...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                unit_price INTEGER NOT NULL DEFAULT 0,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. 주문 테이블
        console.log('📋 주문 테이블 생성 중...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
                product_type VARCHAR(100) NOT NULL,
                size VARCHAR(100),
                width DECIMAL(10,2) DEFAULT 0,
                height DECIMAL(10,2) DEFAULT 0,
                amount INTEGER NOT NULL DEFAULT 0,
                due_date DATE NOT NULL,
                memo TEXT,
                status VARCHAR(20) DEFAULT '주문접수' CHECK (status IN ('주문접수', '도면작업', '제작중', '완료')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 4. 주문 상태 히스토리 테이블
        console.log('📊 주문 상태 히스토리 테이블 생성 중...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS order_status_history (
                id SERIAL PRIMARY KEY,
                order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                status VARCHAR(20) NOT NULL,
                memo TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 5. 도면 파일 테이블
        console.log('🎨 도면 파일 테이블 생성 중...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS drawings (
                id SERIAL PRIMARY KEY,
                order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                filename VARCHAR(255) NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                file_path TEXT NOT NULL,
                file_size INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 6. 사진 파일 테이블
        console.log('📷 사진 파일 테이블 생성 중...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS photos (
                id SERIAL PRIMARY KEY,
                order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                filename VARCHAR(255) NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                file_path TEXT NOT NULL,
                file_size INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 7. 인덱스 생성
        console.log('🔍 인덱스 생성 중...');

        // 고객 테이블 인덱스
        await client.query('CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);');

        // 주문 테이블 인덱스
        await client.query('CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_orders_due_date ON orders(due_date);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);');

        // 파일 테이블 인덱스
        await client.query('CREATE INDEX IF NOT EXISTS idx_drawings_order_id ON drawings(order_id);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_photos_order_id ON photos(order_id);');

        console.log('\n✅ 기본 테이블 생성 완료!');

        // 8. 기본 제품 데이터 삽입
        console.log('📦 기본 제품 데이터 삽입 중...');

        const existingProducts = await client.query('SELECT COUNT(*) FROM products');
        if (parseInt(existingProducts.rows[0].count) === 0) {
            await client.query(`
                INSERT INTO products (name, unit_price, description) VALUES
                ('LED 간판', 250000, '고품질 LED 간판 - 평방미터당'),
                ('아크릴 간판', 150000, '투명/불투명 아크릴 간판 - 평방미터당'),
                ('네온사인', 300000, '네온 사인 간판 - 평방미터당'),
                ('스틸간판', 120000, '스테인리스 스틸 간판 - 평방미터당'),
                ('현수막', 15000, '비닐 현수막 - 평방미터당'),
                ('채널간판', 350000, '채널 문자 간판 - 평방미터당'),
                ('돌출간판', 280000, '벽면 돌출 간판 - 평방미터당'),
                ('입체간판', 400000, '3D 입체 간판 - 평방미터당');
            `);
            console.log('✅ 기본 제품 8개 삽입 완료!');
        } else {
            console.log('ℹ️  제품 데이터가 이미 존재합니다.');
        }

        // 9. 샘플 고객 데이터 삽입 (개발용)
        console.log('👥 샘플 고객 데이터 삽입 중...');

        const existingCustomers = await client.query('SELECT COUNT(*) FROM customers');
        if (parseInt(existingCustomers.rows[0].count) === 0) {
            await client.query(`
                INSERT INTO customers (name, phone, address, memo) VALUES
                ('김철수', '010-1234-5678', '서울시 강남구 테헤란로 123', '단골 고객'),
                ('박영희', '010-2345-6789', '서울시 서초구 서초대로 456', 'LED 간판 선호'),
                ('이민수', '010-3456-7890', '경기도 성남시 분당구 정자로 789', '대형 간판 전문'),
                ('최정아', '010-4567-8901', '인천시 남동구 구월로 321', '소상공인'),
                ('홍길동', '010-5678-9012', '부산시 해운대구 해운대로 654', '체인점 운영');
            `);
            console.log('✅ 샘플 고객 5명 삽입 완료!');
        } else {
            console.log('ℹ️  고객 데이터가 이미 존재합니다.');
        }

        // 10. 샘플 주문 데이터 삽입 (개발용)
        console.log('📋 샘플 주문 데이터 삽입 중...');

        const existingOrders = await client.query('SELECT COUNT(*) FROM orders');
        if (parseInt(existingOrders.rows[0].count) === 0) {
            await client.query(`
                INSERT INTO orders (customer_id, product_type, size, width, height, amount, due_date, memo, status) VALUES
                (1, 'LED 간판', '2m x 1m', 2.0, 1.0, 500000, '2024-07-15', '빨간색 LED', '제작중'),
                (2, '아크릴 간판', '1.5m x 0.8m', 1.5, 0.8, 180000, '2024-07-20', '투명 아크릴', '도면작업'),
                (3, '네온사인', '3m x 1.2m', 3.0, 1.2, 1080000, '2024-07-25', '푸른색 네온', '주문접수'),
                (4, '현수막', '4m x 2m', 4.0, 2.0, 120000, '2024-07-10', '개업 현수막', '완료'),
                (5, '채널간판', '2.5m x 1m', 2.5, 1.0, 875000, '2024-07-30', '화이트 LED', '주문접수');
            `);

            // 주문 상태 히스토리도 추가
            await client.query(`
                INSERT INTO order_status_history (order_id, status, memo) VALUES
                (1, '주문접수', '새 주문이 접수되었습니다.'),
                (1, '도면작업', '도면 작업을 시작했습니다.'),
                (1, '제작중', '제작을 시작했습니다.'),
                (2, '주문접수', '새 주문이 접수되었습니다.'),
                (2, '도면작업', '도면 작업 중입니다.'),
                (3, '주문접수', '새 주문이 접수되었습니다.'),
                (4, '주문접수', '새 주문이 접수되었습니다.'),
                (4, '도면작업', '도면 작업 완료.'),
                (4, '제작중', '제작 완료.'),
                (4, '완료', '주문이 완료되었습니다.'),
                (5, '주문접수', '새 주문이 접수되었습니다.');
            `);

            console.log('✅ 샘플 주문 5건 삽입 완료!');
        } else {
            console.log('ℹ️  주문 데이터가 이미 존재합니다.');
        }

        // 11. 트리거 생성 (업데이트 시간 자동 갱신)
        console.log('⚡ 트리거 생성 중...');

        await client.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await client.query(`
            DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
            CREATE TRIGGER update_customers_updated_at
                BEFORE UPDATE ON customers
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

        await client.query(`
            DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
            CREATE TRIGGER update_orders_updated_at
                BEFORE UPDATE ON orders
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

        await client.query(`
            DROP TRIGGER IF EXISTS update_products_updated_at ON products;
            CREATE TRIGGER update_products_updated_at
                BEFORE UPDATE ON products
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

        console.log('✅ 자동 업데이트 트리거 생성 완료!');

        // 12. 최종 확인
        console.log('\n📊 데이터베이스 현황:');

        const customerCount = await client.query('SELECT COUNT(*) FROM customers');
        const productCount = await client.query('SELECT COUNT(*) FROM products');
        const orderCount = await client.query('SELECT COUNT(*) FROM orders');

        console.log(`👥 고객: ${customerCount.rows[0].count}명`);
        console.log(`📦 제품: ${productCount.rows[0].count}개`);
        console.log(`📋 주문: ${orderCount.rows[0].count}건`);

        console.log('\n🎉 데이터베이스 설정이 완료되었습니다!');
        console.log('💡 이제 "npm start" 또는 "node app.js"로 서버를 시작할 수 있습니다.');

    } catch (error) {
        console.error('❌ 데이터베이스 설정 중 오류 발생:', error);
        throw error;
    } finally {
        client.release();
    }
}

// 스크립트 실행
if (require.main === module) {
    setupDatabase()
        .then(() => {
            console.log('\n✅ 설정 완료!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ 설정 실패:', error);
            process.exit(1);
        });
}

module.exports = { setupDatabase };