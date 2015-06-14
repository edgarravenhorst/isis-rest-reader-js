var IsisMember = function(memberData) {

    'use strict';

    this.method = memberData.links[0].method;
    this.url = memberData.links[0].href;
    this.isReady = false;

    this.onError = function(error){
        console.log(error);
        return error;
    };
};

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

var ISIS = function(){

    'use strict';

    this.storeMembers = undefined;

    this.store = (function(members){
        if (members) return members;
        console.error('Please use $ISIS.init() before using the store');
    })(this.storeMembers);

    this.settings = {
        baseurl: "http://xtalus.apps.gedge.nl/simple/restful/",
        method: 'GET',
    };

    this.init = function(url, method, params, jsonFormat) {

        url = url || this.settings.baseurl;
        method = method || 'GET';
        params = params || {};

        var self = this;
        var settings = {};
        settings.method = method;
        settings.params = params;
        settings.jsonFormat = jsonFormat;

        return this.ajax(url, settings).then(function(data){
            return new Promise(function(resolve, reject) {
                var members = $ISIS.extractMembers(data);
                if(url === self.settings.baseurl) self.store = members;
                resolve(members);
            });
        });
    };

    this.post = function(url, params, formatJsonForIsis) {
        url = url || '';
        params = params || {};

        var settings = {};
        settings.method = "POST";
        settings.params = params;
        settings.formatJsonForIsis = formatJsonForIsis;

        return this.ajax(url, settings);
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

    this.setCookie = function(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        var expires = "expires="+d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
    };

    this.getCookie = function(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i=0; i<ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1);
            if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
        }
        return "";
    };

    this.deleteCookie = function(cname)
    {
        var date = new Date();
        date.setDate(date.getDate() -1);
        document.cookie = escape(cname) + '=;expires=' + date;
    };
};

var $ISIS = $ISIS || new ISIS();

ISIS.prototype.ajax = function(url, settings) {

    'use strict';

    return new Promise(function(resolve, reject){

        if (typeof url !== 'string') {
            reject('url is not a string, type=' + typeof url, url);
            return;
        }

        settings = settings || {};

        settings.method = settings.method || "GET";
        settings.headers = settings.headers || {};
        settings.format = settings.format || 'json';
        settings.params = settings.params || {};
        settings.formatJsonForIsis = (settings.formatJsonForIsis === undefined) ? true : settings.formatJsonForIsis;

        if (settings.formatJsonForIsis && settings.method !== 'GET') {
            for(var property in settings.params) {
                settings.params[property] = { value:settings.params[property] };
            }
        }

        var request = new XMLHttpRequest();

        request.onreadystatechange = function() {
            if (request.readyState == XMLHttpRequest.DONE ) {
                if(request.status == 200){
                    var response = request.responseText;
                    if(settings.format == 'json') response = JSON.parse(response);
                    resolve(response);
                }else if(request.status == 400) {
                    console.log('There was an error 400');
                    reject(request);
                }else if(request.status == 401) {
                    console.log('Unauthorized');
                    reject(request);
                }else {
                    console.log('something else other than 200 was returned');
                    reject(request);
                }
            }
        };

        if(settings.method === "GET"){
            var vars = "";
            for (var key in settings.params) {
                if (vars !== "")
                    vars += "&";
                else
                    vars+='?';
                vars += key + "=" + encodeURIComponent(settings.params[key]);
            }
            url+=vars;
        }

        request.open(settings.method, url, true);
        request.setRequestHeader('Content-Type', 'application/json; charset=utf-8');

        var user_cookie = $ISIS.getCookie('auth');
        if (user_cookie !== "") $ISIS.authHeader = user_cookie;
        if (settings.headers.Authorization) $ISIS.authHeader = settings.headers.Authorization;
        if ($ISIS.authHeader) request.setRequestHeader('Authorization', $ISIS.authHeader);

        if (settings.method === 'GET') request.send();
        else request.send(JSON.stringify(settings.params));
    });
};

ISIS.prototype.auth = {

    login : function (username, password, callback) {

        'use strict';

        var response = {};

        return $ISIS.ajax($ISIS.settings.baseurl + '?time='+new Date().getTime(), {
            method: 'get',
            headers: {'Authorization': 'Basic ' + this.base64.encode(username + ':' + password) }
        }).then( function(data) {
            $ISIS.setCookie('auth', 'Basic ' + $ISIS.auth.base64.encode(username + ':' + password), 5);
            return { success: 1 };
        },function(error){
            response.message = 'Gebruikersnaam of wachtwoord is niet juist';
            return response;
        });
    },

    logout : function () {
        $ISIS.deleteCookie('auth');
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
