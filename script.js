// DOM Elements
const uploadBtn = document.getElementById('uploadBtn');
const uploadModal = document.getElementById('uploadModal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const selectFileBtn = document.getElementById('selectFileBtn');
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const previewArea = document.getElementById('previewArea');
const previewImage = document.getElementById('previewImage');
const shareBtn = document.getElementById('shareBtn');
const captionInput = document.getElementById('captionInput');
const locationInput = document.getElementById('locationInput');

// Modal functionality
function openModal() {
    uploadModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModalFunc() {
    uploadModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    resetUploadModal();
}

function resetUploadModal() {
    uploadArea.style.display = 'flex';
    previewArea.style.display = 'none';
    previewImage.src = '';
    captionInput.value = '';
    locationInput.value = '';
    fileInput.value = '';
}

// Event listeners for modal
uploadBtn.addEventListener('click', openModal);
closeModal.addEventListener('click', closeModalFunc);
cancelBtn.addEventListener('click', closeModalFunc);

// Close modal when clicking outside
uploadModal.addEventListener('click', (e) => {
    if (e.target === uploadModal) {
        closeModalFunc();
    }
});

// File selection
selectFileBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            uploadArea.style.display = 'none';
            previewArea.style.display = 'grid';
        };
        reader.readAsDataURL(file);
    }
});

// Drag and drop functionality
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.backgroundColor = '#f0f0f0';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.backgroundColor = '';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.backgroundColor = '';
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            uploadArea.style.display = 'none';
            previewArea.style.display = 'grid';
        };
        reader.readAsDataURL(file);
    }
});

// Share button functionality
shareBtn.addEventListener('click', () => {
    const caption = captionInput.value;
    const location = locationInput.value;
    
    // In a real app, this would send data to a server
    console.log('Sharing post:', { caption, location, image: previewImage.src.substring(0, 50) + '...' });
    
    // Show success message
    alert('Post shared successfully! 🎉');
    closeModalFunc();
    
    // In a real app, you would add the new post to the feed
    createNewPost(caption, location, previewImage.src);
});

// Create new post in feed
function createNewPost(caption, location, imageSrc) {
    const feedSection = document.querySelector('.feed-section');
    const newPost = document.createElement('article');
    newPost.className = 'post-card';
    
    const randomLikes = Math.floor(Math.random() * 1000) + 100;
    const randomComments = Math.floor(Math.random() * 50) + 5;
    
    newPost.innerHTML = `
        <div class="post-header">
            <div class="user-info">
                <img src="https://i.pravatar.cc/150?img=10" alt="User" class="user-avatar">
                <div class="user-details">
                    <span class="username">your_username</span>
                    ${location ? `<span class="location">${location}</span>` : ''}
                </div>
            </div>
            <button class="post-options">
                <i class="fas fa-ellipsis-h"></i>
            </button>
        </div>
        <div class="post-image">
            <img src="${imageSrc}" alt="Post">
        </div>
        <div class="post-actions">
            <div class="action-buttons">
                <button class="action-btn like-btn">
                    <i class="far fa-heart"></i>
                </button>
                <button class="action-btn">
                    <i class="far fa-comment"></i>
                </button>
                <button class="action-btn">
                    <i class="far fa-paper-plane"></i>
                </button>
            </div>
            <button class="action-btn save-btn">
                <i class="far fa-bookmark"></i>
            </button>
        </div>
        <div class="post-info">
            <div class="likes-count">
                <strong>${randomLikes} likes</strong>
            </div>
            <div class="post-caption">
                <strong>your_username</strong> ${caption}
            </div>
            <button class="view-comments">View all ${randomComments} comments</button>
            <div class="post-time">JUST NOW</div>
        </div>
    `;
    
    feedSection.insertBefore(newPost, feedSection.firstChild);
    
    // Add event listeners to the new post
    const likeBtn = newPost.querySelector('.like-btn');
    const saveBtn = newPost.querySelector('.save-btn');
    likeBtn.addEventListener('click', handleLike);
    saveBtn.addEventListener('click', handleSave);
    
    // Smooth scroll to the new post
    newPost.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Like button functionality
function handleLike(e) {
    const btn = e.currentTarget;
    const icon = btn.querySelector('i');
    const likesCount = btn.closest('.post-card').querySelector('.likes-count strong');
    
    btn.classList.toggle('liked');
    
    if (btn.classList.contains('liked')) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        // Increment likes
        const currentLikes = parseInt(likesCount.textContent.replace(/\D/g, ''));
        likesCount.textContent = `${(currentLikes + 1).toLocaleString()} likes`;
        
        // Add animation
        btn.style.animation = 'likeAnimation 0.4s ease';
        setTimeout(() => {
            btn.style.animation = '';
        }, 400);
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        // Decrement likes
        const currentLikes = parseInt(likesCount.textContent.replace(/\D/g, ''));
        likesCount.textContent = `${(currentLikes - 1).toLocaleString()} likes`;
    }
}

// Save button functionality
function handleSave(e) {
    const btn = e.currentTarget;
    const icon = btn.querySelector('i');
    
    btn.classList.toggle('saved');
    
    if (btn.classList.contains('saved')) {
        icon.classList.remove('far');
        icon.classList.add('fas');
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
    }
}

// Add event listeners to all existing like and save buttons
document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', handleLike);
});

document.querySelectorAll('.save-btn').forEach(btn => {
    btn.addEventListener('click', handleSave);
});

// Follow button functionality
document.querySelectorAll('.follow-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        if (this.classList.contains('following')) {
            this.textContent = 'Follow';
            this.classList.remove('following');
        } else {
            this.textContent = 'Following';
            this.classList.add('following');
        }
    });
});

// View comments functionality (placeholder)
document.querySelectorAll('.view-comments').forEach(btn => {
    btn.addEventListener('click', () => {
        alert('Comments feature coming soon! 💬');
    });
});

// Story click functionality (placeholder)
document.querySelectorAll('.story-item').forEach(story => {
    story.addEventListener('click', () => {
        alert('Story viewer coming soon! 📸');
    });
});

// Add CSS for like animation
const style = document.createElement('style');
style.textContent = `
    @keyframes likeAnimation {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.3);
        }
        100% {
            transform: scale(1);
        }
    }
`;
document.head.appendChild(style);

// Console welcome message
console.log('%cWelcome to Mikesta! 📸', 'font-size: 20px; font-weight: bold; color: #0095f6;');
console.log('%cShare your moments with the world!', 'font-size: 14px; color: #8e8e8e;');
