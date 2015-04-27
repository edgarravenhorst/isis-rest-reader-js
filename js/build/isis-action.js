var IsisAction = function(memberData) {

    'use strict';

    IsisMember.call(this, memberData);

    this.invoke = function (params) {
        var self = this;
        return this.prepare()
            .then(
            function(rawdata){
                return $ISIS.ajax(self.url + '/invoke', {
                    method:rawdata.links[2].method,
                    params:params,
                });
            })
            .then(this.result)
            .catch(
            function(errordata){
                if (errordata.status == 400) console.log('required parameters: ', this.requiredParams);
                this.onError(errordata);
            });
    };

    this.prepare = function(){
        return $ISIS.ajax(this.url, {}, function(data){
            this.rawdata = data;
            this.requiredParams = data.parameters;
        }.bind(this), this.onError);
    };

    this.result = function(data){
        return new Promise(function(resolve, reject){

            if (!data.result.value) {
                resolve(data);
                return;
            }

            var a_promises = [];
            for (var name in data.result.value) {
                var value = data.result.value[name];
                a_promises.push($ISIS.ajax(value.href));
            }

            Promise.all(a_promises).then(function(result){
                if (result.length === 1) resolve($ISIS.extractMembers(result[0]));
                else {

                    var collection = [];
                    for (var key in result) {
                        collection.push($ISIS.extractMembers(result[key]));
                    }

                    resolve(collection);
                }
            });
        });
    };
};

IsisAction.prototype = Object.create(IsisMember.prototype);
IsisAction.prototype.constructor = IsisAction;
