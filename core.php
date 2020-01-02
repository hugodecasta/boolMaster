<?php


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

    if(! file_exists('keys/'))
        mkdir('keys/',0777,true);

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
    $file_data = base64_encode($file_data);
    $enc_data = openssl_encrypt($file_data, cr_method(), $crypkey, true, cr_iv());
    return $enc_data;
}

function decrypt_file_data($enc_data, $crypkey) {
    $file_data = openssl_decrypt($enc_data, cr_method(), $crypkey, true, cr_iv());
    $file_data = base64_decode($file_data);
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
    $filename = 'keys/' . $filename;
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