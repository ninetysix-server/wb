import {
    supabase,
    getCurrentUser,
    getOrCreateClientId,
    getCustomerProfile,
    saveCustomerProfile,
    validateSketchFile,
    uploadOrderSketch,
    saveOrder
} from './supabase.js';

let validationMessageTimer = null;

function showValidationMessage(message) {
    const popup =
        document.getElementById(
            "validationMessage"
        );

    const messageText =
        document.getElementById(
            "validationMessageText"
        );

    if (!popup || !messageText) {
        console.warn(message);
        return;
    }

    clearTimeout(validationMessageTimer);

    messageText.textContent = message;

    popup.classList.add("show");
    popup.setAttribute(
        "aria-hidden",
        "false"
    );

    validationMessageTimer = setTimeout(
        hideValidationMessage,
        3500
    );
}

function hideValidationMessage() {
    const popup =
        document.getElementById(
            "validationMessage"
        );

    if (!popup) {
        return;
    }

    popup.classList.remove("show");
    popup.setAttribute(
        "aria-hidden",
        "true"
    );
}

document
    .getElementById(
        "closeValidationMessage"
    )
    ?.addEventListener(
        "click",
        hideValidationMessage
    );

class CartManager {
    constructor() {
        this.cartKey = 'designStudioCart';
        this.guestKey = 'designStudioGuestCart';
        this.cart = [];
        this.loadCart();
    }

    async loadCart() {
        const user = await this.getCurrentUser();
        let json;
        if (user) {
            json = localStorage.getItem(`${this.cartKey}_${user.id}`);
            if (!json) {
                const guest = localStorage.getItem(this.guestKey);
                if (guest) {
                    localStorage.setItem(`${this.cartKey}_${user.id}`, guest);
                    localStorage.removeItem(this.guestKey);
                    json = guest;
                }
            }
        } else {
            json = localStorage.getItem(this.guestKey);
        }
        this.cart = json ? JSON.parse(json) : [];
        this.updateUI();
        this.updateBadge();
    }

    async saveCart() {
        const user = await this.getCurrentUser();
        const key = user ? `${this.cartKey}_${user.id}` : this.guestKey;
        localStorage.setItem(key, JSON.stringify(this.cart));
        this.updateBadge();
        this.updateUI();
    }

    async getCurrentUser() {
        try {
            const user = await getCurrentUser();
            if (user) {
                const clientId = await getOrCreateClientId(user.id);
                return { id: user.id, email: user.email, clientId };
            }
            return null;
        } catch {
            return null;
        }
    }

    createConfigurationKey(
    serviceId,
    tierName,
    details = {}
) {
    const printingSelected =
        details.printingSelected === true;

    const configuration = {
        serviceId,
        tierName,

        pages: Number(
            details.pages || 0
        ),

        printingSelected,

        printingOptionId: printingSelected
            ? details.printingOptionId || null
            : null,

        printingSize: printingSelected
            ? details.printingSize || null
            : null,

        printingCopies: printingSelected
            ? Number(details.printingCopies || 0)
            : 0,

        printingPricePerCopy: printingSelected
            ? Number(
                details.printingPricePerCopy || 0
            )
            : 0,

        addonId:
            details.addonId || null,

        parentServiceId:
            details.parentServiceId || null
    };

    return JSON.stringify(configuration);
}

    addItem(
    serviceId,
    tierName,
    title,
    price,
    qty = 1,
    details = {}
) {
    const priceNum = this.parsePrice(price);

    const configurationKey =
        this.createConfigurationKey(
            serviceId,
            tierName,
            details
        );

    const existing = this.cart.find(item => {
        const existingKey =
            item.configurationKey ||
            this.createConfigurationKey(
                item.serviceId,
                item.tierName,
                item.details || {}
            );

        return existingKey === configurationKey;
    });

    if (existing) {
        existing.quantity += qty;
    } else {
        this.cart.push({
            id: `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`,

            serviceId,
            tierName,
            serviceTitle: title,

            price: priceNum,
            quantity: qty,

            details,
            configurationKey,

            addedAt: new Date().toISOString()
        });
    }

    this.saveCart();

    return true;
}
    parsePrice(str) {
        if (typeof str === 'number') return str;
        const match = str.match(/R\s*(\d+(\.\d+)?)/);
        return match ? parseFloat(match[1]) : 0;
    }

    removeItem(id) {
        this.cart = this.cart.filter(i => i.id !== id);
        this.saveCart();
        this.updateUI();
        this.updateBadge();
    }

