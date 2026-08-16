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
    document
        .querySelectorAll('img')
        .forEach(image => {
            image.addEventListener(
                'error',
                function() {
                    if (
                        this.dataset.fallbackUsed ===
                        'true'
                    ) {
                        return;
                    }

                    this.dataset.fallbackUsed =
                        'true';

                    this.src =
                        'assets/images/slide-03.png';
                }
            );
        });
}

function initialiseOurWorkPage() {
    initialiseBeforeAfterSlider();
    initialisePortfolioFilters();
    initialisePortfolioLightbox();
    initialiseOurWorkSearch();
    initialiseImageFallbacks();
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