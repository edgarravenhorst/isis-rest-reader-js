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
