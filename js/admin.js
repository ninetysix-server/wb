import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
    loadServices,
    initialiseServiceManager
} from "./admin-services.js";

    const SUPABASE_URL = "https://pebkryplphawjlmvcfma.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlYmtyeXBscGhhd2psbXZjZm1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2ODg2NjEsImV4cCI6MjA5NzI2NDY2MX0.Sn1IPlLKhJG5u6gTXpB_tUbSr4PThWrWVpHUNDG1zdU";

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    let allOrders = [];
    let activeOrder = null;

    const $ = id => document.getElementById(id);
    const money = value => new Intl.NumberFormat("en-ZA",{style:"currency",currency:"ZAR"}).format(Number(value || 0));
    const dateText = value => value ? new Date(value).toLocaleString("en-ZA",{dateStyle:"medium",timeStyle:"short"}) : "—";
    const safe = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
    const slug = value => String(value || "").toLowerCase().replace(/\s+/g,"-");

    function showToast(message){
      $("toast").textContent = message;
      $("toast").classList.add("show");
      setTimeout(()=>$("toast").classList.remove("show"),2400);
    }
    

    async function sendOrderUpdateEmail(
  orderRecordId,
  previousDesignStatus
){
  const { data, error } = await supabase.functions.invoke(
    "send-order-update-email",
    {
      body:{
        orderRecordId,
        previousDesignStatus
      }
    }
  );

  if(error){
    throw error;
  }

  if(!data?.success){
    throw new Error(
      data?.error || "Unable to send customer email"
    );
  }

  return data;
}

    async function guardAdmin(){
      const { data:{ session } } = await supabase.auth.getSession();
      if(!session){
        window.location.href = "index.html";
        return null;
      }
      $("adminEmail").textContent = session.user.email || "Administrator";

      const { data, error } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if(error || !data){
        document.body.innerHTML = `<div class="error"><h2>Access denied</h2><p>This account is not registered as a 96 Studios administrator.</p><a href="index.html">Return home</a></div>`;
        return null;
      }
      return session.user;
    }

    async function loadOrders(){
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at",{ascending:false});

      if(error){
        $("tableState").className = "error";
        $("tableState").textContent = error.message;
        return;
      }
      allOrders = data || [];
      updateStats();
      renderOrders();
    }

    function updateStats(){
      const paid = allOrders.filter(o => (o.payment_status || "").toLowerCase() === "paid");
      const designing = allOrders.filter(o => ["designing","review","ready"].includes((o.design_status || "").toLowerCase()));
      const revenue = paid.reduce((sum,o)=>sum + Number(o.totals?.total || 0),0);
      $("totalOrders").textContent = allOrders.length;
      $("paidOrders").textContent = paid.length;
      $("designingOrders").textContent = designing.length;
      $("paidRevenue").textContent = money(revenue);
    }

    function serviceNames(order){
      return (order.cart || []).map(i=>i.serviceTitle || i.title || i.serviceId || "Design Service").join(", ");
    }

    function reportMoney(value) {
    return `R ${Number(value || 0).toFixed(2)}`;
}

function reportDate(value) {
    if (!value) {
        return "—";
    }

    return new Date(value).toLocaleString(
        "en-ZA",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}

function buildReportFileName() {
    const now = new Date();

    const datePart = now
        .toISOString()
        .slice(0, 10);

    const timePart = now
        .toTimeString()
        .slice(0, 5)
        .replace(":", "-");

    return `96-Studios-Orders-${datePart}-${timePart}.pdf`;
}

function getOrderReportSummary() {
    const paidOrders = allOrders.filter(order =>
        String(
            order.payment_status || ""
        ).toLowerCase() === "paid"
    );

    const paidRevenue = paidOrders.reduce(
        (total, order) =>
            total +
            Number(order.totals?.total || 0),
        0
    );

    const pendingOrders = allOrders.filter(order =>
        String(
            order.payment_status || ""
        ).toLowerCase() === "pending"
    );

    const completedOrders = allOrders.filter(order =>
        String(
            order.design_status || ""
        ).toLowerCase() === "completed"
    );

    return {
        totalOrders: allOrders.length,
        paidOrders: paidOrders.length,
        pendingOrders: pendingOrders.length,
        completedOrders: completedOrders.length,
        paidRevenue
    };
}

function generateOrdersPdf() {
    if (!allOrders.length) {
        showToast("There are no orders to include in the report");
        return false;
    }

    if (
        !window.jspdf ||
        typeof window.jspdf.jsPDF !== "function"
    ) {
        showToast("The PDF library failed to load");
        return false;
    }

    const { jsPDF } = window.jspdf;

    const documentPdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
    });

    const summary = getOrderReportSummary();

    const generatedDate =
        new Date().toLocaleString(
            "en-ZA",
            {
                dateStyle: "full",
                timeStyle: "short"
            }
        );

    documentPdf.setFont("helvetica", "bold");
    documentPdf.setFontSize(20);
    documentPdf.text(
        "96 Studios Orders Report",
        14,
        17
    );

    documentPdf.setFont(
        "helvetica",
        "normal"
    );

    documentPdf.setFontSize(10);
    documentPdf.text(
        `Generated: ${generatedDate}`,
        14,
        24
    );

    documentPdf.setFontSize(11);

    documentPdf.text(
        `Total orders: ${summary.totalOrders}`,
        14,
        34
    );

    documentPdf.text(
        `Paid orders: ${summary.paidOrders}`,
        62,
        34
    );

    documentPdf.text(
        `Pending payments: ${summary.pendingOrders}`,
        106,
        34
    );

    documentPdf.text(
        `Completed orders: ${summary.completedOrders}`,
        166,
        34
    );

    documentPdf.text(
        `Paid revenue: ${reportMoney(
            summary.paidRevenue
        )}`,
        222,
        34
    );

    const reportRows = allOrders.map(order => [
        order.order_id || "—",
        order.client_id || "—",
        serviceNames(order) || "—",
        reportMoney(order.totals?.total),
        order.payment_status || "Pending",
        order.design_status || "Waiting",
        `${Number(order.progress || 0)}%`,
        reportDate(order.created_at)
    ]);

    documentPdf.autoTable({
        startY: 42,

        head: [[
            "Order",
            "Client",
            "Services",
            "Total",
            "Payment",
            "Design",
            "Progress",
            "Created"
        ]],

        body: reportRows,

        theme: "grid",

        styles: {
            font: "helvetica",
            fontSize: 8,
            cellPadding: 2.5,
            overflow: "linebreak",
            valign: "middle"
        },

        headStyles: {
            fillColor: [0, 67, 112],
            textColor: [255, 255, 255],
            fontStyle: "bold"
        },

        columnStyles: {
            0: {
                cellWidth: 28
            },

            1: {
                cellWidth: 25
            },

            2: {
                cellWidth: 62
            },

            3: {
                cellWidth: 24,
                halign: "right"
            },

            4: {
                cellWidth: 23
            },

            5: {
                cellWidth: 24
            },

            6: {
                cellWidth: 18,
                halign: "center"
            },

            7: {
                cellWidth: 38
            }
        },

        margin: {
            left: 14,
            right: 14,
            bottom: 16
        },

        didDrawPage(data) {
            const pageCount =
                documentPdf.internal
                    .getNumberOfPages();

            const pageWidth =
                documentPdf.internal
                    .pageSize
                    .getWidth();

            const pageHeight =
                documentPdf.internal
                    .pageSize
                    .getHeight();

            documentPdf.setFontSize(8);
            documentPdf.setTextColor(100);

            documentPdf.text(
                `96 Studios · Page ${pageCount}`,
                pageWidth - 14,
                pageHeight - 7,
                {
                    align: "right"
                }
            );
        }
    });

    documentPdf.save(
        buildReportFileName()
    );

    showToast("Orders PDF report generated");

    return true;
}

