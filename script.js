// Configuration
const Unsplash_Access_Key = "fZSsezogRKKawBbWAQN9JcFyKJWprMklt-6bGfANHu8";
const ACCESS_KEY = Unsplash_Access_Key;

// API Configuration
const API_BASE = "https://api.unsplash.com/search/photos";

// Category to keyword mapping
const categoryKeywords = {
  // Time-based categories
  morning: "sunrise coffee",
  afternoon: "afternoon daylight",
  evening: "sunset evening",
  night: "night sky",
  midnight: "midnight dark",
  // Nature / Space
  sun: "sun",
  moon: "moon",
  stars: "stars galaxy",
  // Objects / Lifestyle
  bikes: "bikes",
  cars: "cars",
  technology: "technology",
  city: "city",
  nature: "nature"
};

// DOM Elements
const categoryButtons = document.querySelectorAll('.category-btn');
const gallery = document.getElementById('gallery');
const loading = document.getElementById('loading');
const errorEl = document.getElementById('error');
const modal = document.getElementById('modal');
const modalOverlay = document.querySelector('.modal-overlay');
const modalClose = document.querySelector('.modal-close');
const modalImage = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalDescription = document.getElementById('modal-description');
const modalPhotographerLink = document.getElementById('modal-photographer-link');
const downloadBtn = document.getElementById('download-btn');
const saveBtn = document.getElementById('save-btn');
const shareBtn = document.getElementById('share-btn');

// Current state
let currentImages = [];
let currentImageData = null;

// Initialize: Set first category as active and load images
function init() {
  if (categoryButtons.length > 0) {
    categoryButtons[0].classList.add('active');
    const firstCategory = categoryButtons[0].dataset.category;
    loadCategoryImages(firstCategory);
    scheduleNextRotation(); // Schedule auto-reload at next 2-hour boundary
  }
}

// Get 2-hour time slot page number (1-10)
// Splits the day into 12 slots (24 hours ÷ 2 hours)
// Each slot maps to a different Unsplash page for rotation
function getTwoHourPage() {
  const now = new Date();
  const hours = now.getHours();       // 0–23
  const slot = Math.floor(hours / 2); // 0–11
  return (slot % 10) + 1;             // Pages 1–10 (cycles through)
}

