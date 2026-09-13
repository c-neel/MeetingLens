<?php
// backend/config/email_config.php
// Configuration for Task Assignment Email Dispatch

// Set to true to use SMTP server for direct email delivery to recipient inboxes
define('SMTP_ENABLED', true);

// SMTP Server Settings
// For Gmail: host = 'smtp.gmail.com', port = 587 (TLS) or 465 (SSL)
// For SendGrid: host = 'smtp.sendgrid.net', port = 587
// For Mailtrap / Custom SMTP: update host & credentials
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587); // 587 for TLS, 465 for SSL

// Enter your SMTP login credentials below to enable live email delivery to any recipient's inbox
// For Gmail, use your Gmail address and a Gmail App Password (created at https://myaccount.google.com/apppasswords)
define('SMTP_USERNAME', 'contractorneel7@gmail.com');
define('SMTP_PASSWORD', 'rriw mtei dxnf dkub');

// Sender Details
define('SMTP_FROM_EMAIL', 'contractorneel7@gmail.com');
define('SMTP_FROM_NAME', 'Meeting Lens');
