'use strict';

ISIS.prototype.ajax = function(url, settings, onSuccesFunc, onErrorFunc) {

    settings.method = settings.method || "GET";
    settings.headers = settings.headers || {};
    settings.format = settings.format || '';

    var request = new XMLHttpRequest();

    request.onreadystatechange = function() {
        if (request.readyState == XMLHttpRequest.DONE ) {
            if(request.status == 200){
                var response = request.responseText;
                if(settings.format == 'json') response = JSON.parse(response)
                if(onSuccesFunc) onSuccesFunc(response);
            }else if(request.status == 400) {
                console.log('There was an error 400')
                if(onErrorFunc) onErrorFunc(request)
            }else {
                console.log('something else other than 200 was returned')
                if(onErrorFunc) onErrorFunc(request)
            }
        }
    }

    request.open(settings.method, url, true);

    if (settings.headers.Authorization) $ISIS.authHeader = settings.headers.Authorization;
    if ($ISIS.authHeader) request.setRequestHeader('Authorization', $ISIS.authHeader);

    request.send();
}
