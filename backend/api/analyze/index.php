<?php
// backend/api/analyze/index.php
// AI Meeting Analysis Endpoint — Calls Google Gemini API
// STEP-BY-STEP DIAGNOSTIC LOGGING enabled

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed. Use POST."]);
    exit;
}

include_once '../../config/ai_config.php';

// ============================================================
// STEP 1: VALIDATE API KEY
// ============================================================
$keyStatus = getKeyDiagnostic();
error_log("[ANALYZE] Gemini API key status: " . $keyStatus);
error_log("[ANALYZE] Gemini model: " . GEMINI_MODEL);

if (!isGeminiKeyConfigured()) {
    http_response_code(500);
    $msg = ($keyStatus === 'NOT_SET')
        ? 'Gemini API key is not configured. Open backend/config/ai_config.php and paste your API key (starts with AIzaSy). Get one free at https://aistudio.google.com/apikey'
        : 'Gemini API key has invalid format. Valid Google API keys start with "AIzaSy". Current key prefix: "' . substr(GEMINI_API_KEY, 0, 4) . '..."';
    echo json_encode([
        "message" => $msg,
        "error_type" => "API_KEY_" . $keyStatus,
        "api_key_found" => false,
        "fallback" => false
    ]);
    exit;
}

// ============================================================
// STEP 2: READ AND VALIDATE TRANSCRIPT
// ============================================================
$data = json_decode(file_get_contents("php://input"));

if (empty($data->transcript)) {
    http_response_code(400);
    echo json_encode(["message" => "No transcript text provided."]);
    exit;
}

$transcript = $data->transcript;
$meetingTitle = !empty($data->title) ? $data->title : 'Untitled Meeting';

// Diagnostic logging (never log API key)
error_log("[ANALYZE] Meeting title: " . $meetingTitle);
error_log("[ANALYZE] Transcript length: " . strlen($transcript) . " characters");
error_log("[ANALYZE] Transcript first 500 chars: " . substr($transcript, 0, 500));

// ============================================================
// STEP 3: BUILD GEMINI PROMPT
// ============================================================
$systemPrompt = <<<PROMPT
You are an expert meeting intelligence assistant.

Analyze ONLY the meeting transcript provided below.

CRITICAL RULES:
1. Do NOT invent information. Every fact must come from the transcript.
2. Do NOT use generic meeting language. Be specific to THIS transcript.
3. Do NOT assume facts that are not present in the transcript.
4. If information is not present, use null or "Not specified".
5. Never invent names, dates, decisions, tasks, or priorities.

INSTRUCTIONS:

1. EXECUTIVE SUMMARY: Write exactly TWO paragraphs (separated by \\n\\n).
   - Paragraph 1: The purpose of the meeting, who participated, and the main topic discussed.
   - Paragraph 2: The specific outcomes — what was decided, what commitments were made, key dates and budget figures mentioned.
   Every important statement MUST come from the transcript.

2. DECISIONS: Extract ONLY decisions that were explicitly agreed upon or clearly finalized during the meeting.
   A decision means "What did the team agree/finalize?" — NOT an action item.
   Each decision should be a specific string from the transcript.

3. ACTION ITEMS: Extract tasks that require someone to do something.
   - task: Exact description of what needs to be done
   - assignee: The person's name from the transcript, or "Unassigned" if not mentioned
   - due_date: In YYYY-MM-DD format if mentioned, or null if not
   - priority: Use ONLY what the transcript says. If they say "high priority" → "High". If they say "medium priority" → "Medium". If no priority mentioned → "Not specified"
   - confidence: 90-100 if explicitly stated, 70-89 if implied, 50-69 if uncertain
   - status: "Pending"

4. RISKS: Only include risks if the transcript discusses concerns, worries, or potential problems. Do NOT fabricate risks.

5. QUALITY SCORE: Rate 0-100 based on: Were decisions clear? Were action items assigned? Were deadlines set? Were priorities stated?