    updateQuantity(id, qty) {
        const item = this.cart.find(i => i.id === id);
        if (item) { 
            item.quantity = Math.max(1, qty); 
            this.saveCart();
            this.updateUI();
            this.updateBadge();
        }
    }

    getSubtotal() {
        return this.cart.reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0);
    }

    getTotal() { return this.getSubtotal(); }

    clearCart() { this.cart = []; this.saveCart(); }

    isEmpty() { return this.cart.length === 0; }

    updateBadge() {
        const total = this.cart.reduce((s, i) => s + (i.quantity || 1), 0);
        document.querySelectorAll('.cart-badge').forEach(b => {
            b.textContent = total;
            b.style.display = total > 0 ? 'flex' : 'none';
        });
    }

    updateUI() {
        const list = document.getElementById('cartItemsList');
        const empty = document.getElementById('cartEmptyState');
        const container = document.getElementById('cartItemsContainer');
        const footer = document.getElementById('cartFooter');
        const proceed = document.getElementById('proceedToConfirmation');

        if (this.isEmpty()) {
            if (empty) empty.style.display = 'block';
            if (container) container.style.display = 'none';
            if (footer) footer.style.display = 'none';
            if (list) list.innerHTML = '';
            if (proceed) proceed.disabled = true;
        } else {
            if (empty) empty.style.display = 'none';
            if (container) container.style.display = 'block';
            if (footer) footer.style.display = 'block';
            if (proceed) proceed.disabled = false;
            if (list) {
                list.innerHTML = '';
                this.cart.forEach(item => list.appendChild(this.createItemHTML(item)));
            }
            const subtotalEl = document.getElementById('cartSubtotal');
            const totalEl = document.getElementById('cartGrandTotal');
            if (subtotalEl) subtotalEl.textContent = `R${this.getSubtotal().toFixed(2)}`;
            if (totalEl) totalEl.textContent = `R${this.getTotal().toFixed(2)}`;
        }
    }

    createItemDetailsHTML(item, confirmation = false) {
    const details = item.details || {};
    const rows = [];

    if (details.pages) {
        rows.push(`
            <div class="cart-selection-row">
                <span>Pages</span>
                <strong>${details.pages}</strong>
            </div>
        `);

        rows.push(`
            <div class="cart-selection-row">
                <span>First page</span>
                <strong>R${Number(details.basePrice || 0).toFixed(2)}</strong>
            </div>
        `);

        if (Number(details.additionalPages) > 0) {
            rows.push(`
                <div class="cart-selection-row">
                    <span>
                        Additional pages
                        (${details.additionalPages} ×
                        R${Number(details.pricePerPage || 0).toFixed(2)})
                    </span>

                    <strong>
                        R${(
                            Number(details.additionalPages || 0) *
                            Number(details.pricePerPage || 0)
                        ).toFixed(2)}
                    </strong>
                </div>
            `);
        }
    }

    if (details.addonName) {
        rows.push(`
            <div class="cart-selection-row">
                <span>Website add-on</span>
                <strong>${details.addonName}</strong>
            </div>
        `);

        if (details.parentServiceTitle) {
            rows.push(`
                <div class="cart-selection-row">
                    <span>Service</span>
                    <strong>${details.parentServiceTitle}</strong>
                </div>
            `);
        }
    }

    if (
        details.category &&
        !details.pages &&
        !details.addonName
    ) {
        rows.push(`
            <div class="cart-selection-row">
                <span>Category</span>
                <strong>${details.category}</strong>
            </div>
        `);
    }

    if (Number(details.discountPercentage) > 0) {
        rows.push(`
            <div class="cart-selection-row">
                <span>Discount</span>
                <strong>${details.discountPercentage}% off</strong>
            </div>
        `);
    }

    if (details.printingSelected === true) {
    const printingSize =
        details.printingSize || 'Standard';

    const printingCopies = Number(
        details.printingCopies || 0
    );

    const printingPricePerCopy = Number(
        details.printingPricePerCopy || 0
    );

    const printingTotal = Number(
        details.printingPrice || 0
    );

    let designTotal = 0;

    if (details.pages) {
        designTotal =
            Number(details.basePrice || 0) +
            (
                Number(details.additionalPages || 0) *
                Number(details.pricePerPage || 0)
            );
    } else {
        designTotal = Number(
            details.servicePrice || 0
        );
    }

    rows.push(`
        <div class="cart-selection-heading">
            Printing details
        </div>

        <div class="cart-selection-row">
            <span>Print size</span>
            <strong>${printingSize}</strong>
        </div>

        <div class="cart-selection-row">
            <span>Copies</span>
            <strong>${printingCopies}</strong>
        </div>

        <div class="cart-selection-row">
            <span>Price per copy</span>

            <strong>
                R${printingPricePerCopy.toFixed(2)}
            </strong>
        </div>

        <div class="cart-selection-row">
            <span>
                Printing calculation
            </span>

            <strong>
                ${printingCopies}
                ×
                R${printingPricePerCopy.toFixed(2)}
            </strong>
        </div>

        <div class="cart-selection-divider"></div>

        <div class="cart-selection-row">
            <span>Design</span>

            <strong>
                R${designTotal.toFixed(2)}
            </strong>
        </div>

        <div class="cart-selection-row">
            <span>Printing</span>

            <strong>
                R${printingTotal.toFixed(2)}
            </strong>
        </div>

        <div class="cart-selection-row cart-selection-total">
            <span>Unit total</span>

            <strong>
                R${(
                    designTotal +
                    printingTotal
                ).toFixed(2)}
            </strong>
        </div>
    `);
}

    return `
        <div class="${
            confirmation
                ? 'confirmation-selection-summary'
                : 'cart-selection-summary'
        }">
            ${rows.join('')}
        </div>
    `;
}

    createItemHTML(item) {
        const li = document.createElement('li');
        li.className = 'cart-item';
        li.dataset.itemId = item.id;
        const total = item.price * (item.quantity || 1);
        li.innerHTML = `
            <div class="cart-item-header">
                <div class="cart-item-title">${item.serviceTitle}</div>
                <span class="cart-item-tier">${item.tierName}</span>
                <button class="cart-item-remove" data-id="${item.id}"><i class="fas fa-trash"></i></button>
            </div>
            <div class="cart-item-details">
                <div class="cart-detail-group"><div class="cart-detail-label">Unit Price</div><div class="cart-detail-value cart-item-price">R${item.price.toFixed(2)}</div></div>
                <div class="cart-detail-group"><div class="cart-detail-label">Quantity</div><div class="cart-detail-value">${item.quantity || 1}</div></div>
            </div>

            ${this.createItemDetailsHTML(item)}

            <div class="cart-item-footer">
                <div class="cart-quantity-controls">
                    <button class="cart-quantity-btn minus" data-id="${item.id}"><i class="fas fa-minus"></i></button>
                    <span class="cart-quantity">${item.quantity || 1}</span>
                    <button class="cart-quantity-btn plus" data-id="${item.id}"><i class="fas fa-plus"></i></button>
                </div>
                <div class="cart-item-total">R${total.toFixed(2)}</div>
            </div>
        `;
        return li;
    }

    createConfirmationHTML(item) {
        const li = document.createElement('li');
        li.className = 'confirmation-item';
        const total = item.price * (item.quantity || 1);
        li.innerHTML = `
            <div class="confirmation-item-header">
                <div class="confirmation-item-title">${item.serviceTitle}</div>
                <span class="confirmation-item-tier">${item.tierName}</span>
            </div>
            <div class="confirmation-item-details">
                <div class="confirmation-detail-group"><div class="confirmation-detail-label">Unit Price</div><div class="confirmation-detail-value confirmation-item-price">R${item.price.toFixed(2)}</div></div>
                <div class="confirmation-detail-group"><div class="confirmation-detail-label">Quantity</div><div class="confirmation-detail-value">${item.quantity || 1}</div></div>
            </div>

            ${this.createItemDetailsHTML(item, true)}

            <div class="confirmation-item-footer">
                <div hidden class="confirmation-quantity"><i class="fas fa-box"></i> Qty: ${item.quantity || 1}</div>
                <div class="confirmation-item-total">R${total.toFixed(2)}</div>
            </div>
        `;
        return li;
    }

    updateConfirmationUI() {
        const list = document.getElementById('confirmationItemsList');
        if (list) {
            list.innerHTML = '';
            this.cart.forEach(item => list.appendChild(this.createConfirmationHTML(item)));
        }
        const subtotalEl = document.getElementById('confirmationSubtotal');
        const totalEl = document.getElementById('confirmationTotal');
        if (subtotalEl) subtotalEl.textContent = `R${this.getSubtotal().toFixed(2)}`;
        if (totalEl) totalEl.textContent = `R${this.getTotal().toFixed(2)}`;
    }

    setupEvents() {
        document.addEventListener('click', e => {
            const remove = e.target.closest('.cart-item-remove');
            if (remove) {
                e.preventDefault();
                e.stopPropagation();
                const id = remove.dataset.id;
                if (id) {
                    this.removeItem(id);
                    this.updateUI();
                    this.updateBadge();
                }
                return;
            }
            
            const minus = e.target.closest('.cart-quantity-btn.minus');
            if (minus) {
                e.preventDefault();
                e.stopPropagation();
                const id = minus.dataset.id;
                if (id) {
                    const item = this.cart.find(i => i.id === id);
                    if (item && (item.quantity || 1) > 1) {
                        this.updateQuantity(id, (item.quantity || 1) - 1);
                    }
                    this.updateUI();
                    this.updateBadge();
                }
                return;
            }
            
            const plus = e.target.closest('.cart-quantity-btn.plus');
            if (plus) {
                e.preventDefault();
                e.stopPropagation();
                const id = plus.dataset.id;
                if (id) {
                    const item = this.cart.find(i => i.id === id);
                    if (item) {
                        this.updateQuantity(id, (item.quantity || 1) + 1);
                    }
                    this.updateUI();
                    this.updateBadge();
                }
                return;
            }
        });
    }
}

