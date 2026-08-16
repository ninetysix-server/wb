document.addEventListener("DOMContentLoaded", function () {

    function getHeroDevice() {
        if (window.matchMedia("(max-width: 768px)").matches) {
            return "mobile";
        }

        if (window.matchMedia("(max-width: 1024px)").matches) {
            return "tablet";
        }

        return "desktop";
    }

    const device = getHeroDevice();

    const heroSection =
        document.querySelector("#heroSection");

    const swiperElement =
        document.querySelector(`.heroSwiper-${device}`);

    if (!swiperElement || !heroSection) {
        return;
    }

    /* =========================================
       HERO IMAGE LOADING
    ========================================= */

    const heroImages =
        swiperElement.querySelectorAll("img");

    function showHeroWhenReady() {
        heroSection.classList.add("hero-images-ready");
    }

    if (heroImages.length === 0) {
        showHeroWhenReady();
    } else {

        let loadedImages = 0;

        function imageFinished() {
            loadedImages++;

            if (loadedImages >= heroImages.length) {
                showHeroWhenReady();
            }
        }

        heroImages.forEach(function (image) {

            if (image.complete) {
                imageFinished();
                return;
            }

            image.addEventListener(
                "load",
                imageFinished,
                { once: true }
            );

            image.addEventListener(
                "error",
                imageFinished,
                { once: true }
            );
        });
    }

    /* =========================================
       HERO SWIPER
    ========================================= */

    new Swiper(swiperElement, {
        direction: "horizontal",
        effect: "slide",
        loop: true,
        speed: 850,

        autoplay: {
            delay: 6500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
        },

        pagination: {
            el: swiperElement.querySelector(
                `.hero-pagination-${device}`
            ),
            clickable: true
        },

        grabCursor: true
    });


    /* =========================================
       GALLERY IMAGE LOADING
    ========================================= */

    const galleryImages =
        document.querySelectorAll(
            ".gallery-section .image-wrapper img"
        );

    galleryImages.forEach(function (image) {

        const wrapper =
            image.closest(".image-wrapper");

        if (!wrapper) {
            return;
        }

        wrapper.classList.add("gallery-image-loading");

        function galleryImageFinished() {
            wrapper.classList.remove(
                "gallery-image-loading"
            );

            wrapper.classList.add(
                "gallery-image-loaded"
            );
        }

        if (image.complete) {
            galleryImageFinished();
        } else {
            image.addEventListener(
                "load",
                galleryImageFinished,
                { once: true }
            );

            image.addEventListener(
                "error",
                galleryImageFinished,
                { once: true }
            );
        }
    });

});
