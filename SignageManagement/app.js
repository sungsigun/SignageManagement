// 간판 제작 관리 시스템 - Express 백엔드 서버
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3004;

// ===== 데이터베이스 연결 =====
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'signage_works',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// 데이터베이스 연결 테스트
pool.on('connect', () => {
    console.log('✅ PostgreSQL 데이터베이스에 연결되었습니다.');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL 연결 오류:', err);
});

// ===== 미들웨어 설정 =====

// 보안 미들웨어
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"]
        }
    }
}));

// CORS 설정
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:3003', 'http://localhost:3004'];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        const msg = 'CORS 정책에 의해 차단된 요청입니다.';
        return callback(new Error(msg), false);
    },
    credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15분
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// 기본 미들웨어
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 정적 파일 서빙
app.use(express.static('public'));

// 업로드 디렉토리 생성
const uploadsDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(path.join(uploadsDir, 'drawings'));
fs.ensureDirSync(path.join(uploadsDir, 'photos'));

// 파일 업로드 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = file.fieldname === 'drawing'
            ? path.join(uploadsDir, 'drawings')
            : path.join(uploadsDir, 'photos');
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
        files: parseInt(process.env.MAX_FILES_PER_REQUEST) || 5
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('지원하지 않는 파일 형식입니다.'), false);
        }
    }
});

// ===== API 라우트 =====

// 헬스 체크
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});

// 대시보드 데이터
app.get('/api/dashboard', async (req, res) => {
    try {
        const client = await pool.connect();

        // 통계 데이터 조회
        const statsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM customers) as total_customers,
                (SELECT COUNT(*) FROM orders) as total_orders,
                (SELECT COUNT(*) FROM orders WHERE status != '완료') as pending_orders,
                (SELECT COALESCE(SUM(amount), 0) FROM orders WHERE status = '완료') as total_revenue
        `;
        const stats = await client.query(statsQuery);

        // 상태별 분포
        const statusQuery = `
            SELECT status, COUNT(*) as count 
            FROM orders 
            GROUP BY status 
            ORDER BY count DESC
        `;
        const statusDistribution = await client.query(statusQuery);

        // 월별 매출 (최근 6개월)
        const revenueQuery = `
            SELECT 
                TO_CHAR(created_at, 'YYYY-MM') as month,
                TO_CHAR(created_at, 'MM월') as month_label,
                COALESCE(SUM(amount), 0) as revenue
            FROM orders 
            WHERE status = '완료' 
                AND created_at >= CURRENT_DATE - INTERVAL '6 months'
            GROUP BY TO_CHAR(created_at, 'YYYY-MM'), TO_CHAR(created_at, 'MM월')
            ORDER BY month
        `;
        const monthlyRevenue = await client.query(revenueQuery);

        // 최근 주문 (10건)
        const recentOrdersQuery = `
            SELECT o.*, c.name as customer_name, c.phone as customer_phone
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            ORDER BY o.created_at DESC
            LIMIT 10
        `;
        const recentOrders = await client.query(recentOrdersQuery);

        client.release();

        res.json({
            ...stats.rows[0],
            statusDistribution: statusDistribution.rows,
            monthlyRevenue: monthlyRevenue.rows.map(row => ({
                month: row.month_label,
                revenue: parseInt(row.revenue)
            })),
            recentOrders: recentOrders.rows
        });

    } catch (error) {
        console.error('대시보드 데이터 조회 오류:', error);
        res.status(500).json({ error: '대시보드 데이터를 불러오는데 실패했습니다.' });
    }
});

// ===== 고객 관리 API =====

// 고객 목록 조회
app.get('/api/customers', async (req, res) => {
    try {
        const client = await pool.connect();
        const { search, limit = 100, offset = 0 } = req.query;

        let query = 'SELECT * FROM customers';
        let params = [];

        if (search) {
            query += ' WHERE name ILIKE $1 OR phone ILIKE $1 OR address ILIKE $1';
            params.push(`%${search}%`);
        }

        query += ' ORDER BY created_at DESC';

        if (limit) {
            const limitIndex = params.length + 1;
            const offsetIndex = params.length + 2;
            query += ` LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
            params.push(limit, offset);
        }

        const result = await client.query(query, params);
        client.release();

        res.json(result.rows);
    } catch (error) {
        console.error('고객 목록 조회 오류:', error);
        res.status(500).json({ error: '고객 목록을 불러오는데 실패했습니다.' });
    }
});

