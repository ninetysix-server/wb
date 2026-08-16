const getElement = id =>
    document.getElementById(id);

function initialiseBeforeAfterSlider() {
    const sliders =
        document.querySelectorAll(
            '[data-before-after-slider]'
        );

    sliders.forEach(slider => {
        const range =
            slider.querySelector(
                '[data-before-after-range]'
            );

        const afterWrapper =
            slider.querySelector(
                '[data-after-wrapper]'
            );

        const divider =
            slider.querySelector(
                '[data-after-divider]'
            );

        const afterImage =
            slider.querySelector(
                '.before-after-after'
            );

        if (
            !range ||
            !afterWrapper ||
            !divider ||
            !afterImage
        ) {
            return;
        }

        function updateSliderWidth() {
            afterImage.style.width =
                `${slider.clientWidth}px`;
        }

        function updateSliderPosition() {
            const percentage =
                Number(range.value);

            afterWrapper.style.width =
                `${percentage}%`;

            divider.style.left =
                `${percentage}%`;
        }

        range.addEventListener(
            'input',
            updateSliderPosition
        );

        window.addEventListener(
            'resize',
            updateSliderWidth
        );

        updateSliderWidth();
        updateSliderPosition();
    });
}

function waitForImageReady(image) {
    return new Promise(resolve => {
        let resolved = false;

        const finish = async () => {
            if (resolved) {
                return;
            }

            resolved = true;

            try {
                if (typeof image.decode === 'function') {
                    await image.decode();
                }
            } catch {
            }

            resolve();
        };

        const handleError = () => {
            if (
                image.dataset.fallbackUsed !== 'true'
            ) {
                image.dataset.fallbackUsed = 'true';
                resolved = false;

                image.src =
                    'assets/images/slide-03.png';

                return;
            }

            finish();
        };

        image.addEventListener(
            'load',
            finish,
            { once: true }
        );

        image.addEventListener(
            'error',
            handleError
        );

        if (
            image.complete &&
            image.naturalWidth > 0
        ) {
            finish();
        } else if (
            image.complete &&
            image.naturalWidth === 0
        ) {
            handleError();
        }
    });
}

async function markSingleImageContainerReady(
    container,
    image
) {
    if (!container || !image) {
        return;
    }

    container.classList.add(
        'is-image-loading'
    );

    await waitForImageReady(image);

    requestAnimationFrame(() => {
        container.classList.remove(
            'is-image-loading'
        );

        container.classList.add(
            'is-image-loaded'
        );
    });
}

function initialiseImageLoading() {

    document
        .querySelectorAll(
            '.portfolio-item'
        )
        .forEach(item => {
            markSingleImageContainerReady(
                item,
                item.querySelector('img')
            );
        });

    document
        .querySelectorAll(
            '.work-showcase-card'
        )
        .forEach(card => {
            markSingleImageContainerReady(
                card,
                card.querySelector('img')
            );
        });

    const profileContainer =
        document.querySelector(
            '.kayg-profile-image'
        );

    if (profileContainer) {
        markSingleImageContainerReady(
            profileContainer,
            profileContainer.querySelector(
                'img'
            )
        );
    }

    document
        .querySelectorAll(
            '[data-before-after-slider]'
        )
        .forEach(async slider => {
            const images =
                Array.from(
                    slider.querySelectorAll('img')
                );

            if (!images.length) {
                slider.classList.add(
                    'is-image-loaded'
                );
                return;
            }

            slider.classList.add(
                'is-image-loading'
            );

            await Promise.all(
                images.map(
                    image =>
                        waitForImageReady(image)
                )
            );

            requestAnimationFrame(() => {
                slider.classList.remove(
                    'is-image-loading'
                );

                slider.classList.add(
                    'is-image-loaded'
                );
            });
        });
}