function getCheckoutField(id) {
    return document.getElementById(id);
}


function setCheckoutFieldValue(id, value) {
    const field = getCheckoutField(id);

    if (field) {
        field.value = value ?? '';
    }
}


function checkoutHasPrinting() {
    return cartManager.cart.some(item =>
        item?.details?.printingSelected === true
    );
}


function setDeliverySectionVisibility() {
    const deliverySection = getCheckoutField(
        'deliveryAddressSection'
    );

    if (!deliverySection) {
        return;
    }

    deliverySection.hidden = !checkoutHasPrinting();
}


function populateCustomerProfile(profile = {}) {
    setCheckoutFieldValue(
        'customerWhatsapp',
        profile.whatsapp_number
    );

    setCheckoutFieldValue(
        'homeRecipientName',
        profile.home_recipient_name
    );

    setCheckoutFieldValue(
        'homeAddressLine1',
        profile.home_address_line_1
    );

    setCheckoutFieldValue(
        'homeAddressLine2',
        profile.home_address_line_2
    );

    setCheckoutFieldValue(
        'homeArea',
        profile.home_area
    );

    setCheckoutFieldValue(
        'homeCity',
        profile.home_city
    );

    setCheckoutFieldValue(
        'homeProvince',
        profile.home_province
    );

    setCheckoutFieldValue(
        'homePostalCode',
        profile.home_postal_code
    );

    setCheckoutFieldValue(
        'deliveryRecipientName',
        profile.delivery_recipient_name
    );

    setCheckoutFieldValue(
        'deliveryPhone',
        profile.delivery_phone
    );

    setCheckoutFieldValue(
        'deliveryAddressLine1',
        profile.delivery_address_line_1
    );

    setCheckoutFieldValue(
        'deliveryAddressLine2',
        profile.delivery_address_line_2
    );

    setCheckoutFieldValue(
        'deliveryArea',
        profile.delivery_area
    );

    setCheckoutFieldValue(
        'deliveryCity',
        profile.delivery_city
    );

    setCheckoutFieldValue(
        'deliveryProvince',
        profile.delivery_province
    );

    setCheckoutFieldValue(
        'deliveryPostalCode',
        profile.delivery_postal_code
    );

    setCheckoutFieldValue(
        'deliveryInstructions',
        profile.delivery_instructions
    );
}


