// 간판 관리 시스템 - API 호출 함수들

// ===== API 클래스 =====
window.API = {

    // ===== 기본 HTTP 요청 함수 =====
    async request(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: window.AppConfig.API_TIMEOUT
        };

        const config = { ...defaultOptions, ...options };

        try {
            Utils.log('API 요청:', config.method, url, config.body ? JSON.parse(config.body) : '');

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.timeout);

            const response = await fetch(window.AppConfig.API_BASE_URL + url, {
                ...config,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            Utils.log('API 응답:', data);

            return data;

        } catch (error) {
            Utils.error('API 오류:', error);

            if (error.name === 'AbortError') {
                throw new Error('요청 시간이 초과되었습니다.');
            }

            if (error.message.includes('fetch')) {
                throw new Error('네트워크 연결을 확인해주세요.');
            }

            throw error;
        }
    },

    // ===== HTTP 메서드별 헬퍼 함수 =====
    async get(url, params = {}) {
        const queryString = Object.keys(params).length > 0
            ? '?' + new URLSearchParams(params).toString()
            : '';

        return this.request(url + queryString);
    },

    async post(url, data) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async put(url, data) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async delete(url) {
        return this.request(url, {
            method: 'DELETE'
        });
    },

    // ===== 파일 업로드 =====
    async uploadFile(url, formData) {
        try {
            const response = await fetch(window.AppConfig.API_BASE_URL + url, {
                method: 'POST',
                body: formData // FormData는 Content-Type을 자동 설정
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            Utils.error('파일 업로드 오류:', error);
            throw error;
        }
    },

    // ===== 대시보드 API =====
    async getDashboard() {
        return this.get('/api/dashboard');
    },

    // ===== 고객 관리 API =====
    async getCustomers(params = {}) {
        return this.get('/api/customers', params);
    },

    async getCustomer(id) {
        return this.get(`/api/customers/${id}`);
    },

    async createCustomer(customerData) {
        return this.post('/api/customers', customerData);
    },

    async updateCustomer(id, customerData) {
        return this.put(`/api/customers/${id}`, customerData);
    },

    async deleteCustomer(id) {
        return this.delete(`/api/customers/${id}`);
    },

    // ===== 주문 관리 API =====
    async getOrders(params = {}) {
        return this.get('/api/orders', params);
    },

    async getOrder(id) {
        return this.get(`/api/orders/${id}`);
    },

    async createOrder(orderData) {
        return this.post('/api/orders', orderData);
    },

    async updateOrder(id, orderData) {
        return this.put(`/api/orders/${id}`, orderData);
    },

    async updateOrderStatus(id, status, memo = '') {
        return this.put(`/api/orders/${id}/status`, { status, memo });
    },

    async deleteOrder(id) {
        return this.delete(`/api/orders/${id}`);
    },

    // ===== 제품 관리 API =====
    async getProducts(params = {}) {
        return this.get('/api/products', params);
    },

    async getProduct(id) {
        return this.get(`/api/products/${id}`);
    },

    async createProduct(productData) {
        return this.post('/api/products', productData);
    },

    async updateProduct(id, productData) {
        return this.put(`/api/products/${id}`, productData);
    },

    async deleteProduct(id) {
        return this.delete(`/api/products/${id}`);
    },

    // ===== 파일 관리 API =====
    async uploadOrderFiles(orderId, files) {
        const formData = new FormData();
        formData.append('order_id', orderId);

        Array.from(files).forEach(file => {
            formData.append('files', file);
        });

        return this.uploadFile('/api/upload', formData);
    },

    async uploadDrawings(orderId, files) {
        const formData = new FormData();
        formData.append('order_id', orderId);

        Array.from(files).forEach(file => {
            formData.append('drawing', file);
        });

        return this.uploadFile('/api/upload', formData);
    },

    async getOrderFiles(orderId) {
        return this.get(`/api/orders/${orderId}/files`);
    },

    async deleteFile(fileId) {
        return this.delete(`/api/files/${fileId}`);
    },

    // ===== 검색 API =====
    async search(query, type = 'all') {
        return this.get('/api/search', { q: query, type });
    },

    // ===== 통계 API =====
    async getStats(period = 'month') {
        return this.get('/api/stats', { period });
    },

    // ===== 헬스 체크 =====
    async healthCheck() {
        return this.get('/api/health');
    },

    // ===== 캐시 관리 =====
    cache: new Map(),

    async getCached(key, fetcher, ttl = 300000) { // 5분 TTL
        const cached = this.cache.get(key);

        if (cached && (Date.now() - cached.timestamp) < ttl) {
            Utils.log('캐시에서 반환:', key);
            return cached.data;
        }

        const data = await fetcher();
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });

        return data;
    },

    clearCache(key = null) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    },

    // ===== 배치 작업 =====
    async batchUpdate(items, updateFn) {
        const results = [];
        const errors = [];

        for (const item of items) {
            try {
                const result = await updateFn(item);
                results.push(result);
            } catch (error) {
                errors.push({ item, error: error.message });
            }
        }

        return { results, errors };
    },

    // ===== 재시도 로직 =====
    async retry(operation, maxAttempts = 3, delay = 1000) {
        let lastError;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                Utils.warn(`API 재시도 ${attempt}/${maxAttempts}:`, error.message);

                if (attempt < maxAttempts) {
                    await Utils.sleep(delay * attempt);
                }
            }
        }

        throw lastError;
    }
};