function openResetOrdersModal() {
    if (!allOrders.length) {
        showToast("There are no orders to reset");
        return;
    }

    $("resetOrdersConfirmation").value = "";
    $("resetOrdersAgreement").checked = false;

    updateResetButtonState();

    $("resetOrdersModal").style.display =
        "flex";

    document.body.style.overflow =
        "hidden";

    setTimeout(() => {
        $("resetOrdersConfirmation").focus();
    }, 150);
}

function closeResetOrdersModal() {
    $("resetOrdersModal").style.display =
        "none";

    $("resetOrdersConfirmation").value = "";
    $("resetOrdersAgreement").checked = false;

    updateResetButtonState();

    if (
        $("orderModal").style.display !==
        "flex"
    ) {
        document.body.style.overflow = "";
    }
}

function updateResetButtonState() {
    const confirmation =
        $("resetOrdersConfirmation")
            .value
            .trim();

    const agreement =
        $("resetOrdersAgreement").checked;

    const allowed =
        confirmation === "RESET ORDERS" &&
        agreement === true;

    const button =
        $("confirmResetOrders");

    button.disabled = !allowed;
    button.style.opacity =
        allowed ? "1" : "0.5";

    button.style.cursor =
        allowed
            ? "pointer"
            : "not-allowed";
}

function chunkValues(values, size = 100) {
    const chunks = [];

    for (
        let index = 0;
        index < values.length;
        index += size
    ) {
        chunks.push(
            values.slice(
                index,
                index + size
            )
        );
    }

    return chunks;
}

async function getAllOrderStoragePaths() {
    const orderIds = allOrders
        .map(order => order.id)
        .filter(Boolean);

    if (!orderIds.length) {
        return [];
    }

    const storagePaths = [];

    for (
        const orderIdChunk of
        chunkValues(orderIds, 100)
    ) {
        const {
            data,
            error
        } = await supabase
            .from("order_files")
            .select("storage_path")
            .in(
                "order_id",
                orderIdChunk
            );

        if (error) {
            throw error;
        }

        for (const file of data || []) {
            if (file.storage_path) {
                storagePaths.push(
                    file.storage_path
                );
            }
        }
    }

    return storagePaths;
}

async function removeOrderStorageFiles(
    storagePaths
) {
    if (!storagePaths.length) {
        return;
    }

    for (
        const pathChunk of
        chunkValues(storagePaths, 100)
    ) {
        const {
            error
        } = await supabase.storage
            .from("design-files")
            .remove(pathChunk);

        if (error) {
            throw error;
        }
    }
}