async function loadCheckoutCustomerProfile() {
    const user = await cartManager.getCurrentUser();

    if (!user) {
        return;
    }

    const {
        data,
        error
    } = await getCustomerProfile(user.id);

    if (error) {
        console.error(
            'Unable to load checkout customer profile:',
            error
        );

        return;
    }

    populateCustomerProfile(data || {});
}


function copyHomeAddressToDelivery() {
    const useHomeAddress = getCheckoutField(
        'useHomeAddressForDelivery'
    )?.checked === true;

    if (!useHomeAddress) {
        return;
    }

    setCheckoutFieldValue(
        'deliveryRecipientName',
        getCheckoutField('homeRecipientName')?.value
    );

    setCheckoutFieldValue(
        'deliveryPhone',
        getCheckoutField('customerWhatsapp')?.value
    );

    setCheckoutFieldValue(
        'deliveryAddressLine1',
        getCheckoutField('homeAddressLine1')?.value
    );

    setCheckoutFieldValue(
        'deliveryAddressLine2',
        getCheckoutField('homeAddressLine2')?.value
    );

    setCheckoutFieldValue(
        'deliveryArea',
        getCheckoutField('homeArea')?.value
    );

    setCheckoutFieldValue(
        'deliveryCity',
        getCheckoutField('homeCity')?.value
    );

    setCheckoutFieldValue(
        'deliveryProvince',
        getCheckoutField('homeProvince')?.value
    );

    setCheckoutFieldValue(
        'deliveryPostalCode',
        getCheckoutField('homePostalCode')?.value
    );
}

