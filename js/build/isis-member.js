'use strict';

var IsisMember = function(memberData) {
    this.method = memberData.links[0].method;
    this.url = memberData.links[0].href;
    this.isReady = false;

    this.onError = function(error){
        console.log('status: ' + error.status + ' | ' + error.statusText + '\n message: ', error);
    }
};
