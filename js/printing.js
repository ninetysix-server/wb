import './image-loading.js';

const PRINTING_WHATSAPP_NUMBER = "27817925033";

export const printingServices = [
    {
        id: 1,
        title: "Banners",
        description:
            "Professional display banners for events, promotions, exhibitions, retail spaces and branded environments.",
        price: "From R800.00",
        image:
            "assets/images/pri-s/bn.png",

        steps: [
            {
                id: "usage",
                title: "Where will the banner be used?",
                description:
                    "Tell us where the banner will be displayed so we can understand your quotation requirements.",
                type: "single",
                options: [
                    "Indoor",
                    "Outdoor",
                    "Exhibition",
                    "Conference",
                    "Retail Display",
                    "Event"
                ]
            },
            {
                id: "bannerType",
                title: "Choose banner type",
                description:
                    "Select one of the verified banner types available.",
                type: "single",
                options: [
                    "X-Banner",
                    "Pull-up Banner",
                    "Wall Banner",
                    "Sharkfin Banner — Set of 2",
                    "Telescopic Banner"
                ]
            },
            {
                id: "size",
                title: "Choose the verified banner size",
                description:
                    "Select the size that matches your chosen banner type.",
                type: "single",
                options: [
                    "X-Banner — 1600mm x 600mm",
                    "X-Banner — 1800mm x 800mm",
                    "Pull-up Banner — 2m x 850mm",
                    "Sharkfin Banner — 2m",
                    "Sharkfin Banner — 3m",
                    "Sharkfin Banner — 4m",
                    "Telescopic Banner — 2m",
                    "Telescopic Banner — 3m",
                    "Telescopic Banner — 4m"
                ]
            }
        ]
    },

    {
        id: 2,
        title: "Posters (Pack of 50)",
        description:
            "Poster printing supplied in verified standard-size packs for promotions, campaigns and display use.",
        price: "From R1750.00",
        image:
            "assets/images/pri-s/ps.png",

        steps: [
            {
                id: "usage",
                title: "Where will the poster be used?",
                description:
                    "Tell us the intended display environment for your quotation.",
                type: "single",
                options: [
                    "Indoor Display",
                    "Retail Display",
                    "Event",
                    "Office",
                    "Promotional Campaign",
                    "Other"
                ]
            },
            {
                id: "posterPack",
                title: "Choose poster size and pack",
                description:
                    "Select one of the verified poster packs.",
                type: "single",
                options: [
                    "A3 — Pack of 50",
                    "A2 — Pack of 20",
                    "A1 — Pack of 10",
                    "A0 — Pack of 10"
                ]
            }
        ]
    },

    {
        id: 3,
        title: "Correx (Pack of 20)",
        description:
            "Correx printing supplied in verified standard-size packs for signage, promotions and display requirements.",
        price: "From R2600.00",
        image:
            "assets/images/pri-s/cr.png",

        steps: [
            {
                id: "purpose",
                title: "What will the Correx be used for?",
                description:
                    "Select the main purpose so your quotation contains useful context.",
                type: "single",
                options: [
                    "Property Sign",
                    "Directional Sign",
                    "Event Sign",
                    "Safety Sign",
                    "Promotional Sign",
                    "Other"
                ]
            },
            {
                id: "correxPack",
                title: "Choose Correx size and pack",
                description:
                    "Select one of the verified Correx packs.",
                type: "single",
                options: [
                    "A3 — Pack of 50",
                    "A2 — Pack of 20",
                    "A1 — Pack of 10",
                    "A0 — Pack of 10"
                ]
            }
        ]
    },

    {
        id: 4,
        title: "Car Magnet (SET OF 2)",
        description:
            "Removable car magnet printing for business branding, promotional advertising and temporary vehicle signage.",
        price: "From R500.00",
        image:
            "assets/images/pri-s/cm.png",

        steps: [
            {
                id: "usage",
                title: "How will the car magnet be used?",
                description:
                    "Tell us the main purpose of the vehicle magnet.",
                type: "single",
                options: [
                    "Business Branding",
                    "Promotional Advertising",
                    "Temporary Vehicle Signage",
                    "Campaign Branding",
                    "Other"
                ]
            },
            {
                id: "size",
                title: "Choose car magnet size",
                description:
                    "Select one of the verified car magnet sizes.",
                type: "single",
                options: [
                    "400mm x 300mm",
                    "500mm x 400mm"
                ]
            }
        ]
    },

    {
        id: 5,
        title: "Board",
        description:
            "Printed boards for signage, displays, promotions and custom-size requirements.",
        price: "From R900.00",
        image:
            "assets/images/pri-s/bd.png",

        steps: [
            {
                id: "purpose",
                title: "What will the board be used for?",
                description:
                    "Tell us the main purpose of the board.",
                type: "single",
                options: [
                    "Business Sign",
                    "Promotional Display",
                    "Directional Sign",
                    "Event Display",
                    "Information Board",
                    "Other"
                ]
            },
            {
                id: "size",
                title: "Choose board size",
                description:
                    "Select a verified size. If you choose Custom Size, enter the exact width and height.",
                type: "single",
                options: [
                    "A2",
                    "A1",
                    "10",
                    "Custom Size"
                ]
            }
        ]
    },

    {
        id: 6,
        title: "Business Card (Pack of 250)",
        description:
            "Business card printing available in standard and laminated options with verified quantities and printing sides.",
        price: "From R500.00",
        image:
            "assets/images/pri-s/bc.png",

        steps: [
            {
                id: "cardType",
                title: "Choose business card type",
                description:
                    "Select the verified card option required.",
                type: "single",
                options: [
                    "Business Card",
                    "Laminated"
                ]
            },
            {
                id: "quantity",
                title: "Choose quantity",
                description:
                    "Choose a verified quantity. The 2000 option is listed for laminated cards.",
                type: "single",
                options: [
                    "100",
                    "250",
                    "500",
                    "1000",
                    "2000 — Laminated"
                ]
            },
            {
                id: "side",
                title: "Choose printing side",
                description:
                    "Select whether printing is required on one or both sides.",
                type: "single",
                options: [
                    "Single side",
                    "Double side"
                ]
            }
        ]
    },

    {
        id: 7,
        title: "Sticker (from Pack of 100)",
        description:
            "Custom-size sticker printing in verified rectangle, square and round shapes.",
        price: "From R400.00",
        image:
            "assets/images/pri-s/st.png",

        steps: [
            {
                id: "shape",
                title: "Choose sticker shape",
                description:
                    "Select one of the verified sticker shapes.",
                type: "single",
                options: [
                    "Rectangle",
                    "Square",
                    "Round"
                ]
            },
            {
                id: "quantity",
                title: "Choose sticker quantity",
                description:
                    "Select one of the verified print quantities.",
                type: "single",
                options: [
                    "100",
                    "200",
                    "300",
                    "500",
                    "1000"
                ]
            },
            {
                id: "size",
                title: "Enter sticker size",
                description:
                    "Sticker size is custom. Select Custom Size and enter the required width and height.",
                type: "single",
                options: [
                    "Custom Size"
                ]
            }
        ]
    },

    {
        id: 8,
        title: "Straight Banners Wall",
        description:
            "Professional display banners for events, promotions, exhibitions, retail spaces and branded environments.",
        price: "From R3800.00",
        image:
            "assets/images/pri-s/eb.png",

        steps: [
            {
                id: "usage",
                title: "Where will the banner be used?",
                description:
                    "Tell us where the banner will be displayed so we can understand your quotation requirements.",
                type: "single",
                options: [
                    "Indoor",
                    "Outdoor",
                    "Exhibition",
                    "Conference",
                    "Retail Display",
                    "Event"
                ]
            },
            {
                id: "size",
                title: "Choose the verified banner size",
                description:
                    "Select the size that matches your chosen banner type.",
                type: "single",
                options: [
                    "Wall Banner — 1.45m x 2.25m",
                    "Wall Banner — 1.52m x 2.25m",
                    "Wall Banner — 2.15m x 2.25m",
                    "Wall Banner — 2.25m x 2.25m",
                    "Wall Banner — 2.85m x 2.25m",
                    "Wall Banner — 3m x 2.25m",
                    "Wall Banner — 3.5m x 2.25m",
                    "Wall Banner — 3.7m x 2.25m",
                    "Wall Banner — 4.2m x 2.25m"
                ]
            }
        ]
    }
];

