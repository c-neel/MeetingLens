<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed"]);
    exit;
}

function getAssigneeCondition($user_name, &$params)
{
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

function getPeriodStats($conn, $start_dt, $end_dt, $user_name = '')
{
    // 1. Total meetings
    $stmtM = $conn->prepare("SELECT COUNT(*) AS total_meetings FROM meetings WHERE created_at BETWEEN ? AND ?");
    $stmtM->execute([$start_dt, $end_dt]);
    $total_meetings = intval($stmtM->fetch(PDO::FETCH_ASSOC)['total_meetings'] ?? 0);

    // 2. Total tasks created in this period (scoped to user)
    $paramsTotal = [$start_dt, $end_dt];
    $assigneeClause = getAssigneeCondition($user_name, $paramsTotal);
    $stmtTotal = $conn->prepare("SELECT COUNT(*) AS total FROM action_items WHERE created_at BETWEEN ? AND ? $assigneeClause");
    $stmtTotal->execute($paramsTotal);
    $total_tasks_created = intval($stmtTotal->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);

    // 3. Tasks completed during this period (status is Completed AND updated_at is within range)
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

    // 4. Tasks that are still pending/in-progress
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

    // Total relevant tasks = created in period + any extra that were completed in period but created before
    $total_tasks = max($total_tasks_created, $completed_tasks + $pending_tasks);

    // 5. Overdue: due_date in the past, not completed, relevant to this period
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

    // 6. Avg Confidence (for tasks created in this period)
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
    $end_date = isset($_GET['end_date']) && !empty($_GET['end_date']) ? $_GET['end_date'] : date('Y-m-d');
    $start_date = isset($_GET['start_date']) && !empty($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-01');
    $preset = isset($_GET['preset']) ? strtolower(trim($_GET['preset'])) : 'quarter';

    $start_datetime = $start_date . ' 00:00:00';
    $end_datetime = $end_date . ' 23:59:59';

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

    // Task scoping: always scope report KPIs strictly to the target user's tasks
    $scoped_user_name = !empty($user_name) ? $user_name : 'Amit Shah';
    $current = getPeriodStats($conn, $start_datetime, $end_datetime, $scoped_user_name);

    // Calculate immediately preceding period of equal duration
    $start_ts = strtotime($start_date);
    $end_ts = strtotime($end_date);
    $diff_seconds = max(86400, $end_ts - $start_ts + 86400);

    $prev_end_ts = $start_ts - 86400;
    $prev_start_ts = $prev_end_ts - $diff_seconds + 86400;

    $prev_start_date = date('Y-m-d', $prev_start_ts);
    $prev_end_date = date('Y-m-d', $prev_end_ts);

    $prev_start_datetime = $prev_start_date . ' 00:00:00';
    $prev_end_datetime = $prev_end_date . ' 23:59:59';

    $previous = getPeriodStats($conn, $prev_start_datetime, $prev_end_datetime, $scoped_user_name);

    // Compute period-over-period comparison deltas
    $comparison = [
        'previous_start_date' => $prev_start_date,
        'previous_end_date' => $prev_end_date,
        'previous' => $previous,
        'delta' => [
            'meetings' => $current['total_meetings'] - $previous['total_meetings'],
            'tasks' => $current['total_tasks'] - $previous['total_tasks'],
            'completed' => $current['completed_tasks'] - $previous['completed_tasks'],
            'pending' => $current['pending_tasks'] - $previous['pending_tasks'],
            'overdue' => $current['overdue_tasks'] - $previous['overdue_tasks'],
            'completion_pct' => $current['completion_pct'] - $previous['completion_pct'],
            'avg_confidence' => round($current['avg_confidence'] - $previous['avg_confidence'], 1)
        ]
    ];

    // =========================================================================
    // SECTION A: PRODUCTIVITY TREND OVER TIME
    // 5-6 historical periods leading up to and including selected range
    // =========================================================================
    $historical_periods = [];

    if ($preset === 'week') {
        // Last 6 calendar weeks
        $ref_ts = strtotime($end_date);
        $dayOfWeek = date('w', $ref_ts);
        $diffToMonday = ($dayOfWeek == 0) ? -6 : (1 - $dayOfWeek);
        $cur_mon = strtotime("{$diffToMonday} days", $ref_ts);

        for ($i = 5; $i >= 0; $i--) {
            $w_start = strtotime("-{$i} weeks", $cur_mon);
            $w_end = strtotime("+6 days", $w_start);
            $historical_periods[] = [
                'period' => 'Wk ' . date('W', $w_start),
                'sub_label' => date('M d', $w_start),
                'start' => date('Y-m-d 00:00:00', $w_start),
                'end' => date('Y-m-d 23:59:59', $w_end)
            ];
        }
    } elseif ($preset === 'month') {
        // Last 6 calendar months
        $ref_ts = strtotime($end_date);
        $m_base = strtotime(date('Y-m-01', $ref_ts));

        for ($i = 5; $i >= 0; $i--) {
            $m_start = strtotime("-{$i} months", $m_base);
            $historical_periods[] = [
                'period' => date('M Y', $m_start),
                'sub_label' => date('M', $m_start),
                'start' => date('Y-m-01 00:00:00', $m_start),
                'end' => date('Y-m-t 23:59:59', $m_start)
            ];
        }
    } elseif ($preset === 'quarter') {
        // Last 4-5 quarters
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
                'sub_label' => "Q{$target_q} '" . substr((string)$target_year, 2),
                'start' => $q_start_dt,
                'end' => $q_end_dt
            ];
        }
    } else {
        // Custom Range: 5 equal periods leading up to and including end_date
        $span = max(86400, $end_ts - $start_ts + 86400);
        for ($i = 4; $i >= 0; $i--) {
            $p_end = $end_ts - ($i * $span);
            $p_start = $p_end - $span + 86400;
            $historical_periods[] = [
                'period' => date('M d', $p_start) . ' - ' . date('M d', $p_end),
                'sub_label' => date('M d', $p_start),
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
            'sub_label' => $hp['sub_label'] ?? $hp['period'],
            'start_date' => substr($pStart, 0, 10),
            'end_date' => substr($pEnd, 0, 10),
            'total_tasks' => $totT,
            'completed_tasks' => $compT,
            'completion_rate' => $rateT
        ];
    }

    // =========================================================================
    // SECTION B: MEETING-TO-TASK CONVERSION
    // Ranked list of meetings in selected range with tasks generated & completed
    // =========================================================================
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

    $meeting_conversions = [];
    foreach ($raw_conv as $r) {
        $gen = intval($r['tasks_generated'] ?? 0);
        $comp = intval($r['completed_tasks'] ?? 0);
        $rate = $gen > 0 ? round(($comp / $gen) * 100) : 0;

        $meeting_conversions[] = [
            'id' => intval($r['id']),
            'title' => $r['title'],
            'meeting_date' => $r['meeting_date'],
            'tasks_generated' => $gen,
            'total_tasks' => $gen,
            'completed_tasks' => $comp,
            'conversion_rate' => $rate,
            'completion_rate' => $rate
        ];
    }

    // =========================================================================
    // SECTION C: TASKS DUE TOMORROW
    // =========================================================================
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
    $raw_tomorrow = $stmtTomorrow->fetchAll(PDO::FETCH_ASSOC);

    $tasks_due_tomorrow = [];
    foreach ($raw_tomorrow as $t) {
        $tasks_due_tomorrow[] = [
            'id' => intval($t['id']),
            'task' => $t['task'],
            'assignee' => $t['assignee'],
            'due_date' => $t['due_date'],
            'priority' => $t['priority'],
            'status' => $t['status'],
            'meeting_title' => $t['meeting_title']
        ];
    }

    // Assignee Breakdown (scoped to target user)
    $user_first_name = explode(' ', trim($user_name))[0] ?? $user_name;
    $stmtAssignees = $conn->prepare("
        SELECT 
            COALESCE(NULLIF(TRIM(assignee), ''), '-') AS assignee,
            COUNT(*) AS total, 
            SUM(LOWER(TRIM(status)) = 'completed') AS completed,
            SUM(due_date < NOW() AND LOWER(TRIM(status)) != 'completed') AS overdue
        FROM action_items 
        WHERE created_at BETWEEN :start_datetime AND :end_datetime 
          AND assignee IS NOT NULL 
          AND LOWER(TRIM(assignee)) NOT IN ('', '-', 'null', 'unassigned', 'none', 'not specified')
          AND (
              LOWER(TRIM(assignee)) = LOWER(:user_name) 
              OR LOWER(TRIM(assignee)) = LOWER(:user_first_name) 
              OR LOWER(TRIM(assignee)) LIKE LOWER(:user_name_like)
          )
        GROUP BY assignee
        ORDER BY total DESC, completed DESC
    ");
    $stmtAssignees->execute([
        ':start_datetime' => $start_datetime,
        ':end_datetime' => $end_datetime,
        ':user_name' => $user_name,
        ':user_first_name' => $user_first_name,
        ':user_name_like' => '%' . $user_first_name . '%'
    ]);
    $raw_assignees = $stmtAssignees->fetchAll(PDO::FETCH_ASSOC);

    $assignees = [];
    foreach ($raw_assignees as $a) {
        $tot = intval($a['total'] ?? 0);
        $comp = intval($a['completed'] ?? 0);
        $ovd = intval($a['overdue'] ?? 0);
        $pending = max(0, $tot - $comp);
        $rate = $tot > 0 ? round(($comp / $tot) * 100) : 0;

        $assignees[] = [
            'assignee' => $a['assignee'],
            'total' => $tot,
            'completed' => $comp,
            'pending' => $pending,
            'overdue' => $ovd,
            'completion_rate' => $rate
        ];
    }

    // Weekly meetings distribution
    $stmtWeeks = $conn->prepare("
        SELECT 
            YEARWEEK(created_at, 1) AS week, 
            MIN(DATE(created_at)) as week_start,
            COUNT(*) AS count 
        FROM meetings 
        WHERE created_at BETWEEN :start_datetime AND :end_datetime 
        GROUP BY week 
        ORDER BY week ASC
    ");
    $stmtWeeks->execute([':start_datetime' => $start_datetime, ':end_datetime' => $end_datetime]);
    $weekly_meetings = $stmtWeeks->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'user_id' => $user_id,
        'user_role' => $user_role,
        'user_name' => $user_name,
        'is_lead' => $is_lead,
        'preset' => $preset,
        'start_date' => $start_date,
        'end_date' => $end_date,
        'total_meetings' => $current['total_meetings'],
        'total_tasks' => $current['total_tasks'],
        'completed_tasks' => $current['completed_tasks'],
        'pending_tasks' => $current['pending_tasks'],
        'overdue_tasks' => $current['overdue_tasks'],
        'completion_pct' => $current['completion_pct'],
        'pending_pct' => $current['pending_pct'],
        'overdue_pct' => $current['overdue_pct'],
        'avg_confidence' => $current['avg_confidence'],
        'comparison' => $comparison,
        'trend' => $trend,
        'meeting_conversions' => $meeting_conversions,
        'tasks_due_tomorrow' => $tasks_due_tomorrow,
        'assignee_breakdown' => $assignees,
        'weekly_meetings' => $weekly_meetings,
        'timestamp' => time()
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database report query failed: " . $e->getMessage()]);
}
