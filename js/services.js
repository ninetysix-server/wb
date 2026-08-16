import {
    getServices,
    searchServices,
    supabase
} from './supabase.js';
import { cartManager } from './cart.js';

let allServices = [];
let filteredServices = [];

let activeSearchIds = null;
let currentSearchTerm = '';
let searchRequestNumber = 0;
let currentSort = 'featured';
let selectedCategories = [];
let selectedTiers = ['starter'];
let priceRange = { min: 0, max: 5000 };
let wishlistItems = [];
let topDesignsSwiper = null;

let currentPage = 1;
function getItemsPerPage() {
    const width = window.innerWidth;

    if (width >= 1400) return 8;
    if (width >= 1100) return 6;
    if (width >= 768) return 4;

    return 2;
}

let itemsPerPage = getItemsPerPage();
let totalPages = 1;
let isLoading = true; 

function loadWishlistItems() {
    try {
        const saved = localStorage.getItem('designWishlist');
        wishlistItems = saved ? JSON.parse(saved) : [];
    } catch (error) {
        wishlistItems = [];
    }
}

function saveWishlist() {
    try {
        localStorage.setItem('designWishlist', JSON.stringify(wishlistItems));
        updateWishlistCount();
        updateAllWishlistIcons();
    } catch (error) {
        console.error('Error saving wishlist:', error);
    }
}

function updateWishlistCount() {
    const count = wishlistItems.length;
    const counter = document.getElementById('wishlistCounter');
    if (counter) {
        counter.textContent = count;
        counter.style.display = count > 0 ? 'flex' : 'none';
    }
}

function updateAllWishlistIcons() {
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        const serviceId = btn.dataset.serviceId;
        if (serviceId) {
            const isInWishlist = wishlistItems.some(item => item.id === serviceId);
            const icon = btn.querySelector('i');
            if (isInWishlist) {
                icon.className = 'fas fa-heart';
                icon.style.color = '#ef4444';
                btn.title = 'Remove from wishlist';
            } else {
                icon.className = 'far fa-heart';
                icon.style.color = '#6b6b6b';
                btn.title = 'Add to wishlist';
            }
            document
    .querySelectorAll('.top-design-wishlist')
    .forEach(button => {
        const serviceId =
            button.dataset.serviceId;

        const isInWishlist =
            wishlistItems.some(
                item => item.id === serviceId
            );

        const icon =
            button.querySelector('i');

        button.classList.toggle(
            'is-liked',
            isInWishlist
        );

        if (icon) {
            icon.className = `${
                isInWishlist
                    ? 'fas'
                    : 'far'
            } fa-heart`;
        }

        button.title = isInWishlist
            ? 'Remove from wishlist'
            : 'Add to wishlist';
    });
        }
    });
}

function updateWishlistUI() {
    const emptyState = document.getElementById('wishlistEmptyState');
    const itemsContainer = document.getElementById('wishlistItemsContainer');
    const itemsList = document.getElementById('wishlistItemsList');
    const submitBtn = document.getElementById('submitWishlist');
    const footer = document.getElementById('wishlistFooter');
    
    if (wishlistItems.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (itemsContainer) itemsContainer.style.display = 'none';
        if (footer) footer.style.display = 'none';
        if (submitBtn) submitBtn.disabled = true;
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    if (itemsContainer) itemsContainer.style.display = 'block';
    if (footer) footer.style.display = 'block';
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fab fa-whatsapp"></i> Submit ${wishlistItems.length} Design${wishlistItems.length > 1 ? 's' : ''} via WhatsApp`;
    }
    
    if (itemsList) {
        itemsList.innerHTML = wishlistItems.map(item => `
            <li class="wishlist-item" data-id="${item.id}">
                <div class="wishlist-item-header">
                    <div>
                        <div class="wishlist-item-title">${item.title}</div>
                        <div class="wishlist-item-category">${item.category || 'Design'}</div>
                    </div>
                    <span class="wishlist-item-tier">${item.tier}</span>
                </div>
                <div class="wishlist-item-details">
                    <div class="wishlist-detail-group">
                        <div class="wishlist-detail-label">Price</div>
                        <div class="wishlist-detail-value wishlist-item-price">${item.price}</div>
                    </div>
                    <div class="wishlist-detail-group">
                        <div class="wishlist-detail-label">Added</div>
                        <div class="wishlist-detail-value">${new Date(item.addedAt).toLocaleDateString()}</div>
                    </div>
                </div>
                ${item.description ? `
                    <div class="wishlist-item-description">${item.description}</div>
                ` : ''}
                <div class="wishlist-item-footer">
                    <button class="wishlist-item-remove" onclick="removeFromWishlist('${item.id}')">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </li>
        `).join('');
    }
}

window.removeFromWishlist = function(serviceId) {
    const index = wishlistItems.findIndex(item => item.id === serviceId);
    if (index > -1) {
        const removed = wishlistItems[index];
        wishlistItems.splice(index, 1);
        saveWishlist();
        updateWishlistUI();
    }
};

window.toggleWishlist = function(serviceId) {
    const service = allServices.find(s => s.id === serviceId);
    if (!service) return;
    
    const existingIndex = wishlistItems.findIndex(item => item.id === serviceId);
    
    if (existingIndex > -1) {
        wishlistItems.splice(existingIndex, 1);
        saveWishlist();
        updateWishlistUI();
    } else {
        const tierData = service.tiers?.[0] || {};
        wishlistItems.push({
            id: serviceId,
            title: service.title,
            tier: tierData.name || 'Starter',
            price: tierData.price || 'Contact',
            description: tierData.description || service.description || '',
            category: service.category || 'Design',
            addedAt: new Date().toISOString()
        });
        saveWishlist();
        updateWishlistUI();
    }
};

function showToast(message, type = 'success') {
    document.querySelectorAll('.custom-toast').forEach(t => t.remove());
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-info-circle';
    const color = type === 'success' ? '#10b981' : '#3b82f6';
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    Object.assign(toast.style, {
        position: 'fixed', bottom: '30px', left: '50%',
        transform: 'translateX(-50%) translateY(100px)',
        padding: '14px 32px', background: color, color: 'white',
        borderRadius: '60px', display: 'flex', alignItems: 'center', gap: '10px',
        zIndex: '9999', opacity: '0', transition: 'all 0.4s ease',
        fontFamily: 'Inter, sans-serif', fontSize: '0.9rem'
    });
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
        toast.style.opacity = '1';
    });
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(100px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

function getCategories(services) {
    const categories = new Set();

    services.forEach(service => {
        if (service.category) {
            categories.add(service.category);
        }
    });

    return Array.from(categories).sort();
}

function escapeTopDesignValue(value) {
    return String(value ?? '').replace(
        /[&<>"']/g,
        character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        })[character]
    );
}

function getTopDesignTier(service) {
    const tiers = Array.isArray(service.tiers)
        ? service.tiers
        : [];

    const firstPricedTier = tiers.find(tier =>
        tier &&
        tier.price &&
        tier.price !== 'Contact'
    );

    return firstPricedTier || tiers[0] || {
        name: 'Starter',
        price: 'Contact',
        originalPrice: null,
        description: service.description || ''
    };
}


