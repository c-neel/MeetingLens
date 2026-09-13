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

$provider = !empty($data->provider) ? strtolower(trim($data->provider)) : 'google';
$email = !empty($data->email) ? htmlspecialchars(strip_tags(trim($data->email))) : ($provider === 'google' ? 'google.user@gmail.com' : 'github.user@github.com');
$name = !empty($data->name) ? htmlspecialchars(strip_tags(trim($data->name))) : ($provider === 'google' ? 'Google User' : 'GitHub User');

try {
    // Check if user with this email already exists
    $query = "SELECT id, name, email, role FROM users WHERE email = :email LIMIT 1";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":email", $email);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        http_response_code(200);
        echo json_encode(array(
            "message" => ucfirst($provider) . " sign-in successful.",
            "user" => array(
                "id" => $row['id'],
                "name" => $row['name'],
                "email" => $row['email'],
                "role" => !empty($row['role']) ? $row['role'] : 'member',
                "provider" => $provider
            )
        ));
    } else {
        // Create new user for social login
        $insertQuery = "INSERT INTO users (name, email, password, role) VALUES (:name, :email, :password, :role)";
        $insertStmt = $conn->prepare($insertQuery);
        
        $dummyPassword = password_hash(bin2hex(random_bytes(8)), PASSWORD_DEFAULT);
        $role = 'member';

        $insertStmt->bindParam(":name", $name);
        $insertStmt->bindParam(":email", $email);
        $insertStmt->bindParam(":password", $dummyPassword);
        $insertStmt->bindParam(":role", $role);

        if ($insertStmt->execute()) {
            $newId = $conn->lastInsertId();
            http_response_code(200);
            echo json_encode(array(
                "message" => ucfirst($provider) . " account connected and sign-in successful.",
                "user" => array(
                    "id" => $newId,
                    "name" => $name,
                    "email" => $email,
                    "role" => $role,
                    "provider" => $provider
                )
            ));
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Failed to create user record."));
        }
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Database error: " . $e->getMessage()));
}
?>
