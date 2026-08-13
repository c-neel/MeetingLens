CREATE DATABASE IF NOT EXISTS meeting_assistant;
USE meeting_assistant;

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `meetings`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `meetings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `meeting_date` date NOT NULL,
  `transcript` text,
  `summary` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `meetings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `decisions`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `decisions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `meeting_id` int(11) NOT NULL,
  `decision_text` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `meeting_id` (`meeting_id`),
  CONSTRAINT `decisions_ibfk_1` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `action_items`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `action_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `meeting_id` int(11) NOT NULL,
  `task` varchar(255) NOT NULL,
  `assignee` varchar(255) NOT NULL,
  `due_date` date DEFAULT NULL,
  `priority` enum('High','Medium','Low') NOT NULL DEFAULT 'Medium',
  `status` enum('Pending','In Progress','Completed') NOT NULL DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `meeting_id` (`meeting_id`),
  CONSTRAINT `action_items_ibfk_1` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `documents`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `meeting_id` int(11) NOT NULL,
  `document_type` varchar(50) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `meeting_id` (`meeting_id`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `email_notifications`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `email_notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `meeting_id` int(11) NOT NULL,
  `recipient_email` varchar(255) NOT NULL,
  `content_type` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Pending',
  `sent_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `meeting_id` (`meeting_id`),
  CONSTRAINT `email_notifications_ibfk_1` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================================
-- DUMMY DATA INSERTION
-- ========================================================

-- Insert Users
INSERT INTO `users` (`name`, `email`, `password`) VALUES
('Amit Shah', 'amit.shah@example.com', 'password123'),
('Priya Patel', 'priya.patel@example.com', 'password123'),
('Rahul Sharma', 'rahul.sharma@example.com', 'password123'),
('Sneha Gupta', 'sneha.gupta@example.com', 'password123'),
('Vikram Singh', 'vikram.singh@example.com', 'password123');

-- Insert Meetings
INSERT INTO `meetings` (`user_id`, `title`, `meeting_date`, `transcript`, `summary`) VALUES
(1, 'Weekly Product Meeting', '2026-08-11', 'We discussed the upcoming launch for the new SaaS module. Everyone agreed on the September 15th deadline. React is chosen for the frontend framework. We need to prepare presentations and update the API docs.', 'Weekly sync on product status. Finalized launch dates and technology choices.'),
(2, 'Marketing Strategy Meeting', '2026-08-09', 'Reviewed Q3 marketing budgets. Approved a 20% increase for digital ads. The new campaign must be finalized by next week.', 'Discussed and approved Q3 marketing budget increases and campaign finalization timeline.'),
(3, 'Engineering Sprint Review', '2026-08-07', 'Sprint 43 is completed. There are 3 outstanding bugs in the payment gateway. We decided to delay the refactoring of the user service to focus on these bugs.', 'Reviewed Sprint 43. Reprioritized bug fixes over tech debt.'),
(4, 'Client Project Discussion', '2026-08-05', 'Met with Acme Corp. They want to change the dashboard layout to a dark theme. Approved the change order for $5k.', 'Client meeting with Acme Corp regarding dashboard redesign and change order approval.'),
(5, 'Quarterly Business Review', '2026-08-01', 'Q2 was a success with 15% growth. Planning Q3 objectives. Focus will be on customer retention.', 'Q2 review showing growth. Set Q3 focus on retention metrics.');

-- Insert Decisions
INSERT INTO `decisions` (`meeting_id`, `decision_text`) VALUES
(1, 'Project launch approved for September 15.'),
(1, 'React selected for frontend.'),
(1, 'GraphQL rejected in favor of REST API for now.'),
(2, 'Marketing budget approved with 20% increase for digital.'),
(2, 'Focus ad spend on LinkedIn and Google Ads.'),
(2, 'Hold off on print advertising.'),
(3, 'Delay user service refactoring.'),
(3, 'Prioritize payment gateway bugs in next sprint.'),
(3, 'Assign two senior devs to the payment bugs.'),
(3, 'Schedule a follow-up on technical debt in 2 weeks.'),
(4, 'Approve dark theme layout for Acme Corp dashboard.'),
(4, 'Approve $5,000 change order.'),
(5, 'Set Q3 OKR to focus on customer retention (increase by 5%).'),
(5, 'Hire a new Customer Success Manager.'),
(5, 'Implement a new automated feedback loop.');

-- Insert Action Items
INSERT INTO `action_items` (`meeting_id`, `task`, `assignee`, `due_date`, `priority`, `status`) VALUES
(1, 'Prepare project presentation', 'Rahul Sharma', '2026-08-15', 'High', 'Pending'),
(1, 'Update API documentation', 'Priya Patel', '2026-08-18', 'Medium', 'Pending'),
(1, 'Create repository structure', 'Amit Shah', '2026-08-12', 'High', 'Completed'),
(1, 'Draft UI mockups', 'Sneha Gupta', '2026-08-14', 'Medium', 'In Progress'),
(2, 'Finalize marketing campaign', 'Amit Shah', '2026-08-20', 'High', 'Pending'),
(2, 'Update ad creatives', 'Priya Patel', '2026-08-16', 'Medium', 'In Progress'),
(2, 'Contact LinkedIn account manager', 'Vikram Singh', '2026-08-13', 'Medium', 'Pending'),
(2, 'Draft press release', 'Sneha Gupta', '2026-08-17', 'Low', 'Pending'),
(3, 'Fix payment bug #102', 'Vikram Singh', '2026-08-09', 'High', 'In Progress'),
(3, 'Fix payment bug #105', 'Rahul Sharma', '2026-08-10', 'High', 'Pending'),
(3, 'Review PR for bug #102', 'Amit Shah', '2026-08-11', 'Medium', 'Pending'),
(3, 'Create tech debt Jira epic', 'Priya Patel', '2026-08-08', 'Low', 'Completed'),
(4, 'Update Figma designs to dark theme', 'Sneha Gupta', '2026-08-12', 'High', 'Pending'),
(4, 'Send change order contract', 'Amit Shah', '2026-08-06', 'High', 'Completed'),
(4, 'Follow up on contract signature', 'Vikram Singh', '2026-08-10', 'Medium', 'Pending'),
(5, 'Post job description for CSM', 'Priya Patel', '2026-08-05', 'Medium', 'Completed'),
(5, 'Review CSM candidates', 'Rahul Sharma', '2026-08-20', 'High', 'Pending'),
(5, 'Setup Typeform for automated feedback', 'Sneha Gupta', '2026-08-15', 'Medium', 'In Progress'),
(5, 'Draft retention strategy doc', 'Amit Shah', '2026-08-25', 'High', 'Pending');

-- Insert Documents
INSERT INTO `documents` (`meeting_id`, `document_type`, `file_name`, `file_path`) VALUES
(1, 'PDF', 'Weekly_Product_Meeting_Summary.pdf', '/uploads/docs/1_summary.pdf'),
(1, 'DOCX', 'Weekly_Product_Meeting_Full.docx', '/uploads/docs/1_full.docx'),
(2, 'PDF', 'Marketing_Strategy_Q3.pdf', '/uploads/docs/2_marketing.pdf'),
(4, 'PDF', 'Acme_Change_Order.pdf', '/uploads/docs/4_change_order.pdf'),
(5, 'DOCX', 'Q2_Review_Q3_Planning.docx', '/uploads/docs/5_qbr.docx');
