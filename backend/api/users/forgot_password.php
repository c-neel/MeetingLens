<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once __DIR__ . '/../../config/database.php';
include_once __DIR__ . '/../../config/email_config.php';
include_once __DIR__ . '/../../lib/SmtpMailer.php';

// Auto-create password_resets table if missing
try {
    $createTableSql = "CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        INDEX idx_email_otp (email, otp)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $conn->exec($createTableSql);
} catch (PDOException $e) {
    // Continue even if table exists
}

$data = json_decode(file_get_contents("php://input"));

if (empty($data->email)) {
    http_response_code(400);
    echo json_encode(array("message" => "Please enter your email address."));
    exit();
}

$email = htmlspecialchars(strip_tags(trim($data->email)));

try {
    // 1. Verify that the email belongs to a registered account
    $userQuery = "SELECT id, name, email FROM users WHERE email = :email LIMIT 1";
    $userStmt = $conn->prepare($userQuery);
    $userStmt->bindParam(":email", $email);
    $userStmt->execute();

    if ($userStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(array("message" => "No account found with this email address. Please check the spelling or sign up."));
        exit();
    }

    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    // 2. Generate 6-digit numeric OTP
    $otp = sprintf("%06d", mt_rand(100000, 999999));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

    // Remove older unused OTPs for this email
    $cleanQuery = "DELETE FROM password_resets WHERE email = :email";
    $cleanStmt = $conn->prepare($cleanQuery);
    $cleanStmt->bindParam(":email", $email);
    $cleanStmt->execute();

    // Save new OTP
    $insertQuery = "INSERT INTO password_resets (email, otp, expires_at) VALUES (:email, :otp, :expires_at)";
    $insertStmt = $conn->prepare($insertQuery);
    $insertStmt->bindParam(":email", $email);
    $insertStmt->bindParam(":otp", $otp);
    $insertStmt->bindParam(":expires_at", $expiresAt);
    $insertStmt->execute();

    // 3. Send HTML email with OTP
    $subject = "Your Password Reset OTP - Meeting Lens";
    $userName = !empty($user['name']) ? $user['name'] : 'User';

    $htmlContent = "
    <div style='font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #ffffff;'>
        <div style='text-align: center; margin-bottom: 20px;'>
            <h2 style='color: #2563eb; margin: 0;'>Meeting Lens</h2>
            <p style='color: #64748b; font-size: 14px;'>Password Reset Request</p>
        </div>
        <p style='font-size: 15px; color: #1e293b;'>Hello <strong>" . htmlspecialchars($userName) . "</strong>,</p>
        <p style='font-size: 14px; color: #334155; line-height: 1.5;'>
            We received a request to reset the password for your Meeting Lens account associated with <strong>" . htmlspecialchars($email) . "</strong>.
        </p>
        <div style='background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;'>
            <span style='font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 600;'>Your Verification OTP</span>
            <div style='font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #2563eb; margin-top: 8px; font-family: monospace;'>" . $otp . "</div>
            <p style='font-size: 12px; color: #94a3b8; margin-top: 8px; margin-bottom: 0;'>Valid for 15 minutes</p>
        </div>
        <p style='font-size: 13px; color: #64748b; line-height: 1.4;'>
            If you did not request a password reset, please ignore this email or contact support if you have concerns.
        </p>
        <hr style='border: none; border-top: 1px solid #f1f5f9; margin: 25px 0;' />
        <p style='font-size: 12px; color: #94a3b8; text-align: center; margin: 0;'>&copy; " . date('Y') . " Meeting Lens. All rights reserved.</p>
    </div>
    ";

    $mailResult = SmtpMailer::dispatch($email, $userName, $subject, $htmlContent);

    http_response_code(200);
    echo json_encode(array(
        "message" => "Password reset OTP has been sent to " . $email . ". Please check your inbox.",
        "email" => $email,
        "otp_sent" => true,
        "mail_status" => $mailResult['message']
    ));

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Database error: " . $e->getMessage()));
}
?>
