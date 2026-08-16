import {
  supabase,
  getCurrentUser,
  createOzowPayment,
  checkPaymentStatus
} from './supabase.js';

let orderId = null;
let paymentInterval = null;
let currentOrder = null;

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  orderId = urlParams.get('orderId');

  if (!orderId) {
    showError('No order ID was found. Please return to your orders and try again.');
    disablePaymentButton();
    return;
  }

  document
    .getElementById('payNowBtn')
    ?.addEventListener('click', initiateOzowPayment);

  document
    .getElementById('cancelPaymentBtn')
    ?.addEventListener('click', cancelPayment);

  initializePaymentPage();
});


async function initializePaymentPage() {
  const loaded = await loadOrderDetails(orderId);

  if (!loaded) {
    return;
  }

  await checkExistingPayment();
}

async function loadOrderDetails(selectedOrderId) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      showError('Please sign in to continue with payment.');
      disablePaymentButton();
      return false;
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', selectedOrderId)
      .eq('user_id', user.id)
      .single();

    if (error || !order) {
      console.error('Order loading error:', error);
      showError('Order not found. Please return to your orders and try again.');
      disablePaymentButton();
      return false;
    }

    currentOrder = order;
    displayOrderSummary(order);

    return true;
  } catch (error) {
    console.error('Error loading order:', error);
    showError('Failed to load the order details.');
    disablePaymentButton();

    return false;
  }
}


function displayOrderSummary(order) {
  const total = getOrderTotal(order);
  const cart = Array.isArray(order.cart) ? order.cart : [];
  const itemCount = cart.length;

  const orderTotalElement = document.getElementById('orderTotal');
  const orderItemsElement = document.getElementById('orderItems');
  const orderIdElement = document.getElementById('orderId');

  if (orderTotalElement) {
    orderTotalElement.textContent = formatCurrency(total);
  }

  if (orderItemsElement) {
    orderItemsElement.textContent =
      `${itemCount} item${itemCount === 1 ? '' : 's'}`;
  }

  if (orderIdElement) {
    orderIdElement.textContent = order.order_id;
  }

  const itemsList = document.getElementById('paymentItemsList');

  if (!itemsList) {
    return;
  }

  if (cart.length === 0) {
    itemsList.innerHTML = `
      <li class="payment-item">
        <span class="payment-item-name">No order items found</span>
      </li>
    `;
    return;
  }

  itemsList.innerHTML = cart
    .map((item) => {
      const quantity = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      const itemTotal = price * quantity;

      return `
        <li class="payment-item">
          <span class="payment-item-name">
            ${escapeHtml(item.serviceTitle || 'Design Service')}
          </span>

          <span class="payment-item-details">
            ${escapeHtml(item.tierName || 'Starter')} × ${quantity}
          </span>

          <span class="payment-item-price">
            ${formatCurrency(itemTotal)}
          </span>
        </li>
      `;
    })
    .join('');
}

async function initiateOzowPayment() {
  clearMessages();
  setPaymentLoading(true);

  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error('Please sign in to continue with payment.');
    }

    if (!currentOrder) {
      throw new Error('Order details have not been loaded.');
    }

    const total = getOrderTotal(currentOrder);

    if (!Number.isFinite(total) || total <= 0) {
      throw new Error('The order has an invalid payment amount.');
    }

    if (!user.email) {
      throw new Error('Your account does not have an email address.');
    }

    const description = `Design Services - ${currentOrder.order_id}`;

    const paymentData = await createOzowPayment(
      currentOrder.order_id,
      total,
      description,
      user.email,
      currentOrder.client_id
    );

    if (!paymentData?.success) {
      throw new Error('The payment request could not be created.');
    }

    if (!paymentData.paymentUrl) {
      throw new Error('The Ozow payment URL is missing.');
    }

    if (!paymentData.params || typeof paymentData.params !== 'object') {
      throw new Error('The Ozow payment fields are missing.');
    }

    if (!paymentData.params.HashCheck) {
      throw new Error('The Ozow HashCheck is missing.');
    }

    submitOzowForm(
      paymentData.paymentUrl,
      paymentData.params
    );

    startPaymentPolling(currentOrder.order_id);
  } catch (error) {
    console.error('Payment initiation error:', error);

    showError(
      error.message ||
      'Failed to initiate payment. Please try again.'
    );

    setPaymentLoading(false);
  }
}


