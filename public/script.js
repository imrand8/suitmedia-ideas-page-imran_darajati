// Variable untuk menyimpan state halaman di localStorage
// Ini memastikan preferensi pengguna (halaman, jumlah item, sortir) tetap tersimpan saat refresh
let currentPage = parseInt(localStorage.getItem('currentPage')) || 1;
let itemsPerPage = parseInt(localStorage.getItem('itemsPerPage')) || 10;
let sortBy = localStorage.getItem('sortBy') || '-published_at'; // Default: terbaru (-published_at)

// Mendapatkan referensi ke elemen-elemen DOM yang akan dimanipulasi
const mainHeader = document.getElementById('main-header');
const banner = document.getElementById('banner');
const bannerContent = document.querySelector('.banner-content');
const showPerPageSelect = document.getElementById('show-per-page');
const sortBySelect = document.getElementById('sort-by');
const postGrid = document.getElementById('post-grid');
const paginationContainer = document.getElementById('pagination');
const itemStatusSpan = document.getElementById('item-status');

// URL dasar API. Mengarah ke PHP proxy untuk data JSON karena masalah CORS di lingkungan lokal (XAMPP)
const API_BASE_URL = 'api_proxy.php';

/**
 * Fungsi asinkron untuk mengambil data post dari API.
 * Menggunakan parameter currentPage, itemsPerPage, dan sortBy yang sedang aktif.
 * @returns {Promise<Object|null>} Data objek dari API atau null jika terjadi error.
 */
