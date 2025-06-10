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
            status: '주문접수'
        }
    },

    async open(order = null) {
        this.data.isEditing = !!order;
        this.data.currentOrder = order;

        // 고객 및 제품 데이터 로드
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
                status: order.status || '주문접수'
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
            status: '주문접수'
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
            console.error('초기 데이터 로드 실패:', error);
            showErrorMessage('고객 및 제품 정보를 불러오는데 실패했습니다.');
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
                                ${this.data.isEditing ? '주문 정보 수정' : '새 주문 등록'}
                            </h3>
                            <button id="close-modal-btn" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                    </div>
                    
                    <form id="order-form" class="px-6 py-4">
                        <div class="space-y-6">
                            <!-- 고객 정보 섹션 -->
                            <div class="bg-gray-50 rounded-lg p-4">
                                <h4 class="text-md font-medium text-gray-900 mb-3">
                                    <i class="fas fa-user mr-2"></i>고객 정보
                                </h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label for="customer-select" class="block text-sm font-medium text-gray-700 mb-1">
                                            고객 선택 <span class="text-red-500">*</span>
                                        </label>
                                        <select id="customer-select" 
                                                name="customer_id" 
                                                required
                                                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                            <option value="">고객을 선택하세요</option>
                                            ${this.data.customers.map(customer =>
            `<option value="${customer.id}" ${this.data.formData.customer_id == customer.id ? 'selected' : ''}>${customer.name} (${customer.phone})</option>`
        ).join('')}
                                        </select>
                                    </div>
                                    <div class="flex items-end">
                                        <button type="button" 
                                                id="new-customer-btn"
                                                class="w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            <i class="fas fa-plus mr-1"></i>새 고객 등록
                                        </button>
                                    </div>
                                </div>
                                <div id="customer-info" class="mt-3 p-3 bg-white rounded border hidden">
                                    <div class="text-sm text-gray-600">
                                        <div><strong>이름:</strong> <span id="selected-customer-name"></span></div>
                                        <div><strong>연락처:</strong> <span id="selected-customer-phone"></span></div>
                                        <div><strong>주소:</strong> <span id="selected-customer-address"></span></div>
                                    </div>
                                </div>
                            </div>

                            <!-- 제품 정보 섹션 -->
                            <div class="bg-gray-50 rounded-lg p-4">
                                <h4 class="text-md font-medium text-gray-900 mb-3">
                                    <i class="fas fa-box mr-2"></i>제품 정보
                                </h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label for="product-type" class="block text-sm font-medium text-gray-700 mb-1">
                                            제품 유형 <span class="text-red-500">*</span>
                                        </label>
                                        <select id="product-type" 
                                                name="product_type" 
                                                required
                                                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                            <option value="">제품을 선택하세요</option>
                                            ${this.data.products.map(product =>
            `<option value="${product.name}" data-price="${product.unit_price}" ${this.data.formData.product_type === product.name ? 'selected' : ''}>${product.name} (${formatCurrency(product.unit_price)})</option>`
        ).join('')}
                                        </select>
                                    </div>
                                    <div>
                                        <label for="size" class="block text-sm font-medium text-gray-700 mb-1">
                                            크기 설명
                                        </label>
                                        <input type="text" 
                                               id="size" 
                                               name="size"
                                               value="${this.data.formData.size}"
                                               placeholder="예: 가로 2m x 세로 1m"
                                               class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <div>
                                        <label for="width" class="block text-sm font-medium text-gray-700 mb-1">
                                            가로 (m)
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
                                            세로 (m)
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
                                            면적 (㎡)
                                        </label>
                                        <div id="calculated-area" class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                                            0.0 ㎡
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 주문 상세 섹션 -->
                            <div class="bg-gray-50 rounded-lg p-4">
                                <h4 class="text-md font-medium text-gray-900 mb-3">
                                    <i class="fas fa-info-circle mr-2"></i>주문 상세
                                </h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label for="amount" class="block text-sm font-medium text-gray-700 mb-1">
                                            주문 금액 (원) <span class="text-red-500">*</span>
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
                                            납기일 <span class="text-red-500">*</span>
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
                                        주문 상태
                                    </label>
                                    <select id="status" 
                                            name="status"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                        <option value="주문접수" ${this.data.formData.status === '주문접수' ? 'selected' : ''}>주문접수</option>
                                        <option value="도면작업" ${this.data.formData.status === '도면작업' ? 'selected' : ''}>도면작업</option>
                                        <option value="제작중" ${this.data.formData.status === '제작중' ? 'selected' : ''}>제작중</option>
                                        <option value="완료" ${this.data.formData.status === '완료' ? 'selected' : ''}>완료</option>
                                    </select>
                                </div>
                                ` : ''}

                                <div class="mt-4">
                                    <label for="memo" class="block text-sm font-medium text-gray-700 mb-1">
                                        메모
                                    </label>
                                    <textarea id="memo" 
                                              name="memo" 
                                              rows="3"
                                              maxlength="1000"
                                              placeholder="주문 관련 메모를 입력하세요"
                                              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none">${this.data.formData.memo}</textarea>
                                    <div class="text-xs text-gray-500 mt-1">최대 1,000자까지 입력 가능합니다</div>
                                </div>
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

        // 초기 계산 실행
        this.calculateArea();
        this.calculateEstimatedPrice();
    },

    setupEventListeners() {
        const modal = document.getElementById('order-modal');
        const form = document.getElementById('order-form');
        const closeBtn = document.getElementById('close-modal-btn');
        const cancelBtn = document.getElementById('cancel-btn');
        const newCustomerBtn = document.getElementById('new-customer-btn');

        // 모달 닫기
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.close());
        }

        // 모달 외부 클릭
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.close();
            });
        }

        // ESC 키
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.data.isOpen) this.close();
        });

        // 폼 제출
        if (form) {
            form.addEventListener('submit', this.handleSubmit.bind(this));
        }

        // 새 고객 등록
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
        // 고객 선택
        const customerSelect = document.getElementById('customer-select');
        if (customerSelect) {
            customerSelect.addEventListener('change', (e) => {
                this.updateCustomerInfo(e.target.value);
            });
            // 초기 고객 정보 표시
            if (customerSelect.value) {
                this.updateCustomerInfo(customerSelect.value);
            }
        }

        // 제품 선택
        const productSelect = document.getElementById('product-type');
        if (productSelect) {
            productSelect.addEventListener('change', () => {
                this.calculateEstimatedPrice();
            });
        }

        // 크기 입력
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

        // 금액 포맷팅
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
            document.getElementById('selected-customer-address').textContent = customer.address || '주소 없음';
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
            areaDisplay.textContent = `${area.toFixed(2)} ㎡`;
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
            estimatedDiv.textContent = `예상 금액: ${formatCurrency(estimatedPrice)}`;

            // 금액 필드에 자동 입력 (비어있을 때만)
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

        // 유효성 검사
        if (!this.validateForm(orderData)) {
            return;
        }

        const submitBtn = document.getElementById('submit-btn');
        const originalText = submitBtn.innerHTML;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>처리중...';

            if (this.data.isEditing) {
                await api.updateOrder(this.data.currentOrder.id, orderData);
                showSuccessMessage('주문 정보가 성공적으로 수정되었습니다.');
            } else {
                await api.createOrder(orderData);
                showSuccessMessage('새 주문이 성공적으로 등록되었습니다.');
            }

            // 주문 목록 새로고침
            if (window.OrdersComponent) {
                await OrdersComponent.loadOrders();
            }

            this.close();

        } catch (error) {
            console.error('주문 저장 실패:', error);
            showErrorMessage(this.data.isEditing ? '주문 수정에 실패했습니다.' : '주문 등록에 실패했습니다.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    },

    validateForm(data) {
        // 고객 선택 검사
        if (!data.customer_id) {
            showErrorMessage('고객을 선택해주세요.');
            return false;
        }

        // 제품 선택 검사
        if (!data.product_type) {
            showErrorMessage('제품을 선택해주세요.');
            return false;
        }

        // 금액 검사
        if (!data.amount || data.amount < 1000) {
            showErrorMessage('금액은 1,000원 이상이어야 합니다.');
            return false;
        }

        // 납기일 검사
        if (!data.due_date) {
            showErrorMessage('납기일을 선택해주세요.');
            return false;
        }

        const dueDate = new Date(data.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dueDate < today) {
            showErrorMessage('납기일은 오늘 이후로 설정해주세요.');
            return false;
        }

        // 메모 길이 검사
        if (data.memo && data.memo.length > 1000) {
            showErrorMessage('메모는 1,000자 이하로 입력해주세요.');
            return false;
        }

        return true;
    },

    // 외부에서 호출할 수 있는 메서드들
    openForEdit(order) {
        this.open(order);
    },

    openForCreate() {
        this.open();
    }
};

// 전역 접근을 위한 window 객체에 할당
window.OrderModal = OrderModal;