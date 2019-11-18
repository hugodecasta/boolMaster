<?php

if(isset($_GET['key']) && isset($_GET['data'])) {

    $key = $_GET['key'];
    $data = $_GET['data'];

    $hkey = key_to_crypkey($key);
    $filename = key_to_filename($key);
    $cdata = encrypt_file_data($data, $hkey);

    $ddata = decrypt_file_data($cdata, $hkey);

    $file = null;
    $dfile = null;
    if(file_exists($filename)) {
        $file = file_get_contents($filename);
        $dfile = decrypt_file_data($file, $hkey);
    }

    $obj = array(
        'php version' => phpversion(),
        'key' => $key,
        'data' => $data,
        'hkey' => $hkey,
        'filename' => $filename,
        'cdata' => $cdata,
        'ddata' => $ddata,
        'file' => $file,
        'dfile' => $dfile
    );

    header('Content-Type: application/json');
    print_r($obj);
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