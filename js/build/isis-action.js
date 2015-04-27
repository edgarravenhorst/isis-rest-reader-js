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
            .then(self.result)
            .catch(
            function(errordata){
                if (errordata.status == 400) console.log('required parameters: ', self.requiredParams);
                self.onError(errordata);
            });
    };

    this.prepare = function(){
        var self = this;
        return $ISIS.ajax(this.url).then(function(data){
            self.rawdata = data;
            self.requiredParams = data.parameters;
            return data;
        }, self.onError);
    };

    this.result = function(data){
        return new Promise(function(resolve, reject){

            if (!data.result.value) {
                resolve(data);
                return;
            }

            var a_promises = [];
            for (var i=0; i < data.result.value.length; i++) {
                var value = data.result.value[i];
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
