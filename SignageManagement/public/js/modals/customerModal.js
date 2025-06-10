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
                                ${this.data.isEditing ? '�� ���� ����' : '�� �� ���'}
                            </h3>
                            <button id="close-modal-btn" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                    </div>
                    
                    <form id="customer-form" class="px-6 py-4">
                        <div class="space-y-4">
                            <!-- ���� -->
                            <div>
                                <label for="customer-name" class="block text-sm font-medium text-gray-700 mb-1">
                                    ���� <span class="text-red-500">*</span>
                                </label>
                                <input type="text" 
                                       id="customer-name" 
                                       name="name" 
                                       required
                                       maxlength="50"
                                       value="${this.data.formData.name}"
                                       placeholder="������ �Է��ϼ���"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <div class="text-xs text-gray-500 mt-1">�ִ� 50�ڱ��� �Է� �����մϴ�</div>
                            </div>

                            <!-- ����ó -->
                            <div>
                                <label for="customer-phone" class="block text-sm font-medium text-gray-700 mb-1">
                                    ����ó <span class="text-red-500">*</span>
                                </label>
                                <input type="tel" 
                                       id="customer-phone" 
                                       name="phone" 
                                       required
                                       value="${this.data.formData.phone}"
                                       placeholder="010-0000-0000"
                                       maxlength="13"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <div class="text-xs text-gray-500 mt-1">������(-)�� �����Ͽ� �Է��ϼ���</div>
                            </div>

                            <!-- �ּ� -->
                            <div>
                                <label for="customer-address" class="block text-sm font-medium text-gray-700 mb-1">
                                    �ּ�
                                </label>
                                <textarea id="customer-address" 
                                          name="address" 
                                          rows="2"
                                          maxlength="200"
                                          placeholder="�ּҸ� �Է��ϼ���"
                                          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none">${this.data.formData.address}</textarea>
                                <div class="text-xs text-gray-500 mt-1">�ִ� 200�ڱ��� �Է� �����մϴ�</div>
                            </div>

                            <!-- �޸� -->
                            <div>
                                <label for="customer-memo" class="block text-sm font-medium text-gray-700 mb-1">
                                    �޸�
                                </label>
                                <textarea id="customer-memo" 
                                          name="memo" 
                                          rows="3"
                                          maxlength="500"
                                          placeholder="�� ���� �޸� �Է��ϼ���"
                                          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none">${this.data.formData.memo}</textarea>
                                <div class="text-xs text-gray-500 mt-1">�ִ� 500�ڱ��� �Է� �����մϴ�</div>
                            </div>
                        </div>

                        <!-- �� �ϴ� ��ư -->
                        <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                            <button type="button" 
                                    id="cancel-btn"
                                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200">
                                <i class="fas fa-times mr-1"></i>���
                            </button>
                            <button type="submit" 
                                    id="submit-btn"
                                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200">
                                <i class="fas fa-save mr-1"></i>
                                ${this.data.isEditing ? '����' : '���'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // ����� body�� �߰�
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = modalHtml;
        document.body.appendChild(modalDiv.firstElementChild);

        // ù ��° �Է� �ʵ忡 ��Ŀ��
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

        // ��� �ݱ� ��ư
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.close();
            });
        }

        // ��� ��ư
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.close();
            });
        }

        // ��� �ܺ� Ŭ�� �� �ݱ�
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.close();
                }
            });
        }

        // ESC Ű�� ��� �ݱ�
        document.addEventListener('keydown', this.handleKeyPress.bind(this));

        // �� ����
        if (form) {
            form.addEventListener('submit', this.handleSubmit.bind(this));
        }

        // �ǽð� �Է� ��ȿ�� �˻�
        this.setupValidation();

        // ��ȭ��ȣ �ڵ� ������
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
            this.showFieldError(input, errorElement, '������ �Է����ּ���.');
            return false;
        }

        if (value.length < 2) {
            this.showFieldError(input, errorElement, '������ 2�� �̻� �Է����ּ���.');
            return false;
        }

        if (value.length > 50) {
            this.showFieldError(input, errorElement, '������ 50�� ���Ϸ� �Է����ּ���.');
            return false;
        }

        this.hideFieldError(input, errorElement);
        return true;
    },

    validatePhone(input) {
        const value = input.value.trim();
        const errorElement = this.getOrCreateErrorElement(input, 'phone-error');

        if (!value) {
            this.showFieldError(input, errorElement, '����ó�� �Է����ּ���.');
            return false;
        }

        const phonePattern = /^010-\d{4}-\d{4}$/;
        if (!phonePattern.test(value)) {
            this.showFieldError(input, errorElement, '�ùٸ� �޴��� ��ȣ ������ �ƴմϴ�. (010-0000-0000)');
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

        // ��ȿ�� �˻�
        if (!this.validateForm(customerData)) {
            return;
        }

        const submitBtn = document.getElementById('submit-btn');
        const originalText = submitBtn.innerHTML;

        try {
            // ��ư �ε� ����
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>ó����...';

            if (this.data.isEditing) {
                await api.updateCustomer(this.data.currentCustomer.id, customerData);
                showSuccessMessage('�� ������ ���������� �����Ǿ����ϴ�.');
            } else {
                await api.createCustomer(customerData);
                showSuccessMessage('�� ���� ���������� ��ϵǾ����ϴ�.');
            }

            // �� ��� ���ΰ�ħ
            if (window.CustomersComponent) {
                await CustomersComponent.loadCustomers();
            }

            this.close();

        } catch (error) {
            console.error('�� ���� ����:', error);

            if (error.message && error.message.includes('�̹� ��ϵ� ��ȭ��ȣ')) {
                showErrorMessage('�̹� ��ϵ� ��ȭ��ȣ�Դϴ�.');
            } else {
                showErrorMessage(this.data.isEditing ? '�� ���� ������ �����߽��ϴ�.' : '�� ��Ͽ� �����߽��ϴ�.');
            }
        } finally {
            // ��ư ���� ����
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    },

    validateForm(data) {
        let isValid = true;

        // ���� �˻�
        const nameInput = document.getElementById('customer-name');
        if (!this.validateName(nameInput)) {
            isValid = false;
        }

        // ��ȭ��ȣ �˻�
        const phoneInput = document.getElementById('customer-phone');
        if (!this.validatePhone(phoneInput)) {
            isValid = false;
        }

        // �ּ� ���� �˻�
        if (data.address && data.address.length > 200) {
            showErrorMessage('�ּҴ� 200�� ���Ϸ� �Է����ּ���.');
            isValid = false;
        }

        // �޸� ���� �˻�
        if (data.memo && data.memo.length > 500) {
            showErrorMessage('�޸�� 500�� ���Ϸ� �Է����ּ���.');
            isValid = false;
        }

        return isValid;
    },

    // �ܺο��� ȣ���� �� �ִ� �޼����
    openForEdit(customer) {
        this.open(customer);
    },

    openForCreate() {
        this.open();
    }
};

// ���� ������ ���� window ��ü�� �Ҵ�
window.CustomerModal = CustomerModal;