async function resetAllOrders() {
    const confirmation =
        $("resetOrdersConfirmation")
            .value
            .trim();

    const agreement =
        $("resetOrdersAgreement").checked;

    if (
        confirmation !== "RESET ORDERS" ||
        !agreement
    ) {
        showToast(
            "Complete the confirmation before resetting"
        );

        return;
    }

    const button =
        $("confirmResetOrders");

    button.disabled = true;
    button.style.opacity = "0.7";
    button.style.cursor = "wait";

    button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Preparing reset...
    `;

    try {
        /*
         * Load Storage paths before the database
         * records are removed.
         */
        const storagePaths =
            await getAllOrderStoragePaths();

        if (storagePaths.length) {
            button.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Removing files...
            `;

            await removeOrderStorageFiles(
                storagePaths
            );
        }

        button.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Clearing orders...
        `;

                const {
            data: sessionData,
            error: sessionError
        } = await supabase.auth.getSession();

        if (sessionError) {
            throw sessionError;
        }

        if (!sessionData?.session) {
            throw new Error(
                "Your administrator session has expired. Please sign in again."
            );
        }

        const {
            data: refreshData,
            error: refreshError
        } = await supabase.auth.refreshSession();

        if (refreshError) {
            throw refreshError;
        }

        if (!refreshData?.session?.access_token) {
            throw new Error(
                "Unable to refresh your administrator session. Please sign in again."
            );
        }

        const {
            data,
            error
        } = await supabase.rpc(
            "reset_all_orders"
        );

        if (error) {
            throw error;
        }

        const deletedCount =
            Number(
                data?.deleted_orders ||
                allOrders.length
            );

        allOrders = [];
        activeOrder = null;

        $("searchInput").value = "";
        $("paymentFilter").value = "";
        $("designFilter").value = "";

        closeResetOrdersModal();

        updateStats();
        renderOrders();

        showToast(
            `${deletedCount} order${
                deletedCount === 1
                    ? ""
                    : "s"
            } permanently removed`
        );
    } catch (error) {
    console.log("========== RESET ERROR ==========");
    console.log("message:", error?.message);
    console.log("details:", error?.details);
    console.log("hint:", error?.hint);
    console.log("code:", error?.code);
    console.log("error object:", error);

    alert(
        JSON.stringify(
            {
                message: error?.message,
                details: error?.details,
                hint: error?.hint,
                code: error?.code
            },
            null,
            2
        )
    );

    showToast(
        error?.message ||
        "Unable to reset orders"
    );
}
     finally {
        button.disabled = false;
        button.style.opacity = "1";
        button.style.cursor = "pointer";

        button.innerHTML = `
            <i class="fa-solid fa-trash-can"></i>
            Permanently Reset
        `;

        updateResetButtonState();
    }
}

    function filteredOrders(){
      const query = $("searchInput").value.trim().toLowerCase();
      const payment = $("paymentFilter").value.toLowerCase();
      const design = $("designFilter").value.toLowerCase();

      return allOrders.filter(order=>{
        const haystack = [order.order_id,order.client_id,serviceNames(order)].join(" ").toLowerCase();
        return (!query || haystack.includes(query))
          && (!payment || (order.payment_status || "").toLowerCase() === payment)
          && (!design || (order.design_status || "").toLowerCase() === design);
      });
    }

    function renderOrders(){
      const orders = filteredOrders();
      $("tableState").hidden = orders.length > 0;
      $("tableWrap").hidden = orders.length === 0;
      if(!orders.length){
        $("tableState").className = "empty";
        $("tableState").textContent = allOrders.length ? "No orders match your filters." : "No orders yet.";
        return;
      }

      $("ordersBody").innerHTML = orders.map(order=>{
        const payment = order.payment_status || "Pending";
        const design = order.design_status || "Waiting";
        return `<tr>
          <td><span class="order-id">${safe(order.order_id)}</span></td>
          <td>${safe(order.client_id || "—")}</td>
          <td>${safe(serviceNames(order) || "—")}</td>
          <td>${money(order.totals?.total)}</td>
          <td><span class="badge badge-${slug(payment)}">${safe(payment)}</span></td>
          <td><span class="badge badge-${slug(design)}">${safe(design)}</span></td>
          <td>${Number(order.progress || 0)}%</td>
          <td>${safe(dateText(order.created_at))}</td>
          <td><div class="actions"><button class="icon-btn" data-open="${safe(order.id)}" title="Open order"><i class="fa-solid fa-eye"></i></button></div></td>
        </tr>`;
      }).join("");

      document.querySelectorAll("[data-open]").forEach(btn=>btn.addEventListener("click",()=>openOrder(btn.dataset.open)));
    }

    function renderOrderItemDetails(item) {
    const details = item.details || {};
    const quantity = Math.max(
        1,
        Number(item.quantity || 1)
    );

    const unitTotal = Number(item.price || 0);
    const lineTotal = unitTotal * quantity;

    const printing =
        details.printing &&
        typeof details.printing === "object"
            ? details.printing
            : null;

    const printingSelected =
        details.printingSelected === true ||
        printing !== null;

    const printingSize =
        printing?.size ||
        details.printingSize ||
        "Standard";

    const printingCopies = Number(
        printing?.copies ||
        details.printingCopies ||
        0
    );

    const printingPricePerCopy = Number(
        printing?.pricePerCopy ||
        details.printingPricePerCopy ||
        0
    );

    const printingUnitTotal = Number(
        printing?.total ||
        details.printingPrice ||
        0
    );

    const designUnitTotal = Number(
        details.designTotal ??
        details.servicePrice ??
        (
            details.pages
                ? Number(details.basePrice || 0) +
                  (
                      Number(details.additionalPages || 0) *
                      Number(details.pricePerPage || 0)
                  )
                : unitTotal - printingUnitTotal
        )
    );

    return `
        <div style="
            padding:16px;
            margin-bottom:14px;
            border:1px solid #e2e8f0;
            border-radius:14px;
            background:#ffffff;
        ">
            <div style="
                display:flex;
                justify-content:space-between;
                align-items:flex-start;
                gap:18px;
                margin-bottom:12px;
            ">
                <div>
                    <strong style="display:block;">
                        ${safe(
                            item.serviceTitle ||
                            item.title ||
                            "Design Service"
                        )}
                    </strong>

                    <small style="color:#64748b;">
                        ${safe(item.tierName || "Standard")}
                        × ${quantity}
                    </small>
                </div>

                <strong>
                    ${money(lineTotal)}
                </strong>
            </div>

            <div style="
                display:grid;
                gap:8px;
                font-size:13px;
            ">
                <div style="
                    display:flex;
                    justify-content:space-between;
                    gap:20px;
                ">
                    <span>Design</span>
                    <strong>
                        ${money(designUnitTotal * quantity)}
                    </strong>
                </div>

                ${
                    printingSelected
                        ? `
                            <div style="
                                margin-top:6px;
                                padding-top:10px;
                                border-top:1px solid #edf2f7;
                                font-weight:700;
                            ">
                                Printing details
                            </div>

                            <div style="
                                display:flex;
                                justify-content:space-between;
                                gap:20px;
                            ">
                                <span>Size</span>
                                <strong>
                                    ${safe(printingSize)}
                                </strong>
                            </div>

                            <div style="
                                display:flex;
                                justify-content:space-between;
                                gap:20px;
                            ">
                                <span>Copies</span>
                                <strong>
                                    ${printingCopies}
                                </strong>
                            </div>

                            <div style="
                                display:flex;
                                justify-content:space-between;
                                gap:20px;
                            ">
                                <span>Price per copy</span>
                                <strong>
                                    ${money(printingPricePerCopy)}
                                </strong>
                            </div>

                            <div style="
                                display:flex;
                                justify-content:space-between;
                                gap:20px;
                            ">
                                <span>
                                    Printing subtotal
                                </span>

                                <strong>
                                    ${money(
                                        printingUnitTotal *
                                        quantity
                                    )}
                                </strong>
                            </div>
                        `
                        : ""
                }

                <div style="
                    display:flex;
                    justify-content:space-between;
                    gap:20px;
                    margin-top:6px;
                    padding-top:10px;
                    border-top:1px solid #e2e8f0;
                    font-size:14px;
                ">
                    <strong>Item total</strong>
                    <strong>${money(lineTotal)}</strong>
                </div>
            </div>
        </div>
    `;
}

function formatAddress(address = {}) {
    const parts = [
        address.addressLine1,
        address.addressLine2,
        address.area,
        address.city,
        address.province,
        address.postalCode
    ]
        .map(value => String(value || '').trim())
        .filter(Boolean);

    return parts.length
        ? parts.map(safe).join(', ')
        : 'Not provided';
}


function renderCustomerOrderDetails(order) {
    const customer =
        order.customer_details || {};

    const home =
        order.home_address || {};

    const delivery =
        order.delivery_address || {};

    const printingRequested =
        order.printing_requested === true;

    return `
        <div class="detail-card full">
            <small>Customer Details</small>

            <div style="
                display:grid;
                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
                gap:14px;
                margin-top:12px;
            ">
                <div>
                    <span style="
                        display:block;
                        margin-bottom:4px;
                        color:#64748b;
                        font-size:12px;
                    ">
                        Customer name
                    </span>

                    <strong>
                        ${safe(
                            customer.fullName ||
                            home.recipientName ||
                            'Not provided'
                        )}
                    </strong>
                </div>

                <div>
                    <span style="
                        display:block;
                        margin-bottom:4px;
                        color:#64748b;
                        font-size:12px;
                    ">
                        WhatsApp number
                    </span>

                    <strong>
                        ${safe(
                            customer.whatsappNumber ||
                            'Not provided'
                        )}
                    </strong>
                </div>
            </div>
        </div>

        <div class="detail-card full">
            <small>Personal Home Address</small>

            <strong style="
                display:block;
                margin-top:10px;
                line-height:1.65;
            ">
                ${formatAddress(home)}
            </strong>
        </div>

        <div class="detail-card full">
            <small>Printing and Delivery</small>

            <div style="margin-top:10px;">
                <strong>
                    Printing requested:
                    ${printingRequested ? 'Yes' : 'No'}
                </strong>
            </div>

            ${
                printingRequested
                    ? `
                        <div style="
                            display:grid;
                            gap:10px;
                            margin-top:14px;
                            padding-top:14px;
                            border-top:1px solid #e2e8f0;
                        ">
                            <div>
                                <span style="
                                    display:block;
                                    color:#64748b;
                                    font-size:12px;
                                    margin-bottom:4px;
                                ">
                                    Recipient
                                </span>

                                <strong>
                                    ${safe(
                                        delivery.recipientName ||
                                        'Not provided'
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span style="
                                    display:block;
                                    color:#64748b;
                                    font-size:12px;
                                    margin-bottom:4px;
                                ">
                                    Delivery contact
                                </span>

                                <strong>
                                    ${safe(
                                        delivery.phone ||
                                        'Not provided'
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span style="
                                    display:block;
                                    color:#64748b;
                                    font-size:12px;
                                    margin-bottom:4px;
                                ">
                                    Delivery address
                                </span>

                                <strong style="line-height:1.65;">
                                    ${formatAddress(delivery)}
                                </strong>
                            </div>

                            <div>
                                <span style="
                                    display:block;
                                    color:#64748b;
                                    font-size:12px;
                                    margin-bottom:4px;
                                ">
                                    Delivery instructions
                                </span>

                                <strong>
                                    ${safe(
                                        delivery.instructions ||
                                        'None'
                                    )}
                                </strong>
                            </div>
                        </div>
                    `
                    : `
                        <div
                            class="meta-note"
                            style="margin-top:8px;"
                        >
                            No printing delivery is required.
                        </div>
                    `
            }
        </div>
    `;
}

    function openOrder(id){
      activeOrder = allOrders.find(o=>o.id===id);
      if(!activeOrder) return;
      $("modalTitle").textContent = activeOrder.order_id;
      const items = (activeOrder.cart || [])
    .map(renderOrderItemDetails)
    .join("") || "No cart items";

      $("modalBody").innerHTML = `
        <div class="detail-grid">
          <div class="detail-card"><small>Client ID</small><strong>${safe(activeOrder.client_id || "—")}</strong></div>
          <div class="detail-card"><small>Created</small><strong>${safe(dateText(activeOrder.created_at))}</strong></div>
          <div class="detail-card"><small>Payment Status</small><strong>${safe(activeOrder.payment_status || "Pending")}</strong></div>
          <div class="detail-card"><small>Total</small><strong>${money(activeOrder.totals?.total)}</strong></div>
          <div class="detail-card full"><small>Items</small><div class="items">${items}</div></div>
          ${renderCustomerOrderDetails(activeOrder)}
          <div class="detail-card full"><small>Design Description</small><strong>${safe(activeOrder.user_input?.designDescription || "No description provided")}</strong></div>