let activePrintingService = null;
let activePrintingStep = 0;
let printingSelections = {};

function escapePrintingValue(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]
    );
}

function createPrintingCard(service) {
    const title = escapePrintingValue(service.title);
    const description = escapePrintingValue(
        service.description
    );
    const price = escapePrintingValue(service.price);
    const image = escapePrintingValue(service.image);

    return `
        <article
            class="printing-card"
            data-printing-card="${service.id}"
        >
            <img
                src="${image}"
                alt="${title}"
                class="printing-card-background"
                loading="lazy"
                onerror="
                    this.onerror = null;
                    this.src = 'assets/images/slide-03.png';
                "
            >

            <div class="printing-card-overlay"></div>

            <div class="printing-card-top">
                <span class="printing-new-tag">
                    New
                </span>
            </div>

            <div class="printing-card-content">

                <h3>${title}</h3>

                <p class="printing-description">
                    ${description}
                </p>

                <div class="printing-card-footer">
                    <div class="printing-price-area">
                        <div class="printing-price">
                            ${price}
                        </div>
                    </div>

                    <a
                        href="printing-service.html?id=${service.id}"
                        class="printing-service-btn"
                    >
                        Get Quote
                    </a>
                </div>
            </div>
        </article>
    `;
}

function createPrintingSlide(service) {
    return `
        <div class="swiper-slide printing-swiper-slide">
            ${createPrintingCard(service)}
        </div>
    `;
}

