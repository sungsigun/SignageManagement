// js/app.js - 메인 애플리케이션 파일
import { config } from './config.js';
import { updateTime, showErrorMessage, showSuccessMessage } from './ui.js';
import { DashboardComponent } from './components/dashboard.js';
import { CustomersComponent } from './components/customers.js';
import { OrdersComponent } from './components/orders.js';
import { ProductsComponent } from './components/products.js';
import { FilesComponent } from './components/files.js';
import { ReportsComponent } from './components/reports.js';
import { CustomerModal } from './modals/customerModal.js';
import { OrderModal } from './modals/orderModal.js';

class SignageApp {
    constructor() {
        this.currentTab = 'dashboard';
        this.sidebarOpen = true;
        this.components = {};
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('🚀 간판 관리 시스템 초기화 시작...');

            // 기본 설정
            this.setupErrorHandlers();
            this.setupResponsiveLayout();

            // UI 초기화
            this.initializeUI();

            // 컴포넌트 초기화
            await this.initializeComponents();

            // 이벤트 리스너 설정
            this.setupEventListeners();

            // 시간 업데이트 시작
            this.startTimeUpdates();

            // 초기 탭 표시
            this.showTab('dashboard');

            this.isInitialized = true;
            console.log('✅ 애플리케이션 초기화 완료');

        } catch (error) {
            console.error('❌ 애플리케이션 초기화 실패:', error);
            this.showInitializationError(error);
        }
    }

    setupErrorHandlers() {
        // Chrome 확장프로그램 오류 무시
        window.addEventListener('error', (e) => {
            if (e.message && e.message.includes('runtime.lastError')) {
                e.preventDefault();
                return false;
            }
        });

        window.addEventListener('unhandledrejection', (e) => {
            if (e.reason && e.reason.toString().includes('runtime.lastError')) {
                e.preventDefault();
                return false;
            }
        });

        // Tailwind CSS 경고 숨기기
        const originalWarn = console.warn;
        console.warn = function (...args) {
            if (args[0] && args[0].includes('tailwindcss.com should not be used in production')) {
                return;
            }
            originalWarn.apply(console, args);
        };
    }

    setupResponsiveLayout() {
        // 초기 화면 크기에 따른 사이드바 상태 설정
        const updateSidebarState = () => {
            const sidebar = document.getElementById('sidebar');
            if (window.innerWidth < 1024) {
                this.sidebarOpen = false;
                if (sidebar) {
                    sidebar.classList.remove('sidebar-open');
                }
            } else {
                this.sidebarOpen = true;
                if (sidebar) {
                    sidebar.classList.remove('sidebar-open');
                }
            }
        };

        updateSidebarState();
        window.addEventListener('resize', updateSidebarState);
    }

    initializeUI() {
        // 로딩 상태 제거
        const loadingElements = document.querySelectorAll('.loading-spinner');
        loadingElements.forEach(el => el.remove());

        // 네비게이션 초기화
        this.initializeNavigation();
    }

    initializeNavigation() {
        // 메뉴 아이템 초기 상태 설정
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.classList.remove('bg-blue-50', 'text-blue-700', 'border-r-2', 'border-blue-700');
            item.classList.add('text-gray-700', 'hover:bg-gray-50');
        });

        // 대시보드 메뉴 활성화
        const dashboardMenu = document.querySelector('[data-tab="dashboard"]');
        if (dashboardMenu) {
            dashboardMenu.classList.remove('text-gray-700', 'hover:bg-gray-50');
            dashboardMenu.classList.add('bg-blue-50', 'text-blue-700', 'border-r-2', 'border-blue-700');
        }
    }

    async initializeComponents() {
        console.log('🔧 컴포넌트 초기화 중...');

        try {
            // 컴포넌트 인스턴스 생성
            this.components = {
                dashboard: DashboardComponent,
                customers: CustomersComponent,
                orders: OrdersComponent,
                products: ProductsComponent,
                files: FilesComponent,
                reports: ReportsComponent
            };

            // 모달 컴포넌트 전역 등록
            window.CustomerModal = CustomerModal;
            window.OrderModal = OrderModal;

            // 대시보드 초기 로드
            await this.components.dashboard.init();

            console.log('✅ 컴포넌트 초기화 완료');
        } catch (error) {
            console.error('❌ 컴포넌트 초기화 실패:', error);
            throw error;
        }
    }

    setupEventListeners() {
        console.log('🔧 이벤트 리스너 설정 중...');

        // 햄버거 메뉴 버튼
        const menuToggle = document.getElementById('menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // 메뉴 아이템 클릭
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const tab = item.getAttribute('data-tab');
                if (tab) {
                    this.showTab(tab);
                }
            });
        });

        // 새 주문 버튼들
        this.setupNewOrderButtons();

        // 새 고객 버튼들
        this.setupNewCustomerButtons();

        // 전역 단축키
        this.setupGlobalShortcuts();

        console.log('✅ 이벤트 리스너 설정 완료');
    }

    setupNewOrderButtons() {
        const newOrderButtons = [
            'new-order-btn',
            'new-order-btn-orders'
        ];

        newOrderButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => {
                    this.openNewOrderModal();
                });
            }
        });
    }

    setupNewCustomerButtons() {
        const newCustomerButtons = [
            'new-customer-btn'
        ];

        newCustomerButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => {
                    this.openNewCustomerModal();
                });
            }
        });
    }

    setupGlobalShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N: 새 주문
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.openNewOrderModal();
            }

            // Ctrl/Cmd + M: 새 고객
            if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
                e.preventDefault();
                this.openNewCustomerModal();
            }

            // Ctrl/Cmd + D: 대시보드
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                this.showTab('dashboard');
            }

            // ESC: 모달 닫기
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    startTimeUpdates() {
        updateTime();
        setInterval(updateTime, 1000);
    }

    toggleSidebar() {
        console.log('🔄 사이드바 토글');
        const sidebar = document.getElementById('sidebar');

        if (window.innerWidth < 1024) {
            if (sidebar.classList.contains('sidebar-open')) {
                sidebar.classList.remove('sidebar-open');
                this.sidebarOpen = false;
                console.log('➡️ 사이드바 숨김 (모바일)');
            } else {
                sidebar.classList.add('sidebar-open');
                this.sidebarOpen = true;
                console.log('⬅️ 사이드바 표시 (모바일)');
            }
        }
    }

    async showTab(tabName) {
        if (this.currentTab === tabName) {
            return; // 이미 선택된 탭이면 아무것도 하지 않음
        }

        console.log('🔄 탭 전환:', this.currentTab, '->', tabName);

        try {
            // 모든 탭 컨텐츠 숨기기
            const contents = document.querySelectorAll('.tab-content');
            contents.forEach(content => {
                content.style.display = 'none';
            });

            // 모든 메뉴 아이템 비활성화
            const menuItems = document.querySelectorAll('.menu-item');
            menuItems.forEach(item => {
                item.classList.remove('bg-blue-50', 'text-blue-700', 'border-r-2', 'border-blue-700');
                item.classList.add('text-gray-700', 'hover:bg-gray-50');
            });

            // 선택된 탭 활성화
            const selectedContent = document.getElementById('content-' + tabName);
            const selectedMenu = document.querySelector(`[data-tab="${tabName}"]`);

            if (selectedContent) {
                selectedContent.style.display = 'block';
                console.log('✅ 컨텐츠 표시:', tabName);
            }

            if (selectedMenu) {
                selectedMenu.classList.remove('text-gray-700', 'hover:bg-gray-50');
                selectedMenu.classList.add('bg-blue-50', 'text-blue-700', 'border-r-2', 'border-blue-700');
                console.log('✅ 메뉴 활성화:', tabName);
            }

            // 컴포넌트 초기화 (처음 방문시)
            if (this.components[tabName] && !this.components[tabName].isInitialized) {
                await this.components[tabName].init();
                this.components[tabName].isInitialized = true;
            }

            this.currentTab = tabName;

            // 모바일에서 탭 전환 시 사이드바 닫기
            if (window.innerWidth < 1024) {
                const sidebar = document.getElementById('sidebar');
                sidebar.classList.remove('sidebar-open');
                this.sidebarOpen = false;
            }

            // 특정 탭에 대한 추가 처리
            this.handleTabSpecificActions(tabName);

        } catch (error) {
            console.error('❌ 탭 전환 실패:', error);
            showErrorMessage('페이지 로딩 중 오류가 발생했습니다.');
        }
    }

    async handleTabSpecificActions(tabName) {
        switch (tabName) {
            case 'orders':
                // 주문 목록 새로고침
                if (this.components.orders.loadOrders) {
                    await this.components.orders.loadOrders();
                }
                break;
            case 'customers':
                // 고객 목록 새로고침
                if (this.components.customers.loadCustomers) {
                    await this.components.customers.loadCustomers();
                }
                break;
            case 'products':
                // 제품 목록 새로고침
                if (this.components.products.loadProducts) {
                    await this.components.products.loadProducts();
                }
                break;
            case 'reports':
                // 리포트 데이터 새로고침
                if (this.components.reports.loadReportData) {
                    await this.components.reports.loadReportData();
                }
                break;
        }
    }

    openNewOrderModal() {
        if (window.OrderModal) {
            OrderModal.openForCreate();
        } else {
            showErrorMessage('주문 등록 기능을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
        }
    }

    openNewCustomerModal() {
        if (window.CustomerModal) {
            CustomerModal.openForCreate();
        } else {
            showErrorMessage('고객 등록 기능을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
        }
    }

    closeAllModals() {
        // 모든 모달 닫기
        const modals = document.querySelectorAll('[id$="-modal"]');
        modals.forEach(modal => {
            if (modal && modal.parentNode) {
                modal.remove();
            }
        });
    }

    showInitializationError(error) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'fixed inset-0 bg-red-50 flex items-center justify-center z-50';
        errorContainer.innerHTML = `
            <div class="max-w-md mx-auto text-center p-6">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <i class="fas fa-exclamation-triangle h-6 w-6 text-red-600"></i>
                </div>
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-2">
                    시스템 초기화 실패
                </h3>
                <div class="text-sm text-gray-500 mb-4">
                    애플리케이션을 시작하는 중 오류가 발생했습니다.<br>
                    페이지를 새로고침하거나 관리자에게 문의하세요.
                </div>
                <div class="text-xs text-gray-400 mb-4 font-mono bg-gray-100 p-2 rounded">
                    ${error.message}
                </div>
                <button onclick="location.reload()" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200">
                    <i class="fas fa-refresh mr-2"></i>페이지 새로고침
                </button>
            </div>
        `;

        document.body.appendChild(errorContainer);
    }

    // 공용 메서드들
    async refreshAllData() {
        try {
            showSuccessMessage('데이터를 새로고침하고 있습니다...');

            for (const [name, component] of Object.entries(this.components)) {
                if (component.isInitialized && component.loadData) {
                    await component.loadData();
                }
            }

            showSuccessMessage('모든 데이터가 새로고침되었습니다.');
        } catch (error) {
            console.error('데이터 새로고침 실패:', error);
            showErrorMessage('데이터 새로고침 중 오류가 발생했습니다.');
        }
    }

    // 앱 상태 확인
    getAppStatus() {
        return {
            isInitialized: this.isInitialized,
            currentTab: this.currentTab,
            sidebarOpen: this.sidebarOpen,
            components: Object.keys(this.components),
            version: config.APP_VERSION
        };
    }
}

// 애플리케이션 인스턴스 생성 및 시작
const app = new SignageApp();

// DOM 로드 완료시 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// 전역 접근을 위한 window 객체에 할당
window.SignageApp = app;

// 개발 모드에서 디버깅을 위한 전역 함수들
if (config.DEBUG_MODE) {
    window.debug = {
        app: app,
        showTab: (tab) => app.showTab(tab),
        refreshData: () => app.refreshAllData(),
        getStatus: () => app.getAppStatus(),
        components: () => app.components
    };

    console.log('🔧 디버그 모드 활성화 - window.debug 객체 사용 가능');
}

export default app;