'use strict'

class BoolMaster {

    // -----------------------------------------

    constructor(host) {
        this.host = host
        this.prefix = ''
        this.checkers = {}
        this.checker_id = {}
    }

    // -----------------------------------------

    async send(method, kwargs) {
        kwargs['key'] = this.prefix+kwargs['key']
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

    set_prefix(perfix) {
        this.prefix = prefix
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
        file_data = JSON.stringify(file_data)
        return await this.send('write_key', {key:key, file_data:file_data})
    }

    // -----------------------------------------

    create_key_checker(key) {
        this.checkers[key] = {
            int:null,
            int_method:async function() {
                if(! await tthis.key_exists(key))
                    return
                let data = await tthis.read_key(key)
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
            delete this.checkers[key]
        }
    }

}