function renderTopDesigns() {
    const wrapper = document.getElementById(
        'topDesignsWrapper'
    );

    if (!wrapper) {
        return;
    }

    const topDesignDefinitions = [
    {
        matcher: 'logo',
        image: 'assets/images/tp-h/vr_logo-design.png'
    },
    {
        matcher: 'poster',
        image: 'assets/images/tp-h/vr_poster.png'
    },
    {
        matcher: 'business card',
        image: 'assets/images/tp-h/vr_business-card.png'
    },
    {
        matcher: 'board',
        image: 'assets/images/tp-h/vr_board-design.png'
    }
];

const topServices = topDesignDefinitions
    .map(definition => {
        const service = allServices.find(item => {
            const title = String(
                item.title || ''
            ).toLowerCase();

            const slug = String(
                item.slug || ''
            )
                .toLowerCase()
                .replace(/-/g, ' ');

            return (
                title.includes(definition.matcher) ||
                slug.includes(definition.matcher)
            );
        });

        return service
            ? {
                ...service,
                topDesignImage: definition.image
            }
            : null;
    })
    .filter(Boolean);

    if (!topServices.length) {
        wrapper.innerHTML = `
            <div class="swiper-slide">
                <div class="top-design-loading">
                    <i
                        class="fas fa-layer-group"
                        style="font-size:38px;"
                    ></i>

                    <p>No top designs are available.</p>
                </div>
            </div>
        `;

        return;
    }

    wrapper.innerHTML = topServices.map(service => {
        const tier = getTopDesignTier(service);

        const imageUrl =
            service.topDesignImage;

        const isInWishlist = wishlistItems.some(
            item => item.id === service.id
        );

        const description =
            tier.description ||
            service.description ||
            'Professional design created for your business.';

        return `
            <div class="swiper-slide">
                <article
                    class="top-design-card"
                    data-top-design-id="${escapeTopDesignValue(
                        service.id
                    )}"
                >
                    <div class="top-design-image-wrap">

                        <div class="top-design-actions">
                            <button
                                type="button"
                                class="top-design-icon-btn"
                                onclick="addToCart('${escapeTopDesignValue(
                                    service.id
                                )}')"
                                aria-label="Add ${escapeTopDesignValue(
                                    service.title
                                )} to cart"
                                title="Add to cart"
                            >
                                <i class="fas fa-shopping-cart"></i>
                            </button>

                            <button
                                type="button"
                                class="
                                    top-design-icon-btn
                                    top-design-wishlist
                                    ${isInWishlist
                                        ? 'is-liked'
                                        : ''
                                    }
                                "
                                data-service-id="${escapeTopDesignValue(
                                    service.id
                                )}"
                                onclick="toggleWishlist('${escapeTopDesignValue(
                                    service.id
                                )}')"
                                aria-label="Add ${escapeTopDesignValue(
                                    service.title
                                )} to wishlist"
                                title="Add to wishlist"
                            >
                                <i class="${
                                    isInWishlist
                                        ? 'fas'
                                        : 'far'
                                } fa-heart"></i>
                            </button>
                        </div>

                        ${
                            imageUrl
                                ? `
                                    <img
                                        class="top-design-image"
                                        src="${escapeTopDesignValue(
                                            imageUrl
                                        )}"
                                        alt="${escapeTopDesignValue(
                                            service.title
                                        )}"
                                        loading="lazy"
                                        onerror="
                                            this.style.display='none';
                                            this.nextElementSibling.style.display='grid';
                                        "
                                    >

                                    <div
                                        class="top-design-image-fallback"
                                        style="display:none;"
                                    >
                                        <i class="fas fa-paint-brush"></i>
                                    </div>
                                `
                                : `
                                    <div
                                        class="top-design-image-fallback"
                                    >
                                        <i class="fas fa-paint-brush"></i>
                                    </div>
                                `
                        }
                    </div>

                    <div class="top-design-content">
                        <h3 class="top-design-title">
                            ${escapeTopDesignValue(
                                service.title
                            )}
                        </h3>

                        <p class="top-design-description">
                            ${escapeTopDesignValue(description)}
                        </p>

                        <img
                            class="design-more-image"
                            src="assets/images/cart-title-imge.png"
                            alt="Design more"
                            loading="lazy"
                        >

                        <div class="top-design-footer">
                            <div class="top-design-price-group">
                                <span class="top-design-original-price">
                                    ${
                                        tier.originalPrice
                                            ? escapeTopDesignValue(
                                                tier.originalPrice
                                            )
                                            : ''
                                    }
                                </span>

                                <strong class="top-design-price">
                                    ${escapeTopDesignValue(
                                        tier.price
                                    )}
                                </strong>
                            </div>

                            <span class="top-design-tier">
                                ${escapeTopDesignValue(
                                    tier.name || 'Starter'
                                )}
                            </span>
                        </div>
                    </div>
                </article>
            </div>
        `;
    }).join('');

    initialiseTopDesignsSwiper();
}


function initialiseTopDesignsSwiper() {
    const element = document.querySelector(
        '.top-designs-swiper'
    );

    if (!element || typeof Swiper === 'undefined') {
        return;
    }

    if (topDesignsSwiper) {
        topDesignsSwiper.destroy(
            true,
            true
        );

        topDesignsSwiper = null;
    }

    topDesignsSwiper = new Swiper(
        element,
        {
            slidesPerView: 1.08,
            spaceBetween: 14,
            speed: 650,
            grabCursor: true,
            watchOverflow: true,

            pagination: {
                el: '.top-designs-pagination',
                clickable: true
            },

            breakpoints: {
                480: {
                    slidesPerView: 1.45,
                    spaceBetween: 15
                },

                640: {
                    slidesPerView: 2.15,
                    spaceBetween: 18
                },

                769: {
                    slidesPerView: 3,
                    spaceBetween: 22
                },

                1100: {
                    slidesPerView: 4,
                    spaceBetween: 32
                }
            },

            autoplay: {
                delay: 2800,
                disableOnInteraction: false,
                pauseOnMouseEnter: true
            }
        }
    );

    updateTopDesignAutoplay();
}


function updateTopDesignAutoplay() {
    if (
        !topDesignsSwiper ||
        !topDesignsSwiper.autoplay
    ) {
        return;
    }

    const smallScreen =
        window.matchMedia(
            '(max-width: 768px)'
        ).matches;

    if (smallScreen) {
        topDesignsSwiper.autoplay.start();
    } else {
        topDesignsSwiper.autoplay.stop();

        topDesignsSwiper.slideTo(
            0,
            0
        );
    }
}

