// js/modals/customerModal.js
import { api } from '../api.js';
import { showSuccessMessage, showErrorMessage } from '../ui.js';
import { CustomersComponent } from './customers.js';

export const CustomerModal = {
    data: {
        isOpen: false,
        isEditing: false,
        currentCustomer: null,
        formData: {
            name: '',
            phone: '',
            address: '',
            memo: ''
        }
    },

    open(customer = null) {
        this.data.isEditing = !!customer;
        this.data.currentCustomer = customer;

        if (customer) {
            this.data.formData = {
                name: customer.name || '',
                phone: customer.phone || '',
                address: customer.address || '',
                memo: customer.memo || ''
            };
        } else {
            this.resetForm();
        }

        this.render();
        this.setupEventListeners();
        this.data.isOpen = true;
    },

    close() {
        const modal = document.getElementById('customer-modal');
        if (modal) {
            modal.remove();
        }
        this.data.isOpen = false;
        this.data.currentCustomer = null;
        this.resetForm();
    },

    resetForm() {
        this.data.formData = {
            name: '',
            phone: '',
            address: '',
            memo: ''
        };
    },

    render() {
        const modalHtml = `
            <div id="customer-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-screen overflow-y-auto">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-medium text-gray-900">
                                <i class="fas fa-user mr-2 text-blue-600"></i>
                                ${this.data.isEditing ? '고객 정보 수정' : '새 고객 등록'}
                            </h3>
                            <button id="close-modal-btn" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                    </div>
                    
                    <form id="customer-form" class="px-6 py-4">
                        <div class="space-y-4">
                            <!-- 고객명 -->
                            <div>
                                <label for="customer-name" class="block text-sm font-medium text-gray-700 mb-1">
                                    고객명 <span class="text-red-500">*</span>
                                </label>
                                <input type="text" 
                                       id="customer-name" 
                                       name="name" 
                                       required
                                       maxlength="50"
                                       value="${this.data.formData.name}"
                                       placeholder="고객명을 입력하세요"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <div class="text-xs text-gray-500 mt-1">최대 50자까지 입력 가능합니다</div>
                            </div>

                            <!-- 연락처 -->
                            <div>
                                <label for="customer-phone" class="block text-sm font-medium text-gray-700 mb-1">
                                    연락처 <span class="text-red-500">*</span>
                                </label>
                                <input type="tel" 
                                       id="customer-phone" 
                                       name="phone" 
                                       required
                                       value="${this.data.formData.phone}"
                                       placeholder="010-0000-0000"
                                       maxlength="13"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <div class="text-xs text-gray-500 mt-1">하이픈(-)을 포함하여 입력하세요</div>
                            </div>

                            <!-- 주소 -->
                            <div>
                                <label for="customer-address" class="block text-sm font-medium text-gray-700 mb-1">
                                    주소
                                </label>
                                <textarea id="customer-address" 
                                          name="address" 
                                          rows="2"
                                          maxlength="200"
                                          placeholder="주소를 입력하세요"
                                          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none">${this.data.formData.address}</textarea>
                                <div class="text-xs text-gray-500 mt-1">최대 200자까지 입력 가능합니다</div>
                            </div>

                            <!-- 메모 -->
                            <div>
                                <label for="customer-memo" class="block text-sm font-medium text-gray-700 mb-1">
                                    메모
                                </label>
                                <textarea id="customer-memo" 
                                          name="memo" 
                                          rows="3"
                                          maxlength="500"
                                          placeholder="고객 관련 메모를 입력하세요"
                                          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none">${this.data.formData.memo}</textarea>
                                <div class="text-xs text-gray-500 mt-1">최대 500자까지 입력 가능합니다</div>
                            </div>
                        </div>

                        <!-- 폼 하단 버튼 -->
                        <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                            <button type="button" 
                                    id="cancel-btn"
                                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200">
                                <i class="fas fa-times mr-1"></i>취소
                            </button>
                            <button type="submit" 
                                    id="submit-btn"
                                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200">
                                <i class="fas fa-save mr-1"></i>
                                ${this.data.isEditing ? '수정' : '등록'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // 모달을 body에 추가
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = modalHtml;
        document.body.appendChild(modalDiv.firstElementChild);

        // 첫 번째 입력 필드에 포커스
        setTimeout(() => {
            const firstInput = document.getElementById('customer-name');
            if (firstInput) {
                firstInput.focus();
                firstInput.select();
            }
        }, 100);
    },

    setupEventListeners() {
        const modal = document.getElementById('customer-modal');
        const form = document.getElementById('customer-form');
        const closeBtn = document.getElementById('close-modal-btn');
        const cancelBtn = document.getElementById('cancel-btn');
        const submitBtn = document.getElementById('submit-btn');

        // 모달 닫기 버튼
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.close();
            });
        }

        // 취소 버튼
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.close();
            });
        }

        // 모달 외부 클릭 시 닫기
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.close();
                }
            });
        }

        // ESC 키로 모달 닫기
        document.addEventListener('keydown', this.handleKeyPress.bind(this));

        // 폼 제출
        if (form) {
            form.addEventListener('submit', this.handleSubmit.bind(this));
        }

        // 실시간 입력 유효성 검사
        this.setupValidation();

        // 전화번호 자동 포맷팅
        this.setupPhoneFormatting();
    },

    setupValidation() {
        const nameInput = document.getElementById('customer-name');
        const phoneInput = document.getElementById('customer-phone');

        if (nameInput) {
            nameInput.addEventListener('input', () => {
                this.validateName(nameInput);
            });
        }

        if (phoneInput) {
            phoneInput.addEventListener('input', () => {
                this.validatePhone(phoneInput);
            });
        }
    },

    setupPhoneFormatting() {
        const phoneInput = document.getElementById('customer-phone');
        if (!phoneInput) return;

        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^0-9]/g, '');

            if (value.length >= 3) {
                if (value.length <= 7) {
                    value = value.replace(/(\d{3})(\d{1,4})/, '$1-$2');
                } else {
                    value = value.replace(/(\d{3})(\d{4})(\d{1,4})/, '$1-$2-$3');
                }
            }

            e.target.value = value;
        });
    },

    validateName(input) {
        const value = input.value.trim();
        const errorElement = this.getOrCreateErrorElement(input, 'name-error');

        if (!value) {
            this.showFieldError(input, errorElement, '고객명을 입력해주세요.');
            return false;
        }

        if (value.length < 2) {
            this.showFieldError(input, errorElement, '고객명은 2자 이상 입력해주세요.');
            return false;
        }

        if (value.length > 50) {
            this.showFieldError(input, errorElement, '고객명은 50자 이하로 입력해주세요.');
            return false;
        }

        this.hideFieldError(input, errorElement);
        return true;
    },

    validatePhone(input) {
        const value = input.value.trim();
        const errorElement = this.getOrCreateErrorElement(input, 'phone-error');

        if (!value) {
            this.showFieldError(input, errorElement, '연락처를 입력해주세요.');
            return false;
        }

        const phonePattern = /^010-\d{4}-\d{4}$/;
        if (!phonePattern.test(value)) {
            this.showFieldError(input, errorElement, '올바른 휴대폰 번호 형식이 아닙니다. (010-0000-0000)');
            return false;
        }

        this.hideFieldError(input, errorElement);
        return true;
    },

    getOrCreateErrorElement(input, id) {
        let errorElement = document.getElementById(id);
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = id;
            errorElement.className = 'text-xs text-red-600 mt-1 hidden';
            input.parentNode.insertBefore(errorElement, input.nextSibling);
        }
        return errorElement;
    },

    showFieldError(input, errorElement, message) {
        input.classList.add('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
        input.classList.remove('border-gray-300', 'focus:ring-blue-500', 'focus:border-blue-500');
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    },

    hideFieldError(input, errorElement) {
        input.classList.remove('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
        input.classList.add('border-gray-300', 'focus:ring-blue-500', 'focus:border-blue-500');
        errorElement.classList.add('hidden');
    },

    handleKeyPress(e) {
        if (e.key === 'Escape' && this.data.isOpen) {
            this.close();
        }
    },

    async handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const customerData = {
            name: formData.get('name').trim(),
            phone: formData.get('phone').trim(),
            address: formData.get('address').trim(),
            memo: formData.get('memo').trim()
        };

        // 유효성 검사
        if (!this.validateForm(customerData)) {
            return;
        }

        const submitBtn = document.getElementById('submit-btn');
        const originalText = submitBtn.innerHTML;

        try {
            // 버튼 로딩 상태
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>처리중...';

            if (this.data.isEditing) {
                await api.updateCustomer(this.data.currentCustomer.id, customerData);
                showSuccessMessage('고객 정보가 성공적으로 수정되었습니다.');
            } else {
                await api.createCustomer(customerData);
                showSuccessMessage('새 고객이 성공적으로 등록되었습니다.');
            }

            // 고객 목록 새로고침
            if (window.CustomersComponent) {
                await CustomersComponent.loadCustomers();
            }

            this.close();

        } catch (error) {
            console.error('고객 저장 실패:', error);

            if (error.message && error.message.includes('이미 등록된 전화번호')) {
                showErrorMessage('이미 등록된 전화번호입니다.');
            } else {
                showErrorMessage(this.data.isEditing ? '고객 정보 수정에 실패했습니다.' : '고객 등록에 실패했습니다.');
            }
        } finally {
            // 버튼 상태 복원
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    },

    validateForm(data) {
        let isValid = true;

        // 고객명 검사
        const nameInput = document.getElementById('customer-name');
        if (!this.validateName(nameInput)) {
            isValid = false;
        }

        // 전화번호 검사
        const phoneInput = document.getElementById('customer-phone');
        if (!this.validatePhone(phoneInput)) {
            isValid = false;
        }

        // 주소 길이 검사
        if (data.address && data.address.length > 200) {
            showErrorMessage('주소는 200자 이하로 입력해주세요.');
            isValid = false;
        }

        // 메모 길이 검사
        if (data.memo && data.memo.length > 500) {
            showErrorMessage('메모는 500자 이하로 입력해주세요.');
            isValid = false;
        }

        return isValid;
    },

    // 외부에서 호출할 수 있는 메서드들
    openForEdit(customer) {
        this.open(customer);
    },

    openForCreate() {
        this.open();
    }
};

// 전역 접근을 위한 window 객체에 할당
window.CustomerModal = CustomerModal;