const IMAGE_LOADING_SELECTOR = [
    '.product-image img',
    '.printing-card-background',
    '#serviceMainImage',
    '.service-detail-thumbnail img',
    '#printingServiceImage'
].join(',');

function getImageLoaderContainer(image) {
    return (
        image.closest('.product-image') ||
        image.closest('.printing-card') ||
        image.closest('.service-detail-main-image') ||
        image.closest('.service-detail-thumbnail') ||
        image.closest('.printing-product-image') ||
        image.parentElement
    );
}

function markImageLoaded(image) {
    const container = getImageLoaderContainer(image);

    image.classList.remove('professional-image-is-loading');
    image.classList.add('professional-image-is-loaded');

    if (container) {
        container.classList.remove('professional-image-loader');
        container.classList.add('professional-image-loader-complete');
    }
}

function markImageError(image) {
    const container = getImageLoaderContainer(image);

    image.classList.remove('professional-image-is-loading');

    if (container) {
        container.classList.remove('professional-image-loader');
        container.classList.add('professional-image-loader-error');
    }
}

function prepareImageLoader(image) {
    if (!(image instanceof HTMLImageElement)) {
        return;
    }

    const container = getImageLoaderContainer(image);

    if (!container) {
        return;
    }

    container.classList.remove(
        'professional-image-loader-complete',
        'professional-image-loader-error'
    );

    container.classList.add('professional-image-loader');

    image.classList.remove('professional-image-is-loaded');
    image.classList.add('professional-image-is-loading');

    image.addEventListener(
        'load',
        () => markImageLoaded(image),
        { once: true }
    );

    image.addEventListener(
        'error',
        () => markImageError(image),
        { once: true }
    );

    if (image.complete) {
        if (image.naturalWidth > 0) {
            markImageLoaded(image);
        } else if (image.currentSrc || image.src) {
            markImageError(image);
        }
    }
}

function scanProfessionalImages(root = document) {
    if (
        root instanceof HTMLImageElement &&
        root.matches(IMAGE_LOADING_SELECTOR)
    ) {
        prepareImageLoader(root);
    }

    root
        .querySelectorAll?.(IMAGE_LOADING_SELECTOR)
        .forEach(prepareImageLoader);
}

function initialiseProfessionalImageLoading() {
    scanProfessionalImages(document);

    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (
                mutation.type === 'attributes' &&
                mutation.target instanceof HTMLImageElement &&
                mutation.target.matches(IMAGE_LOADING_SELECTOR)
            ) {
                prepareImageLoader(mutation.target);
                return;
            }

            mutation.addedNodes.forEach(node => {
                if (node instanceof Element) {
                    scanProfessionalImages(node);
                }
            });
        });
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'srcset']
    });
}

if (document.readyState === 'loading') {
    document.addEventListener(
        'DOMContentLoaded',
        initialiseProfessionalImageLoading,
        { once: true }
    );
} else {
    initialiseProfessionalImageLoading();
}
