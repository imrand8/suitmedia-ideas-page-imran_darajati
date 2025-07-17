<?php
header('Content-Type: application/json'); 
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET, OPTIONS'); 
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200); 
    exit(0); 
}
$base_api_url = 'https://suitmedia-backend.suitdev.com/api/ideas';
$query_string = $_SERVER['QUERY_STRING'];
$full_api_url = $base_api_url . ($query_string ? '?' . $query_string : '');
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $full_api_url); 
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); 
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',         
]);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => 'cURL error: ' . curl_error($ch)]);
} else {
    echo $response;
}

curl_close($ch);
?>