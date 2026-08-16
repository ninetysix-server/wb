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

    const swiperElement =
        document.querySelector(`.heroSwiper-${device}`);

    if (!swiperElement) {
        return;
    }

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
});
