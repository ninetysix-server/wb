document.addEventListener(
    'DOMContentLoaded',
    function() {

        const header =
            document.querySelector(
                '.header-container'
            );

        if (header) {
            void header.offsetWidth;

            header.classList.add(
                'loaded'
            );
        }

        document
            .querySelectorAll(
                '#closeOffer, #closeOfferDesktop'
            )
            .forEach(button => {
                button.addEventListener(
                    'click',
                    () => {
                        const offerBar =
                            document.getElementById(
                                'offerBar'
                            );

                        if (offerBar) {
                            offerBar.style.display =
                                'none';
                        }
                    }
                );
            });

        const menuButton =
            document.getElementById(
                'mobileMenuButton'
            );

        const menuOverlay =
            document.getElementById(
                'mobileMenuOverlay'
            );

        const mobileMenu =
            document.getElementById(
                'mobileMenu'
            );

        const closeMenuButton =
            document.getElementById(
                'closeMobileMenu'
            );


        function openMobileMenu() {
            mobileMenu?.classList.add(
                'active'
            );

            mobileMenu?.setAttribute(
                'aria-hidden',
                'false'
            );

            if (menuOverlay) {
                menuOverlay.style.display =
                    'block';
            }

            document.body.style.overflow =
                'hidden';
        }


        function closeMobileMenu() {
            mobileMenu?.classList.remove(
                'active'
            );

            mobileMenu?.setAttribute(
                'aria-hidden',
                'true'
            );

            if (menuOverlay) {
                menuOverlay.style.display =
                    'none';
            }

            document.body.style.overflow =
                '';
        }


        menuButton?.addEventListener(
            'click',
            openMobileMenu
        );

        closeMenuButton?.addEventListener(
            'click',
            closeMobileMenu
        );

        menuOverlay?.addEventListener(
            'click',
            closeMobileMenu
        );

        document
            .querySelectorAll(
                '.mobile-menu-link, ' +
                '.mobile-menu-footer a'
            )
            .forEach(link => {
                link.addEventListener(
                    'click',
                    closeMobileMenu
                );
            });

        const mobileMenuSearchButton =
            document.getElementById(
                'mobileMenuSearchBtn'
            );

        const bottomMobileSearchButton =
            document.getElementById(
                'mobileSearchBtn'
            );

        mobileMenuSearchButton
            ?.addEventListener(
                'click',
                () => {
                    closeMobileMenu();

                    setTimeout(
                        () => {
                            bottomMobileSearchButton
                                ?.click();
                        },
                        150
                    );
                }
            );


        document
            .querySelectorAll(
                '.nav-item-mobile'
            )
            .forEach(item => {
                item.addEventListener(
                    'click',
                    function() {
                        document
                            .querySelectorAll(
                                '.nav-item-mobile'
                            )
                            .forEach(navItem => {
                                navItem.classList
                                    .remove(
                                        'active'
                                    );
                            });

                        this.classList.add(
                            'active'
                        );
                    }
                );
            });

        document
            .querySelectorAll(
                '.get-quote-btn, ' +
                '.mobile-get-quote-btn, ' +
                '#bottomNavQuoteBtn'
            )
            .forEach(button => {
                button.addEventListener(
                    'click',
                    () => {
                        window.location.href =
                            'https://quote.96studios.co.za/';
                    }
                );
            });

        document
            .getElementById(
                'mobile-shop'
            )
            ?.addEventListener(
                'click',
                () => {
                    document
                        .getElementById(
                            'services'
                        )
                        ?.scrollIntoView({
                            behavior:
                                'smooth',
                            block:
                                'start'
                        });
                }
            );

        const sectionLinks = {
            'mobile-services':
                'services',

            'mobile-branding':
                'services',

            'mobile-pricing':
                'services',

            'mobile-printing':
                'printingServices'
        };

        Object.entries(
            sectionLinks
        ).forEach(
            ([
                buttonId,
                sectionId
            ]) => {
                document
                    .getElementById(
                        buttonId
                    )
                    ?.addEventListener(
                        'click',
                        event => {
                            event.preventDefault();

                            closeMobileMenu();

                            document
                                .getElementById(
                                    sectionId
                                )
                                ?.scrollIntoView({
                                    behavior:
                                        'smooth',
                                    block:
                                        'start'
                                });
                        }
                    );
            }
        );

        document
            .querySelectorAll(
                '.slide-cta'
            )
            .forEach(button => {
                button.addEventListener(
                    'click',
                    event => {
                        event.preventDefault();

                        document
                            .getElementById(
                                'services'
                            )
                            ?.scrollIntoView({
                                behavior:
                                    'smooth',
                                block:
                                    'start'
                            });
                    }
                );
            });

        const scrollButton =
            document.getElementById(
                'scroll-top'
            );

        if (scrollButton) {
            window.addEventListener(
                'scroll',
                () => {
                    scrollButton.classList
                        .toggle(
                            'active',
                            window.scrollY >
                                1000
                        );
                }
            );

            scrollButton.addEventListener(
                'click',
                event => {
                    event.preventDefault();

                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }
            );
        }

        document
            .getElementById(
                'footer-portal'
            )
            ?.addEventListener(
                'click',
                event => {
                    event.preventDefault();

                    const user =
                        localStorage.getItem(
                            'userClientId'
                        );

                    if (user) {
                        window.location.href =
                            'orders.html';

                        return;
                    }

                    const desktopAuth =
                        document.getElementById(
                            'desktopAuthOverlay'
                        );

                    const mobileAuth =
                        document.getElementById(
                            'mobileAuthContainer'
                        );

                    if (
                        window.innerWidth <=
                        768
                    ) {
                        mobileAuth?.classList.add(
                            'active'
                        );
                    } else {
                        desktopAuth?.classList.add(
                            'active'
                        );
                    }

                    document.body.style.overflow =
                        'hidden';
                }
            );
    }
);