// ===== 전역 API 래퍼 함수들 =====

// 데이터 로드 함수들
window.loadAllData = async function () {
    try {
        Utils.log('📡 모든 데이터 로딩 시작...');

        const [dashboard, customers, orders, products] = await Promise.all([
            API.getDashboard().catch(e => ({ error: e.message })),
            API.getCustomers().catch(e => []),
            API.getOrders().catch(e => []),
            API.getProducts().catch(e => [])
        ]);

        // 전역 데이터 저장
        window.AppData.dashboard = dashboard.error ? {} : dashboard;
        window.AppData.customers = Array.isArray(customers) ? customers : [];
        window.AppData.orders = Array.isArray(orders) ? orders : [];
        window.AppData.products = Array.isArray(products) ? products : [];

        Utils.log('✅ 모든 데이터 로딩 완료');

        // 데이터 로드 완료 이벤트 발생
        window.dispatchEvent(new CustomEvent('dataLoaded', {
            detail: { dashboard, customers, orders, products }
        }));

    } catch (error) {
        Utils.error('❌ 데이터 로딩 실패:', error);
        UI.showError('데이터를 불러오는 중 오류가 발생했습니다.');
    }
};

window.loadDashboardData = async function () {
    try {
        const data = await API.getDashboard();
        window.AppData.dashboard = data;

        // 대시보드 업데이트 이벤트 발생
        window.dispatchEvent(new CustomEvent('dashboardUpdated', { detail: data }));

        return data;
    } catch (error) {
        Utils.error('대시보드 데이터 로드 실패:', error);
        throw error;
    }
};

window.loadCustomersData = async function () {
    try {
        const data = await API.getCustomers();
        window.AppData.customers = data;

        window.dispatchEvent(new CustomEvent('customersUpdated', { detail: data }));

        return data;
    } catch (error) {
        Utils.error('고객 데이터 로드 실패:', error);
        throw error;
    }
};

window.loadOrdersData = async function () {
    try {
        const data = await API.getOrders();
        window.AppData.orders = data;

        window.dispatchEvent(new CustomEvent('ordersUpdated', { detail: data }));

        return data;
    } catch (error) {
        Utils.error('주문 데이터 로드 실패:', error);
        throw error;
    }
};

window.loadProductsData = async function () {
    try {
        const data = await API.getProducts();
        window.AppData.products = data;

        window.dispatchEvent(new CustomEvent('productsUpdated', { detail: data }));

        return data;
    } catch (error) {
        Utils.error('제품 데이터 로드 실패:', error);
        throw error;
    }
};

// 편의 함수들
window.refreshData = function (type = 'all') {
    API.clearCache();

    switch (type) {
        case 'dashboard':
            return loadDashboardData();
        case 'customers':
            return loadCustomersData();
        case 'orders':
            return loadOrdersData();
        case 'products':
            return loadProductsData();
        default:
            return loadAllData();
    }
};

console.log('🌐 API 함수 로드 완료');