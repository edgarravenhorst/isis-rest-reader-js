var IsisAction = function(memberData) {

    'use strict';

    IsisMember.call(this, memberData);

    this.invokeReadyFunc = function(){};
    this.doInvokeOnReady = false;

    this.prepare = function(){
        $ISIS.ajax(this.url, {format:'json'}, function(data){
            this.rawdata = data;
            this.requiredParams = data.parameters;
            this.isReady = true;
            if (this.doInvokeOnReady) this.invoke(this.invokeParams, this.invokeReadyFunc);
        }.bind(this), this.onError);
    };

    this.invoke = function (params, OnReadyFunc) {
        this.invokeParams = params;
        this.invokeReadyFunc = OnReadyFunc;
        if(!this.isReady) {
            this.doInvokeOnReady = true;
            return;
        }
        $ISIS.ajax(this.url + '/invoke', {
            format:'json',
            method:this.rawdata.links[2].method
        }, this.result.bind(this), this.onError);
    };

    this.result = function(data){

        var responseFunc = function(data){
            var result = $ISIS.extractMembers(data);
            this.invokeReadyFunc(result);
        };

        for (var name in data.result.value) {
            var value = data.result.value[name];
            $ISIS.ajax(value.href, {format:'json'}, responseFunc.bind(this));
        }
    };

    this.prepare();
};

IsisAction.prototype = Object.create(IsisMember.prototype);
IsisAction.prototype.constructor = IsisAction;
