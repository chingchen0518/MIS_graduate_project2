<?php
/**
 * Database Connection File
 * This script establishes a connection to the MySQL database
 */

// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');         // Default XAMPP user
define('DB_PASS', '');             // Default XAMPP has no password
define('DB_NAME', 'Vistour');    // Database name from the SQL dump

// Create connection
function getDbConnection() {
    static $conn = null;
    
    if ($conn === null) {
        try {
            $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
            
            // Check connection
            if ($conn->connect_error) {
                throw new Exception("Connection failed: " . $conn->connect_error);
            }
            
            // Set charset to UTF8
            $conn->set_charset("utf8mb4");
            
        } catch (Exception $e) {
            error_log("Database Connection Error: " . $e->getMessage());
            // Return a generic error to avoid exposing sensitive information
            die("Unable to connect to the database. Please contact the administrator.");
        }
    }
    
    return $conn;
}

// Function to sanitize input data
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// Function to perform database queries with error handling
function dbQuery($sql, $params = [], $types = "") {
    $conn = getDbConnection();
    
    try {
        $stmt = $conn->prepare($sql);
        
        if ($stmt === false) {
            throw new Exception("Failed to prepare statement: " . $conn->error);
        }
        
        // If there are parameters to bind
        if (!empty($params) && !empty($types)) {
            $stmt->bind_param($types, ...$params);
        }
        
        // Execute the statement
        if (!$stmt->execute()) {
            throw new Exception("Failed to execute query: " . $stmt->error);
        }
        
        // Return the result
        $result = $stmt->get_result();
        $stmt->close();
        
        return $result;
        
    } catch (Exception $e) {
        error_log("Database Query Error: " . $e->getMessage());
        return false;
    }
}

// Function to get a single row
function dbFetchRow($sql, $params = [], $types = "") {
    $result = dbQuery($sql, $params, $types);
    
    if ($result === false) {
        return false;
    }
    
    $row = $result->fetch_assoc();
    $result->free();
    
    return $row;
}

// Function to get multiple rows
function dbFetchAll($sql, $params = [], $types = "") {
    $result = dbQuery($sql, $params, $types);
    
    if ($result === false) {
        return false;
    }
    
    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }
    
    $result->free();
    
    return $rows;
}

// Function to insert data and get the inserted ID
function dbInsert($sql, $params = [], $types = "") {
    $conn = getDbConnection();
    
    try {
        $stmt = $conn->prepare($sql);
        
        if ($stmt === false) {
            throw new Exception("Failed to prepare statement: " . $conn->error);
        }
        
        // If there are parameters to bind
        if (!empty($params) && !empty($types)) {
            $stmt->bind_param($types, ...$params);
        }
        
        // Execute the statement
        if (!$stmt->execute()) {
            throw new Exception("Failed to execute query: " . $stmt->error);
        }
        
        $insertId = $conn->insert_id;
        $stmt->close();
        
        return $insertId;
        
    } catch (Exception $e) {
        error_log("Database Insert Error: " . $e->getMessage());
        return false;
    }
}

// Function to update data and get the number of affected rows
function dbUpdate($sql, $params = [], $types = "") {
    $conn = getDbConnection();
    
    try {
        $stmt = $conn->prepare($sql);
        
        if ($stmt === false) {
            throw new Exception("Failed to prepare statement: " . $conn->error);
        }
        
        // If there are parameters to bind
        if (!empty($params) && !empty($types)) {
            $stmt->bind_param($types, ...$params);
        }
        
        // Execute the statement
        if (!$stmt->execute()) {
            throw new Exception("Failed to execute query: " . $stmt->error);
        }
        
        $affectedRows = $stmt->affected_rows;
        $stmt->close();
        
        return $affectedRows;
        
    } catch (Exception $e) {
        error_log("Database Update Error: " . $e->getMessage());
        return false;
    }
}
?>