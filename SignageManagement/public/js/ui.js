// 간판 관리 시스템 - UI 조작 함수들

// ===== UI 클래스 =====
window.UI = {

    // ===== 기본 UI 제어 =====

    // 탭 전환
    showTab: function (tabName) {
        Utils.log('🔄 탭 전환:', tabName);

        // 모든 탭 컨텐츠 숨기기
        const contents = Utils.getElements('.tab-content');
        contents.forEach(content => {
            content.style.display = 'none';
        });

        // 모든 메뉴 아이템 비활성화
        const menuItems = Utils.getElements('.menu-item');
        menuItems.forEach(item => {
            Utils.removeClass(item, 'active');
        });

        // 선택된 탭 활성화
        const selectedContent = Utils.getElement(`#content-${tabName}`);
        const selectedMenu = Utils.getElement(`[data-tab="${tabName}"]`);

        if (selectedContent) {
            selectedContent.style.display = 'block';
        }

        if (selectedMenu) {
            Utils.addClass(selectedMenu, 'active');
        }

        // 전역 상태 업데이트
        window.AppState.currentTab = tabName;

        // 탭별 데이터 로드
        this.loadTabData(tabName);

        // 모바일에서 사이드바 닫기
        if (window.innerWidth < 1024) {
            this.closeSidebar();
        }

        // URL 업데이트
        Utils.setUrlParameter('tab', tabName);
    },

    // 탭별 데이터 로드
    loadTabData: function (tabName) {
        switch (tabName) {
            case 'dashboard':
                if (window.Dashboard && window.Dashboard.init) {
                    window.Dashboard.init();
                }
                break;
            case 'customers':
                if (window.Customers && window.Customers.init) {
                    window.Customers.init();
                }
                break;
            case 'orders':
                if (window.Orders && window.Orders.init) {
                    window.Orders.init();
                }
                break;
            case 'products':
                if (window.Products && window.Products.init) {
                    window.Products.init();
                }
                break;
            case 'files':
                if (window.Files && window.Files.init) {
                    window.Files.init();
                }
                break;
            case 'reports':
                if (window.Reports && window.Reports.init) {
                    window.Reports.init();
                }
                break;
        }
    },

    // 사이드바 제어
    toggleSidebar: function () {
        const sidebar = Utils.getElement('#sidebar');
        if (!sidebar) return;

        if (window.innerWidth < 1024) {
            Utils.toggleClass(sidebar, 'sidebar-open');
            window.AppState.sidebarOpen = sidebar.classList.contains('sidebar-open');
        }

        Utils.log('🔄 사이드바 토글:', window.AppState.sidebarOpen);
    },

    closeSidebar: function () {
        const sidebar = Utils.getElement('#sidebar');
        if (sidebar && window.innerWidth < 1024) {
            Utils.removeClass(sidebar, 'sidebar-open');
            window.AppState.sidebarOpen = false;
        }
    },

    // ===== 알림 및 메시지 =====

    // 토스트 알림 표시
    showToast: function (message, type = 'info', duration = 5000) {
        const toastId = Utils.generateId();
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-triangle',
            warning: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };

        const toast = Utils.createElement('div', `toast toast-${type}`, `
            <div class="toast-header">
                <div class="flex items-center">
                    <i class="${iconMap[type]} mr-2"></i>
                    <span class="toast-title">${Utils.capitalize(type)}</span>
                </div>
                <button class="toast-close" onclick="UI.closeToast('${toastId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="toast-message">${message}</div>
        `);

        toast.id = toastId;
        document.body.appendChild(toast);

        // 자동 제거
        setTimeout(() => this.closeToast(toastId), duration);

        return toastId;
    },

    closeToast: function (toastId) {
        const toast = Utils.getElement(`#${toastId}`);
        if (toast) {
            toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    },

    // 편의 함수들
    showSuccess: function (message) {
        return this.showToast(message, 'success');
    },

    showError: function (message) {
        return this.showToast(message, 'error', 7000);
    },

    showWarning: function (message) {
        return this.showToast(message, 'warning');
    },

    showInfo: function (message) {
        return this.showToast(message, 'info');
    },

    // 확인 대화상자
    confirm: function (message, title = '확인') {
        return new Promise((resolve) => {
            const modalId = this.showModal({
                title: title,
                body: `<p class="text-gray-700">${message}</p>`,
                footer: `
                    <button class="btn btn-outline mr-2" onclick="UI.closeModal('${modalId}'); UI.resolveConfirm(false)">취소</button>
                    <button class="btn btn-danger" onclick="UI.closeModal('${modalId}'); UI.resolveConfirm(true)">확인</button>
                `,
                size: 'sm'
            });

            this._confirmResolve = resolve;
        });
    },

    resolveConfirm: function (result) {
        if (this._confirmResolve) {
            this._confirmResolve(result);
            this._confirmResolve = null;
        }
    },

    // ===== 모달 관리 =====

    showModal: function (options = {}) {
        const modalId = Utils.generateId();
        const { title = '', body = '', footer = '', size = 'md', closable = true } = options;

        const sizeClasses = {
            sm: 'max-w-md',
            md: 'max-w-lg',
            lg: 'max-w-2xl',
            xl: 'max-w-4xl'
        };

        const modalHtml = `
            <div class="modal-overlay" onclick="UI.handleModalOverlayClick(event, '${modalId}', ${closable})">
                <div class="modal-content ${sizeClasses[size]}" onclick="event.stopPropagation()">
                    ${title ? `
                        <div class="modal-header">
                            <h3 class="modal-title">${title}</h3>
                            ${closable ? `<button class="modal-close" onclick="UI.closeModal('${modalId}')">
                                <i class="fas fa-times"></i>
                            </button>` : ''}
                        </div>
                    ` : ''}
                    ${body ? `<div class="modal-body">${body}</div>` : ''}
                    ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
                </div>
            </div>
        `;

        const modalContainer = Utils.getElement('#modal-container');
        const modalElement = Utils.createElement('div', '', modalHtml);
        modalElement.id = modalId;

        modalContainer.appendChild(modalElement);

        // ESC 키 이벤트 추가
        if (closable) {
            this._addEscapeListener(modalId);
        }

        return modalId;
    },

    closeModal: function (modalId) {
        const modal = Utils.getElement(`#${modalId}`);
        if (modal) {
            modal.style.animation = 'fadeOut 0.2s ease-in-out forwards';
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 200);
        }

        this._removeEscapeListener(modalId);
    },

    handleModalOverlayClick: function (event, modalId, closable) {
        if (closable && event.target.classList.contains('modal-overlay')) {
            this.closeModal(modalId);
        }
    },

    _addEscapeListener: function (modalId) {
        const handler = (event) => {
            if (event.key === 'Escape') {
                this.closeModal(modalId);
            }
        };

        document.addEventListener('keydown', handler);
        this._escapeHandlers = this._escapeHandlers || new Map();
        this._escapeHandlers.set(modalId, handler);
    },

    _removeEscapeListener: function (modalId) {
        if (this._escapeHandlers && this._escapeHandlers.has(modalId)) {
            document.removeEventListener('keydown', this._escapeHandlers.get(modalId));
            this._escapeHandlers.delete(modalId);
        }
    },

    // ===== 로딩 상태 관리 =====

    showLoading: function (element, message = '처리 중...') {
        if (typeof element === 'string') {
            element = Utils.getElement(element);
        }

        if (!element) return;

        const loadingHtml = `
            <div class="loading-overlay" style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10;
            ">
                <div class="flex flex-col items-center">
                    <div class="spinner"></div>
                    <div class="mt-2 text-sm text-gray-600">${message}</div>
                </div>
            </div>
        `;

        // 상대 위치 설정
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }

        const loadingElement = Utils.createElement('div', '', loadingHtml);
        element.appendChild(loadingElement);

        return loadingElement;
    },

    hideLoading: function (element) {
        if (typeof element === 'string') {
            element = Utils.getElement(element);
        }

        if (!element) return;

        const loadingOverlay = element.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    },

    // ===== 테이블 관련 =====

    createDataTable: function (containerId, options = {}) {
        const container = Utils.getElement(containerId);
        if (!container) return;

        const {
            title = '',
            data = [],
            columns = [],
            actions = [],
            searchable = true,
            sortable = true,
            pagination = true,
            emptyMessage = '데이터가 없습니다.'
        } = options;

        let tableHtml = `
            <div class="data-table">
                <div class="data-table-header">
                    <h3 class="data-table-title">${title}</h3>
                    <div class="data-table-actions">
                        ${actions.map(action => `
                            <button class="btn btn-${action.type || 'primary'} btn-sm" onclick="${action.onClick}">
                                <i class="${action.icon}"></i> ${action.label}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                ${searchable ? `
                    <div class="p-4 border-b">
                        <div class="search-bar">
                            <div class="relative">
                                <input type="text" class="search-input" placeholder="검색...">
                                <i class="search-icon fas fa-search"></i>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="data-table-wrapper">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                ${columns.map(col => `
                                    <th class="${sortable ? 'cursor-pointer hover:bg-gray-100' : ''}" 
                                        ${sortable ? `onclick="UI.sortTable('${containerId}', '${col.key}')"` : ''}>
                                        ${col.label}
                                        ${sortable ? '<i class="fas fa-sort ml-1 text-gray-400"></i>' : ''}
                                    </th>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody class="table-body">
                            ${this.renderTableRows(data, columns, emptyMessage)}
                        </tbody>
                    </table>
                </div>
                
                ${pagination ? '<div class="pagination-container p-4 border-t"></div>' : ''}
            </div>
        `;

        container.innerHTML = tableHtml;

        // 검색 기능 추가
        if (searchable) {
            const searchInput = container.querySelector('.search-input');
            if (searchInput) {
                searchInput.addEventListener('input', Utils.debounce((e) => {
                    this.filterTable(containerId, e.target.value, columns);
                }, 300));
            }
        }

        // 테이블 데이터 저장
        container._tableData = { data, columns, options };
    },

    renderTableRows: function (data, columns, emptyMessage) {
        if (!data || data.length === 0) {
            return `
                <tr>
                    <td colspan="${columns.length}" class="text-center py-8 text-gray-500">
                        <div class="empty-state">
                            <i class="empty-state-icon fas fa-inbox"></i>
                            <div class="empty-state-title">${emptyMessage}</div>
                        </div>
                    </td>
                </tr>
            `;
        }

        return data.map(row => `
            <tr>
                ${columns.map(col => `
                    <td>
                        ${col.render ? col.render(row[col.key], row) : row[col.key] || ''}
                    </td>
                `).join('')}
            </tr>
        `).join('');
    },

    updateTable: function (containerId, newData) {
        const container = Utils.getElement(containerId);
        if (!container || !container._tableData) return;

        const { columns, options } = container._tableData;
        const tbody = container.querySelector('.table-body');

        if (tbody) {
            tbody.innerHTML = this.renderTableRows(newData, columns, options.emptyMessage);
        }

        // 데이터 업데이트
        container._tableData.data = newData;
    },

    filterTable: function (containerId, searchTerm, columns) {
        const container = Utils.getElement(containerId);
        if (!container || !container._tableData) return;

        const { data } = container._tableData;

        const filteredData = data.filter(row => {
            return columns.some(col => {
                const value = row[col.key];
                return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
            });
        });

        this.updateTable(containerId, filteredData);
    },

    // ===== 폼 관련 =====

    validateForm: function (formElement) {
        const errors = [];
        const inputs = formElement.querySelectorAll('[required], [data-validate]');

        inputs.forEach(input => {
            const value = input.value.trim();
            const fieldName = input.dataset.label || input.name || 'Field';

            // 필수 필드 검증
            if (input.hasAttribute('required') && !Utils.validateRequired(value)) {
                errors.push(`${fieldName}은(는) 필수입니다.`);
                this.addFieldError(input, `${fieldName}은(는) 필수입니다.`);
                return;
            }

            // 유효성 검사
            const validateType = input.dataset.validate;
            if (value && validateType) {
                switch (validateType) {
                    case 'email':
                        if (!Utils.validateEmail(value)) {
                            errors.push(`올바른 이메일 형식이 아닙니다.`);
                            this.addFieldError(input, '올바른 이메일 형식이 아닙니다.');
                        }
                        break;
                    case 'phone':
                        if (!Utils.validatePhone(value)) {
                            errors.push(`올바른 전화번호 형식이 아닙니다. (010-0000-0000)`);
                            this.addFieldError(input, '올바른 전화번호 형식이 아닙니다.');
                        }
                        break;
                    case 'number':
                        const min = input.dataset.min ? parseFloat(input.dataset.min) : null;
                        const max = input.dataset.max ? parseFloat(input.dataset.max) : null;
                        if (!Utils.validateNumber(value, min, max)) {
                            errors.push(`${fieldName}의 값이 올바르지 않습니다.`);
                            this.addFieldError(input, '올바른 숫자를 입력하세요.');
                        }
                        break;
                }
            }

            // 에러가 없으면 에러 메시지 제거
            if (errors.length === 0) {
                this.removeFieldError(input);
            }
        });

        return errors;
    },

    addFieldError: function (input, message) {
        this.removeFieldError(input);

        Utils.addClass(input, 'border-red-500');

        const errorElement = Utils.createElement('div', 'form-error', message);
        input.parentNode.appendChild(errorElement);
    },

    removeFieldError: function (input) {
        Utils.removeClass(input, 'border-red-500');

        const errorElement = input.parentNode.querySelector('.form-error');
        if (errorElement) {
            errorElement.remove();
        }
    },

    clearFormErrors: function (formElement) {
        const inputs = formElement.querySelectorAll('input, select, textarea');
        inputs.forEach(input => this.removeFieldError(input));
    },

    // ===== 시간 업데이트 =====

    updateTime: function () {
        const timeElement = Utils.getElement('#current-time');
        if (timeElement) {
            const now = new Date();
            timeElement.textContent = now.toLocaleString('ko-KR');
        }
    },

    // ===== 초기화 =====

    init: function () {
        this.setupEventListeners();
        this.setupResponsive();

        // 시간 업데이트 시작
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);

        // 초기 탭 설정
        const initialTab = Utils.getUrlParameter('tab') || 'dashboard';
        this.showTab(initialTab);

        Utils.log('🎨 UI 초기화 완료');
    },

    setupEventListeners: function () {
        // 햄버거 메뉴
        const menuToggle = Utils.getElement('#menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // 메뉴 아이템들
        const menuItems = Utils.getElements('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.getAttribute('data-tab');
                if (tab) this.showTab(tab);
            });
        });

        // 모달 오버레이 클릭 시 닫기
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                const modalId = e.target.closest('[id]')?.id;
                if (modalId) this.closeModal(modalId);
            }
        });
    },

    setupResponsive: function () {
        window.addEventListener('resize', Utils.throttle(() => {
            const sidebar = Utils.getElement('#sidebar');
            if (window.innerWidth >= 1024) {
                Utils.removeClass(sidebar, 'sidebar-open');
                window.AppState.sidebarOpen = true;
            } else {
                window.AppState.sidebarOpen = sidebar?.classList.contains('sidebar-open') || false;
            }
        }, 250));
    }
};

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes toastSlideOut {
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);

console.log('🎨 UI 함수 로드 완료');