// Fetch images from Unsplash API with 2-hour rotation
async function fetchImages(query) {
  const page = getTwoHourPage(); // 👈 rotation logic based on 2-hour slots
  
  // Debug log (can be removed in production)
  console.log("2-hour page:", page, "| Current time:", new Date().toLocaleTimeString());

  const params = new URLSearchParams({
    query: query,
    per_page: '5',
    page: page, // 👈 Different page = different images
    client_id: ACCESS_KEY
  });

  const response = await fetch(`${API_BASE}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.results || [];
}

// Schedule automatic image refresh at the next 2-hour boundary
// This makes the app feel live without polling or spam
function scheduleNextRotation() {
  const now = new Date();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  // Calculate minutes until next 2-hour boundary
  const minutesLeft = 120 - ((minutes % 120) + seconds / 60);
  const msLeft = minutesLeft * 60 * 1000;

  setTimeout(() => {
    const activeBtn = document.querySelector('.category-btn.active');
    if (activeBtn) {
      // Reload images for currently active category
      loadCategoryImages(activeBtn.dataset.category);
    }
    // Reschedule for the next 2-hour boundary
    scheduleNextRotation();
  }, msLeft);
}

// Show loading state
function showLoading() {
  loading.setAttribute('aria-hidden', 'false');
  errorEl.setAttribute('aria-hidden', 'true');
  gallery.innerHTML = '';
}

// Hide loading state
function hideLoading() {
  loading.setAttribute('aria-hidden', 'true');
}

// Show error message
function showError(message) {
  errorEl.textContent = message;
  errorEl.setAttribute('aria-hidden', 'false');
  hideLoading();
  gallery.innerHTML = '';
}

// Render images in grid
function renderImages(images) {
  hideLoading();
  
  if (!images || images.length === 0) {
    gallery.innerHTML =
      '<p class="col-span-full text-center text-gray-500 dark:text-gray-400 py-10">No images found for this category. Try another one!</p>';
    return;
  }

  currentImages = images;
  gallery.innerHTML = '';

  images.forEach((image, index) => {
    const item = document.createElement('div');
    item.className =
      'gallery-item group cursor-pointer overflow-hidden rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm ring-1 ring-black/5 dark:ring-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `View image: ${image.alt_description || 'Untitled'}`);

    const img = document.createElement('img');
    img.src = image.urls.small;
    img.alt = image.alt_description || image.description || 'Unsplash photo';
    img.loading = 'lazy';
    img.className = 'w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105';

    item.appendChild(img);

    // Click handler
    item.addEventListener('click', () => openModal(image));
    
    // Keyboard handler (Enter/Space)
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(image);
      }
    });

    gallery.appendChild(item);
  });
}

// Load images for a category
async function loadCategoryImages(category) {
  const keyword = categoryKeywords[category];
  
  if (!keyword) {
    showError(`Unknown category: ${category}`);
    return;
  }

  showLoading();

  try {
    const images = await fetchImages(keyword);
    renderImages(images);
  } catch (err) {
    console.error('Error fetching images:', err);
    showError('Failed to load images. Please check your API key and try again.');
  }
}

// Open modal with image preview
function openModal(imageData) {
  currentImageData = imageData;
  
  // Set modal content
  modalImage.src = imageData.urls.regular;
  modalImage.alt = imageData.alt_description || imageData.description || 'Image preview';
  
  modalTitle.textContent = imageData.alt_description || imageData.description || 'Untitled Image';
  
  const description = imageData.description || imageData.alt_description;
  modalDescription.textContent = description || 'No description available';
  
  // Photographer info
  const photographerName = imageData.user?.name || 'Unknown';
  const photographerUsername = imageData.user?.username || '';
  const photographerUrl = imageData.user?.links?.html || `https://unsplash.com/@${photographerUsername}`;
  
  modalPhotographerLink.textContent = photographerName;
  modalPhotographerLink.href = photographerUrl;
  
  // Store image data for actions
  downloadBtn.dataset.imageUrl = imageData.links?.download || imageData.urls.full;
  downloadBtn.dataset.imageId = imageData.id;
  
  // Show modal
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  
  // Focus management
  modalClose.focus();
}

// Close modal
function closeModal() {
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  currentImageData = null;
}

// Download image
function downloadImage() {
  if (!currentImageData) return;
  
  const imageUrl = currentImageData.links?.download || currentImageData.urls.full;
  const imageId = currentImageData.id;
  if (!imageUrl || !imageId) return;
  
  // Create temporary anchor element
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = `unsplash-${imageId}.jpg`;
  link.rel = 'noopener noreferrer';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Show feedback
  const originalText = downloadBtn.innerHTML;
  downloadBtn.textContent = 'Downloaded ✓';
  downloadBtn.disabled = true;
  
  setTimeout(() => {
    downloadBtn.innerHTML = originalText;
    downloadBtn.disabled = false;
  }, 2000);
}

// Save image to localStorage
function saveImage() {
  if (!currentImageData) return;
  
  try {
    // Get existing saved images
    const savedImages = JSON.parse(localStorage.getItem('savedImages') || '[]');
    
    // Check if already saved
    const exists = savedImages.find(img => img.id === currentImageData.id);
    
    if (exists) {
      // Already saved
      const originalText = saveBtn.innerHTML;
      saveBtn.innerHTML = '<span>✓</span> Already Saved';
      setTimeout(() => {
        saveBtn.innerHTML = originalText;
      }, 2000);
      return;
    }
    
    // Save image data
    const imageToSave = {
      id: currentImageData.id,
      url: currentImageData.urls.regular,
      description: currentImageData.description || currentImageData.alt_description || '',
      photographer: currentImageData.user?.name || 'Unknown',
      photographerUrl: currentImageData.user?.links?.html || '',
      savedAt: new Date().toISOString()
    };
    
    savedImages.push(imageToSave);
    localStorage.setItem('savedImages', JSON.stringify(savedImages));
    
    // Show feedback
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<span>✓</span> Saved!';
    setTimeout(() => {
      saveBtn.innerHTML = originalText;
    }, 2000);
  } catch (err) {
    console.error('Error saving image:', err);
    alert('Failed to save image. Please try again.');
  }
}

// Share image
async function shareImage() {
  if (!currentImageData) return;
  
  const imageUrl = currentImageData.urls.regular;
  const imageLink = currentImageData.links?.html || imageUrl;
  const photographerName = currentImageData.user?.name || 'Unknown';
  const title = currentImageData.alt_description || currentImageData.description || 'Beautiful image from Unsplash';
  
  // Check if Web Share API is supported
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: `Check out this beautiful photo by ${photographerName} on Unsplash`,
        url: imageLink
      });
      return;
    } catch (err) {
      // User cancelled or error occurred, fall through to fallback
      if (err.name === 'AbortError') return;
    }
  }
  
  // Fallback: Show share options
  showShareOptions(imageLink, title, photographerName);
}

