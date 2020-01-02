<?php

include('core.php');

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

?>