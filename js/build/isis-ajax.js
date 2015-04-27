ISIS.prototype.ajax = function(url, settings, onSuccesFunc, onErrorFunc) {

    'use strict';

    return new Promise(function(resolve, reject){

        if (typeof url !== 'string') return false;

        settings = settings || {};
        settings.method = settings.method || "GET";
        settings.headers = settings.headers || {};
        settings.format = settings.format || 'json';
        settings.params = settings.params || null;

        var request = new XMLHttpRequest();

        request.onreadystatechange = function() {
            if (request.readyState == XMLHttpRequest.DONE ) {
                if(request.status == 200){
                    var response = request.responseText;
                    if(settings.format == 'json') response = JSON.parse(response);
                    //console.log(url, settings, response);

                    if(onSuccesFunc) onSuccesFunc(response);
                    resolve(response);
                }else if(request.status == 400) {
                    console.log('There was an error 400');
                    if(onErrorFunc) onErrorFunc(request);
                    reject(request);
                }else if(request.status == 401) {
                    console.log('Unauthorized');
                    if(onErrorFunc) onErrorFunc(request);
                    reject(request);
                }else {
                    console.log('something else other than 200 was returned');
                    if(onErrorFunc) onErrorFunc(request);
                    reject(request);
                }
            }
        };

        //if(settings.method == "GET"){
        var vars = "";
        for (var key in settings.params) {
            if (vars !== "")
                vars += "&";
            else
                vars+='?';

            vars += key + "=" + encodeURIComponent(settings.params[key]);
        }
        //}

        request.open(settings.method, url+vars, true);
        request.setRequestHeader('Content-Type', 'application/json; charset=utf-8');

        var user_cookie = $ISIS.getCookie('auth');
        if (user_cookie !== "") $ISIS.authHeader = user_cookie;
        if (settings.headers.Authorization) $ISIS.authHeader = settings.headers.Authorization;
        if ($ISIS.authHeader) request.setRequestHeader('Authorization', $ISIS.authHeader);

        if (settings.method === 'GET') request.send();
        else request.send();
        //else request.send(JSON.stringify(settings.params));
    });
};
