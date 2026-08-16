
document.addEventListener('DOMContentLoaded', function() {
    const bottomAdvert = document.getElementById('bottomOzowAdvert');
    const closeBottomBtn = document.getElementById('closeBottomOzow');
    
    const hasBeenShown = sessionStorage.getItem('ozow_advert_shown');
    
    if (!hasBeenShown) {
        setTimeout(() => {
            bottomAdvert.classList.add('active');
            console.log('✅ Bottom Ozow advert shown (ONCE per session)');
            
            sessionStorage.setItem('ozow_advert_shown', 'true');
            
            setTimeout(() => {
                if (bottomAdvert.classList.contains('active')) {
                    bottomAdvert.classList.remove('active');
                    console.log('✅ Bottom Ozow advert auto-hidden');
                }
            }, 10000);
            
        }, 35000);
    }
    
    closeBottomBtn.addEventListener('click', () => {
        bottomAdvert.classList.remove('active');
        console.log('✅ Bottom Ozow advert closed by user');
    });
});