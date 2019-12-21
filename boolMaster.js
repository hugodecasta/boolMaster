'use strict'

class BoolMaster {

    // -----------------------------------------

    constructor(host) {
        this.host = host
        this.prefix_data = {}

        this.checkers = {}
        this.checkers_id = {}
        this.checkers_viewed = {}
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

        let checkers = {}
        for(let elm in this.checkers) {
            checkers[elm] = this.checkers[elm]
        }

        for(let path in checkers) {
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

        let full_changes = {}
        for(let path in changes) {
            if(!full_changes.hasOwnProperty(path)) {
                full_changes[path] = []
            }
            let sp = path.split('!')
            let status = sp[1]
            let data_path = sp[0]
            let sp_data_path = data_path.split(':')
            let value = changes[path]
            if(status == 'added') {
                let prop = sp_data_path.splice(sp_data_path.length-1,1)[0]
                let sub_path_add = sp_data_path.join(':')+'!added'
                if(!full_changes.hasOwnProperty(sub_path_add)) {
                    full_changes[sub_path_add] = []
                }
                full_changes[sub_path_add].push({prop:prop,value:value})
                let sub_path_change = sp_data_path.join(':')+(sp_data_path.length>0?':':'')+prop+'!changed'
                if(!full_changes.hasOwnProperty(sub_path_change)) {
                    full_changes[sub_path_change] = []
                }
                full_changes[sub_path_change].push({prop:prop,value:value})
                continue
            }
            full_changes[path].push(value)
        }

        for(let path in full_changes) {
            if(!path.includes('removed')) {
                this.checker_memory[path] = full_changes[path]
            }
        }

        for(let path in full_changes) {
            let values = full_changes[path]
            if(checkers.hasOwnProperty(path)) {
                this.execute_callbacks(checkers[path],values)
            }
        }
    }

    execute_callbacks(callbacks,values) {
        for(let cbid in callbacks) {
            let viewed = false
            for(let vvalues of this.checkers_viewed[cbid]) {
                if(JSON.stringify(vvalues) == JSON.stringify(values)) {
                    viewed = true
                    break
                }
            }
            if(viewed)
                continue
            this.checkers_viewed[cbid].push(values)
            for(let value of values) {
                if(typeof(value) == typeof({}) && value!=null && !(value instanceof Array)) {
                    let prop = value.prop
                    value = value.value
                    callbacks[cbid](prop,value)
                    continue
                }
                callbacks[cbid](value)
            }
        }
    }

    create_key_checker(key) {
        this.checkers[key] = {}
        let tthis = this
        if(this.checker_int == null) {
            this.checker_int = setInterval(async function(){
                await tthis.checkers_update.call(tthis)
            },100)
            this.checkers_update()
        }
    }

    // -----------------------------------------

    register_checker(key, callback) {
        if(!this.checkers.hasOwnProperty(key))
            this.create_key_checker(key)
        let id = Math.random()+''+Date.now()
        this.checkers[key][id] = callback
        this.checkers_id[id] = key
        this.checkers_viewed[id] = []
        this.trigger_checker(key)
        return id
    }

    async trigger_checker(key) {
        await this.checkers_update()
        for(let mem_key in this.checker_memory) {
            if(mem_key.includes(key)) {
                this.execute_callbacks(this.checkers[mem_key],this.checker_memory[mem_key])
            }
        }
    }

    reset_checkers() {
        this.main_checker.reset_data()
    }

    reset_all_checker(except_list=[]) {
        let ids = []
        for(let id in this.checkers_id) {
            if(except_list.indexOf(id) == -1) {
                ids.push(id)
            }
        }
        for(let id of ids) {
            this.unregister_checker(id)
        }
    }

    unregister_checker(id) {
        if(!this.checkers_id.hasOwnProperty(id))
            return
        let key = this.checkers_id[id]
        delete this.checkers[key][id]
        delete this.checkers_viewed[id]
        delete this.checkers_id[id]
        if(Object.keys(this.checkers[key]) == 0) {
            delete this.checkers[key]
            if(this.checker_memory.hasOwnProperty(key)) {
                delete this.checker_memory[key]
            }
        }
        if(Object.keys(this.checkers) == 0) {
            clearInterval(this.checker_int)
            this.checker_int = null
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
            return typeof(value) === typeof('') || typeof(value) === typeof(37) || value instanceof Array
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
                if(JSON.stringify(value) != JSON.stringify(old_value)) {
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