let selectedSketchFile = null;


function formatSketchFileSize(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) {
        return '0 MB';
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}


function clearSelectedSketch() {
    selectedSketchFile = null;

    const input =
        document.getElementById('sketchFile');

    const preview =
        document.getElementById('sketchFilePreview');

    const progress =
        document.getElementById('sketchUploadProgress');

    const progressFill =
        document.getElementById('sketchProgressFill');

    if (input) {
        input.value = '';
    }

    if (preview) {
        preview.hidden = true;
    }

    if (progress) {
        progress.hidden = true;
    }

    if (progressFill) {
        progressFill.style.width = '0%';
    }
}


function showSelectedSketch(file) {
    const preview =
        document.getElementById('sketchFilePreview');

    const fileName =
        document.getElementById('sketchFileName');

    const fileSize =
        document.getElementById('sketchFileSize');

    const previewIcon =
        document.getElementById('sketchPreviewIcon');

    if (fileName) {
        fileName.textContent = file.name;
    }

    if (fileSize) {
        fileSize.textContent =
            formatSketchFileSize(file.size);
    }

    if (previewIcon) {
        previewIcon.className =
            file.type === 'application/pdf'
                ? 'fas fa-file-pdf'
                : 'fas fa-file-image';
    }

    if (preview) {
        preview.hidden = false;
    }
}


function updateSketchUploadProgress(
    text,
    percentage
) {
    const progress =
        document.getElementById(
            'sketchUploadProgress'
        );

    const status =
        document.getElementById(
            'sketchUploadStatus'
        );

    const percentageText =
        document.getElementById(
            'sketchUploadPercentage'
        );

    const progressFill =
        document.getElementById(
            'sketchProgressFill'
        );

    if (progress) {
        progress.hidden = false;
    }

    if (status) {
        status.textContent = text;
    }

    if (percentageText) {
        percentageText.textContent =
            `${percentage}%`;
    }

    if (progressFill) {
        progressFill.style.width =
            `${percentage}%`;
    }
}

export const cartManager = new CartManager();

const popup = {
    open: () => {
        document.getElementById('cartPopup').classList.add('active');
        document.body.style.overflow = 'hidden';
        cartManager.updateUI();
        cartManager.updateBadge();
    },
    close: () => {
        document.getElementById('cartPopup').classList.remove('active');
        document.body.style.overflow = 'auto';
    },
    
    openConfirmation: async () => {
    if (cartManager.isEmpty()) {
        popup.showToast(
            'Your cart is empty!',
            'error'
        );

        return;
    }

    popup.close();

    document
        .getElementById('confirmationPopup')
        ?.classList.add('active');

    document.body.style.overflow = 'hidden';

    cartManager.updateConfirmationUI();

    setDeliverySectionVisibility();

    setCheckoutFieldValue(
        'designDescription',
        ''
    );

    setCheckoutFieldValue(
        'preferredColors',
        ''
    );

    clearSelectedSketch();

    const deliveryCheckbox = getCheckoutField(
        'useHomeAddressForDelivery'
    );

    if (deliveryCheckbox) {
        deliveryCheckbox.checked = false;
    }

    await loadCheckoutCustomerProfile();
},

    closeConfirmation: () => {
        document.getElementById('confirmationPopup').classList.remove('active');
        document.body.style.overflow = 'auto';
    },
    showToast: (message, type = 'success') => {
        document.querySelectorAll('.custom-toast, .toast-notification').forEach(t => t.remove());
        
        const toast = document.createElement('div');
        toast.className = `custom-toast ${type}`;
        const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
        toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
        
        const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
        
    
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => {
            toast.classList.add("show");
        });
        
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }
};

