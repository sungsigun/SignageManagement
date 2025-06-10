// 주문 관리 컴포넌트

window.Orders = {

    currentData: [],
    filteredData: [],
    currentFilter: {
        status: '',
        customer: '',
        dateRange: ''
    },

    // 초기화
    init: function () {
        this.render();
        this.loadData();
        this.setupEventListeners();
        Utils.log('📋 주문 관리 초기화 완료');
    },

    // 주문 관리 화면 렌더링
    render: function () {
        const container = Utils.getElement('#content-orders');
        if (!container) return;

        container.innerHTML = `
            <div class="p-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900">주문 관리</h2>
                        <p class="text-gray-600">주문 현황을 관리하고 진행 상황을 추적하세요</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="btn btn-outline btn-sm" onclick="Orders.exportOrders()">
                            <i class="fas fa-download mr-1"></i>내보내기
                        </button>
                        <button id="new-order-btn-orders" class="btn btn-primary">
                            <i class="fas fa-plus mr-2"></i>새 주문 등록
                        </button>
                    </div>
                </div>

                <!-- 주문 통계 카드 -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div class="stat-card">
                        <div class="flex items-center">
                            <div class="stat-icon blue">
                                <i class="fas fa-clipboard-list"></i>
                            </div>
                            <div class="ml-3">
                                <p class="stat-label">전체 주문</p>
                                <p class="stat-value text-xl" id="orders-total">0</p>
                            </div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="flex items-center">
                            <div class="stat-icon yellow">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="ml-3">
                                <p class="stat-label">진행중</p>
                                <p class="stat-value text-xl" id="orders-pending">0</p>
                            </div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="flex items-center">
                            <div class="stat-icon green">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="ml-3">
                                <p class="stat-label">완료</p>
                                <p class="stat-value text-xl" id="orders-completed">0</p>
                            </div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="flex items-center">
                            <div class="stat-icon purple">
                                <i class="fas fa-won-sign"></i>
                            </div>
                            <div class="ml-3">
                                <p class="stat-label">이번 달 매출</p>
                                <p class="stat-value text-lg" id="orders-revenue">₩0</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 필터 및 검색 -->
                <div class="card mb-6">
                    <div class="card-body">
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label class="form-label">상태</label>
                                <select id="status-filter" class="form-input">
                                    <option value="">전체 상태</option>
                                    <option value="주문접수">주문접수</option>
                                    <option value="도면작업">도면작업</option>
                                    <option value="제작중">제작중</option>
                                    <option value="완료">완료</option>
                                </select>
                            </div>
                            <div>
                                <label class="form-label">고객</label>
                                <input type="text" id="customer-filter" class="form-input" placeholder="고객명 또는 전화번호">
                            </div>
                            <div>
                                <label class="form-label">납기일</label>
                                <select id="due-date-filter" class="form-input">
                                    <option value="">전체 기간</option>
                                    <option value="overdue">납기 지연</option>
                                    <option value="today">오늘</option>
                                    <option value="week">이번 주</option>
                                    <option value="month">이번 달</option>
                                </select>
                            </div>
                            <div class="flex items-end gap-2">
                                <button class="btn btn-outline btn-sm flex-1" onclick="Orders.clearFilters()">
                                    <i class="fas fa-times mr-1"></i>초기화
                                </button>
                                <button class="btn btn-outline btn-sm flex-1" onclick="Orders.refresh()">
                                    <i class="fas fa-refresh mr-1"></i>새로고침
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 주문 목록 테이블 -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="text-lg font-medium text-gray-900">주문 목록</h3>
                        <div class="text-sm text-gray-500">
                            총 <span id="filtered-orders-count">0</span>건
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <div id="orders-table-container">
                            <div class="flex items-center justify-center py-12">
                                <div class="spinner mr-2"></div>
                                <span class="text-gray-500">주문 데이터를 불러오는 중...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // 데이터 로드
    loadData: async function () {
        try {
            UI.showLoading('#orders-table-container');

            const orders = await API.getOrders();
            this.currentData = orders;
            this.applyFilters();

            this.updateStats();
            this.renderTable();

        } catch (error) {
            Utils.error('주문 데이터 로드 실패:', error);
            UI.showError('주문 데이터를 불러오는데 실패했습니다.');
            this.renderEmptyTable();
        } finally {
            UI.hideLoading('#orders-table-container');
        }
    },

    // 통계 업데이트
    updateStats: function () {
        const total = this.currentData.length;
        const pending = this.currentData.filter(o =>
            ['주문접수', '도면작업', '제작중'].includes(o.status)
        ).length;
        const completed = this.currentData.filter(o => o.status === '완료').length;

        // 이번 달 매출
        const thisMonth = new Date();
        const thisMonthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
        const thisMonthRevenue = this.currentData
            .filter(o => o.status === '완료' && new Date(o.created_at) >= thisMonthStart)
            .reduce((sum, o) => sum + (o.amount || 0), 0);

        const stats = {
            'orders-total': total,
            'orders-pending': pending,
            'orders-completed': completed,
            'orders-revenue': Utils.formatCurrency(thisMonthRevenue),
            'filtered-orders-count': this.filteredData.length
        };

        Object.entries(stats).forEach(([id, value]) => {
            const element = Utils.getElement(`#${id}`);
            if (element) {
                element.textContent = value;
            }
        });
    },

    // 필터 적용
    applyFilters: function () {
        let filtered = [...this.currentData];

        // 상태 필터
        if (this.currentFilter.status) {
            filtered = filtered.filter(order => order.status === this.currentFilter.status);
        }

        // 고객 필터
        if (this.currentFilter.customer) {
            const term = this.currentFilter.customer.toLowerCase();
            filtered = filtered.filter(order =>
                (order.customer_name && order.customer_name.toLowerCase().includes(term)) ||
                (order.customer_phone && order.customer_phone.includes(term))
            );
        }

        // 날짜 필터
        if (this.currentFilter.dateRange) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            switch (this.currentFilter.dateRange) {
                case 'overdue':
                    filtered = filtered.filter(order => {
                        const dueDate = new Date(order.due_date);
                        return dueDate < today && order.status !== '완료';
                    });
                    break;
                case 'today':
                    filtered = filtered.filter(order => {
                        const dueDate = new Date(order.due_date);
                        dueDate.setHours(0, 0, 0, 0);
                        return dueDate.getTime() === today.getTime();
                    });
                    break;
                case 'week':
                    const weekEnd = new Date(today);
                    weekEnd.setDate(today.getDate() + 7);
                    filtered = filtered.filter(order => {
                        const dueDate = new Date(order.due_date);
                        return dueDate >= today && dueDate <= weekEnd;
                    });
                    break;
                case 'month':
                    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    filtered = filtered.filter(order => {
                        const dueDate = new Date(order.due_date);
                        return dueDate >= today && dueDate <= monthEnd;
                    });
                    break;
            }
        }

        this.filteredData = filtered;
    },

    // 테이블 렌더링
    renderTable: function () {
        const container = Utils.getElement('#orders-table-container');
        if (!container) return;

        if (this.filteredData.length === 0) {
            this.renderEmptyTable();
            return;
        }

        const tableHtml = `
            <div class="overflow-x-auto">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th class="cursor-pointer hover:bg-gray-100" onclick="Orders.sortBy('id')">
                                주문번호 <i class="fas fa-sort ml-1 text-gray-400"></i>
                            </th>
                            <th>고객정보</th>
                            <th>제품정보</th>
                            <th class="cursor-pointer hover:bg-gray-100" onclick="Orders.sortBy('amount')">
                                금액 <i class="fas fa-sort ml-1 text-gray-400"></i>
                            </th>
                            <th>상태</th>
                            <th class="cursor-pointer hover:bg-gray-100" onclick="Orders.sortBy('due_date')">
                                납기일 <i class="fas fa-sort ml-1 text-gray-400"></i>
                            </th>
                            <th class="cursor-pointer hover:bg-gray-100" onclick="Orders.sortBy('created_at')">
                                등록일 <i class="fas fa-sort ml-1 text-gray-400"></i>
                            </th>
                            <th class="text-center">작업</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.filteredData.map(order => this.renderOrderRow(order)).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tableHtml;
    },

    // 주문 행 렌더링
    renderOrderRow: function (order) {
        const dueDate = new Date(order.due_date);
        const today = new Date();
        const isOverdue = dueDate < today && order.status !== '완료';

        return `
            <tr class="cursor-pointer hover:bg-gray-50" onclick="Orders.viewOrder(${order.id})">
                <td>
                    <div class="font-medium text-blue-600">#${order.id}</div>
                </td>
                <td>
                    <div class="font-medium text-gray-900">${order.customer_name || '알 수 없음'}</div>
                    <div class="text-sm text-gray-500">${order.customer_phone || ''}</div>
                </td>
                <td>
                    <div class="font-medium">${order.product_type}</div>
                    <div class="text-sm text-gray-500">${order.size || ''}</div>
                </td>
                <td class="font-medium">${Utils.formatCurrency(order.amount)}</td>
                <td onclick="event.stopPropagation()">
                    <select class="status-badge ${Utils.getStatusClass(order.status)} border-none text-xs font-medium rounded-full px-2 py-1"
                            onchange="Orders.changeStatus(${order.id}, this.value)">
                        <option value="주문접수" ${order.status === '주문접수' ? 'selected' : ''}>주문접수</option>
                        <option value="도면작업" ${order.status === '도면작업' ? 'selected' : ''}>도면작업</option>
                        <option value="제작중" ${order.status === '제작중' ? 'selected' : ''}>제작중</option>
                        <option value="완료" ${order.status === '완료' ? 'selected' : ''}>완료</option>
                    </select>
                </td>
                <td class="${isOverdue ? 'text-red-600 font-medium' : ''}">
                    ${Utils.formatDate(order.due_date)}
                    ${isOverdue ? '<i class="fas fa-exclamation-triangle ml-1" title="납기 지연"></i>' : ''}
                </td>
                <td class="text-gray-500">
                    ${Utils.formatDate(order.created_at)}
                </td>
                <td class="text-center" onclick="event.stopPropagation()">
                    <div class="action-buttons">
                        <button class="action-btn action-btn-view" 
                                onclick="Orders.viewOrder(${order.id})" 
                                title="상세보기">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn action-btn-edit" 
                                onclick="Orders.editOrder(${order.id})" 
                                title="수정">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn action-btn-delete" 
                                onclick="Orders.deleteOrder(${order.id}, '${order.customer_name}', '${order.product_type}')" 
                                title="삭제">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    },

    // 빈 테이블 렌더링
    renderEmptyTable: function () {
        const container = Utils.getElement('#orders-table-container');
        if (!container) return;

        const isEmpty = this.currentData.length === 0;
        const hasFilters = Object.values(this.currentFilter).some(v => v);

        let message, description, actionButton = '';

        if (isEmpty) {
            message = '등록된 주문이 없습니다';
            description = '새 주문을 등록해보세요';
            actionButton = `
                <button class="btn btn-primary mt-4" onclick="Orders.openCreateModal()">
                    <i class="fas fa-plus mr-2"></i>첫 주문 등록하기
                </button>
            `;
        } else if (hasFilters) {
            message = '검색 조건에 맞는 주문이 없습니다';
            description = '다른 조건을 시도하거나 필터를 초기화해보세요';
            actionButton = `
                <button class="btn btn-outline mt-4" onclick="Orders.clearFilters()">
                    <i class="fas fa-times mr-2"></i>필터 초기화
                </button>
            `;
        } else {
            message = '주문을 불러올 수 없습니다';
            description = '새로고침을 시도해보세요';
        }

        container.innerHTML = `
            <div class="empty-state">
                <i class="empty-state-icon fas fa-clipboard-list"></i>
                <div class="empty-state-title">${message}</div>
                <div class="empty-state-description">${description}</div>
                ${actionButton}
            </div>
        `;
    },

    // 정렬
    sortBy: function (key, order = null) {
        const currentOrder = this._sortOrder === 'asc' ? 'desc' : 'asc';
        this._sortOrder = order || currentOrder;
        this._sortKey = key;

        this.filteredData = Utils.sortBy(this.filteredData, key, this._sortOrder);
        this.renderTable();
    },

    // 상태별 필터링 (외부에서 호출)
    filterByStatus: function (status) {
        const statusFilter = Utils.getElement('#status-filter');
        if (statusFilter) {
            statusFilter.value = status;
            this.currentFilter.status = status;
            this.applyFilters();
            this.updateStats();
            this.renderTable();
        }
    },

    // 필터 초기화
    clearFilters: function () {
        this.currentFilter = { status: '', customer: '', dateRange: '' };

        // UI 초기화
        const statusFilter = Utils.getElement('#status-filter');
        const customerFilter = Utils.getElement('#customer-filter');
        const dueDateFilter = Utils.getElement('#due-date-filter');

        if (statusFilter) statusFilter.value = '';
        if (customerFilter) customerFilter.value = '';
        if (dueDateFilter) dueDateFilter.value = '';

        this.applyFilters();
        this.updateStats();
        this.renderTable();
    },

    // 새로고침
    refresh: async function () {
        await this.loadData();
        UI.showSuccess('주문 목록이 새로고침되었습니다.');
    },

    // 주문 상세보기
    viewOrder: function (orderId) {
        const order = this.currentData.find(o => o.id === orderId);
        if (!order) return;

        this.showDetail(order);
    },

    // 주문 상세 모달 표시
    showDetail: function (order) {
        const modalId = UI.showModal({
            title: `주문 상세 정보 - #${order.id}`,
            body: this.renderOrderDetail(order),
            footer: `
                <button class="btn btn-outline mr-2" onclick="UI.closeModal('${modalId}')">닫기</button>
                <button class="btn btn-primary" onclick="Orders.editOrder(${order.id}); UI.closeModal('${modalId}')">수정</button>
            `,
            size: 'lg'
        });
    },

    renderOrderDetail: function (order) {
        const isOverdue = Utils.isDatePast(order.due_date) && order.status !== '완료';

        return `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 class="font-semibold text-gray-900 mb-3">고객 정보</h4>
                    <div class="space-y-2">
                        <div><span class="text-gray-500">고객명:</span> <span class="font-medium">${order.customer_name || '알 수 없음'}</span></div>
                        <div><span class="text-gray-500">연락처:</span> <span>${order.customer_phone || '-'}</span></div>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-semibold text-gray-900 mb-3">주문 정보</h4>
                    <div class="space-y-2">
                        <div><span class="text-gray-500">제품:</span> <span class="font-medium">${order.product_type}</span></div>
                        <div><span class="text-gray-500">크기:</span> <span>${order.size || '-'}</span></div>
                        <div><span class="text-gray-500">금액:</span> <span class="font-medium text-lg">${Utils.formatCurrency(order.amount)}</span></div>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-semibold text-gray-900 mb-3">진행 상황</h4>
                    <div class="space-y-2">
                        <div><span class="text-gray-500">상태:</span> <span class="status-badge ${Utils.getStatusClass(order.status)}">${order.status}</span></div>
                        <div class="${isOverdue ? 'text-red-600' : ''}">
                            <span class="text-gray-500">납기일:</span> 
                            <span class="font-medium">${Utils.formatDate(order.due_date)}</span>
                            ${isOverdue ? ' <i class="fas fa-exclamation-triangle ml-1" title="납기 지연"></i>' : ''}
                        </div>
                        <div><span class="text-gray-500">등록일:</span> <span>${Utils.formatDate(order.created_at)}</span></div>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-semibold text-gray-900 mb-3">메모</h4>
                    <div class="bg-gray-50 p-3 rounded">
                        ${order.memo || '메모가 없습니다.'}
                    </div>
                </div>
            </div>
        `;
    },

    // 주문 생성 모달
    openCreateModal: function () {
        if (window.OrderModal) {
            window.OrderModal.show(null, 'create');
        }
    },

    // 주문 수정
    editOrder: function (orderId) {
        const order = this.currentData.find(o => o.id === orderId);
        if (!order) return;

        if (window.OrderModal) {
            window.OrderModal.show(order, 'edit');
        }
    },

    // 주문 상태 변경
    changeStatus: async function (orderId, newStatus) {
        try {
            await API.updateOrderStatus(orderId, newStatus);
            UI.showSuccess(`주문 상태가 "${newStatus}"로 변경되었습니다.`);

            await this.loadData();

            // 다른 컴포넌트에 알림
            window.dispatchEvent(new CustomEvent('orderStatusChanged', {
                detail: { orderId, status: newStatus }
            }));

        } catch (error) {
            Utils.error('주문 상태 변경 실패:', error);
            UI.showError('상태 변경에 실패했습니다: ' + error.message);
            await this.loadData(); // 실패 시 원래 상태로 복원
        }
    },

    // 주문 삭제
    deleteOrder: async function (orderId, customerName, productType) {
        const confirmed = await UI.confirm(
            `정말로 다음 주문을 삭제하시겠습니까?<br><br>
            <strong>고객:</strong> ${customerName}<br>
            <strong>제품:</strong> ${productType}<br>
            <strong>주문번호:</strong> #${orderId}`,
            '주문 삭제'
        );

        if (!confirmed) return;

        try {
            await API.deleteOrder(orderId);
            UI.showSuccess('주문이 성공적으로 삭제되었습니다.');

            await this.loadData();

            // 다른 컴포넌트에 알림
            window.dispatchEvent(new CustomEvent('orderDeleted', {
                detail: { orderId }
            }));

        } catch (error) {
            Utils.error('주문 삭제 실패:', error);
            UI.showError('주문 삭제에 실패했습니다: ' + error.message);
        }
    },

    // 주문 생성/수정 완료 콜백
    onOrderSaved: async function (order, isNew) {
        await this.loadData();

        const message = isNew ? '새 주문이 등록되었습니다.' : '주문 정보가 수정되었습니다.';
        UI.showSuccess(message);

        // 다른 컴포넌트에 알림
        const eventName = isNew ? 'orderCreated' : 'orderUpdated';
        window.dispatchEvent(new CustomEvent(eventName, { detail: order }));
    },

    // CSV 내보내기
    exportOrders: function () {
        if (this.filteredData.length === 0) {
            UI.showWarning('내보낼 주문 데이터가 없습니다.');
            return;
        }

        const csvContent = this.generateOrdersCSV();
        const filename = `orders_${Utils.formatDate(new Date(), 'YYYY-MM-DD')}.csv`;
        this.downloadCSV(csvContent, filename);

        UI.showSuccess('주문 데이터가 내보내기되었습니다.');
    },

    generateOrdersCSV: function () {
        let csv = '주문번호,고객명,전화번호,제품,크기,금액,상태,납기일,등록일,메모\n';

        this.filteredData.forEach(order => {
            const row = [
                order.id,
                order.customer_name || '',
                order.customer_phone || '',
                order.product_type,
                order.size || '',
                order.amount,
                order.status,
                Utils.formatDate(order.due_date),
                Utils.formatDate(order.created_at),
                order.memo || ''
            ].map(field => `"${field.toString().replace(/"/g, '""')}"`);

            csv += row.join(',') + '\n';
        });

        return csv;
    },

    downloadCSV: function (content, filename) {
        const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    },

    // 이벤트 리스너 설정
    setupEventListeners: function () {
        // 새 주문 등록 버튼
        const newOrderBtn = Utils.getElement('#new-order-btn-orders');
        if (newOrderBtn) {
            newOrderBtn.addEventListener('click', () => this.openCreateModal());
        }

        // 필터 변경 이벤트
        const statusFilter = Utils.getElement('#status-filter');
        const customerFilter = Utils.getElement('#customer-filter');
        const dueDateFilter = Utils.getElement('#due-date-filter');

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentFilter.status = e.target.value;
                this.applyFilters();
                this.updateStats();
                this.renderTable();
            });
        }

        if (customerFilter) {
            customerFilter.addEventListener('input', Utils.debounce((e) => {
                this.currentFilter.customer = e.target.value;
                this.applyFilters();
                this.updateStats();
                this.renderTable();
            }, 300));
        }

        if (dueDateFilter) {
            dueDateFilter.addEventListener('change', (e) => {
                this.currentFilter.dateRange = e.target.value;
                this.applyFilters();
                this.updateStats();
                this.renderTable();
            });
        }

        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            if (window.AppState.currentTab !== 'orders') return;

            // Ctrl+N: 새 주문
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.openCreateModal();
            }

            // F5: 새로고침
            if (e.key === 'F5') {
                e.preventDefault();
                this.refresh();
            }
        });
    }
};

// 외부 이벤트 리스너
window.addEventListener('ordersUpdated', (event) => {
    if (window.AppState.currentTab === 'orders' && window.Orders) {
        window.Orders.currentData = event.detail;
        window.Orders.applyFilters();
        window.Orders.updateStats();
        window.Orders.renderTable();
    }
});

