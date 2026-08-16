document.addEventListener("DOMContentLoaded", function () {
    const menuItems = Array.from(
        document.querySelectorAll(
            ".services-nav-item, .header-popup-item"
        )
    );

    if (!menuItems.length) {
        return;
    }

    function getMenuParts(item) {
        return {
            trigger: item.querySelector(
                ".services-menu-trigger, .header-popup-trigger"
            ),

            menu: item.querySelector(
                ".services-mega-menu, .header-popup"
            )
        };
    }

    function setMenuState(item, isOpen) {
        const { trigger, menu } = getMenuParts(item);

        if (!trigger || !menu) {
            return;
        }

        item.classList.toggle("is-open", isOpen);

        trigger.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

        menu.setAttribute(
            "aria-hidden",
            String(!isOpen)
        );
    }

    function closeAllMenus(exceptItem = null) {
        menuItems.forEach(item => {
            if (item !== exceptItem) {
                setMenuState(item, false);
            }
        });
    }

    menuItems.forEach(item => {
        const { trigger, menu } = getMenuParts(item);

        if (!trigger || !menu) {
            return;
        }

        trigger.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();

            const willOpen =
                !item.classList.contains("is-open");

            closeAllMenus(item);
            setMenuState(item, willOpen);
        });

        item.addEventListener("mouseenter", function () {
            closeAllMenus(item);
        });

        menu.addEventListener("click", function (event) {
            const actionElement = event.target.closest(
                "a, button"
            );

            if (!actionElement) {
                return;
            }

            if (
                actionElement.id !== "supportAccountButton"
            ) {
                closeAllMenus();
            }
        });
    });

    document.addEventListener("click", function (event) {
        const clickedInsideMenu = menuItems.some(item =>
            item.contains(event.target)
        );

        if (!clickedInsideMenu) {
            closeAllMenus();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") {
            return;
        }

        const openItem = menuItems.find(item =>
            item.classList.contains("is-open")
        );

        if (!openItem) {
            return;
        }

        const { trigger } = getMenuParts(openItem);

        closeAllMenus();

        if (trigger) {
            trigger.focus();
        }
    });

    const supportAccountButton =
        document.getElementById(
            "supportAccountButton"
        );

    const desktopProfileButton =
        document.getElementById(
            "desktopProfileBtn"
        );

    if (
        supportAccountButton &&
        desktopProfileButton
    ) {
        supportAccountButton.addEventListener(
            "click",
            function () {
                closeAllMenus();
                desktopProfileButton.click();
            }
        );
    }

    document
        .querySelectorAll("[data-service-tier]")
        .forEach(link => {
            link.addEventListener("click", function () {
                const selectedTier =
                    link.dataset.serviceTier;

                const tierInput = document.querySelector(
                    `.tier-filter[value="${selectedTier}"]`
                );

                if (!tierInput) {
                    return;
                }

                document
                    .querySelectorAll(".tier-filter")
                    .forEach(input => {
                        input.checked =
                            input === tierInput;
                    });

                tierInput.dispatchEvent(
                    new Event("change", {
                        bubbles: true
                    })
                );
            });
        });
});