<div class="detail-card full" id="adminApprovalCard">
  <small>Customer approval</small>
  <div id="adminApprovalResult" class="meta-note">
    Loading customer response...
  </div>
</div>

<div class="detail-card"><small>Preferred Colours</small><strong>${safe(activeOrder.user_input?.preferredColors || "Not provided")}</strong></div>

<div class="detail-card full">
    <small>Customer Sketch or Reference</small>

    <div
        id="adminSketchResult"
        class="meta-note"
        style="margin-top:12px;"
    >
        Loading sketch...
    </div>
</div>
        </div>
        <div class="management-grid">
          <div class="field">
            <label>Assigned designer</label>
            <input id="editDesigner" maxlength="120" placeholder="Designer name" value="${safe(activeOrder.assigned_designer || "")}">
          </div>
          <div class="field">
            <label>Estimated completion date</label>
            <input id="editDueDate" type="date" value="${safe(activeOrder.estimated_completion_date || "")}">
          </div>
          <div class="field full">
            <label>Internal admin notes</label>
            <textarea id="editAdminNotes" maxlength="3000" placeholder="Private notes—customers cannot see these">${safe(activeOrder.admin_notes || "")}</textarea>
            <div class="meta-note">Internal notes are visible only in the admin dashboard.</div>
          </div>
          <div class="field full">
            <label>Customer update</label>
            <textarea id="editCustomerUpdate" maxlength="1000" placeholder="A short progress message the customer can see">${safe(activeOrder.customer_update || "")}</textarea>
          </div>
        </div>
        <div class="delivery-manager">
          <h3>Customer file delivery</h3>
          <div class="upload-row">
            <div class="field">
              <label>Select completed files</label>
              <input id="deliveryFiles" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.zip,.svg,.webp,.ai,.eps">
              <label style="margin-top:10px;display:block;">File label</label>
              <select id="deliveryLabel">
                <option value="Concept">Concept</option>
                <option value="Revision">Revision</option>
                <option value="Final Files">Final Files</option>
              </select>
              <div class="meta-note">Choose how this file should appear in the customer gallery.</div>
              <div class="meta-note">PDF, images, ZIP, SVG, AI and EPS files are supported.</div>
            </div>
            <button type="button" class="upload-btn" id="uploadFiles"><i class="fa-solid fa-cloud-arrow-up"></i> Upload</button>
          </div>
          <div class="file-list" id="adminFileList"><div class="meta-note">Loading delivery files...</div></div>
        </div>
        <div class="status-editor">
          <div class="field"><label>Payment status</label>
            <select id="editPayment"><option>Pending</option><option>Paid</option><option>Failed</option><option>Cancelled</option></select>
          </div>
          <div class="field"><label>Design status</label>
            <select id="editDesign"><option>Waiting</option><option>Designing</option><option>Review</option><option>Ready</option><option>Completed</option></select>
          </div>
          <div class="field"><label>Progress</label>
            <select id="editProgress"><option value="0">0%</option><option value="25">25%</option><option value="50">50%</option><option value="75">75%</option><option value="100">100%</option></select>
            <div class="quick-progress">
              <button type="button" class="progress-chip" data-progress="0">0%</button>
              <button type="button" class="progress-chip" data-progress="25">25%</button>
              <button type="button" class="progress-chip" data-progress="50">50%</button>
              <button type="button" class="progress-chip" data-progress="75">75%</button>
              <button type="button" class="progress-chip" data-progress="100">100%</button>
            </div>
          </div>
          <button class="save-btn" id="saveOrder"><i class="fa-solid fa-floppy-disk"></i> Save Changes</button>
        </div>`;

      $("editPayment").value = activeOrder.payment_status || "Pending";
      $("editDesign").value = activeOrder.design_status || "Waiting";
      $("editProgress").value = String(activeOrder.progress || 0);
      document.querySelectorAll(".progress-chip").forEach(chip=>{
        chip.addEventListener("click",()=>{$("editProgress").value = chip.dataset.progress;});
      });
      $("saveOrder").addEventListener("click",saveOrderChanges);
      $("uploadFiles").addEventListener("click", uploadDeliveryFiles);
        loadAdminApproval();
        loadAdminSketch();
        loadAdminDeliveryFiles();
      $("orderModal").style.display = "flex";
      document.body.style.overflow = "hidden";
    }

    async function loadAdminSketch() {
    if (!activeOrder) {
        return;
    }

    const result =
        document.getElementById(
            'adminSketchResult'
        );

    if (!result) {
        return;
    }

    result.innerHTML = `
        <div class="meta-note">
            Loading sketch...
        </div>
    `;

    const {
        data: sketch,
        error
    } = await supabase
        .from('order_sketches')
        .select('*')
        .eq('order_id', activeOrder.id)
        .order('created_at', {
            ascending: false
        })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error(
            'Admin sketch load failed:',
            error
        );

        result.innerHTML = `
            <span style="color:var(--danger);">
                Unable to load the customer sketch.
            </span>
        `;

        return;
    }

    if (!sketch) {
        result.innerHTML = `
            <span style="color:var(--muted);">
                No sketch or reference file was provided.
            </span>
        `;

        return;
    }

    const {
        data: signedUrlData,
        error: signedUrlError
    } = await supabase.storage
        .from('order-sketches')
        .createSignedUrl(
            sketch.storage_path,
            60 * 30
        );

    if (
        signedUrlError ||
        !signedUrlData?.signedUrl
    ) {
        console.error(
            'Sketch signed URL failed:',
            signedUrlError
        );

        result.innerHTML = `
            <span style="color:var(--danger);">
                The sketch file exists, but its secure link
                could not be created.
            </span>
        `;

        return;
    }

    const signedUrl =
        signedUrlData.signedUrl;

    const isImage =
        String(sketch.mime_type || '')
            .startsWith('image/');

    const isPdf =
        sketch.mime_type ===
            'application/pdf' ||
        String(sketch.file_name || '')
            .toLowerCase()
            .endsWith('.pdf');

    const expiresText =
        sketch.expires_at
            ? dateText(sketch.expires_at)
            : 'Not available';

    result.innerHTML = `
        <div style="
            display:grid;
            gap:14px;
        ">
            ${
                isImage
                    ? `
                        <button
                            type="button"
                            class="admin-sketch-preview"
                            id="openAdminSketchPreview"
                            style="
                                width:100%;
                                padding:0;
                                overflow:hidden;
                                border:1px solid #e2e8f0;
                                border-radius:14px;
                                background:#f8fafc;
                                cursor:pointer;
                            "
                        >
                            <img
                                src="${safe(signedUrl)}"
                                alt="${safe(
                                    sketch.file_name ||
                                    'Customer sketch'
                                )}"
                                style="
                                    display:block;
                                    width:100%;
                                    max-height:360px;
                                    object-fit:contain;
                                    background:#f8fafc;
                                "
                            >
                        </button>
                    `
                    : `
                        <div style="
                            display:flex;
                            align-items:center;
                            gap:14px;
                            padding:18px;
                            border:1px solid #e2e8f0;
                            border-radius:14px;
                            background:#f8fafc;
                        ">
                            <span style="
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                width:48px;
                                height:48px;
                                border-radius:12px;
                                background:#fee2e2;
                                color:#dc2626;
                                font-size:21px;
                            ">
                                <i class="fa-solid fa-file-pdf"></i>
                            </span>

                            <div>
                                <strong style="
                                    display:block;
                                    margin-bottom:4px;
                                ">
                                    ${safe(
                                        sketch.file_name ||
                                        'Customer sketch'
                                    )}
                                </strong>

                                <small style="color:#64748b;">
                                    PDF reference file
                                </small>
                            </div>
                        </div>
                    `
            }

            <div style="
                display:flex;
                flex-wrap:wrap;
                gap:10px;
            ">
                <button
                    type="button"
                    class="save-btn"
                    id="openAdminSketchFile"
                >
                    <i class="fa-solid ${
                        isPdf
                            ? 'fa-file-pdf'
                            : 'fa-eye'
                    }"></i>

                    ${
                        isPdf
                            ? 'Preview PDF'
                            : 'Open Preview'
                    }
                </button>

                <a
                    href="${safe(signedUrl)}"
                    download="${safe(
                        sketch.file_name ||
                        'customer-sketch'
                    )}"
                    class="save-btn"
                    style="
                        display:inline-flex;
                        align-items:center;
                        justify-content:center;
                        gap:8px;
                        text-decoration:none;
                    "
                >
                    <i class="fa-solid fa-download"></i>
                    Download
                </a>
            </div>

            <div class="meta-note">
                File:
                ${safe(
                    sketch.file_name ||
                    'Unnamed file'
                )}
                <br>
                Scheduled deletion:
                ${safe(expiresText)}
            </div>
        </div>
    `;

    const openPreview = () => {
        const previewModal =
            document.getElementById(
                'filePreviewModal'
            );

        const previewFrame =
            document.getElementById(
                'filePreviewFrame'
            );

        const previewTitle =
            document.getElementById(
                'filePreviewTitle'
            );

        if (
            !previewModal ||
            !previewFrame ||
            !previewTitle
        ) {
            window.open(
                signedUrl,
                '_blank',
                'noopener'
            );

            return;
        }

        previewTitle.textContent =
            sketch.file_name ||
            'Customer Sketch';

        previewFrame.src = signedUrl;

        previewModal.style.display = 'flex';

        document.body.style.overflow =
            'hidden';
    };

    document
        .getElementById(
            'openAdminSketchFile'
        )
        ?.addEventListener(
            'click',
            openPreview
        );

    document
        .getElementById(
            'openAdminSketchPreview'
        )
        ?.addEventListener(
            'click',
            openPreview
        );
}

  
function getFileIcon(mimeType, fileName) {

    const name = (fileName || "").toLowerCase();

    if (mimeType?.startsWith("image/")) {
        return '<i class="fa-solid fa-image"></i>';
    }

    if (name.endsWith(".pdf")) {
        return '<i class="fa-solid fa-file-pdf"></i>';
    }

    if (
        name.endsWith(".zip") ||
        name.endsWith(".rar") ||
        name.endsWith(".7z")
    ) {
        return '<i class="fa-solid fa-file-zipper"></i>';
    }

    if (
        name.endsWith(".ai") ||
        name.endsWith(".eps") ||
        name.endsWith(".svg")
    ) {
        return '<i class="fa-solid fa-pen-ruler"></i>';
    }

    return '<i class="fa-solid fa-file"></i>';
}

async function loadAdminApproval(){
  if(!activeOrder) return;

  const result = $("adminApprovalResult");

  const { data, error } = await supabase
    .from("order_approvals")
    .select("*")
    .eq("order_id", activeOrder.id)
    .order("created_at", { ascending:false })
    .limit(1)
    .maybeSingle();

  if(error){
    console.error("Admin approval load failed:", error);
    result.innerHTML = `
      <span style="color:var(--danger);">
        Unable to load customer approval.
      </span>
    `;
    return;
  }

  if(!data){
    result.innerHTML = `
      <span style="color:var(--muted);">
        The customer has not responded yet.
      </span>
    `;
    return;
  }

  if(data.decision === "approved"){
    result.innerHTML = `
      <strong style="display:block;color:var(--green);margin-bottom:6px;">
        <i class="fa-solid fa-circle-check"></i>
        Design approved
      </strong>

      <span>
        Submitted ${safe(dateText(data.created_at))}
      </span>
    `;
    return;
  }

  result.innerHTML = `
    <strong style="display:block;color:var(--danger);margin-bottom:6px;">
      <i class="fa-solid fa-rotate-left"></i>
      Changes requested
    </strong>

    <div style="margin-bottom:8px;white-space:pre-wrap;">
      ${safe(data.feedback || "No feedback was provided.")}
    </div>

    <small>
      Submitted ${safe(dateText(data.created_at))}
    </small>
  `;
}

    async function loadAdminDeliveryFiles(){
      if(!activeOrder) return;
      const list = $("adminFileList");
      list.innerHTML = '<div class="meta-note">Loading delivery files...</div>';

      const { data, error } = await supabase
        .from("order_files")
        .select("*")
        .eq("order_id", activeOrder.id)
        .order("created_at", { ascending:false });

      if(error){
        list.innerHTML = `<div class="meta-note">${safe(error.message)}</div>`;
        return;
      }
      if(!data?.length){
        list.innerHTML = '<div class="meta-note">No completed files uploaded yet.</div>';
        return;
      }

      list.innerHTML = data.map(file => `
        <div class="file-entry" style="display:flex;align-items:center;gap:15px;">
          ${file.mime_type?.startsWith("image/")
? `
<div style="
    width:50px;
    height:50px;
    border-radius:12px;
    overflow:hidden;
    background:#edf5fb;
">
    <img
        src="#"
        data-thumbnail="${safe(file.id)}"
        style="
            width:100%;
            height:100%;
            object-fit:cover;
        ">
    </div>
    `
    : `
    <div style="
        width:50px;
        height:50px;
        border-radius:12px;
        background:#edf5fb;
        display:flex;
        align-items:center;
        justify-content:center;
        color:#004370;
        font-size:22px;
    ">
        ${getFileIcon(file.mime_type, file.file_name)}
    </div>
    `}
          <div>
            <strong title="${safe(file.file_name)}">${safe(file.file_name)}</strong>
            <small>${formatFileSize(file.size_bytes)} · ${safe(dateText(file.created_at))}</small>
          </div>
          <div class="file-actions">
            <button type="button" class="file-action" data-admin-download="${safe(file.id)}"><i class="fa-solid fa-download"></i></button>
            <button type="button" class="file-action delete" data-admin-delete="${safe(file.id)}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>`).join("");

        for (const file of data) {

    if (!file.mime_type?.startsWith("image/")) continue;

    const { data: signed } = await supabase.storage
        .from("design-files")
        .createSignedUrl(file.storage_path, 120);

    if (!signed) continue;

    const img = document.querySelector(
        `[data-thumbnail="${file.id}"]`
    );

    if (img) {
        img.src = signed.signedUrl;
    }
}

      document.querySelectorAll("[data-admin-download]").forEach(btn=>{
        btn.addEventListener("click",()=>downloadAdminFile(btn.dataset.adminDownload, data));
      });
      document.querySelectorAll("[data-admin-delete]").forEach(btn=>{
        btn.addEventListener("click",()=>deleteDeliveryFile(btn.dataset.adminDelete, data));
      });
    }

    function formatFileSize(bytes){
      const value = Number(bytes || 0);
      if(value < 1024) return `${value} B`;
      if(value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
      return `${(value / (1024 * 1024)).toFixed(1)} MB`;
    }

    async function uploadDeliveryFiles(){
      if(!activeOrder) return;
      const input = $("deliveryFiles");
      const files = Array.from(input.files || []);
      const label = $("deliveryLabel").value;
      if(!files.length){
        showToast("Choose at least one file");
        return;
      }

      const button = $("uploadFiles");
      button.disabled = true;
      button.textContent = "Uploading...";

      try{
        const previousDesignStatus =
        activeOrder.design_status || "Waiting";

        for(const file of files){
          const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const storagePath = `${activeOrder.user_id}/${activeOrder.order_id}/${crypto.randomUUID()}-${cleanName}`;

          const { error: uploadError } = await supabase.storage
            .from("design-files")
            .upload(storagePath, file, {
              cacheControl:"3600",
              upsert:false,
              contentType:file.type || undefined
            });
          if(uploadError) throw uploadError;

          const { error: rowError } = await supabase.from("order_files").insert({
            order_id:activeOrder.id,
            user_id:activeOrder.user_id,
            storage_path:storagePath,
            file_name:file.name,
            mime_type:file.type || null,
            size_bytes:file.size,
            label
          });

          if(rowError){
            await supabase.storage.from("design-files").remove([storagePath]);
            throw rowError;
          }
        }

        input.value = "";
        const { error: readyUpdateError } = await supabase
  .from("orders")
  .update({
    design_status:"Ready",
    progress:100,
    customer_update:
      "Your completed design files are ready for download.",
    updated_at:new Date().toISOString()
  })
  .eq("id",activeOrder.id);

if(readyUpdateError){
  throw readyUpdateError;
}

let uploadActivityCreated = false;

try {
  showToast("Creating upload timeline...");
  console.log("CREATING FILE UPLOAD ACTIVITY", {
    orderId: activeOrder.id,
    userId: activeOrder.user_id,
    orderNumber: activeOrder.order_id
  });

  await createOrderActivity({
    orderId: activeOrder.id,
    activityType: "files_uploaded",
    title: "Design files uploaded",
    description:
      "Your completed design files are now available for download.",
    designStatus: "Ready",
    visibleToCustomer: true
  });

  uploadActivityCreated = true;

  console.log("FILE UPLOAD ACTIVITY CREATED");
} catch(activityError) {
  console.error(
    "FILE UPLOAD ACTIVITY FAILED:",
    activityError
  );

  throw new Error(
    `Files uploaded, but timeline failed: ${
      activityError.message || "Unknown timeline error"
    }`
  );
}

let readyEmailSent = false;

if(
  previousDesignStatus.toLowerCase() !== "ready"
){
  try{
    const emailResult = await sendOrderUpdateEmail(
      activeOrder.id,
      previousDesignStatus
    );

    readyEmailSent =
      emailResult.emailSent === true;
  }catch(emailError){
    console.error(
      "Files uploaded, but ready email failed:",
      emailError
    );
  }
}

        activeOrder.design_status = "Ready";
        activeOrder.progress = 100;
        activeOrder.customer_update = "Your completed design files are ready for download.";
        $("editDesign").value = "Ready";
        $("editProgress").value = "100";
        $("editCustomerUpdate").value = activeOrder.customer_update;

        await loadAdminDeliveryFiles();
        updateStats();
        renderOrders();
        if(uploadActivityCreated && readyEmailSent){
  showToast(
    "Files uploaded, timeline created and customer emailed"
  );
} else if(uploadActivityCreated){
  showToast(
    "Files uploaded and timeline created"
  );
} else if(readyEmailSent){
  showToast(
    "Files uploaded and customer emailed"
  );
} else {
  showToast("Files uploaded successfully");
}
      }catch(error){
        showToast(error.message || "File upload failed");
      }finally{
        button.disabled = false;
        button.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Upload';
      }
    }

    async function downloadAdminFile(fileId, files){
    const file = files.find(item => item.id === fileId);
    if(!file) return;

    const { data, error } = await supabase.storage
        .from("design-files")
        .createSignedUrl(file.storage_path, 120);

    if(error){
        showToast(error.message);
        return;
    }

    const canPreview =
        file.mime_type?.startsWith("image/") ||
        file.mime_type === "application/pdf" ||
        file.file_name?.toLowerCase().endsWith(".pdf");

    if(canPreview){
        $("filePreviewTitle").textContent =
            file.label || file.file_name;

        $("filePreviewFrame").src = data.signedUrl;
        $("filePreviewModal").style.display = "flex";
        document.body.style.overflow = "hidden";
        return;
    }

    window.open(data.signedUrl, "_blank", "noopener");
}

    async function deleteDeliveryFile(fileId, files){
      const file = files.find(item=>item.id===fileId);
      if(!file) return;
      if(!confirm(`Remove ${file.file_name}?`)) return;

      const { error: storageError } = await supabase.storage
        .from("design-files")
        .remove([file.storage_path]);
      if(storageError){ showToast(storageError.message); return; }

      const { error } = await supabase.from("order_files").delete().eq("id",file.id);
      if(error){ showToast(error.message); return; }
      await loadAdminDeliveryFiles();
      showToast("File removed");
    }

    async function createOrderActivity({
    orderId,
    activityType,
    title,
    description,
    designStatus,
    visibleToCustomer = true
}) {
    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
        console.error("Could not identify admin:", userError);
        throw new Error("Admin authentication could not be verified.");
    }

    const { error } = await supabase
        .from("order_activity")
        .insert({
            order_id: orderId,
            activity_type: activityType,
            title,
            description,
            design_status: designStatus,
            visible_to_customer: visibleToCustomer,
            created_by: user.id
        });

    if (error) {
        console.error("Order activity insert failed:", error);
        throw error;
    }

    console.log("Order activity created:", title);
}

   async function saveOrderChanges(){
  if(!activeOrder) return;

  const button = $("saveOrder");
  button.disabled = true;
  button.textContent = "Saving...";

  const previousDesignStatus =
    activeOrder.design_status || "Waiting";

  const updates = {
    payment_status: $("editPayment").value,
    design_status: $("editDesign").value,
    progress: Number($("editProgress").value),

    assigned_designer:
      $("editDesigner").value.trim() || null,

    estimated_completion_date:
      $("editDueDate").value || null,

    admin_notes:
      $("editAdminNotes").value.trim() || null,

    customer_update:
      $("editCustomerUpdate").value.trim() || null,

    updated_at: new Date().toISOString()
  };

  const designStatusChanged =
    previousDesignStatus.toLowerCase() !==
    updates.design_status.toLowerCase();

  try {
    const { error: updateError } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", activeOrder.id);

    if(updateError){
      throw updateError;
    }

    let activityCreated = false;
    let activityFailed = false;
    let emailSent = false;
    let emailFailed = false;

    // Create timeline activity before closing the modal
    if(designStatusChanged){
      button.textContent = "Creating timeline...";

      const newStatus = updates.design_status;
      const normalizedStatus = newStatus.toLowerCase();

      const activityDetails = {
        waiting: {
          title: "Order added to the waiting list",
          description:
            "Your order is currently waiting to be assigned and started."
        },

        designing: {
          title: "Design work has started",
          description:
            "Your designer is now working on your project."
        },

        review: {
          title: "Design under review",
          description:
            "Your design is currently being reviewed before delivery."
        },

        ready: {
          title: "Design files ready",
          description:
            "Your completed design files are ready for download."
        },

        completed: {
          title: "Order completed",
          description:
            "Your design order has been marked as completed."
        }
      };

      const details =
        activityDetails[normalizedStatus] || {
          title: `Order moved to ${newStatus}`,
          description:
            updates.customer_update ||
            `Your order status has changed to ${newStatus}.`
        };

      try {
        await createOrderActivity({
          orderId: activeOrder.id,
          activityType: "status_change",
          title: details.title,
          description:
            updates.customer_update?.trim() ||
            details.description,
          designStatus: newStatus,
          visibleToCustomer: true
        });

        activityCreated = true;
      } catch(activityError) {
        activityFailed = true;

        console.error(
          "Order saved, but timeline activity failed:",
          activityError
        );
      }
    }

    // Send status email
    if(designStatusChanged){
      button.textContent = "Sending email...";

      try {
        const result = await sendOrderUpdateEmail(
          activeOrder.id,
          previousDesignStatus
        );

        emailSent = result.emailSent === true;
      } catch(emailError) {
        emailFailed = true;

        console.error(
          "Order saved, but customer email failed:",
          emailError
        );
      }
    }

    Object.assign(activeOrder, updates);

    button.disabled = false;
    button.innerHTML =
      '<i class="fa-solid fa-floppy-disk"></i> Save Changes';

    closeModal();
    updateStats();
    renderOrders();

    if(activityFailed && emailFailed){
      showToast(
        "Order saved, but timeline and email failed"
      );
    } else if(activityFailed){
      showToast(
        emailSent
          ? "Customer emailed, but timeline failed"
          : "Order saved, but timeline failed"
      );
    } else if(emailFailed){
      showToast(
        activityCreated
          ? "Timeline created, but customer email failed"
          : "Order saved, but customer email failed"
      );
    } else if(activityCreated && emailSent){
      showToast(
        "Order updated, timeline created and customer emailed"
      );
    } else if(activityCreated){
      showToast(
        "Order updated and timeline created"
      );
    } else if(emailSent){
      showToast(
        "Order updated and customer emailed"
      );
    } else {
      showToast("Order updated successfully");
    }

  } catch(error) {
    console.error("Order update failed:", error);

    button.disabled = false;
    button.innerHTML =
      '<i class="fa-solid fa-floppy-disk"></i> Save Changes';

    showToast(error.message || "Unable to update order");
  }
}

    function closeModal(){
      $("orderModal").style.display = "none";
      document.body.style.overflow = "";
      activeOrder = null;
    }

    $("closeFilePreview").addEventListener("click", () => {
    $("filePreviewModal").style.display = "none";
    $("filePreviewFrame").src = "";

    if($("orderModal").style.display !== "flex"){
        document.body.style.overflow = "";
    }
});

    $("filePreviewModal").addEventListener("click", event => {
        if(event.target === $("filePreviewModal")){
            $("closeFilePreview").click();
        }
    });
    $("closeModal").addEventListener("click",closeModal);
    $("orderModal").addEventListener("click",e=>{if(e.target===$("orderModal")) closeModal()});
    ["searchInput","paymentFilter","designFilter"].forEach(id=>$("searchInput") && $(id).addEventListener(id==="searchInput"?"input":"change",renderOrders));
    $("signOutBtn").addEventListener("click",async()=>{await supabase.auth.signOut();window.location.href="index.html"});
    const downloadBtn = $("downloadOrdersReport");

