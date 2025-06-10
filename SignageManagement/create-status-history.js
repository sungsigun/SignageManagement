// create-status-history.js - 주문 상태 이력 테이블 생성
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

async function createStatusHistoryTable() {
    try {
        console.log('🔧 order_status_history 테이블 생성 시작...');

        // 1. order_status_history 테이블 생성
        await pool.query(`
      CREATE TABLE IF NOT EXISTS order_status_history (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        changed_by VARCHAR(100),
        memo TEXT
      )
    `);
        console.log('✅ order_status_history 테이블 생성 완료');

        // 2. 인덱스 추가 (성능 향상)
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id 
      ON order_status_history(order_id)
    `);
        console.log('✅ 인덱스 생성 완료');

        // 3. 기존 주문들에 대한 초기 상태 이력 생성
        const existingOrders = await pool.query(`
      SELECT id, status, created_at FROM orders 
      WHERE id NOT IN (SELECT DISTINCT order_id FROM order_status_history WHERE order_id IS NOT NULL)
    `);

        if (existingOrders.rows.length > 0) {
            console.log(`📝 ${existingOrders.rows.length}개 기존 주문의 상태 이력 생성 중...`);

            for (const order of existingOrders.rows) {
                await pool.query(`
          INSERT INTO order_status_history (order_id, status, changed_at, changed_by, memo)
          VALUES ($1, $2, $3, $4, $5)
        `, [
                    order.id,
                    order.status || '주문접수',
                    order.created_at,
                    'system',
                    '초기 주문 등록'
                ]);
            }
            console.log('✅ 기존 주문 상태 이력 생성 완료');
        }

        // 4. 테이블 구조 확인
        const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'order_status_history' 
      ORDER BY ordinal_position
    `);

        console.log('\n📊 order_status_history 테이블 구조:');
        columns.rows.forEach(col => {
            console.log(`  ✓ ${col.column_name}: ${col.data_type} (null: ${col.is_nullable})`);
        });

        // 5. 외래키 제약조건 확인
        const constraints = await pool.query(`
      SELECT 
        tc.constraint_name, 
        kcu.column_name,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'order_status_history' AND tc.constraint_type = 'FOREIGN KEY'
    `);

        console.log('\n🔗 외래키 제약조건:');
        constraints.rows.forEach(constraint => {
            console.log(`  ✓ ${constraint.column_name} → ${constraint.referenced_table}.${constraint.referenced_column}`);
        });

        // 6. 데이터 확인
        const historyCount = await pool.query('SELECT COUNT(*) as count FROM order_status_history');
        const orderCount = await pool.query('SELECT COUNT(*) as count FROM orders');

        console.log('\n📈 데이터 확인:');
        console.log(`  📦 주문: ${orderCount.rows[0].count}개`);
        console.log(`  📝 상태 이력: ${historyCount.rows[0].count}개`);

        // 7. 테스트: 새 주문 상태 이력 삽입 테스트
        if (orderCount.rows[0].count > 0) {
            const testOrder = await pool.query('SELECT id FROM orders LIMIT 1');
            if (testOrder.rows.length > 0) {
                await pool.query(`
          INSERT INTO order_status_history (order_id, status, changed_by, memo)
          VALUES ($1, $2, $3, $4)
        `, [
                    testOrder.rows[0].id,
                    '테스트 상태',
                    'system',
                    '테이블 생성 후 테스트'
                ]);
                console.log('✅ 상태 이력 삽입 테스트 성공');

                // 테스트 데이터 삭제
                await pool.query(`
          DELETE FROM order_status_history 
          WHERE status = '테스트 상태' AND changed_by = 'system'
        `);
                console.log('✅ 테스트 데이터 정리 완료');
            }
        }

        console.log('\n🎉 order_status_history 테이블 생성이 완료되었습니다!');
        console.log('💡 이제 주문 등록을 다시 시도해보세요.');

    } catch (error) {
        console.error('❌ 테이블 생성 실패:', error);

        if (error.code === 'ECONNREFUSED') {
            console.log('\n🔧 PostgreSQL 서버 연결 실패');
            console.log('1. PostgreSQL 서비스가 실행 중인지 확인하세요');
        } else if (error.message.includes('database') && error.message.includes('does not exist')) {
            console.log('\n🔧 데이터베이스가 존재하지 않습니다');
            console.log('1. .env 파일에서 DB_NAME=postgres로 변경하세요');
        } else if (error.constraint) {
            console.log(`\n🔧 제약조건 오류: ${error.constraint}`);
        }

        console.log('\n📝 오류 상세:');
        console.log(`코드: ${error.code}`);
        console.log(`메시지: ${error.message}`);
    } finally {
        await pool.end();
        console.log('\n🔌 데이터베이스 연결 종료');
    }
}

createStatusHistoryTable();