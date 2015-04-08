var IsisMember = function(memberData) {

    'use strict';

    this.method = memberData.links[0].method;
    this.url = memberData.links[0].href;
    this.isReady = false;

    this.onError = function(error){
        console.log('status: ' + error.status + ' | ' + error.statusText + '\n message: ', error);
    };
};
var IsisCollection = function(memberData) {

    IsisMember.call(this, memberData);

    this.collectValOnReady = false;
    this.extractOnReady = false;
    this.initialized = false;

    this.getValues = function(onReadyFunc){
        this.initialized = true;
        this.onReadyFunc = onReadyFunc || function(){};

        $ISIS.ajax(this.url, {format:'json'}, function(result){

            this.isReady = true;
            this.values = result.value;

            var initValue = function(value){
                value.collect = function(){
                    this.collectValue(value);
                };
            };

            for(var i=0; i<this.values.length; i++){
                var value = this.values[i];
                initValue(value);
            }



            if (this.extractOnReady) this.extract(this.onExtractCompleteFunc);
            if (this.collectValOnReady) this.collectValue(this.onCollectValCompleteFunc);
            this.onReadyFunc(result.value);

        }.bind(this));

        return this;
    };

    this.extract = function(onCompleteFunc){
        var data = this.values;
        var extractedData = [];
        var countExtracted = 0;

        if (!this.isReady) {
            if (!this.initialized) this.getValues();
            this.onExtractCompleteFunc = onCompleteFunc;
            this.extractOnReady = true;
            return;
        }
        var valueCollected = function(result){
            extractedData.push(result);
            countExtracted ++;
            if(countExtracted == data.length) onCompleteFunc(extractedData);
        };

        for(var i=0; i<data.length; i++){
            var value = data[i];
            this.collectValue(value, valueCollected);
        }

        return this;
    };

    this.collectValue = function(value, onCollectedFunc){

        if (!this.isReady) {
            if (!this.initialized) this.getValues();
            this.onCollectValCompleteFunc = onCollectedFunc;
            this.collectValOnReady = true;
            return;
        }

        var rawdata = value;
        $ISIS.ajax(value.href, {format:'json'}, function(result){
            value = $ISIS.extractMembers(result);
            value.rawdata = rawdata;
            onCollectedFunc(value);
        });
    };
};

IsisCollection.prototype = Object.create(IsisMember.prototype);
IsisCollection.prototype.constructor = IsisCollection;
var IsisAction = function(memberData) {

    'use strict';

    IsisMember.call(this, memberData);

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
            $ISIS.ajax(value.href, {format:'json'}, responseFunc);
        }
    };

    this.prepare();
};

IsisAction.prototype = Object.create(IsisMember.prototype);
IsisAction.prototype.constructor = IsisAction;

var ISIS = function(){

    'use strict';

    this.settings = {
        baseurl: "http://xtalus.apps.gedge.nl/simple/restful/",
        method: 'GET',
    };

    this.init = function(onReadyFunc) {
        this.onReadyFunc = onReadyFunc || function(){};

        this.ajax(this.settings.baseurl, {format:'json'}, function(data){

            var members = this.extractMembers(data);
            this.onReadyFunc(members);

        }.bind(this));
    };

    this.extractMembers = function(data){
        if (!data.members) return;
        var members = data.members;
        var obj = {};

        for(var name in members) {
            var member, memberdata = members[name];

            switch (memberdata.memberType) {
                case 'collection':
                    member = new IsisCollection(memberdata);
                    break;

                case 'action':
                    member = new IsisAction(memberdata);
                    break;

                default :
                    member = memberdata.value;
                    break;
            }

            obj[name] = member;
        }
        return obj;
    };
};

var $ISIS = $ISIS || new ISIS();
ISIS.prototype.ajax = function(url, settings, onSuccesFunc, onErrorFunc) {

    'use strict';

    settings.method = settings.method || "GET";
    settings.headers = settings.headers || {};
    settings.format = settings.format || '';

    var request = new XMLHttpRequest();

    request.onreadystatechange = function() {
        if (request.readyState == XMLHttpRequest.DONE ) {
            if(request.status == 200){
                var response = request.responseText;
                if(settings.format == 'json') response = JSON.parse(response);
                if(onSuccesFunc) onSuccesFunc(response);
            }else if(request.status == 400) {
                console.log('There was an error 400');
                if(onErrorFunc) onErrorFunc(request);
            }else {
                console.log('something else other than 200 was returned');
                if(onErrorFunc) onErrorFunc(request);
            }
        }
    };

    request.open(settings.method, url, true);

    if (settings.headers.Authorization) $ISIS.authHeader = settings.headers.Authorization;
    if ($ISIS.authHeader) request.setRequestHeader('Authorization', $ISIS.authHeader);

    request.send();
};
ISIS.prototype.auth = {

    login : function (username, password, callback) {

        'use strict';

        var response = {};

        $ISIS.ajax ('http://xtalus.apps.gedge.nl/simple/restful/user', {
            method: 'get',
            headers: {'Authorization': 'Basic ' + this.base64.encode(username + ':' + password) }
        },
        function(data) {
            response = { success: username === data.userName };
            callback(response);
        },
        function(error){
            response.message = 'Gebruikersnaam of wachtwoord is niet juist';
            callback(response);
        });
    },

    base64 : {

        encode: function (input) {

            'use strict';

            var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;

            do {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output +
                    keyStr.charAt(enc1) +
                    keyStr.charAt(enc2) +
                    keyStr.charAt(enc3) +
                    keyStr.charAt(enc4);
                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";
            } while (i < input.length);

            return output;
        },

        decode: function (input) {
            var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;

            // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
            var base64test = /[^A-Za-z0-9\+\/\=]/g;
            if (base64test.exec(input)) {
                window.alert("There were invalid base64 characters in the input text.\n" +
                             "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
                             "Expect errors in decoding.");
            }
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

            do {
                enc1 = keyStr.indexOf(input.charAt(i++));
                enc2 = keyStr.indexOf(input.charAt(i++));
                enc3 = keyStr.indexOf(input.charAt(i++));
                enc4 = keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output = output + String.fromCharCode(chr1);

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }

                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";

            } while (i < input.length);

            return output;
        }
    }
};
