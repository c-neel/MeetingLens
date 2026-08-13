<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../../config/database.php';

// Safely ensure category and file_data columns exist in documents table
try {
    $conn->exec("ALTER TABLE documents ADD COLUMN category VARCHAR(100) DEFAULT 'MOM Export'");
} catch (PDOException $e) {}

try {
    $conn->exec("ALTER TABLE documents ADD COLUMN file_data LONGTEXT");
} catch (PDOException $e) {}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // Auto-create missing MOM document entries for meetings
        $conn->exec("
            INSERT INTO documents (meeting_id, file_name, document_type, category)
            SELECT m.id, CONCAT(REPLACE(m.title, ' ', '_'), '_Summary.pdf'), 'PDF', 'MOM Export'
            FROM meetings m
            WHERE NOT EXISTS (SELECT 1 FROM documents d WHERE d.meeting_id = m.id AND d.document_type = 'PDF' AND (d.category = 'MOM Export' OR d.category IS NULL))
        ");
        $conn->exec("
            INSERT INTO documents (meeting_id, file_name, document_type, category)
            SELECT m.id, CONCAT(REPLACE(m.title, ' ', '_'), '_MOM.docx'), 'DOCX', 'MOM Export'
            FROM meetings m
            WHERE NOT EXISTS (SELECT 1 FROM documents d WHERE d.meeting_id = m.id AND d.document_type = 'DOCX' AND (d.category = 'MOM Export' OR d.category IS NULL))
        ");

        $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

        // Fetch all documents joined with meeting details, filtered by user_id if provided
        if ($user_id > 0) {
            $stmt = $conn->prepare("
                SELECT d.*, m.title as meeting_title, m.summary as meeting_summary, m.meeting_date 
                FROM documents d 
                INNER JOIN meetings m ON d.meeting_id = m.id 
                WHERE m.user_id = ?
                ORDER BY d.id DESC
            ");
            $stmt->execute([$user_id]);
        } else {
            $stmt = $conn->query("
                SELECT d.*, m.title as meeting_title, m.summary as meeting_summary, m.meeting_date 
                FROM documents d 
                LEFT JOIN meetings m ON d.meeting_id = m.id 
                ORDER BY d.id DESC
            ");
        }
        $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($documents as &$doc) {
            $doc['fileName'] = $doc['file_name'];
            $doc['type'] = !empty($doc['document_type']) ? $doc['document_type'] : 'PDF';
            $doc['category'] = !empty($doc['category']) ? $doc['category'] : 'MOM Export';
            $doc['date'] = !empty($doc['meeting_date']) ? $doc['meeting_date'] : explode(' ', $doc['created_at'])[0];
            $doc['title'] = !empty($doc['meeting_title']) ? $doc['meeting_title'] : preg_replace('/\.[^.]+$/', '', $doc['file_name']);
            $doc['executive_summary'] = !empty($doc['meeting_summary']) ? $doc['meeting_summary'] : "Summary for " . $doc['file_name'];
            $doc['summary'] = $doc['executive_summary'];
            $doc['fileData'] = $doc['file_data'];

            $mId = intval($doc['meeting_id']);
            if ($mId > 0) {
                $dStmt = $conn->prepare("SELECT decision_text FROM decisions WHERE meeting_id = ?");
                $dStmt->execute([$mId]);
                $doc['decisions'] = $dStmt->fetchAll(PDO::FETCH_COLUMN);

                $aStmt = $conn->prepare("SELECT task, assignee, due_date as dueDate, priority, status FROM action_items WHERE meeting_id = ?");
                $aStmt->execute([$mId]);
                $doc['actionItems'] = $aStmt->fetchAll(PDO::FETCH_ASSOC);
            } else {
                $doc['decisions'] = [];
                $doc['actionItems'] = [];
            }
        }

        echo json_encode($documents);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Database error: " . $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    // Upload or Attach a Document to a meeting
    $data = json_decode(file_get_contents("php://input"));

    if (!empty($data->file_name) || !empty($data->fileName)) {
        try {
            $fileName = !empty($data->file_name) ? $data->file_name : $data->fileName;
            $docType = !empty($data->document_type) ? $data->document_type : (!empty($data->type) ? $data->type : 'PDF');
            $category = !empty($data->category) ? $data->category : 'Reference Note';
            $meetingId = !empty($data->meeting_id) ? intval($data->meeting_id) : (!empty($data->meetingId) ? intval($data->meetingId) : null);
            $filePath = !empty($data->file_path) ? $data->file_path : '/uploads/docs/' . $fileName;
            $fileData = !empty($data->file_data) ? $data->file_data : (!empty($data->fileData) ? $data->fileData : null);

            $stmt = $conn->prepare("INSERT INTO documents (meeting_id, file_name, document_type, category, file_path, file_data) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$meetingId, $fileName, $docType, $category, $filePath, $fileData]);
            $newId = $conn->lastInsertId();

            http_response_code(201);
            echo json_encode(["success" => true, "message" => "Document uploaded and attached successfully.", "id" => $newId]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Database insert error: " . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Incomplete document payload."]);
    }
} elseif ($method === 'DELETE') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($id > 0) {
        try {
            $stmt = $conn->prepare("DELETE FROM documents WHERE id = ?");
            $stmt->execute([$id]);
            http_response_code(200);
            echo json_encode(["success" => true, "message" => "Document deleted."]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Database delete error: " . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Invalid document ID."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed"]);
}
?>
