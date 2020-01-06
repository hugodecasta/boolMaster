<?php


// --------------------------------------------- CORE

function read_key($key) {

    $hkey = hash_key($key);
    $crypkey = key_to_crypkey($key);

    return get_file_data($hkey, $crypkey);
}

// --

function get_file_data($hkey, $crypkey) {

    $filename = hash_key_to_file($hkey);

    if(!file_exists($filename)) {
        http_response_code(404);
        print('unexisting key');
        return false;
    }

    $enc_data = file_get_contents($filename);
    $file_data = decrypt_file_data($enc_data, $crypkey);

    $reader_data = get_reader_data($file_data);
    if(count($reader_data) == 2) {
        $hkey = $reader_data[0];
        $crypkey = $reader_data[1];
        $can_read = get_file_data($hkey, $crypkey);
        if(!$can_read) {
            unlink($filename);
        }
        return $can_read;
    }

    $json_data = json_decode($file_data);

    return $json_data;
}

// -----

function write_key($key, $file_data) {

    if(! file_exists('keys/'))
        mkdir('keys/',0777,true);

    $reader_data = get_key_reader_data($key);
    if(count($reader_data) == 2) {
        http_response_code(400);
        print('reader key cannot be written');
        return false;
    }

    $filename = key_to_filename($key);
    $crypkey = key_to_crypkey($key);

    $enc_data = encrypt_file_data($file_data, $crypkey);
    file_put_contents($filename, $enc_data);

    return true;
}

// -----

function remove_key($key) {

    if(!key_exist($key)) {
        http_response_code(404);
        print('unexisting key '.$key);
        return false;
    }

    $filename = key_to_filename($key);
    unlink($filename);

    return true;
}

// -----

function key_exist($key) {
    $filename = key_to_filename($key);
    return file_exists($filename);
}

// -----

function create_reader($read_key, $target_key) {
    $hkey = hash_key($target_key);
    $crypkey = key_to_crypkey($target_key);
    $file_data = '@hashkey:'.$hkey.'\n'.'@crypkey:'.$crypkey;
    return write_key($read_key, $file_data);
}

// ------------------------------------

function key_is_reader($key) {
    if(!key_exist($key)) {
        return false;
    }
    $hkey = hash_key($key);
    $crypkey = key_to_crypkey($key);
    $filename = hash_key_to_file($hkey);
    $enc_data = file_get_contents($filename);
    $file_data = decrypt_file_data($enc_data, $crypkey);
    $reader_data = get_reader_data($file_data);
}

function get_key_reader_data($key) {
    if(!key_exist($key)) {
        return [];
    }
    $hkey = hash_key($key);
    $crypkey = key_to_crypkey($key);
    $filename = hash_key_to_file($hkey);
    $enc_data = file_get_contents($filename);
    $file_data = decrypt_file_data($enc_data, $crypkey);
    $reader_data = get_reader_data($file_data);
    return $reader_data;
}

function get_reader_data($file_data) {
    if(strpos($file_data,'@hashkey:') === 0) {
        $sp = explode('\n',$file_data);
        $hkey = str_replace('@hashkey:','',$sp[0]);
        $crypkey = str_replace('@crypkey:','',$sp[1]);
        return [$hkey,$crypkey];
    }
    return [];
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
    $hkey = hash_key($key);
    $filename = hash_key_to_file($hkey);
    return $filename;
}

function hash_key_to_file($hkey) {
    $filename = 'keys/' . $hkey;
    return $filename;
}

function hash_key($key) {
    $string_to_hash = 'filename_' . $key . '_salted';
    return hash(hash_method(), $string_to_hash);
}

function key_to_crypkey($key) {
    $string_to_hash = 'crypkey_' . $key . '_salted';
    $crypkey = hash(hash_method(), $string_to_hash);
    return $crypkey;
}

function hash_crypt($key) {

}

function hash_method() {
    return 'haval256,5';
}

?>