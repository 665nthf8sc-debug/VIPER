// Swear word filter
const badWords = [
  "fuck", "shit", "bitch", "asshole", "cunt", "dick", "piss", "bastard",
  "slut", "whore", "nigger", "faggot", "retard", "cocksucker", "motherfucker",
  "fucking", "shitty", "bullshit", "damn", "crap"
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

// Add swear check before submitting any form
document.querySelectorAll("form").forEach(form => {
  form.addEventListener("submit", function(e) {
    if (checkFormForSwearing(this)) {
      e.preventDefault();
      alert("⚠️ Please keep it clean.\nSwearing is not allowed on this site.");
    }
  });
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
