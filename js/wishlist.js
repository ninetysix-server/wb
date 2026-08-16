let wishlistItems = [];

function loadWishlist() {
    try {
        const saved = localStorage.getItem('designWishlist');
        wishlistItems = saved ? JSON.parse(saved) : [];
        updateWishlistUI();
        updateWishlistCount();
    } catch (error) {
        console.error('Error loading wishlist:', error);
        wishlistItems = [];
    }
}

function saveWishlist() {
    try {
        localStorage.setItem('designWishlist', JSON.stringify(wishlistItems));
        updateWishlistUI();
        updateWishlistCount();
    } catch (error) {
        console.error('Error saving wishlist:', error);
    }
}

function updateWishlistCount() {
    const count = wishlistItems.length;
    const counter = document.getElementById('wishlistCounter');
    const whatsappBtn = document.getElementById('whatsappBtn');
    
    if (counter) {
        if (count > 0) {
            counter.textContent = count;
            counter.style.display = 'flex';
        } else {
            counter.textContent = '0';
            counter.style.display = 'none';
        }
    }
    
    if (whatsappBtn) {
        if (count > 0) {
            const message = generateWhatsAppMessage();
            whatsappBtn.href = `https://wa.me/27817925033?text=${encodeURIComponent(message)}`;
            whatsappBtn.title = `Submit ${count} design${count > 1 ? 's' : ''} via WhatsApp`;
        } else {
            whatsappBtn.href = 'https://wa.me/27817925033';
            whatsappBtn.title = 'Chat on WhatsApp';
        }
    }
}

function generateWhatsAppMessage() {
    if (wishlistItems.length === 0) return '';
    
    let message = "Hi! I'm interested in these designs:\n\n";
    wishlistItems.forEach((item, index) => {
        message += `${index + 1}. ${item.title}\n`;
        message += `   Tier: ${item.tier}\n`;
        message += `   Price: ${item.price}\n`;
        if (item.description) {
            message += `   Description: ${item.description}\n`;
        }
        message += `\n`;
    });
    message += `\nTotal Items: ${wishlistItems.length}`;
    return message;
}

window.toggleWishlist = function(serviceId) {
    const service = window.allServices?.find(s => s.id === serviceId);
    if (!service) {
        console.error('Service not found:', serviceId);
        return;
    }
    
    const tierData = service.tiers?.find(t => t.name.toLowerCase() === (window.currentTier || 'starter').toLowerCase()) || service.tiers?.[0];
    const tierName = tierData?.name || 'Starter';
    const price = tierData?.price || 'Contact';
    const description = tierData?.description || service.description || '';
    
    const existingIndex = wishlistItems.findIndex(item => item.id === serviceId);
    
    if (existingIndex > -1) {
        wishlistItems.splice(existingIndex, 1);
        saveWishlist();
        showToast(`${service.title} removed from wishlist`, 'info');
        updateWishlistIcon(serviceId, false);
    } else {
        const wishlistItem = {
            id: serviceId,
            title: service.title,
            tier: tierName,
            price: price,
            description: description,
            category: service.category || 'Design',
            addedAt: new Date().toISOString()
        };
        wishlistItems.push(wishlistItem);
        saveWishlist();
        showToast(`${service.title} added to wishlist ❤️`, 'success');
        updateWishlistIcon(serviceId, true);
    }
    
    updateWishlistUI();
};

function updateWishlistIcon(serviceId, isInWishlist) {
    const buttons = document.querySelectorAll(`.wishlist-btn[data-service-id="${serviceId}"]`);
    buttons.forEach(btn => {
        const icon = btn.querySelector('i');
        if (isInWishlist) {
            icon.className = 'fas fa-heart';
            btn.style.color = '#ef4444';
            btn.title = 'Remove from wishlist';
        } else {
            icon.className = 'far fa-heart';
            btn.style.color = '#6b6b6b';
            btn.title = 'Add to wishlist';
        }
    });
}

function updateAllWishlistIcons() {
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        const serviceId = btn.dataset.serviceId;
        if (serviceId) {
            const isInWishlist = wishlistItems.some(item => item.id === serviceId);
            const icon = btn.querySelector('i');
            if (isInWishlist) {
                icon.className = 'fas fa-heart';
                btn.style.color = '#ef4444';
                btn.title = 'Remove from wishlist';
            } else {
                icon.className = 'far fa-heart';
                btn.style.color = '#6b6b6b';
                btn.title = 'Add to wishlist';
            }
        }
    });
}

