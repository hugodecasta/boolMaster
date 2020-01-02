<?php

include('core.php');

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