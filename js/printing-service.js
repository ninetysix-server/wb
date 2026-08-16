import './image-loading.js';

import {
    printingServices
} from './printing.js';


const PRINTING_WHATSAPP_NUMBER = '27817925033';

let activeService = null;
let selections = {};
let customSizes = {};

const getElement = id =>
    document.getElementById(id);

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

function isCustomSizeOption(option) {
    return /^custom size$/i.test(
        String(option || '').trim()
    );
}

function getCustomSize(stepId) {
    return customSizes[stepId] || {
        width: '',
        height: '',
        unit: 'mm'
    };
}

function formatSelectionValue(step, selected) {
    if (
        !Array.isArray(selected) &&
        isCustomSizeOption(selected)
    ) {
        const customSize =
            getCustomSize(step.id);

        const width =
            String(customSize.width || '').trim();

        const height =
            String(customSize.height || '').trim();

        const unit =
            String(customSize.unit || 'mm').trim();

        if (width && height) {
            return `Custom Size — ${width} × ${height} ${unit}`;
        }

        return 'Custom Size — width and height required';
    }

    return Array.isArray(selected)
        ? selected.join(', ')
        : selected;
}

function getRequestedServiceId() {
    const parameters =
        new URLSearchParams(
            window.location.search
        );

    return Number(
        parameters.get('id')
    );
}

function showError() {
    getElement(
        'printingDetailLoading'
    ).hidden = true;

    getElement(
        'printingDetailContent'
    ).hidden = true;

    getElement(
        'printingDetailError'
    ).hidden = false;
}

function findRequestedService() {
    const serviceId =
        getRequestedServiceId();

    return printingServices.find(
        service =>
            Number(service.id) ===
            serviceId
    );
}

function displayServiceInformation() {
    document.title =
        `${activeService.title} | 96 Studios`;

    getElement(
        'printingBreadcrumbTitle'
    ).textContent =
        activeService.title;

    getElement(
        'printingServiceTitle'
    ).textContent =
        activeService.title;

    getElement(
        'printingServiceDescription'
    ).textContent =
        activeService.description;

    getElement(
        'printingServicePrice'
    ).textContent =
        activeService.price;

    const image =
        getElement(
            'printingServiceImage'
        );

    image.src =
        activeService.image;

    image.alt =
        activeService.title;
}

function renderFilterGroups() {
    const container =
        getElement(
            'printingFilterGroups'
        );

    container.innerHTML =
        activeService.steps
            .map((step, index) => {
                const isOpen =
                    index === 0 ||
                    hasSelection(step);

                return `
                    <section
                        class="
                            printing-filter-group
                            ${isOpen
                                ? 'is-open'
                                : ''
                            }
                        "
                        data-step-id="${escapeHtml(
                            step.id
                        )}"
                    >

                        <button
                            type="button"
                            class="printing-filter-group-heading"
                            data-filter-toggle="${escapeHtml(
                                step.id
                            )}"
                        >
                            <span>
                                ${escapeHtml(
                                    step.title
                                )}
                            </span>

                            <i class="fas fa-chevron-down"></i>
                        </button>

                        <div class="printing-filter-options">

                            ${step.options
                                .map(option =>
                                    createOptionMarkup(
                                        step,
                                        option
                                    )
                                )
                                .join('')
                            }

                        </div>

                    </section>
                `;
            })
            .join('');

    bindFilterEvents();
}

