let currentPage = parseInt(localStorage.getItem('currentPage')) || 1;
let itemsPerPage = parseInt(localStorage.getItem('itemsPerPage')) || 10;
let sortBy = localStorage.getItem('sortBy') || '-published_at'; 

const mainHeader = document.getElementById('main-header');
const banner = document.getElementById('banner');
const bannerContent = document.querySelector('.banner-content');
const showPerPageSelect = document.getElementById('show-per-page');
const sortBySelect = document.getElementById('sort-by');
const postGrid = document.getElementById('post-grid');
const paginationContainer = document.getElementById('pagination');
const itemStatusSpan = document.getElementById('item-status');

const API_BASE_URL = 'api_proxy.php';

/**
 * Fungsi asinkron untuk mengambil data post dari API.
 * Menggunakan parameter currentPage, itemsPerPage, dan sortBy yang sedang aktif.
 * @returns {Promise<Object|null>} Data objek dari API atau null jika terjadi error.
 */
async function fetchPosts() {
    try {
        const params = new URLSearchParams({
            'page[number]': currentPage,
            'page[size]': itemsPerPage,
            'append[]': 'small_image', 
            'append[]': 'medium_image',
            'sort': sortBy
        });
        const url = `${API_BASE_URL}?${params.toString()}`;
        console.log('Fetching:', url); 
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const data = await response.json();
        console.log("Data fetched from API:", data); 
        return data;
    } catch (error) {
        console.error('Error fetching posts:', error);
        postGrid.innerHTML = `<p style="color: red; text-align: center;">Failed to load posts. Please try again later. Error: ${error.message}</p>`;
        return null;
    }
}

/**
 * Fungsi untuk merender daftar post ke dalam grid di halaman.
 * @param {Array<Object>} posts - Array objek post yang akan ditampilkan.
 */
function renderPosts(posts) {
    console.log("Posts to render:", posts); 
    postGrid.innerHTML = ''; 

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
        postGrid.innerHTML = '<p style="text-align: center;">No posts found.</p>';
        return;
    }
    posts.forEach(post => {
        let originalImageUrl; 
        originalImageUrl = 'https://placehold.co/300x169?text=Image+Not+Available';
        const proxiedImageUrl = `image_proxy.php?url=${encodeURIComponent(originalImageUrl)}`;
        const publishedDate = new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const postCard = `
            <div class="post-card">
                <div class="post-thumbnail-container">
                    <img class="post-thumbnail" src="${proxiedImageUrl}" alt="${post.title}" loading="lazy">
                </div>
                <div class="post-content">
                    <p class="post-date">${publishedDate}</p>
                    <h3 class="post-title">${post.title}</h3>
                </div>
            </div>
        `;
        postGrid.insertAdjacentHTML('beforeend', postCard);
    });
}

/**
 * Fungsi untuk merender kontrol pagination.
 * @param {number} totalItems - Total keseluruhan item dari API.
 * @param {number} totalPages - Total keseluruhan halaman.
 */
function renderPagination(totalItems, totalPages) {
    paginationContainer.innerHTML = ''; 
    let pagesToShow = 5; 
    let startPage = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + pagesToShow - 1);
    if (endPage - startPage + 1 < pagesToShow) {
        startPage = Math.max(1, endPage - pagesToShow + 1);
    }

    if (currentPage > 1) {
        paginationContainer.insertAdjacentHTML('beforeend', `<a href="#" class="page-link" data-page="${currentPage - 1}">&laquo;</a>`);
    }

    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        paginationContainer.insertAdjacentHTML('beforeend', `<a href="#" class="page-link ${activeClass}" data-page="${i}">${i}</a>`);
    }

    if (currentPage < totalPages) {
        paginationContainer.insertAdjacentHTML('beforeend', `<a href="#" class="page-link" data-page="${currentPage + 1}">&raquo;</a>`);
    }
    paginationContainer.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); 
            currentPage = parseInt(e.target.dataset.page); 
            localStorage.setItem('currentPage', currentPage);
            loadPosts(); 
        });
    });
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const renderedItemsCount = postGrid.children.length; 
    let endItem = startItem + renderedItemsCount - 1;
    if (endItem > totalItems) endItem = totalItems; 

    if (totalItems === 0) {
        itemStatusSpan.textContent = `Showing 0-0 of 0`;
    } else {
        itemStatusSpan.textContent = `Showing ${startItem}-${endItem} of ${totalItems}`;
    }
}

async function loadPosts() {
    const data = await fetchPosts(); 
    if (data && data.data) { 
        renderPosts(data.data); 
        const totalItems = data.meta.total; 
        const totalPages = Math.ceil(totalItems / itemsPerPage); 
        renderPagination(totalItems, totalPages); 
    } else {
        postGrid.innerHTML = '<p style="text-align: center; color: red;">Could not load posts. Please check your network or API proxy configuration.</p>';
        itemStatusSpan.textContent = `Showing 0-0 of 0`; 
        paginationContainer.innerHTML = ''; 
    }
}

showPerPageSelect.addEventListener('change', (e) => {
    itemsPerPage = parseInt(e.target.value); 
    currentPage = 1; 
    localStorage.setItem('itemsPerPage', itemsPerPage); 
    localStorage.setItem('currentPage', currentPage); 
    loadPosts(); 
});

sortBySelect.addEventListener('change', (e) => {
    sortBy = e.target.value; 
    currentPage = 1; 
    localStorage.setItem('sortBy', sortBy); 
    localStorage.setItem('currentPage', currentPage); 
    loadPosts(); 
});

window.onload = () => {
    showPerPageSelect.value = itemsPerPage;
    sortBySelect.value = sortBy;
    loadPosts();
    banner.style.backgroundImage = `url(img/bg.jpeg)`;
};


let lastScrollY = window.scrollY; 

window.addEventListener('scroll', () => {
    if (window.scrollY > lastScrollY && window.scrollY > 100) {
        mainHeader.classList.add('header-hidden'); 
    }
    else if (window.scrollY < lastScrollY || window.scrollY <= 100) {
        mainHeader.classList.remove('header-hidden'); 
        if (window.scrollY > 0) {
            mainHeader.style.backgroundColor = '#ff6600'; 
        } else {
            mainHeader.style.backgroundColor = '#ff6600'; 
        }
    }
    lastScrollY = window.scrollY; 
    const scrollPosition = window.scrollY;
    bannerContent.style.transform = `translateY(${scrollPosition * 0.3}px)`;
});