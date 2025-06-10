// js/components/reports.js
import { formatCurrency, formatDate } from '../utils.js';
import { api } from '../api.js';
import { showSuccessMessage, showErrorMessage } from '../ui.js';

export const ReportsComponent = {
    data: {
        selectedPeriod: 'month', // week, month, quarter, year, custom
        customStartDate: '',
        customEndDate: '',
        reportData: null,
        chartInstances: {},
        isLoading: false
    },

    async init() {
        await this.loadReportData();
        this.setupEventListeners();
    },

    setupEventListeners() {
        // 기간 선택
        const periodSelect = document.getElementById('report-period');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => {
                this.data.selectedPeriod = e.target.value;
                this.toggleCustomDateRange();
                this.loadReportData();
            });
        }

        // 사용자 정의 날짜 범위
        const startDateInput = document.getElementById('report-start-date');
        const endDateInput = document.getElementById('report-end-date');

        if (startDateInput) {
            startDateInput.addEventListener('change', (e) => {
                this.data.customStartDate = e.target.value;
                if (this.data.selectedPeriod === 'custom') {
                    this.loadReportData();
                }
            });
        }

        if (endDateInput) {
            endDateInput.addEventListener('change', (e) => {
                this.data.customEndDate = e.target.value;
                if (this.data.selectedPeriod === 'custom') {
                    this.loadReportData();
                }
            });
        }

        // 리포트 내보내기
        const exportBtn = document.getElementById('export-report-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportReport();
            });
        }

        // 새로고침 버튼
        const refreshBtn = document.getElementById('refresh-report-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadReportData();
            });
        }
    },

    toggleCustomDateRange() {
        const customDateRange = document.getElementById('custom-date-range');
        if (customDateRange) {
            if (this.data.selectedPeriod === 'custom') {
                customDateRange.classList.remove('hidden');
            } else {
                customDateRange.classList.add('hidden');
            }
        }
    },

    async loadReportData() {
        try {
            this.data.isLoading = true;
            this.showLoading();

            console.log('📊 리포트 데이터 로딩...');

            const dateRange = this.getDateRange();
            const reportData = await this.generateReportData(dateRange);

            this.data.reportData = reportData;
            this.render();
            this.renderCharts();

            console.log('✅ 리포트 데이터 로드 완료');
        } catch (error) {
            console.error('리포트 로딩 실패:', error);
            this.renderError('리포트 데이터를 불러오지 못했습니다.');
        } finally {
            this.data.isLoading = false;
            this.hideLoading();
        }
    },

    getDateRange() {
        const now = new Date();
        let startDate, endDate;

        switch (this.data.selectedPeriod) {
            case 'week':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                endDate = now;
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
            case 'custom':
                startDate = this.data.customStartDate ? new Date(this.data.customStartDate) : new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = this.data.customEndDate ? new Date(this.data.customEndDate) : now;
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }

        return { startDate, endDate };
    },

    async generateReportData(dateRange) {
        try {
            // 실제 구현에서는 API에서 데이터를 가져와야 함
            const [orders, customers] = await Promise.all([
                api.getOrders(),
                api.getCustomers()
            ]);

            // 날짜 범위 내 주문 필터링
            const filteredOrders = orders.filter(order => {
                const orderDate = new Date(order.created_at);
                return orderDate >= dateRange.startDate && orderDate <= dateRange.endDate;
            });

            // 리포트 데이터 생성
            return {
                period: this.data.selectedPeriod,
                dateRange,
                summary: this.generateSummary(filteredOrders, customers),
                salesByDay: this.generateSalesByDay(filteredOrders, dateRange),
                salesByProduct: this.generateSalesByProduct(filteredOrders),
                salesByStatus: this.generateSalesByStatus(filteredOrders),
                topCustomers: this.generateTopCustomers(filteredOrders),
                recentOrders: filteredOrders.slice(0, 10)
            };
        } catch (error) {
            console.error('리포트 데이터 생성 실패:', error);
            throw error;
        }
    },

    generateSummary(orders, customers) {
        const totalRevenue = orders.filter(o => o.status === '완료')
            .reduce((sum, o) => sum + (o.amount || 0), 0);
        const totalOrders = orders.length;
        const completedOrders = orders.filter(o => o.status === '완료').length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / completedOrders : 0;
        const newCustomers = customers.filter(c => {
            const createdDate = new Date(c.created_at);
            return createdDate >= this.data.reportData?.dateRange?.startDate;
        }).length;

        return {
            totalRevenue,
            totalOrders,
            completedOrders,
            avgOrderValue,
            newCustomers,
            completionRate: totalOrders > 0 ? (completedOrders / totalOrders * 100) : 0
        };
    },

    generateSalesByDay(orders, dateRange) {
        const completedOrders = orders.filter(o => o.status === '완료');
        const salesByDay = {};

        // 날짜 범위 내 모든 날짜를 0으로 초기화
        for (let date = new Date(dateRange.startDate); date <= dateRange.endDate; date.setDate(date.getDate() + 1)) {
            const dateStr = date.toISOString().split('T')[0];
            salesByDay[dateStr] = 0;
        }

        // 주문별 매출 집계
        completedOrders.forEach(order => {
            const dateStr = new Date(order.created_at).toISOString().split('T')[0];
            if (salesByDay.hasOwnProperty(dateStr)) {
                salesByDay[dateStr] += order.amount || 0;
            }
        });

        return Object.entries(salesByDay).map(([date, amount]) => ({
            date,
            amount,
            formattedDate: new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
        }));
    },

    generateSalesByProduct(orders) {
        const completedOrders = orders.filter(o => o.status === '완료');
        const productSales = {};

        completedOrders.forEach(order => {
            const product = order.product_type || '기타';
            if (!productSales[product]) {
                productSales[product] = { count: 0, amount: 0 };
            }
            productSales[product].count++;
            productSales[product].amount += order.amount || 0;
        });

        return Object.entries(productSales)
            .map(([product, data]) => ({
                product,
                count: data.count,
                amount: data.amount,
                percentage: 0 // 나중에 계산
            }))
            .sort((a, b) => b.amount - a.amount);
    },

    generateSalesByStatus(orders) {
        const statusCounts = {};

        orders.forEach(order => {
            const status = order.status || '알 수 없음';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        return Object.entries(statusCounts).map(([status, count]) => ({
            status,
            count,
            percentage: orders.length > 0 ? (count / orders.length * 100) : 0
        }));
    },

    generateTopCustomers(orders) {
        const completedOrders = orders.filter(o => o.status === '완료');
        const customerSales = {};

        completedOrders.forEach(order => {
            const customerId = order.customer_id;
            const customerName = order.customer_name || '알 수 없음';

            if (!customerSales[customerId]) {
                customerSales[customerId] = {
                    name: customerName,
                    orderCount: 0,
                    totalAmount: 0
                };
            }

            customerSales[customerId].orderCount++;
            customerSales[customerId].totalAmount += order.amount || 0;
        });

        return Object.values(customerSales)
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .slice(0, 10);
    },

    render() {
        if (!this.data.reportData) return;

        this.renderSummaryCards();
        this.renderTopCustomersTable();
        this.renderRecentOrdersTable();
    },

    renderSummaryCards() {
        const summary = this.data.reportData.summary;

        const elements = {
            'report-total-revenue': formatCurrency(summary.totalRevenue),
            'report-total-orders': summary.totalOrders.toLocaleString(),
            'report-completed-orders': summary.completedOrders.toLocaleString(),
            'report-avg-order-value': formatCurrency(summary.avgOrderValue),
            'report-new-customers': summary.newCustomers.toLocaleString(),
            'report-completion-rate': `${summary.completionRate.toFixed(1)}%`
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    },

    renderTopCustomersTable() {
        const container = document.getElementById('top-customers-table');
        if (!container) return;

        const topCustomers = this.data.reportData.topCustomers;

        if (topCustomers.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="3" class="px-6 py-4 text-center text-gray-500">
                        데이터가 없습니다
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = topCustomers.map((customer, index) => `
            <tr class="table-hover">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-8 w-8">
                            <div class="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <span class="text-sm font-medium text-gray-600">${index + 1}</span>
                            </div>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${customer.name}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${customer.orderCount}건
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${formatCurrency(customer.totalAmount)}
                </td>
            </tr>
        `).join('');
    },

    renderRecentOrdersTable() {
        const container = document.getElementById('recent-orders-report-table');
        if (!container) return;

        const recentOrders = this.data.reportData.recentOrders;

        if (recentOrders.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                        해당 기간에 주문이 없습니다
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = recentOrders.map(order => `
            <tr class="table-hover">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #${order.id}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${order.customer_name || '알 수 없음'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${order.product_type}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${formatCurrency(order.amount)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="status-badge ${this.getStatusClass(order.status)}">${order.status}</span>
                </td>
            </tr>
        `).join('');
    },

    getStatusClass(status) {
        const classes = {
            '주문접수': 'status-pending',
            '도면작업': 'status-draft',
            '제작중': 'status-progress',
            '완료': 'status-complete'
        };
        return classes[status] || 'status-pending';
    },

    renderCharts() {
        this.renderSalesChart();
        this.renderProductChart();
        this.renderStatusChart();
    },

    renderSalesChart() {
        const ctx = document.getElementById('sales-chart');
        if (!ctx) return;

        // 기존 차트 제거
        if (this.data.chartInstances.sales) {
            this.data.chartInstances.sales.destroy();
        }

        const salesData = this.data.reportData.salesByDay;

        this.data.chartInstances.sales = new Chart(ctx, {
            type: 'line',
            data: {
                labels: salesData.map(item => item.formattedDate),
                datasets: [{
                    label: '일별 매출',
                    data: salesData.map(item => item.amount),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return '₩' + (value / 1000000).toFixed(1) + 'M';
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return '매출: ' + formatCurrency(context.parsed.y);
                            }
                        }
                    }
                }
            }
        });
    },

    renderProductChart() {
        const ctx = document.getElementById('product-chart');
        if (!ctx) return;

        // 기존 차트 제거
        if (this.data.chartInstances.product) {
            this.data.chartInstances.product.destroy();
        }

        const productData = this.data.reportData.salesByProduct.slice(0, 5); // 상위 5개만

        this.data.chartInstances.product = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: productData.map(item => item.product),
                datasets: [{
                    data: productData.map(item => item.amount),
                    backgroundColor: [
                        '#3b82f6',
                        '#ef4444',
                        '#10b981',
                        '#f59e0b',
                        '#8b5cf6'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const value = formatCurrency(context.parsed);
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    renderStatusChart() {
        const ctx = document.getElementById('status-chart');
        if (!ctx) return;

        // 기존 차트 제거
        if (this.data.chartInstances.status) {
            this.data.chartInstances.status.destroy();
        }

        const statusData = this.data.reportData.salesByStatus;

        this.data.chartInstances.status = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: statusData.map(item => item.status),
                datasets: [{
                    label: '주문 수',
                    data: statusData.map(item => item.count),
                    backgroundColor: [
                        '#3b82f6',
                        '#f59e0b',
                        '#ef4444',
                        '#10b981'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    },

    showLoading() {
        const elements = [
            'report-total-revenue',
            'report-total-orders',
            'report-completed-orders',
            'report-avg-order-value',
            'report-new-customers',
            'report-completion-rate'
        ];

        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = '<div class="spinner"></div>';
            }
        });
    },

    hideLoading() {
        // 로딩 스피너는 render() 메서드에서 실제 데이터로 교체됨
    },

    renderError(message) {
        const container = document.getElementById('report-content');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle text-4xl text-red-300 mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 mb-2">리포트 로딩 실패</h3>
                <p class="text-gray-600 mb-4">${message}</p>
                <button onclick="ReportsComponent.loadReportData()" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200">
                    <i class="fas fa-refresh mr-2"></i>다시 시도
                </button>
            </div>
        `;
    },

    exportReport() {
        if (!this.data.reportData) {
            showErrorMessage('내보낼 리포트 데이터가 없습니다.');
            return;
        }

        try {
            // CSV 형태로 리포트 데이터 내보내기
            const csvData = this.generateCSVData();
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');

            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `리포트_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            showSuccessMessage('리포트가 성공적으로 내보내졌습니다.');
        } catch (error) {
            console.error('리포트 내보내기 실패:', error);
            showErrorMessage('리포트 내보내기에 실패했습니다.');
        }
    },

    generateCSVData() {
        const data = this.data.reportData;
        let csv = '\uFEFF'; // UTF-8 BOM

        // 요약 정보
        csv += '간판 제작 관리 시스템 리포트\n';
        csv += `기간: ${formatDate(data.dateRange.startDate)} ~ ${formatDate(data.dateRange.endDate)}\n\n`;

        csv += '요약 정보\n';
        csv += '항목,값\n';
        csv += `총 매출,${formatCurrency(data.summary.totalRevenue)}\n`;
        csv += `총 주문수,${data.summary.totalOrders}\n`;
        csv += `완료 주문수,${data.summary.completedOrders}\n`;
        csv += `평균 주문액,${formatCurrency(data.summary.avgOrderValue)}\n`;
        csv += `신규 고객수,${data.summary.newCustomers}\n`;
        csv += `완료율,${data.summary.completionRate.toFixed(1)}%\n\n`;

        // 일별 매출
        csv += '일별 매출\n';
        csv += '날짜,매출액\n';
        data.salesByDay.forEach(item => {
            csv += `${item.date},${item.amount}\n`;
        });
        csv += '\n';

        // 제품별 매출
        csv += '제품별 매출\n';
        csv += '제품,주문수,매출액\n';
        data.salesByProduct.forEach(item => {
            csv += `${item.product},${item.count},${item.amount}\n`;
        });
        csv += '\n';

        // 상위 고객
        csv += '상위 고객\n';
        csv += '고객명,주문수,총 매출액\n';
        data.topCustomers.forEach(customer => {
            csv += `${customer.name},${customer.orderCount},${customer.totalAmount}\n`;
        });

        return csv;
    }
};

// 전역 접근을 위한 window 객체에 할당
window.ReportsComponent = ReportsComponent;