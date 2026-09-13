<?php
// backend/api/email/send.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once __DIR__ . '/../../config/database.php';
include_once __DIR__ . '/../../config/email_config.php';
include_once __DIR__ . '/../../lib/SmtpMailer.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->recipient_email) && !empty($data->task_name)) {
    try {
        $recipient_email = htmlspecialchars(strip_tags($data->recipient_email));
        $recipient_name = !empty($data->recipient_name) ? htmlspecialchars(strip_tags($data->recipient_name)) : 'Team Member';
        $task_name = htmlspecialchars(strip_tags($data->task_name));
        $raw_due_date = !empty($data->due_date) ? htmlspecialchars(strip_tags($data->due_date)) : '';
        $due_time = !empty($data->due_time) ? htmlspecialchars(strip_tags($data->due_time)) : '17:00';
        $has_deadline = !empty($raw_due_date) && !in_array($raw_due_date, ['No Deadline', 'null', '-']);
        $deadline_display = $has_deadline ? "{$raw_due_date} at {$due_time}" : 'No Deadline';
        $priority = !empty($data->priority) ? htmlspecialchars(strip_tags($data->priority)) : 'Medium';
        $meeting_id = !empty($data->meeting_id) ? intval($data->meeting_id) : null;
        $meeting_title = !empty($data->meeting_title) ? htmlspecialchars(strip_tags($data->meeting_title)) : 'Meeting Action Item';
        $executive_summary = !empty($data->executive_summary) ? htmlspecialchars(strip_tags($data->executive_summary)) : '';

        // Generate Google Calendar Link if deadline is set
        $google_calendar_url = '';
        if ($has_deadline) {
            $start_timestamp = strtotime("{$raw_due_date} {$due_time}");
            if ($start_timestamp === false) {
                $start_timestamp = time();
            }
            $start_datetime = date('Ymd\THis', $start_timestamp);
            $end_datetime = date('Ymd\THis', $start_timestamp + 3600); // 1 hour duration
            $cal_text = urlencode($task_name);
            $cal_details = urlencode("Action Item from meeting: " . $meeting_title . "\n\nAssignee: " . $recipient_name);
            $google_calendar_url = "https://calendar.google.com/calendar/render?action=TEMPLATE&text={$cal_text}&dates={$start_datetime}/{$end_datetime}&details={$cal_details}";
        }

        // Build HTML email body with clear task assignment + MOM reference
        $email_html = "
        <div style='font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;'>
            <div style='background: linear-gradient(135deg, #0058be, #0284c7); color: white; padding: 20px 24px;'>
                <h2 style='margin: 0; font-size: 18px;'>📌 Task Assigned to You</h2>
                <p style='margin: 6px 0 0; opacity: 0.9; font-size: 14px;'>From Meeting: \"{$meeting_title}\"</p>
            </div>

            <div style='padding: 24px; background-color: #ffffff;'>
                <p style='margin: 0 0 16px;'>Hello <strong>{$recipient_name}</strong>,</p>
                <p style='margin: 0 0 20px; color: #334155; font-size: 15px;'>You have been assigned the following action item from a recent meeting. Please review the details below and the attached Minutes of Meeting (MOM) PDF.</p>

                <!-- Task Assignment Box -->
                <div style='background-color: #eff6ff; border: 1px solid #bfdbfe; border-left: 5px solid #2563eb; padding: 18px 20px; border-radius: 6px; margin-bottom: 20px;'>
                    <div style='font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #1d4ed8; font-weight: 700; margin-bottom: 8px;'>Your Assigned Task</div>
                    <div style='font-size: 16px; font-weight: 700; color: #1e3a5f; line-height: 1.4;'>{$task_name}</div>
                </div>

                <!-- Details Table -->
                <table style='width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;'>
                    <tr style='border-bottom: 1px solid #f1f5f9;'>
                        <td style='padding: 10px 0; color: #64748b; font-weight: 600; width: 120px;'>Deadline:</td>
                        <td style='padding: 10px 0; color: #0f172a; font-weight: 500;'>{$deadline_display}</td>
                    </tr>
                    <tr style='border-bottom: 1px solid #f1f5f9;'>
                        <td style='padding: 10px 0; color: #64748b; font-weight: 600;'>Priority:</td>
                        <td style='padding: 10px 0; color: #0f172a; font-weight: 500;'>{$priority}</td>
                    </tr>
                    <tr>
                        <td style='padding: 10px 0; color: #64748b; font-weight: 600;'>Source Meeting:</td>
                        <td style='padding: 10px 0; color: #0f172a; font-weight: 500;'>{$meeting_title}</td>
                    </tr>
                </table>

                " . ($executive_summary ? "
                <div style='background-color: #f8fafc; padding: 16px 18px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #e2e8f0;'>
                    <h4 style='margin: 0 0 8px; color: #334155; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;'>Meeting Summary (MOM)</h4>
                    <p style='margin: 0; font-size: 14px; color: #475569; line-height: 1.6;'>{$executive_summary}</p>
                </div>" : "") . "

                " . ($google_calendar_url ? "
                <div style='margin-bottom: 20px; text-align: center;'>
                    <a href='{$google_calendar_url}' target='_blank' style='display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: 600; font-size: 14px;'>
                        📅 Add Task to Google Calendar
                    </a>
                </div>" : "") . "

                <div style='background-color: #fefce8; border: 1px solid #fde68a; padding: 14px 16px; border-radius: 6px; margin-bottom: 16px;'>
                    <p style='margin: 0; font-size: 13px; color: #92400e;'>
                        📎 <strong>Attachment:</strong> The complete Minutes of Meeting (MOM) PDF for <em>\"{$meeting_title}\"</em> is attached to this email for your reference. It contains all decisions, action items, and discussion notes from the meeting.
                    </p>
                </div>

                <p style='font-size: 13px; color: #64748b; margin: 0;'>Please complete the assigned task. If you have any questions, reach out to the meeting organizer.</p>
            </div>
            <div style='background-color: #f8fafc; padding: 12px 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;'>
                Sent automatically via Meeting Lens — Task Delegation &amp; Notification System
            </div>
        </div>
        ";

        // Dispatch Email using SmtpMailer transport
        $subject = "📌 Task Assigned: " . $task_name;
        $dispatchResult = SmtpMailer::dispatch($recipient_email, $recipient_name, $subject, $email_html);

        $dbStatus = (!empty($dispatchResult['delivered']) && $dispatchResult['delivered']) ? 'Sent' : 'Queued';

        // Log notification entry in email_notifications database table
        $stmt = $conn->prepare("INSERT INTO email_notifications (meeting_id, recipient_email, content_type, status, sent_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)");
        $stmt->execute([$meeting_id ? $meeting_id : 1, $recipient_email, 'Task Assignment & MOM PDF', $dbStatus]);
        $notification_id = $conn->lastInsertId();

        http_response_code(200);
        echo json_encode(array(
            "success" => true,
            "message" => $dispatchResult['message'],
            "notification_id" => $notification_id,
            "recipient_email" => $recipient_email,
            "recipient_name" => $recipient_name,
            "delivery_status" => $dbStatus,
            "email_body_preview" => $email_html
        ));
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Database error: " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Recipient email and task name are required."));
}
?>