async function loadServices() {
    try {
        isLoading = true;
        document.getElementById('servicesGrid').innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
                <div class="spinner"></div>
                <p style="color:#6b6b6b;margin-top:16px;">Loading services...</p>
            </div>
        `;
        document.getElementById('paginationContainer').innerHTML = '';
        
        loadWishlistItems();
        const services = await getServices();
        allServices = services.map(service => {
    const serviceFeatures =
        service.features &&
        typeof service.features === 'object'
            ? service.features
            : {};

    const createTier = (
    name,
    salePrice,
    originalPrice,
    features
) => {
    const hasSalePrice =
        salePrice !== null &&
        salePrice !== undefined &&
        salePrice !== '';

    const hasOriginalPrice =
        originalPrice !== null &&
        originalPrice !== undefined &&
        originalPrice !== '';

    const saleAmount = hasSalePrice
        ? Number(salePrice)
        : null;

    const originalAmount = hasOriginalPrice
        ? Number(originalPrice)
        : null;

    const tierIsOnSale =
        saleCampaignActive &&
        Number.isFinite(saleAmount) &&
        Number.isFinite(originalAmount) &&
        originalAmount > saleAmount;

    const displayedAmount =
        !saleCampaignActive && Number.isFinite(originalAmount)
            ? originalAmount
            : saleAmount;

    return {
        name,

        price:
            Number.isFinite(displayedAmount)
                ? `R${displayedAmount.toFixed(2)}`
                : 'Contact',

        originalPrice:
            tierIsOnSale
                ? `R${originalAmount.toFixed(2)}`
                : null,

        description: service.description || '',

        features:
            Array.isArray(features)
                ? features
                : []
    };
};

    return {
        ...service,

        id: service.id,
        title: service.title || 'Design Service',
        category: service.category || 'Uncategorised',
        description: service.description || '',

        icon: 'fas fa-paint-brush',

        tiers: [
            createTier(
                'Starter',
                service.starter_price,
                service.starter_original_price,
                serviceFeatures.starter
            ),

            createTier(
                'Premium',
                service.premium_price,
                service.premium_original_price,
                serviceFeatures.premium
            ),

            createTier(
                'Pro',
                service.pro_price,
                service.pro_original_price,
                serviceFeatures.pro
            )
        ],

        printingEnabled: service.printing_enabled === true,

printingOptions: Array.isArray(service.printing_options)
    ? service.printing_options
        .filter(option => option.active !== false)
        .map(option => ({
            id: String(option.id || ''),
            size: String(option.size || '').trim(),
            pricePerCopy: Number(
                option.price_per_copy || 0
            ),
            minimumQuantity: Math.max(
                1,
                Number(option.minimum_quantity || 1)
            ),
            maximumQuantity:
                option.maximum_quantity === null ||
                option.maximum_quantity === undefined ||
                option.maximum_quantity === ''
                    ? null
                    : Math.max(
                        1,
                        Number(option.maximum_quantity)
                    ),
            active: option.active !== false
        }))
        .filter(option => option.size)
    : [],

printingPrice:
    service.printing_price !== null &&
    service.printing_price !== undefined
        ? `R${Number(service.printing_price).toFixed(2)}`
        : null
    };
});
        generateCategoryFilters(allServices);

        filteredServices = [...allServices];

        isLoading = false;

        renderTopDesigns();
        renderServices();
        updateServiceCount();
        updateAllWishlistIcons();
    } catch (error) {
        console.error('Error loading services:', error);
        isLoading = false;
        document.getElementById('servicesGrid').innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#6b6b6b;">
                <i class="fas fa-exclamation-circle" style="font-size:48px;color:#ef4444;margin-bottom:16px;display:block;"></i>
                <h3>Failed to load services</h3>
                <p>Please refresh the page and try again.</p>
            </div>
        `;
        document.getElementById('paginationContainer').innerHTML = '';
    }
}

function generateCategoryFilters(services) {
    const container = document.querySelector(
        '.filter-group:first-child'
    );

    if (!container) return;

    const categories = getCategories(services);

    const labels = {
        'Branding': 'Branding',
        'Graphic Design': 'Graphic Design',
        'Multi-page Design': 'Documents & Publications',
        'Website': 'Development',
        'Events': 'Event Design'
    };

    let html = '<h4>Service Type</h4>';

    categories.forEach(category => {
        const label = labels[category] || category;

        html += `
            <label>
                <input
                    type="checkbox"
                    class="category-filter"
                    value="${category}"
                    onchange="toggleCategory('${category}')"
                >
                ${label}
            </label>
        `;
    });

    container.innerHTML = html;
}

function getSelectedAddonTier() {
    if (selectedTiers.includes('starter')) return 'starter';
    if (selectedTiers.includes('premium')) return 'premium';
    if (selectedTiers.includes('pro')) return 'pro';

    return 'starter';
}

function renderSpecialServiceControls(service) {
    if (service.has_page_quantity === true) {
        return renderPageQuantityControls(service);
    }

    if (service.is_addon_service === true) {
        return renderWebsiteAddonControls(service);
    }

    return '';
}

