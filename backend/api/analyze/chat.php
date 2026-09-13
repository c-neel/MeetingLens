<?php
// backend/api/analyze/chat.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once __DIR__ . '/../../config/ai_config.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->user_prompt)) {
    $prompt = trim($data->user_prompt);
    $meeting_title = !empty($data->meeting_title) ? $data->meeting_title : 'Meeting';
    $summary = !empty($data->summary) ? $data->summary : '';
    $transcript = !empty($data->transcript) ? substr($data->transcript, 0, 3000) : '';
    $decisions = !empty($data->decisions) ? json_encode($data->decisions) : '[]';
    $actionItems = !empty($data->action_items) ? json_encode($data->action_items) : '[]';

    // Construct full meeting context prompt
    $systemContext = "You are MeetAI Assistant, an expert AI meeting analyst. You are answering questions about a specific meeting titled \"{$meeting_title}\".

Here is the authoritative context for this meeting:
- Title: {$meeting_title}
- Executive Summary: {$summary}
- Decisions Made: {$decisions}
- Action Items: {$actionItems}
- Transcript snippet: {$transcript}

Instructions:
1. Answer the user's question accurately using the meeting context above.
2. Provide clear, professional, actionable responses.
3. If the user asks for suggestions, follow-up email drafts, or timeline advice, generate structured, ready-to-use content.
4. Keep formatting clean with bullet points and bold headers where appropriate.";

    if (isGeminiKeyConfigured()) {
        // Prepare Gemini API payload
        $apiKey = GEMINI_API_KEY;
        $url = GEMINI_API_URL . '?key=' . $apiKey;

        $payload = array(
            "contents" => array(
                array(
                    "role" => "user",
                    "parts" => array(
                        array("text" => $systemContext . "\n\nUser Question: " . $prompt)
                    )
                )
            ),
            "generationConfig" => array(
                "temperature" => 0.4,
                "maxOutputTokens" => 1024
            )
        );

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200) {
            $result = json_decode($response, true);
            $reply = isset($result['candidates'][0]['content']['parts'][0]['text']) 
                ? $result['candidates'][0]['content']['parts'][0]['text'] 
                : "Unable to generate AI reply.";

            http_response_code(200);
            echo json_encode(array(
                "success" => true,
                "reply" => $reply,
                "ai_powered" => true
            ));
            exit();
        }
    }

    // Heuristic fallback if Gemini API is unreachable or offline
    $fallbackReply = "Based on the meeting **\"{$meeting_title}\"**:\n\n";
    if (stripos($prompt, 'decision') !== false) {
        $fallbackReply .= "The key decisions extracted were:\n" . $decisions;
    } elseif (stripos($prompt, 'task') !== false || stripos($prompt, 'assign') !== false) {
        $fallbackReply .= "The action items identified in this meeting are:\n" . $actionItems;
    } elseif (stripos($prompt, 'email') !== false) {
        $fallbackReply .= "Subject: Follow-up regarding {$meeting_title}\n\nHi Team,\n\nHere is a quick summary of our recent meeting:\n{$summary}\n\nPlease review your assigned action items.\n\nBest regards,\nMeetAI Assistant";
    } else {
        $fallbackReply .= "Summary: {$summary}\n\nFeel free to ask about specific decisions, action items, or recommendations for this meeting.";
    }

    http_response_code(200);
    echo json_encode(array(
        "success" => true,
        "reply" => $fallbackReply,
        "ai_powered" => false
    ));
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "User prompt is required."));
}
