import {
    supabase,
    getServices
} from "./supabase.js";

const money = value => {
    if (value === null || value === undefined || value === "") {
        return "—";
    }

    return new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: "ZAR"
    }).format(Number(value));
};

const safe = value =>
    String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);

    const valueOrNull = id => {
    const value = document.getElementById(id).value.trim();

    return value === ""
        ? null
        : Number(value);
};

const createSlug = value =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

        let loadedServices = [];

        function createPrintingOptionId() {
    return `print-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
}

function normalisePrintingOptions(options) {
    if (!Array.isArray(options)) {
        return [];
    }

    return options.map(option => ({
        id: option.id || createPrintingOptionId(),
        size: String(option.size || "").trim(),
        price_per_copy: Number(option.price_per_copy || 0),
        minimum_quantity: Math.max(
            1,
            Number(option.minimum_quantity || 1)
        ),
        maximum_quantity:
            option.maximum_quantity === null ||
            option.maximum_quantity === undefined ||
            option.maximum_quantity === ""
                ? null
                : Math.max(
                    1,
                    Number(option.maximum_quantity)
                ),
        active: option.active !== false
    }));
}

function renderPrintingOptions(options = []) {
    const container =
        document.getElementById("printingOptionsContainer");

    if (!container) {
        return;
    }

    const printingOptions = normalisePrintingOptions(options);

    if (!printingOptions.length) {
        container.innerHTML = `
            <div class="empty" id="printingOptionsEmpty">
                No printing sizes added yet.
            </div>
        `;

        return;
    }

    container.innerHTML = printingOptions.map(option => `
        <div
            class="printing-option-row"
            data-printing-option-id="${safe(option.id)}"
            style="
                border:1px solid #dce6ed;
                border-radius:18px;
                padding:18px;
                margin-bottom:14px;
                background:#f8fbfd;
            "
        >
            <input
                type="hidden"
                class="printing-option-id"
                value="${safe(option.id)}"
            >

            <div class="management-grid">

                <div class="field">
                    <label>Size or format</label>

                    <input
                        type="text"
                        class="printing-option-size"
                        maxlength="100"
                        placeholder="Example: A4 or 2m × 1m"
                        value="${safe(option.size)}"
                        required
                    >
                </div>

                <div class="field">
                    <label>Price per copy</label>

                    <input
                        type="number"
                        class="printing-option-price"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value="${option.price_per_copy}"
                        required
                    >
                </div>

                <div class="field">
                    <label>Minimum copies</label>

                    <input
                        type="number"
                        class="printing-option-minimum"
                        min="1"
                        step="1"
                        value="${option.minimum_quantity}"
                        required
                    >
                </div>

                <div class="field">
                    <label>Maximum copies</label>

                    <input
                        type="number"
                        class="printing-option-maximum"
                        min="1"
                        step="1"
                        placeholder="Optional"
                        value="${
                            option.maximum_quantity ?? ""
                        }"
                    >
                </div>

                <div class="field">
                    <label>Status</label>

                    <select class="printing-option-active">
                        <option
                            value="true"
                            ${option.active ? "selected" : ""}
                        >
                            Active
                        </option>

                        <option
                            value="false"
                            ${!option.active ? "selected" : ""}
                        >
                            Inactive
                        </option>
                    </select>
                </div>

                <div class="field">
                    <label>&nbsp;</label>

                    <button
                        type="button"
                        class="icon-btn remove-printing-option"
                        title="Remove printing size"
                        style="color:#dc2626;"
                    >
                        <i class="fa-solid fa-trash"></i>
                        Remove
                    </button>
                </div>

            </div>
        </div>
    `).join("");

    container
        .querySelectorAll(".remove-printing-option")
        .forEach(button => {
            button.addEventListener("click", () => {
                button.closest(".printing-option-row")?.remove();

                if (
                    !container.querySelector(
                        ".printing-option-row"
                    )
                ) {
                    renderPrintingOptions([]);
                }
            });
        });
}

function addPrintingOption() {
    const container =
        document.getElementById("printingOptionsContainer");

    const currentOptions = collectPrintingOptions(false);

    currentOptions.push({
        id: createPrintingOptionId(),
        size: "",
        price_per_copy: 0,
        minimum_quantity: 1,
        maximum_quantity: null,
        active: true
    });

    renderPrintingOptions(currentOptions);

    const rows = container.querySelectorAll(
        ".printing-option-row"
    );

    const lastRow = rows[rows.length - 1];

    lastRow
        ?.querySelector(".printing-option-size")
        ?.focus();
}

function collectPrintingOptions(validate = true) {
    const rows = document.querySelectorAll(
        "#printingOptionsContainer .printing-option-row"
    );

    const options = [];

    for (const row of rows) {
        const size = row
            .querySelector(".printing-option-size")
            .value
            .trim();

        const price = Number(
            row.querySelector(".printing-option-price").value
        );

        const minimumQuantity = Number(
            row.querySelector(".printing-option-minimum").value
        );

        const maximumInput = row
            .querySelector(".printing-option-maximum")
            .value
            .trim();

        const maximumQuantity =
            maximumInput === ""
                ? null
                : Number(maximumInput);

        const active =
            row.querySelector(".printing-option-active").value
            === "true";

        if (validate && !size) {
            alert("Enter a size for every printing option.");

            row.querySelector(".printing-option-size").focus();

            return null;
        }

        if (
            validate &&
            (!Number.isFinite(price) || price < 0)
        ) {
            alert(`Enter a valid printing price for ${size}.`);

            row.querySelector(".printing-option-price").focus();

            return null;
        }

        if (
            validate &&
            (
                !Number.isInteger(minimumQuantity) ||
                minimumQuantity < 1
            )
        ) {
            alert(
                `Enter a valid minimum quantity for ${size}.`
            );

            row
                .querySelector(".printing-option-minimum")
                .focus();

            return null;
        }

        if (
            validate &&
            maximumQuantity !== null &&
            (
                !Number.isInteger(maximumQuantity) ||
                maximumQuantity < minimumQuantity
            )
        ) {
            alert(
                `Maximum copies for ${size} must be equal to or greater than the minimum.`
            );

            row
                .querySelector(".printing-option-maximum")
                .focus();

            return null;
        }

        options.push({
            id:
                row.querySelector(".printing-option-id").value
                || createPrintingOptionId(),
            size,
            price_per_copy: price,
            minimum_quantity: minimumQuantity,
            maximum_quantity: maximumQuantity,
            active
        });
    }

    return options;
}

function updatePrintingManagerVisibility() {
    const enabled =
        document.getElementById("printingEnabled").value
        === "true";

    const manager =
        document.getElementById("printingManager");

    if (manager) {
        manager.style.display = enabled
            ? "block"
            : "none";
    }
}

export function initialiseServiceManager() {
    const addButton = document.getElementById("addServiceBtn");
    const closeButton = document.getElementById("closeServiceModal");
    const modal = document.getElementById("serviceModal");
    const form = document.getElementById("serviceForm");
    const titleInput = document.getElementById("serviceTitle");
    const slugInput = document.getElementById("serviceSlug");

    const printingEnabled =
    document.getElementById("printingEnabled");

const addPrintingOptionButton =
    document.getElementById("addPrintingOptionBtn");

    if (!addButton || !modal || !form) {
        return;
    }

    addButton.addEventListener("click", openAddServiceModal);

    closeButton.addEventListener("click", closeServiceModal);

    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeServiceModal();
        }
    });

    titleInput.addEventListener("input", () => {
        const serviceId = document.getElementById("serviceId").value;

        if (!serviceId) {
            slugInput.value = createSlug(titleInput.value);
        }
    });

    form.addEventListener("submit", saveService);

    printingEnabled.addEventListener(
    "change",
    updatePrintingManagerVisibility
);

addPrintingOptionButton.addEventListener(
    "click",
    addPrintingOption
);
}

export async function loadServices() {
    const container = document.getElementById("servicesTable");

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="loading">
            Loading services...
        </div>
    `;

    const services = await getServices();
    loadedServices = services;

    if (!services.length) {
        container.innerHTML = `
            <div class="empty">
                No services created yet.
            </div>
        `;

        return;
    }

    container.innerHTML = services.map(service => `
        <article class="service-card" data-service-id="${safe(service.id)}">

            <div class="service-card-header">
                <div>
                    <h3>${safe(service.title)}</h3>
                    <p>${safe(service.category || "Uncategorised")}</p>
                </div>

                <span class="badge ${
                    service.active
                        ? "badge-paid"
                        : "badge-cancelled"
                }">
                    ${service.active ? "Active" : "Inactive"}
                </span>
            </div>

            <div class="service-prices">
                <div>
                    <small>Starter</small>
                    <strong>${money(service.starter_price)}</strong>
                </div>

                <div>
                    <small>Premium</small>
                    <strong>${money(service.premium_price)}</strong>
                </div>

                <div>
                    <small>Pro</small>
                    <strong>${money(service.pro_price)}</strong>
                </div>
            </div>

            <div class="service-printing">
                <small>Printing</small>

                <strong>
                    ${
                        service.printing_enabled
                            ? `Available · ${money(service.printing_price)}`
                            : "Not available"
                    }
                </strong>
            </div>

            <div class="actions">
                <button
                    type="button"
                    class="icon-btn"
                    data-edit-service="${safe(service.id)}"
                    title="Edit service"
                >
                    <i class="fa-solid fa-pen"></i>
                </button>

                <button
                    type="button"
                    class="icon-btn"
                    data-toggle-service="${safe(service.id)}"
                    data-current-active="${service.active}"
                    title="${
                        service.active
                            ? "Deactivate service"
                            : "Activate service"
                    }"
                >
                    <i class="fa-solid ${
                        service.active
                            ? "fa-eye-slash"
                            : "fa-eye"
                    }"></i>
                </button>

                <button
                    type="button"
                    class="icon-btn"
                    data-delete-service="${safe(service.id)}"
                    title="Delete service"
                >
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>

        </article>
    `).join("");

    bindServiceActions();
}