function createOrderCartSnapshot(cart) {
    return cart.map(item => {
        const details = item.details || {};

        const quantity = Math.max(
            1,
            Number(item.quantity || 1)
        );

        const unitTotal = Number(
            item.price || 0
        );

        const printingSelected =
            details.printingSelected === true;

        const printingTotal = printingSelected
            ? Number(details.printingPrice || 0)
            : 0;

        let designTotal = 0;

        if (details.pages) {
            designTotal =
                Number(details.basePrice || 0) +
                (
                    Number(details.additionalPages || 0) *
                    Number(details.pricePerPage || 0)
                );
        } else if (details.addonName) {
            designTotal = Number(
                details.addonPrice || unitTotal
            );
        } else {
            designTotal = Number(
                details.servicePrice ??
                unitTotal - printingTotal
            );
        }

        return {
            id: item.id,
            serviceId: item.serviceId,
            serviceTitle: item.serviceTitle,
            tierName: item.tierName,

            price: unitTotal,
            quantity,

            lineTotal:
                unitTotal * quantity,

            configurationKey:
                item.configurationKey || null,

            details: {
                ...details,

                designTotal,
                printingSelected,

                printing: printingSelected
                    ? {
                        optionId:
                            details.printingOptionId || null,

                        size:
                            details.printingSize || null,

                        copies: Number(
                            details.printingCopies || 0
                        ),

                        pricePerCopy: Number(
                            details.printingPricePerCopy || 0
                        ),

                        total: printingTotal
                    }
                    : null,

                calculatedTotal:
                    Number(
                        details.calculatedTotal ||
                        unitTotal
                    )
            },

            addedAt:
                item.addedAt ||
                new Date().toISOString()
        };
    });
}

function calculateOrderBreakdown(cartSnapshot) {
    return cartSnapshot.reduce(
        (totals, item) => {
            const quantity = Number(
                item.quantity || 1
            );

            const details =
                item.details || {};

            const designUnitTotal = Number(
                details.designTotal || 0
            );

            const printingUnitTotal =
                details.printingSelected === true
                    ? Number(
                        details.printing?.total ||
                        details.printingPrice ||
                        0
                    )
                    : 0;

            totals.design +=
                designUnitTotal * quantity;

            totals.printing +=
                printingUnitTotal * quantity;

            totals.total +=
                Number(item.price || 0) *
                quantity;

            return totals;
        },
        {
            design: 0,
            printing: 0,
            total: 0
        }
    );
}

function getCheckoutText(id) {
    return String(
        getCheckoutField(id)?.value || ''
    ).trim();
}


function collectCustomerProfileDetails() {
    return {
        whatsapp_number:
            getCheckoutText('customerWhatsapp'),

        home_recipient_name:
            getCheckoutText('homeRecipientName'),

        home_address_line_1:
            getCheckoutText('homeAddressLine1'),

        home_address_line_2:
            getCheckoutText('homeAddressLine2'),

        home_area:
            getCheckoutText('homeArea'),

        home_city:
            getCheckoutText('homeCity'),

        home_province:
            getCheckoutText('homeProvince'),

        home_postal_code:
            getCheckoutText('homePostalCode'),

        delivery_recipient_name:
            getCheckoutText('deliveryRecipientName'),

        delivery_phone:
            getCheckoutText('deliveryPhone'),

        delivery_address_line_1:
            getCheckoutText('deliveryAddressLine1'),

        delivery_address_line_2:
            getCheckoutText('deliveryAddressLine2'),

        delivery_area:
            getCheckoutText('deliveryArea'),

        delivery_city:
            getCheckoutText('deliveryCity'),

        delivery_province:
            getCheckoutText('deliveryProvince'),

        delivery_postal_code:
            getCheckoutText('deliveryPostalCode'),

        delivery_instructions:
            getCheckoutText('deliveryInstructions')
    };
}


