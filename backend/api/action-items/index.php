<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, PUT, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
        // We want all users to see all team tasks for transparency and delegation
        $stmt = $conn->query("SELECT a.*, m.title as meeting_title, m.user_id as meeting_owner_id FROM action_items a LEFT JOIN meetings m ON a.meeting_id = m.id ORDER BY a.due_date ASC, a.id DESC");
        
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($items as &$item) {
            $item['dueDate'] = $item['due_date'];
        }
        
        echo json_encode($items);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Database query failed: " . $e->getMessage()]);
    }
} elseif ($method === 'PUT' || $method === 'POST') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    $data = json_decode(file_get_contents("php://input"));
    
    if ($id > 0 && !empty($data->status)) {
        try {
            $updateFields = ["status = :status"];
            $params = [":status" => $data->status, ":id" => $id];
            
            if (isset($data->assignee)) {
                $updateFields[] = "assignee = :assignee";
                $params[":assignee"] = $data->assignee;
            }
            if (isset($data->due_date)) {
                $updateFields[] = "due_date = :due_date";
                $params[":due_date"] = $data->due_date;
            }
            
            $query = "UPDATE action_items SET " . implode(", ", $updateFields) . " WHERE id = :id";
            $stmt = $conn->prepare($query);
            
            if ($stmt->execute($params)) {
                http_response_code(200);
                echo json_encode(["success" => true, "message" => "Task updated successfully."]);
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to update task."]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Database update failed: " . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Invalid ID or status payload."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed."]);
}
?>