// 고객 상세 조회
app.get('/api/customers/:id', async (req, res) => {
    try {
        const client = await pool.connect();
        const { id } = req.params;

        const customerQuery = 'SELECT * FROM customers WHERE id = $1';
        const customer = await client.query(customerQuery, [id]);

        if (customer.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: '고객을 찾을 수 없습니다.' });
        }

        // 고객의 주문 내역도 함께 조회
        const ordersQuery = `
            SELECT * FROM orders 
            WHERE customer_id = $1 
            ORDER BY created_at DESC
        `;
        const orders = await client.query(ordersQuery, [id]);

        client.release();

        res.json({
            ...customer.rows[0],
            orders: orders.rows
        });
    } catch (error) {
        console.error('고객 상세 조회 오류:', error);
        res.status(500).json({ error: '고객 정보를 불러오는데 실패했습니다.' });
    }
});

// 고객 생성
app.post('/api/customers', async (req, res) => {
    try {
        const client = await pool.connect();
        const { name, phone, address, memo } = req.body;

        // 유효성 검사
        if (!name || !phone) {
            client.release();
            return res.status(400).json({ error: '이름과 전화번호는 필수입니다.' });
        }

        // 전화번호 중복 확인
        const existingCustomer = await client.query(
            'SELECT id FROM customers WHERE phone = $1',
            [phone]
        );

        if (existingCustomer.rows.length > 0) {
            client.release();
            return res.status(409).json({ error: '이미 등록된 전화번호입니다.' });
        }

        const query = `
            INSERT INTO customers (name, phone, address, memo)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;

        const result = await client.query(query, [name, phone, address || null, memo || null]);
        client.release();

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('고객 생성 오류:', error);
        res.status(500).json({ error: '고객 등록에 실패했습니다.' });
    }
});

// 고객 수정
app.put('/api/customers/:id', async (req, res) => {
    try {
        const client = await pool.connect();
        const { id } = req.params;
        const { name, phone, address, memo } = req.body;

        // 유효성 검사
        if (!name || !phone) {
            client.release();
            return res.status(400).json({ error: '이름과 전화번호는 필수입니다.' });
        }

        // 다른 고객의 전화번호와 중복 확인
        const existingCustomer = await client.query(
            'SELECT id FROM customers WHERE phone = $1 AND id != $2',
            [phone, id]
        );

        if (existingCustomer.rows.length > 0) {
            client.release();
            return res.status(409).json({ error: '이미 사용 중인 전화번호입니다.' });
        }

        const query = `
            UPDATE customers 
            SET name = $1, phone = $2, address = $3, memo = $4
            WHERE id = $5
            RETURNING *
        `;

        const result = await client.query(query, [name, phone, address || null, memo || null, id]);

        if (result.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: '고객을 찾을 수 없습니다.' });
        }

        client.release();
        res.json(result.rows[0]);
    } catch (error) {
        console.error('고객 수정 오류:', error);
        res.status(500).json({ error: '고객 정보 수정에 실패했습니다.' });
    }
});

// 고객 삭제
app.delete('/api/customers/:id', async (req, res) => {
    try {
        const client = await pool.connect();
        const { id } = req.params;

        // 관련 주문 수 확인
        const orderCountQuery = 'SELECT COUNT(*) FROM orders WHERE customer_id = $1';
        const orderCount = await client.query(orderCountQuery, [id]);

        // 고객 삭제 (CASCADE로 관련 주문도 함께 삭제됨)
        const deleteQuery = 'DELETE FROM customers WHERE id = $1 RETURNING *';
        const result = await client.query(deleteQuery, [id]);

        if (result.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: '고객을 찾을 수 없습니다.' });
        }

        client.release();

        res.json({
            message: '고객이 삭제되었습니다.',
            deletedOrderCount: parseInt(orderCount.rows[0].count)
        });
    } catch (error) {
        console.error('고객 삭제 오류:', error);
        res.status(500).json({ error: '고객 삭제에 실패했습니다.' });
    }
});

// ===== 제품 관리 API =====

// 제품 목록 조회
app.get('/api/products', async (req, res) => {
    try {
        const client = await pool.connect();
        const { search } = req.query;

        let query = 'SELECT * FROM products';
        let params = [];

        if (search) {
            query += ' WHERE name ILIKE $1 OR description ILIKE $1';
            params.push(`%${search}%`);
        }

        query += ' ORDER BY name';

        const result = await client.query(query, params);
        client.release();

        res.json(result.rows);
    } catch (error) {
        console.error('제품 목록 조회 오류:', error);
        res.status(500).json({ error: '제품 목록을 불러오는데 실패했습니다.' });
    }
});

// 제품 생성
app.post('/api/products', async (req, res) => {
    try {
        const client = await pool.connect();
        const { name, unit_price, description } = req.body;

        if (!name || unit_price == null) {
            client.release();
            return res.status(400).json({ error: '제품명과 단가는 필수입니다.' });
        }

        const query = `
            INSERT INTO products (name, unit_price, description)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const result = await client.query(query, [name, unit_price, description || null]);
        client.release();

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('제품 생성 오류:', error);
        res.status(500).json({ error: '제품 등록에 실패했습니다.' });
    }
});