// Show share options (fallback)
function showShareOptions(imageLink, title, photographerName) {
  // Create share menu
  const shareMenu = document.createElement('div');
  shareMenu.className = 'share-menu';
  shareMenu.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    z-index: 2000;
    max-width: 90%;
    width: 300px;
  `;
  
  shareMenu.innerHTML = `
    <h3 style="margin-bottom: 1rem; font-size: 1.25rem;">Share Image</h3>
    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
      <button class="share-option-btn" data-platform="whatsapp" style="padding: 0.75rem; border: 2px solid #25D366; background: #25D366; color: white; border-radius: 8px; cursor: pointer; font-weight: 500;">
        WhatsApp
      </button>
      <button class="share-option-btn" data-platform="instagram" style="padding: 0.75rem; border: 2px solid #E4405F; background: #E4405F; color: white; border-radius: 8px; cursor: pointer; font-weight: 500;">
        Instagram (Copy Link)
      </button>
      <button class="share-option-btn" data-platform="twitter" style="padding: 0.75rem; border: 2px solid #1DA1F2; background: #1DA1F2; color: white; border-radius: 8px; cursor: pointer; font-weight: 500;">
        Twitter / X
      </button>
      <button class="share-option-btn" data-platform="copy" style="padding: 0.75rem; border: 2px solid #6b7280; background: #6b7280; color: white; border-radius: 8px; cursor: pointer; font-weight: 500;">
        Copy Link
      </button>
      <button class="share-close-btn" style="padding: 0.75rem; border: 2px solid #e5e7eb; background: white; color: #1f2937; border-radius: 8px; cursor: pointer; font-weight: 500; margin-top: 0.5rem;">
        Cancel
      </button>
    </div>
  `;
  
  document.body.appendChild(shareMenu);
  
  // Handle share options
  shareMenu.querySelectorAll('.share-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const platform = btn.dataset.platform;
      handleSharePlatform(platform, imageLink, title, photographerName);
      document.body.removeChild(shareMenu);
    });
  });
  
  shareMenu.querySelector('.share-close-btn').addEventListener('click', () => {
    document.body.removeChild(shareMenu);
  });
  
  // Close on overlay click
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1999;';
  overlay.addEventListener('click', () => {
    document.body.removeChild(shareMenu);
    document.body.removeChild(overlay);
  });
  document.body.appendChild(overlay);
}

// Handle different share platforms
function handleSharePlatform(platform, imageLink, title, photographerName) {
  let url = '';
  
  switch (platform) {
    case 'whatsapp':
      url = `https://wa.me/?text=${encodeURIComponent(`${title} by ${photographerName} - ${imageLink}`)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      break;
      
    case 'instagram':
      // Instagram doesn't support direct link sharing, so copy to clipboard
      copyToClipboard(imageLink);
      alert('Image link copied to clipboard! Paste it in your Instagram story or post.');
      break;
      
    case 'twitter':
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${title} by ${photographerName}`)}&url=${encodeURIComponent(imageLink)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      break;
      
    case 'copy':
      copyToClipboard(imageLink);
      const originalText = shareBtn.innerHTML;
      shareBtn.innerHTML = '<span>✓</span> Copied!';
      setTimeout(() => {
        shareBtn.innerHTML = originalText;
      }, 2000);
      break;
  }
}

// Copy to clipboard
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(err => {
      console.error('Failed to copy:', err);
      fallbackCopyToClipboard(text);
    });
  } else {
    fallbackCopyToClipboard(text);
  }
}

// Fallback copy method
function fallbackCopyToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Fallback copy failed:', err);
  }
  document.body.removeChild(textArea);
}

// Event Listeners
function bindEventListeners() {
  // Category buttons
  categoryButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      categoryButtons.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });

      // Add active class to clicked button
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Load images for selected category
      const category = btn.dataset.category;
      loadCategoryImages(category);
    });
  });

  // Modal close handlers
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', closeModal);

  // ESC key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
      closeModal();
    }
  });

  // Action buttons
  downloadBtn.addEventListener('click', downloadImage);
  saveBtn.addEventListener('click', saveImage);
  shareBtn.addEventListener('click', shareImage);
}

// Initialize safely after DOM load
document.addEventListener('DOMContentLoaded', () => {
  bindEventListeners();

  // Set initial aria-selected state
  categoryButtons.forEach((b) => b.setAttribute('aria-selected', 'false'));

  init();
});
