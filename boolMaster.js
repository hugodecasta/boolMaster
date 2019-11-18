'use strict'

class BoolMaster {

    // -----------------------------------------

    constructor(host, http_method='https') {
        this.host = host
        this.http_method = http_method
    }

    // -----------------------------------------

    async send(method, kwargs) {
        let url = this.http_method+'://'+this.host+'/?method='+method
        for(let arg in kwargs) {
            let value = kwargs[arg]
            url += '&'+arg+'='+value
        }
        return new Promise((ok)=>{
            $.get(url).done(function(data){
                ok(data)
            })
        })
    }

    // -----------------------------------------

    async read_key(key) {
        return await this.send('read_key',{key:key})
    }

    async key_exists(key) {
        return await this.send('key_exists', {key:key})
    }

    async key_remove(key) {
        return await this.send('key_remove', {key:key})
    }

    async write_key(key, file_data) {
        return await this.send('write_key', {key:key, file_data:file_data})
    }

}
