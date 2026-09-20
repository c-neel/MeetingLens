<?php
// backend/api/analyze/index.php
// AI Meeting Analysis Endpoint — Calls Google Gemini API
// Hardened with strict JSON output, error buffering, and fallback model support

// Prevent any PHP warnings/notices from corrupting the JSON response stream
ini_set('display_errors', '0');
error_reporting(E_ALL);

// Extend maximum execution time for multi-pass AI generation and review (180s)
@set_time_limit(180);
@ini_set('max_execution_time', '180');

// Buffer all output so that accidental whitespace or warnings never leak before headers
ob_start();

// Catch fatal errors and output clean JSON with HTTP 500
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR])) {
        if (ob_get_level() > 0) {
            ob_clean();
        }
        if (!headers_sent()) {
            http_response_code(500);
            header("Content-Type: application/json; charset=UTF-8");
            header("Access-Control-Allow-Origin: *");
        }
        echo json_encode([
            "message" => "Backend execution error: " . $error['message'],
            "error_type" => "PHP_FATAL_ERROR",
            "file" => basename($error['file']),
            "line" => $error['line'],
            "fallback" => false
        ]);
        exit;
    }
});

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if (ob_get_level() > 0) ob_clean();
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    if (ob_get_level() > 0) ob_clean();
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed. Use POST."]);
    exit;
}

