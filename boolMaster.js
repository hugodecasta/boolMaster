'use strict'

class BoolMaster {

    // -----------------------------------------

    constructor(host) {
        this.host = host
        this.prefix_data = {}
        this.checkers = {}
        this.checker_id = {}
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

        let url = this.host+'/?method='+method
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

    // -----------------------------------------

    create_key_checker(key) {
        this.checkers[key] = {
            int:null,
            saved_prefix_data:this.prefix_data,
            int_method:async function() {
                let saved_prefix_data = tthis.checkers[key].saved_prefix_data
                if(! await tthis.key_exists(key,saved_prefix_data))
                    return
                let data = await tthis.read_key(key,saved_prefix_data)
                let check_data = JSON.stringify(data)
                let last_data = tthis.checkers[key].last_data
                if(check_data != last_data) {
                    tthis.checkers[key].last_data = check_data
                    for(let id in tthis.checkers[key].callbacks) {
                        let callback = tthis.checkers[key].callbacks[id]
                        callback(data)
                    }
                    return true
                }
                return false
            },
            last_data:'',
            callbacks:[]
        }
        let tthis = this
        let interval = setInterval(this.checkers[key].int_method,500)
        this.checkers[key].int = interval
    }

    async register_checker(key, callback) {
        if(!this.checkers.hasOwnProperty(key))
            this.create_key_checker(key)
        let id = Math.random()+''+Date.now()
        this.checker_id[id] = key
        this.checkers[key].callbacks[id] = callback

        if(! await this.key_exists(key))
            return id

        let changed = await this.trigger_checker(key)
        if(!changed)
            callback(await this.read_key(key))
        return id
    }

    async trigger_checker(key) {
        if(!this.checkers.hasOwnProperty(key))
            return false
        return await this.checkers[key].int_method()
    }

    unregister_checker(id) {
        if(! this.checker_id.hasOwnProperty(id))
            return
        let key = this.checker_id[id]
        delete this.checkers[key].callbacks[id]
        delete this.checker_id[id]
        if(Object.keys(this.checkers[key].callbacks) == 0) {
            clearInterval(this.checkers[key].int)
            console.log('remove checker',key,this.checkers[key])
            delete this.checkers[key]
        }
    }

}
