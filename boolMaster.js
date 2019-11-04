var boolMaster_host = null

function __bm_send(method, kwargs, callback=function(){}) {
    var url = 'https://'+boolMaster_host+'/?method='+method
    for(var arg in kwargs) {
        var value = kwargs[arg]
        url += '&'+arg+'='+value
    }
    $.get(url).done(function(data){
        callback(data)
    })
}

function init_boolMaster(host) {
    boolMaster_host = host
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