if (downloadBtn) {
    downloadBtn.addEventListener(
        "click",
        generateOrdersPdf
    );
}

const downloadBeforeResetBtn =
    $("downloadReportBeforeReset");

if (downloadBeforeResetBtn) {
    downloadBeforeResetBtn.addEventListener(
        "click",
        generateOrdersPdf
    );
}

const openResetOrdersBtn =
    $("openResetOrders");

if (openResetOrdersBtn) {
    openResetOrdersBtn.addEventListener(
        "click",
        openResetOrdersModal
    );
}

const closeResetOrdersBtn =
    $("closeResetOrders");

if (closeResetOrdersBtn) {
    closeResetOrdersBtn.addEventListener(
        "click",
        closeResetOrdersModal
    );
}

const cancelResetOrdersBtn =
    $("cancelResetOrders");

if (cancelResetOrdersBtn) {
    cancelResetOrdersBtn.addEventListener(
        "click",
        closeResetOrdersModal
    );
}

const resetConfirmationInput =
    $("resetOrdersConfirmation");

if (resetConfirmationInput) {
    resetConfirmationInput.addEventListener(
        "input",
        updateResetButtonState
    );
}

const resetAgreementCheckbox =
    $("resetOrdersAgreement");

if (resetAgreementCheckbox) {
    resetAgreementCheckbox.addEventListener(
        "change",
        updateResetButtonState
    );
}

