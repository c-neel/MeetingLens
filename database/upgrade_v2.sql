-- ========================================================
-- UPGRADE V2 — AI Meeting Intelligence Expansion
-- Run this AFTER the initial meeting_assistant.sql
-- ========================================================

USE meeting_assistant;

-- Add new columns to meetings
ALTER TABLE `meetings` ADD COLUMN IF NOT EXISTS `executive_summary` TEXT AFTER `summary`;
ALTER TABLE `meetings` ADD COLUMN IF NOT EXISTS `detailed_summary` TEXT AFTER `executive_summary`;
ALTER TABLE `meetings` ADD COLUMN IF NOT EXISTS `source` ENUM('file','voice','manual') DEFAULT 'file' AFTER `detailed_summary`;
ALTER TABLE `meetings` ADD COLUMN IF NOT EXISTS `duration` VARCHAR(20) AFTER `source`;
ALTER TABLE `meetings` ADD COLUMN IF NOT EXISTS `quality_score` INT AFTER `duration`;
ALTER TABLE `meetings` ADD COLUMN IF NOT EXISTS `participants` TEXT AFTER `quality_score`;

-- Add new columns to action_items
ALTER TABLE `action_items` ADD COLUMN IF NOT EXISTS `confidence` INT DEFAULT 100 AFTER `status`;
ALTER TABLE `action_items` ADD COLUMN IF NOT EXISTS `ai_suggested` TINYINT(1) DEFAULT 0 AFTER `confidence`;
ALTER TABLE `action_items` ADD COLUMN IF NOT EXISTS `dependencies` TEXT AFTER `ai_suggested`;
ALTER TABLE `action_items` ADD COLUMN IF NOT EXISTS `description` TEXT AFTER `task`;

