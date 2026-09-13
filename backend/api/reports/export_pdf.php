<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/fpdf/fpdf.php';

$end_date = isset($_GET['end_date']) && !empty($_GET['end_date']) ? $_GET['end_date'] : date('Y-m-d');
$start_date = isset($_GET['start_date']) && !empty($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-01');

$start_datetime = $start_date . ' 00:00:00';
$end_datetime = $end_date . ' 23:59:59';

function getAssigneeCondition($user_name, &$params) {
    if (empty($user_name)) {
        $user_name = 'Amit Shah';
    }
    $user_name = trim($user_name);
    $first_name = explode(' ', $user_name)[0] ?? $user_name;

    $params[] = strtolower($user_name);
    $params[] = strtolower($first_name);
    $params[] = '%' . strtolower($first_name) . '%';
    $params[] = strtolower($user_name);

    return " AND (
        assignee IS NOT NULL 
        AND LOWER(TRIM(assignee)) NOT IN ('', '-', 'null', 'unassigned', 'none', 'not specified')
        AND (
            LOWER(TRIM(assignee)) = ? 
            OR LOWER(TRIM(assignee)) = ? 
            OR LOWER(TRIM(assignee)) LIKE ? 
            OR ? LIKE CONCAT('%', LOWER(TRIM(assignee)), '%')
        )
    )";
}

