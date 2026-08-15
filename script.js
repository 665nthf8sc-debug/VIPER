document.getElementById('trade-form').addEventListener('submit', function(e) {
  e.preventDefault();
  alert('✅ Trade request submitted!\n\nVIPER3384 will see your request. Make sure your contact info is correct.');
  this.reset();
});

document.getElementById('video-form').addEventListener('submit', function(e) {
  e.preventDefault();
  alert('✅ Video request submitted!\n\nThanks for wanting to collab. VIPER3384 will review your request.');
  this.reset();
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});
