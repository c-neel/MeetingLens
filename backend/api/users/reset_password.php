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

$data = json_decode(file_get_contents("php://input"));

if (empty($data->email) || empty($data->otp) || empty($data->new_password)) {
    http_response_code(400);
    echo json_encode(array("message" => "Email, OTP code, and new password are required."));
    exit();
}

$email = htmlspecialchars(strip_tags(trim($data->email)));
$otp = htmlspecialchars(strip_tags(trim($data->otp)));
$newPassword = $data->new_password;

try {
    // 1. Verify OTP one more time
    $query = "SELECT id, expires_at FROM password_resets WHERE email = :email AND otp = :otp ORDER BY id DESC LIMIT 1";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":email", $email);
    $stmt->bindParam(":otp", $otp);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(400);
        echo json_encode(array("message" => "Invalid OTP code. Please restart the reset process."));
        exit();
    }

    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (time() > strtotime($row['expires_at'])) {
        http_response_code(400);
        echo json_encode(array("message" => "The OTP code has expired. Please request a new code."));
        exit();
    }

    // 2. Hash new password & update user record
    $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
    
    $updateQuery = "UPDATE users SET password = :password WHERE email = :email";
    $updateStmt = $conn->prepare($updateQuery);
    $updateStmt->bindParam(":password", $passwordHash);
    $updateStmt->bindParam(":email", $email);
    
    if ($updateStmt->execute()) {
        // Clear used OTP
        $deleteQuery = "DELETE FROM password_resets WHERE email = :email";
        $deleteStmt = $conn->prepare($deleteQuery);
        $deleteStmt->bindParam(":email", $email);
        $deleteStmt->execute();

        http_response_code(200);
        echo json_encode(array(
            "message" => "Your password has been reset successfully! You can now log in with your new password.",
            "success" => true
        ));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Failed to update password. Please try again."));
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Database error: " . $e->getMessage()));
}
?>
