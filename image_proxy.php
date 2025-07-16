<?php
// image_proxy.php
// --- BARIS UNTUK DEBUGGING ERROR YANG SANGAT AGRESIF ---
error_reporting(E_ALL); // Laporkan SEMUA error PHP
ini_set('display_errors', '1'); // Tampilkan error di browser
ini_set('display_startup_errors', '1'); // Tampilkan error saat startup PHP
// --- AKHIR DEBUGGING AGRESIF ---

// Setel header untuk respons ke browser yang memanggil proxy ini
// Ini penting untuk mengatasi masalah CORS antara localhost dan proxy PHP Anda
header('Access-Control-Allow-Origin: *'); // Izinkan akses dari semua domain (untuk development lokal)
header('Access-Control-Allow-Methods: GET, OPTIONS'); // Izinkan metode GET dan OPTIONS
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Tangani preflight request (OPTIONS) yang dikirim oleh browser sebelum permintaan GET/POST aktual
// Ini adalah bagian dari mekanisme CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200); // Kirim status 200 OK
    exit(0); // Hentikan eksekusi script
}

// Pastikan parameter 'url' ada di query string dari permintaan JavaScript
if (!isset($_GET['url']) || empty($_GET['url'])) {
    http_response_code(400); // Bad Request
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Missing image URL parameter.']);
    exit();
}

$imageUrl = $_GET['url']; // Dapatkan URL gambar asli dari parameter 'url'

// Validasi dasar URL untuk keamanan.
// Anda bisa menambahkan validasi yang lebih ketat jika diperlukan.
if (!filter_var($imageUrl, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid image URL provided.']);
    exit();
}

try {
    // Inisialisasi sesi cURL
    $ch = curl_init();
    if ($ch === false) {
        throw new Exception('Failed to initialize cURL.');
    }

    // Setel opsi cURL
    curl_setopt($ch, CURLOPT_URL, $imageUrl); // Setel URL tujuan (gambar asli)
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); // Mendapatkan data sebagai string (bukan menampilkannya langsung)
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // Ikuti redirect jika URL asli mengarahkan ke lokasi lain
    curl_setopt($ch, CURLOPT_HEADER, false); // Jangan sertakan header respons di output akhir

    // Setel timeout untuk mencegah skrip hanging jika server gambar lambat
    curl_setopt($ch, CURLOPT_TIMEOUT, 10); // Timeout 10 detik

    // Setel User-Agent agar permintaan terlihat seperti dari browser normal
    // Ini bisa membantu melewati beberapa blokir anti-bot
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36');

    // PENTING: Setel Header Referer untuk mengatasi masalah 403 Forbidden
    // Server aset (assets.suitdev.com) kemungkinan memeriksa dari mana permintaan berasal.
    // Kita menyamarkan permintaan agar terlihat berasal dari domain Suitmedia yang valid.
    curl_setopt($ch, CURLOPT_REFERER, 'https://suitdev.com');
    // Jika 'https://suitdev.com' tidak berhasil, coba juga:
    // curl_setopt($ch, CURLOPT_REFERER, 'https://suitmedia-backend.suitdev.com');

    // OPSI TERAKHIR UNTUK DEBUGGING SSL: Menonaktifkan verifikasi SSL
    // HANYA GUNAKAN UNTUK DEBUGGING LOKAL! Jangan gunakan di produksi karena TIDAK AMAN.
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // <--- PASTIKAN INI TIDAK DIKOMENTARI
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false); // <--- PASTIKAN INI TIDAK DIKOMENTARI


    // Eksekusi sesi cURL untuk mendapatkan data gambar
    $imageData = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE); // Ambil kode status HTTP dari respons
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE); // Ambil Content-Type dari respons
    $curlError = curl_error($ch); // Ambil pesan error cURL jika ada

    // Tutup sesi cURL
    curl_close($ch);

    // Periksa jika ada kesalahan selama eksekusi cURL atau respons tidak OK (bukan 200)
    if ($imageData === false || $httpCode !== 200) {
        http_response_code(500); // Setel status HTTP 500 (Internal Server Error)
        header('Content-Type: application/json'); // Respons dalam format JSON
        echo json_encode([
            'error' => 'Failed to fetch image from source.',
            'http_code' => $httpCode,
            'curl_error' => $curlError
        ]);
        exit();
    }

    // Setel header Content-Type agar browser tahu jenis file yang diterima
    // Penting: Ini memberitahu browser bahwa yang diterima adalah gambar (misalnya image/jpeg, image/png)
    if ($contentType) {
        header('Content-Type: ' . $contentType);
    } else {
        // Fallback jika Content-Type tidak terdeteksi dari cURL (jarang terjadi tapi mungkin)
        // Coba tebak Content-Type berdasarkan ekstensi file
        $extension = pathinfo($imageUrl, PATHINFO_EXTENSION);
        if ($extension === 'jpg' || $extension === 'jpeg') {
            header('Content-Type: image/jpeg');
        } elseif ($extension === 'png') {
            header('Content-Type: image/png');
        } elseif ($extension === 'gif') {
            header('Content-Type: image/gif');
        } else {
            // Default jika tidak yakin, biarkan browser menebak atau setel ke binary
            header('Content-Type: application/octet-stream');
        }
    }

    // Keluarkan data gambar mentah ke browser
    // Browser akan merender data ini sebagai gambar
    echo $imageData;

} catch (Exception $e) {
    // Tangkap semua exception PHP dan tampilkan pesan error yang lebih informatif
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'PHP Exception: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    exit();
}
?>