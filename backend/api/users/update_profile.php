<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (empty($data->user_id)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "User ID is required."]);
    exit;
}

$user_id = intval($data->user_id);
$name = isset($data->name) ? trim($data->name) : '';
$email = isset($data->email) ? trim($data->email) : '';
$current_password = isset($data->current_password) ? $data->current_password : '';
$new_password = isset($data->new_password) ? $data->new_password : '';

try {
    // 1. Fetch current user
    $stmt = $conn->prepare("SELECT * FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "User not found."]);
        exit;
    }

    // 2. Validate email uniqueness if changing email
    if (!empty($email) && $email !== $user['email']) {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Please enter a valid email address."]);
            exit;
        }

        $checkEmail = $conn->prepare("SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1");
        $checkEmail->execute([$email, $user_id]);
        if ($checkEmail->fetch()) {
            http_response_code(409);
            echo json_encode(["success" => false, "message" => "This email is already in use by another account."]);
            exit;
        }
    } else {
        $email = $user['email'];
    }

    if (empty($name)) {
        $name = $user['name'];
    }

    // 3. Handle password change if requested
    $password_to_save = null;
    if (!empty($new_password)) {
        if (empty($current_password)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Current password is required to set a new password."]);
            exit;
        }

        $stored_pass = $user['password'];
        $is_valid = password_verify($current_password, $stored_pass) || ($current_password === $stored_pass);

        if (!$is_valid) {
            http_response_code(401);
            echo json_encode(["success" => false, "message" => "Current password is incorrect."]);
            exit;
        }

        if (strlen($new_password) < 6) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "New password must be at least 6 characters long."]);
            exit;
        }

        $password_to_save = password_hash($new_password, PASSWORD_BCRYPT);
    }

    // 4. Update the user in the database
    if ($password_to_save !== null) {
        $updateStmt = $conn->prepare("UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?");
        $updateStmt->execute([$name, $email, $password_to_save, $user_id]);
    } else {
        $updateStmt = $conn->prepare("UPDATE users SET name = ?, email = ? WHERE id = ?");
        $updateStmt->execute([$name, $email, $user_id]);
    }

    // 5. Also update the assignee name on tasks if name changed, to keep synchronization seamless
    if ($name !== $user['name']) {
        $old_name = $user['name'];
        $old_first = explode(' ', $old_name)[0];
        $new_first = explode(' ', $name)[0];

        $updateTasks = $conn->prepare("UPDATE action_items SET assignee = ? WHERE assignee = ? OR assignee = ?");
        $updateTasks->execute([$new_first, $old_name, $old_first]);
    }

    // Return updated user payload
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Profile updated successfully.",
        "user" => [
            "id" => $user_id,
            "name" => $name,
            "email" => $email,
            "role" => !empty($user['role']) ? $user['role'] : 'member'
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
