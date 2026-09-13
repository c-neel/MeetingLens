<?php
// backend/index.php
// Backend API Landing & Status Page

include_once 'config/ai_config.php';

$keyStatus = getKeyDiagnostic();
$keyConfigured = isGeminiKeyConfigured();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MeetingLens Backend API</title>
    <style>
        * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        body { background: #0f172a; color: #f8fafc; margin: 0; padding: 2rem; display: flex; justify-content: center; }
        .container { max-width: 700px; width: 100%; background: #1e293b; border-radius: 12px; padding: 2rem; border: 1px solid #334155; }
        h1 { font-size: 1.5rem; margin-top: 0; color: #38bdf8; display: flex; align-items: center; gap: 0.5rem; }
        .status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; }
        .status-ok { background: #166534; color: #4ade80; }
        .status-warn { background: #854d0e; color: #fde047; }
        .card { background: #0f172a; padding: 1rem 1.25rem; border-radius: 8px; margin-top: 1rem; border: 1px solid #334155; }
        .card h3 { margin-top: 0; margin-bottom: 0.5rem; font-size: 1rem; color: #94a3b8; }
        a { color: #38bdf8; text-decoration: none; }
        a:hover { text-decoration: underline; }
        ul { margin: 0; padding-left: 1.25rem; }
        li { margin-bottom: 0.5rem; }
        button { background: #0284c7; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
        button:hover { background: #0369a1; }
        pre { background: #0f172a; padding: 1rem; border-radius: 6px; overflow-x: auto; font-size: 0.85rem; color: #38bdf8; border: 1px solid #334155; }
    </style>
</head>
<body>
    <div class="container">
        <h1>👁️ MeetingLens Backend Server</h1>
        <p>PHP Server Status: <span class="status-badge status-ok">● Running on Port 8000</span></p>

        <div class="card">
            <h3>🤖 Gemini AI Status</h3>
            <p style="margin-bottom: 0.5rem;">Configured Model: <code><?= GEMINI_MODEL ?></code></p>
            <p>API Key Status: 
                <?php if ($keyConfigured): ?>
                    <span class="status-badge status-ok">✓ Configured (AIzaSy...)</span>
                <?php else: ?>
                    <span class="status-badge status-warn">⚠ Not Configured (Status: <?= $keyStatus ?>)</span>
                <?php endif; ?>
            </p>
            <?php if (!$keyConfigured): ?>
                <p style="font-size: 0.875rem; color: #f87171;">
                    To enable live Gemini AI, open <code>backend/config/ai_config.php</code> and paste your Gemini API key (starts with <code>AIzaSy...</code>). Get one free at <a href="https://aistudio.google.com/apikey" target="_blank">Google AI Studio</a>.
                </p>
            <?php endif; ?>
        </div>

        <div class="card">
            <h3>🔗 Available API Endpoints</h3>
            <ul>
                <li><a href="/api/test-connection.php" target="_blank">GET /api/test-connection.php</a> — Test Gemini connection & key diagnostics</li>
                <li><code>POST /api/analyze/index.php</code> — Analyze meeting transcript with Gemini AI</li>
                <li><code>GET /api/meetings/index.php</code> — List saved meetings</li>
                <li><code>GET /api/action-items/index.php</code> — List action items</li>
                <li><code>GET /api/documents/index.php</code> — List documents</li>
            </ul>
        </div>

        <div class="card">
            <h3>🧪 Quick Connection Test</h3>
            <button onclick="runTest()">Run Test Endpoint (/api/test-connection.php)</button>
            <pre id="output" style="display:none; margin-top: 1rem;"></pre>
        </div>
    </div>

    <script>
        async function runTest() {
            const out = document.getElementById('output');
            out.style.display = 'block';
            out.textContent = 'Testing connection to Gemini API...';
            try {
                const res = await fetch('/api/test-connection.php');
                const data = await res.json();
                out.textContent = JSON.stringify(data, null, 2);
            } catch (err) {
                out.textContent = 'Error: ' + err.message;
            }
        }
    </script>
</body>
</html>
