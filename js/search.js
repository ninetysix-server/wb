let searchTimeout = null;

function closeMobileSearch() {
    const mobileModal =
        document.getElementById(
            'mobileSearchModal'
        );

    if (mobileModal) {
        mobileModal.classList.remove(
            'active'
        );

        mobileModal.setAttribute(
            'aria-hidden',
            'true'
        );
    }

    document.body.style.overflow = '';
}

async function searchForServices(
    input,
    shouldScroll = false
) {
    if (!input) {
        return;
    }

    const searchTerm =
        input.value.trim();

    if (!searchTerm) {
        input.focus();
        return;
    }

    if (
        typeof window.searchDatabaseServices !==
        'function'
    ) {
        console.error(
            'Service search is not ready.'
        );

        return;
    }

    await window.searchDatabaseServices(
        searchTerm,
        shouldScroll
    );
}


function runDelayedSearch(input) {
    if (!input) {
        return;
    }

    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(
        async () => {
            const searchTerm =
                input.value.trim();

            if (!searchTerm) {
                if (
                    typeof window.clearServiceSearch ===
                    'function'
                ) {
                    window.clearServiceSearch();
                }

                return;
            }

            await searchForServices(
                input,
                false
            );
        },
        1200
    );
}

function connectSearchInput(
    input,
    isMobile = false
) {
    if (!input) {
        return;
    }

    input.addEventListener(
        'input',
        () => {
            runDelayedSearch(input);
        }
    );

    input.addEventListener(
        'keydown',
        async event => {
            if (event.key !== 'Enter') {
                return;
            }

            event.preventDefault();

            clearTimeout(searchTimeout);

            if (isMobile) {
                closeMobileSearch();
            }

            await searchForServices(
                input,
                true
            );
        }
    );
}

document.addEventListener(
    'DOMContentLoaded',
    function() {
        const desktopInput =
            document.getElementById(
                'mainSearchInput'
            );

        const desktopButton =
            document.getElementById(
                'mainSearchButton'
            );

        const mobileInput =
            document.getElementById(
                'mobileSearchInput'
            );

        const mobileButton =
            document.getElementById(
                'mobileSearchBtn'
            );

        const mobileSubmitButton =
            document.getElementById(
                'mobileSearchSubmit'
            );

        const mobileModal =
            document.getElementById(
                'mobileSearchModal'
            );

        const closeButton =
            document.getElementById(
                'closeMobileSearch'
            );

        connectSearchInput(
            desktopInput,
            false
        );

        connectSearchInput(
            mobileInput,
            true
        );

        desktopButton?.addEventListener(
            'click',
            async () => {
                clearTimeout(
                    searchTimeout
                );

                await searchForServices(
                    desktopInput,
                    true
                );
            }
        );

        mobileButton?.addEventListener(
            'click',
            () => {
                if (!mobileModal) {
                    console.error(
                        'Mobile search popup is missing.'
                    );

                    return;
                }

                mobileModal.classList.add(
                    'active'
                );

                mobileModal.setAttribute(
                    'aria-hidden',
                    'false'
                );

                document.body.style.overflow =
                    'hidden';

                setTimeout(
                    () => {
                        mobileInput?.focus();
                    },
                    250
                );
            }
        );


        mobileSubmitButton?.addEventListener(
            'click',
            async () => {
                clearTimeout(
                    searchTimeout
                );

                closeMobileSearch();

                await searchForServices(
                    mobileInput,
                    true
                );
            }
        );


        closeButton?.addEventListener(
            'click',
            closeMobileSearch
        );

        mobileModal?.addEventListener(
            'click',
            event => {
                if (
                    event.target ===
                    mobileModal
                ) {
                    closeMobileSearch();
                }
            }
        );

        document
            .querySelectorAll(
                '[data-mobile-search]'
            )
            .forEach(button => {
                button.addEventListener(
                    'click',
                    async () => {
                        const searchTerm =
                            button.dataset
                                .mobileSearch ||
                            '';

                        if (!mobileInput) {
                            return;
                        }

                        mobileInput.value =
                            searchTerm;

                        clearTimeout(
                            searchTimeout
                        );

                        closeMobileSearch();

                        await searchForServices(
                            mobileInput,
                            true
                        );
                    }
                );
            });
    }
);