'use strict'

class BoolMaster {

    // -----------------------------------------

    constructor(host) {
        this.host = host
        this.prefix_data = {}

        this.checkers = {}
        this.checkers_id = {}
        this.checker_int = null
        this.checker_memory = {}
        this.main_checker = new Checker()
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

    async checkers_update() {
        let whole_data = {}
        for(let path in this.checkers) {
            let sp = path.split('!')
            let data_path = sp[0]
            let status = sp[1]
            let sp_data_path = data_path.split(':')
            let key = sp_data_path[0]
            if(whole_data.hasOwnProperty(key))
                continue
            if(await this.key_exists(key))
                whole_data[key] = await this.read_key(key)
        }
        let changes = this.main_checker.check(whole_data)

        for(let path in changes) {
            let sp = path.split('!')
            let status = sp[1]
            let data_path = sp[0]
            let sp_data_path = data_path.split(':')
            if(status == 'added') {
                let prop = sp_data_path.splice(sp_data_path.length-1,1)[0]
                let sub_path_add = sp_data_path.join(':')+'!added'
                let sub_path_change = sp_data_path.join(':')+':'+prop+'!changed'
                changes[sub_path_add] = [prop,changes[path]]
                changes[sub_path_change] = changes[path]
            }
        }

        for(let path in changes) {
            this.checker_memory[path] = changes[path]
        }

        for(let path in changes) {
            let value = changes[path]
            if(this.checkers.hasOwnProperty(path)) {
                this.execute_callbacks(this.checkers[path],value)
            }
        }
    }

    execute_callbacks(callbacks,value) {
        for(let cbid in callbacks) {
            if(typeof(value) == typeof([]) && value!=null) {
                let prop = value[0]
                value = value[1]
                callbacks[cbid](prop,value)
                continue
            }
            callbacks[cbid](value)
        }
    }

    create_key_checker(key) {
        this.checkers[key] = {}
        let tthis = this
        if(this.checker_int == null)
            this.checker_int = setInterval(async function(){
                await tthis.checkers_update.call(tthis)
            },1000)
    }

    // -----------------------------------------

    async register_checker(key, callback) {
        if(!this.checkers.hasOwnProperty(key))
            this.create_key_checker(key)
        let id = Math.random()+''+Date.now()
        this.checkers[key][id] = callback
        this.checkers_id[id] = key
        this.trigger_checker(key)
        return id
    }

    async trigger_checker(key) {
        if(this.checker_memory.hasOwnProperty(key)) {
            this.execute_callbacks(this.checkers[key],this.checker_memory[key])
        }
    }

    unregister_checker(id) {
        if(! this.checker_id.hasOwnProperty(id))
            return
        let key = this.checker_id[id]
        delete this.checkers[key][id]
        delete this.checker_id[id]
        if(Object.keys(this.checkers[key]) == 0) {
            delete this.checkers[key]
        }
    }

}

// -----------------------------------------

class Checker {

    constructor() {
        this.last_data = {}
    }

    reset_data() {
        this.last_data = {}
    }

    check(new_data,last_data=null) {

        // ---------------

        function is_final(value) {
            return typeof(value) == typeof('') || typeof(value) == typeof('')
        }

        // ---------------

        let old_data = last_data==null?this.last_data:last_data
        let changes = {}

        // ---------------

        for(let prop in new_data) {
            let value = new_data[prop]
            if(!old_data.hasOwnProperty(prop)) {
                changes[prop+'!added'] = value
                if(is_final(value)) {
                    continue
                }
                let sub_changes = this.check(value, {})
                for(let sub_prop in sub_changes) {
                    changes[prop+':'+sub_prop] = sub_changes[sub_prop]
                }
                continue
            }

            let old_value = old_data[prop]
            if(is_final(value)) {
                if(value != old_value) {
                    changes[prop+'!changed'] = value
                }
                continue
            }

            let sub_changes = this.check(value, old_value)
            for(let sub_prop in sub_changes) {
                changes[prop+':'+sub_prop] = sub_changes[sub_prop]
            }
        }

        for(let prop in old_data) {
            if(!new_data.hasOwnProperty(prop)) {
                changes[prop+'!removed'] = null
            }
        }

        // ---------------

        if(last_data == null)
            this.last_data = new_data

        return changes
    }

}

Checker.STATUS = {
    ADDED:1,
    CHANGED:2,
    REMOVED:3,
}