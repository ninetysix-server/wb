document.addEventListener('DOMContentLoaded', function() {
    const advertiserEmbed = document.getElementById('advertiserEmbed');
    const advertiserCloseBtn = document.getElementById('advertiserCloseBtn');
    
    const advertiserLink = document.querySelector('.show-advertiser-portal');
    if (advertiserLink) {
        advertiserLink.addEventListener('click', function(e) {
            e.preventDefault();
            advertiserEmbed.classList.add('active');
            document.getElementById('overlay').classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    advertiserCloseBtn.addEventListener('click', function() {
        advertiserEmbed.classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
        document.body.style.overflow = '';
    });
});