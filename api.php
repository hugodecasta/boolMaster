<?php

header('Access-Control-Allow-Origin: *');

// --------------------------------------------- API DEF

$api_method_map = array(
    'read_key' => array(
        'function' => 'read_file',
        'meth' => 'GET',
        'args' => array('key')
    ),
    'write_key' => array(
        'function' => 'write_file',
        'meth' => 'GET',
        'args' => array('key','file_data')
    ),
    'key_exists' => array(
        'function' => 'key_exist',
        'meth' => 'GET',
        'args' => array('key')
    ),
    'key_remove' => array(
        'function' => 'remove_file',
        'meth' => 'GET',
        'args' => array('key')
    ),
);

// --------------------------------------------- API CORE

function launch_core() {
    global $api_method_map;
    foreach($api_method_map as $api_method => $api_map) {

        $func = $api_map['function'];
        $meth = $api_map['meth'];
        $args = $api_map['args'];
        
        $retrieve_array = $meth == 'POST'?$_POST:$_GET;
        $given_args = array();
    
        if(!isset($retrieve_array['method'])) {
            http_response_code(404);
            print('missing method');
            return false;
        }
        
        $given_method = $retrieve_array['method'];
        if($given_method != $api_method)
            continue;

        foreach($args as $arg) {
            if(!isset($retrieve_array[$arg])) {
                http_response_code(404);
                print('error argument missing '.$arg);
                return false;
            }
            $given_args[] = $retrieve_array[$arg];
        }

        $ret = call_user_func_array($func, $given_args);
        return $ret;
    }
    http_response_code(404);
    print('method unknown');
    return false;

}

http_response_code(200);
$response = launch_core();
header('Content-Type: application/json');
echo json_encode($response);

// --------------------------------------------- CORE

function read_file($key) {

    if(!key_exist($key)) {
        http_response_code(404);
        print('unexisting key '.$key);
        return false;
    }

    $filename = key_to_filename($key);
    $crypkey = key_to_crypkey($key);

    $enc_data = file_get_contents($filename);
    $file_data = decrypt_file_data($enc_data, $crypkey);
    $json_data = json_decode($file_data);

    return $json_data;
}

// -----

function write_file($key, $file_data) {

    $filename = key_to_filename($key);
    $crypkey = key_to_crypkey($key);

    $enc_data = encrypt_file_data($file_data, $crypkey);
    file_put_contents($filename, $enc_data);

    return true;
}

// -----

function remove_file($key) {

    if(!key_exist($key)) {
        http_response_code(404);
        print('unexisting key '.$key);
        return false;
    }

    $filename = key_to_filename($key);
    unlink($filename);

    return true;
}

// ------------------------------------

function key_exist($key) {
    $filename = key_to_filename($key);
    return file_exists($filename);
}

// ------------------------------------

function encrypt_file_data($file_data, $crypkey) {
    $enc_data = openssl_encrypt($file_data, cr_method(), $crypkey, true, cr_iv());
    return $enc_data;
}

function decrypt_file_data($enc_data, $crypkey) {
    $file_data = openssl_decrypt($enc_data, cr_method(), $crypkey, true, cr_iv());
    return $file_data;
}

function cr_method() {
    return 'AES-256-OFB';
}

function cr_iv() {
    return '1234567890abcdef';
}

// ------------------------------------

function key_to_filename($key) {
    $string_to_hash = 'filename_' . $key . '_salted';
    $filename = hash(hash_method(), $string_to_hash);
    return $filename;
}

function key_to_crypkey($key) {
    $string_to_hash = 'crypkey_' . $key . '_salted';
    $crypkey = hash(hash_method(), $string_to_hash);
    return $crypkey;
}

function hash_method() {
    return 'haval256,5';
}

?>