function renderPrintingControls(service) {
    if (
        service.printingEnabled !== true ||
        service.is_addon_service === true
    ) {
        return '';
    }

    const printingOptions = Array.isArray(
        service.printingOptions
    )
        ? service.printingOptions
        : [];

    if (printingOptions.length === 0) {
        return '';
    }

    const firstOption = printingOptions[0];

    return `
        <div
            class="printing-selector"
            id="printing-selector-${service.id}"
        >
            <label class="printing-toggle">
                <input
                    type="checkbox"
                    id="printing-${service.id}"
                    onchange="updatePrintingSelection('${service.id}')"
                >

                <span>Print this design</span>
            </label>

            <div
                class="printing-details"
                id="printing-details-${service.id}"
                style="display:none;"
            >
                <div class="printing-field">
                    <label for="printing-size-${service.id}">
                        Print size
                    </label>

                    <select
                        id="printing-size-${service.id}"
                        onchange="updatePrintingSelection('${service.id}')"
                    >
                        ${printingOptions.map(option => `
                            <option
                                value="${option.id}"
                                data-size="${option.size}"
                                data-price="${option.pricePerCopy}"
                                data-minimum="${option.minimumQuantity}"
                                data-maximum="${
                                    option.maximumQuantity ?? ''
                                }"
                            >
                                ${option.size}
                                — R${option.pricePerCopy.toFixed(2)}
                                per copy
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="printing-field">
                    <label for="printing-copies-${service.id}">
                        Number of copies
                    </label>

                    <div class="printing-quantity-selector">
                        <button
                            type="button"
                            onclick="changePrintingCopies(
                                '${service.id}',
                                -1
                            )"
                        >
                            −
                        </button>

                        <input
                            type="number"
                            id="printing-copies-${service.id}"
                            value="${firstOption.minimumQuantity}"
                            min="${firstOption.minimumQuantity}"
                            ${
                                firstOption.maximumQuantity !== null
                                    ? `max="${firstOption.maximumQuantity}"`
                                    : ''
                            }
                            oninput="updatePrintingSelection('${service.id}')"
                        >

                        <button
                            type="button"
                            onclick="changePrintingCopies(
                                '${service.id}',
                                1
                            )"
                        >
                            +
                        </button>
                    </div>

                    <small
                        id="printing-limits-${service.id}"
                        class="printing-limits"
                    >
                        Minimum ${firstOption.minimumQuantity}
                        ${
                            firstOption.maximumQuantity !== null
                                ? ` · Maximum ${firstOption.maximumQuantity}`
                                : ''
                        }
                    </small>
                </div>

                <div class="printing-summary">
                    <div>
                        <span>Printing</span>

                        <strong
                            id="printing-calculation-${service.id}"
                        >
                            ${firstOption.minimumQuantity}
                            ×
                            R${firstOption.pricePerCopy.toFixed(2)}
                        </strong>
                    </div>

                    <div>
                        <span>Printing total</span>

                        <strong
                            id="printing-total-${service.id}"
                        >
                            R${(
                                firstOption.minimumQuantity *
                                firstOption.pricePerCopy
                            ).toFixed(2)}
                        </strong>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getPrintingSelection(serviceId, validate = false) {
    const service = allServices.find(
        item => item.id === serviceId
    );

    const checkbox = document.getElementById(
        `printing-${serviceId}`
    );

    if (
        !service ||
        service.printingEnabled !== true ||
        checkbox?.checked !== true
    ) {
        return {
            selected: false,
            optionId: null,
            size: null,
            pricePerCopy: 0,
            copies: 0,
            minimumQuantity: null,
            maximumQuantity: null,
            total: 0
        };
    }

    const sizeSelect = document.getElementById(
        `printing-size-${serviceId}`
    );

    const copiesInput = document.getElementById(
        `printing-copies-${serviceId}`
    );

    const selectedOption =
        sizeSelect?.options[sizeSelect.selectedIndex];

    if (!selectedOption || !copiesInput) {
        if (validate) {
            showToast(
                'Select a valid printing option.',
                'info'
            );
        }

        return null;
    }

    const optionId = selectedOption.value;

    const size =
        selectedOption.dataset.size ||
        selectedOption.textContent.trim();

    const pricePerCopy = Number(
        selectedOption.dataset.price || 0
    );

    const minimumQuantity = Math.max(
        1,
        Number(selectedOption.dataset.minimum || 1)
    );

    const maximumValue =
        selectedOption.dataset.maximum;

    const maximumQuantity =
        maximumValue === '' ||
        maximumValue === undefined
            ? null
            : Number(maximumValue);

    let copies = Number(copiesInput.value);

    if (!Number.isFinite(copies)) {
        copies = minimumQuantity;
    }

    copies = Math.floor(copies);
    copies = Math.max(minimumQuantity, copies);

    if (maximumQuantity !== null) {
        copies = Math.min(maximumQuantity, copies);
    }

    copiesInput.value = copies;
    copiesInput.min = minimumQuantity;

    if (maximumQuantity !== null) {
        copiesInput.max = maximumQuantity;
    } else {
        copiesInput.removeAttribute('max');
    }

    return {
        selected: true,
        optionId,
        size,
        pricePerCopy,
        copies,
        minimumQuantity,
        maximumQuantity,
        total: pricePerCopy * copies
    };
}

function getServiceDesignPrice(service) {
    if (service.has_page_quantity === true) {
        const pagesInput = document.getElementById(
            `service-pages-${service.id}`
        );

        const maxPages = Number(
            service.max_pages || 1
        );

        let pages = Number(pagesInput?.value || 1);

        pages = Math.max(
            1,
            Math.min(maxPages, pages)
        );

        const basePrice = Number(
            service.base_price || 0
        );

        const pricePerPage = Number(
            service.price_per_page || 0
        );

        const additionalPages = Math.max(
            0,
            pages - 1
        );

        return (
            basePrice +
            additionalPages * pricePerPage
        );
    }

    let tierData = null;

    for (const tier of service.tiers) {
        if (
            selectedTiers.includes(
                tier.name.toLowerCase()
            )
        ) {
            tierData = tier;
            break;
        }
    }

    if (!tierData) {
        tierData = service.tiers[0];
    }

    return Number(
        String(tierData?.price || '0')
            .replace(/[^\d.]/g, '')
    );
}

function renderPageQuantityControls(service) {
    const basePrice = Number(service.base_price || 0);
    const pricePerPage = Number(service.price_per_page || 0);
    const maxPages = Number(service.max_pages || 1);

    return `
        <div class="special-service-options page-service-options">
            <label>
                Number of pages
            </label>

            <div class="page-quantity-selector">
                <button
                    type="button"
                    onclick="changeServicePages('${service.id}', -1)"
                >
                    −
                </button>

                <input
                    type="number"
                    id="service-pages-${service.id}"
                    value="1"
                    min="1"
                    max="${maxPages}"
                    oninput="updatePageServiceTotal('${service.id}')"
                >

                <button
                    type="button"
                    onclick="changeServicePages('${service.id}', 1)"
                >
                    +
                </button>
            </div>

            <div class="page-price-information">
                <span>
                    First page: R${basePrice.toFixed(2)}
                </span>

                <span>
                    Additional pages: R${pricePerPage.toFixed(2)} each
                </span>
            </div>

            <strong id="page-service-total-${service.id}">
                Total: R${basePrice.toFixed(2)}
            </strong>
        </div>
    `;
}

function renderWebsiteAddonControls(service) {
    const tier = getSelectedAddonTier();

    const addons = Array.isArray(service.website_addons?.[tier])
        ? service.website_addons[tier]
        : [];

    if (addons.length === 0) {
        return `
            <div class="special-service-options">
                <p>No website add-ons are available.</p>
            </div>
        `;
    }

    return `
        <div class="special-service-options website-addon-options">
            <strong>Select website add-ons</strong>

            <div class="website-addon-list">
                ${addons.map(addon => `
                    <label class="website-addon-option">
                        <input
                            type="checkbox"
                            class="website-addon-checkbox"
                            data-service-id="${service.id}"
                            data-addon-id="${addon.id}"
                            data-addon-name="${addon.name}"
                            data-addon-price="${Number(addon.price)}"
                            onchange="updateWebsiteAddonTotal('${service.id}')"
                        >

                        <span>${addon.name}</span>

                        <strong>
                            R${Number(addon.price).toFixed(2)}
                        </strong>
                    </label>
                `).join('')}
            </div>

            <strong id="website-addon-total-${service.id}">
                Total: R0.00
            </strong>
        </div>
    `;
}

