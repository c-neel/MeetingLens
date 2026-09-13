<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once __DIR__ . '/../../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            
            // Get Meeting
            $stmt = $conn->prepare("SELECT * FROM meetings WHERE id = ?");
            $stmt->execute([$id]);
            $meeting = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($meeting) {
                // Get Decisions
                $stmt = $conn->prepare("SELECT * FROM decisions WHERE meeting_id = ?");
                $stmt->execute([$id]);
                $meeting['decisions'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Get Action Items
                $stmt = $conn->prepare("SELECT * FROM action_items WHERE meeting_id = ?");
                $stmt->execute([$id]);
                $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($items as &$it) {
                    $it['dueDate'] = $it['due_date'];
                    $a = trim((string)($it['assignee'] ?? ''));
                    if ($a === '' || in_array(strtolower($a), ['unassigned', 'none', 'not specified', '-'])) {
                        $it['assignee'] = '-';
                    }
                }
                $meeting['actionItems'] = $items;
                
                // Get Documents
                $stmt = $conn->prepare("SELECT * FROM documents WHERE meeting_id = ?");
                $stmt->execute([$id]);
                $meeting['documents'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // Get creator name for participants display
                $creatorStmt = $conn->prepare("SELECT name FROM users WHERE id = ?");
                $creatorStmt->execute([$meeting['user_id']]);
                $creator = $creatorStmt->fetch(PDO::FETCH_ASSOC);
                $meeting['participants'] = $creator ? [$creator['name']] : ['Unknown'];
                $meeting['date'] = $meeting['meeting_date'];
                
                echo json_encode($meeting);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "Meeting not found."]);
            }
        } else {
            // Filter meetings by user_id so each user only sees their own
            $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

            if ($user_id > 0) {
                $stmt = $conn->prepare("SELECT * FROM meetings WHERE user_id = ? ORDER BY meeting_date DESC, id DESC");
                $stmt->execute([$user_id]);
            } else {
                // Fallback: return all if no user_id provided (shouldn't happen in normal flow)
                $stmt = $conn->query("SELECT * FROM meetings ORDER BY meeting_date DESC, id DESC");
            }
            $meetings = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format for frontend
            foreach ($meetings as &$m) {
                $m['date'] = $m['meeting_date'];
                $m['status'] = 'Completed';
                // Get creator name
                $creatorStmt = $conn->prepare("SELECT name FROM users WHERE id = ?");
                $creatorStmt->execute([$m['user_id']]);
                $creator = $creatorStmt->fetch(PDO::FETCH_ASSOC);
                $m['participants'] = $creator ? [$creator['name']] : ['Various'];
            }
            
            echo json_encode($meetings);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
        if (!empty($data->title)) {
            try {
                $conn->beginTransaction();
                
                $title = $data->title;
                $date = !empty($data->date) ? $data->date : date('Y-m-d');
                $summary = !empty($data->summary) ? $data->summary : (!empty($data->executive_summary) ? $data->executive_summary : '');
                $transcript = !empty($data->transcript) ? $data->transcript : '';
                $user_id = !empty($data->user_id) ? intval($data->user_id) : 1;

                $stmt = $conn->prepare("INSERT INTO meetings (user_id, title, meeting_date, summary, transcript) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$user_id, $title, $date, $summary, $transcript]);
                $meeting_id = $conn->lastInsertId();

                if (!empty($data->decisions)) {
                    $stmt = $conn->prepare("INSERT INTO decisions (meeting_id, decision_text) VALUES (?, ?)");
                    foreach ($data->decisions as $decision) {
                        $text = is_string($decision) ? $decision : (isset($decision->decision_text) ? $decision->decision_text : (isset($decision->text) ? $decision->text : json_encode($decision)));
                        $stmt->execute([$meeting_id, $text]);
                    }
                }

                if (!empty($data->actionItems)) {
                    $stmt = $conn->prepare("INSERT INTO action_items (meeting_id, task, assignee, due_date, priority, status) VALUES (?, ?, ?, ?, ?, ?)");
                    foreach ($data->actionItems as $item) {
                        $dueDate = !empty($item->dueDate) ? $item->dueDate : (!empty($item->due_date) ? $item->due_date : null);
                        $priority = !empty($item->priority) ? $item->priority : 'Medium';
                        $status = !empty($item->status) ? $item->status : 'Pending';
                        $rawAssignee = !empty($item->assignee) ? trim((string)$item->assignee) : '';
                        $assignee = ($rawAssignee === '' || in_array(strtolower($rawAssignee), ['unassigned', 'none', 'not specified', '-'])) ? '-' : $rawAssignee;
                        $stmt->execute([$meeting_id, $item->task, $assignee, $dueDate, $priority, $status]);
                    }
                }

                // Automatically generate Document entries for this meeting
                $cleanTitle = preg_replace('/[^A-Za-z0-9_]/', '_', $title);
                $docStmt = $conn->prepare("INSERT INTO documents (meeting_id, file_name, document_type) VALUES (?, ?, ?)");
                $docStmt->execute([$meeting_id, $cleanTitle . "_Summary.pdf", 'PDF']);
                $docStmt->execute([$meeting_id, $cleanTitle . "_MOM.docx", 'DOCX']);

                // Fetch the newly inserted action items to return their IDs
                $itemsStmt = $conn->prepare("SELECT id, task FROM action_items WHERE meeting_id = ?");
                $itemsStmt->execute([$meeting_id]);
                $insertedItems = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

                $conn->commit();
                http_response_code(201);
                echo json_encode(["message" => "Meeting created successfully.", "id" => $meeting_id, "actionItems" => $insertedItems]);
            } catch (Exception $e) {
                $conn->rollBack();
                http_response_code(503);
                echo json_encode(["message" => "Unable to create meeting.", "error" => $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Incomplete data."]);
        }
        break;

    case 'DELETE':
        if (isset($_GET['all']) && $_GET['all'] === 'true') {
            try {
                // Disable foreign key checks to safely truncate all dependent tables
                $conn->exec("SET FOREIGN_KEY_CHECKS = 0");
                $tablesToClear = [
                    'reminders',
                    'ai_remarks',
                    'follow_ups',
                    'suggestions',
                    'risks',
                    'email_notifications',
                    'documents',
                    'action_items',
                    'decisions',
                    'meetings'
                ];
                foreach ($tablesToClear as $t) {
                    try {
                        $conn->exec("TRUNCATE TABLE `$t`");
                    } catch (Exception $e) {
                        $conn->exec("DELETE FROM `$t`");
                        $conn->exec("ALTER TABLE `$t` AUTO_INCREMENT = 1");
                    }
                }
                $conn->exec("SET FOREIGN_KEY_CHECKS = 1");

                http_response_code(200);
                echo json_encode([
                    "success" => true,
                    "message" => "All meetings and associated tasks, summaries, and decisions have been cleared."
                ]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to clear meetings: " . $e->getMessage()]);
            }
        } elseif (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            try {
                $stmt = $conn->prepare("DELETE FROM meetings WHERE id = ?");
                $stmt->execute([$id]);
                http_response_code(200);
                echo json_encode(["success" => true, "message" => "Meeting deleted successfully."]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to delete meeting: " . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Meeting ID or all=true parameter is required."]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed"]);
        break;
}
?>
