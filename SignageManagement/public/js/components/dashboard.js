// 대시보드 컴포넌트

window.Dashboard = {

    // 초기화
    init: function () {
        this.render();
        this.loadData();
        this.setupEventListeners();
        Utils.log('📊 대시보드 초기화 완료');
    },

    // 대시보드 렌더링
    render: function () {
        const container = Utils.getElement('#content-dashboard');
        if (!container) return;

        container.innerHTML = `
            <div class="p-6">
                <div class="mb-6">
                    <h2 class="text-2xl font-bold text-gray-900">대시보드</h2>
                    <p class="text-gray-600">간판 제작 현황을 한눈에 확인하세요</p>
                </div>

                <!-- 통계 카드들 -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="stat-card">
                        <div class="flex items-center">
                            <div class="stat-icon blue">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="ml-4">
                                <p class="stat-label">총 고객수</p>
                                <p class="stat-value" id="total-customers">0</p>
                            </div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="flex items-center">
                            <div class="stat-icon green">
                                <i class="fas fa-clipboard-list"></i>
                            </div>
                            <div class="ml-4">
                                <p class="stat-label">총 주문수</p>
                                <p class="stat-value" id="total-orders">0</p>
                            </div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="flex items-center">
                            <div class="stat-icon yellow">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="ml-4">
                                <p class="stat-label">진행중 주문</p>
                                <p class="stat-value" id="pending-orders">0</p>
                            </div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="flex items-center">
                            <div class="stat-icon purple">
                                <i class="fas fa-won-sign"></i>
                            </div>
                            <div class="ml-4">
                                <p class="stat-label">총 매출</p>
                                <p class="stat-value" id="total-revenue">₩0</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 차트 섹션 -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div class="chart-wrapper">
                        <h3 class="chart-title">
                            <i class="fas fa-chart-pie"></i>주문 상태 분포
                        </h3>
                        <div class="chart-container">
                            <canvas id="statusChart"></canvas>
                        </div>
                    </div>
                    
                    <div class="chart-wrapper">
                        <h3 class="chart-title">
                            <i class="fas fa-chart-line"></i>월별 매출 현황
                        </h3>
                        <div class="chart-container">
                            <canvas id="revenueChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- 최근 주문 테이블 -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="text-lg font-medium text-gray-900">최근 주문</h3>
                        <button class="btn btn-outline btn-sm" onclick="UI.showTab('orders')">
                            전체 보기 <i class="fas fa-arrow-right ml-1"></i>
                        </button>
                    </div>
                    <div class="card-body p-0">
                        <div id="recent-orders-container">
                            <div class="flex items-center justify-center py-8">
                                <div class="spinner mr-2"></div>
                                <span class="text-gray-500">데이터를 불러오는 중...</span>
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
            UI.showLoading('#content-dashboard');

            const data = await API.getDashboard();

            this.updateStats(data);
            this.updateCharts(data);
            this.updateRecentOrders(data.recentOrders || []);

        } catch (error) {
            Utils.error('대시보드 데이터 로드 실패:', error);
            UI.showError('대시보드 데이터를 불러오는데 실패했습니다.');
        } finally {
            UI.hideLoading('#content-dashboard');
        }
    },

    // 통계 업데이트
    updateStats: function (data) {
        const stats = {
            'total-customers': Utils.formatNumber(data.totalCustomers || 0),
            'total-orders': Utils.formatNumber(data.totalOrders || 0),
            'pending-orders': Utils.formatNumber(data.pendingOrders || 0),
            'total-revenue': Utils.formatCurrency(data.totalRevenue || 0)
        };

        Object.entries(stats).forEach(([id, value]) => {
            const element = Utils.getElement(`#${id}`);
            if (element) {
                // 애니메이션 효과
                this.animateValue(element, value);
            }
        });
    },

    // 숫자 애니메이션
    animateValue: function (element, targetValue) {
        const isNumber = !targetValue.includes('₩') && !isNaN(targetValue.replace(/,/g, ''));

        if (!isNumber) {
            element.textContent = targetValue;
            return;
        }

        const target = parseInt(targetValue.replace(/,/g, ''));
        const start = 0;
        const duration = 1000;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const current = Math.floor(start + (target - start) * this.easeOutCubic(progress));
            element.textContent = Utils.formatNumber(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    },

    easeOutCubic: function (t) {
        return 1 - Math.pow(1 - t, 3);
    },

    // 차트 업데이트
    updateCharts: function (data) {
        this.createStatusChart(data.statusDistribution || []);
        this.createRevenueChart(data.monthlyRevenue || []);
    },

    // 상태 분포 차트
    createStatusChart: function (data) {
        const ctx = Utils.getElement('#statusChart');
        if (!ctx) return;

        // 기존 차트 제거
        if (window.Charts.statusChart) {
            window.Charts.statusChart.destroy();
        }

        const colors = [
            window.AppConfig.CHART_COLORS.warning,  // 주문접수
            window.AppConfig.CHART_COLORS.info,     // 도면작업
            window.AppConfig.CHART_COLORS.primary,  // 제작중
            window.AppConfig.CHART_COLORS.success   // 완료
        ];

        window.Charts.statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(item => item.status),
                datasets: [{
                    data: data.map(item => item.count),
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed}건 (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 1000
                }
            }
        });
    },

    // 매출 차트
    createRevenueChart: function (data) {
        const ctx = Utils.getElement('#revenueChart');
        if (!ctx) return;

        // 기존 차트 제거
        if (window.Charts.revenueChart) {
            window.Charts.revenueChart.destroy();
        }

        // 기본 데이터 (6개월)
        const defaultData = this.generateDefaultRevenueData();
        const chartData = data.length > 0 ? data : defaultData;

        window.Charts.revenueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.map(item => item.month),
                datasets: [{
                    label: '매출 (원)',
                    data: chartData.map(item => item.revenue),
                    borderColor: window.AppConfig.CHART_COLORS.primary,
                    backgroundColor: window.AppConfig.CHART_COLORS.primary + '20',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: window.AppConfig.CHART_COLORS.primary,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `매출: ${Utils.formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return Utils.formatCurrency(value);
                            }
                        },
                        grid: {
                            color: '#f3f4f6'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeInOutCubic'
                }
            }
        });
    },

    // 기본 매출 데이터 생성
    generateDefaultRevenueData: function () {
        const months = ['1월', '2월', '3월', '4월', '5월', '6월'];
        return months.map(month => ({
            month,
            revenue: Math.floor(Math.random() * 20000000) + 10000000
        }));
    },

    // 최근 주문 업데이트
    updateRecentOrders: function (orders) {
        const container = Utils.getElement('#recent-orders-container');
        if (!container) return;

        if (!orders || orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="empty-state-icon fas fa-clipboard-list"></i>
                    <div class="empty-state-title">최근 주문이 없습니다</div>
                    <div class="empty-state-description">새 주문을 등록해보세요</div>
                </div>
            `;
            return;
        }

        const tableHtml = `
            <div class="overflow-x-auto">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>고객</th>
                            <th>제품</th>
                            <th>금액</th>
                            <th>상태</th>
                            <th>납기일</th>
                            <th>등록일</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.slice(0, 10).map(order => `
                            <tr class="cursor-pointer" onclick="Dashboard.viewOrderDetail(${order.id})">
                                <td>
                                    <div class="font-medium text-gray-900">${order.customer_name || '알 수 없음'}</div>
                                    <div class="text-sm text-gray-500">${order.customer_phone || ''}</div>
                                </td>
                                <td>
                                    <div class="font-medium">${order.product_type}</div>
                                    <div class="text-sm text-gray-500">${order.size || ''}</div>
                                </td>
                                <td class="font-medium">${Utils.formatCurrency(order.amount)}</td>
                                <td>
                                    <span class="status-badge ${Utils.getStatusClass(order.status)}">${order.status}</span>
                                </td>
                                <td class="${Utils.isDatePast(order.due_date) ? 'text-red-600 font-medium' : ''}">
                                    ${Utils.formatDate(order.due_date)}
                                    ${Utils.isDatePast(order.due_date) ? '<i class="fas fa-exclamation-triangle ml-1"></i>' : ''}
                                </td>
                                <td class="text-gray-500">${Utils.getRelativeTime(order.created_at)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tableHtml;
    },

    // 주문 상세 보기
    viewOrderDetail: function (orderId) {
        UI.showTab('orders');
        // 주문 상세 모달 표시 (Orders 컴포넌트에서 구현)
        if (window.Orders && window.Orders.showDetail) {
            setTimeout(() => {
                window.Orders.showDetail(orderId);
            }, 100);
        }
    },

    // 새로고침
    refresh: async function () {
        await this.loadData();
        UI.showSuccess('대시보드가 새로고침되었습니다.');
    },

    // 이벤트 리스너 설정
    setupEventListeners: function () {
        // 통계 카드 클릭 이벤트
        const customerCard = Utils.getElement('#total-customers');
        if (customerCard) {
            customerCard.closest('.stat-card').style.cursor = 'pointer';
            customerCard.closest('.stat-card').addEventListener('click', () => {
                UI.showTab('customers');
            });
        }

        const orderCard = Utils.getElement('#total-orders');
        if (orderCard) {
            orderCard.closest('.stat-card').style.cursor = 'pointer';
            orderCard.closest('.stat-card').addEventListener('click', () => {
                UI.showTab('orders');
            });
        }

        // 차트 클릭 이벤트
        const statusChart = Utils.getElement('#statusChart');
        if (statusChart) {
            statusChart.addEventListener('click', (event) => {
                if (window.Charts.statusChart) {
                    const points = window.Charts.statusChart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
                    if (points.length > 0) {
                        const index = points[0].index;
                        const status = window.Charts.statusChart.data.labels[index];
                        this.filterOrdersByStatus(status);
                    }
                }
            });
        }

        // 자동 새로고침 설정
        if (window.AppConfig.AUTO_REFRESH_INTERVAL > 0) {
            setInterval(() => {
                if (window.AppState.currentTab === 'dashboard') {
                    this.loadData();
                }
            }, window.AppConfig.AUTO_REFRESH_INTERVAL);
        }
    },

    // 상태별 주문 필터링
    filterOrdersByStatus: function (status) {
        UI.showTab('orders');
        setTimeout(() => {
            if (window.Orders && window.Orders.filterByStatus) {
                window.Orders.filterByStatus(status);
            }
        }, 100);
    },

    // 데이터 내보내기
    exportData: function () {
        const data = window.AppData.dashboard;
        const csvContent = this.generateCSVReport(data);
        this.downloadCSV(csvContent, `dashboard_${Utils.formatDate(new Date(), 'YYYY-MM-DD')}.csv`);
    },

    generateCSVReport: function (data) {
        let csv = '대시보드 리포트\n';
        csv += `생성일시,${new Date().toLocaleString('ko-KR')}\n\n`;
        csv += '구분,값\n';
        csv += `총 고객수,${data.totalCustomers || 0}\n`;
        csv += `총 주문수,${data.totalOrders || 0}\n`;
        csv += `진행중 주문,${data.pendingOrders || 0}\n`;
        csv += `총 매출,${data.totalRevenue || 0}\n\n`;

        if (data.statusDistribution && data.statusDistribution.length > 0) {
            csv += '상태별 분포\n';
            csv += '상태,건수\n';
            data.statusDistribution.forEach(item => {
                csv += `${item.status},${item.count}\n`;
            });
        }

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
    }
};

// 데이터 업데이트 이벤트 리스너
window.addEventListener('dashboardUpdated', (event) => {
    if (window.AppState.currentTab === 'dashboard') {
        Dashboard.updateStats(event.detail);
        Dashboard.updateCharts(event.detail);
        Dashboard.updateRecentOrders(event.detail.recentOrders || []);
    }
});

console.log('📊 대시보드 컴포넌트 로드 완료');