Return ONLY valid JSON with exactly this structure:
{
  "executive_summary": "Paragraph 1...\\n\\nParagraph 2...",
  "detailed_summary": "Detailed multi-paragraph summary organized by topics",
  "decisions": ["Decision 1 from transcript", "Decision 2 from transcript"],
  "action_items": [
    {
      "task": "...",
      "assignee": "...",
      "due_date": "YYYY-MM-DD or null",
      "priority": "High, Medium, Low, or Not specified",
      "confidence": 85,
      "status": "Pending"
    }
  ],
  "risks": [
    {"text": "...", "severity": "Low, Medium, High, or Critical"}
  ],
  "suggestions": [
    {"text": "...", "category": "process, resource, measurement, or collaboration"}
  ],
  "follow_ups": [
    {"text": "...", "target_date": "YYYY-MM-DD or null"}
  ],
  "ai_remarks": [
    {"text": "...", "type": "workload, missing_info, dependency, gap, or optimization"}
  ],
  "quality_score": 80,
  "next_meeting_agenda": ["Suggested agenda item 1"]
}
PROMPT;

// Build the full user message with the actual transcript
$userMessage = $systemPrompt . "\n\n--- MEETING TRANSCRIPT ---\nTitle: " . $meetingTitle . "\n\n" . $transcript . "\n--- END TRANSCRIPT ---";

$requestBody = json_encode([
    "contents" => [
        [
            "role" => "user",
            "parts" => [
                ["text" => $userMessage]
            ]
        ]
    ],
    "generationConfig" => [
        "temperature" => 0.2,
        "topP" => 0.8,
        "maxOutputTokens" => 8192,
        "responseMimeType" => "application/json"
    ]
]);

error_log("[ANALYZE] Gemini request body length: " . strlen($requestBody) . " bytes");

// ============================================================
// STEP 4: CALL GEMINI API
// ============================================================
$apiUrl = GEMINI_API_URL . '?key=' . GEMINI_API_KEY;

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $apiUrl,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $requestBody,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json'
    ],
    CURLOPT_TIMEOUT => 90,
    CURLOPT_SSL_VERIFYPEER => false
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

error_log("[ANALYZE] Gemini HTTP status: " . $httpCode);

// ============================================================
// STEP 5: HANDLE ERRORS (with specific error types)
// ============================================================
if ($curlError) {
    error_log("[ANALYZE] cURL error: " . $curlError);
    http_response_code(503);
    echo json_encode([
        "message" => "Failed to connect to Gemini API. Check your internet connection.",
        "error" => $curlError,
        "error_type" => "CONNECTION_FAILED",
        "fallback" => false
    ]);
    exit;
}

if ($httpCode !== 200) {
    $errorData = json_decode($response, true);
    $errorMsg = $errorData['error']['message'] ?? 'Unknown Gemini API error';
    $errorStatus = $errorData['error']['status'] ?? 'UNKNOWN';

    error_log("[ANALYZE] Gemini API error: HTTP $httpCode - $errorMsg");

    // Map HTTP codes to user-friendly explanations
    $errorExplanation = match($httpCode) {
        400 => "Invalid request sent to Gemini. This may be a prompt or configuration issue.",
        401, 403 => "API key authentication failed. Your key may be invalid, expired, or not authorized for this API. Get a new key at https://aistudio.google.com/apikey",
        404 => "Model '" . GEMINI_MODEL . "' not found. It may have been deprecated. Try changing GEMINI_MODEL in ai_config.php.",
        429 => "Rate limit exceeded. You've sent too many requests. Wait a minute and try again, or check your API quota at https://console.cloud.google.com/",
        500, 503 => "Gemini service is temporarily unavailable. Try again in a few seconds.",
        default => "Unexpected error from Gemini API."
    };

    http_response_code($httpCode >= 500 ? 502 : $httpCode);
    echo json_encode([
        "message" => "Gemini API Error (HTTP $httpCode): $errorExplanation",
        "error" => $errorMsg,
        "error_type" => "GEMINI_HTTP_$httpCode",
        "gemini_status" => $errorStatus,
        "http_code" => $httpCode,
        "model" => GEMINI_MODEL,
        "fallback" => false
    ]);
    exit;
}

