'use strict'

export default class BoolMaster {

    // -----------------------------------------

    constructor(host) {
        this.host = host
        this.prefix_data = {}
    }

    // -----------------------------------------

    async send(method, kwargs, prefix_data=null) {

        prefix_data = prefix_data==null?this.prefix_data:prefix_data
        let key = kwargs.key

        let prefix = ''

        if(prefix_data.hasOwnProperty(key))
            prefix = prefix_data[key]
        else if (prefix_data.hasOwnProperty('*'))
            prefix = prefix_data['*']

        kwargs['key'] = prefix+key
        kwargs['method'] = method

        return new Promise((ok)=>{
            $.post(this.host,kwargs).done(function(data){
                ok(data)
            })
        })
    }

    reset_prefix() {
        this.prefix_data = {}
    }

    set_prefix(prefix, key='*') {
        this.prefix_data[key] = prefix
    }

    get_prefix(key='*') {
        return this.prefix_data[key]
    }

    // -----------------------------------------

    async read_key(key,prefix_data=null) {
        return await this.send('read_key',{key:key}, prefix_data)
    }

    async key_exists(key,prefix_data=null) {
        return await this.send('key_exists', {key:key}, prefix_data)
    }

    async key_remove(key,prefix_data=null) {
        return await this.send('key_remove', {key:key}, prefix_data)
    }

    async write_key(key, file_data,prefix_data=null) {
        file_data = JSON.stringify(file_data)
        return await this.send('write_key', {key:key, file_data:file_data}, prefix_data)
    }

}