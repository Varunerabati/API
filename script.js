const ACCESS_KEY = "fZSsezogRKKawBbWAQN9JcFyKJWprMklt-6bGfANHu8";
const API_BASE = "https://api.unsplash.com/search/photos";

const timeCategories = [
  {
    id: "morning",
    startHour: 5,
    endHour: 11,
    greeting: "Good Morning",
    query: "nature sunrise coffee",
  },
  {
    id: "afternoon",
    startHour: 11,
    endHour: 17,
    greeting: "Good Afternoon",
    query: "city work technology",
  },
  {
    id: "evening",
    startHour: 17,
    endHour: 20,
    greeting: "Good Evening",
    query: "sunset travel street",
  },
  {
    id: "night",
    startHour: 20,
    endHour: 5,
    greeting: "Good Night",
    query: "night sky moon calm stars",
  },
];

let greetingEl;
let galleryEl;
let statusEl;
let refreshBtn;
let cardTemplate;
let imageModal;
let modalTitle;
let modalImage;
let modalCredit;
let unsplashLink;
let downloadBtn;
let closeModalBtn;
let currentImageData = null;

function getTimeCategory(date = new Date()) {
  const hour = date.getHours();

  return (
    timeCategories.find(({ startHour, endHour }) => {
      if (startHour < endHour) {
        return hour >= startHour && hour < endHour;
      }
      return hour >= startHour || hour < endHour;
    }) || timeCategories[0]
  );
}

async function fetchImages(query) {
  const params = new URLSearchParams({
    query,
    per_page: "5",
    client_id: ACCESS_KEY,
  });

  const response = await fetch(`${API_BASE}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Unsplash request failed (${response.status})`);
  }

  const data = await response.json();
  return data.results || [];
}

function openImageModal(image) {
  currentImageData = image;

  modalImage.src = image.urls.regular;
  modalImage.alt = image.alt_description || image.description || "Unsplash photo";
  modalTitle.textContent = image.alt_description || image.description || "Untitled shot";
  modalCredit.textContent = `Photo by ${image.user?.name || "Unknown"} on Unsplash`;
  unsplashLink.href = image.links?.html || "https://unsplash.com";

  imageModal.showModal();
}

function closeImageModal() {
  if (imageModal.open) {
    imageModal.close();
  }
}

function renderImages(images) {
  galleryEl.innerHTML = "";

  if (!images.length) {
    statusEl.textContent = "No images found for this time period. Try refreshing.";
    return;
  }

  const fragment = document.createDocumentFragment();

  images.forEach((image) => {
    const card = cardTemplate.content.firstElementChild.cloneNode(true);
    const img = card.querySelector(".card-image");
    const title = card.querySelector(".card-title");
    const credit = card.querySelector(".card-credit");
    const cardAction = card.querySelector(".card-action");

    img.src = image.urls.small;
    img.alt = image.alt_description || image.description || "Unsplash photo";
    title.textContent = image.alt_description || image.description || "Untitled shot";
    credit.textContent = `Photo by ${image.user?.name || "Unknown"}`;

    cardAction.addEventListener("click", () => openImageModal(image));
    fragment.appendChild(card);
  });

  galleryEl.appendChild(fragment);
}

async function loadExperience() {
  const category = getTimeCategory();

  document.body.classList.remove("morning", "afternoon", "evening", "night");
  document.body.classList.add(category.id);

  greetingEl.textContent = `${category.greeting} · Enjoy ${category.id} vibes`;
  statusEl.textContent = `Loading ${category.id} photos...`;
  refreshBtn.disabled = true;

  try {
    const images = await fetchImages(category.query);
    renderImages(images);
    statusEl.textContent = `Showing ${images.length} curated ${category.id} photo${
      images.length === 1 ? "" : "s"
    } from Unsplash.`;
  } catch (error) {
    console.error(error);
    statusEl.textContent = "Could not load images right now. Please try again in a moment.";
    galleryEl.innerHTML = "";
  } finally {
    refreshBtn.disabled = false;
  }
}

function downloadImage() {
  if (!currentImageData) {
    return;
  }

  const downloadUrl = currentImageData.links?.download || currentImageData.urls?.full;

  if (!downloadUrl) {
    return;
  }

  const tempLink = document.createElement("a");
  tempLink.href = downloadUrl;
  tempLink.download = `unsplash-${currentImageData.id}.jpg`;
  tempLink.target = "_blank";
  tempLink.rel = "noopener noreferrer";
  document.body.appendChild(tempLink);
  tempLink.click();
  tempLink.remove();

  const originalLabel = downloadBtn.textContent;
  downloadBtn.textContent = "Downloaded ✓";
  downloadBtn.disabled = true;

  setTimeout(() => {
    downloadBtn.textContent = originalLabel;
    downloadBtn.disabled = false;
  }, 2000);
}

function initApp() {
  greetingEl = document.getElementById("greeting");
  galleryEl = document.getElementById("gallery");
  statusEl = document.getElementById("status");
  refreshBtn = document.getElementById("refreshBtn");
  cardTemplate = document.getElementById("imageCardTemplate");
  imageModal = document.getElementById("image-modal");
  modalTitle = document.getElementById("modal-title");
  modalImage = document.getElementById("modal-image");
  modalCredit = document.getElementById("modal-credit");
  unsplashLink = document.getElementById("unsplash-link");
  downloadBtn = document.getElementById("download-btn");
  closeModalBtn = document.getElementById("close-modal-btn");

  refreshBtn.addEventListener("click", loadExperience);
  downloadBtn.addEventListener("click", downloadImage);
  closeModalBtn.addEventListener("click", closeImageModal);
  imageModal.addEventListener("click", (event) => {
    if (event.target === imageModal) {
      closeImageModal();
    }
  });

  loadExperience();
}

window.addEventListener("DOMContentLoaded", initApp);
