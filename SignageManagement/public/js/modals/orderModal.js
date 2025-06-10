// js/modals/orderModal.js
import { api } from '../api.js';
import { formatCurrency } from '../utils.js';
import { showSuccessMessage, showErrorMessage } from '../ui.js';
import { OrdersComponent } from './orders.js';

export const OrderModal = {
    data: {
        isOpen: false,
        isEditing: false,
        currentOrder: null,
        customers: [],
        products: [],
        formData: {
            customer_id: '',
            customer_name: '',
            customer_phone: '',
            product_type: '',
            size: '',
            width: '',
            height: '',
            amount: '',
            due_date: '',
            memo: '',
            status: '�ֹ�����'
        }
    },

    async open(order = null) {
        this.data.isEditing = !!order;
        this.data.currentOrder = order;

        // �� �� ��ǰ ������ �ε�
        await this.loadInitialData();

        if (order) {
            this.data.formData = {
                customer_id: order.customer_id || '',
                customer_name: order.customer_name || '',
                customer_phone: order.customer_phone || '',
                product_type: order.product_type || '',
                size: order.size || '',
                width: order.width || '',
                height: order.height || '',
                amount: order.amount || '',
                due_date: order.due_date ? order.due_date.split('T')[0] : '',
                memo: order.memo || '',
                status: order.status || '�ֹ�����'
            };
        } else {
            this.resetForm();
        }

        this.render();
        this.setupEventListeners();
        this.data.isOpen = true;
    },

    close() {
        const modal = document.getElementById('order-modal');
        if (modal) {
            modal.remove();
        }
        this.data.isOpen = false;
        this.data.currentOrder = null;
        this.resetForm();
    },

    resetForm() {
        this.data.formData = {
            customer_id: '',
            customer_name: '',
            customer_phone: '',
            product_type: '',
            size: '',
            width: '',
            height: '',
            amount: '',
            due_date: '',
            memo: '',
            status: '�ֹ�����'
        };
    },

    async loadInitialData() {
        try {
            const [customers, products] = await Promise.all([
                api.getCustomers(),
                api.getProducts()
            ]);

            this.data.customers = customers;
            this.data.products = products;
        } catch (error) {
            console.error('�ʱ� ������ �ε� ����:', error);
            showErrorMessage('�� �� ��ǰ ������ �ҷ����µ� �����߽��ϴ�.');
        }
    },

    render() {
        const modalHtml = `
            <div id="order-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-medium text-gray-900">
                                <i class="fas fa-clipboard-list mr-2 text-blue-600"></i>
                                ${this.data.isEditing ? '�ֹ� ���� ����' : '�� �ֹ� ���'}
                            </h3>
                            <button id="close-modal-btn" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                    </div>
                    
                    <form id="order-form" class="px-6 py-4">
                        <div class="space-y-6">
                            <!-- �� ���� ���� -->
                            <div class="bg-gray-50 rounded-lg p-4">
                                <h4 class="text-md font-medium text-gray-900 mb-3">
                                    <i class="fas fa-user mr-2"></i>�� ����
                                </h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label for="customer-select" class="block text-sm font-medium text-gray-700 mb-1">
                                            �� ���� <span class="text-red-500">*</span>
                                        </label>
                                        <select id="customer-select" 
                                                name="customer_id" 
                                                required
                                                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                            <option value="">���� �����ϼ���</option>
                                            ${this.data.customers.map(customer =>
            `<option value="${customer.id}" ${this.data.formData.customer_id == customer.id ? 'selected' : ''}>${customer.name} (${customer.phone})</option>`
        ).join('')}
                                        </select>
                                    </div>
                                    <div class="flex items-end">
                                        <button type="button" 
                                                id="new-customer-btn"
                                                class="w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            <i class="fas fa-plus mr-1"></i>�� �� ���
                                        </button>
                                    </div>
                                </div>
                                <div id="customer-info" class="mt-3 p-3 bg-white rounded border hidden">
                                    <div class="text-sm text-gray-600">
                                        <div><strong>�̸�:</strong> <span id="selected-customer-name"></span></div>
                                        <div><strong>����ó:</strong> <span id="selected-customer-phone"></span></div>
                                        <div><strong>�ּ�:</strong> <span id="selected-customer-address"></span></div>
                                    </div>
                                </div>
                            </div>

                            <!-- ��ǰ ���� ���� -->
                            <div class="bg-gray-50 rounded-lg p-4">
                                <h4 class="text-md font-medium text-gray-900 mb-3">
                                    <i class="fas fa-box mr-2"></i>��ǰ ����
                                </h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label for="product-type" class="block text-sm font-medium text-gray-700 mb-1">
                                            ��ǰ ���� <span class="text-red-500">*</span>
                                        </label>
                                        <select id="product-type" 
                                                name="product_type" 
                                                required
                                                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                            <option value="">��ǰ�� �����ϼ���</option>
                                            ${this.data.products.map(product =>
            `<option value="${product.name}" data-price="${product.unit_price}" ${this.data.formData.product_type === product.name ? 'selected' : ''}>${product.name} (${formatCurrency(product.unit_price)})</option>`
        ).join('')}
                                        </select>
                                    </div>
                                    <div>
                                        <label for="size" class="block text-sm font-medium text-gray-700 mb-1">
                                            ũ�� ����
                                        </label>
                                        <input type="text" 
                                               id="size" 
                                               name="size"
                                               value="${this.data.formData.size}"
                                               placeholder="��: ���� 2m x ���� 1m"
                                               class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <div>
                                        <label for="width" class="block text-sm font-medium text-gray-700 mb-1">
                                            ���� (m)
                                        </label>
                                        <input type="number" 
                                               id="width" 
                                               name="width"
                                               value="${this.data.formData.width}"
                                               step="0.1"
                                               min="0"
                                               placeholder="0.0"
                                               class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    </div>
                                    <div>
                                        <label for="height" class="block text-sm font-medium text-gray-700 mb-1">
                                            ���� (m)
                                        </label>
                                        <input type="number" 
                                               id="height" 
                                               name="height"
                                               value="${this.data.formData.height}"
                                               step="0.1"
                                               min="0"
                                               placeholder="0.0"
                                               class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">
                                            ���� (��)
                                        </label>
                                        <div id="calculated-area" class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                                            0.0 ��
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- �ֹ� �� ���� -->
                            <div class="bg-gray-50 rounded-lg p-4">
                                <h4 class="text-md font-medium text-gray-900 mb-3">
                                    <i class="fas fa-info-circle mr-2"></i>�ֹ� ��
                                </h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label for="amount" class="block text-sm font-medium text-gray-700 mb-1">
                                            �ֹ� �ݾ� (��) <span class="text-red-500">*</span>
                                        </label>
                                        <input type="number" 
                                               id="amount" 
                                               name="amount"
                                               value="${this.data.formData.amount}"
                                               required
                                               min="0"
                                               step="1000"
                                               placeholder="0"
                                               class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                        <div id="estimated-price" class="text-xs text-gray-500 mt-1"></div>
                                    </div>
                                    <div>
                                        <label for="due-date" class="block text-sm font-medium text-gray-700 mb-1">
                                            ������ <span class="text-red-500">*</span>
                                        </label>
                                        <input type="date" 
                                               id="due-date" 
                                               name="due_date"
                                               value="${this.data.formData.due_date}"
                                               required
                                               min="${new Date().toISOString().split('T')[0]}"
                                               class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    </div>
                                </div>

                                ${this.data.isEditing ? `
                                <div class="mt-4">
                                    <label for="status" class="block text-sm font-medium text-gray-700 mb-1">
                                        �ֹ� ����
                                    </label>
                                    <select id="status" 
                                            name="status"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                        <option value="�ֹ�����" ${this.data.formData.status === '�ֹ�����' ? 'selected' : ''}>�ֹ�����</option>
                                        <option value="�����۾�" ${this.data.formData.status === '�����۾�' ? 'selected' : ''}>�����۾�</option>
                                        <option value="������" ${this.data.formData.status === '������' ? 'selected' : ''}>������</option>
                                        <option value="�Ϸ�" ${this.data.formData.status === '�Ϸ�' ? 'selected' : ''}>�Ϸ�</option>
                                    </select>
                                </div>
                                ` : ''}

                                <div class="mt-4">
                                    <label for="memo" class="block text-sm font-medium text-gray-700 mb-1">
                                        �޸�
                                    </label>
                                    <textarea id="memo" 
                                              name="memo" 
                                              rows="3"
                                              maxlength="1000"
                                              placeholder="�ֹ� ���� �޸� �Է��ϼ���"
                                              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none">${this.data.formData.memo}</textarea>
                                    <div class="text-xs text-gray-500 mt-1">�ִ� 1,000�ڱ��� �Է� �����մϴ�</div>
                                </div>
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

        // �ʱ� ��� ����
        this.calculateArea();
        this.calculateEstimatedPrice();
    },

    setupEventListeners() {
        const modal = document.getElementById('order-modal');
        const form = document.getElementById('order-form');
        const closeBtn = document.getElementById('close-modal-btn');
        const cancelBtn = document.getElementById('cancel-btn');
        const newCustomerBtn = document.getElementById('new-customer-btn');

        // ��� �ݱ�
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.close());
        }

        // ��� �ܺ� Ŭ��
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.close();
            });
        }

        // ESC Ű
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.data.isOpen) this.close();
        });

        // �� ����
        if (form) {
            form.addEventListener('submit', this.handleSubmit.bind(this));
        }

        // �� �� ���
        if (newCustomerBtn) {
            newCustomerBtn.addEventListener('click', () => {
                if (window.CustomerModal) {
                    CustomerModal.openForCreate();
                }
            });
        }

        this.setupFormEventListeners();
    },

    setupFormEventListeners() {
        // �� ����
        const customerSelect = document.getElementById('customer-select');
        if (customerSelect) {
            customerSelect.addEventListener('change', (e) => {
                this.updateCustomerInfo(e.target.value);
            });
            // �ʱ� �� ���� ǥ��
            if (customerSelect.value) {
                this.updateCustomerInfo(customerSelect.value);
            }
        }

        // ��ǰ ����
        const productSelect = document.getElementById('product-type');
        if (productSelect) {
            productSelect.addEventListener('change', () => {
                this.calculateEstimatedPrice();
            });
        }

        // ũ�� �Է�
        const widthInput = document.getElementById('width');
        const heightInput = document.getElementById('height');
        if (widthInput) {
            widthInput.addEventListener('input', () => {
                this.calculateArea();
                this.calculateEstimatedPrice();
            });
        }
        if (heightInput) {
            heightInput.addEventListener('input', () => {
                this.calculateArea();
                this.calculateEstimatedPrice();
            });
        }

        // �ݾ� ������
        const amountInput = document.getElementById('amount');
        if (amountInput) {
            amountInput.addEventListener('input', (e) => {
                this.formatAmount(e.target);
            });
        }
    },

    updateCustomerInfo(customerId) {
        const customer = this.data.customers.find(c => c.id == customerId);
        const infoDiv = document.getElementById('customer-info');

        if (customer && infoDiv) {
            document.getElementById('selected-customer-name').textContent = customer.name;
            document.getElementById('selected-customer-phone').textContent = customer.phone;
            document.getElementById('selected-customer-address').textContent = customer.address || '�ּ� ����';
            infoDiv.classList.remove('hidden');
        } else if (infoDiv) {
            infoDiv.classList.add('hidden');
        }
    },

    calculateArea() {
        const width = parseFloat(document.getElementById('width').value) || 0;
        const height = parseFloat(document.getElementById('height').value) || 0;
        const area = width * height;

        const areaDisplay = document.getElementById('calculated-area');
        if (areaDisplay) {
            areaDisplay.textContent = `${area.toFixed(2)} ��`;
        }

        return area;
    },

    calculateEstimatedPrice() {
        const productSelect = document.getElementById('product-type');
        const estimatedDiv = document.getElementById('estimated-price');

        if (!productSelect || !estimatedDiv) return;

        const selectedOption = productSelect.options[productSelect.selectedIndex];
        if (!selectedOption || !selectedOption.value) {
            estimatedDiv.textContent = '';
            return;
        }

        const unitPrice = parseFloat(selectedOption.dataset.price) || 0;
        const area = this.calculateArea();

        if (unitPrice > 0 && area > 0) {
            const estimatedPrice = unitPrice * area;
            estimatedDiv.textContent = `���� �ݾ�: ${formatCurrency(estimatedPrice)}`;

            // �ݾ� �ʵ忡 �ڵ� �Է� (������� ����)
            const amountInput = document.getElementById('amount');
            if (amountInput && !amountInput.value) {
                amountInput.value = Math.round(estimatedPrice);
            }
        } else {
            estimatedDiv.textContent = '';
        }
    },

    formatAmount(input) {
        let value = input.value.replace(/[^0-9]/g, '');
        if (value) {
            value = parseInt(value).toLocaleString();
        }
        input.value = value;
    },

    async handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const orderData = {
            customer_id: formData.get('customer_id'),
            product_type: formData.get('product_type'),
            size: formData.get('size').trim(),
            width: parseFloat(formData.get('width')) || 0,
            height: parseFloat(formData.get('height')) || 0,
            amount: parseInt(formData.get('amount').replace(/[^0-9]/g, '')) || 0,
            due_date: formData.get('due_date'),
            memo: formData.get('memo').trim()
        };

        if (this.data.isEditing) {
            orderData.status = formData.get('status');
        }

        // ��ȿ�� �˻�
        if (!this.validateForm(orderData)) {
            return;
        }

        const submitBtn = document.getElementById('submit-btn');
        const originalText = submitBtn.innerHTML;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>ó����...';

            if (this.data.isEditing) {
                await api.updateOrder(this.data.currentOrder.id, orderData);
                showSuccessMessage('�ֹ� ������ ���������� �����Ǿ����ϴ�.');
            } else {
                await api.createOrder(orderData);
                showSuccessMessage('�� �ֹ��� ���������� ��ϵǾ����ϴ�.');
            }

            // �ֹ� ��� ���ΰ�ħ
            if (window.OrdersComponent) {
                await OrdersComponent.loadOrders();
            }

            this.close();

        } catch (error) {
            console.error('�ֹ� ���� ����:', error);
            showErrorMessage(this.data.isEditing ? '�ֹ� ������ �����߽��ϴ�.' : '�ֹ� ��Ͽ� �����߽��ϴ�.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    },

    validateForm(data) {
        // �� ���� �˻�
        if (!data.customer_id) {
            showErrorMessage('���� �������ּ���.');
            return false;
        }

        // ��ǰ ���� �˻�
        if (!data.product_type) {
            showErrorMessage('��ǰ�� �������ּ���.');
            return false;
        }

        // �ݾ� �˻�
        if (!data.amount || data.amount < 1000) {
            showErrorMessage('�ݾ��� 1,000�� �̻��̾�� �մϴ�.');
            return false;
        }

        // ������ �˻�
        if (!data.due_date) {
            showErrorMessage('�������� �������ּ���.');
            return false;
        }

        const dueDate = new Date(data.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dueDate < today) {
            showErrorMessage('�������� ���� ���ķ� �������ּ���.');
            return false;
        }

        // �޸� ���� �˻�
        if (data.memo && data.memo.length > 1000) {
            showErrorMessage('�޸�� 1,000�� ���Ϸ� �Է����ּ���.');
            return false;
        }

        return true;
    },

    // �ܺο��� ȣ���� �� �ִ� �޼����
    openForEdit(order) {
        this.open(order);
    },

    openForCreate() {
        this.open();
    }
};

// ���� ������ ���� window ��ü�� �Ҵ�
window.OrderModal = OrderModal;