function createOptionMarkup(
    step,
    option
) {
    const inputType =
        step.type === 'multiple'
            ? 'checkbox'
            : 'radio';

    const selected =
        optionIsSelected(
            step,
            option
        );

    const customSize =
        isCustomSizeOption(option);

    const savedSize =
        getCustomSize(step.id);

    return `
        <div class="printing-filter-option-wrap">

            <label class="printing-filter-option">

                <input
                    type="${inputType}"
                    name="printing-${escapeHtml(
                        step.id
                    )}"
                    value="${escapeHtml(option)}"
                    data-step-id="${escapeHtml(
                        step.id
                    )}"
                    ${selected
                        ? 'checked'
                        : ''
                    }
                >

                <span>
                    ${escapeHtml(option)}
                </span>

            </label>

            ${customSize
                ? `
                    <div
                        class="
                            printing-custom-size-fields
                            ${selected
                                ? 'is-visible'
                                : ''
                            }
                        "
                        data-custom-size-fields="${escapeHtml(
                            step.id
                        )}"
                    >
                        <div class="printing-custom-size-heading">
                            Enter your exact dimensions
                        </div>

                        <div class="printing-custom-size-grid">

                            <label>
                                <span>Width</span>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    inputmode="decimal"
                                    placeholder="Width"
                                    value="${escapeHtml(
                                        savedSize.width
                                    )}"
                                    data-custom-size-input="width"
                                    data-custom-size-step="${escapeHtml(
                                        step.id
                                    )}"
                                >
                            </label>

                            <label>
                                <span>Height</span>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    inputmode="decimal"
                                    placeholder="Height"
                                    value="${escapeHtml(
                                        savedSize.height
                                    )}"
                                    data-custom-size-input="height"
                                    data-custom-size-step="${escapeHtml(
                                        step.id
                                    )}"
                                >
                            </label>

                            <label class="printing-custom-size-unit">
                                <span>Unit</span>
                                <select
                                    data-custom-size-unit
                                    data-custom-size-step="${escapeHtml(
                                        step.id
                                    )}"
                                >
                                    ${[
                                        'mm',
                                        'cm',
                                        'm'
                                    ].map(unit => `
                                        <option
                                            value="${unit}"
                                            ${savedSize.unit === unit
                                                ? 'selected'
                                                : ''
                                            }
                                        >
                                            ${unit}
                                        </option>
                                    `).join('')}
                                </select>
                            </label>

                        </div>

                        <p>
                            Enter the finished print width and height.
                        </p>
                    </div>
                `
                : ''
            }

        </div>
    `;
}

function bindFilterEvents() {
    document
        .querySelectorAll(
            '[data-filter-toggle]'
        )
        .forEach(button => {
            button.addEventListener(
                'click',
                function() {
                    const group =
                        this.closest(
                            '.printing-filter-group'
                        );

                    group?.classList.toggle(
                        'is-open'
                    );
                }
            );
        });

    document
        .querySelectorAll(
            '.printing-filter-option input'
        )
        .forEach(input => {
            input.addEventListener(
                'change',
                function() {
                    updateSelection(
                        this.dataset.stepId,
                        this.value,
                        this.type,
                        this.checked
                    );
                }
            );
        });

    document
        .querySelectorAll(
            '[data-custom-size-input]'
        )
        .forEach(input => {
            input.addEventListener(
                'input',
                function() {
                    const stepId =
                        this.dataset.customSizeStep;

                    const field =
                        this.dataset.customSizeInput;

                    const current =
                        getCustomSize(stepId);

                    customSizes[stepId] = {
                        ...current,
                        [field]: this.value
                    };

                    renderQuotationSummary();
                }
            );
        });

    document
        .querySelectorAll(
            '[data-custom-size-unit]'
        )
        .forEach(select => {
            select.addEventListener(
                'change',
                function() {
                    const stepId =
                        this.dataset.customSizeStep;

                    customSizes[stepId] = {
                        ...getCustomSize(stepId),
                        unit: this.value
                    };

                    renderQuotationSummary();
                }
            );
        });
}

function getStep(stepId) {
    return activeService.steps.find(
        step =>
            String(step.id) ===
            String(stepId)
    );
}

function hasSelection(step) {
    const selected =
        selections[step.id];

    if (step.type === 'multiple') {
        return (
            Array.isArray(selected) &&
            selected.length > 0
        );
    }

    return Boolean(selected);
}

function optionIsSelected(
    step,
    option
) {
    const selected =
        selections[step.id];

    if (step.type === 'multiple') {
        return (
            Array.isArray(selected) &&
            selected.includes(option)
        );
    }

    return selected === option;
}

