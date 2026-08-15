// Basic swear word filter
const badWords = [
  "fuck", "shit", "bitch", "asshole", "cunt", "dick", "piss", "bastard",
  "slut", "whore", "nigger", "faggot", "retard", "cocksucker", "motherfucker",
  "fucking", "shitty", "asshole", "bullshit", "damn", "crap"
];

function containsBadWords(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return badWords.some(word => lower.includes(word));
}

function checkFormForSwearing(form) {
  const inputs = form.querySelectorAll("input, textarea");
  for (let input of inputs) {
    if (containsBadWords(input.value)) {
      return true;
    }
  }
  return false;
}

// Trade with me form
document.getElementById('trade-form').addEventListener('submit', function(e) {
  e.preventDefault();

  if (checkFormForSwearing(this)) {
    alert("⚠️ Please keep it clean.\nSwearing is not allowed on this site.");
    return;
  }

  alert('✅ Trade request submitted!\n\nI will reply to your email soon.');
  this.reset();
});

// Community trades form
document.getElementById('community-form').addEventListener('submit', function(e) {
  e.preventDefault();

  if (checkFormForSwearing(this)) {
    alert("⚠️ Please keep it clean.\nSwearing is not allowed on this site.");
    return;
  }

  alert('✅ Your community trade has been submitted!\n\nIt will appear on the board after review.');
  this.reset();
});

// Video collab form
document.getElementById('video-form').addEventListener('submit', function(e) {
  e.preventDefault();

  if (checkFormForSwearing(this)) {
    alert("⚠️ Please keep it clean.\nSwearing is not allowed on this site.");
    return;
  }

  alert('✅ Video request submitted!\n\nThanks for wanting to collab!');
  this.reset();
});

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});