function renderServices() {
    const grid = document.getElementById('servicesGrid');
    
    if (isLoading) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
                <div class="spinner"></div>
                <p style="color:#6b6b6b;margin-top:16px;">Loading services...</p>
            </div>
        `;
        document.getElementById('paginationContainer').innerHTML = '';
        return;
    }
    
    if (filteredServices.length === 0) {
    const message = currentSearchTerm
        ? `
            <h3>No services found</h3>
            <p>
                We could not find anything matching
                "<strong>${escapeTopDesignValue(
                    currentSearchTerm
                )}</strong>"
            </p>
        `
        : `
            <h3>No services found</h3>
            <p>Try adjusting your filters</p>
        `;

    grid.innerHTML = `
        <div
            style="
                grid-column:1/-1;
                text-align:center;
                padding:60px 20px;
                color:#6b6b6b;
            "
        >
            <i
                class="fas fa-search"
                style="
                    font-size:48px;
                    color:#cbd5e1;
                    margin-bottom:16px;
                    display:block;
                "
            ></i>

            ${message}

            ${
                currentSearchTerm
                    ? `
                        <button
                            type="button"
                            onclick="clearServiceSearch()"
                            style="
                                margin-top:20px;
                                border:none;
                                border-radius:60px;
                                padding:11px 24px;
                                background:#1a1a1a;
                                color:#ffffff;
                                cursor:pointer;
                            "
                        >
                            View all services
                        </button>
                    `
                    : ''
            }
        </div>
    `;

    document
        .getElementById('paginationContainer')
        .innerHTML = '';

    return;
}

    totalPages = Math.ceil(filteredServices.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = filteredServices.slice(start, end);

    grid.innerHTML = pageItems.map(service => {
        let tierData = null;
        for (const tier of service.tiers) {
            if (selectedTiers.includes(tier.name.toLowerCase())) {
                tierData = tier;
                break;
            }
        }
        if (!tierData) tierData = service.tiers[0];
        
        const price = service.is_addon_service === true
    ? 'Select add-ons'
    : tierData?.price || 'Contact';
const originalPrice = tierData?.originalPrice || null;
const desc = tierData?.description || service.description || '';
const features = Array.isArray(tierData?.features)
    ? tierData.features
    : [];

const currentAmount = Number(
    String(price).replace(/[^\d.]/g, '')
);

const originalAmount = Number(
    String(originalPrice || '').replace(/[^\d.]/g, '')
);

const isOnSale =
    originalPrice &&
    originalAmount > currentAmount;

const savingPercentage = isOnSale
    ? Math.round(
        ((originalAmount - currentAmount) / originalAmount) * 100
    )
    : 0;
        
        const isInWishlist = wishlistItems.some(item => item.id === service.id);
        
        return `
            <div
                    class="product-card"
                    data-service="${service.id}"
                    onclick="openServicePage(event, '${service.id}')"
                >
                <div class="card-top">
                    <div class="card-top-right">
                        ${isOnSale ? `<span class="sale-badge">-${savingPercentage}%</span>` : ''}
                        <button class="wishlist-btn" data-service-id="${service.id}" onclick="toggleWishlist('${service.id}')">
                            <i class="${isInWishlist ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                    </div>
                </div>
                <div class="product-image">
                    <img
                        src="${service.image_url || 'assets/images/cart-title-image.png'}"
                        alt="${escapeTopDesignValue(service.title)}"
                        loading="lazy"
                    >
                </div>
                <div class="product-brand">${service.category || 'Design'}</div>
                <div class="product-name">${service.title}</div>
                <div class="product-desc">${desc}</div>
                <div class="product-features">
                ${features
                    .slice(0, 3)
                    .map(feature => `
                        <span class="feature-tag">${feature}</span>
                    `)
                    .join('')}

                ${features.length > 3
                    ? `<span class="feature-tag">
                        +${features.length - 3} more
                    </span>`
                    : ''
                }

                ${service.printingEnabled
                    ? `<span class="feature-tag">
                        Printing available${service.printingPrice
                            ? ` from ${service.printingPrice}`
                            : ''
                        }
                    </span>`
                    : ''
                }
            </div>
            ${renderSpecialServiceControls(service)}
            ${renderPrintingControls(service)}
            <div class="product-rating"><span>★★★★☆</span><span>4.8 (120)</span></div>
                <div class="product-price">
                    ${isOnSale ? `
                <span class="price-current" style="color:#ef4444;">
                    ${price}
                </span>

                <span class="price-original">
                    ${originalPrice}
                </span>

                <span class="price-save">
                    Save ${savingPercentage}%
                </span>
            ` : `
                <span class="price-current">${price}</span>
            `}
                </div>
                <div class="card-actions">
                    <button class="btn-primary" onclick="addToCart('${service.id}')"><i class="fas fa-shopping-cart"></i> Add to Cart</button>
                </div>
            </div>
        `;
    }).join('');
    
    renderPagination();
    updateAllWishlistIcons();
    updateWishlistCount();
}

function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<div class="pagination">';
    
    html += `<button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>&laquo;</button>`;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span class="page-dots">...</span>`;
        }
    }
    
    html += `<button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>&raquo;</button>`;
    
    html += '</div>';
    container.innerHTML = html;
}

