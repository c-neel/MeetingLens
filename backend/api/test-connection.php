<?php
// backend/api/test-connection.php
// Gemini API Connection Test Endpoint
// Tests that the configured API key and model work.

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once __DIR__ . '/../config/ai_config.php';

$keyDiagnostic = getKeyDiagnostic();
$keyConfigured = isGeminiKeyConfigured();

error_log("[TEST-GEMINI] API key status: " . $keyDiagnostic);
error_log("[TEST-GEMINI] Model: " . GEMINI_MODEL);

// If key is not configured, return immediately
if (!$keyConfigured) {
    echo json_encode([
        "success" => false,
        "message" => "Gemini API key is not configured or has invalid format.",
        "api_key_found" => false,
        "api_key_status" => $keyDiagnostic,
        "model" => GEMINI_MODEL,
        "instructions" => "Open backend/config/ai_config.php and paste your Gemini API key (starts with AIzaSy). Get one free at https://aistudio.google.com/apikey"
    ]);
    exit;
}

// Send a simple test request to Gemini
$requestBody = json_encode([
    "contents" => [
        [
            "role" => "user",
            "parts" => [["text" => "Reply with exactly this text and nothing else: GEMINI_CONNECTION_OK"]]
        ]
    ],
    "generationConfig" => [
        "temperature" => 0.0,
        "maxOutputTokens" => 1024
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
    CURLOPT_TIMEOUT => 30,
    CURLOPT_SSL_VERIFYPEER => false
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

error_log("[TEST-GEMINI] HTTP status: " . $httpCode);

if ($curlError) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to connect to Gemini API: " . $curlError,
        "api_key_found" => true,
        "api_key_status" => $keyDiagnostic,
        "model" => GEMINI_MODEL,
        "error_type" => "CONNECTION_FAILED",
        "http_code" => 0
    ]);
    exit;
}

if ($httpCode !== 200) {
    $errorData = json_decode($response, true);
    $errorMsg = $errorData['error']['message'] ?? 'Unknown error';
    
    $explanation = match($httpCode) {
        400 => "Bad request. Check the model name in ai_config.php.",
        401, 403 => "API key rejected. Key may be invalid, expired, or not authorized. Get a new key at https://aistudio.google.com/apikey",
        404 => "Model '" . GEMINI_MODEL . "' not found. Try 'gemini-2.0-flash' or 'gemini-1.5-flash'.",
        429 => "Rate limit exceeded. Wait a minute and try again.",
        500, 503 => "Gemini service temporarily unavailable.",
        default => "Unexpected HTTP status."
    };

    echo json_encode([
        "success" => false,
        "message" => "Gemini API returned HTTP $httpCode: $explanation",
        "error" => $errorMsg,
        "api_key_found" => true,
        "api_key_status" => $keyDiagnostic,
        "model" => GEMINI_MODEL,
        "error_type" => "GEMINI_HTTP_$httpCode",
        "http_code" => $httpCode
    ]);
    exit;
}

// Parse response
$geminiResponse = json_decode($response, true);
$aiText = '';
if (!empty($geminiResponse['candidates'][0]['content']['parts'])) {
    foreach ($geminiResponse['candidates'][0]['content']['parts'] as $part) {
        if (!empty($part['text'])) {
            $aiText .= $part['text'];
        }
    }
}
$aiText = trim($aiText);

$isOk = ($httpCode === 200 && !empty($aiText));

error_log("[TEST-GEMINI] Response: " . $aiText);
error_log("[TEST-GEMINI] Connection OK: " . ($isOk ? "YES" : "NO"));

echo json_encode([
    "success" => $isOk,
    "message" => "GEMINI_CONNECTION_OK",
    "api_key_found" => true,
    "api_key_status" => "OK",
    "model" => GEMINI_MODEL,
    "http_code" => $httpCode,
    "gemini_response" => $aiText
]);
?>