function validateCustomerProfile(
    profile,
    printingRequested
) {
    const requiredHomeFields = [
        ['whatsapp_number', 'WhatsApp number'],
        ['home_recipient_name', 'full name'],
        ['home_address_line_1', 'home address'],
        ['home_area', 'area or suburb'],
        ['home_city', 'city or town'],
        ['home_province', 'province'],
        ['home_postal_code', 'postal code']
    ];

    for (const [field, label] of requiredHomeFields) {
        if (!profile[field]) {
            return `Please enter your ${label}`;
        }
    }

    const phoneDigits =
        profile.whatsapp_number.replace(/\D/g, '');

    if (phoneDigits.length < 9) {
        return 'Please enter a valid WhatsApp number';
    }

    if (
        profile.home_postal_code &&
        !/^\d{4}$/.test(profile.home_postal_code)
    ) {
        return 'Please enter a valid 4-digit home postal code';
    }

    if (!printingRequested) {
        return null;
    }

    const requiredDeliveryFields = [
        ['delivery_recipient_name', 'delivery recipient name'],
        ['delivery_phone', 'delivery contact number'],
        ['delivery_address_line_1', 'delivery address'],
        ['delivery_area', 'delivery area or suburb'],
        ['delivery_city', 'delivery city or town'],
        ['delivery_province', 'delivery province'],
        ['delivery_postal_code', 'delivery postal code']
    ];

    for (const [field, label] of requiredDeliveryFields) {
        if (!profile[field]) {
            return `Please enter the ${label}`;
        }
    }

    if (
        !/^\d{4}$/.test(
            profile.delivery_postal_code
        )
    ) {
        return 'Please enter a valid 4-digit delivery postal code';
    }

    return null;
}


function createCustomerSnapshot(profile) {
    return {
        whatsappNumber:
            profile.whatsapp_number,

        fullName:
            profile.home_recipient_name
    };
}


function createHomeAddressSnapshot(profile) {
    return {
        recipientName:
            profile.home_recipient_name,

        addressLine1:
            profile.home_address_line_1,

        addressLine2:
            profile.home_address_line_2,

        area:
            profile.home_area,

        city:
            profile.home_city,

        province:
            profile.home_province,

        postalCode:
            profile.home_postal_code
    };
}


function createDeliveryAddressSnapshot(profile) {
    return {
        recipientName:
            profile.delivery_recipient_name,

        phone:
            profile.delivery_phone,

        addressLine1:
            profile.delivery_address_line_1,

        addressLine2:
            profile.delivery_address_line_2,

        area:
            profile.delivery_area,

        city:
            profile.delivery_city,

        province:
            profile.delivery_province,

        postalCode:
            profile.delivery_postal_code,

        instructions:
            profile.delivery_instructions
    };
}

