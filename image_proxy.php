<?php
error_reporting(E_ALL); 
ini_set('display_errors', '1'); 
ini_set('display_startup_errors', '1'); 

header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET, OPTIONS'); 
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200); 
    exit(0); 
}

if (!isset($_GET['url']) || empty($_GET['url'])) {
    http_response_code(400); 
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Missing image URL parameter.']);
    exit();
}

$imageUrl = $_GET['url']; 

if (!filter_var($imageUrl, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid image URL provided.']);
    exit();
}

try {   
    $ch = curl_init();
    if ($ch === false) {
        throw new Exception('Failed to initialize cURL.');
    }
    
    curl_setopt($ch, CURLOPT_URL, $imageUrl); 
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); 
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); 
    curl_setopt($ch, CURLOPT_HEADER, false); 
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);     
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36');
    curl_setopt($ch, CURLOPT_REFERER, 'https://suitdev.com');
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false); 
    $imageData = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE); 
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE); 
    $curlError = curl_error($ch); 
    curl_close($ch);
    
    if ($imageData === false || $httpCode !== 200) {
        http_response_code(500); 
        header('Content-Type: application/json'); 
        echo json_encode([
            'error' => 'Failed to fetch image from source.',
            'http_code' => $httpCode,
            'curl_error' => $curlError
        ]);
        exit();
    }

    if ($contentType) {
        header('Content-Type: ' . $contentType);
    } else {
        $extension = pathinfo($imageUrl, PATHINFO_EXTENSION);
        if ($extension === 'jpg' || $extension === 'jpeg') {
            header('Content-Type: image/jpeg');
        } elseif ($extension === 'png') {
            header('Content-Type: image/png');
        } elseif ($extension === 'gif') {
            header('Content-Type: image/gif');
        } else {            
            header('Content-Type: application/octet-stream');
        }
    }

    echo $imageData;

} catch (Exception $e) {
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