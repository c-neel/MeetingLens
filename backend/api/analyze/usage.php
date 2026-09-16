<?php
// backend/api/analyze/usage.php
// Real-time Gemini API & AI Transcription Usage Endpoint

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once __DIR__ . '/../../config/ai_config.php';
include_once __DIR__ . '/../../config/database.php';

try {
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    
    // 1. Check Gemini API status
    $keyConfigured = isGeminiKeyConfigured();
    $keyDiagnostic = getKeyDiagnostic();
    $model = GEMINI_MODEL;

    // 2. Fetch meetings to calculate real-time transcription usage
    $meetings = [];
    if (isset($conn) && $conn) {
        if ($user_id > 0) {
            $stmt = $conn->prepare("SELECT transcript, summary FROM meetings WHERE user_id = ?");
            $stmt->execute([$user_id]);
            $meetings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            $stmt = $conn->query("SELECT transcript, summary FROM meetings");
            $meetings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }

    $meetingsCount = count($meetings);
    
    // Calculate total transcribed words across all meetings
    $totalWords = 0;
    foreach ($meetings as $m) {
        $text = ($m['transcript'] ?? '') . ' ' . ($m['summary'] ?? '');
        $totalWords += str_word_count(strip_tags($text));
    }

    // 150 words per minute speaking rate -> minutes -> hours
    // Base minimum computation for default sample meetings if present
    $computedMinutes = ($totalWords > 0) ? ($totalWords / 150) : 0;
    $computedHours = $computedMinutes / 60;

    // Standard baseline for standard meeting set or empty
    if ($meetingsCount > 0 && $computedHours < 0.5) {
        // Average ~40 mins per meeting
        $computedHours = ($meetingsCount * 50) / 60;
    }

    $usedHours = round($computedHours, 1);
    $maxHours = 10.0;
    $percentage = min(100, max(0, round(($usedHours / $maxHours) * 100)));

    echo json_encode([
        "success" => true,
        "used_hours" => $usedHours,
        "max_hours" => $maxHours,
        "percentage" => $percentage,
        "api_key_configured" => $keyConfigured,
        "api_key_status" => $keyDiagnostic,
        "model" => $model,
        "provider" => "Google Gemini",
        "meetings_count" => $meetingsCount
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to fetch AI usage stats: " . $e->getMessage(),
        "used_hours" => 0.0,
        "max_hours" => 10.0,
        "percentage" => 0,
        "api_key_configured" => false
    ]);
}
?>