// 제품 수정
app.put('/api/products/:id', async (req, res) => {
    try {
        const client = await pool.connect();
        const { id } = req.params;
        const { name, unit_price, description } = req.body;

        if (!name || unit_price == null) {
            client.release();
            return res.status(400).json({ error: '제품명과 단가는 필수입니다.' });
        }

        const query = `
            UPDATE products 
            SET name = $1, unit_price = $2, description = $3
            WHERE id = $4
            RETURNING *
        `;

        const result = await client.query(query, [name, unit_price, description || null, id]);

        if (result.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: '제품을 찾을 수 없습니다.' });
        }

        client.release();
        res.json(result.rows[0]);
    } catch (error) {
        console.error('제품 수정 오류:', error);
        res.status(500).json({ error: '제품 정보 수정에 실패했습니다.' });
    }
});

// 제품 삭제
app.delete('/api/products/:id', async (req, res) => {
    try {
        const client = await pool.connect();
        const { id } = req.params;

        const deleteQuery = 'DELETE FROM products WHERE id = $1 RETURNING *';
        const result = await client.query(deleteQuery, [id]);

        if (result.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: '제품을 찾을 수 없습니다.' });
        }

        client.release();
        res.json({ message: '제품이 삭제되었습니다.' });
    } catch (error) {
        console.error('제품 삭제 오류:', error);
        res.status(500).json({ error: '제품 삭제에 실패했습니다.' });
    }
});

// ===== 주문 관리 API =====