function getPeriodStats($conn, $start_dt, $end_dt, $user_name = '') {
    $stmtM = $conn->prepare("SELECT COUNT(*) AS total_meetings FROM meetings WHERE created_at BETWEEN ? AND ?");
    $stmtM->execute([$start_dt, $end_dt]);
    $total_meetings = intval($stmtM->fetch(PDO::FETCH_ASSOC)['total_meetings'] ?? 0);

    $paramsTotal = [$start_dt, $end_dt];
    $assigneeClause = getAssigneeCondition($user_name, $paramsTotal);
    $stmtTotal = $conn->prepare("SELECT COUNT(*) AS total FROM action_items WHERE created_at BETWEEN ? AND ? $assigneeClause");
    $stmtTotal->execute($paramsTotal);
    $total_tasks_created = intval($stmtTotal->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);

    $paramsComp = [$start_dt, $end_dt, $start_dt, $end_dt];
    $assigneeClauseComp = getAssigneeCondition($user_name, $paramsComp);
    $stmtComp = $conn->prepare("
        SELECT COUNT(*) AS completed FROM action_items 
        WHERE LOWER(TRIM(status)) = 'completed' 
          AND (updated_at BETWEEN ? AND ? OR created_at BETWEEN ? AND ?)
          $assigneeClauseComp
    ");
    $stmtComp->execute($paramsComp);
    $completed_tasks = intval($stmtComp->fetch(PDO::FETCH_ASSOC)['completed'] ?? 0);

    $paramsPending = [$start_dt, $end_dt, $start_dt, $end_dt];
    $assigneeClausePending = getAssigneeCondition($user_name, $paramsPending);
    $stmtPending = $conn->prepare("
        SELECT COUNT(*) AS pending FROM action_items 
        WHERE LOWER(TRIM(status)) != 'completed'
          AND (created_at BETWEEN ? AND ? OR due_date BETWEEN ? AND ?)
          $assigneeClausePending
    ");
    $stmtPending->execute($paramsPending);
    $pending_tasks = intval($stmtPending->fetch(PDO::FETCH_ASSOC)['pending'] ?? 0);

    $total_tasks = max($total_tasks_created, $completed_tasks + $pending_tasks);

    $paramsO = [$start_dt, $end_dt, $start_dt, $end_dt];
    $assigneeClauseO = getAssigneeCondition($user_name, $paramsO);
    $stmtO = $conn->prepare("
        SELECT COUNT(*) AS overdue FROM action_items 
        WHERE due_date < NOW() 
          AND LOWER(TRIM(status)) != 'completed' 
          AND (created_at BETWEEN ? AND ? OR due_date BETWEEN ? AND ?)
          $assigneeClauseO
    ");
    $stmtO->execute($paramsO);
    $overdue_tasks = intval($stmtO->fetch(PDO::FETCH_ASSOC)['overdue'] ?? 0);

    $paramsC = [$start_dt, $end_dt];
    $assigneeClauseC = getAssigneeCondition($user_name, $paramsC);
    $stmtC = $conn->prepare("SELECT AVG(confidence) AS avg_confidence FROM action_items WHERE created_at BETWEEN ? AND ? $assigneeClauseC");
    $stmtC->execute($paramsC);
    $avg_conf_raw = $stmtC->fetch(PDO::FETCH_ASSOC)['avg_confidence'];
    $avg_confidence = $avg_conf_raw !== null ? round(floatval($avg_conf_raw), 1) : 0;

    $completion_pct = $total_tasks > 0 ? round(($completed_tasks / $total_tasks) * 100) : 0;
    $pending_pct = $total_tasks > 0 ? round(($pending_tasks / $total_tasks) * 100) : 0;
    $overdue_pct = $total_tasks > 0 ? round(($overdue_tasks / $total_tasks) * 100) : 0;

    return [
        'total_meetings' => $total_meetings,
        'total_tasks' => $total_tasks,
        'completed_tasks' => $completed_tasks,
        'pending_tasks' => $pending_tasks,
        'overdue_tasks' => $overdue_tasks,
        'completion_pct' => $completion_pct,
        'pending_pct' => $pending_pct,
        'overdue_pct' => $overdue_pct,
        'avg_confidence' => $avg_confidence
    ];
}

try {
    // Role & user verification
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    $user_name = isset($_GET['user_name']) ? trim($_GET['user_name']) : '';
    $user_role = 'member';
    $is_lead = false;

    if ($user_id > 0) {
        $stmtUser = $conn->prepare("SELECT id, name, role FROM users WHERE id = ? LIMIT 1");
        $stmtUser->execute([$user_id]);
        $u = $stmtUser->fetch(PDO::FETCH_ASSOC);
        if ($u) {
            $user_role = !empty($u['role']) ? strtolower(trim($u['role'])) : 'member';
            if (empty($user_name)) {
                $user_name = trim($u['name']);
            }
            $is_lead = in_array($user_role, ['lead', 'admin']);
        }
    }

    if (empty($user_name)) {
        $user_name = 'Amit Shah';
    }

    $preset = isset($_GET['preset']) ? strtolower(trim($_GET['preset'])) : 'quarter';

    // Task scoping: always scope report KPIs strictly to the target user's tasks
    $scoped_user_name = !empty($user_name) ? $user_name : 'Amit Shah';
    $current = getPeriodStats($conn, $start_datetime, $end_datetime, $scoped_user_name);

    // Previous period
    $start_ts = strtotime($start_date);
    $end_ts = strtotime($end_date);
    $diff_seconds = max(86400, $end_ts - $start_ts + 86400);

    $prev_end_ts = $start_ts - 86400;
    $prev_start_ts = $prev_end_ts - $diff_seconds + 86400;

    $prev_start_date = date('Y-m-d', $prev_start_ts);
    $prev_end_date = date('Y-m-d', $prev_end_ts);

    $previous = getPeriodStats($conn, $prev_start_date . ' 00:00:00', $prev_end_date . ' 23:59:59', $scoped_user_name);

    // SECTION A: PRODUCTIVITY TREND OVER TIME
    $historical_periods = [];
    if ($preset === 'week') {
        $ref_ts = strtotime($end_date);
        $dayOfWeek = date('w', $ref_ts);
        $diffToMonday = ($dayOfWeek == 0) ? -6 : (1 - $dayOfWeek);
        $cur_mon = strtotime("{$diffToMonday} days", $ref_ts);

        for ($i = 5; $i >= 0; $i--) {
            $w_start = strtotime("-{$i} weeks", $cur_mon);
            $w_end = strtotime("+6 days", $w_start);
            $historical_periods[] = [
                'period' => 'Wk ' . date('W', $w_start) . ' (' . date('M d', $w_start) . ')',
                'start' => date('Y-m-d 00:00:00', $w_start),
                'end' => date('Y-m-d 23:59:59', $w_end)
            ];
        }
    } elseif ($preset === 'month') {
        $ref_ts = strtotime($end_date);
        $m_base = strtotime(date('Y-m-01', $ref_ts));

        for ($i = 5; $i >= 0; $i--) {
            $m_start = strtotime("-{$i} months", $m_base);
            $historical_periods[] = [
                'period' => date('M Y', $m_start),
                'start' => date('Y-m-01 00:00:00', $m_start),
                'end' => date('Y-m-t 23:59:59', $m_start)
            ];
        }
    } elseif ($preset === 'quarter') {
        $ref_ts = strtotime($end_date);
        $cur_year = intval(date('Y', $ref_ts));
        $cur_month = intval(date('n', $ref_ts));
        $cur_q = ceil($cur_month / 3);

        for ($i = 4; $i >= 0; $i--) {
            $target_q = $cur_q - $i;
            $target_year = $cur_year;
            while ($target_q < 1) {
                $target_q += 4;
                $target_year -= 1;
            }
            $q_start_m = ($target_q - 1) * 3 + 1;
            $q_end_m = $target_q * 3;
            $q_start_dt = sprintf('%04d-%02d-01 00:00:00', $target_year, $q_start_m);
            $last_day = date('t', strtotime(sprintf('%04d-%02d-01', $target_year, $q_end_m)));
            $q_end_dt = sprintf('%04d-%02d-%02d 23:59:59', $target_year, $q_end_m, $last_day);

            $historical_periods[] = [
                'period' => "Q{$target_q} " . $target_year,
                'start' => $q_start_dt,
                'end' => $q_end_dt
            ];
        }
    } else {
        $span = max(86400, $end_ts - $start_ts + 86400);
        for ($i = 4; $i >= 0; $i--) {
            $p_end = $end_ts - ($i * $span);
            $p_start = $p_end - $span + 86400;
            $historical_periods[] = [
                'period' => date('M d', $p_start) . ' - ' . date('M d', $p_end),
                'start' => date('Y-m-d 00:00:00', $p_start),
                'end' => date('Y-m-d 23:59:59', $p_end)
            ];
        }
    }

    $trend = [];
    foreach ($historical_periods as $hp) {
        $pStart = $hp['start'];
        $pEnd = $hp['end'];

        $paramsT = [$pStart, $pEnd];
        $assigneeClauseT = getAssigneeCondition($user_name, $paramsT);

        $stmtT = $conn->prepare("
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN LOWER(TRIM(status)) = 'completed' THEN 1 ELSE 0 END) AS completed
            FROM action_items
            WHERE created_at BETWEEN ? AND ? $assigneeClauseT
        ");
        $stmtT->execute($paramsT);
        $rowT = $stmtT->fetch(PDO::FETCH_ASSOC);

        $totT = intval($rowT['total'] ?? 0);
        $compT = intval($rowT['completed'] ?? 0);
        $rateT = $totT > 0 ? round(($compT / $totT) * 100) : 0;

        $trend[] = [
            'period' => $hp['period'],
            'total_tasks' => $totT,
            'completed_tasks' => $compT,
            'completion_rate' => $rateT
        ];
    }

    // SECTION B: MEETING-TO-TASK CONVERSION
    $paramsConv = [];
    $first_name = explode(' ', trim($user_name))[0] ?? $user_name;
    $paramsConv[] = strtolower($user_name);
    $paramsConv[] = strtolower($first_name);
    $paramsConv[] = '%' . strtolower($first_name) . '%';
    $paramsConv[] = strtolower($user_name);
    $convAssigneeJoinClause = " AND (
        a.assignee IS NOT NULL 
        AND LOWER(TRIM(a.assignee)) NOT IN ('', '-', 'null', 'unassigned', 'none', 'not specified')
        AND (
            LOWER(TRIM(a.assignee)) = ? 
            OR LOWER(TRIM(a.assignee)) = ? 
            OR LOWER(TRIM(a.assignee)) LIKE ? 
            OR ? LIKE CONCAT('%', LOWER(TRIM(a.assignee)), '%')
        )
    )";

    $paramsConv[] = $start_datetime;
    $paramsConv[] = $end_datetime;
    $paramsConv[] = $start_datetime;
    $paramsConv[] = $end_datetime;

    $stmtConv = $conn->prepare("
        SELECT 
            m.id,
            m.title,
            COALESCE(m.meeting_date, DATE(m.created_at)) AS meeting_date,
            COUNT(a.id) AS tasks_generated,
            SUM(CASE WHEN a.id IS NOT NULL AND LOWER(TRIM(a.status)) = 'completed' THEN 1 ELSE 0 END) AS completed_tasks
        FROM meetings m
        LEFT JOIN action_items a ON a.meeting_id = m.id $convAssigneeJoinClause
        WHERE (m.meeting_date BETWEEN ? AND ? OR m.created_at BETWEEN ? AND ?)
        GROUP BY m.id, m.title, meeting_date
        ORDER BY tasks_generated DESC, completed_tasks DESC, m.id DESC
    ");
    $stmtConv->execute($paramsConv);
    $raw_conv = $stmtConv->fetchAll(PDO::FETCH_ASSOC);

    // SECTION C: TASKS DUE TOMORROW
    $tomorrow_date = date('Y-m-d', strtotime('+1 day'));
    $paramsTomorrow = [$tomorrow_date];
    $assigneeClauseTomorrow = "";
    if (!$is_lead) {
        $assigneeClauseTomorrow = getAssigneeCondition($user_name, $paramsTomorrow);
    }

    $stmtTomorrow = $conn->prepare("
        SELECT 
            a.id,
            a.task,
            COALESCE(NULLIF(TRIM(a.assignee), ''), '-') AS assignee,
            a.due_date,
            COALESCE(a.priority, 'Medium') AS priority,
            COALESCE(a.status, 'Pending') AS status,
            COALESCE(m.title, 'Direct Task') AS meeting_title
        FROM action_items a
        LEFT JOIN meetings m ON a.meeting_id = m.id
        WHERE DATE(a.due_date) = ?
          $assigneeClauseTomorrow
        ORDER BY 
            CASE LOWER(TRIM(a.priority))
                WHEN 'high' THEN 1
                WHEN 'medium' THEN 2
                WHEN 'low' THEN 3
                ELSE 4
            END ASC,
            a.id DESC
    ");
    $stmtTomorrow->execute($paramsTomorrow);
    $tasks_due_tomorrow = $stmtTomorrow->fetchAll(PDO::FETCH_ASSOC);

    // Assignees summary (scoped to user)
    $paramsAssignee = [$start_datetime, $end_datetime];
    $assigneeFilterClause = getAssigneeCondition($user_name, $paramsAssignee);
    $stmtAssignees = $conn->prepare("
        SELECT 
            COALESCE(NULLIF(TRIM(assignee), ''), 'Unassigned') AS assignee,
            COUNT(*) AS total, 
            SUM(LOWER(TRIM(status)) = 'completed') AS completed,
            SUM(due_date < NOW() AND LOWER(TRIM(status)) != 'completed') AS overdue
        FROM action_items 
        WHERE created_at BETWEEN ? AND ? $assigneeFilterClause
        GROUP BY assignee
        ORDER BY total DESC, completed DESC
    ");
    $stmtAssignees->execute($paramsAssignee);
    $raw_assignees = $stmtAssignees->fetchAll(PDO::FETCH_ASSOC);

    class ReportPDF extends FPDF {
        public $startDate;
        public $endDate;
        public $prevStartDate;
        public $prevEndDate;
        public $userScope;

        function Header() {
            $this->SetFillColor(37, 99, 235);
            $this->Rect(0, 0, 210, 5, 'F');

            $this->SetY(12);
            $this->SetFont('Arial', 'B', 18);
            $this->SetTextColor(15, 23, 42);
            $this->Cell(120, 8, 'MeetingLens Productivity Report', 0, 0, 'L');

            $this->SetFont('Arial', '', 9);
            $this->SetTextColor(100, 116, 139);
            $this->Cell(70, 8, 'Generated: ' . date('M d, Y H:i'), 0, 1, 'R');

            $this->SetFont('Arial', '', 9.5);
            $this->SetTextColor(71, 85, 105);
            $this->Cell(120, 6, "Period: {$this->startDate} to {$this->endDate} (vs. {$this->prevStartDate} to {$this->prevEndDate})", 0, 0, 'L');
            $this->SetFont('Arial', 'B', 9);
            $this->SetTextColor(37, 99, 235);
            $this->Cell(70, 6, "Scope: " . $this->userScope, 0, 1, 'R');

            $this->SetDrawColor(226, 232, 240);
            $this->SetLineWidth(0.3);
            $this->Line(10, 28, 200, 28);
            $this->Ln(7);
        }

        function Footer() {
            $this->SetY(-15);
            $this->SetDrawColor(226, 232, 240);
            $this->Line(10, $this->GetY(), 200, $this->GetY());
            $this->SetFont('Arial', '', 8);
            $this->SetTextColor(148, 163, 184);
            $this->Cell(100, 10, 'MeetingLens - AI Meeting Minutes & Task Management System', 0, 0, 'L');
            $this->Cell(90, 10, 'Page ' . $this->PageNo() . ' of {nb}', 0, 0, 'R');
        }

        function RoundedRect($x, $y, $w, $h, $r, $style = '') {
            $k = $this->k;
            $hp = $this->h;
            if ($style == 'F')
                $op = 'f';
            elseif ($style == 'FD' || $style == 'DF')
                $op = 'B';
            else
                $op = 'S';
            $MyArc = 4/3 * (sqrt(2) - 1);
            $this->_out(sprintf('%.2F %.2F m', ($x+$r)*$k, ($hp-$y)*$k));
            $xc = $x+$w-$r;
            $yc = $y+$r;
            $this->_out(sprintf('%.2F %.2F l', $xc*$k, ($hp-$y)*$k));

            $this->_Arc($xc + $r*$MyArc, $yc - $r, $xc + $r, $yc - $r*$MyArc, $xc + $r, $yc);
            $xc = $x+$w-$r;
            $yc = $y+$h-$r;
            $this->_out(sprintf('%.2F %.2F l', ($x+$w)*$k, ($hp-$yc)*$k));
            $this->_Arc($xc + $r, $yc + $r*$MyArc, $xc + $r*$MyArc, $yc + $r, $xc, $yc + $r);
            $xc = $x+$r;
            $yc = $y+$h-$r;
            $this->_out(sprintf('%.2F %.2F l', $xc*$k, ($hp-($y+$h))*$k));
            $this->_Arc($xc - $r*$MyArc, $yc + $r, $xc - $r, $yc + $r*$MyArc, $xc - $r, $yc);
            $xc = $x+$r;
            $yc = $y+$r;
            $this->_out(sprintf('%.2F %.2F l', ($x)*$k, ($hp-$yc)*$k));
            $this->_Arc($xc - $r, $yc - $r*$MyArc, $xc - $r*$MyArc, $yc - $r, $xc, $yc - $r);
            $this->_out($op);
        }

        function _Arc($x1, $y1, $x2, $y2, $x3, $y3) {
            $h = $this->h;
            $this->_out(sprintf('%.2F %.2F %.2F %.2F %.2F %.2F c ', $x1*$this->k, ($h-$y1)*$this->k,
                $x2*$this->k, ($h-$y2)*$this->k, $x3*$this->k, ($h-$y3)*$this->k));
        }
    }

    $pdf = new ReportPDF('P', 'mm', 'A4');
    $pdf->startDate = $start_date;
    $pdf->endDate = $end_date;
    $pdf->prevStartDate = $prev_start_date;
    $pdf->prevEndDate = $prev_end_date;
    $pdf->userScope = $user_name . ($is_lead ? ' (Team)' : ' (Personal)');
    $pdf->AliasNbPages();
    $pdf->AddPage();
    $pdf->SetAutoPageBreak(true, 20);

    // Document Summary Template Line
    $pdf->SetFillColor(248, 250, 252);
    $pdf->SetDrawColor(226, 232, 240);
    $pdf->RoundedRect(10, $pdf->GetY(), 190, 14, 2, 'DF');
    $pdf->SetXY(14, $pdf->GetY() + 2.5);
    $pdf->SetFont('Arial', 'I', 9);
    $pdf->SetTextColor(51, 65, 85);
    $summarySentence = "This period had {$current['total_meetings']} meeting(s) and {$current['total_tasks']} task(s) created, with {$current['overdue_tasks']} currently overdue ({$current['completion_pct']}% completion rate).";
    $pdf->MultiCell(182, 4.5, $summarySentence, 0, 'L');
    $pdf->Ln(6);

    // ================= COMPACT HORIZONTAL KPI STRIP =================
    $cardW = 36;
    $cardH = 21;
    $gap = 2.5;
    $startX = 10;
    $startY = $pdf->GetY();

    $dMeetings = $current['total_meetings'] - $previous['total_meetings'];
    $dTasks = $current['total_tasks'] - $previous['total_tasks'];
    $dCompPct = $current['completion_pct'] - $previous['completion_pct'];
    $dOverdue = $current['overdue_tasks'] - $previous['overdue_tasks'];
    $dConf = round($current['avg_confidence'] - $previous['avg_confidence'], 1);

    $cards = [
        ['title' => 'MEETINGS', 'val' => (string)$current['total_meetings'], 'delta' => ($dMeetings >= 0 ? "+{$dMeetings}" : "{$dMeetings}") . ' vs prev', 'color' => [239, 246, 255], 'text' => [37, 99, 235]],
        ['title' => 'TASKS', 'val' => (string)$current['total_tasks'], 'delta' => ($dTasks >= 0 ? "+{$dTasks}" : "{$dTasks}") . ' vs prev', 'color' => [241, 245, 249], 'text' => [15, 23, 42]],
        ['title' => 'COMPLETED', 'val' => $current['completed_tasks'] . " ({$current['completion_pct']}%)", 'delta' => ($dCompPct >= 0 ? "+{$dCompPct}%" : "{$dCompPct}%") . ' vs prev', 'color' => [240, 253, 244], 'text' => [22, 163, 74]],
        ['title' => 'OVERDUE', 'val' => (string)$current['overdue_tasks'], 'delta' => ($dOverdue >= 0 ? "+{$dOverdue}" : "{$dOverdue}") . ' vs prev', 'color' => [254, 242, 242], 'text' => [220, 38, 38]],
        ['title' => 'AI CONFIDENCE', 'val' => $current['avg_confidence'] . '%', 'delta' => ($dConf >= 0 ? "+{$dConf}%" : "{$dConf}%") . ' vs prev', 'color' => [245, 243, 255], 'text' => [124, 58, 237]],
    ];

    foreach ($cards as $i => $c) {
        $x = $startX + $i * ($cardW + $gap);
        $pdf->SetFillColor($c['color'][0], $c['color'][1], $c['color'][2]);
        $pdf->SetDrawColor(226, 232, 240);
        $pdf->RoundedRect($x, $startY, $cardW, $cardH, 2, 'DF');

        // Title
        $pdf->SetXY($x + 2, $startY + 2);
        $pdf->SetFont('Arial', 'B', 6.5);
        $pdf->SetTextColor(100, 116, 139);
        $pdf->Cell($cardW - 4, 3.5, $c['title'], 0, 1, 'L');

        // Value
        $pdf->SetXY($x + 2, $startY + 5.5);
        $pdf->SetFont('Arial', 'B', 11);
        $pdf->SetTextColor($c['text'][0], $c['text'][1], $c['text'][2]);
        $pdf->Cell($cardW - 4, 7, $c['val'], 0, 1, 'L');

        // Delta
        $pdf->SetXY($x + 2, $startY + 14);
        $pdf->SetFont('Arial', '', 6.5);
        $pdf->SetTextColor(100, 116, 139);
        $pdf->Cell($cardW - 4, 4, $c['delta'], 0, 1, 'L');
    }

    $pdf->SetY($startY + $cardH + 7);

    // ================= SECTION 1: PRODUCTIVITY TREND OVER TIME =================
    $pdf->SetFont('Arial', 'B', 11);
    $pdf->SetTextColor(30, 41, 59);
    $pdf->Cell(190, 6, '1. Productivity Trend Over Time (Historical Periods)', 0, 1, 'L');
    $pdf->Ln(1);

    $pdf->SetFillColor(37, 99, 235);
    $pdf->SetTextColor(255, 255, 255);
    $pdf->SetFont('Arial', 'B', 8.5);
    $pdf->SetDrawColor(37, 99, 235);

    $pdf->Cell(60, 7, '  Period', 1, 0, 'L', true);
    $pdf->Cell(40, 7, 'Tasks Created', 1, 0, 'C', true);
    $pdf->Cell(45, 7, 'Tasks Completed', 1, 0, 'C', true);
    $pdf->Cell(45, 7, 'Completion Rate', 1, 1, 'C', true);

    $pdf->SetFont('Arial', '', 8);
    $pdf->SetDrawColor(226, 232, 240);
    $fillT = false;
    foreach ($trend as $t) {
        $pdf->SetFillColor($fillT ? 248 : 255, $fillT ? 250 : 255, $fillT ? 252 : 255);
        $pdf->SetTextColor(30, 41, 59);
        $pdf->Cell(60, 6.5, '  ' . $t['period'], 1, 0, 'L', true);
        $pdf->SetTextColor(71, 85, 105);
        $pdf->Cell(40, 6.5, (string)$t['total_tasks'], 1, 0, 'C', true);
        $pdf->SetTextColor(22, 163, 74);
        $pdf->Cell(45, 6.5, (string)$t['completed_tasks'], 1, 0, 'C', true);
        $pdf->SetTextColor(37, 99, 235);
        $pdf->Cell(45, 6.5, "{$t['completion_rate']}%", 1, 1, 'C', true);
        $fillT = !$fillT;
    }
    $pdf->Ln(5);

    // ================= SECTION 2: TASKS DUE TOMORROW =================
    $pdf->SetFont('Arial', 'B', 11);
    $pdf->SetTextColor(30, 41, 59);
    $pdf->Cell(190, 6, '2. Tasks Due Tomorrow', 0, 1, 'L');
    $pdf->Ln(1);

    $pdf->SetFillColor(37, 99, 235);
    $pdf->SetTextColor(255, 255, 255);
    $pdf->SetFont('Arial', 'B', 8.5);
    $pdf->SetDrawColor(37, 99, 235);

    $pdf->Cell(75, 7, '  Task Title', 1, 0, 'L', true);
    $pdf->Cell(35, 7, 'Assignee', 1, 0, 'L', true);
    $pdf->Cell(30, 7, 'Status', 1, 0, 'C', true);
    $pdf->Cell(25, 7, 'Priority', 1, 0, 'C', true);
    $pdf->Cell(25, 7, 'Due Date', 1, 1, 'C', true);

    $pdf->SetFont('Arial', '', 8);
    $pdf->SetDrawColor(226, 232, 240);

    if (empty($tasks_due_tomorrow)) {
        $pdf->SetTextColor(100, 116, 139);
        $pdf->Cell(190, 8, 'No tasks due tomorrow.', 1, 1, 'C');
    } else {
        $fillTmrw = false;
        foreach ($tasks_due_tomorrow as $t) {
            $pdf->SetFillColor($fillTmrw ? 248 : 255, $fillTmrw ? 250 : 255, $fillTmrw ? 252 : 255);
            $pdf->SetTextColor(30, 41, 59);
            $pdf->Cell(75, 6.5, '  ' . substr($t['task'], 0, 40), 1, 0, 'L', true);
            $pdf->SetTextColor(71, 85, 105);
            $pdf->Cell(35, 6.5, substr($t['assignee'], 0, 20), 1, 0, 'L', true);
            
            // Status text color
            $stLower = strtolower(trim($t['status']));
            if ($stLower === 'completed') {
                $pdf->SetTextColor(22, 163, 74);
            } elseif ($stLower === 'in progress') {
                $pdf->SetTextColor(37, 99, 235);
            } else {
                $pdf->SetTextColor(217, 119, 6);
            }
            $pdf->Cell(30, 6.5, $t['status'], 1, 0, 'C', true);

            // Priority text color
            $prioLower = strtolower(trim($t['priority']));
            if ($prioLower === 'high') {
                $pdf->SetTextColor(220, 38, 38);
            } elseif ($prioLower === 'medium') {
                $pdf->SetTextColor(217, 119, 6);
            } else {
                $pdf->SetTextColor(100, 116, 139);
            }
            $pdf->Cell(25, 6.5, $t['priority'], 1, 0, 'C', true);

            $pdf->SetTextColor(100, 116, 139);
            $pdf->Cell(25, 6.5, $t['due_date'], 1, 1, 'C', true);
            $fillTmrw = !$fillTmrw;
        }
    }
    $pdf->Ln(5);



    $filename = "productivity_report_{$start_date}_to_{$end_date}.pdf";

    if (ob_get_length()) {
        ob_end_clean();
    }

    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: private, max-age=0, must-revalidate');
    header('Pragma: public');

    $pdf->Output('D', $filename);
    exit;

} catch (Exception $e) {
    http_response_code(500);
    echo "Error generating PDF report: " . $e->getMessage();
    exit;
}
