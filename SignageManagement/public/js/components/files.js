// js/components/files.js
import { formatFileSize, formatDate } from '../utils.js';
import { api } from '../api.js';
import { showSuccessMessage, showErrorMessage } from '../ui.js';

export const FilesComponent = {
    data: {
        files: [],
        filteredFiles: [],
        currentOrder: null,
        searchTerm: '',
        fileType: 'all', // all, drawing, photo
        uploadProgress: 0,
        isUploading: false
    },

    async init() {
        await this.loadFiles();
        this.setupEventListeners();
    },

    async loadFiles() {
        try {
            console.log('📁 파일 데이터 로딩...');
            // 실제 API에서는 파일 목록을 가져와야 함
            // 현재는 기본 구조만 구현
            this.data.files = [];
            this.data.filteredFiles = [...this.data.files];
            this.render();
            console.log(`✅ 파일 ${this.data.files.length}개 로드 완료`);
        } catch (error) {
            console.error('파일 로딩 실패:', error);
            this.renderError('파일 데이터를 불러오지 못했습니다.');
        }
    },

    setupEventListeners() {
        // 검색
        const searchInput = document.getElementById('file-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.data.searchTerm = e.target.value;
                this.filterFiles();
            });
        }

        // 파일 타입 필터
        const typeFilter = document.getElementById('file-type-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.data.fileType = e.target.value;
                this.filterFiles();
            });
        }

        // 파일 업로드
        const uploadBtn = document.getElementById('upload-files-btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                this.openUploadModal();
            });
        }

        // 드래그 앤 드롭
        this.setupDragAndDrop();
    },

    setupDragAndDrop() {
        const dropZone = document.getElementById('file-drop-zone');
        if (!dropZone) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('border-blue-500', 'bg-blue-50');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('border-blue-500', 'bg-blue-50');
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            this.handleFileSelection(files);
        }, false);
    },

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    },

    filterFiles() {
        const searchTerm = this.data.searchTerm.toLowerCase();
        const fileType = this.data.fileType;

        this.data.filteredFiles = this.data.files.filter(file => {
            const matchesSearch = file.original_name.toLowerCase().includes(searchTerm) ||
                (file.order_id && file.order_id.toString().includes(searchTerm));

            const matchesType = fileType === 'all' ||
                (fileType === 'drawing' && file.type === 'drawing') ||
                (fileType === 'photo' && file.type === 'photo');

            return matchesSearch && matchesType;
        });

        this.render();
    },

    render() {
        const container = document.getElementById('files-table');
        if (!container) return;

        if (this.data.filteredFiles.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        container.innerHTML = this.data.filteredFiles.map(file => `
            <tr class="table-hover">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                <i class="fas ${this.getFileIcon(file)} text-gray-500"></i>
                            </div>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${file.original_name}</div>
                            <div class="text-sm text-gray-500">${this.getFileTypeLabel(file.type)}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${formatFileSize(file.file_size)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">주문 #${file.order_id}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatDate(file.created_at)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onclick="FilesComponent.downloadFile(${file.id})"
                            class="text-blue-600 hover:text-blue-900" title="다운로드">
                        <i class="fas fa-download"></i>
                    </button>
                    <button onclick="FilesComponent.previewFile(${file.id})"
                            class="text-green-600 hover:text-green-900" title="미리보기">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="FilesComponent.deleteFile(${file.id}, '${file.original_name.replace(/'/g, "\\'")}')"
                            class="text-red-600 hover:text-red-900" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        this.updateStats();
    },

    renderEmptyState() {
        return `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                    <div class="flex flex-col items-center">
                        <i class="fas fa-folder-open text-4xl text-gray-300 mb-2"></i>
                        <p class="text-lg font-medium">업로드된 파일이 없습니다</p>
                        <p class="text-sm">파일을 업로드해보세요</p>
                        <button onclick="FilesComponent.openUploadModal()" 
                                class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200">
                            <i class="fas fa-upload mr-2"></i>파일 업로드
                        </button>
                    </div>
                </td>
            </tr>
        `;
    },

    renderError(message) {
        const container = document.getElementById('files-table');
        if (!container) return;

        container.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-red-500">
                    <div class="flex flex-col items-center">
                        <i class="fas fa-exclamation-triangle text-4xl text-red-300 mb-2"></i>
                        <p class="text-lg font-medium">오류 발생</p>
                        <p class="text-sm">${message}</p>
                        <button onclick="FilesComponent.loadFiles()" 
                                class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200">
                            <i class="fas fa-refresh mr-2"></i>다시 시도
                        </button>
                    </div>
                </td>
            </tr>
        `;
    },

    getFileIcon(file) {
        const extension = file.original_name.split('.').pop().toLowerCase();

        const iconMap = {
            // 이미지
            'jpg': 'fa-image',
            'jpeg': 'fa-image',
            'png': 'fa-image',
            'gif': 'fa-image',
            'bmp': 'fa-image',
            'webp': 'fa-image',

            // 도면/설계
            'pdf': 'fa-file-pdf',
            'dwg': 'fa-file-lines',
            'dxf': 'fa-file-lines',
            'ai': 'fa-file-lines',
            'eps': 'fa-file-lines',

            // 문서
            'doc': 'fa-file-word',
            'docx': 'fa-file-word',
            'xls': 'fa-file-excel',
            'xlsx': 'fa-file-excel',
            'ppt': 'fa-file-powerpoint',
            'pptx': 'fa-file-powerpoint',
            'txt': 'fa-file-text',

            // 압축
            'zip': 'fa-file-zipper',
            'rar': 'fa-file-zipper',
            '7z': 'fa-file-zipper'
        };

        return iconMap[extension] || 'fa-file';
    },

    getFileTypeLabel(type) {
        const typeMap = {
            'drawing': '도면',
            'photo': '사진',
            'document': '문서',
            'other': '기타'
        };
        return typeMap[type] || '알 수 없음';
    },

    updateStats() {
        const totalCount = this.data.files.length;
        const filteredCount = this.data.filteredFiles.length;
        const totalSize = this.data.files.reduce((sum, file) => sum + (file.file_size || 0), 0);

        const drawingCount = this.data.files.filter(f => f.type === 'drawing').length;
        const photoCount = this.data.files.filter(f => f.type === 'photo').length;

        // 통계 업데이트
        const elements = {
            'files-total': totalCount,
            'files-filtered': filteredCount,
            'files-total-size': formatFileSize(totalSize),
            'files-drawing-count': drawingCount,
            'files-photo-count': photoCount
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    },

    openUploadModal() {
        const modalHtml = this.renderUploadModal();

        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = modalHtml;
        document.body.appendChild(modalDiv.firstElementChild);

        this.setupUploadModalEvents();
    },

    renderUploadModal() {
        return `
            <div id="upload-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-lg font-medium text-gray-900">
                            <i class="fas fa-upload mr-2"></i>파일 업로드
                        </h3>
                    </div>
                    
                    <div class="px-6 py-4">
                        <div class="mb-4">
                            <label for="upload-order-id" class="block text-sm font-medium text-gray-700">주문 번호 *</label>
                            <select id="upload-order-id" required
                                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                <option value="">주문을 선택하세요</option>
                                <!-- 주문 목록이 여기에 동적으로 추가됨 -->
                            </select>
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">파일 타입</label>
                            <div class="flex space-x-4">
                                <label class="flex items-center">
                                    <input type="radio" name="file-type" value="drawing" checked
                                           class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300">
                                    <span class="ml-2 text-sm text-gray-700">도면</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="radio" name="file-type" value="photo"
                                           class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300">
                                    <span class="ml-2 text-sm text-gray-700">사진</span>
                                </label>
                            </div>
                        </div>
                        
                        <div id="file-drop-zone" 
                             class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                            <div class="space-y-2">
                                <i class="fas fa-cloud-upload-alt text-3xl text-gray-400"></i>
                                <p class="text-gray-600">파일을 여기로 드래그하거나 클릭하여 선택하세요</p>
                                <p class="text-sm text-gray-500">JPG, PNG, PDF, DWG 등 (최대 10MB)</p>
                                <input type="file" id="file-input" multiple accept=".jpg,.jpeg,.png,.gif,.pdf,.dwg,.dxf,.doc,.docx,.zip"
                                       class="hidden">
                                <button type="button" id="select-files-btn"
                                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200">
                                    파일 선택
                                </button>
                            </div>
                        </div>
                        
                        <div id="selected-files" class="mt-4 space-y-2"></div>
                        
                        <div id="upload-progress" class="mt-4 hidden">
                            <div class="flex justify-between text-sm text-gray-600 mb-1">
                                <span>업로드 중...</span>
                                <span id="progress-percent">0%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div id="progress-bar" class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                     style="width: 0%"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                        <button type="button" id="cancel-upload-btn"
                                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition duration-200">
                            취소
                        </button>
                        <button type="button" id="start-upload-btn" disabled
                                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition duration-200 disabled:bg-gray-300">
                            <i class="fas fa-upload mr-1"></i>업로드
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    setupUploadModalEvents() {
        const modal = document.getElementById('upload-modal');
        const fileInput = document.getElementById('file-input');
        const selectBtn = document.getElementById('select-files-btn');
        const cancelBtn = document.getElementById('cancel-upload-btn');
        const uploadBtn = document.getElementById('start-upload-btn');
        const dropZone = document.getElementById('file-drop-zone');

        // 파일 선택 버튼
        selectBtn.addEventListener('click', () => {
            fileInput.click();
        });

        // 파일 입력 변경
        fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(Array.from(e.target.files));
        });

        // 취소 버튼
        cancelBtn.addEventListener('click', () => {
            this.closeUploadModal();
        });

        // 업로드 시작
        uploadBtn.addEventListener('click', () => {
            this.startUpload();
        });

        // 모달 외부 클릭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeUploadModal();
            }
        });

        // 드롭존 클릭
        dropZone.addEventListener('click', () => {
            fileInput.click();
        });

        // 주문 목록 로드
        this.loadOrdersForUpload();
    },

    async loadOrdersForUpload() {
        try {
            const orders = await api.getOrders();
            const select = document.getElementById('upload-order-id');
            if (select) {
                select.innerHTML = '<option value="">주문을 선택하세요</option>' +
                    orders.map(order =>
                        `<option value="${order.id}">주문 #${order.id} - ${order.customer_name}</option>`
                    ).join('');
            }
        } catch (error) {
            console.error('주문 목록 로드 실패:', error);
        }
    },

    selectedFiles: [],

    handleFileSelection(files) {
        this.selectedFiles = Array.from(files);
        this.renderSelectedFiles();

        const uploadBtn = document.getElementById('start-upload-btn');
        if (uploadBtn) {
            uploadBtn.disabled = this.selectedFiles.length === 0;
        }
    },

    renderSelectedFiles() {
        const container = document.getElementById('selected-files');
        if (!container) return;

        if (this.selectedFiles.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <h4 class="text-sm font-medium text-gray-700 mb-2">선택된 파일 (${this.selectedFiles.length}개)</h4>
            <div class="space-y-1">
                ${this.selectedFiles.map((file, index) => `
                    <div class="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                        <div class="flex items-center space-x-2">
                            <i class="fas fa-file text-gray-400"></i>
                            <span class="text-sm text-gray-700">${file.name}</span>
                            <span class="text-xs text-gray-500">(${formatFileSize(file.size)})</span>
                        </div>
                        <button type="button" onclick="FilesComponent.removeSelectedFile(${index})"
                                class="text-red-500 hover:text-red-700">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    removeSelectedFile(index) {
        this.selectedFiles.splice(index, 1);
        this.renderSelectedFiles();

        const uploadBtn = document.getElementById('start-upload-btn');
        if (uploadBtn) {
            uploadBtn.disabled = this.selectedFiles.length === 0;
        }
    },

    async startUpload() {
        const orderId = document.getElementById('upload-order-id').value;
        const fileType = document.querySelector('input[name="file-type"]:checked').value;

        if (!orderId) {
            showErrorMessage('주문을 선택해주세요.');
            return;
        }

        if (this.selectedFiles.length === 0) {
            showErrorMessage('업로드할 파일을 선택해주세요.');
            return;
        }

        try {
            this.data.isUploading = true;
            this.showUploadProgress();

            const formData = new FormData();
            formData.append('order_id', orderId);

            this.selectedFiles.forEach(file => {
                formData.append(fileType, file);
            });

            await api.uploadFiles(formData, (progress) => {
                this.updateUploadProgress(progress);
            });

            showSuccessMessage('파일이 성공적으로 업로드되었습니다.');
            this.closeUploadModal();
            await this.loadFiles();

        } catch (error) {
            console.error('파일 업로드 실패:', error);
            showErrorMessage('파일 업로드에 실패했습니다.');
        } finally {
            this.data.isUploading = false;
            this.hideUploadProgress();
        }
    },

    showUploadProgress() {
        const progressDiv = document.getElementById('upload-progress');
        if (progressDiv) {
            progressDiv.classList.remove('hidden');
        }
    },

    hideUploadProgress() {
        const progressDiv = document.getElementById('upload-progress');
        if (progressDiv) {
            progressDiv.classList.add('hidden');
        }
    },

    updateUploadProgress(progress) {
        const progressBar = document.getElementById('progress-bar');
        const progressPercent = document.getElementById('progress-percent');

        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }

        if (progressPercent) {
            progressPercent.textContent = `${Math.round(progress)}%`;
        }
    },

    closeUploadModal() {
        const modal = document.getElementById('upload-modal');
        if (modal) {
            modal.remove();
        }
        this.selectedFiles = [];
        this.data.isUploading = false;
    },

    async downloadFile(fileId) {
        try {
            const file = this.data.files.find(f => f.id === fileId);
            if (!file) return;

            // 실제 구현에서는 API를 통해 파일 다운로드 URL을 가져와야 함
            showSuccessMessage(`"${file.original_name}" 다운로드를 시작합니다.`);
        } catch (error) {
            console.error('파일 다운로드 실패:', error);
            showErrorMessage('파일 다운로드에 실패했습니다.');
        }
    },

    async previewFile(fileId) {
        try {
            const file = this.data.files.find(f => f.id === fileId);
            if (!file) return;

            // 실제 구현에서는 파일 미리보기 모달을 표시해야 함
            showSuccessMessage(`"${file.original_name}" 미리보기 기능이 곧 추가됩니다.`);
        } catch (error) {
            console.error('파일 미리보기 실패:', error);
            showErrorMessage('파일 미리보기에 실패했습니다.');
        }
    },

    async deleteFile(fileId, fileName) {
        if (!confirm(`정말로 "${fileName}" 파일을 삭제하시겠습니까?`)) {
            return;
        }

        try {
            await api.deleteFile(fileId);
            showSuccessMessage('파일이 성공적으로 삭제되었습니다.');
            await this.loadFiles();
        } catch (error) {
            console.error('파일 삭제 실패:', error);
            showErrorMessage('파일 삭제에 실패했습니다.');
        }
    }
};

// 전역 접근을 위한 window 객체에 할당
window.FilesComponent = FilesComponent;