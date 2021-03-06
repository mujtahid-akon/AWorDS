<?php
// Load resources
if(preg_match('/^\/(logos|profile|sponsor|Treant|vendor|css|ico|fonts|js|manifest.webmanifest|sw\.min\.js|cache-polyfill\.min\.js)/', $_SERVER['REQUEST_URI'], $matches)){
    // Local directories
    $file = __DIR__ . '/public' . $_SERVER['REQUEST_URI'];
    if(file_exists($file) AND !is_dir($file)){
        $mime = null;
        switch(get_mime($file)){
            case 'css': $mime = 'text/css'; break;
            case 'js' : $mime = 'application/javascript'; break;
            default:
                $mime = mime_content_type($file);
        }
        header('Content-Type: ' . $mime);
        header('Cache-Control: Public, max-age: 31536000');
        readfile($file);
        exit();
    }
}
// Load tests
elseif(preg_match('/^\/(test\.php)/', $_SERVER['REQUEST_URI'], $matches)){
    // Local directories
    $file = __DIR__ . '/public' . $_SERVER['REQUEST_URI'];
    if(file_exists($file) AND !is_dir($file)){
        /** @noinspection PhpIncludeInspection */
        include $file;
        exit();
    }
}
// Otherwise, handle page via index.php
include __DIR__ . '/public/index.php';


function get_mime($file){
    preg_match('/\.(\w+)$/', basename($file), $matches);
    return isset($matches[1]) ? $matches[1] : null;
}