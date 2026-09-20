<?php
// backend/api/analyze/cleaner.php
// Dedicated Review & Sanitization Engine for AI Meeting Summaries

/**
 * Reviews and cleans generated meeting summaries to remove explicit, inappropriate,
 * unwanted, or irrelevant content while strictly preserving all important meeting information
 * (key decisions, action items, deadlines, names, responsibilities, requirements, and conclusions).
 *
 * @param string $execSummary
 * @param string $detailedSummary
 * @param callable|null $callGeminiCallback
 * @return array ['executive_summary' => string, 'detailed_summary' => string]
 */
function reviewAndCleanSummary($execSummary, $detailedSummary, $callGeminiCallback = null) {
    if (empty(trim($execSummary)) && empty(trim($detailedSummary))) {
        return [
            'executive_summary' => $execSummary,
            'detailed_summary' => $detailedSummary
        ];
    }

    // Step 1: Rule-based local cleaning (fast deterministic pass)
    $cleanedExec = localCleanText($execSummary);
    $cleanedDetailed = localCleanText($detailedSummary);

    // Step 2: AI Review Pass (if Gemini callback is available)
    if (is_callable($callGeminiCallback) && defined('GEMINI_API_KEY') && !empty(GEMINI_API_KEY)) {
        try {
            $reviewPrompt = <<<PROMPT
You are a content review and sanitization assistant for meeting intelligence.

TASK:
Review the meeting summary text below and perform the MINIMUM NECESSARY edits to identify and remove ONLY explicit, inappropriate, unwanted, or irrelevant content.

STRICT CONSTRAINTS:
1. Do NOT remove, alter, or oversimplify important information:
   - Key decisions
   - Action items and tasks
   - Deadlines and dates
   - Names and responsibilities
   - Technical/business requirements
   - Conclusions or key discussion points
   - Relevant meeting context
2. Make MINIMUM NECESSARY changes. If a sentence contains both important and unwanted content, remove ONLY the unwanted portion while keeping the important information intact.
3. Clean the summary — do NOT shorten or summarize it unnecessarily.
4. STRUCTURED FORMAT PRESERVATION: Keep the existing structured format with **bold section headers** and • bullet points. Preserve double line breaks (\\n\\n) between sections. Do NOT merge sections into a single wall of text. Do NOT remove section headers or convert bullet points to paragraphs.
5. Return ONLY valid JSON with structure:
{
  "executive_summary": "**Section Header**\\n• Cleaned bullet 1...\\n• Cleaned bullet 2...\\n\\n**Section Header**\\n• Cleaned bullet...",
  "detailed_summary": "**Section Header**\\n• Cleaned bullet 1...\\n\\n**Section Header**\\n• Cleaned bullet..."
}

TEXT TO REVIEW:
Executive Summary:
$cleanedExec

Detailed Summary:
$cleanedDetailed
PROMPT;

            $requestBody = json_encode([
                "contents" => [
                    ["role" => "user", "parts" => [["text" => $reviewPrompt]]]
                ],
                "generationConfig" => [
                    "temperature" => 0.1,
                    "maxOutputTokens" => 4096,
                    "responseMimeType" => "application/json"
                ]
            ]);

            $modelChain = defined('GEMINI_MODEL_CHAIN') && is_array(GEMINI_MODEL_CHAIN)
                ? GEMINI_MODEL_CHAIN
                : ['gemini-3.6-flash', 'gemini-3.5-flash'];

            foreach ($modelChain as $modelCandidate) {
                $targetUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' . $modelCandidate . ':generateContent?key=' . GEMINI_API_KEY;
                list($aiRes, $code, $err) = $callGeminiCallback($targetUrl, $requestBody);

                if ($code === 200 && !empty($aiRes)) {
                    $jsonRes = json_decode($aiRes, true);
                    $text = $jsonRes['candidates'][0]['content']['parts'][0]['text'] ?? '';
                    if (!empty($text)) {
                        if (preg_match('/```(?:json)?\s*([\s\S]*?)\s*```/i', $text, $match)) {
                            $text = trim($match[1]);
                        }
                        $reviewOutput = json_decode($text, true);
                        if (is_array($reviewOutput) && !empty($reviewOutput['executive_summary'])) {
                            error_log("[CLEANER] AI summary review completed successfully using $modelCandidate.");
                            return [
                                'executive_summary' => trim($reviewOutput['executive_summary']),
                                'detailed_summary' => !empty($reviewOutput['detailed_summary']) ? trim($reviewOutput['detailed_summary']) : trim($reviewOutput['executive_summary'])
                            ];
                        }
                    }
                }
            }
        } catch (Throwable $e) {
            error_log("[CLEANER] Exception during AI summary review: " . $e->getMessage());
        }
    }

    // Return locally cleaned version if AI pass skipped or failed
    return [
        'executive_summary' => $cleanedExec,
        'detailed_summary' => $cleanedDetailed
    ];
}

/**
 * Performs minimum necessary local cleaning on text to strip out explicit/inappropriate content
 * and unwanted fillers while leaving sentences, names, tasks, decisions, and dates intact.
 *
 * @param string $text
 * @return string
 */
function localCleanText($text) {
    if (empty($text) || !is_string($text)) {
        return '';
    }

    // List of explicit / offensive / unwanted patterns to sanitize
    $unwantedPatterns = [
        '/\b(fuck(?:ing|er|ed)?|shit(?:ty|ting)?|damn|asshole|bitch|bastard|crap)\b/i' => '[removed]',
        '/\b(off-record banter|explicit rant|inappropriate comment|unrelated side conversation)\b/i' => '',
        '/\s+/' => ' '
    ];

    $cleaned = $text;
    foreach ($unwantedPatterns as $pattern => $replacement) {
        $cleaned = preg_replace($pattern, $replacement, $cleaned);
    }

    // Clean up empty lines or double spaces
    $cleaned = preg_replace('/[ \t]+/', ' ', $cleaned);
    $cleaned = preg_replace('/\n\s*\n/', "\n\n", $cleaned);

    return trim($cleaned);
}