function initialiseLightboxImageLoading() {
    const lightbox =
        getElement('portfolioLightbox');

    const lightboxImage =
        getElement('portfolioLightboxImage');

    if (!lightbox || !lightboxImage) {
        return;
    }

    lightboxImage.addEventListener(
        'load',
        async () => {
            try {
                if (
                    typeof lightboxImage.decode ===
                    'function'
                ) {
                    await lightboxImage.decode();
                }
            } catch {
            }

            lightbox.classList.remove(
                'is-image-loading'
            );

            lightbox.classList.add(
                'is-image-loaded'
            );
        }
    );

    lightboxImage.addEventListener(
        'error',
        () => {
            lightbox.classList.remove(
                'is-image-loading'
            );
        }
    );
}

function initialisePortfolioFilters() {
    const filterContainer =
        getElement('portfolioFilters');

    const items =
        document.querySelectorAll(
            '.portfolio-item'
        );

    if (
        !filterContainer ||
        !items.length
    ) {
        return;
    }

    filterContainer.addEventListener(
        'click',
        event => {
            const button =
                event.target.closest(
                    '[data-filter]'
                );

            if (!button) {
                return;
            }

            const selectedFilter =
                button.dataset.filter;

            filterContainer
                .querySelectorAll(
                    '[data-filter]'
                )
                .forEach(filterButton => {
                    filterButton.classList.remove(
                        'active'
                    );
                });

            button.classList.add(
                'active'
            );

            items.forEach(item => {
                const category =
                    item.dataset.category;

                const shouldShow =
                    selectedFilter === 'all' ||
                    category === selectedFilter;

                item.classList.toggle(
                    'is-hidden',
                    !shouldShow
                );
            });
        }
    );
}

function initialisePortfolioLightbox() {
    const lightbox =
        getElement('portfolioLightbox');

    const lightboxImage =
        getElement(
            'portfolioLightboxImage'
        );

    const closeButton =
        getElement(
            'closePortfolioLightbox'
        );

    const portfolioItems =
        document.querySelectorAll(
            '.portfolio-item'
        );

    if (
        !lightbox ||
        !lightboxImage ||
        !closeButton ||
        !portfolioItems.length
    ) {
        return;
    }

    function closeLightbox() {
        lightbox.hidden = true;

        lightboxImage.src = '';

        document.body.style.overflow =
            '';
    }

    portfolioItems.forEach(item => {
        item.addEventListener(
            'click',
            () => {
                const image =
                    item.querySelector('img');

                if (!image) {
                    return;
                }

                lightbox.classList.remove(
                    'is-image-loaded'
                );

                lightbox.classList.add(
                    'is-image-loading'
                );

                lightboxImage.src =
                    image.src;

                lightboxImage.alt =
                    image.alt;

                lightbox.hidden =
                    false;

                document.body.style.overflow =
                    'hidden';
            }
        );
    });

    closeButton.addEventListener(
        'click',
        closeLightbox
    );

    lightbox.addEventListener(
        'click',
        event => {
            if (event.target === lightbox) {
                closeLightbox();
            }
        }
    );

    document.addEventListener(
        'keydown',
        event => {
            if (
                event.key === 'Escape' &&
                !lightbox.hidden
            ) {
                closeLightbox();
            }
        }
    );
}

function initialiseOurWorkSearch() {
    const form =
        getElement('ourWorkSearchForm');

    const input =
        getElement('ourWorkSearchInput');

    if (!form || !input) {
        return;
    }

    form.addEventListener(
        'submit',
        event => {
            event.preventDefault();

            const query =
                input.value.trim();

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

function initialiseImageFallbacks() {
}

function initialiseOurWorkPage() {
    initialiseImageFallbacks();
    initialiseImageLoading();
    initialiseLightboxImageLoading();
    initialiseBeforeAfterSlider();
    initialisePortfolioFilters();
    initialisePortfolioLightbox();
    initialiseOurWorkSearch();
}


if (
    document.readyState ===
    'loading'
) {
    document.addEventListener(
        'DOMContentLoaded',
        initialiseOurWorkPage
    );
} else {
    initialiseOurWorkPage();
}