<?php
echo json_encode([
    "php_ini_loaded" => php_ini_loaded_file(),
    "scanned_files" => php_ini_scanned_files(),
    "extension_dir" => ini_get('extension_dir'),
    "pdo_drivers" => PDO::getAvailableDrivers(),
    "php_binary" => PHP_BINARY
]);
?>