// 주문 목록 조회
app.get('/api/orders', async (req, res) => {
    try {
        const client = await pool.connect();
        const { status, customer_id, limit = 100, offset = 0 } = req.query;

        let query = `
            SELECT o.*, c.name as customer_name, c.phone as customer_phone
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
        `;
        let params = [];
        let whereConditions = [];

        if (status) {
            whereConditions.push(`o.status = $${params.length + 1}`);
            params.push(status);
        }

        if (customer_id) {
            whereConditions.push(`o.customer_id = $${params.length + 1}`);
            params.push(customer_id);
        }

        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }

        query += ' ORDER BY o.created_at DESC';

        if (limit) {
            const limitIndex = params.length + 1;
            const offsetIndex = params.length + 2;
            query += ` LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
            params.push(limit, offset);
        }

        const result = await client.query(query, params);
        client.release();

        res.json(result.rows);
    } catch (error) {
        console.error('주문 목록 조회 오류:', error);
        res.status(500).json({ error: '주문 목록을 불러오는데 실패했습니다.' });
    }
});

// 주문 상세 조회
app.get('/api/orders/:id', async (req, res) => {
    try {
        const client = await pool.connect();
        const { id } = req.params;

        const orderQuery = `
            SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            WHERE o.id = $1
        `;
        const order = await client.query(orderQuery, [id]);

        if (order.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: '주문을 찾을 수 없습니다.' });
        }

        // 상태 히스토리 조회
        const historyQuery = `
            SELECT * FROM order_status_history 
            WHERE order_id = $1 
            ORDER BY created_at DESC
        `;
        const history = await client.query(historyQuery, [id]);

        // 첨부 파일 조회
        const drawingsQuery = 'SELECT * FROM drawings WHERE order_id = $1 ORDER BY created_at DESC';
        const photosQuery = 'SELECT * FROM photos WHERE order_id = $1 ORDER BY created_at DESC';

        const drawings = await client.query(drawingsQuery, [id]);
        const photos = await client.query(photosQuery, [id]);

        client.release();

        res.json({
            ...order.rows[0],
            statusHistory: history.rows,
            drawings: drawings.rows,
            photos: photos.rows
        });
    } catch (error) {
        console.error('주문 상세 조회 오류:', error);
        res.status(500).json({ error: '주문 정보를 불러오는데 실패했습니다.' });
    }
});

// 주문 생성
app.post('/api/orders', async (req, res) => {
    try {
        const client = await pool.connect();
        const {
            customer_id, product_type, size, width, height,
            amount, due_date, memo, status = '주문접수'
        } = req.body;

        // 유효성 검사
        if (!customer_id || !product_type || !amount || !due_date) {
            client.release();
            return res.status(400).json({
                error: '고객, 제품, 금액, 납기일은 필수입니다.'
            });
        }

        // 고객 존재 확인
        const customerCheck = await client.query(
            'SELECT id FROM customers WHERE id = $1',
            [customer_id]
        );

        if (customerCheck.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: '존재하지 않는 고객입니다.' });
        }

        await client.query('BEGIN');

        // 주문 생성
        const orderQuery = `
            INSERT INTO orders (
                customer_id, product_type, size, width, height, 
                amount, due_date, memo, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;

        const orderResult = await client.query(orderQuery, [
            customer_id, product_type, size || null, width || 0, height || 0,
            amount, due_date, memo || null, status
        ]);

        const orderId = orderResult.rows[0].id;

        // 상태 히스토리 추가
        const historyQuery = `
            INSERT INTO order_status_history (order_id, status, memo)
            VALUES ($1, $2, $3)
        `;

        await client.query(historyQuery, [orderId, status, '새 주문이 등록되었습니다.']);

        await client.query('COMMIT');
        client.release();

        res.status(201).json(orderResult.rows[0]);
    } catch (error) {
        const client = await pool.connect();
        await client.query('ROLLBACK');
        client.release();

        console.error('주문 생성 오류:', error);
        res.status(500).json({ error: '주문 등록에 실패했습니다.' });
    }
});

// 주문 수정
app.put('/api/orders/:id', async (req, res) => {
    try {
        const client = await pool.connect();
        const { id } = req.params;
        const {
            customer_id, product_type, size, width, height,
            amount, due_date, memo, status
        } = req.body;

        // 유효성 검사
        if (!customer_id || !product_type || !amount || !due_date) {
            client.release();
            return res.status(400).json({
                error: '고객, 제품, 금액, 납기일은 필수입니다.'
            });
        }

        const query = `
            UPDATE orders 
            SET customer_id = $1, product_type = $2, size = $3, width = $4, height = $5,
                amount = $6, due_date = $7, memo = $8, status = $9
            WHERE id = $10
            RETURNING *
        `;

        const result = await client.query(query, [
            customer_id, product_type, size || null, width || 0, height || 0,
            amount, due_date, memo || null, status, id
        ]);

        if (result.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: '주문을 찾을 수 없습니다.' });
        }

        client.release();
        res.json(result.rows[0]);
    } catch (error) {
        console.error('주문 수정 오류:', error);
        res.status(500).json({ error: '주문 정보 수정에 실패했습니다.' });
    }
});