function submitOzowForm(paymentUrl, params) {
  const form = document.createElement('form');

  form.method = 'POST';
  form.action = paymentUrl;
  form.style.display = 'none';

  form.target = '_self';

  for (const [fieldName, fieldValue] of Object.entries(params)) {
    if (
      fieldValue === undefined ||
      fieldValue === null
    ) {
      continue;
    }

    const input = document.createElement('input');

    input.type = 'hidden';
    input.name = fieldName;
    input.value = String(fieldValue);

    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

function startPaymentPolling(selectedOrderId) {
  stopPaymentPolling();

  let attempts = 0;
  const maximumAttempts = 30;

  paymentInterval = window.setInterval(async () => {
    attempts += 1;

    try {
      const transaction = await checkPaymentStatus(selectedOrderId);

      if (transaction) {
        const status = normalizePaymentStatus(transaction.status);

        if (isSuccessfulStatus(status)) {
          stopPaymentPolling();

          showSuccess(
            'Payment completed successfully. Redirecting...'
          );

          window.setTimeout(() => {
            window.location.href =
              `/payment-success.html?orderId=${encodeURIComponent(selectedOrderId)}`;
          }, 1500);

          return;
        }

        if (isFailedStatus(status)) {
          stopPaymentPolling();

          showError(
            'Payment failed or was cancelled. You can try again.'
          );

          setPaymentLoading(false);
          return;
        }
      }

      if (attempts >= maximumAttempts) {
        stopPaymentPolling();
        showWaitingMessage();
      }
    } catch (error) {
      console.error('Payment status polling error:', error);

      if (attempts >= maximumAttempts) {
        stopPaymentPolling();
        showWaitingMessage();
      }
    }
  }, 10000);
}


function stopPaymentPolling() {
  if (paymentInterval) {
    window.clearInterval(paymentInterval);
    paymentInterval = null;
  }
}


async function checkExistingPayment() {
  try {
    const transaction = await checkPaymentStatus(orderId);

    if (!transaction) {
      return;
    }

    const status = normalizePaymentStatus(transaction.status);

    if (isSuccessfulStatus(status)) {
      showSuccess(
        'This order has already been paid. Redirecting...'
      );

      disablePaymentButton();

      window.setTimeout(() => {
        window.location.href =
          `/payment-success.html?orderId=${encodeURIComponent(orderId)}`;
      }, 1500);

      return;
    }

    if (isFailedStatus(status)) {
      showError(
        'The previous payment attempt failed or was cancelled. You can try again.'
      );
    }
  } catch (error) {
    console.error('Error checking existing payment:', error);
  }
}

function cancelPayment() {
  const confirmed = window.confirm(
    'Are you sure you want to cancel this payment?'
  );

  if (!confirmed) {
    return;
  }

  stopPaymentPolling();
  window.location.href = '/portal.html';
}

function setPaymentLoading(isLoading) {
  const button = document.getElementById('payNowBtn');
  const loading = document.getElementById('paymentLoading');

  if (button) {
    button.disabled = isLoading;
  }

  if (loading) {
    loading.style.display = isLoading ? 'block' : 'none';
  }
}


function disablePaymentButton() {
  const button = document.getElementById('payNowBtn');

  if (button) {
    button.disabled = true;
  }
}


function clearMessages() {
  const errorDiv = document.getElementById('paymentError');
  const successDiv = document.getElementById('paymentSuccess');

  if (errorDiv) {
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
  }

  if (successDiv) {
    successDiv.textContent = '';
    successDiv.style.display = 'none';
  }
}


function showError(message) {
  const errorDiv = document.getElementById('paymentError');

  if (!errorDiv) {
    window.alert(message);
    return;
  }

  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  errorDiv.className = 'payment-message error';
}


function showSuccess(message) {
  const successDiv = document.getElementById('paymentSuccess');

  if (!successDiv) {
    return;
  }

  successDiv.textContent = message;
  successDiv.style.display = 'block';
  successDiv.className = 'payment-message success';
}


function showWaitingMessage() {
  const loading = document.getElementById('paymentLoading');

  if (!loading) {
    setPaymentLoading(false);
    return;
  }

  loading.style.display = 'block';
  loading.innerHTML = `
    <p>Waiting for payment confirmation...</p>

    <p style="font-size: 12px; color: #64748b; margin-top: 8px;">
      If you completed the payment, check your order status in the customer portal.
      <br>
      <a href="/portal.html" style="color: #009B5B;">
        View my orders
      </a>
    </p>
  `;
}

function getOrderTotal(order) {
  const value =
    order?.totals?.total ??
    order?.totals?.grandTotal ??
    order?.total ??
    0;

  return Number(value);
}


function formatCurrency(value) {
  const amount = Number(value) || 0;
  return `R${amount.toFixed(2)}`;
}


function normalizePaymentStatus(status) {
  return String(status || '')
    .trim()
    .toLowerCase();
}


function isSuccessfulStatus(status) {
  return [
    'complete',
    'completed',
    'success',
    'successful',
    'paid'
  ].includes(status);
}


function isFailedStatus(status) {
  return [
    'failed',
    'failure',
    'cancelled',
    'canceled',
    'error',
    'declined',
    'abandoned'
  ].includes(status);
}


function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


window.addEventListener('beforeunload', stopPaymentPolling);