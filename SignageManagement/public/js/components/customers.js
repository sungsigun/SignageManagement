// 고객 관리 컴포넌트

window.Customers = {

    currentData: [],
    filteredData: [],

    // 초기화
    init: function () {
        this.render();
        this.loadData();
        this.setupEventListeners();
        Utils.log('👥 고객 관리 초기화 완료');
    },

    // 고객 관리 화면 렌더링
    render: function () {
        const container = Utils.getElement('#content-customers');
        if (!container) return;

        container.innerHTML = `
            <div class="p-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900">고객 관리</h2>
                        <p class="text-gray-600">고객 정보를 관리하세요</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="btn btn-outline btn-sm" onclick="Customers.exportCustomers()">
                            <i class="fas fa-download mr-1"></i>내보내기
                        </button>
                        <button id="new-customer-btn" class="btn btn-primary">
                            <i class="fas fa-plus mr-2"></i>새 고객 등록
                        </button>
                    </div>
                </div>

                <!-- 검색 및 필터 -->
                <div class="card mb-6">
                    <div class="card-body">
                        <div class="flex flex-col sm:flex-row gap-4">
                            <div class="flex-1">
                                <div class="search-bar">
                                    <input type="text" id="customer-search" 
                                           class="search-input" 
                                           placeholder="고객명, 전화번호, 주소로 검색...">
                                    <i class="search-icon fas fa-search"></i>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button class="btn btn-outline btn-sm" onclick="Customers.clearFilters()">
                                    <i class="fas fa-times mr-1"></i>초기화
                                </button>
                                <button class="btn btn-outline btn-sm" onclick="Customers.refresh()">
                                    <i class="fas fa-refresh mr-1"></i>새로고침
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 고객 통계 -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div class="stat-card">
                        <div class="flex items-center">
                            <div class="stat-icon blue">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="ml-3">
                                <p class="stat-label">전체 고객</p>
                                <p class="stat-value text-xl" id="customers-total">0</p>
                            </div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="flex items-center">
                            <div class="stat-icon green">
                                <i class="fas fa-star"></i>
                            </div>
                            <div class="ml-3">
                                <p class="stat-label">이번 달 신규</p>
                                <p class="stat-value text-xl" id="customers-new">0</p>
                            </div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="flex items-center">
                            <div class="stat-icon purple">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div class="ml-3">
                                <p class="stat-label">활성 고객</p>
                                <p class="stat-value text-xl" id="customers-active">0</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 고객 목록 -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="text-lg font-medium text-gray-900">고객 목록</h3>
                        <div class="text-sm text-gray-500">
                            총 <span id="customers-count">0</span>명
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <div id="customers-table-container">
                            <div class="flex items-center justify-center py-12">
                                <div class="spinner mr-2"></div>
                                <span class="text-gray-500">고객 데이터를 불러오는 중...</span>
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
            UI.showLoading('#customers-table-container');

            const customers = await API.getCustomers();
            this.currentData = customers;
            this.filteredData = [...customers];

            this.updateStats();
            this.renderTable();

        } catch (error) {
            Utils.error('고객 데이터 로드 실패:', error);
            UI.showError('고객 데이터를 불러오는데 실패했습니다.');
            this.renderEmptyTable();
        } finally {
            UI.hideLoading('#customers-table-container');
        }
    },

    // 통계 업데이트
    updateStats: function () {
        const total = this.currentData.length;

        // 이번 달 신규 고객
        const thisMonth = new Date();
        const thisMonthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
        const newCustomers = this.currentData.filter(customer =>
            new Date(customer.created_at) >= thisMonthStart
        ).length;

        // 활성 고객 (최근 3개월 이내 주문이 있는 고객)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const activeCustomers = this.currentData.filter(customer => {
            // 주문 데이터와 연결해서 계산 (실제로는 API에서 가져와야 함)
            return Math.random() > 0.3; // 임시 계산
        }).length;

        // 화면 업데이트
        const stats = {
            'customers-total': total,
            'customers-new': newCustomers,
            'customers-active': activeCustomers,
            'customers-count': this.filteredData.length
        };

        Object.entries(stats).forEach(([id, value]) => {
            const element = Utils.getElement(`#${id}`);
            if (element) {
                element.textContent = Utils.formatNumber(value);
            }
        });
    },

    // 테이블 렌더링
    renderTable: function () {
        const container = Utils.getElement('#customers-table-container');
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
                            <th class="cursor-pointer hover:bg-gray-100" onclick="Customers.sortBy('name')">
                                고객명 <i class="fas fa-sort ml-1 text-gray-400"></i>
                            </th>
                            <th class="cursor-pointer hover:bg-gray-100" onclick="Customers.sortBy('phone')">
                                연락처 <i class="fas fa-sort ml-1 text-gray-400"></i>
                            </th>
                            <th>주소</th>
                            <th>메모</th>
                            <th class="cursor-pointer hover:bg-gray-100" onclick="Customers.sortBy('created_at')">
                                등록일 <i class="fas fa-sort ml-1 text-gray-400"></i>
                            </th>
                            <th class="text-center">작업</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.filteredData.map(customer => this.renderCustomerRow(customer)).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tableHtml;
    },

    // 고객 행 렌더링
    renderCustomerRow: function (customer) {
        return `
            <tr class="cursor-pointer hover:bg-gray-50" onclick="Customers.viewCustomer(${customer.id})">
                <td>
                    <div class="font-medium text-gray-900">${customer.name}</div>
                </td>
                <td>
                    <div class="text-gray-900">${customer.phone}</div>
                </td>
                <td>
                    <div class="text-gray-700 max-w-xs truncate" title="${customer.address || ''}">
                        ${customer.address || '-'}
                    </div>
                </td>
                <td>
                    <div class="text-gray-600 max-w-xs truncate" title="${customer.memo || ''}">
                        ${customer.memo || '-'}
                    </div>
                </td>
                <td class="text-gray-500">
                    ${Utils.formatDate(customer.created_at)}
                </td>
                <td class="text-center" onclick="event.stopPropagation()">
                    <div class="action-buttons">
                        <button class="action-btn action-btn-view" 
                                onclick="Customers.viewCustomer(${customer.id})" 
                                title="상세보기">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn action-btn-edit" 
                                onclick="Customers.editCustomer(${customer.id})" 
                                title="수정">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn action-btn-delete" 
                                onclick="Customers.deleteCustomer(${customer.id}, '${customer.name.replace(/'/g, "\\'")}')" 
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
        const container = Utils.getElement('#customers-table-container');
        if (!container) return;

        const isEmpty = this.currentData.length === 0;
        const message = isEmpty ? '등록된 고객이 없습니다' : '검색 결과가 없습니다';
        const description = isEmpty ? '새 고객을 등록해보세요' : '다른 검색어를 시도해보세요';

        container.innerHTML = `
            <div class="empty-state">
                <i class="empty-state-icon fas fa-users"></i>
                <div class="empty-state-title">${message}</div>
                <div class="empty-state-description">${description}</div>
                ${isEmpty ? `
                    <button class="btn btn-primary mt-4" onclick="Customers.openCreateModal()">
                        <i class="fas fa-plus mr-2"></i>첫 고객 등록하기
                    </button>
                ` : ''}
            </div>
        `;
    },

    // 검색 및 필터링
    search: function (searchTerm) {
        if (!searchTerm.trim()) {
            this.filteredData = [...this.currentData];
        } else {
            this.filteredData = this.currentData.filter(customer => {
                const term = searchTerm.toLowerCase();
                return (
                    customer.name.toLowerCase().includes(term) ||
                    customer.phone.includes(term) ||
                    (customer.address && customer.address.toLowerCase().includes(term)) ||
                    (customer.memo && customer.memo.toLowerCase().includes(term))
                );
            });
        }

        this.updateStats();
        this.renderTable();
    },

    // 정렬
    sortBy: function (key, order = null) {
        const currentOrder = this._sortOrder === 'asc' ? 'desc' : 'asc';
        this._sortOrder = order || currentOrder;
        this._sortKey = key;

        this.filteredData = Utils.sortBy(this.filteredData, key, this._sortOrder);
        this.renderTable();

        // 정렬 아이콘 업데이트
        const headers = Utils.getElements('th i.fa-sort, th i.fa-sort-up, th i.fa-sort-down');
        headers.forEach(icon => {
            icon.className = 'fas fa-sort ml-1 text-gray-400';
        });

        const currentHeader = Utils.getElement(`th:contains('${key}') i`);
        if (currentHeader) {
            currentHeader.className = `fas fa-sort-${this._sortOrder === 'asc' ? 'up' : 'down'} ml-1 text-gray-600`;
        }
    },

    // 필터 초기화
    clearFilters: function () {
        const searchInput = Utils.getElement('#customer-search');
        if (searchInput) searchInput.value = '';

        this.filteredData = [...this.currentData];
        this.updateStats();
        this.renderTable();
    },

    // 새로고침
    refresh: async function () {
        await this.loadData();
        UI.showSuccess('고객 목록이 새로고침되었습니다.');
    },

    // 고객 상세보기
    viewCustomer: function (customerId) {
        const customer = this.currentData.find(c => c.id === customerId);
        if (!customer) return;

        if (window.CustomerModal) {
            window.CustomerModal.show(customer, 'view');
        }
    },

    // 고객 생성 모달
    openCreateModal: function () {
        if (window.CustomerModal) {
            window.CustomerModal.show(null, 'create');
        }
    },

    // 고객 수정
    editCustomer: function (customerId) {
        const customer = this.currentData.find(c => c.id === customerId);
        if (!customer) return;

        if (window.CustomerModal) {
            window.CustomerModal.show(customer, 'edit');
        }
    },

    // 고객 삭제
    deleteCustomer: async function (customerId, customerName) {
        const confirmed = await UI.confirm(
            `정말로 "${customerName}" 고객을 삭제하시겠습니까?<br><br>
            <span class="text-red-600 text-sm">⚠️ 해당 고객의 모든 주문도 함께 삭제됩니다.</span>`,
            '고객 삭제'
        );

        if (!confirmed) return;

        try {
            const result = await API.deleteCustomer(customerId);

            let message = `"${customerName}" 고객이 삭제되었습니다.`;
            if (result.deletedOrderCount > 0) {
                message += ` (주문 ${result.deletedOrderCount}건도 함께 삭제됨)`;
            }

            UI.showSuccess(message);
            await this.loadData();

            // 다른 컴포넌트에 데이터 변경 알림
            window.dispatchEvent(new CustomEvent('customerDeleted', {
                detail: { customerId, orderCount: result.deletedOrderCount }
            }));

        } catch (error) {
            Utils.error('고객 삭제 실패:', error);
            UI.showError('고객 삭제에 실패했습니다: ' + error.message);
        }
    },

    // 고객 생성/수정 완료 콜백
    onCustomerSaved: async function (customer, isNew) {
        await this.loadData();

        const message = isNew ? '새 고객이 등록되었습니다.' : '고객 정보가 수정되었습니다.';
        UI.showSuccess(message);

        // 다른 컴포넌트에 데이터 변경 알림
        const eventName = isNew ? 'customerCreated' : 'customerUpdated';
        window.dispatchEvent(new CustomEvent(eventName, { detail: customer }));
    },

    // CSV 내보내기
    exportCustomers: function () {
        if (this.filteredData.length === 0) {
            UI.showWarning('내보낼 고객 데이터가 없습니다.');
            return;
        }

        const csvContent = this.generateCustomersCSV();
        const filename = `customers_${Utils.formatDate(new Date(), 'YYYY-MM-DD')}.csv`;
        this.downloadCSV(csvContent, filename);

        UI.showSuccess('고객 데이터가 내보내기되었습니다.');
    },

    generateCustomersCSV: function () {
        let csv = '고객명,전화번호,주소,메모,등록일\n';

        this.filteredData.forEach(customer => {
            const row = [
                customer.name,
                customer.phone,
                customer.address || '',
                customer.memo || '',
                Utils.formatDate(customer.created_at)
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
        // 새 고객 등록 버튼
        const newCustomerBtn = Utils.getElement('#new-customer-btn');
        if (newCustomerBtn) {
            newCustomerBtn.addEventListener('click', () => this.openCreateModal());
        }

        // 검색 입력
        const searchInput = Utils.getElement('#customer-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.search(e.target.value);
            }, 300));
        }

        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            if (window.AppState.currentTab !== 'customers') return;

            // Ctrl+N: 새 고객
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
window.addEventListener('customersUpdated', (event) => {
    if (window.AppState.currentTab === 'customers' && window.Customers) {
        window.Customers.currentData = event.detail;
        window.Customers.filteredData = [...event.detail];
        window.Customers.updateStats();
        window.Customers.renderTable();
    }
});

console.log('👥 고객 관리 컴포넌트 로드 완료');