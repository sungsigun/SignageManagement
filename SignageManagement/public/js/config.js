// 간판 관리 시스템 - 설정 파일

// 전역 설정
window.AppConfig = {
    // API 기본 설정
    API_BASE_URL: '',
    API_TIMEOUT: 10000,

    // 페이지네이션 설정
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,

    // 파일 업로드 설정
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_FILE_TYPES: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],

    // 차트 설정
    CHART_COLORS: {
        primary: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#06b6d4',
        purple: '#8b5cf6'
    },

    // 상태 설정
    ORDER_STATUSES: [
        { value: '주문접수', label: '주문접수', color: 'warning' },
        { value: '도면작업', label: '도면작업', color: 'info' },
        { value: '제작중', label: '제작중', color: 'primary' },
        { value: '완료', label: '완료', color: 'success' }
    ],

    // 제품 타입
    PRODUCT_TYPES: [
        'LED 간판',
        '아크릴 간판',
        '네온사인',
        '스틸간판',
        '현수막',
        '채널간판',
        '동판간판',
        '목재간판'
    ],

    // 메시지 설정
    MESSAGES: {
        LOADING: '데이터를 불러오는 중...',
        NO_DATA: '데이터가 없습니다.',
        SAVE_SUCCESS: '성공적으로 저장되었습니다.',
        DELETE_SUCCESS: '성공적으로 삭제되었습니다.',
        SAVE_ERROR: '저장 중 오류가 발생했습니다.',
        DELETE_ERROR: '삭제 중 오류가 발생했습니다.',
        NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
        VALIDATION_ERROR: '입력 정보를 확인해주세요.',
        CONFIRM_DELETE: '정말로 삭제하시겠습니까?'
    },

    // 애니메이션 설정
    ANIMATION_DURATION: 300,

    // 자동 새로고침 간격 (밀리초)
    AUTO_REFRESH_INTERVAL: 30000, // 30초

    // 로컬 스토리지 키
    STORAGE_KEYS: {
        THEME: 'signage_theme',
        SIDEBAR_STATE: 'signage_sidebar_state',
        USER_PREFERENCES: 'signage_user_preferences'
    },

    // 디버그 모드
    DEBUG: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',

    // 테이블 설정
    TABLE_SETTINGS: {
        DEFAULT_SORT: 'created_at',
        DEFAULT_ORDER: 'desc',
        ROW_HEIGHT: 60
    }
};

// 환경별 설정
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // 개발 환경
    window.AppConfig.API_BASE_URL = '';
    window.AppConfig.DEBUG = true;
} else {
    // 프로덕션 환경
    window.AppConfig.DEBUG = false;
    window.AppConfig.AUTO_REFRESH_INTERVAL = 60000; // 1분
}

// 전역 상태 관리
window.AppState = {
    currentTab: 'dashboard',
    sidebarOpen: window.innerWidth >= 1024,
    currentUser: null,
    isLoading: false,
    selectedItems: [],
    filters: {},
    pagination: {
        page: 1,
        limit: window.AppConfig.DEFAULT_PAGE_SIZE,
        total: 0
    }
};

// 전역 데이터 저장소
window.AppData = {
    customers: [],
    orders: [],
    products: [],
    dashboard: {},
    cache: new Map()
};

// 차트 인스턴스 저장소
window.Charts = {
    statusChart: null,
    revenueChart: null
};

console.log('📊 앱 설정 로드 완료:', window.AppConfig.DEBUG ? '개발 모드' : '프로덕션 모드');