function updateWishlistUI() {
    const emptyState = document.getElementById('wishlistEmptyState');
    const itemsContainer = document.getElementById('wishlistItemsContainer');
    const itemsList = document.getElementById('wishlistItemsList');
    const submitBtn = document.getElementById('submitWishlist');
    const footer = document.getElementById('wishlistFooter');
    
    if (wishlistItems.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (itemsContainer) itemsContainer.style.display = 'none';
        if (footer) footer.style.display = 'none';
        if (submitBtn) submitBtn.disabled = true;
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    if (itemsContainer) itemsContainer.style.display = 'block';
    if (footer) footer.style.display = 'block';
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fab fa-whatsapp"></i> Submit ${wishlistItems.length} Design${wishlistItems.length > 1 ? 's' : ''} via WhatsApp`;
    }
    
    if (itemsList) {
        itemsList.innerHTML = wishlistItems.map((item, index) => `
            <li class="wishlist-item" data-id="${item.id}">
                <div class="wishlist-item-header">
                    <div>
                        <div class="wishlist-item-title">${item.title}</div>
                        <div class="wishlist-item-category">${item.category || 'Design'}</div>
                    </div>
                    <span class="wishlist-item-tier">${item.tier}</span>
                </div>
                <div class="wishlist-item-details">
                    <div class="wishlist-detail-group">
                        <div class="wishlist-detail-label">Price</div>
                        <div class="wishlist-detail-value wishlist-item-price">${item.price}</div>
                    </div>
                    <div class="wishlist-detail-group">
                        <div class="wishlist-detail-label">Added</div>
                        <div class="wishlist-detail-value">${new Date(item.addedAt).toLocaleDateString()}</div>
                    </div>
                </div>
                ${item.description ? `
                    <div class="wishlist-item-description">${item.description}</div>
                ` : ''}
                <div class="wishlist-item-footer">
                    <button class="wishlist-item-remove" onclick="removeFromWishlist('${item.id}')">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </li>
        `).join('');
    }
}

window.removeFromWishlist = function(serviceId) {
    const index = wishlistItems.findIndex(item => item.id === serviceId);
    if (index > -1) {
        const removed = wishlistItems[index];
        wishlistItems.splice(index, 1);
        saveWishlist();
        updateWishlistIcon(serviceId, false);
        showToast(`${removed.title} removed from wishlist`, 'info');
    }
};

function showToast(message, type = 'success') {
    document.querySelectorAll('.custom-toast, .toast-notification').forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    
    const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
    
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%) translateY(100px)',
        padding: '14px 32px',
        background: bgColor,
        color: 'white',
        borderRadius: '60px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        zIndex: '9999',
        boxShadow: '0 5px 20px rgba(0,0,0,0.15)',
        opacity: '0',
        transition: 'all 0.4s ease',
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.9rem',
        fontWeight: '500',
        maxWidth: '400px'
    });
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
        toast.style.opacity = '1';
    });
    
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(100px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

window.openWishlistModal = function() {
    const modal = document.getElementById('wishlistModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        updateWishlistUI();
    }
};

window.closeWishlistModal = function() {
    const modal = document.getElementById('wishlistModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
};

window.submitWishlist = function() {
    if (wishlistItems.length === 0) {
        showToast('Your wishlist is empty!', 'error');
        return;
    }
    
    const message = generateWhatsAppMessage();
    const phoneNumber = '27817925033';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    showToast(`Opening WhatsApp with ${wishlistItems.length} design${wishlistItems.length > 1 ? 's' : ''}`, 'success');
};

document.addEventListener('DOMContentLoaded', function() {
    loadWishlist();
    
    document.getElementById('mobileWishlistBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        openWishlistModal();
    });
    
    document.getElementById('openWishlistModal')?.addEventListener('click', function(e) {
        e.preventDefault();
        openWishlistModal();
    });
    
    document.getElementById('closeWishlist')?.addEventListener('click', closeWishlistModal);
    document.getElementById('wishlistModal')?.addEventListener('click', function(e) {
        if (e.target === this) closeWishlistModal();
    });
    
    document.getElementById('wishlistBrowseDesigns')?.addEventListener('click', function() {
        closeWishlistModal();
        document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
    });
    
    document.getElementById('continueBrowsing')?.addEventListener('click', function() {
        closeWishlistModal();
        document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
    });
    
    document.getElementById('submitWishlist')?.addEventListener('click', submitWishlist);
    
    document.addEventListener('cartUpdated', function() {
        updateAllWishlistIcons();
    });
});

window.wishlistItems = wishlistItems;
window.loadWishlist = loadWishlist;
window.saveWishlist = saveWishlist;
window.updateWishlistUI = updateWishlistUI;
window.updateAllWishlistIcons = updateAllWishlistIcons;
window.openWishlistModal = openWishlistModal;
window.closeWishlistModal = closeWishlistModal;
window.submitWishlist = submitWishlist;
window.showToast = showToast;

console.log('✅ Wishlist module loaded');