function renderPrintingServices() {
    const topContainer = document.getElementById(
        "printingServicesTop"
    );

    const bottomContainer = document.getElementById(
        "printingServicesBottom"
    );

    if (!topContainer || !bottomContainer) {
        return;
    }

    const splitIndex = Math.ceil(printingServices.length / 2);
    const firstGroup = printingServices.slice(0, splitIndex);
    const secondGroup = printingServices.slice(splitIndex);

    topContainer.innerHTML = firstGroup
        .map(createPrintingSlide)
        .join("");

    bottomContainer.innerHTML = secondGroup
        .map(createPrintingSlide)
        .join("");
}

let printingTopSwiper = null;
let printingBottomSwiper = null;

function createPrintingSwiper(
    selector,
    paginationSelector,
    reverseDirection = false
) {
    const sliderElement = document.querySelector(selector);

    if (!sliderElement || typeof Swiper === "undefined") {
        return null;
    }

    return new Swiper(selector, {
        slidesPerView: 1.15,
        spaceBetween: 14,
        speed: 850,
        loop: true,
        grabCursor: true,
        watchOverflow: true,
        observer: true,
        observeParents: true,

        autoplay: {
            delay: 3200,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
            reverseDirection
        },

        pagination: {
            el: paginationSelector,
            clickable: true,
            dynamicBullets: true
        },

        breakpoints: {
            430: {
                slidesPerView: 1.35,
                spaceBetween: 16
            },

            560: {
                slidesPerView: 2,
                spaceBetween: 18
            },

            820: {
                slidesPerView: 2.5,
                spaceBetween: 20
            },

            1000: {
                slidesPerView: 3,
                spaceBetween: 21
            },

            1200: {
                slidesPerView: 4,
                spaceBetween: 22
            }
        }
    });
}

function initialisePrintingSwipers() {
    if (printingTopSwiper) {
        printingTopSwiper.destroy(true, true);
    }

    if (printingBottomSwiper) {
        printingBottomSwiper.destroy(true, true);
    }

    printingTopSwiper = createPrintingSwiper(
        "#printingSwiperTop",
        ".printing-pagination-top",
        false
    );

    printingBottomSwiper = createPrintingSwiper(
        "#printingSwiperBottom",
        ".printing-pagination-bottom",
        true
    );
}

function initialisePrintingServices() {
    renderPrintingServices();
    initialisePrintingSwipers();
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initialisePrintingServices
    );
} else {
    initialisePrintingServices();
}
