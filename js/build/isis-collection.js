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
