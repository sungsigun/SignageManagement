// PostgreSQL 연결 테스트
const { Pool } = require('pg');
require('dotenv').config();

console.log('🔍 연결 테스트 시작...');
console.log('📁 현재 디렉토리:', process.cwd());
console.log('📄 .env 파일 확인 중...');

// 환경변수 확인
const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true'
};

console.log('⚙️ 데이터베이스 설정:');
console.log(`   Host: ${dbConfig.host}`);
console.log(`   Port: ${dbConfig.port}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   User: ${dbConfig.user}`);
console.log(`   Password: ${dbConfig.password ? '****' : 'NOT SET'}`);

const pool = new Pool(dbConfig);

async function testConnection() {
    try {
        console.log('\n🔌 PostgreSQL 연결 시도 중...');

        const result = await pool.query('SELECT NOW() as current_time, version()');

        console.log('✅ 연결 성공!');
        console.log('📅 현재 시간:', result.rows[0].current_time);
        console.log('🗄️ DB 버전:', result.rows[0].version.split(' ')[0]);

        // 기존 테이블 확인
        console.log('\n📊 테이블 확인 중...');
        const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `);

        if (tables.rows.length > 0) {
            console.log('✅ 기존 테이블 목록:');
            tables.rows.forEach(row => {
                console.log('  ✓', row.table_name);
            });

            // 각 테이블의 데이터 개수 확인
            console.log('\n📈 데이터 개수:');
            for (const table of tables.rows) {
                try {
                    const count = await pool.query(`SELECT COUNT(*) FROM ${table.table_name}`);
                    console.log(`  ${table.table_name}: ${count.rows[0].count}개`);
                } catch (err) {
                    console.log(`  ${table.table_name}: 조회 실패`);
                }
            }
        } else {
            console.log('⚠️ 테이블이 없습니다.');
            console.log('💡 setup-database.js를 실행하여 테이블을 생성하세요.');
        }

    } catch (err) {
        console.error('\n❌ 연결 실패:', err.message);

        if (err.code === 'ECONNREFUSED') {
            console.log('\n🔧 해결 방법:');
            console.log('1. PostgreSQL 서비스가 실행 중인지 확인하세요');
            console.log('2. 포트 번호가 올바른지 확인하세요 (기본: 5432)');
        } else if (err.code === 'ENOTFOUND') {
            console.log('\n🔧 해결 방법:');
            console.log('1. 호스트 주소가 올바른지 확인하세요');
            console.log('2. localhost 대신 127.0.0.1을 시도해보세요');
        } else if (err.message.includes('password authentication failed')) {
            console.log('\n🔧 해결 방법:');
            console.log('1. .env 파일의 사용자명과 비밀번호를 확인하세요');
            console.log('2. PostgreSQL 사용자 권한을 확인하세요');
        } else if (err.message.includes('database') && err.message.includes('does not exist')) {
            console.log('\n🔧 해결 방법:');
            console.log('1. 데이터베이스 이름을 확인하세요');
            console.log('2. pgAdmin에서 데이터베이스를 생성하세요');
        }

        console.log('\n📋 체크리스트:');
        console.log('□ PostgreSQL 서비스 실행됨');
        console.log('□ .env 파일이 프로젝트 루트에 있음');
        console.log('□ 데이터베이스가 생성되어 있음');
        console.log('□ 사용자명/비밀번호가 정확함');

    } finally {
        await pool.end();
        console.log('\n🔌 연결 종료');
    }
}

testConnection();