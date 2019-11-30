<?php

if(isset($_GET['from']) && isset($_GET['to'])) {

    header('Content-Type: application/json');

    $from = $_GET['from'];
    $to = $_GET['to'];

    $from_hkey = key_to_crypkey($from);
    $from_filename = key_to_filename($from);

    $to_hkey = key_to_crypkey($to);
    $to_filename = key_to_filename($to);

    if(file_exists($from_filename)) {
        $from_file = file_get_contents($from_filename);
        $from_dfile = decrypt_file_data($from_file, $from_hkey);

        $to_file = encrypt_file_data($from_dfile, $to_hkey);
        file_put_contents($to_filename, $to_file);

        unlink($from_filename);

        print(json_encode(true));
    } else {
        print(json_encode('from file does not exist'));
    }
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