function updateSelection(
    stepId,
    option,
    inputType,
    checked
) {
    const step =
        getStep(stepId);

    if (!step) {
        return;
    }

    if (
        step.type === 'multiple' ||
        inputType === 'checkbox'
    ) {
        const currentValues =
            Array.isArray(
                selections[step.id]
            )
                ? [
                    ...selections[step.id]
                ]
                : [];

        const existingIndex =
            currentValues.indexOf(
                option
            );

        if (
            checked &&
            existingIndex === -1
        ) {
            currentValues.push(
                option
            );
        }

        if (
            !checked &&
            existingIndex >= 0
        ) {
            currentValues.splice(
                existingIndex,
                1
            );
        }

        selections[step.id] =
            currentValues;
    } else {
        selections[step.id] =
            option;
    }

    document
        .querySelectorAll(
            `[data-custom-size-fields="${CSS.escape(
                String(step.id)
            )}"]`
        )
        .forEach(fields => {
            fields.classList.toggle(
                'is-visible',
                isCustomSizeOption(
                    selections[step.id]
                )
            );
        });

    if (
        isCustomSizeOption(
            selections[step.id]
        )
    ) {
        const widthInput =
            document.querySelector(
                `[data-custom-size-input="width"]` +
                `[data-custom-size-step="${CSS.escape(
                    String(step.id)
                )}"]`
            );

        window.setTimeout(
            () => widthInput?.focus(),
            50
        );
    }

    openNextFilterGroup(step.id);
    renderQuotationSummary();
}

function openNextFilterGroup(
    currentStepId
) {
    const currentIndex =
        activeService.steps.findIndex(
            step =>
                String(step.id) ===
                String(currentStepId)
        );

    const nextStep =
        activeService.steps[
            currentIndex + 1
        ];

    if (!nextStep) {
        return;
    }

    const nextGroup =
        document.querySelector(
            `[data-step-id="${CSS.escape(
                String(nextStep.id)
            )}"]`
        );

    nextGroup?.classList.add(
        'is-open'
    );
}

function renderQuotationSummary() {
    const container =
        getElement(
            'printingSummaryList'
        );

    const selectedSteps =
        activeService.steps.filter(
            step =>
                hasSelection(step)
        );

    if (!selectedSteps.length) {
        container.innerHTML = `
            <p class="printing-summary-empty">
                Choose your specifications from the menu.
            </p>
        `;

        return;
    }

    container.innerHTML =
        selectedSteps
            .map(step => {
                const selected =
                    selections[step.id];

                const value =
                    formatSelectionValue(
                        step,
                        selected
                    );

                return `
                    <div class="printing-summary-item">

                        <span>
                            ${escapeHtml(
                                step.title
                            )}
                        </span>

                        <strong>
                            ${escapeHtml(
                                value
                            )}
                        </strong>

                    </div>
                `;
            })
            .join('');
}

function getMissingSteps() {
    return activeService.steps.filter(
        step =>
            !hasSelection(step)
    );
}

function showValidationMessage(
    message
) {
    document
        .querySelectorAll(
            '.custom-toast'
        )
        .forEach(toast =>
            toast.remove()
        );

    const toast =
        document.createElement(
            'div'
        );

    toast.className =
        'custom-toast error';

    toast.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${escapeHtml(message)}</span>
    `;

    document.body.appendChild(
        toast
    );

    requestAnimationFrame(() => {
        toast.classList.add(
            'show'
        );
    });

    window.setTimeout(() => {
        toast.classList.remove(
            'show'
        );

        window.setTimeout(
            () => toast.remove(),
            350
        );
    }, 3200);
}

function validateQuotation() {
    const missingSteps =
        getMissingSteps();

    if (missingSteps.length) {
        showValidationMessage(
            `Please complete: ${
                missingSteps[0].title
            }`
        );

        const missingGroup =
            document.querySelector(
                `[data-step-id="${CSS.escape(
                    String(
                        missingSteps[0].id
                    )
                )}"]`
            );

        missingGroup?.classList.add(
            'is-open'
        );

        missingGroup?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });

        return false;
    }

    const customSizeStep =
        activeService.steps.find(
            step =>
                isCustomSizeOption(
                    selections[step.id]
                )
        );

    if (customSizeStep) {
        const customSize =
            getCustomSize(
                customSizeStep.id
            );

        const width =
            Number(customSize.width);

        const height =
            Number(customSize.height);

        if (
            !Number.isFinite(width) ||
            width <= 0
        ) {
            showValidationMessage(
                'Please enter a valid custom width.'
            );

            document
                .querySelector(
                    `[data-custom-size-input="width"]` +
                    `[data-custom-size-step="${CSS.escape(
                        String(customSizeStep.id)
                    )}"]`
                )
                ?.focus();

            return false;
        }

        if (
            !Number.isFinite(height) ||
            height <= 0
        ) {
            showValidationMessage(
                'Please enter a valid custom height.'
            );

            document
                .querySelector(
                    `[data-custom-size-input="height"]` +
                    `[data-custom-size-step="${CSS.escape(
                        String(customSizeStep.id)
                    )}"]`
                )
                ?.focus();

            return false;
        }
    }

    const customerName =
        getElement(
            'printingCustomerName'
        ).value.trim();

    const customerPhone =
        getElement(
            'printingCustomerPhone'
        ).value.trim();

    if (!customerName) {
        showValidationMessage(
            'Please enter your name.'
        );

        getElement(
            'printingCustomerName'
        ).focus();

        return false;
    }

    if (!customerPhone) {
        showValidationMessage(
            'Please enter your phone number.'
        );

        getElement(
            'printingCustomerPhone'
        ).focus();

        return false;
    }

    return true;
}