const confirmResetOrdersBtn =
    $("confirmResetOrders");

if (confirmResetOrdersBtn) {
    confirmResetOrdersBtn.addEventListener(
        "click",
        resetAllOrders
    );
}

const resetOrdersModal =
    $("resetOrdersModal");

if (resetOrdersModal) {
    resetOrdersModal.addEventListener(
        "click",
        event => {
            if (
                event.target ===
                resetOrdersModal
            ) {
                closeResetOrdersModal();
            }
        }
    );
}

    function toDateTimeLocal(value) {

    if (!value) {
        return "";
    }

    const date = new Date(value);

    const timezoneOffset =
        date.getTimezoneOffset() * 60000;

    return new Date(
        date.getTime() - timezoneOffset
    )
        .toISOString()
        .slice(0, 16);
}


function updateSaleStatus(campaign) {

    const badge = $("saleStatusBadge");

    if (!badge) {
        return;
    }

    const endTime = campaign?.ends_at
        ? new Date(campaign.ends_at).getTime()
        : 0;

    const active =
        campaign?.active === true &&
        endTime > Date.now();

    if (active) {

        badge.textContent = "Active";
        badge.style.color = "#166534";
        badge.style.background = "#dcfce7";

    } else if (
        campaign?.active === true &&
        endTime <= Date.now()
    ) {

        badge.textContent = "Expired";
        badge.style.color = "#991b1b";
        badge.style.background = "#fee2e2";

    } else {

        badge.textContent = "Inactive";
        badge.style.color = "#475569";
        badge.style.background = "#f1f5f9";

    }

    badge.style.padding = "8px 14px";
    badge.style.borderRadius = "30px";
    badge.style.fontWeight = "700";
}


