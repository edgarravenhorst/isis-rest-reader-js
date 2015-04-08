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