// ============================================================
// STEP 6: PARSE GEMINI RESPONSE
// ============================================================
$geminiResponse = json_decode($response, true);

// Extract the text content from Gemini's response
$aiText = '';
if (isset($geminiResponse['candidates'][0]['content']['parts'][0]['text'])) {
    $aiText = $geminiResponse['candidates'][0]['content']['parts'][0]['text'];
}

error_log("[ANALYZE] Gemini response text length: " . strlen($aiText) . " chars");
error_log("[ANALYZE] Gemini response first 300 chars: " . substr($aiText, 0, 300));

if (empty($aiText)) {
    // Check for safety blocks
    $blockReason = $geminiResponse['candidates'][0]['finishReason'] ?? 'UNKNOWN';
    error_log("[ANALYZE] Gemini returned empty text. Finish reason: $blockReason");
    http_response_code(502);
    echo json_encode([
        "message" => "Gemini returned an empty response. Finish reason: $blockReason",
        "error_type" => "EMPTY_RESPONSE",
        "finish_reason" => $blockReason,
        "fallback" => false
    ]);
    exit;
}

// Clean up the AI response text (remove markdown code blocks if present)
$aiText = trim($aiText);
$aiText = preg_replace('/^```json\s*/i', '', $aiText);
$aiText = preg_replace('/^```\s*/i', '', $aiText);
$aiText = preg_replace('/\s*```$/', '', $aiText);

// Parse JSON
$analysisResult = json_decode($aiText, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    error_log("[ANALYZE] JSON parse error: " . json_last_error_msg());
    error_log("[ANALYZE] Raw AI text: " . substr($aiText, 0, 500));
    http_response_code(502);
    echo json_encode([
        "message" => "Gemini returned invalid JSON. The AI response could not be parsed.",
        "error_type" => "INVALID_JSON",
        "json_error" => json_last_error_msg(),
        "raw_ai_output" => $aiText,
        "fallback" => false
    ]);
    exit;
}

// ============================================================
// STEP 7: VALIDATE & FORMAT OUTPUT
// ============================================================
error_log("[ANALYZE] Successfully parsed AI response. Formatting output...");

// Ensure all required fields exist with defaults
$defaults = [
    'executive_summary' => 'No executive summary generated.',
    'detailed_summary' => '',
    'decisions' => [],
    'action_items' => [],
    'risks' => [],
    'suggestions' => [],
    'follow_ups' => [],
    'ai_remarks' => [],
    'quality_score' => 70,
    'next_meeting_agenda' => []
];

foreach ($defaults as $key => $defaultValue) {
    if (!isset($analysisResult[$key])) {
        $analysisResult[$key] = $defaultValue;
    }
}

// Ensure action items have all required fields
foreach ($analysisResult['action_items'] as &$item) {
    if (!isset($item['task'])) $item['task'] = 'Untitled task';
    if (!isset($item['assignee'])) $item['assignee'] = 'Unassigned';
    if (!isset($item['due_date'])) $item['due_date'] = null;
    if (!isset($item['priority'])) $item['priority'] = 'Not specified';
    if (!isset($item['confidence'])) $item['confidence'] = 75;
    // Map due_date to dueDate for frontend compatibility
    $item['dueDate'] = $item['due_date'];
    if (!isset($item['status'])) $item['status'] = 'Pending';
}

// Clamp quality score
$analysisResult['quality_score'] = max(0, min(100, intval($analysisResult['quality_score'])));

// Add summary field (alias for executive_summary for frontend compatibility)
$analysisResult['summary'] = $analysisResult['executive_summary'];

// Mark that this was real AI
$analysisResult['ai_powered'] = true;
$analysisResult['model'] = GEMINI_MODEL;
$analysisResult['api_key_found'] = true;

error_log("[ANALYZE] ✅ Analysis complete. Decisions: " . count($analysisResult['decisions']) . ", Action items: " . count($analysisResult['action_items']));

echo json_encode($analysisResult);
?>
