<?php

require_once __DIR__ . '/../autoload.php';

use \AWorDS\App\Route;
use \AWorDS\Config;
use \AWorDS\App\Session;

Session::start();

if(Config::DEBUG_MODE){
    error_reporting(E_ALL|E_DEPRECATED|E_ERROR|E_NOTICE);
    error_log("{$_SERVER['REQUEST_METHOD']}: {$_SERVER['REQUEST_URI']}");
}else{
    error_reporting(0);
}

// Set default timezone to UTC
// NOTICE: default timezone of MySQL won't be affected by this! (which is the server time)
date_default_timezone_set('UTC');

// If SSL is enabled but request is in HTTP, redirect to HTTPS
if(Config::USE_ONLY_SSL AND !((!empty($_SERVER['REQUEST_SCHEME']) && $_SERVER['REQUEST_SCHEME'] == 'https') || (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] == 'on') || (!empty($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == '443'))){
    header("Location: https://{$_SERVER['SERVER_NAME']}{$_SERVER['REQUEST_URI']}");
    exit();
}

/*
 * Custom MVC Style designed particularly for this project
 */

/** @var string $location Only A-Za-z0-9-_.+!*’(,;:@=/ are allowed */
$location = '/';
if(php_sapi_name() == 'cli-server'){ // When using the PHP server
    $uri = explode('?', $_SERVER['REQUEST_URI']);
    $location = $uri[0];
}else{ // When using the Apache2 server
    preg_match('/^(\/?[A-Za-z0-9\-\_\.\+\!\*\’\(\,\;\:\@\=\/]+)+(?(?=&))/', $_SERVER['QUERY_STRING'], $matches); // (?(?=&))
    $location = '/' . (isset($matches[0]) ? $matches[0] : '');
}
// back slash fix: convert multiple back slashes to a single one and none if appeared in the end
$location = preg_replace('/[\/]+/', '/', $location);
if(strlen($location) > 1) $location = preg_replace('/[\/]+$/', '', $location);

/**
 * Add routes
 */
// Main page
Route::add(Route::GET,  '/', 'Main@home');
Route::add(Route::GET,  '/home', 'Main@home');
/* === User Login/logout/reg === */
Route::add(Route::POST, '/reg', 'User@register', ['name' => Route::STRING, 'email' => Route::EMAIL, 'pass' => Route::STRING]);
Route::add(Route::POST, '/login', 'User@login', ['email' => Route::EMAIL, 'pass' => Route::STRING]);
Route::add(Route::POST, '/logout', 'User@logout', ['all' => Route::BOOLEAN]); // TODO: 'all' is not implemented
Route::add(Route::POST, '/reset_pass', 'User@reset_password', ['email' => Route::EMAIL, 'pass' => Route::STRING]);
Route::add(Route::GET,  '/register_success', 'User@register_success');
Route::add(Route::GET,  '/login', 'User@login_page', ['email' => Route::EMAIL]);
Route::add(Route::GET,  '/unlock', 'User@unlock', ['email' => Route::EMAIL, 'key' => Route::STRING]);
Route::add(Route::GET,  '/reset_pass', 'User@reset_password_page', ['email' => Route::EMAIL, 'key' => Route::STRING]);
Route::add(Route::GET,  '/logout', 'User@logout');
/* === Project: Serial must be maintained! === */
Route::add(Route::GET,  '/projects', 'Project@all_projects');
Route::add(Route::GET,  '/projects/pending', 'Project@pending_projects');
Route::add(Route::POST, '/projects/cancel_process', 'Project@cancel_process', ['project_id' => Route::INTEGER]);
Route::add(Route::POST, '/projects/get_status', 'Project@status', ['project_id' => Route::INTEGER]);
Route::add(Route::POST, '/projects/get_unseen', 'Project@get_unseen');
// New project
Route::add(Route::GET,  '/projects/new', 'Project@new_project_page');
Route::add(Route::POST, '/projects/new', 'Project@new_project', ['config' => Route::STRING]);
Route::add(Route::POST, '/projects/file_upload', 'Project@file_upload');
// Regular project
Route::add(Route::GET,  '/projects/last', 'Project@last_project');
Route::add(Route::GET,  '/projects/{project_id}', 'Project@project_overview');
Route::add(Route::GET,  '/projects/{project_id}/edit', 'Project@edit_project_page');
Route::add(Route::POST, '/projects/{project_id}/edit', 'Project@edit_project', ['config' => Route::STRING]);  // TODO
Route::add(Route::GET,  '/projects/{project_id}/fork', 'Project@fork_project');
Route::add(Route::POST, '/projects/{project_id}/delete', 'Project@delete_project');
Route::add(Route::GET,  '/projects/{project_id}/download', 'Project@download_project');
Route::add(Route::GET,  '/projects/{project_id}/get/{file_name}', 'Project@get_file');
// API
// - These things can be put in another index.php in case a sub-domain is used instead of the document root
// - If want to use different versions of API (eg. v2), copy the routes bellow with API replaced with APIv2 and copy the API directory as APIv2 at /App/Controllers, also change the namespaces
Route::add(Route::POST,   '/api/login',  'API\\User@login', ['email' => Route::EMAIL, 'pass' => Route::STRING]);
Route::add(Route::DELETE, '/api/logout', 'API\\User@logout');
Route::add(Route::POST,   '/api/projects/new', 'API\\Project@new_project', ['project_configs' => Route::STRING]); // TODO
Route::add(Route::POST,   '/api/projects/upload', 'API\\Project@upload'); // TODO
Route::add(Route::GET,    '/api/projects/status', 'API\\Project@get_status');
Route::add(Route::GET,    '/api/projects/status/{project_ids}', 'API\\Project@get_status');
Route::add(Route::GET,    '/api/projects/result/{project_ids}', 'API\\Project@result');
Route::add(Route::DELETE, '/api/projects/delete/{project_ids}', 'API\\Project@delete');
// The route bellow must always be at the end of the API routes
Route::add(Route::ALL,    '/api.*',  'API\\API@handle_default');

/** Load views or do other specific tasks describe in the respective controller */
Route::load(Route::verify(strtoupper($_SERVER['REQUEST_METHOD']),$location));
exit;