function bindServiceActions() {
    document
        .querySelectorAll("[data-toggle-service]")
        .forEach(button => {
            button.addEventListener("click", async () => {
                const serviceId = button.dataset.toggleService;
                const currentActive =
                    button.dataset.currentActive === "true";

                await toggleService(serviceId, !currentActive);
            });
        });

    document
        .querySelectorAll("[data-delete-service]")
        .forEach(button => {
            button.addEventListener("click", async () => {
                await deleteService(button.dataset.deleteService);
            });
        });

    document
    .querySelectorAll("[data-edit-service]")
    .forEach(button => {
        button.addEventListener("click", () => {
            openEditServiceModal(button.dataset.editService);
        });
    });
}

async function toggleService(serviceId, active) {
    const { error } = await supabase
        .from("services")
        .update({
            active,
            updated_at: new Date().toISOString()
        })
        .eq("id", serviceId);

    if (error) {
        alert(error.message);
        return;
    }

    await loadServices();
}

async function deleteService(serviceId) {
    const confirmed = confirm(
        "Are you sure you want to permanently delete this service?"
    );

    if (!confirmed) {
        return;
    }

    const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", serviceId);

    if (error) {
        alert(error.message);
        return;
    }

    await loadServices();
}

function openAddServiceModal() {
    const form = document.getElementById("serviceForm");

    form.reset();

    document.getElementById("serviceId").value = "";
    document.getElementById("serviceDisplayOrder").value = "0";
    document.getElementById("printingEnabled").value = "false";
    renderPrintingOptions([]);
    updatePrintingManagerVisibility();
    document.getElementById("serviceActive").value = "true";

    document.getElementById("serviceModalTitle").textContent =
        "Add Service";

    document.getElementById("saveServiceBtn").innerHTML = `
        <i class="fa-solid fa-floppy-disk"></i>
        Save Service
    `;

    document.getElementById("serviceModal").style.display = "flex";
    document.body.style.overflow = "hidden";
}

