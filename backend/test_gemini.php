<?php
include_once 'config/ai_config.php';

$requestBody = json_encode([
    "contents" => [
        ["role" => "user", "parts" => [["text" => "Respond with a simple JSON object: {\"status\":\"ok\"}"]]]
    ],
    "generationConfig" => [
        "temperature" => 0.1,
        "responseMimeType" => "application/json"
    ]
]);

$apiUrl = GEMINI_API_URL . '?key=' . GEMINI_API_KEY;

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $apiUrl,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $requestBody,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_SSL_VERIFYPEER => false
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "cURL Error: $curlError\n";
echo "Response: $response\n";
?>
