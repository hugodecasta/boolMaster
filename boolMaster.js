'use strict'

class BoolMaster {

    // -----------------------------------------

    constructor(host) {
        this.host = host
        this.prefix_data = {}

        this.checkers = {}
        this.checkers_id = {}
        this.checker_int = null
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
            let sppath = path.split(':')
            let key = sppath[0]
            if(whole_data.hasOwnProperty(key))
                continue
            if(await this.key_exists(key))
                whole_data[key] = await this.read_key(key)
        }
        let changes = this.main_checker.check(whole_data)
        console.log(changes)
        for(let path in changes)
            if(this.checkers.hasOwnProperty(path))
                for(let cbid in this.checkers[path])
                    this.checkers[path][cbid](changes[path])
    }

    create_key_checker(key) {
        this.checkers[key] = {}
        let tthis = this/*
        if(this.checker_int == null)
            this.checker_int = setInterval(async function(){
                await tthis.checkers_update.call(tthis)
            },1000)*/
        this.checkers_update()
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
        this.last_data = ''
    }

    check(new_data,last_data=null) {
        let old_data = last_data==null?this.last_data:last_data
        let changes = null
        if(typeof(new_data) == typeof('') || new_data == null) {
            if(new_data != last_data) {
                changes = new_data
            }
        }
        else {
            changes = {}
            for(let prop in new_data) {
                if(!old_data.hasOwnProperty(prop)) {
                    changes[prop] = {state:'added',value:new_data[prop]}
                    continue
                }
                let subchange = this.check(new_data[prop],old_data[prop])
                if(typeof(subchange) == typeof('') && subchange!=null)
                    changes[prop] = {state:'changed',value:subchange}
                else
                    for(let subprop in subchange) {
                        changes[prop+':'+subprop] = subchange[subprop]
                }
            }
            for(let prop in old_data) {
                if(!new_data.hasOwnProperty(prop)) {
                    changes[prop] = {state:'removed',value:null}
                }
            }
            if(changes == {})
                changes = null
        }
        if(last_data == null && changes != null) {
            this.last_data = new_data
        }
        return changes
    }

}