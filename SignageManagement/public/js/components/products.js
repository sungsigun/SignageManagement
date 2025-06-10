// js/components/products.js
import { formatCurrency } from '../utils.js';
import { api } from '../api.js';
import { showSuccessMessage, showErrorMessage } from '../ui.js';

export const ProductsComponent = {
    data: {
        products: [],
        filteredProducts: [],
        currentProduct: null,
        searchTerm: '',
        sortBy: 'name',
        sortOrder: 'asc'
    },

    async init() {
        await this.loadProducts();
        this.setupEventListeners();
    },

    async loadProducts() {
        try {
            console.log('📦 제품 데이터 로딩...');
            const products = await api.getProducts();
            this.data.products = products;
            this.data.filteredProducts = [...products];
            this.render();
            console.log(`✅ 제품 ${products.length}개 로드 완료`);
        } catch (error) {
            console.error('제품 로딩 실패:', error);
            this.renderError('제품 데이터를 불러오지 못했습니다.');
        }
    },

    setupEventListeners() {
        // 검색
        const searchInput = document.getElementById('product-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.data.searchTerm = e.target.value;
                this.filterProducts();
            });
        }

        // 정렬
        const sortSelect = document.getElementById('product-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                this.data.sortBy = sortBy;
                this.data.sortOrder = sortOrder;
                this.sortProducts();
            });
        }

        // 새 제품 등록 버튼
        const newProductBtn = document.getElementById('new-product-btn');
        if (newProductBtn) {
            newProductBtn.addEventListener('click', () => {
                this.openProductModal();
            });
        }
    },

    filterProducts() {
        const searchTerm = this.data.searchTerm.toLowerCase();
        this.data.filteredProducts = this.data.products.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm))
        );
        this.sortProducts();
    },

    sortProducts() {
        const { sortBy, sortOrder } = this.data;
        this.data.filteredProducts.sort((a, b) => {
            let valueA = a[sortBy];
            let valueB = b[sortBy];

            if (sortBy === 'unit_price') {
                valueA = parseFloat(valueA) || 0;
                valueB = parseFloat(valueB) || 0;
            } else {
                valueA = String(valueA).toLowerCase();
                valueB = String(valueB).toLowerCase();
            }

            if (sortOrder === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });
        this.render();
    },

    render() {
        const container = document.getElementById('products-table');
        if (!container) return;

        if (this.data.filteredProducts.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        container.innerHTML = this.data.filteredProducts.map(product => `
            <tr class="table-hover">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${product.name}</div>
                    <div class="text-sm text-gray-500">${product.description || ''}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${formatCurrency(product.unit_price)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${new Date(product.created_at).toLocaleDateString('ko-KR')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onclick="ProductsComponent.editProduct(${product.id})"
                            class="text-indigo-600 hover:text-indigo-900" title="제품 수정">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="ProductsComponent.deleteProduct(${product.id}, '${product.name.replace(/'/g, "\\'")}')"
                            class="text-red-600 hover:text-red-900" title="제품 삭제">
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
                <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                    <div class="flex flex-col items-center">
                        <i class="fas fa-box text-4xl text-gray-300 mb-2"></i>
                        <p class="text-lg font-medium">제품이 없습니다</p>
                        <p class="text-sm">새로운 제품을 등록해보세요</p>
                        <button onclick="ProductsComponent.openProductModal()" 
                                class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200">
                            <i class="fas fa-plus mr-2"></i>제품 등록
                        </button>
                    </div>
                </td>
            </tr>
        `;
    },

    renderError(message) {
        const container = document.getElementById('products-table');
        if (!container) return;

        container.innerHTML = `
            <tr>
                <td colspan="4" class="px-6 py-8 text-center text-red-500">
                    <div class="flex flex-col items-center">
                        <i class="fas fa-exclamation-triangle text-4xl text-red-300 mb-2"></i>
                        <p class="text-lg font-medium">오류 발생</p>
                        <p class="text-sm">${message}</p>
                        <button onclick="ProductsComponent.loadProducts()" 
                                class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200">
                            <i class="fas fa-refresh mr-2"></i>다시 시도
                        </button>
                    </div>
                </td>
            </tr>
        `;
    },

    updateStats() {
        const totalCount = this.data.products.length;
        const filteredCount = this.data.filteredProducts.length;
        const avgPrice = this.data.filteredProducts.length > 0
            ? this.data.filteredProducts.reduce((sum, p) => sum + (p.unit_price || 0), 0) / this.data.filteredProducts.length
            : 0;

        // 통계 업데이트
        const elements = {
            'products-total': totalCount,
            'products-filtered': filteredCount,
            'products-avg-price': formatCurrency(avgPrice)
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    },

    openProductModal(productId = null) {
        this.data.currentProduct = productId ?
            this.data.products.find(p => p.id === productId) : null;

        // 모달 HTML 생성
        const modalHtml = this.renderProductModal();

        // 모달을 body에 추가
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = modalHtml;
        document.body.appendChild(modalDiv.firstElementChild);

        // 모달 이벤트 리스너 설정
        this.setupProductModalEvents();
    },

    renderProductModal() {
        const product = this.data.currentProduct;
        const isEdit = !!product;

        return `
            <div id="product-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-lg font-medium text-gray-900">
                            <i class="fas fa-box mr-2"></i>
                            ${isEdit ? '제품 수정' : '새 제품 등록'}
                        </h3>
                    </div>
                    
                    <form id="product-form" class="px-6 py-4 space-y-4">
                        <div>
                            <label for="product-name" class="block text-sm font-medium text-gray-700">제품명 *</label>
                            <input type="text" id="product-name" name="name" required
                                   value="${product?.name || ''}"
                                   class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        
                        <div>
                            <label for="product-price" class="block text-sm font-medium text-gray-700">단가 (원) *</label>
                            <input type="number" id="product-price" name="unit_price" required min="0" step="1000"
                                   value="${product?.unit_price || ''}"
                                   class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        
                        <div>
                            <label for="product-description" class="block text-sm font-medium text-gray-700">설명</label>
                            <textarea id="product-description" name="description" rows="3"
                                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">${product?.description || ''}</textarea>
                        </div>
                        
                        <div class="flex justify-end space-x-3 pt-4">
                            <button type="button" id="cancel-product-btn"
                                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition duration-200">
                                취소
                            </button>
                            <button type="submit"
                                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition duration-200">
                                <i class="fas fa-save mr-1"></i>
                                ${isEdit ? '수정' : '등록'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    setupProductModalEvents() {
        const modal = document.getElementById('product-modal');
        const form = document.getElementById('product-form');
        const cancelBtn = document.getElementById('cancel-product-btn');

        // 취소 버튼
        cancelBtn.addEventListener('click', () => {
            this.closeProductModal();
        });

        // 모달 외부 클릭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeProductModal();
            }
        });

        // 폼 제출
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitProduct();
        });

        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeProductModal();
            }
        });
    },

    closeProductModal() {
        const modal = document.getElementById('product-modal');
        if (modal) {
            modal.remove();
        }
        this.data.currentProduct = null;
    },

    async submitProduct() {
        const form = document.getElementById('product-form');
        const formData = new FormData(form);

        const productData = {
            name: formData.get('name').trim(),
            unit_price: parseInt(formData.get('unit_price')),
            description: formData.get('description').trim()
        };

        // 유효성 검사
        if (!productData.name) {
            showErrorMessage('제품명을 입력해주세요.');
            return;
        }

        if (!productData.unit_price || productData.unit_price < 0) {
            showErrorMessage('올바른 단가를 입력해주세요.');
            return;
        }

        try {
            const isEdit = !!this.data.currentProduct;

            if (isEdit) {
                await api.updateProduct(this.data.currentProduct.id, productData);
                showSuccessMessage('제품이 성공적으로 수정되었습니다.');
            } else {
                await api.createProduct(productData);
                showSuccessMessage('제품이 성공적으로 등록되었습니다.');
            }

            this.closeProductModal();
            await this.loadProducts();

        } catch (error) {
            console.error('제품 저장 실패:', error);
            showErrorMessage(isEdit ? '제품 수정에 실패했습니다.' : '제품 등록에 실패했습니다.');
        }
    },

    async editProduct(productId) {
        this.openProductModal(productId);
    },

    async deleteProduct(productId, productName) {
        if (!confirm(`정말로 "${productName}" 제품을 삭제하시겠습니까?`)) {
            return;
        }

        try {
            await api.deleteProduct(productId);
            showSuccessMessage('제품이 성공적으로 삭제되었습니다.');
            await this.loadProducts();
        } catch (error) {
            console.error('제품 삭제 실패:', error);
            showErrorMessage('제품 삭제에 실패했습니다.');
        }
    }
};

// 전역 접근을 위한 window 객체에 할당
window.ProductsComponent = ProductsComponent;