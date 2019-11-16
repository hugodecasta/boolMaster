var boolMaster_host = null
var boolMaster_http_method = 'https'

function __bm_send(method, kwargs, callback) {
    var url = boolMaster_http_method+'://'+boolMaster_host+'/?method='+method
    for(var arg in kwargs) {
        var value = kwargs[arg]
        url += '&'+arg+'='+value
    }
    $.get(url).done(function(data){
        if(callback != null)
            callback(data)
    })
}

// test

function init_boolMaster(host, http_method) {
    if(http_method == undefined)
        http_method = 'https'
    boolMaster_host = host
    boolMaster_http_method = http_method
}

function boolMaster_set_http_method(method) {
    http_method = method
}

function boolMaster_read_key(key, callback) {
    __bm_send('read_key', {key:key}, callback)
}

function boolMaster_key_exists(key,callback) {
    __bm_send('key_exists', {key:key}, callback)
}

function boolMaster_key_remove(key,callback) {
    __bm_send('key_remove', {key:key}, callback)
}   

function boolMaster_write_key(key, json_data, callback) {
    file_data = JSON.stringify(json_data)
    __bm_send('write_key', {key:key, file_data:file_data}, callback)
}