-- --------------------------------------------------------
-- Table: risks
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `risks` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `meeting_id` INT(11) NOT NULL,
  `risk_text` TEXT NOT NULL,
  `severity` ENUM('Low','Medium','High','Critical') DEFAULT 'Medium',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `meeting_id` (`meeting_id`),
  CONSTRAINT `risks_ibfk_1` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: suggestions
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `suggestions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `meeting_id` INT(11) NOT NULL,
  `suggestion_text` TEXT NOT NULL,
  `category` VARCHAR(50) DEFAULT 'general',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `meeting_id` (`meeting_id`),
  CONSTRAINT `suggestions_ibfk_1` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: follow_ups
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `follow_ups` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `meeting_id` INT(11) NOT NULL,
  `follow_up_text` TEXT NOT NULL,
  `target_date` DATE DEFAULT NULL,
  `status` ENUM('Pending','Done') DEFAULT 'Pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `meeting_id` (`meeting_id`),
  CONSTRAINT `follow_ups_ibfk_1` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: ai_remarks
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ai_remarks` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `meeting_id` INT(11) NOT NULL,
  `remark_text` TEXT NOT NULL,
  `remark_type` VARCHAR(50) DEFAULT 'observation',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `meeting_id` (`meeting_id`),
  CONSTRAINT `ai_remarks_ibfk_1` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: reminders
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reminders` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `task_id` INT(11) NOT NULL,
  `reminder_date` DATETIME NOT NULL,
  `reminder_type` VARCHAR(50) DEFAULT 'before_deadline',
  `status` ENUM('Pending','Sent','Dismissed') DEFAULT 'Pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  CONSTRAINT `reminders_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `action_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================================
-- UPDATE EXISTING DUMMY DATA
-- ========================================================

UPDATE `meetings` SET
  `executive_summary` = 'Finalized September 15th launch date, selected React for frontend, and assigned key deliverables to team members.',
  `detailed_summary` = '1. Launch Timeline\nThe team confirmed September 15th as the official launch date for the new SaaS module.\n\n2. Technology Stack\nReact was selected for the frontend. GraphQL was discussed but REST API was chosen instead.\n\n3. Deliverables\nProject presentation, API documentation, repository structure, and UI mockups were assigned with deadlines.',
  `source` = 'file',
  `duration` = '45 min',
  `quality_score` = 85,
  `participants` = 'Amit Shah, Priya Patel, Rahul Sharma, Sneha Gupta'
WHERE `id` = 1;

UPDATE `meetings` SET
  `executive_summary` = 'Approved 20% budget increase for digital marketing. Campaign finalization deadline set for next week.',
  `source` = 'file', `duration` = '30 min', `quality_score` = 78,
  `participants` = 'Amit Shah, Priya Patel, Vikram Singh'
WHERE `id` = 2;

UPDATE `meetings` SET
  `executive_summary` = 'Sprint 43 completed. Payment gateway bugs prioritized over user service refactoring.',
  `source` = 'voice', `duration` = '60 min', `quality_score` = 90,
  `participants` = 'Rahul Sharma, Vikram Singh, Amit Shah, Priya Patel'
WHERE `id` = 3;

UPDATE `meetings` SET
  `executive_summary` = 'Acme Corp approved dark theme dashboard redesign. $5,000 change order signed.',
  `source` = 'file', `duration` = '25 min', `quality_score` = 72,
  `participants` = 'Sneha Gupta, Amit Shah, Vikram Singh'
WHERE `id` = 4;

UPDATE `meetings` SET
  `executive_summary` = 'Q2 growth at 15%. Q3 focused on customer retention with new CSM hire planned.',
  `source` = 'file', `duration` = '90 min', `quality_score` = 88,
  `participants` = 'Priya Patel, Rahul Sharma, Sneha Gupta, Amit Shah'
WHERE `id` = 5;

-- Update action items with confidence
UPDATE `action_items` SET `confidence` = 96, `ai_suggested` = 1 WHERE `id` = 1;
UPDATE `action_items` SET `confidence` = 92, `ai_suggested` = 1 WHERE `id` = 2;
UPDATE `action_items` SET `confidence` = 88, `ai_suggested` = 1 WHERE `id` = 3;
UPDATE `action_items` SET `confidence` = 94, `ai_suggested` = 1 WHERE `id` = 4;
UPDATE `action_items` SET `confidence` = 97, `ai_suggested` = 1 WHERE `id` = 5;

-- Insert Risks
INSERT IGNORE INTO `risks` (`meeting_id`, `risk_text`, `severity`) VALUES
(1, 'September 15th deadline is aggressive given current API stability concerns.', 'High'),
(1, 'No fallback plan if React migration encounters blockers.', 'Medium'),
(3, 'Payment gateway bugs could impact revenue if not resolved before release.', 'Critical'),
(3, 'Tech debt accumulation from delayed refactoring may slow future sprints.', 'Medium'),
(5, 'Customer retention focus may divert resources from new feature development.', 'Low');

-- Insert Suggestions
INSERT IGNORE INTO `suggestions` (`meeting_id`, `suggestion_text`, `category`) VALUES
(1, 'Consider setting up a staging environment before the September launch.', 'process'),
(1, 'Assign a dedicated QA resource for the final 2 weeks before launch.', 'resource'),
(2, 'Track ROI on digital ad spend weekly to optimize budget allocation.', 'measurement'),
(3, 'Create a bug severity matrix to prioritize payment issues systematically.', 'process'),
(5, 'Implement NPS surveys before Q3 ends to measure retention improvements.', 'measurement');

-- Insert Follow-ups
INSERT IGNORE INTO `follow_ups` (`meeting_id`, `follow_up_text`, `target_date`, `status`) VALUES
(1, 'Review API documentation completeness', '2026-08-19', 'Pending'),
(1, 'Demo UI mockups to stakeholders', '2026-08-16', 'Pending'),
(3, 'Check payment bug fix status', '2026-08-12', 'Pending'),
(5, 'Interview CSM candidates', '2026-08-22', 'Pending');

-- Insert AI Remarks
INSERT IGNORE INTO `ai_remarks` (`meeting_id`, `remark_text`, `remark_type`) VALUES
(1, 'Three tasks were identified with deadlines within the same week. Consider redistributing workload.', 'workload'),
(1, 'GraphQL was discussed but the rationale for choosing REST was not fully documented.', 'missing_info'),
(3, 'Two critical bugs share the same root cause in the payment gateway. Fixing one may resolve both.', 'optimization'),
(5, 'No specific retention metrics or KPIs were defined. Consider setting measurable targets.', 'gap');
