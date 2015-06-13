var ISIS = function(){

    'use strict';

    this.settings = {
        baseurl: "http://xtalus.apps.gedge.nl/simple/restful/",
        method: 'GET',
    };

    this.init = function(url, method, params, jsonFormat) {

        url = url || this.settings.baseurl;
        method = method || 'GET';
        params = params || {};

        var settings = {};
        settings.method = method;
        settings.params = params;
        settings.jsonFormat = jsonFormat;

        return this.ajax(url, settings).then(function(data){
            return new Promise(function(resolve, reject) {
                var members = $ISIS.extractMembers(data);
                resolve(members);
            });
        }.bind(this));
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
