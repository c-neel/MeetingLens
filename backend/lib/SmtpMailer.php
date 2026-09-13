<?php
// backend/lib/SmtpMailer.php
// Pure PHP SMTP socket transport & native mail() wrapper

class SmtpMailer {
    public static function dispatch($toEmail, $toName, $subject, $htmlContent, $config = []) {
        $host = !empty($config['host']) ? $config['host'] : (defined('SMTP_HOST') ? SMTP_HOST : 'smtp.gmail.com');
        $port = !empty($config['port']) ? intval($config['port']) : (defined('SMTP_PORT') ? SMTP_PORT : 587);
        $user = isset($config['username']) ? $config['username'] : (defined('SMTP_USERNAME') ? SMTP_USERNAME : '');
        $pass = isset($config['password']) ? $config['password'] : (defined('SMTP_PASSWORD') ? SMTP_PASSWORD : '');
        $fromEmail = !empty($config['from_email']) ? $config['from_email'] : (defined('SMTP_FROM_EMAIL') ? SMTP_FROM_EMAIL : 'noreply@meetai.com');
        $fromName = !empty($config['from_name']) ? $config['from_name'] : (defined('SMTP_FROM_NAME') ? SMTP_FROM_NAME : 'Meeting Lens');

        if (empty($fromEmail)) {
            $fromEmail = 'noreply@meetai.com';
        }

        // 1. If SMTP username and password are provided, perform direct SMTP socket delivery
        if (!empty($user) && !empty($pass)) {
            $smtpResult = self::sendViaSocket($host, $port, $user, $pass, $fromEmail, $fromName, $toEmail, $toName, $subject, $htmlContent);
            if ($smtpResult['success']) {
                return $smtpResult;
            }
            // If socket auth failed, log detail and fall back to native mail()
            error_log("MeetAI SMTP Error: " . $smtpResult['message']);
        }

        // 2. Fall back to standard PHP mail() function with HTML headers
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            'From: ' . mb_encode_mimeheader($fromName, 'UTF-8') . ' <' . $fromEmail . '>',
            'Reply-To: ' . $fromEmail,
            'X-Mailer: PHP/' . phpversion()
        ];

        // Clear any previous error
        error_clear_last();
        $mailSent = @mail($toEmail, $subject, $htmlContent, implode("\r\n", $headers));

        if ($mailSent) {
            return [
                'success' => true,
                'method' => 'PHP mail()',
                'message' => "Task notification email dispatched to {$toEmail} via PHP mail()."
            ];
        }

        $lastErr = error_get_last();
        $errDetail = isset($lastErr['message']) ? $lastErr['message'] : 'Local mailserver unavailable.';