// 주문 상태 변경
app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const client = await pool.connect();
        const { id } = req.params;
        const { status, memo } = req.body;

        const validStatuses = ['주문접수', '도면작업', '제작중', '완료'];
        if (!validStatuses.includes(status)) {
            client.release();
            return res.status(400).json({ error: '유효하지 않은 상태입니다.' });
        }

        await client.query('BEGIN');

        // 주문 상태 업데이트
        const updateQuery = 'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *';
        const result = await client.query(updateQuery, [status, id]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(404).json({ error: '주문을 찾을 수 없습니다.' });
        }

        // 상태 히스토리 추가
        const historyQuery = `
            INSERT INTO order_status_history (order_id, status, memo)
            VALUES ($1, $2, $3)
        `;

        await client.query(historyQuery, [id, status, memo || `상태가 '${status}'로 변경되었습니다.`]);

        await client.query('COMMIT');
        client.release();

        res.json(result.rows[0]);
    } catch (error) {
        const client = await pool.connect();
        await client.query('ROLLBACK');
        client.release();

        console.error('주문 상태 변경 오류:', error);
        res.status(500).json({ error: '주문 상태 변경에 실패했습니다.' });
    }
});

// 주문 삭제
app.delete('/api/orders/:id', async (req, res) => {
    try {
        const client = await pool.connect();
        const { id } = req.params;

        const deleteQuery = 'DELETE FROM orders WHERE id = $1 RETURNING *';
        const result = await client.query(deleteQuery, [id]);

        if (result.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: '주문을 찾을 수 없습니다.' });
        }

        client.release();
        res.json({ message: '주문이 삭제되었습니다.' });
    } catch (error) {
        console.error('주문 삭제 오류:', error);
        res.status(500).json({ error: '주문 삭제에 실패했습니다.' });
    }
});

// ===== 파일 업로드 API =====

// 파일 업로드 (도면/사진)
app.post('/api/upload', upload.fields([
    { name: 'drawing', maxCount: 5 },
    { name: 'photo', maxCount: 10 }
]), async (req, res) => {
    try {
        const client = await pool.connect();
        const { order_id } = req.body;

        if (!order_id) {
            client.release();
            return res.status(400).json({ error: '주문 ID가 필요합니다.' });
        }

        // 주문 존재 확인
        const orderCheck = await client.query('SELECT id FROM orders WHERE id = $1', [order_id]);
        if (orderCheck.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: '존재하지 않는 주문입니다.' });
        }

        const uploadedFiles = [];

        // 도면 파일 저장
        if (req.files.drawing) {
            for (const file of req.files.drawing) {
                const query = `
                    INSERT INTO drawings (order_id, filename, original_name, file_path, file_size)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *
                `;

                const result = await client.query(query, [
                    order_id,
                    file.filename,
                    file.originalname,
                    file.path,
                    file.size
                ]);

                uploadedFiles.push({ type: 'drawing', file: result.rows[0] });
            }
        }

        // 사진 파일 저장
        if (req.files.photo) {
            for (const file of req.files.photo) {
                const query = `
                    INSERT INTO photos (order_id, filename, original_name, file_path, file_size)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *
                `;

                const result = await client.query(query, [
                    order_id,
                    file.filename,
                    file.originalname,
                    file.path,
                    file.size
                ]);

                uploadedFiles.push({ type: 'photo', file: result.rows[0] });
            }
        }

        client.release();

        res.json({
            message: '파일이 성공적으로 업로드되었습니다.',
            files: uploadedFiles
        });

    } catch (error) {
        console.error('파일 업로드 오류:', error);
        res.status(500).json({ error: '파일 업로드에 실패했습니다.' });
    }
});

