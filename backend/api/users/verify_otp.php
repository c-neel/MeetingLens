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

if (empty($data->email) || empty($data->otp)) {
    http_response_code(400);
    echo json_encode(array("message" => "Email and OTP code are required."));
    exit();
}

$email = htmlspecialchars(strip_tags(trim($data->email)));
$otp = htmlspecialchars(strip_tags(trim($data->otp)));

try {
    // Check if OTP matches and has not expired
    $query = "SELECT id, expires_at FROM password_resets WHERE email = :email AND otp = :otp ORDER BY id DESC LIMIT 1";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":email", $email);
    $stmt->bindParam(":otp", $otp);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $expiresAt = strtotime($row['expires_at']);

        if (time() > $expiresAt) {
            http_response_code(400);
            echo json_encode(array("message" => "The OTP code has expired. Please request a new one."));
        } else {
            http_response_code(200);
            echo json_encode(array(
                "message" => "OTP verified successfully. You can now reset your password.",
                "verified" => true
            ));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("message" => "Invalid OTP code. Please verify the code sent to your email."));
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Database error: " . $e->getMessage()));
}
?>
