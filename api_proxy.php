<?php
// api_proxy.php

// Setel header untuk respons ke browser yang memanggil proxy ini
// Ini penting untuk mengatasi masalah CORS antara localhost dan proxy PHP Anda
header('Content-Type: application/json'); // Beritahu browser bahwa respons ini adalah JSON
header('Access-Control-Allow-Origin: *'); // Izinkan akses dari semua domain (untuk development lokal)
header('Access-Control-Allow-Methods: GET, OPTIONS'); // Izinkan metode GET dan OPTIONS
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With'); // Izinkan header tertentu

// Tangani preflight request (OPTIONS) yang dikirim oleh browser sebelum permintaan GET/POST aktual
// Ini adalah bagian dari mekanisme CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200); // Kirim status 200 OK
    exit(0); // Hentikan eksekusi script
}

// URL dasar dari API Suitmedia yang ingin Anda panggil
$base_api_url = 'https://suitmedia-backend.suitdev.com/api/ideas';

// Ambil semua query string (parameter URL) dari permintaan yang datang dari JavaScript
// Contoh: page[number]=1&page[size]=10&append[]=small_image
$query_string = $_SERVER['QUERY_STRING'];

// Bangun URL lengkap untuk permintaan ke API Suitmedia
// Jika ada query string, tambahkan ke base URL
$full_api_url = $base_api_url . ($query_string ? '?' . $query_string : '');

// Inisialisasi sesi cURL
// cURL adalah library PHP untuk membuat permintaan HTTP dari server ke server lain
$ch = curl_init();

// Setel opsi cURL
curl_setopt($ch, CURLOPT_URL, $full_api_url); // Setel URL tujuan
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); // Pastikan cURL mengembalikan respons sebagai string, bukan menampilkannya langsung

// PENTING: Setel HTTP header untuk permintaan ke API Suitmedia
// Ini memberitahu API Suitmedia bahwa kita menerima respons JSON dan komunikasi kita berbasis JSON
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',          // Beritahu server bahwa kita mengharapkan respons JSON
    // 'Content-Type: application/json'   // Untuk permintaan GET, ini biasanya tidak diperlukan,
                                         // tetapi jika masih ada masalah setelah Accept saja, coba uncomment baris ini.
]);

// Eksekusi sesi cURL dan ambil respons dari API Suitmedia
$response = curl_exec($ch);

// Periksa jika ada kesalahan selama eksekusi cURL
if (curl_errno($ch)) {
    // Jika ada error, setel status HTTP 500 (Internal Server Error)
    http_response_code(500);
    // Kirim pesan error dalam format JSON
    echo json_encode(['error' => 'cURL error: ' . curl_error($ch)]);
} else {
    // Tampilkan respons yang diterima dari API Suitmedia
    // Respons ini akan diteruskan ke JavaScript di browser Anda
    echo $response;
}

// Tutup sesi cURL
curl_close($ch);
?>