window.goToPage = function(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderServices();
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.changeServicePages = function(serviceId, amount) {
    const service = allServices.find(
        item => item.id === serviceId
    );

    const input = document.getElementById(
        `service-pages-${serviceId}`
    );

    if (!service || !input) {
        return;
    }

    const maxPages = Number(service.max_pages || 1);

    let pages = Number(input.value || 1);

    pages += amount;
    pages = Math.max(1, Math.min(maxPages, pages));

    input.value = pages;

    updatePageServiceTotal(serviceId);
};

window.updatePageServiceTotal = function(serviceId) {
    const service = allServices.find(
        item => item.id === serviceId
    );

    const input = document.getElementById(
        `service-pages-${serviceId}`
    );

    const totalElement = document.getElementById(
        `page-service-total-${serviceId}`
    );

    if (!service || !input || !totalElement) {
        return;
    }

    const maxPages = Number(service.max_pages || 1);

    let pages = Number(input.value || 1);

    pages = Math.max(
        1,
        Math.min(maxPages, pages)
    );

    input.value = pages;

    const basePrice = Number(
        service.base_price || 0
    );

    const pricePerPage = Number(
        service.price_per_page || 0
    );

    const additionalPages = Math.max(
        0,
        pages - 1
    );

    const printingCheckbox =
        document.getElementById(
            `printing-${serviceId}`
        );

    const printingSelected =
        printingCheckbox?.checked === true;

    const printingPrice = printingSelected
        ? Number(
            printingCheckbox.dataset.printingPrice || 0
        )
        : 0;

    const total =
        basePrice +
        additionalPages * pricePerPage +
        printingPrice;

    totalElement.textContent =
        `Total: R${total.toFixed(2)}`;
};

window.updatePrintingSelection = function(serviceId) {
    const service = allServices.find(
        item => item.id === serviceId
    );

    if (!service) {
        return;
    }

    const checkbox = document.getElementById(
        `printing-${serviceId}`
    );

    const details = document.getElementById(
        `printing-details-${serviceId}`
    );

    if (details) {
        details.style.display =
            checkbox?.checked === true
                ? 'block'
                : 'none';
    }

    if (checkbox?.checked === true) {
        const sizeSelect = document.getElementById(
            `printing-size-${serviceId}`
        );

        const selectedOption =
            sizeSelect?.options[sizeSelect.selectedIndex];

        const copiesInput = document.getElementById(
            `printing-copies-${serviceId}`
        );

        if (selectedOption && copiesInput) {
            const minimumQuantity = Math.max(
                1,
                Number(
                    selectedOption.dataset.minimum || 1
                )
            );

            const maximumValue =
                selectedOption.dataset.maximum;

            const maximumQuantity =
                maximumValue === '' ||
                maximumValue === undefined
                    ? null
                    : Number(maximumValue);

            const currentCopies = Number(
                copiesInput.value
            );

            if (
                !Number.isFinite(currentCopies) ||
                currentCopies < minimumQuantity ||
                (
                    maximumQuantity !== null &&
                    currentCopies > maximumQuantity
                )
            ) {
                copiesInput.value = minimumQuantity;
            }

            copiesInput.min = minimumQuantity;

            if (maximumQuantity !== null) {
                copiesInput.max = maximumQuantity;
            } else {
                copiesInput.removeAttribute('max');
            }

            const limits = document.getElementById(
                `printing-limits-${serviceId}`
            );

            if (limits) {
                limits.textContent =
                    `Minimum ${minimumQuantity}` +
                    (
                        maximumQuantity !== null
                            ? ` · Maximum ${maximumQuantity}`
                            : ''
                    );
            }
        }
    }

    const printing =
        getPrintingSelection(serviceId) || {
            selected: false,
            total: 0
        };

    const calculation = document.getElementById(
        `printing-calculation-${serviceId}`
    );

    const printingTotal = document.getElementById(
        `printing-total-${serviceId}`
    );

    if (printing.selected) {
        if (calculation) {
            calculation.textContent =
                `${printing.copies} × ` +
                `R${printing.pricePerCopy.toFixed(2)}`;
        }

        if (printingTotal) {
            printingTotal.textContent =
                `R${printing.total.toFixed(2)}`;
        }
    }

    if (service.has_page_quantity === true) {
        updatePageServiceTotal(serviceId);
    }
};

window.changePrintingCopies = function(
    serviceId,
    amount
) {
    const input = document.getElementById(
        `printing-copies-${serviceId}`
    );

    if (!input) {
        return;
    }

    const minimumQuantity = Math.max(
        1,
        Number(input.min || 1)
    );

    const maximumQuantity =
        input.max === ''
            ? null
            : Number(input.max);

    let copies = Number(
        input.value || minimumQuantity
    );

    copies += amount;
    copies = Math.max(minimumQuantity, copies);

    if (maximumQuantity !== null) {
        copies = Math.min(
            maximumQuantity,
            copies
        );
    }

    input.value = copies;

    updatePrintingSelection(serviceId);
};

window.updateWebsiteAddonTotal = function(serviceId) {
    const selectedAddons = document.querySelectorAll(
        `.website-addon-checkbox[data-service-id="${serviceId}"]:checked`
    );

    const total = Array.from(selectedAddons).reduce(
        (sum, checkbox) => {
            return sum + Number(
                checkbox.dataset.addonPrice || 0
            );
        },
        0
    );

    const totalElement = document.getElementById(
        `website-addon-total-${serviceId}`
    );

    if (totalElement) {
        totalElement.textContent =
            `Total: R${total.toFixed(2)}`;
    }
};

function openCartPopup() {
    document
        .getElementById('cartPopup')
        ?.classList.add('active');

    document.body.style.overflow = 'hidden';

    cartManager.updateUI();
}

function addPageServiceToCart(service) {
    const input = document.getElementById(
        `service-pages-${service.id}`
    );

    const maxPages = Number(
        service.max_pages || 1
    );

    let pages = Number(
        input?.value || 1
    );

    pages = Math.max(
        1,
        Math.min(maxPages, pages)
    );

    const basePrice = Number(
        service.base_price || 0
    );

    const pricePerPage = Number(
        service.price_per_page || 0
    );

    const additionalPages = Math.max(
        0,
        pages - 1
    );

    const printing =
    getPrintingSelection(service.id);

const printingSelected =
    printing?.selected === true;

const printingPrice =
    printing?.total || 0;

const total =
    basePrice +
    additionalPages * pricePerPage +
    printingPrice;

    cartManager.addItem(
        service.id,
        'Standard',
        service.title,
        `R${total.toFixed(2)}`,
        1,
        {
            tier: 'Standard',
            slug: service.slug,
            category: service.category,

            pages,
            basePrice,
            additionalPages,
            pricePerPage,

            printingEnabled:
                service.printingEnabled,

            printingSelected,

            printingOptionId:
                printing?.optionId || null,

            printingSize:
                printing?.size || null,

            printingCopies:
                printing?.copies || 0,

            printingPricePerCopy:
                printing?.pricePerCopy || 0,

            printingPrice,

            calculatedTotal: total
        }
    );

    openCartPopup();
}

function addWebsiteAddonsToCart(service) {
    const checkedAddons = document.querySelectorAll(
        `.website-addon-checkbox[data-service-id="${service.id}"]:checked`
    );

    const selectedAddons = Array.from(checkedAddons).map(
        checkbox => ({
            id: checkbox.dataset.addonId,
            name: checkbox.dataset.addonName,
            price: Number(
                checkbox.dataset.addonPrice || 0
            )
        })
    );

    if (selectedAddons.length === 0) {
        showToast(
            'Select at least one website add-on.',
            'info'
        );

        return;
    }

    selectedAddons.forEach(addon => {
        cartManager.addItem(
            `${service.id}-${addon.id}`,
            'Website Add-on',
            addon.name,
            `R${addon.price.toFixed(2)}`,
            1,
            {
                tier: 'Website Add-on',
                parentServiceId: service.id,
                parentServiceTitle: service.title,
                addonId: addon.id,
                addonName: addon.name,
                addonPrice: addon.price
            }
        );
    });

    openCartPopup();
}

window.addToCart = function(serviceId) {
    const service = allServices.find(
        item => item.id === serviceId
    );

    if (!service) {
        return;
    }

    if (service.has_page_quantity === true) {
        addPageServiceToCart(service);
        return;
    }

    if (service.is_addon_service === true) {
        addWebsiteAddonsToCart(service);
        return;
    }

    let tierData = null;

    for (const tier of service.tiers) {
        if (
            selectedTiers.includes(
                tier.name.toLowerCase()
            )
        ) {
            tierData = tier;
            break;
        }
    }

    if (!tierData) {
        tierData = service.tiers[0];
    }

    if (!tierData) {
        showToast(
            'No price is available for this service.',
            'info'
        );

        return;
    }

    const tierName =
        tierData.name || 'Starter';

    const cartPrice =
        tierData.price || 'R0.00';

    const originalPrice =
        tierData.originalPrice || null;

    const currentAmount = Number(
        String(cartPrice)
            .replace(/[^\d.]/g, '')
    );

    const originalAmount = Number(
        String(originalPrice || '')
            .replace(/[^\d.]/g, '')
    );

    const isOnSale =
        originalPrice &&
        originalAmount > currentAmount;

    const discountPercentage = isOnSale
        ? Math.round(
            (
                (
                    originalAmount -
                    currentAmount
                ) /
                originalAmount
            ) * 100
        )
        : 0;

    const printing =
    getPrintingSelection(service.id);

const printingSelected =
    printing?.selected === true;

const printingPrice =
    printing?.total || 0;

const finalPrice =
    currentAmount + printingPrice;

    cartManager.addItem(
        service.id,
        tierName,
        service.title,
        `R${finalPrice.toFixed(2)}`,
        1,
        {
            tier: tierName,
            slug: service.slug,
            category: service.category,

            originalPrice,
            discountPercentage,

            servicePrice: currentAmount,

            printingEnabled:
                service.printingEnabled,

            printingSelected,

            printingOptionId:
                printing?.optionId || null,

            printingSize:
                printing?.size || null,

            printingCopies:
                printing?.copies || 0,

            printingPricePerCopy:
                printing?.pricePerCopy || 0,

            printingPrice,

            calculatedTotal: finalPrice
        }
    );

    openCartPopup();
};

    window.toggleCategory = function(category) {
        const index = selectedCategories.indexOf(category);
        if (index > -1) selectedCategories.splice(index, 1);
        else selectedCategories.push(category);
        applyFilters();
    };

    window.searchDatabaseServices = async function(
    searchTerm,
    shouldScroll = false
    ) {
    const term = String(searchTerm || '').trim();
    const requestNumber = ++searchRequestNumber;
    const minimumLoadingTime = 1500; // 1.5 seconds
    const loadingStarted = Date.now();

    currentSearchTerm = term;

    if (!term) {
        activeSearchIds = null;
        currentPage = 1;

        const elapsed = Date.now() - loadingStarted;

        if (elapsed < minimumLoadingTime) {
            await new Promise(resolve =>
                setTimeout(resolve, minimumLoadingTime - elapsed)
            );
        }

        applyFilters();

        return {
            success: true,
            count: allServices.length,
            term: ''
        };
    }

    const grid =
        document.getElementById('servicesGrid');

    const pagination =
        document.getElementById(
            'paginationContainer'
        );

    if (grid) {
        grid.innerHTML = `
            <div
                style="
                    grid-column:1/-1;
                    text-align:center;
                    padding:60px 20px;
                "
            >
                <div class="spinner"></div>

                <p
                    style="
                        color:#6b6b6b;
                        margin-top:16px;
                    "
                >
                    Searching services...
                </p>
            </div>
        `;
    }

    if (pagination) {
        pagination.innerHTML = '';
    }

    try {
        const databaseResults =
            await searchServices(term);

        if (requestNumber !== searchRequestNumber) {
            return {
                success: false,
                cancelled: true
            };
        }

        activeSearchIds = new Set(
            databaseResults.map(service =>
                String(service.id)
            )
        );

        currentPage = 1;

        applyFilters();

        if (shouldScroll) {
    document
        .getElementById('services')
        ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
}

        return {
            success: true,
            count: activeSearchIds.size,
            term
        };
    } catch (error) {
        console.error(
            'Unable to search services:',
            error
        );

        if (requestNumber !== searchRequestNumber) {
            return {
                success: false,
                cancelled: true
            };
        }

        activeSearchIds = new Set();
        filteredServices = [];
        currentPage = 1;
        isLoading = false;

        renderServices();
        updateServiceCount();

        showToast(
            'Unable to search services. Please try again.',
            'error'
        );

        return {
            success: false,
            error
        };
    }
};

window.clearServiceSearch = function() {
    const desktopInput =
        document.getElementById(
            'mainSearchInput'
        );

    const mobileInput =
        document.getElementById(
            'mobileSearchInput'
        );

    if (desktopInput) {
        desktopInput.value = '';
    }

    if (mobileInput) {
        mobileInput.value = '';
    }

    currentSearchTerm = '';
    activeSearchIds = null;
    currentPage = 1;

    applyFilters();
};

window.applyFilters = function() {
    const grid = document.getElementById('servicesGrid');
    grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
            <div class="spinner"></div>
            <p style="color:#6b6b6b;margin-top:16px;">Loading services...</p>
        </div>
    `;
    document.getElementById('paginationContainer').innerHTML = '';
    
    setTimeout(() => {
        let results = activeSearchIds instanceof Set
    ? allServices.filter(service =>
        activeSearchIds.has(String(service.id))
    )
    : [...allServices];
        if (selectedCategories.length > 0) {
            results = results.filter(s => selectedCategories.includes(s.category));
        }
        if (selectedTiers.length > 0 && selectedTiers.length < 3) {
    results = results.filter(service => {
        if (service.is_addon_service === true) {
            return selectedTiers.some(tier =>
                Array.isArray(
                    service.website_addons?.[tier]
                ) &&
                service.website_addons[tier].length > 0
            );
        }

        const serviceTiers = service.tiers.map(
            tier => tier.name.toLowerCase()
        );

        return selectedTiers.some(
            tier => serviceTiers.includes(tier)
        );
    });
}
        results = results.filter(s => {
            return s.tiers.some(t => {
                const match = t.price?.match(/R\s*(\d+(\.\d+)?)/);
                if (!match) return true;
                const price = parseFloat(match[1]);
                return price >= priceRange.min && price <= priceRange.max;
            });
        });
        switch(currentSort) {
            case 'price-low':
                results.sort((a, b) => {
                    const getMin = (s) => Math.min(...s.tiers.map(t => { const m = t.price?.match(/R\s*(\d+(\.\d+)?)/); return m ? parseFloat(m[1]) : Infinity; }));
                    return getMin(a) - getMin(b);
                });
                break;
            case 'price-high':
                results.sort((a, b) => {
                    const getMax = (s) => Math.max(...s.tiers.map(t => { const m = t.price?.match(/R\s*(\d+(\.\d+)?)/); return m ? parseFloat(m[1]) : 0; }));
                    return getMax(b) - getMax(a);
                });
                break;
            case 'sale':
                results = results.filter(s => s.discount_active === true);
                break;
        }
        filteredServices = results;
        currentPage = 1;
        renderServices();
        updateServiceCount();
    }, 300);
};

window.sortServices = function(sortBy) {
    currentSort = sortBy;
    applyFilters();
};

window.setPriceRange = function(min, max) {
    priceRange = { min, max };
    document.getElementById('priceDisplay').textContent = `R${min} - R${max}+`;
    applyFilters();
};

window.resetFilters = function() {
    selectedCategories = [];
    selectedTiers = ['starter'];
    currentSort = 'featured';
    priceRange = { min: 0, max: 5000 };
    document.getElementById('priceRangeInput').value = 5000;
    document.getElementById('priceDisplay').textContent = 'R0 - R5000+';
    document.getElementById('sortSelect').value = 'featured';
    document.querySelectorAll('.category-filter').forEach(cb => cb.checked = false);
    document.querySelectorAll('.tier-filter').forEach(cb => cb.checked = cb.value === 'starter');
    applyFilters();
};

function updateServiceCount() {
    const count =
        document.getElementById('serviceCount');

    if (!count) {
        return;
    }

    const total = filteredServices.length;

    if (currentSearchTerm) {
        count.textContent =
            `${total} result${total === 1 ? '' : 's'} for "${currentSearchTerm}"`;

        return;
    }

    count.textContent =
        `${total} service${total === 1 ? '' : 's'}`;
}

let saleCountdownInterval = null;
let saleCampaignActive = false;

function hideSaleBanner() {
    const offerBar = document.getElementById('offerBar');

    if (offerBar) {
        offerBar.hidden = true;
    }

    if (saleCountdownInterval) {
        clearInterval(saleCountdownInterval);
        saleCountdownInterval = null;
    }
}

function updateSaleCountdown(endsAt) {
    const endTime = new Date(endsAt).getTime();

    const daysElement = document.getElementById('saleDays');
    const hoursElement = document.getElementById('saleHours');
    const minutesElement = document.getElementById('saleMinutes');
    const secondsElement = document.getElementById('saleSeconds');

    function update() {
        const remaining = endTime - Date.now();

        if (remaining <= 0) {
    saleCampaignActive = false;

    hideSaleBanner();

    loadServices();

    return;
}

        const days = Math.floor(
            remaining / (1000 * 60 * 60 * 24)
        );

        const hours = Math.floor(
            (remaining / (1000 * 60 * 60)) % 24
        );

        const minutes = Math.floor(
            (remaining / (1000 * 60)) % 60
        );

        const seconds = Math.floor(
            (remaining / 1000) % 60
        );

        if (daysElement) {
            daysElement.textContent =
                `${String(days).padStart(2, '0')}d`;
        }

        if (hoursElement) {
            hoursElement.textContent =
                `${String(hours).padStart(2, '0')}h`;
        }

        if (minutesElement) {
            minutesElement.textContent =
                `${String(minutes).padStart(2, '0')}m`;
        }

        if (secondsElement) {
            secondsElement.textContent =
                `${String(seconds).padStart(2, '0')}s`;
        }
    }

    update();

    saleCountdownInterval = setInterval(
        update,
        1000
    );
}

async function loadSaleCampaign() {
    const offerBar =
        document.getElementById('offerBar');

    const titleElement =
        document.getElementById('saleTitle');

    saleCampaignActive = false;
    hideSaleBanner();

    if (!offerBar || !titleElement) {
        return false;
    }

    const { data, error } = await supabase
        .from('sale_campaign')
        .select('active, title, ends_at')
        .eq('id', 1)
        .maybeSingle();

    if (error) {
        console.error(
            'Error loading sale campaign:',
            error
        );

        return false;
    }

    if (
        !data ||
        data.active !== true ||
        !data.title ||
        !data.ends_at
    ) {
        return false;
    }

    const endTime =
        new Date(data.ends_at).getTime();

    if (
        Number.isNaN(endTime) ||
        endTime <= Date.now()
    ) {
        return false;
    }

    saleCampaignActive = true;

    const dismissedSale =
        localStorage.getItem(
            'dismissedSaleEndsAt'
        );

    if (dismissedSale !== data.ends_at) {
        titleElement.textContent = data.title;
        offerBar.hidden = false;
    }

    updateSaleCountdown(data.ends_at);

    const closeButtons = [
        document.getElementById('closeOffer'),
        document.getElementById(
            'closeOfferDesktop'
        )
    ];

    closeButtons.forEach(button => {
        if (!button) {
            return;
        }

        button.onclick = () => {
            localStorage.setItem(
                'dismissedSaleEndsAt',
                data.ends_at
            );

            hideSaleBanner();
        };
    });

    return true;
}

document.addEventListener(
    'DOMContentLoaded',
    async function() {

    document.getElementById('mobileWishlistBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('wishlistModal').classList.add('active');
        document.body.style.overflow = 'hidden';
        updateWishlistUI();
    });
    
    document.getElementById('openWishlistModal')?.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('wishlistModal').classList.add('active');
        document.body.style.overflow = 'hidden';
        updateWishlistUI();
    });
    
    document.getElementById('closeWishlist')?.addEventListener('click', function() {
        document.getElementById('wishlistModal').classList.remove('active');
        document.body.style.overflow = 'auto';
    });
    
    document.getElementById('wishlistModal')?.addEventListener('click', function(e) {
        if (e.target === this) {
            document.getElementById('wishlistModal').classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
    
    document.getElementById('wishlistBrowseDesigns')?.addEventListener('click', function() {
        document.getElementById('wishlistModal').classList.remove('active');
        document.body.style.overflow = 'auto';
        document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
    });
    
    document.getElementById('continueBrowsing')?.addEventListener('click', function() {
        document.getElementById('wishlistModal').classList.remove('active');
        document.body.style.overflow = 'auto';
        document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
    });
    
    document.getElementById('submitWishlist')?.addEventListener('click', function() {
        if (wishlistItems.length === 0) {
            showToast('Your wishlist is empty!', 'error');
            return;
        }
        let msg = "Hi! I'm interested in these designs:\n\n";
        wishlistItems.forEach((item, i) => {
            msg += `${i+1}. ${item.title} - ${item.tier} - ${item.price}\n`;
        });
        window.open(`https://wa.me/27817925033?text=${encodeURIComponent(msg)}`, '_blank');
    });
    
    document.getElementById('priceRangeInput')?.addEventListener('input', function() {
        setPriceRange(0, parseInt(this.value));
    });
    
    document.querySelectorAll('.tier-filter').forEach(cb => {
        cb.addEventListener('change', function() {
            if (this.checked) {
                if (!selectedTiers.includes(this.value)) selectedTiers.push(this.value);
            } else {
                const index = selectedTiers.indexOf(this.value);
                if (index > -1) selectedTiers.splice(index, 1);
                if (selectedTiers.length === 0) {
                    selectedTiers = ['starter', 'premium', 'pro'];
                    document.querySelectorAll('.tier-filter').forEach(c => c.checked = true);
                }
            }
            applyFilters();
        });
    });
    
await loadSaleCampaign();
await loadServices();

});

window.addEventListener('resize', () => {
    const newItemsPerPage =
        getItemsPerPage();

    if (newItemsPerPage !== itemsPerPage) {
        itemsPerPage =
            newItemsPerPage;

        currentPage = 1;

        renderServices();
    }

    updateTopDesignAutoplay();
});

window.openServicePage = function(
    event,
    serviceId
) {
    const interactiveElement =
        event.target.closest(
            'button, input, select, label, a'
        );

    if (interactiveElement) {
        return;
    }

    window.location.href =
        `service.html?id=${
            encodeURIComponent(serviceId)
        }`;
};


window.toggleWishlist = toggleWishlist;
window.removeFromWishlist = removeFromWishlist;
window.updateAllWishlistIcons = updateAllWishlistIcons;

console.log('✅ Services module loaded');