// 파일 다운로드
app.get('/api/files/:type/:id', async (req, res) => {
    try {
        const client = await pool.connect();
        const { type, id } = req.params;

        let query;
        if (type === 'drawing') {
            query = 'SELECT * FROM drawings WHERE id = $1';
        } else if (type === 'photo') {
            query = 'SELECT * FROM photos WHERE id = $1';
        } else {
            client.release();
            return res.status(400).json({ error: '유효하지 않은 파일 타입입니다.' });
        }

        const result = await client.query(query, [id]);

        if (result.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
        }

        const file = result.rows[0];
        client.release();

        // 파일 존재 확인
        if (!fs.existsSync(file.file_path)) {
            return res.status(404).json({ error: '실제 파일이 존재하지 않습니다.' });
        }

        res.download(file.file_path, file.original_name);

    } catch (error) {
        console.error('파일 다운로드 오류:', error);
        res.status(500).json({ error: '파일 다운로드에 실패했습니다.' });
    }
});

// 파일 삭제
app.delete('/api/files/:type/:id', async (req, res) => {
    try {
        const client = await pool.connect();
        const { type, id } = req.params;

        let query;
        if (type === 'drawing') {
            query = 'DELETE FROM drawings WHERE id = $1 RETURNING *';
        } else if (type === 'photo') {
            query = 'DELETE FROM photos WHERE id = $1 RETURNING *';
        } else {
            client.release();
            return res.status(400).json({ error: '유효하지 않은 파일 타입입니다.' });
        }

        const result = await client.query(query, [id]);

        if (result.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
        }

        const file = result.rows[0];
        client.release();

        // 실제 파일 삭제
        try {
            if (fs.existsSync(file.file_path)) {
                fs.removeSync(file.file_path);
            }
        } catch (fileError) {
            console.error('실제 파일 삭제 오류:', fileError);
        }

        res.json({ message: '파일이 삭제되었습니다.' });

    } catch (error) {
        console.error('파일 삭제 오류:', error);
        res.status(500).json({ error: '파일 삭제에 실패했습니다.' });
    }
});

// ===== 에러 핸들링 미들웨어 =====

// 404 에러 처리
app.use((req, res) => {
    if (req.url.startsWith('/api/')) {
        res.status(404).json({ error: 'API 엔드포인트를 찾을 수 없습니다.' });
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// 전역 에러 처리
app.use((error, req, res, next) => {
    console.error('서버 오류:', error);

    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: '파일 크기가 너무 큽니다.' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: '파일 개수가 제한을 초과했습니다.' });
        }
    }

    res.status(500).json({
        error: process.env.NODE_ENV === 'development' ? error.message : '서버 내부 오류가 발생했습니다.'
    });
});

// ===== 서버 시작 =====
async function startServer() {
    try {
        // 데이터베이스 연결 테스트
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();

        app.listen(PORT, () => {
            console.log(`
🚀 간판 제작 관리 시스템 서버가 시작되었습니다!

📍 서버 주소: http://localhost:${PORT}
🗄️  데이터베이스: PostgreSQL (${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME})
📁 업로드 디렉토리: ${uploadsDir}
🔒 보안: Helmet, CORS, Rate Limiting 적용됨
            `);
        });

    } catch (error) {
        console.error('❌ 서버 시작 실패:', error);
        process.exit(1);
    }
}

// 서버 시작
startServer();

// 프로세스 종료 처리
process.on('SIGINT', async () => {
    console.log('\n🔄 서버를 종료하는 중...');
    await pool.end();
    console.log('✅ 데이터베이스 연결이 종료되었습니다.');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🔄 서버를 종료하는 중...');
    await pool.end();
    console.log('✅ 데이터베이스 연결이 종료되었습니다.');
    process.exit(0);
});

module.exports = app;