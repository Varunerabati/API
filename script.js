const ACCESS_KEY = "fZSsezogRKKawBbWAQN9JcFyKJWprMklt-6bGfANHu8";
const API_BASE = "https://api.unsplash.com/search/photos";

const greetingEl = document.getElementById("greeting");
const galleryEl = document.getElementById("gallery");
const statusEl = document.getElementById("status");
const refreshBtn = document.getElementById("refreshBtn");
const cardTemplate = document.getElementById("imageCardTemplate");

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

    img.src = image.urls.small;
    img.alt = image.alt_description || image.description || "Unsplash photo";
    title.textContent = image.alt_description || image.description || "Untitled shot";
    credit.textContent = `Photo by ${image.user?.name || "Unknown"}`;

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

refreshBtn.addEventListener("click", loadExperience);
window.addEventListener("DOMContentLoaded", loadExperience);