async function loadSaleCampaign() {

    const {
        data,
        error
    } = await supabase
        .from("sale_campaign")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

    if (error) {

        alert(
            "Unable to load sale settings: " +
            error.message
        );

        return;
    }

    const campaign = data || {
        active: false,
        title: "",
        ends_at: null
    };

    $("saleActive").value =
        campaign.active === true
            ? "true"
            : "false";

    $("saleTitle").value =
        campaign.title || "";

    $("saleEndDate").value =
        toDateTimeLocal(
            campaign.ends_at
        );

    updateSaleStatus(campaign);
}


async function saveSaleCampaign(event) {

    event.preventDefault();

    const active =
        $("saleActive").value === "true";

    const title =
        $("saleTitle").value.trim();

    const endDateValue =
        $("saleEndDate").value;

    if (active && !title) {

        alert("Enter the sale title.");

        $("saleTitle").focus();

        return;
    }

    if (active && !endDateValue) {

        alert(
            "Select the sale ending date and time."
        );

        $("saleEndDate").focus();

        return;
    }

    let endsAt = null;

    if (endDateValue) {

        const selectedDate =
            new Date(endDateValue);

        if (
            Number.isNaN(
                selectedDate.getTime()
            )
        ) {

            alert("The sale ending date is invalid.");

            return;
        }

        if (
            active &&
            selectedDate.getTime() <= Date.now()
        ) {

            alert(
                "The sale ending date must be in the future."
            );

            return;
        }

        endsAt =
            selectedDate.toISOString();
    }

    const button =
        $("saveSaleBtn");

    button.disabled = true;

    button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Saving...
    `;

    const {
        data,
        error
    } = await supabase
        .from("sale_campaign")
        .upsert({
            id: 1,
            active,
            title,
            ends_at: endsAt,
            updated_at:
                new Date().toISOString()
        })
        .select()
        .single();

    button.disabled = false;

    button.innerHTML = `
        <i class="fa-solid fa-floppy-disk"></i>
        Save Sale
    `;

    if (error) {

        alert(
            "Unable to save sale: " +
            error.message
        );

        return;
    }

    updateSaleStatus(data);

    showToast(
        active
            ? "Sale activated successfully."
            : "Sale deactivated successfully."
    );
}

    const admin = await guardAdmin();

if (admin) {
    initialiseServiceManager();
    await loadOrders();
}

    const ordersNav = $("ordersNav");
    const servicesNav = $("servicesNav");
    const saleNav = $("saleNav");

    const ordersPanel = $("ordersPanel");
    const servicesPanel = $("servicesPanel");
    const salePanel = $("salePanel");

ordersNav.addEventListener("click", e => {

    e.preventDefault();

    ordersNav.classList.add("active");
    servicesNav.classList.remove("active");
    saleNav.classList.remove("active");

    ordersPanel.style.display = "";
    servicesPanel.style.display = "none";
    salePanel.style.display = "none";

});

servicesNav.addEventListener("click", async e => {

    e.preventDefault();

    ordersNav.classList.remove("active");
    saleNav.classList.remove("active");
    servicesNav.classList.add("active");

    ordersPanel.style.display = "none";
    salePanel.style.display = "none";
    servicesPanel.style.display = "";

    await loadServices();

});

saleNav.addEventListener("click", async e => {

    e.preventDefault();

    saleNav.classList.add("active");
    servicesNav.classList.remove("active");
    ordersNav.classList.remove("active");

    ordersPanel.style.display = "none";
    servicesPanel.style.display = "none";
    salePanel.style.display = "";

    await loadSaleCampaign();

});

const saleForm = $("saleForm");

if (saleForm) {
    saleForm.addEventListener(
        "submit",
        saveSaleCampaign
    );
}