async function fetchPosts() {
    try {
        // Membangun parameter URL untuk permintaan API
        const params = new URLSearchParams({
            'page[number]': currentPage,
            'page[size]': itemsPerPage,
            'append[]': 'small_image', // Tetap sertakan ini meskipun tidak digunakan untuk render
            'append[]': 'medium_image', // Tetap sertakan ini meskipun tidak digunakan untuk render
            'sort': sortBy
        });
        const url = `${API_BASE_URL}?${params.toString()}`;
        console.log('Fetching:', url); // Log URL yang dipanggil untuk debugging

        // Melakukan permintaan fetch ke URL proxy
        const response = await fetch(url);

        // Memeriksa apakah respons dari server OK (status kode 200-299)
        if (!response.ok) {
            // Jika tidak OK, baca respons error dari server untuk debugging lebih lanjut
            const errorText = await response.text();
            throw new new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        // Parse respons JSON
        const data = await response.json();
        console.log("Data fetched from API:", data); // Log data lengkap yang diterima dari API
        return data;
    } catch (error) {
        console.error('Error fetching posts:', error);
        // Menampilkan pesan error di UI jika gagal mengambil data
        postGrid.innerHTML = `<p style="color: red; text-align: center;">Failed to load posts. Please try again later. Error: ${error.message}</p>`;
        return null;
    }
}

/**
 * Fungsi untuk merender daftar post ke dalam grid di halaman.
 * @param {Array<Object>} posts - Array objek post yang akan ditampilkan.
 */
function renderPosts(posts) {
    console.log("Posts to render:", posts); // Log array post yang akan dirender
    postGrid.innerHTML = ''; // Mengosongkan grid sebelum menambahkan post baru

    // Jika tidak ada post atau formatnya tidak sesuai, tampilkan pesan
    if (!posts || !Array.isArray(posts) || posts.length === 0) {
        postGrid.innerHTML = '<p style="text-align: center;">No posts found.</p>';
        return;
    }

    // Iterasi setiap post dan buat elemen kartu HTML-nya
    posts.forEach(post => {
        let originalImageUrl; // Ini akan menyimpan URL gambar (sekarang selalu placeholder)

        // --- Perubahan utama: Selalu gunakan gambar placeholder ---
        // Karena masalah akses ke assets.suitdev.com, kita fallback ke placeholder
        originalImageUrl = 'https://placehold.co/300x169?text=Image+Not+Available';
        // Anda juga bisa mempertahankan logika if/else if sebelumnya sebagai fallback *untuk placeholder*
        // jika suatu saat ingin mencoba sumber gambar lain yang tidak bermasalah
        // Contoh:
        /*
        if (post.small_image && Array.isArray(post.small_image) && post.small_image.length > 0 && post.small_image[0].url) {
            originalImageUrl = post.small_image[0].url;
        } else if (post.medium_image && Array.isArray(post.medium_image) && post.medium_image.length > 0 && post.medium_image[0].url) {
            originalImageUrl = post.medium_image[0].url;
        } else {
            originalImageUrl = 'https://via.placeholder.com/300x169?text=No+Image';
        }
        */
        // ----------------------------------------------------------

        // PENTING: Gunakan image_proxy.php untuk setiap URL gambar
        // Encoding URL asli agar aman dikirim sebagai parameter query string
        const proxiedImageUrl = `image_proxy.php?url=${encodeURIComponent(originalImageUrl)}`;

        // Format tanggal publikasi ke format yang mudah dibaca
        const publishedDate = new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        // Template HTML untuk setiap kartu post
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
        // Masukkan kartu post ke dalam grid
        postGrid.insertAdjacentHTML('beforeend', postCard);
    });
}

/**
 * Fungsi untuk merender kontrol pagination.
 * @param {number} totalItems - Total keseluruhan item dari API.
 * @param {number} totalPages - Total keseluruhan halaman.
 */
function renderPagination(totalItems, totalPages) {
    paginationContainer.innerHTML = ''; // Kosongkan pagination sebelum menambahkan tombol baru

    let pagesToShow = 5; // Jumlah tombol halaman yang ingin ditampilkan di pagination
    let startPage = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + pagesToShow - 1);

    // Sesuaikan startPage jika endPage terlalu kecil (agar selalu ada 5 tombol jika memungkinkan)
    if (endPage - startPage + 1 < pagesToShow) {
        startPage = Math.max(1, endPage - pagesToShow + 1);
    }

    // Tombol "Previous"
    if (currentPage > 1) {
        paginationContainer.insertAdjacentHTML('beforeend', `<a href="#" class="page-link" data-page="${currentPage - 1}">&laquo;</a>`);
    }

    // Nomor-nomor halaman
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        paginationContainer.insertAdjacentHTML('beforeend', `<a href="#" class="page-link ${activeClass}" data-page="${i}">${i}</a>`);
    }

    // Tombol "Next"
    if (currentPage < totalPages) {
        paginationContainer.insertAdjacentHTML('beforeend', `<a href="#" class="page-link" data-page="${currentPage + 1}">&raquo;</a>`);
    }

    // Menambahkan event listener ke setiap tombol halaman yang baru dibuat
    paginationContainer.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Mencegah link pindah halaman fisik
            currentPage = parseInt(e.target.dataset.page); // Ambil nomor halaman dari data-page
            localStorage.setItem('currentPage', currentPage); // Simpan state halaman
            loadPosts(); // Muat ulang post
        });
    });

    // Update teks status item yang ditampilkan (contoh: "Showing 1-10 of 100")
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const renderedItemsCount = postGrid.children.length; // Jumlah item yang benar-benar dirender di halaman saat ini
    let endItem = startItem + renderedItemsCount - 1;
    if (endItem > totalItems) endItem = totalItems; // Pastikan endItem tidak melebihi total item

    if (totalItems === 0) {
        itemStatusSpan.textContent = `Showing 0-0 of 0`;
    } else {
        itemStatusSpan.textContent = `Showing ${startItem}-${endItem} of ${totalItems}`;
    }
}

/**
 * Fungsi utama untuk memuat dan merender post serta pagination.
 * Ini adalah titik masuk utama untuk memperbarui tampilan daftar post.
 */
