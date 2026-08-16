import {
    getServices
} from './supabase.js';

import {
    cartManager
} from './cart.js';


let currentService = null;
let selectedTierName = 'Starter';
let serviceQuantity = 1;

const $ = id => document.getElementById(id);

function safeText(value, fallback = '') {
    const text = String(value ?? '').trim();

    return text || fallback;
}

function numberValue(value, fallback = 0) {
    const amount = Number(value);

    return Number.isFinite(amount)
        ? amount
        : fallback;
}

function money(value) {
    return `R${numberValue(value).toFixed(2)}`;
}

function escapeHtml(value) {
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

function showToast(
    message,
    type = 'success'
) {
    document
        .querySelectorAll(
            '.custom-toast, .toast-notification'
        )
        .forEach(toast => toast.remove());

    const toast =
        document.createElement('div');

    toast.className =
        `custom-toast ${type}`;

    const icon =
        type === 'success'
            ? 'fa-check-circle'
            : type === 'error'
                ? 'fa-exclamation-circle'
                : 'fa-info-circle';

    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${escapeHtml(message)}</span>
    `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    window.setTimeout(() => {
        toast.classList.remove('show');

        window.setTimeout(
            () => toast.remove(),
            400
        );
    }, 3000);
}

function getRequestedServiceIdentifier() {
    const parameters =
        new URLSearchParams(
            window.location.search
        );

    return safeText(
        parameters.get('id') ||
        parameters.get('service') ||
        parameters.get('slug')
    );
}

function findRequestedService(
    services,
    identifier
) {
    const requested =
        String(identifier).toLowerCase();

    return services.find(service => {
        const id =
            String(service.id || '')
                .toLowerCase();

        const slug =
            String(service.slug || '')
                .toLowerCase();

        return (
            id === requested ||
            slug === requested
        );
    });
}

function getServiceFeatures(service) {
    return (
        service.features &&
        typeof service.features === 'object'
    )
        ? service.features
        : {};
}

function createTier(
    service,
    tierName
) {
    const key =
        tierName.toLowerCase();

    const salePrice =
        numberValue(
            service[`${key}_price`],
            NaN
        );

    const originalPrice =
        numberValue(
            service[`${key}_original_price`],
            NaN
        );

    const features =
        getServiceFeatures(service);

    const currentPrice =
        Number.isFinite(salePrice)
            ? salePrice
            : Number.isFinite(originalPrice)
                ? originalPrice
                : 0;

    const validOriginalPrice =
        Number.isFinite(originalPrice) &&
        originalPrice > currentPrice
            ? originalPrice
            : null;

    return {
        name: tierName,

        price: currentPrice,

        originalPrice:
            validOriginalPrice,

        description:
            safeText(
                service[
                    `${key}_description`
                ],
                service.description
            ),

        features:
            Array.isArray(features[key])
                ? features[key]
                : []
    };
}

function getServiceTiers(service) {
    return [
        createTier(service, 'Starter'),
        createTier(service, 'Premium'),
        createTier(service, 'Pro')
    ].filter(tier =>
        tier.price > 0 ||
        tier.features.length > 0
    );
}

function getSelectedTier() {
    const tiers =
        getServiceTiers(currentService);

    return (
        tiers.find(
            tier =>
                tier.name ===
                selectedTierName
        ) ||
        tiers[0] ||
        null
    );
}

function getServiceMainImage(service) {
    const possibleImages = [
        service.image_url,
        service.imageUrl,
        service.service_image,
        service.thumbnail_url,
        service.thumbnail,
        service.image
    ];

    const foundImage =
        possibleImages.find(value =>
            typeof value === 'string' &&
            value.trim()
        );

    if (foundImage) {
        return foundImage;
    }

    const title =
        String(
            service.title || ''
        ).toLowerCase();

    if (title.includes('logo')) {
        return 'assets/images/tp-h/vr_logo-design.png';
    }

    if (title.includes('poster')) {
        return 'assets/images/tp-h/vr_poster.png';
    }

    if (title.includes('business card')) {
        return 'assets/images/tp-h/vr_business-card.png';
    }

    if (title.includes('board')) {
        return 'assets/images/tp-h/vr_board-design.png';
    }

    return 'assets/images/cart-title-image.png';
}

function getServiceGalleryImages(service) {
    const images = [];

    const mainImage =
        getServiceMainImage(service);

    images.push(mainImage);

    const possibleCollections = [
        service.gallery_images,
        service.gallery,
        service.images,
        service.preview_images
    ];

    possibleCollections.forEach(collection => {
        if (!Array.isArray(collection)) {
            return;
        }

        collection.forEach(item => {
            const image =
                typeof item === 'string'
                    ? item
                    : (
                        item?.url ||
                        item?.image_url ||
                        item?.src
                    );

            if (
                image &&
                typeof image === 'string'
            ) {
                images.push(image);
            }
        });
    });

    return [
        ...new Set(
            images.filter(Boolean)
        )
    ];
}

function renderServiceInformation() {
    const service =
        currentService;

    const tiers =
        getServiceTiers(service);

    if (!tiers.length) {
        throw new Error(
            'No package information is available.'
        );
    }

    if (
        !tiers.some(
            tier =>
                tier.name ===
                selectedTierName
        )
    ) {
        selectedTierName =
            tiers[0].name;
    }

    document.title =
        `${service.title} | 96 Studios`;

    $('serviceCategory').textContent =
        safeText(
            service.category,
            'Design Service'
        );

    $('serviceTitle').textContent =
        safeText(
            service.title,
            'Design Service'
        );

    $('serviceDescription').textContent =
        safeText(
            service.description,
            'Professional design service created for your business.'
        );

    renderGallery();
    renderTierOptions();
    renderSelectedTier();
    renderSpecialOptions();
}


function renderGallery() {
    const images =
        getServiceGalleryImages(
            currentService
        );

    const mainImage =
        $('serviceMainImage');

    mainImage.src =
        images[0];

    mainImage.alt =
        safeText(
            currentService.title,
            'Design service'
        );

    const thumbnailContainer =
        $('serviceThumbnails');

    thumbnailContainer.innerHTML =
        images
            .slice(0, 6)
            .map((image, index) => `
                <button
                    type="button"
                    class="
                        service-detail-thumbnail
                        ${index === 0
                            ? 'active'
                            : ''
                        }
                    "
                    data-image="${escapeHtml(
                        image
                    )}"
                    aria-label="View image ${
                        index + 1
                    }"
                >
                    <img
                        src="${escapeHtml(image)}"
                        alt=""
                    >
                </button>
            `)
            .join('');

    thumbnailContainer
        .querySelectorAll(
            '.service-detail-thumbnail'
        )
        .forEach(button => {
            button.addEventListener(
                'click',
                function() {
                    mainImage.src =
                        this.dataset.image;

                    thumbnailContainer
                        .querySelectorAll(
                            '.service-detail-thumbnail'
                        )
                        .forEach(item =>
                            item.classList
                                .remove('active')
                        );

                    this.classList.add(
                        'active'
                    );
                }
            );
        });
}


function renderTierOptions() {
    const tiers =
        getServiceTiers(
            currentService
        );

    $('serviceTierOptions').innerHTML =
        tiers.map(tier => `
            <button
                type="button"
                class="
                    service-detail-tier
                    ${tier.name ===
                    selectedTierName
                        ? 'active'
                        : ''
                    }
                "
                data-tier="${escapeHtml(
                    tier.name
                )}"
            >
                <strong>
                    ${escapeHtml(
                        tier.name
                    )}
                </strong>

                <span>
                    ${money(tier.price)}
                </span>
            </button>
        `).join('');

    $('serviceTierOptions')
        .querySelectorAll(
            '.service-detail-tier'
        )
        .forEach(button => {
            button.addEventListener(
                'click',
                function() {
                    selectedTierName =
                        this.dataset.tier;

                    renderTierOptions();
                    renderSelectedTier();
                    renderSpecialOptions();
                }
            );
        });
}


function renderSelectedTier() {
    const tier =
        getSelectedTier();

    if (!tier) {
        return;
    }

    $('selectedTierName').textContent =
        tier.name;

    $('serviceCurrentPrice').textContent =
        money(
            calculateCurrentTotal()
        );

    const originalPriceElement =
        $('serviceOriginalPrice');

    const savingElement =
        $('serviceSaving');

    if (
        tier.originalPrice &&
        tier.originalPrice > tier.price
    ) {
        originalPriceElement.hidden =
            false;

        originalPriceElement.textContent =
            money(tier.originalPrice);

        const saving =
            Math.round(
                (
                    (
                        tier.originalPrice -
                        tier.price
                    ) /
                    tier.originalPrice
                ) *
                100
            );

        savingElement.hidden = false;
        savingElement.textContent =
            `Save ${saving}%`;
    } else {
        originalPriceElement.hidden =
            true;

        originalPriceElement.textContent =
            '';

        savingElement.hidden = true;
        savingElement.textContent =
            '';
    }

    const features =
        tier.features.length
            ? tier.features
            : [
                tier.description ||
                currentService.description
            ].filter(Boolean);

    $('serviceFeatureList').innerHTML =
        features.map(feature => `
            <li>
                ${escapeHtml(feature)}
            </li>
        `).join('');
}

function getPrintingOptions() {
    if (
        currentService
            .printing_enabled !== true ||
        !Array.isArray(
            currentService
                .printing_options
        )
    ) {
        return [];
    }

    return currentService
        .printing_options
        .filter(
            option =>
                option.active !== false
        )
        .map(option => ({
            id:
                safeText(option.id),

            size:
                safeText(
                    option.size,
                    'Standard'
                ),

            price:
                numberValue(
                    option.price_per_copy
                ),

            minimum:
                Math.max(
                    1,
                    numberValue(
                        option.minimum_quantity,
                        1
                    )
                ),

            maximum:
                option.maximum_quantity ===
                    null ||
                option.maximum_quantity ===
                    undefined ||
                option.maximum_quantity === ''
                    ? null
                    : Math.max(
                        1,
                        numberValue(
                            option.maximum_quantity,
                            1
                        )
                    )
        }));
}


function renderSpecialOptions() {
    const container =
        $('serviceSpecialOptions');

    const sections = [];

    if (
        currentService
            .has_page_quantity === true
    ) {
        const maximum =
            Math.max(
                1,
                numberValue(
                    currentService.max_pages,
                    1
                )
            );

        sections.push(`
            <div class="service-detail-option-panel">

                <h3>
                    Document pages
                </h3>

                <div class="service-detail-option-row">

                    <label for="serviceDetailPages">
                        Number of pages
                    </label>

                    <input
                        type="number"
                        id="serviceDetailPages"
                        value="1"
                        min="1"
                        max="${maximum}"
                    >

                </div>

                <small>
                    First page:
                    ${money(
                        currentService.base_price
                    )}
                    · Additional pages:
                    ${money(
                        currentService.price_per_page
                    )}
                    each
                </small>

            </div>
        `);
    }

    const printingOptions =
        getPrintingOptions();

    if (printingOptions.length) {
        const firstOption =
            printingOptions[0];

        sections.push(`
            <div class="service-detail-option-panel">

                <h3>
                    Printing
                </h3>

                <label class="service-detail-print-toggle">

                    <input
                        type="checkbox"
                        id="serviceDetailPrintingEnabled"
                    >

                    <span>
                        Print this design
                    </span>

                </label>

                <div
                    id="serviceDetailPrintingFields"
                    hidden
                >

                    <div class="service-detail-option-row">

                        <label for="serviceDetailPrintSize">
                            Print size
                        </label>

                        <select id="serviceDetailPrintSize">

                            ${printingOptions.map(
                                option => `
                                    <option
                                        value="${escapeHtml(
                                            option.id
                                        )}"
                                        data-size="${escapeHtml(
                                            option.size
                                        )}"
                                        data-price="${
                                            option.price
                                        }"
                                        data-minimum="${
                                            option.minimum
                                        }"
                                        data-maximum="${
                                            option.maximum ??
                                            ''
                                        }"
                                    >
                                        ${escapeHtml(
                                            option.size
                                        )}
                                        —
                                        ${money(
                                            option.price
                                        )}
                                        per copy
                                    </option>
                                `
                            ).join('')}

                        </select>

                    </div>

                    <div class="service-detail-option-row">

                        <label for="serviceDetailPrintCopies">
                            Number of copies
                        </label>

                        <input
                            type="number"
                            id="serviceDetailPrintCopies"
                            value="${firstOption.minimum}"
                            min="${firstOption.minimum}"
                            ${
                                firstOption.maximum
                                    ? `max="${firstOption.maximum}"`
                                    : ''
                            }
                        >

                    </div>

                </div>

            </div>
        `);
    }

    container.innerHTML =
        sections.join('');

    bindSpecialOptionEvents();
}


function bindSpecialOptionEvents() {
    const pagesInput =
        $('serviceDetailPages');

    pagesInput?.addEventListener(
        'input',
        updateDisplayedTotal
    );

    const printingToggle =
        $('serviceDetailPrintingEnabled');

    const printingFields =
        $('serviceDetailPrintingFields');

    printingToggle?.addEventListener(
        'change',
        function() {
            printingFields.hidden =
                !this.checked;

            updateDisplayedTotal();
        }
    );

    const sizeSelect =
        $('serviceDetailPrintSize');

    sizeSelect?.addEventListener(
        'change',
        function() {
            const selected =
                this.selectedOptions[0];

            const copiesInput =
                $('serviceDetailPrintCopies');

            const minimum =
                Math.max(
                    1,
                    numberValue(
                        selected.dataset.minimum,
                        1
                    )
                );

            const maximum =
                selected.dataset.maximum
                    ? numberValue(
                        selected.dataset.maximum
                    )
                    : null;

            copiesInput.min =
                minimum;

            copiesInput.value =
                minimum;

            if (maximum) {
                copiesInput.max =
                    maximum;
            } else {
                copiesInput.removeAttribute(
                    'max'
                );
            }

            updateDisplayedTotal();
        }
    );

    $('serviceDetailPrintCopies')
        ?.addEventListener(
            'input',
            updateDisplayedTotal
        );
}

function getPageSelection() {
    if (
        currentService
            .has_page_quantity !== true
    ) {
        return null;
    }

    const maximum =
        Math.max(
            1,
            numberValue(
                currentService.max_pages,
                1
            )
        );

    const input =
        $('serviceDetailPages');

    let pages =
        Math.max(
            1,
            numberValue(
                input?.value,
                1
            )
        );

    pages =
        Math.min(
            pages,
            maximum
        );

    if (input) {
        input.value = pages;
    }

    const basePrice =
        numberValue(
            currentService.base_price
        );

    const pricePerPage =
        numberValue(
            currentService.price_per_page
        );

    const additionalPages =
        Math.max(
            0,
            pages - 1
        );

    return {
        pages,
        basePrice,
        pricePerPage,
        additionalPages,

        total:
            basePrice +
            additionalPages *
            pricePerPage
    };
}


function getPrintingSelection() {
    const enabled =
        $('serviceDetailPrintingEnabled')
            ?.checked === true;

    if (!enabled) {
        return {
            selected: false,
            total: 0
        };
    }

    const select =
        $('serviceDetailPrintSize');

    const selectedOption =
        select?.selectedOptions?.[0];

    const copiesInput =
        $('serviceDetailPrintCopies');

    if (
        !selectedOption ||
        !copiesInput
    ) {
        return {
            selected: false,
            total: 0
        };
    }

    const minimum =
        Math.max(
            1,
            numberValue(
                selectedOption
                    .dataset.minimum,
                1
            )
        );

    const maximum =
        selectedOption
            .dataset.maximum
            ? numberValue(
                selectedOption
                    .dataset.maximum
            )
            : null;

    let copies =
        Math.max(
            minimum,
            numberValue(
                copiesInput.value,
                minimum
            )
        );

    if (maximum) {
        copies =
            Math.min(
                copies,
                maximum
            );
    }

    copiesInput.value =
        copies;

    const pricePerCopy =
        numberValue(
            selectedOption
                .dataset.price
        );

    return {
        selected: true,

        optionId:
            selectedOption.value,

        size:
            selectedOption
                .dataset.size,

        copies,
        pricePerCopy,

        total:
            copies *
            pricePerCopy
    };
}


function calculateCurrentTotal() {
    if (!currentService) {
        return 0;
    }

    const tier =
        getSelectedTier();

    let designPrice =
        tier?.price || 0;

    const pageSelection =
        getPageSelection();

    if (pageSelection) {
        designPrice =
            pageSelection.total;
    }

    const printing =
        getPrintingSelection();

    return (
        designPrice +
        printing.total
    );
}


function updateDisplayedTotal() {
    $('serviceCurrentPrice').textContent =
        money(
            calculateCurrentTotal()
        );
}

function buildCartDetails() {
    const tier =
        getSelectedTier();

    const pages =
        getPageSelection();

    const printing =
        getPrintingSelection();

    const designPrice =
        pages
            ? pages.total
            : tier.price;

    const originalPrice =
        tier.originalPrice || null;

    const discountPercentage =
        originalPrice &&
        originalPrice > tier.price
            ? Math.round(
                (
                    (
                        originalPrice -
                        tier.price
                    ) /
                    originalPrice
                ) *
                100
            )
            : 0;

    return {
        tier:
            pages
                ? 'Standard'
                : tier.name,

        slug:
            currentService.slug,

        category:
            currentService.category,

        originalPrice,
        discountPercentage,

        servicePrice:
            designPrice,

        pages:
            pages?.pages || 0,

        basePrice:
            pages?.basePrice || 0,

        additionalPages:
            pages?.additionalPages || 0,

        pricePerPage:
            pages?.pricePerPage || 0,

        printingEnabled:
            currentService
                .printing_enabled === true,

        printingSelected:
            printing.selected,

        printingOptionId:
            printing.optionId || null,

        printingSize:
            printing.size || null,

        printingCopies:
            printing.copies || 0,

        printingPricePerCopy:
            printing.pricePerCopy || 0,

        printingPrice:
            printing.total || 0,

        calculatedTotal:
            designPrice +
            printing.total
    };
}


async function addCurrentServiceToCart() {

    const tier =
        getSelectedTier();

    if (!tier) {
        showToast(
            'No package is available for this service.',
            'error'
        );

        return;
    }

    const details =
        buildCartDetails();

    const total =
        numberValue(
            details.calculatedTotal
        );

    cartManager.addItem(
    currentService.id,

    details.pages
        ? 'Standard'
        : tier.name,

    currentService.title,

    money(total),

    serviceQuantity,

    details
);

await cartManager.saveCart();

updateCartCount();

    showToast(
        `${currentService.title} added to your cart.`,
        'success'
    );
}


function getStoredCartQuantity() {
    const possibleKeys = [
        'designStudioGuestCart'
    ];

    Object.keys(localStorage)
        .filter(key =>
            key.startsWith(
                'designStudioCart_'
            )
        )
        .forEach(key =>
            possibleKeys.push(key)
        );

    let total = 0;

    possibleKeys.forEach(key => {
        try {
            const items =
                JSON.parse(
                    localStorage.getItem(key) ||
                    '[]'
                );

            if (Array.isArray(items)) {
                total += items.reduce(
                    (
                        sum,
                        item
                    ) =>
                        sum +
                        Math.max(
                            1,
                            numberValue(
                                item.quantity,
                                1
                            )
                        ),
                    0
                );
            }
        } catch {
        }
    });

    return total;
}


function updateCartCount() {
    const counter =
        $('servicePageCartCount');

    if (counter) {
        counter.textContent =
            getStoredCartQuantity();
    }
}

function getWishlistItems() {
    try {
        const saved =
            JSON.parse(
                localStorage.getItem(
                    'designWishlist'
                ) ||
                '[]'
            );

        return Array.isArray(saved)
            ? saved
            : [];
    } catch {
        return [];
    }
}


function serviceIsInWishlist() {
    return getWishlistItems().some(
        item =>
            String(item.id) ===
            String(currentService.id)
    );
}


function updateWishlistButton() {
    const button =
        $('serviceAddToWishlist');

    if (!button) {
        return;
    }

    const selected =
        serviceIsInWishlist();

    button.innerHTML = selected
        ? `
            <i class="fas fa-heart"></i>
            Remove from Wishlist
        `
        : `
            <i class="far fa-heart"></i>
            Add to Wishlist
        `;
}


function toggleCurrentWishlist() {
    const wishlist =
        getWishlistItems();

    const index =
        wishlist.findIndex(
            item =>
                String(item.id) ===
                String(currentService.id)
        );

    if (index >= 0) {
        wishlist.splice(index, 1);

        showToast(
            'Removed from your wishlist.',
            'info'
        );
    } else {
        const tier =
            getSelectedTier();

        wishlist.push({
            id:
                currentService.id,

            title:
                currentService.title,

            tier:
                tier?.name ||
                'Starter',

            price:
                tier
                    ? money(tier.price)
                    : 'Contact',

            description:
                tier?.description ||
                currentService.description ||
                '',

            category:
                currentService.category ||
                'Design',

            addedAt:
                new Date().toISOString()
        });

        showToast(
            'Added to your wishlist.',
            'success'
        );
    }

    localStorage.setItem(
        'designWishlist',
        JSON.stringify(wishlist)
    );

    updateWishlistButton();
}

function bindPageEvents() {
    $('decreaseServiceQuantity')
        ?.addEventListener(
            'click',
            function() {
                serviceQuantity =
                    Math.max(
                        1,
                        serviceQuantity - 1
                    );

                $('serviceQuantity').value =
                    serviceQuantity;
            }
        );

    $('increaseServiceQuantity')
        ?.addEventListener(
            'click',
            function() {
                serviceQuantity += 1;

                $('serviceQuantity').value =
                    serviceQuantity;
            }
        );

    $('serviceAddToCart')
        ?.addEventListener(
            'click',
            addCurrentServiceToCart
        );

    $('serviceAddToWishlist')
        ?.addEventListener(
            'click',
            toggleCurrentWishlist
        );

    $('servicePageSearchForm')
        ?.addEventListener(
            'submit',
            function(event) {
                event.preventDefault();

                const query =
                    safeText(
                        $('servicePageSearchInput')
                            ?.value
                    );

                if (!query) {
                    return;
                }

                window.location.href =
                    `index.html?search=${
                        encodeURIComponent(
                            query
                        )
                    }#services`;
            }
        );
}

async function initialiseServicePage() {
    const identifier =
        getRequestedServiceIdentifier();

    if (!identifier) {
        showServiceError();
        return;
    }

    try {
        const services =
            await getServices();

        currentService =
            findRequestedService(
                services,
                identifier
            );

        if (!currentService) {
            showServiceError();
            return;
        }

        renderServiceInformation();
        bindPageEvents();
        updateCartCount();
        updateWishlistButton();

        $('serviceDetailLoading').hidden =
            true;

        $('serviceDetailError').hidden =
            true;

        $('serviceDetailContent').hidden =
            false;
    } catch (error) {
        console.error(
            'Unable to load service:',
            error
        );

        showServiceError();
    }
}


function showServiceError() {
    $('serviceDetailLoading').hidden =
        true;

    $('serviceDetailContent').hidden =
        true;

    $('serviceDetailError').hidden =
        false;
}


document.addEventListener(
    'DOMContentLoaded',
    initialiseServicePage
);