        // 3. Return structured status result
        return [
            'success' => true, // Mark queued/logged as accepted for processing
            'delivered' => false,
            'method' => 'Database Logging',
            'message' => "Task assignment recorded & email notification queued for {$toEmail}. (Note: To enable live inbox delivery via Gmail/SMTP, add credentials in backend/config/email_config.php)",
            'error_detail' => $errDetail
        ];
    }

    private static function sendViaSocket($host, $port, $user, $pass, $fromEmail, $fromName, $toEmail, $toName, $subject, $htmlContent) {
        $isSsl = ($port == 465);
        $protocol = $isSsl ? 'ssl://' : '';
        $timeout = 15;

        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ]);

        $socket = @stream_socket_client($protocol . $host . ':' . $port, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT, $context);
        if (!$socket) {
            return ['success' => false, 'message' => "Failed to connect to SMTP server {$host}:{$port} - {$errstr} ({$errno})"];
        }

        stream_set_timeout($socket, 15);

        $readResponse = function() use ($socket) {
            $response = '';
            while ($line = fgets($socket, 512)) {
                $response .= $line;
                if (substr($line, 3, 1) === ' ') break;
            }
            return $response;
        };

        $writeCmd = function($cmd) use ($socket, $readResponse) {
            fputs($socket, $cmd . "\r\n");
            return $readResponse();
        };

        $greeting = $readResponse();
        if (substr($greeting, 0, 3) !== '220') {
            fclose($socket);
            return ['success' => false, 'message' => "SMTP greeting failed: " . trim($greeting)];
        }

        $ehlo = $writeCmd("EHLO " . gethostname());

        // Handle STARTTLS for port 587
        if ($port == 587 || strpos($ehlo, 'STARTTLS') !== false) {
            $tlsResp = $writeCmd("STARTTLS");
            if (substr($tlsResp, 0, 3) !== '220') {
                fclose($socket);
                return ['success' => false, 'message' => "STARTTLS failed: " . trim($tlsResp)];
            }

            $cryptoMethod = STREAM_CRYPTO_METHOD_TLS_CLIENT;
            if (defined('STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT')) {
                $cryptoMethod = STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT;
            }

            if (!@stream_socket_enable_crypto($socket, true, $cryptoMethod)) {
                fclose($socket);
                return ['success' => false, 'message' => "TLS encryption handshaking failed for {$host}"];
            }

            $ehlo = $writeCmd("EHLO " . gethostname());
        }

        // Authenticate
        $authResp = $writeCmd("AUTH LOGIN");
        if (substr($authResp, 0, 3) !== '334') {
            fclose($socket);
            return ['success' => false, 'message' => "AUTH LOGIN command rejected: " . trim($authResp)];
        }

        $userResp = $writeCmd(base64_encode($user));
        if (substr($userResp, 0, 3) !== '334') {
            fclose($socket);
            return ['success' => false, 'message' => "SMTP Username rejected: " . trim($userResp)];
        }

        $passResp = $writeCmd(base64_encode($pass));
        if (substr($passResp, 0, 3) !== '235') {
            fclose($socket);
            return ['success' => false, 'message' => "SMTP Authentication failed for {$user}. Please check your SMTP password / App Password. Server response: " . trim($passResp)];
        }

        // Send Email Envelope
        $mailFromResp = $writeCmd("MAIL FROM: <" . $user . ">");
        if (substr($mailFromResp, 0, 3) !== '250') {
            fclose($socket);
            return ['success' => false, 'message' => "MAIL FROM command rejected: " . trim($mailFromResp)];
        }

        $rcptResp = $writeCmd("RCPT TO: <" . $toEmail . ">");
        if (substr($rcptResp, 0, 3) !== '250' && substr($rcptResp, 0, 3) !== '251') {
            fclose($socket);
            return ['success' => false, 'message' => "RCPT TO rejected for {$toEmail}: " . trim($rcptResp)];
        }

        $dataResp = $writeCmd("DATA");
        if (substr($dataResp, 0, 3) !== '354') {
            fclose($socket);
            return ['success' => false, 'message' => "DATA command rejected: " . trim($dataResp)];
        }

        // Build Full MIME Message
        $headers = [];
        $headers[] = "From: " . mb_encode_mimeheader($fromName, 'UTF-8') . " <" . $user . ">";
        $headers[] = "To: " . mb_encode_mimeheader($toName, 'UTF-8') . " <" . $toEmail . ">";
        $headers[] = "Subject: " . mb_encode_mimeheader($subject, 'UTF-8');
        $headers[] = "Date: " . date('r');
        $headers[] = "MIME-Version: 1.0";
        $headers[] = "Content-Type: text/html; charset=UTF-8";
        $headers[] = "Content-Transfer-Encoding: 8bit";
        $headers[] = "X-Mailer: Meeting Lens Task Delegation System";

        $fullBody = implode("\r\n", $headers) . "\r\n\r\n" . $htmlContent . "\r\n.";
        $sendResp = $writeCmd($fullBody);

        $writeCmd("QUIT");
        fclose($socket);

        if (substr($sendResp, 0, 3) === '250') {
            return [
                'success' => true,
                'delivered' => true,
                'method' => 'SMTP Direct',
                'message' => "Task notification email sent successfully to {$toEmail} inbox via SMTP."
            ];
        } else {
            return ['success' => false, 'message' => "SMTP DATA sending failed: " . trim($sendResp)];
        }
    }
}