async function loadPosts() {
    const data = await fetchPosts(); // Ambil data dari API
    if (data && data.data) { // Pastikan data dan properti 'data' (array post) ada dan valid
        renderPosts(data.data); // Render kartu post
        const totalItems = data.meta.total; // Ambil total item dari metadata API
        const totalPages = Math.ceil(totalItems / itemsPerPage); // Hitung total halaman
        renderPagination(totalItems, totalPages); // Render pagination
    } else {
        // Jika gagal mendapatkan data yang valid, tampilkan pesan error di grid
        postGrid.innerHTML = '<p style="text-align: center; color: red;">Could not load posts. Please check your network or API proxy configuration.</p>';
        itemStatusSpan.textContent = `Showing 0-0 of 0`; // Setel status item ke 0
        paginationContainer.innerHTML = ''; // Kosongkan pagination
    }
}

// --- Event Listeners untuk Kontrol Halaman ---

// Event listener untuk dropdown "Show per page"
showPerPageSelect.addEventListener('change', (e) => {
    itemsPerPage = parseInt(e.target.value); // Ambil nilai baru
    currentPage = 1; // Reset ke halaman pertama saat jumlah item per halaman berubah
    localStorage.setItem('itemsPerPage', itemsPerPage); // Simpan state
    localStorage.setItem('currentPage', currentPage); // Simpan state
    loadPosts(); // Muat ulang post
});

// Event listener untuk dropdown "Sort by"
sortBySelect.addEventListener('change', (e) => {
    sortBy = e.target.value; // Ambil nilai baru
    currentPage = 1; // Reset ke halaman pertama saat urutan sortir berubah
    localStorage.setItem('sortBy', sortBy); // Simpan state
    localStorage.setItem('currentPage', currentPage); // Simpan state
    loadPosts(); // Muat ulang post
});

// --- Initial Setup saat Halaman Dimuat ---

// window.onload akan dieksekusi setelah seluruh halaman (termasuk semua gambar) selesai dimuat
window.onload = () => {
    // Inisialisasi nilai dropdown sesuai dengan yang tersimpan di localStorage
    showPerPageSelect.value = itemsPerPage;
    sortBySelect.value = sortBy;

    // Muat post pertama kali halaman dibuka
    loadPosts();

    // Setel gambar background untuk banner
    // Gunakan URL gambar yang valid dari API Suitmedia atau placeholder lain jika perlu
    banner.style.backgroundImage = `url(img/bg.jpeg)`;
};

// --- Header Scroll Behavior dan Parallax Effect ---

let lastScrollY = window.scrollY; // Variabel untuk menyimpan posisi scroll terakhir

window.addEventListener('scroll', () => {
    // Logika untuk menyembunyikan/menampilkan header:
    // Header akan disembunyikan jika scroll ke bawah DAN posisi scroll melewati 100px dari atas
    if (window.scrollY > lastScrollY && window.scrollY > 100) {
        mainHeader.classList.add('header-hidden'); // Tambahkan kelas CSS untuk menyembunyikan header
    }
    // Header akan ditampilkan jika scroll ke atas ATAU berada di 100px teratas halaman
    else if (window.scrollY < lastScrollY || window.scrollY <= 100) {
        mainHeader.classList.remove('header-hidden'); // Hapus kelas CSS untuk menampilkan header
        // Atur transparansi background header
        if (window.scrollY > 0) {
            mainHeader.style.backgroundColor = '#ff6600'; // Sedikit transparan saat di-scroll
        } else {
            mainHeader.style.backgroundColor = '#ff6600'; // Solid saat di paling atas
        }
    }
    lastScrollY = window.scrollY; // Perbarui posisi scroll terakhir untuk perbandingan selanjutnya

    // Efek parallax untuk konten teks di dalam banner
    const scrollPosition = window.scrollY;
    // Konten banner digeser ke bawah relatif terhadap scroll (memberi efek pergerakan lebih lambat dari background)
    // Sesuaikan nilai '0.3' untuk mengubah kecepatan efek parallax
    bannerContent.style.transform = `translateY(${scrollPosition * 0.3}px)`;
    // Jika Anda ingin efek parallax pada background banner juga (uncomment dan sesuaikan jika diperlukan):
    // banner.style.backgroundPositionY = `calc(50% + ${scrollPosition * 0.2}px)`;
});