function buildWhatsAppMessage() {
    const customerName =
        getElement(
            'printingCustomerName'
        ).value.trim();

    const customerPhone =
        getElement(
            'printingCustomerPhone'
        ).value.trim();

    const notes =
        getElement(
            'printingCustomerNotes'
        ).value.trim();

    const selectionLines =
        activeService.steps.flatMap(
            step => {
                const selected =
                    selections[step.id];

                if (
                    !selected ||
                    (
                        Array.isArray(
                            selected
                        ) &&
                        selected.length === 0
                    )
                ) {
                    return [];
                }

                const value =
                    formatSelectionValue(
                        step,
                        selected
                    );

                return [
                    `${step.title}:`,
                    value,
                    ''
                ];
            }
        );

    return [
        'Hello 96 Studios,',
        '',
        'I would like to request a printing quotation.',
        '',
        'CUSTOMER DETAILS',
        `Name: ${customerName}`,
        `Phone: ${customerPhone}`,
        '',
        'PRINTING SERVICE',
        activeService.title,
        '',
        'SELECTED OPTIONS',
        '',
        ...selectionLines,
        `Starting Price: ${activeService.price}`,
        '',
        'ADDITIONAL INFORMATION',
        notes || 'No additional information provided.',
        '',
        'I understand that the final price, availability and production time will be confirmed after reviewing my request.',
        '',
        'Thank you.'
    ].join('\n');
}

function submitQuotation() {
    if (!validateQuotation()) {
        return;
    }

    const message =
        buildWhatsAppMessage();

    const whatsappUrl =
        `https://wa.me/${PRINTING_WHATSAPP_NUMBER}` +
        `?text=${encodeURIComponent(
            message
        )}`;

    window.open(
        whatsappUrl,
        '_blank',
        'noopener,noreferrer'
    );
}

function bindHeaderSearch() {
    getElement(
        'printingPageSearchForm'
    )?.addEventListener(
        'submit',
        function(event) {
            event.preventDefault();

            const query =
                getElement(
                    'printingPageSearchInput'
                ).value.trim();

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

function initialisePrintingPage() {
    activeService =
        findRequestedService();

    if (!activeService) {
        showError();
        return;
    }

    selections = {};
    customSizes = {};

    displayServiceInformation();
    renderFilterGroups();
    renderQuotationSummary();
    bindHeaderSearch();

    getElement(
        'submitPrintingQuotation'
    )?.addEventListener(
        'click',
        submitQuotation
    );

    getElement(
        'printingDetailLoading'
    ).hidden = true;

    getElement(
        'printingDetailError'
    ).hidden = true;

    getElement(
        'printingDetailContent'
    ).hidden = false;
}


document.addEventListener(
    'DOMContentLoaded',
    initialisePrintingPage
);