function openEditServiceModal(serviceId) {
    const service = loadedServices.find(item => item.id === serviceId);

    if (!service) {
        alert("Service could not be found.");
        return;
    }

    document.getElementById("serviceId").value = service.id;
    document.getElementById("serviceTitle").value =
        service.title || "";

    document.getElementById("serviceSlug").value =
        service.slug || "";

    document.getElementById("serviceCategory").value =
        service.category || "";

    document.getElementById("serviceDisplayOrder").value =
        service.display_order ?? 0;

    document.getElementById("serviceDescription").value =
        service.description || "";

    document.getElementById("starterPrice").value =
        service.starter_price ?? "";

    document.getElementById("premiumPrice").value =
        service.premium_price ?? "";

    document.getElementById("proPrice").value =
        service.pro_price ?? "";

    document.getElementById("starterOriginalPrice").value =
        service.starter_original_price ?? "";

    document.getElementById("premiumOriginalPrice").value =
        service.premium_original_price ?? "";

    document.getElementById("proOriginalPrice").value =
        service.pro_original_price ?? "";

    document.getElementById("printingEnabled").value =
        String(service.printing_enabled === true);

let printingOptions = normalisePrintingOptions(
    service.printing_options
);

if (
    printingOptions.length === 0 &&
    service.printing_enabled === true &&
    Number(service.printing_price || 0) > 0
) {
    printingOptions = [
        {
            id: createPrintingOptionId(),
            size: "Standard",
            price_per_copy:
                Number(service.printing_price),
            minimum_quantity: 1,
            maximum_quantity: null,
            active: true
        }
    ];
}

renderPrintingOptions(printingOptions);
updatePrintingManagerVisibility();

    document.getElementById("serviceActive").value =
        String(service.active !== false);

    document.getElementById("serviceModalTitle").textContent =
        "Edit Service";

    document.getElementById("saveServiceBtn").innerHTML = `
        <i class="fa-solid fa-floppy-disk"></i>
        Update Service
    `;

    document.getElementById("serviceModal").style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeServiceModal() {
    document.getElementById("serviceModal").style.display = "none";
    document.body.style.overflow = "";
}

async function saveService(event) {
    event.preventDefault();

    const button = document.getElementById("saveServiceBtn");
    const serviceId = document.getElementById("serviceId").value;

    const title =
        document.getElementById("serviceTitle").value.trim();

    const slug =
        createSlug(
            document.getElementById("serviceSlug").value
        );

    if (!title || !slug) {
        alert("Service title and slug are required.");
        return;
    }

    const printingEnabled =
        document.getElementById("printingEnabled").value === "true";

        const printingOptions =
    printingEnabled
        ? collectPrintingOptions(true)
        : [];

if (printingOptions === null) {
    return;
}

if (printingEnabled && printingOptions.length === 0) {
    alert(
        "Add at least one printing size or disable printing."
    );

    return;
}

const firstActivePrintingOption =
    printingOptions.find(option => option.active)
    || printingOptions[0]
    || null;

    const serviceData = {
        title,
        slug,

        category:
            document.getElementById("serviceCategory").value.trim()
            || null,

        description:
            document.getElementById("serviceDescription").value.trim()
            || null,

        display_order:
            Number(
                document.getElementById("serviceDisplayOrder").value
                || 0
            ),

        starter_price: valueOrNull("starterPrice"),
        premium_price: valueOrNull("premiumPrice"),
        pro_price: valueOrNull("proPrice"),

        starter_original_price:
            valueOrNull("starterOriginalPrice"),

        premium_original_price:
            valueOrNull("premiumOriginalPrice"),

        pro_original_price:
            valueOrNull("proOriginalPrice"),

        printing_enabled: printingEnabled,

printing_options: printingOptions,

printing_price:
    printingEnabled && firstActivePrintingOption
        ? Number(
            firstActivePrintingOption.price_per_copy
        )
        : 0,

        active:
            document.getElementById("serviceActive").value === "true",

        updated_at: new Date().toISOString()
    };

    button.disabled = true;
    button.textContent = serviceId
        ? "Updating..."
        : "Saving...";

    let error;

    if (serviceId) {
        const result = await supabase
            .from("services")
            .update(serviceData)
            .eq("id", serviceId);

        error = result.error;
    } else {
        const result = await supabase
            .from("services")
            .insert(serviceData);

        error = result.error;
    }

    button.disabled = false;

    button.innerHTML = `
        <i class="fa-solid fa-floppy-disk"></i>
        ${serviceId ? "Update Service" : "Save Service"}
    `;

    if (error) {
        alert(error.message);
        return;
    }

    closeServiceModal();
    await loadServices();
}