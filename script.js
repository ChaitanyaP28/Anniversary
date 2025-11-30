// Function to get query parameter by name
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    // Check for custom name in URL
    const name = getQueryParam('name');
    if (name) {
        document.getElementById('name').textContent = ', ' + name; // Add name with comma
    }
    
    // Check for year in URL
    const year = getQueryParam('year');
    if (year) {
        const yearNum = parseInt(year);
        document.getElementById('year-text').textContent = year + getSuffix(yearNum) + ' ';
        
        // Add milestone text for special years
        const milestoneText = getMilestoneText(yearNum);
        if (milestoneText) {
            document.getElementById('milestone').textContent = '✨ ' + milestoneText + ' ✨';
        }
    }
    
    // Check for Google Sheet ID in URL
    const sheetId = getQueryParam('sheet');
    if (sheetId) {
        loadPhotosFromSheet(sheetId);
    }
    
    // Generate falling hearts dynamically
    createFallingHearts(); // Initialize falling hearts
});

// Get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
function getSuffix(num) {
    if (num >= 11 && num <= 13) return 'th';
    switch (num % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

// Get milestone text for special anniversary years
function getMilestoneText(year) {
    const milestones = {
        1: 'Paper Anniversary',
        5: 'Wood Anniversary',
        10: 'Tin Anniversary',
        15: 'Crystal Anniversary',
        20: 'China Anniversary',
        25: '💎 Silver Jubilee 💎',
        30: 'Pearl Anniversary',
        40: 'Ruby Anniversary 💎',
        50: 'Golden Jubilee 🥇',
        60: 'Diamond Jubilee 💎',
        75: 'Platinum Jubilee'
    };
    return milestones[year] || null;
}

// Function to convert Google Drive share links to viewable format
function convertGoogleDriveUrl(url) {
    // Check if it's a Google Drive link that needs conversion
    // Format: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch) {
        const fileId = driveMatch[1];
        // Use lh3.googleusercontent.com for better image serving
        return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
    // Check if already in uc?export format, convert to lh3 format
    const ucMatch = url.match(/drive\.google\.com\/uc\?export=view&id=([a-zA-Z0-9_-]+)/);
    if (ucMatch) {
        const fileId = ucMatch[1];
        return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
    // Return original URL if not a Google Drive link
    return url;
}

// Store loaded image URLs for falling effect
let loadedImageUrls = [];
let imagesLoaded = false;
let surpriseRevealed = false;
let fallingImagesStarted = false;

// Function to start falling images if conditions are met
function tryStartFallingImages() {
    if (imagesLoaded && surpriseRevealed && !fallingImagesStarted && loadedImageUrls.length > 0) {
        fallingImagesStarted = true;
        createFallingImages();
    }
}

// Function to load photos from Google Sheet
async function loadPhotosFromSheet(sheetId) {
    try {
        // Google Sheets published CSV URL
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch sheet');
        
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim());
        
        const gallery = document.getElementById('gallery');
        
        lines.forEach((line, index) => {
            // Skip header row if it contains "http" (it's actually a URL)
            let imageUrl = line.trim().replace(/"/g, ''); // Remove quotes
            
            if (imageUrl && imageUrl.startsWith('http')) {
                // Auto-convert Google Drive links
                imageUrl = convertGoogleDriveUrl(imageUrl);
                
                // Store URL for falling effect
                loadedImageUrls.push(imageUrl);
                
                const imgContainer = document.createElement('div');
                imgContainer.classList.add('gallery-item');
                
                const img = document.createElement('img');
                img.src = imageUrl;
                img.alt = `Memory ${index + 1}`;
                img.loading = 'lazy';
                
                // Click to view larger
                img.onclick = () => openLightbox(imageUrl);
                
                imgContainer.appendChild(img);
                gallery.appendChild(imgContainer);
            }
        });
        
        // Mark images as loaded and try starting falling images
        imagesLoaded = true;
        tryStartFallingImages();
    } catch (error) {
        console.error('Error loading photos:', error);
    }
}

// Lightbox for viewing images
function openLightbox(imageUrl) {
    const lightbox = document.createElement('div');
    lightbox.classList.add('lightbox');
    lightbox.innerHTML = `
        <span class="close-lightbox" onclick="this.parentElement.remove()">&times;</span>
        <img src="${imageUrl}" alt="Full size image">
    `;
    lightbox.onclick = (e) => {
        if (e.target === lightbox) lightbox.remove();
    };
    document.body.appendChild(lightbox);
}

// Function to create randomly falling images
function createFallingImages() {
    const heartsContainer = document.querySelector('.hearts');
    let lastImageIndex = -1; // Track last image to avoid repeats
    
    function createFallingImage() {
        if (loadedImageUrls.length === 0) return;
        
        const img = document.createElement('img');
        img.classList.add('falling-image');
        
        // Pick a random image, but not the same as last one
        let randomIndex;
        if (loadedImageUrls.length > 1) {
            do {
                randomIndex = Math.floor(Math.random() * loadedImageUrls.length);
            } while (randomIndex === lastImageIndex);
        } else {
            randomIndex = 0;
        }
        lastImageIndex = randomIndex;
        
        const randomUrl = loadedImageUrls[randomIndex];
        img.src = randomUrl;
        
        // Random starting position (across the width)
        const startX = Math.random() * 80 + 10; // 10% to 90%
        img.style.left = `${startX}%`;
        
        // Random animation duration
        const duration = Math.random() * 5 + 8; // 8 to 13 seconds
        img.style.animationDuration = `${duration}s`;
        
        // Append to the hearts container
        heartsContainer.appendChild(img);
        
        // Remove after animation
        setTimeout(() => {
            img.remove();
        }, duration * 1000);
    }
    
    // Create a falling image every 3.5 seconds
    setInterval(createFallingImage, 3500);
    
    // Create first one immediately
    createFallingImage();
}

// Function to create falling hearts
function createFallingHearts() {
    const heartsContainer = document.querySelector('.hearts');
    const heartSymbols = ['❤️', '💕', '💖', '💗', '💓', '💞', '💘'];
    
    // Function to create a single falling heart
    function createHeart() {
        const heart = document.createElement('div');
        heart.classList.add('falling-heart');
        
        // Random heart symbol
        heart.textContent = heartSymbols[Math.floor(Math.random() * heartSymbols.length)];
        
        // Random size
        const size = Math.random() * 20 + 15; // 15px to 35px
        heart.style.fontSize = `${size}px`;
        
        // Random starting position (across the width)
        const startX = Math.random() * 100;
        heart.style.left = `${startX}%`;
        
        // Random animation duration
        const duration = Math.random() * 3 + 4; // 4 to 7 seconds
        heart.style.animationDuration = `${duration}s`;
        
        // Random delay
        const delay = Math.random() * 2;
        heart.style.animationDelay = `${delay}s`;
        
        // Append to the hearts container
        heartsContainer.appendChild(heart);
        
        // Remove the heart after animation completes
        setTimeout(() => {
            heart.remove();
        }, (duration + delay) * 1000);
    }
    
    // Create initial hearts
    for (let i = 0; i < 15; i++) {
        createHeart();
    }
    
    // Continuously create hearts
    setInterval(() => {
        createHeart();
    }, 300); // Create a new heart every 300ms
}

// Reveal the surprise
function revealMessage() {
    const surprise = document.querySelector('.surprise');
    surprise.classList.remove('hidden');
    
    // Hide the surprise button
    const btn = document.querySelector('.btn:not(.gallery-btn)');
    if (btn) btn.style.display = 'none';
    
    // Mark surprise as revealed and try starting falling images
    surpriseRevealed = true;
    tryStartFallingImages();
}

// Reveal the gallery
function revealGallery() {
    const gallery = document.getElementById('gallery');
    gallery.classList.toggle('hidden');
}
