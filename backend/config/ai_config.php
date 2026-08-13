<?php
// backend/config/ai_config.php
// AI Configuration — Gemini API

// =====================================================
// PASTE YOUR REAL GEMINI API KEY BELOW
// Get one free at: https://aistudio.google.com/apikey
// Valid keys start with "AIzaSy"
// =====================================================
define('GEMINI_API_KEY', 'YOUR_API_KEY_HERE');

// Gemini model — gemini-3.6-flash endpoint
define('GEMINI_MODEL', 'gemini-3.6-flash');

// Gemini API URL (built from model name)
define('GEMINI_API_URL', 'https://generativelanguage.googleapis.com/v1beta/models/' . GEMINI_MODEL . ':generateContent');

// =====================================================
// API KEY VALIDATION HELPER
// =====================================================
function isGeminiKeyConfigured() {
    $key = GEMINI_API_KEY;
    if (empty($key) || $key === 'YOUR_GEMINI_API_KEY_HERE' || strlen(trim($key)) < 10) {
        return false;
    }
    return true;
}

function getKeyDiagnostic() {
    $key = GEMINI_API_KEY;
    if (empty($key) || $key === 'YOUR_GEMINI_API_KEY_HERE' || strlen(trim($key)) < 10) {
        return 'NOT_SET';
    }
    return 'KEY_PRESENT';
}
?>
