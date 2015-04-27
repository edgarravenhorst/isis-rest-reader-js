var IsisCollection = function(memberData) {

    'use strict';

    IsisMember.call(this, memberData);

    this.getValues = function(){
        var self = this;
        return $ISIS.ajax(this.url).then(function(result){
            var values = result.value;

            for(var i=0; i< values.length; i++){
                self.initValue(values[i]);
            }

            return values;
        });
    };

    this.initValue = function(value){
        value.collect = function(){
            return this.collectValue(value);
        }.bind(this);
    };

    this.extract = function(){
        var self = this;
        return this.getValues().then(
            function(values){

                var a_promises = [];
                for(var i=0; i<values.length; i++){
                    a_promises.push(values[i].collect());
                }

                return Promise.all(a_promises);
            });
    };

    this.collectValue = function(value){
        var rawdata = value;
        return $ISIS.ajax(value.href).then(function(result){
            value = $ISIS.extractMembers(result);
            value.rawdata = rawdata;
            return value;
        });
    };
};

IsisCollection.prototype = Object.create(IsisMember.prototype);
IsisCollection.prototype.constructor = IsisCollection;