try {
    include_once __DIR__ . '/../../config/ai_config.php';
    include_once __DIR__ . '/cleaner.php';

    // ============================================================
    // STEP 1: VALIDATE API KEY
    // ============================================================
    $keyStatus = getKeyDiagnostic();
    error_log("[ANALYZE] Gemini API key status: " . $keyStatus);
    error_log("[ANALYZE] Gemini model: " . GEMINI_MODEL);

    if (!isGeminiKeyConfigured()) {
        if (ob_get_level() > 0) ob_clean();
        http_response_code(500);
        $msg = ($keyStatus === 'NOT_SET')
            ? 'Gemini API key is not configured. Open backend/config/ai_config.php and paste your API key. Get one free at https://aistudio.google.com/apikey'
            : 'Gemini API key appears invalid. Current key prefix: "' . substr(GEMINI_API_KEY, 0, 4) . '..."';
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
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput);

    if (!$data || !is_object($data) || empty($data->transcript)) {
        if (ob_get_level() > 0) ob_clean();
        http_response_code(400);
        echo json_encode([
            "message" => "No transcript text provided or invalid JSON payload.",
            "error_type" => "INVALID_PAYLOAD"
        ]);
        exit;
    }

    // Clean and ensure valid UTF-8
    $transcript = mb_convert_encoding((string)$data->transcript, 'UTF-8', 'UTF-8');
    $meetingTitle = !empty($data->title) ? mb_convert_encoding((string)$data->title, 'UTF-8', 'UTF-8') : 'Untitled Meeting';

    // Diagnostic logging
    error_log("[ANALYZE] Meeting title: " . $meetingTitle);
    error_log("[ANALYZE] Transcript length: " . strlen($transcript) . " characters");

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
6. CONTENT CLEANING & SANITIZATION: After generating the meeting summary, review the summary for explicit, inappropriate, irrelevant, or unwanted content. Remove only content that is clearly unnecessary, explicit, inappropriate, or unrelated to the meeting. Do NOT remove, alter, or oversimplify important information, including key decisions, tasks, deadlines, responsibilities, names, requirements, conclusions, or important discussion points. Preserve the original meaning and context of the summary. If a sentence contains both important and unwanted information, remove only the unwanted portion while keeping the important information intact.
7. STRUCTURED SUMMARY FORMAT: Return summaries in a clean structured format using section headers and bullet points for readability. Use the format: **Section Title** followed by bullet points starting with • on new lines. Separate sections with double line breaks (\n\n).

INSTRUCTIONS:

1. EXECUTIVE SUMMARY: Write a well-structured summary divided into clearly labeled sections. Use the following format with **bold section headers** and • bullet points:

   **Meeting Overview**
   • Purpose of the meeting and participants
   • Core discussion focus

   **Key Discussions & Updates**
   • Key progress reports and status updates (each as a separate bullet)
   • Technical decisions or project updates

   **Outcomes & Next Steps**
   • Decisions made and deadlines set (each as a separate bullet)
   • Immediate action items and responsibilities

   Keep each bullet concise (1-2 sentences max). Every statement MUST come from the transcript.
   Review and clean the summary to filter out any explicit, inappropriate, or irrelevant content while preserving all critical context, decisions, tasks, deadlines, and responsibilities.

2. DETAILED SUMMARY: Write a comprehensive, well-structured summary using **bold section headers** and • bullet points. Group related discussion points under logical section headers. Each bullet should cover one distinct point. Separate sections with double line breaks (\n\n).

3. DECISIONS: Extract ONLY decisions that were explicitly agreed upon or clearly finalized during the meeting.
   A decision means "What did the team agree/finalize?" — NOT an action item.
   Return as an array of clear strings.

4. ACTION ITEMS: Extract tasks that require someone to do something.
   - task: Exact description of what needs to be done
   - assignee: Always set to "-" (Do NOT assign any person's name automatically. All tasks must remain unassigned as "-" until the user explicitly assigns or delegates them).
   - due_date: In YYYY-MM-DD format if mentioned, or null if not
   - priority: Use ONLY what the transcript says. If "high priority" -> "High". If "medium" -> "Medium". Otherwise "Not specified"
   - confidence: 90-100 if explicitly stated, 70-89 if implied, 50-69 if uncertain
   - status: "Pending"

5. RISKS: Only include risks if the transcript discusses concerns, worries, or potential problems. Do NOT fabricate risks.

6. QUALITY SCORE: Rate 0-100 based on: Were decisions clear? Were action items assigned? Were deadlines set? Were priorities stated?

Return ONLY valid JSON with exactly this structure:
{
  "executive_summary": "**Meeting Overview**\\n• Purpose and participants...\\n• Core focus...\\n\\n**Key Discussions & Updates**\\n• Update 1...\\n• Update 2...\\n\\n**Outcomes & Next Steps**\\n• Decision 1...\\n• Next step 1...",
  "detailed_summary": "**Topic 1**\\n• Detail point 1...\\n• Detail point 2...\\n\\n**Topic 2**\\n• Detail point 1...",
  "decisions": ["Decision 1 from transcript", "Decision 2 from transcript"],
  "action_items": [
    {
      "task": "...",
      "assignee": "-",
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

    // Helper to perform curl request to Gemini
    $callGemini = function($url) use ($requestBody) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $requestBody,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT => 90,
            CURLOPT_SSL_VERIFYPEER => false
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        return [$response, $httpCode, $curlError];
    };

    // ============================================================
    // STEP 4: CALL GEMINI API (with automatic retry & model chain failover)
    // ============================================================
    $modelChain = defined('GEMINI_MODEL_CHAIN') && is_array(GEMINI_MODEL_CHAIN)
        ? GEMINI_MODEL_CHAIN
        : [GEMINI_MODEL, 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];

    $response = null;
    $httpCode = 0;
    $curlError = '';
    $activeModel = GEMINI_MODEL;
    $success = false;

    foreach ($modelChain as $modelCandidate) {
        $targetUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' . $modelCandidate . ':generateContent?key=' . GEMINI_API_KEY;

        // Up to 2 attempts per model (initial + 1 retry on 503/429)
        for ($attempt = 1; $attempt <= 2; $attempt++) {
            error_log("[ANALYZE] Attempting Gemini model $modelCandidate (Attempt $attempt)");
            list($response, $httpCode, $curlError) = $callGemini($targetUrl);

            if ($httpCode === 200) {
                $activeModel = $modelCandidate;
                $success = true;
                break 2; // Success! Break out of both retry loop and model chain
            }

            // If 503 (high demand) or 429 (rate limit), wait 500ms before retrying or failing over
            if ($httpCode === 503 || $httpCode === 429) {
                error_log("[ANALYZE] Model $modelCandidate returned HTTP $httpCode on attempt $attempt");
                if ($attempt < 2) {
                    usleep(500000); // 500ms pause before retry
                }
            } else {
                // For non-retryable errors like 400, 401, 403, don't retry same model
                break;
            }
        }
    }

    if ($curlError && !$success) {
        error_log("[ANALYZE] cURL error: " . $curlError);
        if (ob_get_level() > 0) ob_clean();
        http_response_code(503);
        echo json_encode([
            "message" => "Failed to connect to Gemini API. Check your network connection.",
            "error" => $curlError,
            "error_type" => "CONNECTION_FAILED",
            "fallback" => false
        ]);
        exit;
    }

    if (!$success || $httpCode !== 200) {
        $errorData = json_decode($response, true);
        $errorMsg = $errorData['error']['message'] ?? 'Unknown Gemini API error';
        $errorStatus = $errorData['error']['status'] ?? 'UNKNOWN';

        error_log("[ANALYZE] Gemini API error across all models: HTTP $httpCode - $errorMsg");

        $errorExplanation = match($httpCode) {
            400 => "Invalid request sent to Gemini. Check your prompt or configuration.",
            401, 403 => "API key authentication failed. Your key may be invalid or expired.",
            404 => "Model '$activeModel' not found. It may have been deprecated.",
            429 => "Rate limit exceeded. Too many requests have been sent. Please wait a minute and retry.",
            500, 503 => "Gemini models are currently experiencing high demand. Please retry in a few seconds.",
            default => "Unexpected error from Gemini API."
        };

        if (ob_get_level() > 0) ob_clean();
        http_response_code($httpCode >= 500 ? 502 : $httpCode);
        echo json_encode([
            "message" => "Gemini API Error (HTTP $httpCode): $errorExplanation",
            "error" => $errorMsg,
            "error_type" => "GEMINI_HTTP_$httpCode",
            "gemini_status" => $errorStatus,
            "http_code" => $httpCode,
            "model" => $activeModel,
            "fallback" => false
        ]);
        exit;
    }

    // ============================================================
    // STEP 6: EXTRACT & PARSE GEMINI RESPONSE TEXT
    // ============================================================
    $geminiResponse = json_decode($response, true);
    $aiText = '';

    // Search across all parts for the model's text response (handles thinking mode)
    if (!empty($geminiResponse['candidates'][0]['content']['parts'])) {
        foreach ($geminiResponse['candidates'][0]['content']['parts'] as $part) {
            if (!empty($part['text'])) {
                // If this part contains a JSON structure, prioritize it
                if (str_contains($part['text'], '{')) {
                    $aiText = $part['text'];
                    break;
                }
                if (empty($aiText)) {
                    $aiText = $part['text'];
                }
            }
        }
    }

    $aiText = trim($aiText);

    if (empty($aiText)) {
        $blockReason = $geminiResponse['candidates'][0]['finishReason'] ?? 'UNKNOWN';
        error_log("[ANALYZE] Gemini returned empty text. Finish reason: $blockReason");
        if (ob_get_level() > 0) ob_clean();
        http_response_code(502);
        echo json_encode([
            "message" => "Gemini returned an empty response. Finish reason: $blockReason",
            "error_type" => "EMPTY_RESPONSE",
            "finish_reason" => $blockReason,
            "fallback" => false
        ]);
        exit;
    }

    // Strip markdown code fences if present (e.g. ```json ... ```)
    if (preg_match('/```(?:json)?\s*([\s\S]*?)\s*```/i', $aiText, $fenceMatch)) {
        $aiText = trim($fenceMatch[1]);
    }

    // If still not clean JSON, extract from first '{' to last '}'
    if (!str_starts_with($aiText, '{')) {
        $firstBrace = strpos($aiText, '{');
        $lastBrace = strrpos($aiText, '}');
        if ($firstBrace !== false && $lastBrace !== false && $lastBrace > $firstBrace) {
            $aiText = substr($aiText, $firstBrace, $lastBrace - $firstBrace + 1);
        }
    }

    $analysisResult = json_decode($aiText, true);

    if (json_last_error() !== JSON_ERROR_NONE || !is_array($analysisResult)) {
        error_log("[ANALYZE] JSON parse error: " . json_last_error_msg());
        error_log("[ANALYZE] Raw AI text: " . substr($aiText, 0, 500));
        if (ob_get_level() > 0) ob_clean();
        http_response_code(502);
        echo json_encode([
            "message" => "Gemini returned text that could not be parsed as JSON.",
            "error_type" => "INVALID_JSON",
            "json_error" => json_last_error_msg(),
            "raw_ai_output" => substr($aiText, 0, 500),
            "fallback" => false
        ]);
        exit;
    }

    // ============================================================
    // STEP 7: DEFENSIVE NORMALIZATION (Never throws PHP TypeError)
    // ============================================================
    
    // Executive summary
    $execSummary = '';
    if (!empty($analysisResult['executive_summary']) && is_string($analysisResult['executive_summary'])) {
        $execSummary = $analysisResult['executive_summary'];
    } elseif (!empty($analysisResult['summary']) && is_string($analysisResult['summary'])) {
        $execSummary = $analysisResult['summary'];
    } else {
        $execSummary = 'No executive summary generated.';
    }

    // Detailed summary
    $detailedSummary = (!empty($analysisResult['detailed_summary']) && is_string($analysisResult['detailed_summary']))
        ? $analysisResult['detailed_summary']
        : $execSummary;

    // STEP 7.5: Pass generated summary through dedicated review & cleaning engine
    // Removes explicit, inappropriate, unwanted, or irrelevant content with minimum necessary edits,
    // while strictly preserving all key decisions, tasks, deadlines, responsibilities, and context.
    $cleanedSummaryPair = reviewAndCleanSummary($execSummary, $detailedSummary, function($url, $body) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => false
        ]);
        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);
        return [$res, $code, $err];
    });

    $execSummary = $cleanedSummaryPair['executive_summary'];
    $detailedSummary = $cleanedSummaryPair['detailed_summary'];

    // Decisions (safely convert string or object array to flat array of strings)
    $cleanDecisions = [];
    if (!empty($analysisResult['decisions'])) {
        if (is_string($analysisResult['decisions'])) {
            $cleanDecisions = [trim($analysisResult['decisions'])];
        } elseif (is_array($analysisResult['decisions'])) {
            foreach ($analysisResult['decisions'] as $d) {
                if (is_string($d) && trim($d) !== '') {
                    $cleanDecisions[] = trim($d);
                } elseif (is_array($d)) {
                    $dText = $d['decision'] ?? $d['decision_text'] ?? $d['text'] ?? json_encode($d);
                    $cleanDecisions[] = (string)$dText;
                }
            }
        }
    }

    // Action items (safely handle strings, missing keys, and invalid formats)
    $cleanActionItems = [];
    if (!empty($analysisResult['action_items'])) {
        if (is_array($analysisResult['action_items'])) {
            foreach ($analysisResult['action_items'] as $item) {
                if (is_string($item) && trim($item) !== '') {
                    $cleanActionItems[] = [
                        'task' => trim($item),
                        'assignee' => '-',
                        'due_date' => null,
                        'dueDate' => null,
                        'priority' => 'Not specified',
                        'confidence' => 75,
                        'status' => 'Pending'
                    ];
                } elseif (is_array($item)) {
                    $task = !empty($item['task']) ? (string)$item['task'] : (!empty($item['description']) ? (string)$item['description'] : 'Untitled task');
                    $dueDate = !empty($item['due_date']) ? (string)$item['due_date'] : (!empty($item['dueDate']) ? (string)$item['dueDate'] : null);
                    $priority = !empty($item['priority']) ? (string)$item['priority'] : 'Not specified';
                    $confidence = (isset($item['confidence']) && is_numeric($item['confidence'])) ? intval($item['confidence']) : 75;
                    $status = !empty($item['status']) ? (string)$item['status'] : 'Pending';

                    $cleanActionItems[] = [
                        'task' => $task,
                        'assignee' => '-',
                        'due_date' => $dueDate,
                        'dueDate' => $dueDate,
                        'priority' => $priority,
                        'confidence' => $confidence,
                        'status' => $status
                    ];
                }
            }
        }
    }

    // Risks
    $cleanRisks = [];
    if (!empty($analysisResult['risks']) && is_array($analysisResult['risks'])) {
        foreach ($analysisResult['risks'] as $r) {
            if (is_string($r) && trim($r) !== '') {
                $cleanRisks[] = ['text' => trim($r), 'severity' => 'Medium'];
            } elseif (is_array($r)) {
                $cleanRisks[] = [
                    'text' => (string)($r['text'] ?? $r['risk_text'] ?? $r['risk'] ?? ''),
                    'severity' => (string)($r['severity'] ?? 'Medium')
                ];
            }
        }
    }

    // Suggestions
    $cleanSuggestions = [];
    if (!empty($analysisResult['suggestions']) && is_array($analysisResult['suggestions'])) {
        foreach ($analysisResult['suggestions'] as $s) {
            if (is_string($s) && trim($s) !== '') {
                $cleanSuggestions[] = ['text' => trim($s), 'category' => 'process'];
            } elseif (is_array($s)) {
                $cleanSuggestions[] = [
                    'text' => (string)($s['text'] ?? $s['suggestion_text'] ?? ''),
                    'category' => (string)($s['category'] ?? 'process')
                ];
            }
        }
    }

    // Follow ups
    $cleanFollowUps = [];
    if (!empty($analysisResult['follow_ups']) && is_array($analysisResult['follow_ups'])) {
        foreach ($analysisResult['follow_ups'] as $f) {
            if (is_string($f) && trim($f) !== '') {
                $cleanFollowUps[] = ['text' => trim($f), 'target_date' => null];
            } elseif (is_array($f)) {
                $cleanFollowUps[] = [
                    'text' => (string)($f['text'] ?? $f['follow_up_text'] ?? ''),
                    'target_date' => $f['target_date'] ?? null
                ];
            }
        }
    }

    // AI remarks
    $cleanAiRemarks = [];
    if (!empty($analysisResult['ai_remarks']) && is_array($analysisResult['ai_remarks'])) {
        foreach ($analysisResult['ai_remarks'] as $rem) {
            if (is_string($rem) && trim($rem) !== '') {
                $cleanAiRemarks[] = ['text' => trim($rem), 'type' => 'optimization'];
            } elseif (is_array($rem)) {
                $cleanAiRemarks[] = [
                    'text' => (string)($rem['text'] ?? $rem['remark_text'] ?? ''),
                    'type' => (string)($rem['type'] ?? $rem['remark_type'] ?? 'optimization')
                ];
            }
        }
    }

    // Quality score
    $qualityScore = 75;
    if (isset($analysisResult['quality_score']) && is_numeric($analysisResult['quality_score'])) {
        $qualityScore = max(0, min(100, intval($analysisResult['quality_score'])));
    }

    // Next meeting agenda
    $agenda = [];
    if (!empty($analysisResult['next_meeting_agenda']) && is_array($analysisResult['next_meeting_agenda'])) {
        foreach ($analysisResult['next_meeting_agenda'] as $ag) {
            if (is_string($ag) && trim($ag) !== '') {
                $agenda[] = trim($ag);
            }
        }
    }

    $finalPayload = [
        'executive_summary' => $execSummary,
        'detailed_summary' => $detailedSummary,
        'summary' => $execSummary,
        'decisions' => $cleanDecisions,
        'action_items' => $cleanActionItems,
        'risks' => $cleanRisks,
        'suggestions' => $cleanSuggestions,
        'follow_ups' => $cleanFollowUps,
        'ai_remarks' => $cleanAiRemarks,
        'quality_score' => $qualityScore,
        'next_meeting_agenda' => $agenda,
        'ai_powered' => true,
        'model' => $activeModel,
        'api_key_found' => true
    ];

    error_log("[ANALYZE] Analysis complete. Decisions: " . count($cleanDecisions) . ", Action items: " . count($cleanActionItems));

    // Clear any potential buffer and output valid JSON
    if (ob_get_level() > 0) {
        ob_clean();
    }
    http_response_code(200);
    echo json_encode($finalPayload);
    exit;

} catch (Throwable $e) {
    error_log("[ANALYZE] Fatal exception caught: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    if (ob_get_level() > 0) {
        ob_clean();
    }
    http_response_code(500);
    echo json_encode([
        "message" => "An internal server error occurred while analyzing the meeting.",
        "error_type" => "SERVER_EXCEPTION",
        "error" => $e->getMessage(),
        "fallback" => false
    ]);
    exit;
}