document.addEventListener('DOMContentLoaded', function() {
    cartManager.setupEvents();

    document
        .getElementById('sketchFile')
        ?.addEventListener(
            'change',
            function() {
                const file =
                    this.files?.[0] || null;

                if (!file) {
                    clearSelectedSketch();
                    return;
                }

                const validationError =
                    validateSketchFile(file);

                if (validationError) {
                    popup.showToast(
                        validationError.message,
                        'error'
                    );

                    clearSelectedSketch();
                    return;
                }

                selectedSketchFile = file;
                showSelectedSketch(file);
            }
        );

    document
        .getElementById('removeSketchFile')
        ?.addEventListener(
            'click',
            clearSelectedSketch
        );

    document
    .getElementById('useHomeAddressForDelivery')
    ?.addEventListener(
        'change',
        copyHomeAddressToDelivery
    );
    
    document.querySelectorAll('.cart-icon, .cart-icon-mobile, .nav-icon[href="#"]').forEach(el => {
        el.addEventListener('click', function(e) { 
            e.preventDefault(); 
            popup.open(); 
        });
    });
    
    document.getElementById('closeCart')?.addEventListener('click', popup.close);
    document.getElementById('cartPopup')?.addEventListener('click', function(e) { 
        if (e.target === e.currentTarget) popup.close(); 
    });
    document.getElementById('continueShopping')?.addEventListener('click', popup.close);
    document.getElementById('cartBrowseServices')?.addEventListener('click', function() {
        popup.close();
        document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('proceedToConfirmation')?.addEventListener('click', popup.openConfirmation);
    
    document.getElementById('closeConfirmation')?.addEventListener('click', popup.closeConfirmation);
    document.getElementById('confirmationPopup')?.addEventListener('click', function(e) { 
        if (e.target === e.currentTarget) popup.closeConfirmation(); 
    });
    document.getElementById('backToCart')?.addEventListener('click', function() {
        popup.closeConfirmation();
        popup.open();
    });
    
   document
    .getElementById('proceedToCheckout')
    ?.addEventListener(
        'click',
        async function() {
            const checkoutButton = this;

            const description =
                getCheckoutText(
                    'designDescription'
                );

            if (!description) {
                popup.showToast(
                    'Please provide a design description',
                    'error'
                );

                return;
            }

            const user =
                await cartManager.getCurrentUser();

            if (!user) {
                popup.showToast(
                    'Please login to proceed',
                    'error'
                );

                popup.closeConfirmation();

                setTimeout(() => {
                    document
                        .getElementById(
                            'desktopAuthOverlay'
                        )
                        ?.classList.add('active');

                    document.body.style.overflow =
                        'hidden';
                }, 500);

                return;
            }

            const printingRequested =
                checkoutHasPrinting();

            if (
                printingRequested &&
                getCheckoutField(
                    'useHomeAddressForDelivery'
                )?.checked
            ) {
                copyHomeAddressToDelivery();
            }

            const customerProfile =
                collectCustomerProfileDetails();

            const validationError =
                validateCustomerProfile(
                    customerProfile,
                    printingRequested
                );

            if (validationError) {
                popup.showToast(
                    validationError,
                    'error'
                );

                return;
            }

            checkoutButton.disabled = true;

            checkoutButton.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                Saving details...
            `;

            try {
                const {
                    error: profileError
                } = await saveCustomerProfile(
                    customerProfile,
                    user.id
                );

                if (profileError) {
                    throw profileError;
                }

                const orderId =
                    `ORD-${Date.now()
                        .toString()
                        .slice(-8)}`;

                const orderCart =
                    createOrderCartSnapshot(
                        cartManager.cart
                    );

                const orderBreakdown =
                    calculateOrderBreakdown(
                        orderCart
                    );

                const orderData = {
                    order_id: orderId,

                    cart: orderCart,

                    userInput: {
                        sketchProvided:
                            selectedSketchFile !== null,

                        sketchFileName:
                            selectedSketchFile?.name || null,

                        designDescription:
                            description,

                        preferredColors:
                            getCheckoutText(
                                'preferredColors'
                            )
                    },

                    customerDetails:
                        createCustomerSnapshot(
                            customerProfile
                        ),

                    homeAddress:
                        createHomeAddressSnapshot(
                            customerProfile
                        ),

                    printingRequested,

                    deliveryAddress:
                        printingRequested
                            ? createDeliveryAddressSnapshot(
                                customerProfile
                            )
                            : {},

                    totals: {
                        design:
                            orderBreakdown.design,

                        printing:
                            orderBreakdown.printing,

                        subtotal:
                            orderBreakdown.total,

                        total:
                            orderBreakdown.total
                    },

                    paymentStatus: 'Pending',
                    designStatus: 'Waiting',
                    progress: 0,

                    created_at:
                        new Date().toISOString(),

                    updated_at:
                        new Date().toISOString()
                };

                checkoutButton.innerHTML = `
                    <i class="fas fa-spinner fa-spin"></i>
                    Creating order...
                `;

                const {
    data: savedOrder,
    error: orderError
            } = await saveOrder(orderData);

            if (orderError) {
                throw orderError;
            }

            if (selectedSketchFile) {
                updateSketchUploadProgress(
                    'Uploading sketch...',
                    35
                );

                const {
                    error: sketchError
                } = await uploadOrderSketch({
                    file: selectedSketchFile,

                    orderDatabaseId:
                        savedOrder.id,

                    orderNumber:
                        savedOrder.order_id,

                    userId:
                        user.id
                });

                if (sketchError) {
                    throw sketchError;
                }

                updateSketchUploadProgress(
                    'Sketch uploaded successfully',
                    100
                );
            }

            try {
    const {
        data: emailData,
        error: emailError
    } = await supabase.functions.invoke(
        'send-new-order-email',
        {
            body: {
                orderRecordId: savedOrder.id
            }
        }
    );

    if (emailError) {
        throw emailError;
    }

    if (!emailData?.success) {
        throw new Error(
            emailData?.error ||
            'Admin email was not sent'
        );
    }

    console.log(
        'Admin new-order email sent:',
        emailData
    );
} catch (emailError) {
    console.error(
        'Admin new-order email failed:',
        emailError
    );
}

                cartManager.clearCart();
                popup.closeConfirmation();

                popup.showToast(
                    'Order created! Redirecting to payment...',
                    'success'
                );

                setTimeout(() => {
                    window.location.href =
                        `payment.html?orderId=${encodeURIComponent(
                            orderId
                        )}`;
                }, 1500);
            } catch (error) {
                console.error(
                    'Checkout failed:',
                    error
                );

                popup.showToast(
                    error?.message ||
                    'Unable to create the order. Please try again.',
                    'error'
                );

                checkoutButton.disabled = false;

                checkoutButton.innerHTML = `
                    <i class="fas fa-lock"></i>
                    Proceed to Checkout
                `;
            }
        }
    );
});

document.addEventListener('DOMContentLoaded', function() {
    cartManager.loadCart();
    cartManager.updateBadge();
});
