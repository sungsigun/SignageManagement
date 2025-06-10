// 간판 관리 시스템 - 유틸리티 함수들

// ===== 유틸리티 함수 네임스페이스 =====
window.Utils = {

    // ===== 날짜 관련 함수 =====
    formatDate: function (dateString, format = 'YYYY-MM-DD') {
        if (!dateString) return '';

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        switch (format) {
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'YYYY-MM-DD HH:mm':
                return `${year}-${month}-${day} ${hours}:${minutes}`;
            case 'MM/DD':
                return `${month}/${day}`;
            case 'Korean':
                return `${year}년 ${month}월 ${day}일`;
            default:
                return date.toLocaleDateString('ko-KR');
        }
    },

    formatDateTime: function (dateString) {
        return this.formatDate(dateString, 'YYYY-MM-DD HH:mm');
    },

    isDatePast: function (dateString) {
        if (!dateString) return false;
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    },

    getRelativeTime: function (dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        if (diffDays > 0) {
            return `${diffDays}일 전`;
        } else if (diffHours > 0) {
            return `${diffHours}시간 전`;
        } else if (diffMinutes > 0) {
            return `${diffMinutes}분 전`;
        } else {
            return '방금 전';
        }
    },

    // ===== 숫자 포맷팅 =====
    formatNumber: function (num) {
        if (num == null || isNaN(num)) return '0';
        return new Intl.NumberFormat('ko-KR').format(num);
    },

    formatCurrency: function (amount) {
        if (amount == null || isNaN(amount)) return '₩0';
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    },

    formatFileSize: function (bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // ===== 문자열 함수 =====
    truncate: function (str, length = 50) {
        if (!str) return '';
        return str.length > length ? str.substring(0, length) + '...' : str;
    },

    capitalize: function (str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    slugify: function (str) {
        return str
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    },

    // ===== 검증 함수 =====
    validateEmail: function (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    validatePhone: function (phone) {
        const phoneRegex = /^010-\d{4}-\d{4}$/;
        return phoneRegex.test(phone);
    },

    validateRequired: function (value) {
        return value != null && value.toString().trim().length > 0;
    },

    validateMinLength: function (value, minLength) {
        return value && value.toString().length >= minLength;
    },

    validateMaxLength: function (value, maxLength) {
        return !value || value.toString().length <= maxLength;
    },

    validateNumber: function (value, min = null, max = null) {
        const num = parseFloat(value);
        if (isNaN(num)) return false;
        if (min !== null && num < min) return false;
        if (max !== null && num > max) return false;
        return true;
    },

    // ===== 배열/객체 함수 =====
    groupBy: function (array, key) {
        return array.reduce((groups, item) => {
            const groupKey = item[key];
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(item);
            return groups;
        }, {});
    },

    sortBy: function (array, key, order = 'asc') {
        return [...array].sort((a, b) => {
            let aVal = a[key];
            let bVal = b[key];

            // 날짜 처리
            if (key.includes('date') || key.includes('at')) {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            }

            if (order === 'desc') {
                return bVal > aVal ? 1 : -1;
            }
            return aVal > bVal ? 1 : -1;
        });
    },

    filterBy: function (array, filters) {
        return array.filter(item => {
            return Object.entries(filters).every(([key, value]) => {
                if (!value) return true;

                const itemValue = item[key];
                if (typeof value === 'string') {
                    return itemValue && itemValue.toString().toLowerCase().includes(value.toLowerCase());
                }
                return itemValue === value;
            });
        });
    },

    deepClone: function (obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    // ===== DOM 조작 함수 =====
    createElement: function (tag, className = '', innerHTML = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (innerHTML) element.innerHTML = innerHTML;
        return element;
    },

    getElement: function (selector) {
        return document.querySelector(selector);
    },

    getElements: function (selector) {
        return document.querySelectorAll(selector);
    },

    toggleClass: function (element, className) {
        if (element) {
            element.classList.toggle(className);
        }
    },

    addClass: function (element, className) {
        if (element) {
            element.classList.add(className);
        }
    },

    removeClass: function (element, className) {
        if (element) {
            element.classList.remove(className);
        }
    },

    // ===== 이벤트 함수 =====
    debounce: function (func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle: function (func, limit) {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // ===== 파일 관련 함수 =====
    getFileExtension: function (filename) {
        return filename.split('.').pop().toLowerCase();
    },

    isImageFile: function (filename) {
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
        return imageExtensions.includes(this.getFileExtension(filename));
    },

    validateFileType: function (file) {
        return window.AppConfig.ALLOWED_FILE_TYPES.includes(file.type);
    },

    validateFileSize: function (file) {
        return file.size <= window.AppConfig.MAX_FILE_SIZE;
    },

    // ===== 로컬 스토리지 함수 =====
    setStorage: function (key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('로컬 스토리지 저장 실패:', error);
            return false;
        }
    },

    getStorage: function (key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('로컬 스토리지 읽기 실패:', error);
            return defaultValue;
        }
    },

    removeStorage: function (key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('로컬 스토리지 삭제 실패:', error);
            return false;
        }
    },

    // ===== URL 관련 함수 =====
    getUrlParameter: function (name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    },

    setUrlParameter: function (name, value) {
        const url = new URL(window.location);
        url.searchParams.set(name, value);
        window.history.pushState({}, '', url);
    },

    // ===== 상태 관련 함수 =====
    getStatusClass: function (status) {
        const statusMap = {
            '주문접수': 'status-pending',
            '도면작업': 'status-draft',
            '제작중': 'status-progress',
            '완료': 'status-complete'
        };
        return statusMap[status] || 'status-pending';
    },

    getStatusColor: function (status) {
        const colorMap = {
            '주문접수': 'warning',
            '도면작업': 'info',
            '제작중': 'primary',
            '완료': 'success'
        };
        return colorMap[status] || 'warning';
    },

    // ===== 기타 유틸리티 =====
    generateId: function () {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    sleep: function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    isElementInViewport: function (element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    copyToClipboard: function (text) {
        if (navigator.clipboard) {
            return navigator.clipboard.writeText(text);
        } else {
            // 폴백 방법
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return Promise.resolve();
        }
    },

    // ===== 디버그 함수 =====
    log: function (...args) {
        if (window.AppConfig.DEBUG) {
            console.log(...args);
        }
    },

    warn: function (...args) {
        if (window.AppConfig.DEBUG) {
            console.warn(...args);
        }
    },

    error: function (...args) {
        console.error(...args);
    }
};

// 전역 접근을 위한 별칭
window.utils = window.Utils;

console.log('🔧 유틸리티 함수 로드 완료');