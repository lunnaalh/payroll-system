// SLIDESHOW
const slides = document.querySelectorAll(".about-slideshow .slide");
const totalSlides = slides.length;
let currentSlide = 0;

const nextBtn = document.querySelector(".about-slideshow .next");
const prevBtn = document.querySelector(".about-slideshow .prev");

if (nextBtn && prevBtn && slides.length > 0) {
  nextBtn.addEventListener("click", () => {
    slides[currentSlide].classList.remove("active");
    currentSlide = (currentSlide + 1) % totalSlides;
    slides[currentSlide].classList.add("active");
  });

  prevBtn.addEventListener("click", () => {
    slides[currentSlide].classList.remove("active");
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    slides[currentSlide].classList.add("active");
  });
}
// MOBILE MENU
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");
const closeBtn = document.querySelector(".close-btn");

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("active");
  });
}

if (closeBtn && mobileMenu) {
  closeBtn.addEventListener("click", () => {
    mobileMenu.classList.remove("active");
  });
}

// Close menu when a link is clicked
const menuLinks = mobileMenu?.querySelectorAll("a");
if (menuLinks) {
  menuLinks.forEach(link => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("active");
    });
  });
}

// Close menu when clicking outside
document.addEventListener("click", (e) => {
  if (mobileMenu?.classList.contains("active") &&
      !mobileMenu.contains(e.target) &&
      !menuBtn?.contains(e.target)) {
    mobileMenu.classList.remove("active");
  }
});

// MARINE MODAL
const marineModal = document.getElementById("marineModal");
const marineModalImg = document.getElementById("marineModalImg");
const marineModalTitle = document.getElementById("marineModalTitle");
const marineModalDesc = document.getElementById("marineModalDesc");
const marineCloseBtn = document.querySelector(".marine-close");

if (marineModal) {
  // Open modal on marine item click
  document.querySelectorAll(".marine-item").forEach((item) => {
    item.addEventListener("click", () => {
      marineModalImg.src = item.getAttribute("data-img");
      marineModalTitle.textContent = item.getAttribute("data-title");
      marineModalDesc.textContent = item.getAttribute("data-desc");
      marineModal.style.display = "flex";
    });
  });

  // Close modal on close button click
  if (marineCloseBtn) {
    marineCloseBtn.addEventListener("click", () => {
      marineModal.style.display = "none";
    });
  }

  // Close modal on background click
  marineModal.addEventListener("click", (e) => {
    if (e.target === marineModal) {
      marineModal.style.display = "none";
    }
  });
}
