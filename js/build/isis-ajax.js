ISIS.prototype.ajax = function(url, settings, onSuccesFunc, onErrorFunc) {

    'use strict';

    if (typeof url !== 'string') return false;

    settings.method = settings.method || "GET";
    settings.headers = settings.headers || {};
    settings.format = settings.format || '';
    settings.params = settings.params || null;

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
            }else if(request.status == 401) {
                console.log('Unauthorized');
                if(onErrorFunc) onErrorFunc(request);
            }else {
                console.log('something else other than 200 was returned');
                if(onErrorFunc) onErrorFunc(request);
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
};
