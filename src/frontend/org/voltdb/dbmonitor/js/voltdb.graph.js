
(function (window) {

    var IMonitorGraphUI = (function () {
        var RETAINED_TIME_INTERVAL = 60; //60 means graph data within 60 minutes time interval will be stored in local storage.
        var currentView = "Seconds";
        var currentViewDr = "Seconds";
        var currentViewImporter = "Seconds"
        var cpuSecCount = 0;
        var cpuMinCount = 0;
        var cmdLogSecCount = 0;
        var cmdLogMinCount = 0;
        var tpsSecCount = 0;
        var tpsMinCount = 0;
        var memSecCount = 0;
        var memMinCount = 0;
        var latSecCount = 0;
        var latMinCount = 0;
        var partitionSecCount = 0;
        var partitionMinCount = 0;
        var drSecCount = 0;
        var drMinCount = 0;
        var outTransSecCount = 0;
        var outTransMinCount = 0;
        var successRateSecCount = 0;
        var successRateMinCount = 0;
        var failureRateSecCount = 0;
        var failureRateMinCount = 0;
        var totalEmptyData = 121;
        var totalEmptyDataForMinutes = 121;
        var totalEmptyDataForDays = 360;
        var cpuChart;
        var ramChart;
        var latencyChart;
        var transactionChart;
        var partitionChart;
        var drReplicationChart;
        var outTransChart;
        var successRateChart;
        var failureRateChart;
        var drReplicationCharts = {};
        var cmdLogChart;
        var cmdLogOverlay = [];
        var cmdLogOverlayMin = [];
        var cmdLogOverlayDay = [];
        var physicalMemory = -1;
        var Monitors = {};
        var ChartCpu = nv.models.lineChart();
        var ChartRam = nv.models.lineChart();
        var ChartLatency = nv.models.lineChart();
        var ChartTransactions = nv.models.lineChart();
        var ChartPartitionIdleTime = nv.models.lineChart();
        var ChartDrReplicationRate = nv.models.lineChart();
        var ChartOutTrans = nv.models.lineChart();
        var ChartSuccessRate =  nv.models.lineChart();
        var ChartFailureRate = nv.models.lineChart();
        var drChartList = {}
        var ChartCommandlog = nv.models.lineChart();
        var dataMapperSec = {};
        var dataMapperMin = {};
        var dataMapperDay = {};
        this.enumPartitionColor = {
            localPartition: "#D3D3D3",
            maxMinPartition: "#4C76B0",
            multiPartition: "#FF8C00"
        }
        this.enumMaxTimeGap = {
            secGraph: 300000,
            minGraph: 1800000,
            dayGraph: 27000000
        }
        this.GetPartitionDetailData = function (partitionDetails) {
            dataParitionDetails = partitionDetails;
        };

        function getEmptyData() {
            var arr = [];
            var theDate = new Date();

            for (var i = totalEmptyData; i >= 0; i--) {
                arr[i] = { x: new Date(theDate.getTime()), y: null };
                theDate.setSeconds(theDate.getSeconds() - 5);
            }

            return arr;
        }

        function getEmptyDataForMinutes() {
            var arr = [];
            var theDate = new Date();

            for (var i = totalEmptyDataForMinutes; i >= 0; i--) {
                arr[i] = { x: new Date(theDate.getTime()), y: null };
                theDate.setSeconds(theDate.getSeconds() - 30);
            }

            return arr;
        }

        function getEmptyDataForDays() {
            var arr = [];
            var theDate = new Date();

            for (var i = totalEmptyDataForDays; i >= 0; i--) {
                arr[i] = { x: new Date(theDate.getTime()), y: null };
                theDate.setMinutes(theDate.getMinutes() - 5);
            }

            return arr;
        }

        function getEmptyDataForPartition() {
            var count = 0;
            var dataPartition = [];

            if (dataParitionDetails != undefined) {
                $.each(dataParitionDetails, function (key, value) {
                    $.each(value, function (datatype, datatypeValue) {
                        $.each(datatypeValue, function (partitionKey, partitionValue) {
                            var arr = [];
                            arr.push(emptyData[0]);
                            arr.push(emptyData[emptyData.length - 1]);
                            if (datatype == "data") {
                                dataPartition.push({ key: partitionKey, values: arr, color: MonitorGraphUI.enumPartitionColor.localPartition });
                            } else if (datatype == "dataMPI") {
                                dataPartition.push({ key: partitionKey, values: arr, color: MonitorGraphUI.enumPartitionColor.multiPartition });
                            } else if (datatype == "dataMax" || datatype == "dataMin") {
                                dataPartition.push({ key: partitionKey, values: arr, color: MonitorGraphUI.enumPartitionColor.maxMinPartition});
                            }
                            dataMapperSec[partitionKey] = count;
                            count++;
                        });
                    });
                });
            }
            return dataPartition;
        };

        function getEmptyDataForPartitionForMinutes() {
            var count = 0;
            var dataPartition = [];
            if (dataParitionDetails != undefined) {
                $.each(dataParitionDetails, function (key, value) {
                    $.each(value, function (datatype, datatypeValue) {
                        $.each(datatypeValue, function (partitionKey, partitionValue) {
                            var arr = [];
                            arr.push(emptyDataForMinutes[0]);
                            arr.push(emptyDataForMinutes[emptyDataForMinutes.length - 1]);
                            if (datatype == "data") {
                                dataPartition.push({ key: partitionKey, values: arr, color: "#D3D3D3" });
                            } else if (datatype == "dataMPI") {
                                dataPartition.push({ key: partitionKey, values: arr, color: "#FF8C00" });
                            } else if (datatype == "dataMax" || datatype == "dataMin") {
                                dataPartition.push({ key: partitionKey, values: arr, color: "#4C76B0" });
                            }
                            dataMapperMin[partitionKey] = count;
                            count++;
                        });
                    });
                });
            }
            return dataPartition;
        };

        function getEmptyDataForPartitionForDay() {
            var count = 0;
            var dataPartition = [];
            if (dataParitionDetails != undefined) {
                $.each(dataParitionDetails, function (key, value) {
                    $.each(value, function (datatype, datatypeValue) {
                        $.each(datatypeValue, function (partitionKey, partitionValue) {
                            var arr = [];
                            arr.push(emptyDataForDays[0]);
                            arr.push(emptyDataForDays[emptyDataForDays.length - 1]);
                            if (datatype == "data") {
                                dataPartition.push({ key: partitionKey, values: arr, color: "#D3D3D3" });
                            } else if (datatype == "dataMPI") {
                                dataPartition.push({ key: partitionKey, values: arr, color: "#FF8C00" });
                            } else if (datatype == "dataMax" || datatype == "dataMin") {
                                dataPartition.push({ key: partitionKey, values: arr, color: "#4C76B0" });
                            }
                            dataMapperDay[partitionKey] = count;
                            count++;
                        });
                    });
                });
            }
            return dataPartition;
        };

        var emptyData = getEmptyData();
        var emptyDataForMinutes = getEmptyDataForMinutes();
        var emptyDataForDays = getEmptyDataForDays();

        function getEmptyDataOptimized() {
            var arr = [];
            arr.push(emptyData[0]);
            arr.push(emptyData[emptyData.length - 1]);

            return arr;
        }

        function getEmptyDataForMinutesOptimized() {
            var arr = [];
            arr.push(emptyDataForMinutes[0]);
            arr.push(emptyDataForMinutes[emptyDataForMinutes.length - 1]);

            return arr;
        }

        function getEmptyDataForDaysOptimized() {
            var arr = [];
            arr.push(emptyDataForDays[0]);
            arr.push(emptyDataForDays[emptyDataForDays.length - 1]);

            return arr;
        }

        var dataCpu = [{
            "key": "CPU",
            "values": getEmptyDataOptimized(),
            "color": "rgb(164, 136, 5)"
        }];

        var dataOutTrans = [{
            "key": "Outstanding Transactions",
            "values": getEmptyDataOptimized(),
            "color": "rgb(164, 136, 5)"
        }];

        var dataSuccessRate = [{
            "key": "Success Rate",
            "values": getEmptyDataOptimized(),
            "color": "rgb(164, 136, 5)"
        }];

        var dataFailureRate = [{
            "key": "Failure Rate",
            "values": getEmptyDataOptimized(),
            "color": "rgb(27, 135, 200)"
        }];

        var dataRam = [{
            "key": "RAM",
            "values": getEmptyDataOptimized(),
            "color": "rgb(164, 136, 5)"
        }];

        var dataLatency = [{
            "key": "Latency",
            "values": getEmptyDataOptimized(),
            "color": "rgb(27, 135, 200)"
        }];

        var dataTransactions = [{
            "key": "Transactions",
            "values": getEmptyDataOptimized(),
            "color": "rgb(27, 135, 200)"
        }];

        var dataDrReplicationRate = [{
            "key": "Replication Rate",
            "values": getEmptyDataOptimized(),
            "color": "rgb(27, 135, 200)"
        }];

        var dataDrReplication = {}

        var dataCommandLog = [{
            "key": "Command Log Statistics",
            "values": getEmptyDataOptimized(),
            "color": "rgb(27, 135, 200)"
        }];

        var dataPartitionIdleTime = [];

        var dataParitionDetails = [];

        nv.addGraph({
            generate: function() {
                ChartCpu.xAxis
                .tickFormat(function (d) {
                    return d3.time.format('%X')(new Date(d));
                });

                ChartCpu.xAxis.rotateLabels(-20);

                ChartCpu.yAxis
                    .tickFormat(d3.format(',.2f'));

                ChartCpu.yAxis
                    .axisLabel('(%)')
                    .axisLabelDistance(10);

                ChartCpu.margin({ left: 100 });
                ChartCpu.yAxis.scale().domain([0, 100]);
                ChartCpu.lines.forceY([0, 100]);

                d3.select('#visualisationCpu')
                    .datum(dataCpu)
                    .transition().duration(500)
                    .call(ChartCpu);

                nv.utils.windowResize(ChartCpu.update);

                return ChartCpu;
            },
            callback: function (p) {
                ChartCpu.useInteractiveGuideline(true);
                return ChartCpu;
            }
        });

        nv.addGraph({
            generate: function() {
                ChartRam.xAxis
                    .tickFormat(function (d) {
                      return d3.time.format('%X')(new Date(d));
                    });

                ChartRam.xAxis.rotateLabels(-20);

                ChartRam.yAxis
                    .tickFormat(d3.format(',.4f'));

                ChartRam.yAxis
                    .axisLabel('(GB)')
                    .axisLabelDistance(10);

                ChartRam.margin({ left: 100 });
                ChartRam.lines.forceY([0, 0.1]);

                d3.select('#visualisationRam')
                    .datum(dataRam)
                    .transition().duration(500)
                    .call(ChartRam);

                nv.utils.windowResize(ChartRam.update);
            },
            callback: function (p) {
                ChartRam.useInteractiveGuideline(true);
                return ChartCpu;
            }
        });

        nv.addGraph({
            generate: function() {
                ChartLatency.xAxis
                    .tickFormat(function (d) {
                      return d3.time.format('%X')(new Date(d));
                    });

                ChartLatency.xAxis.rotateLabels(-20);

                ChartLatency.yAxis
                    .tickFormat(d3.format(',.2f'));

                ChartLatency.yAxis
                    .axisLabel('(ms)')
                    .axisLabelDistance(10);

                ChartLatency.margin({ left: 100 });
                ChartLatency.lines.forceY([0, 1]);

                d3.select('#visualisationLatency')
                    .datum(dataLatency)
                    .transition().duration(500)
                    .call(ChartLatency);

                nv.utils.windowResize(ChartLatency.update);
            },
            callback: function(p) {
                ChartLatency.useInteractiveGuideline(true);
                return ChartLatency;
            }
        });

        nv.addGraph({
            generate: function() {
                ChartTransactions.xAxis
                    .tickFormat(function (d) {
                      return d3.time.format('%X')(new Date(d));
                    });

                ChartTransactions.xAxis.rotateLabels(-20);

                ChartTransactions.yAxis
                   .tickFormat(d3.format(',.2f'));

                ChartTransactions.yAxis
                   .axisLabel('(Transactions/s)')
                   .axisLabelDistance(10);

                ChartTransactions.margin({ left: 100 });
                ChartTransactions.lines.forceY([0, 1]);

                d3.select('#visualisationTransaction')
                   .datum(dataTransactions)
                   .transition().duration(500)
                   .call(ChartTransactions);

                nv.utils.windowResize(ChartTransactions.update);
           },
           callback: function(p) {
               ChartTransactions.useInteractiveGuideline(true);
               return ChartTransactions;
           }
        });

        nv.addGraph({
            generate:function() {
                ChartPartitionIdleTime.xAxis
                    .tickFormat(function (d) {
                        return d3.time.format('%X')(new Date(d));
                    });

                ChartPartitionIdleTime.showLegend(false);
                ChartPartitionIdleTime.xAxis.rotateLabels(-20);

                ChartPartitionIdleTime.yAxis
                    .tickFormat(d3.format(',.2f'));

                ChartPartitionIdleTime.yAxis
                    .axisLabel('(%)')
                    .axisLabelDistance(10);

                ChartPartitionIdleTime.margin({ left: 100 });
                ChartPartitionIdleTime.yAxis.scale().domain([0, 100]);
                ChartPartitionIdleTime.lines.forceY([0, 100]);

                d3.select('#visualisationPartitionIdleTime')
                    .datum([])
                    .transition().duration(500)
                    .call(ChartPartitionIdleTime);

                nv.utils.windowResize(ChartPartitionIdleTime.update);
            },
            callback: function () {
                ChartPartitionIdleTime.useInteractiveGuideline(true);
                return ChartPartitionIdleTime;
            }
        });

        nv.addGraph({
            generate: function () {
                ChartCommandlog.showLegend(false);

                ChartCommandlog.xAxis
                    .tickFormat(function (d) {
                        return d3.time.format('%X')(new Date(d));
                    });

                ChartCommandlog.xAxis.rotateLabels(-20);

                ChartCommandlog.yAxis
                    .tickFormat(d3.format(',.2f'));

                ChartCommandlog.yAxis
                    .axisLabel('(Pending Transactions)')
                    .axisLabelDistance(10);

                ChartCommandlog.margin({ left: 100 });
                ChartCommandlog.lines.forceY([0, 0.1]);

                d3.select('#visualisationCommandLog')
                    .datum(dataCommandLog)
                    .transition().duration(500)
                    .call(ChartCommandlog);

                nv.utils.windowResize(ChartCommandlog.update);
           },
           callback:function() {
               ChartCommandlog.useInteractiveGuideline(true);
               return ChartCommandlog;
           }
        });

        nv.addGraph({
            generate: function () {
                ChartOutTrans.xAxis
                    .tickFormat(function (d) {
                        return d3.time.format('%X')(new Date(d));
                    });

                ChartOutTrans.xAxis.rotateLabels(-20);

                ChartOutTrans.yAxis
                    .tickFormat(d3.format(',.2f'));

                ChartOutTrans.yAxis
                    .axisLabel('(%)')
                    .axisLabelDistance(10);

                ChartOutTrans.margin({ left: 100 });
                ChartOutTrans.lines.forceY([0, 0.1]);

                d3.select('#visualisationOutTrans')
                    .datum(dataOutTrans)
                    .transition().duration(500)
                    .call(ChartOutTrans);

                nv.utils.windowResize(ChartOutTrans.update);
           },
           callback:function() {
               ChartOutTrans.useInteractiveGuideline(true);
               return ChartOutTrans;
           }
        });

        nv.addGraph({
            generate: function () {
                ChartSuccessRate.xAxis
                    .tickFormat(function (d) {
                        return d3.time.format('%X')(new Date(d));
                    });

                ChartSuccessRate.xAxis.rotateLabels(-20);

                ChartSuccessRate.yAxis
                    .tickFormat(d3.format(',.2f'));

                ChartSuccessRate.yAxis
                    .axisLabel('(%)')
                    .axisLabelDistance(10);

                ChartSuccessRate.margin({ left: 100 });
                ChartSuccessRate.lines.forceY([0, 0.1]);

                d3.select('#visualisationSuccessRate')
                    .datum(dataSuccessRate)
                    .transition().duration(500)
                    .call(ChartSuccessRate);

                nv.utils.windowResize(ChartSuccessRate.update);
           },
           callback:function() {
               ChartSuccessRate.useInteractiveGuideline(true);
               return ChartSuccessRate;
           }
        });

        nv.addGraph({
            generate: function () {
                ChartFailureRate.xAxis
                    .tickFormat(function (d) {
                        return d3.time.format('%X')(new Date(d));
                    });

                ChartFailureRate.xAxis.rotateLabels(-20);

                ChartFailureRate.yAxis
                    .tickFormat(d3.format(',.2f'));

                ChartFailureRate.yAxis
                    .axisLabel('(%)')
                    .axisLabelDistance(10);

                ChartFailureRate.margin({ left: 100 });
                ChartFailureRate.lines.forceY([0, 0.1]);

                d3.select('#visualisationFailureRate')
                    .datum(dataFailureRate)
                    .transition().duration(500)
                    .call(ChartFailureRate);

                nv.utils.windowResize(ChartFailureRate.update);
           },
           callback:function() {
               ChartFailureRate.useInteractiveGuideline(true);
               return ChartFailureRate;
           }
        });

        goog.math.Long.prototype.numberOfLeadingZeros = function () {
            var n = 1;
            var x = this.high_;
            if (x == 0) { n += 32; x = this.low_; }
            if (x >>> 16 == 0) { n += 16; x <<= 16; }
            if (x >>> 24 == 0) { n +=  8; x <<=  8; }
            if (x >>> 28 == 0) { n +=  4; x <<=  4; }
            if (x >>> 30 == 0) { n +=  2; x <<=  2; }
            n -= x >>> 31;
            return n;
        };

        function Histogram(lowestTrackableValue, highestTrackableValue, nSVD, totalCount) {
            this.lowestTrackableValue = lowestTrackableValue;
            this.highestTrackableValue = highestTrackableValue;
            this.nSVD = nSVD;
            this.totalCount = totalCount;
            this.count = [];
            this.init();
        }

        Histogram.prototype.init = function () {
            var largestValueWithSingleUnitResolution = 2 * Math.pow(10, this.nSVD);
            this.unitMagnitude = Math.floor(Math.log(this.lowestTrackableValue) / Math.log(2));
            var subBucketCountMagnitude = Math.ceil(Math.log(largestValueWithSingleUnitResolution) / Math.log(2));
            this.subBucketHalfCountMagnitude = ((subBucketCountMagnitude > 1) ? subBucketCountMagnitude : 1) - 1;
            this.subBucketCount = Math.pow(2, (this.subBucketHalfCountMagnitude + 1));
            this.subBucketHalfCount = this.subBucketCount / 2;
            var subBucketMask = goog.math.Long.fromInt(this.subBucketCount - 1);
            this.subBucketMask = subBucketMask.shiftLeft(this.unitMagnitude);
            // Establish leadingZeroCountBase, used in getBucketIndex() fast path:
            this.leadingZeroCountBase = 64 - this.unitMagnitude - this.subBucketHalfCountMagnitude - 1;
            var trackableValue = (this.subBucketCount - 1) << this.unitMagnitude;
            var bucketsNeeded = 1;
            while (trackableValue < this.highestTrackableValue) {
                trackableValue *= 2;
                bucketsNeeded++;
            }
            this.bucketCount = bucketsNeeded;
            this.countsArrayLength = (this.bucketCount + 1) * (this.subBucketCount / 2);
        };

        Histogram.prototype.diff = function (newer) {
            var h = new Histogram(newer.lowestTrackableValue, newer.highestTrackableValue, newer.nSVD, newer.totalCount - this.totalCount);
            for (var i = 0; i < h.countsArrayLength; i++) {
                h.count[i] = newer.count[i] - this.count[i];
            }
            return h;
        };

        Histogram.prototype.getCountAt = function (bucketIndex, subBucketIndex) {
            var bucketBaseIndex = (bucketIndex + 1) << this.subBucketHalfCountMagnitude;
            var offsetInBucket = subBucketIndex - this.subBucketHalfCount;
            var countIndex = bucketBaseIndex + offsetInBucket;
            return this.count[countIndex];
        };

        Histogram.prototype.normalizeIndex = function (index, normalizingIndexOffset, arrayLength) {
            if (normalizingIndexOffset == 0) {
                // Fastpath out of normalization. Keeps integer value histograms fast while allowing
                // others (like DoubleHistogram) to use normalization at a cost...
                return index;
            }
            if ((index > arrayLength) || (index < 0)) {
                throw new ArrayIndexOutOfBoundsException("index out of covered value range");
            }
            var normalizedIndex = index - normalizingIndexOffset;
            // The following is the same as an unsigned remainder operation, as long as no double wrapping happens
            // (which shouldn't happen, as normalization is never supposed to wrap, since it would have overflowed
            // or underflowed before it did). This (the + and - tests) seems to be faster than a % op with a
            // correcting if < 0...:
            if (normalizedIndex < 0) {
                normalizedIndex += arrayLength;
            } else if (normalizedIndex >= arrayLength) {
                normalizedIndex -= arrayLength;
            }
            return normalizedIndex;
        };

        Histogram.prototype.getCountAtIndex = function (index) {
            return this.count[this.normalizeIndex(index, 0, this.countsArrayLength)];
        };

        Histogram.prototype.valueFromIndex2 = function (bucketIndex, subBucketIndex) {
            return subBucketIndex * Math.pow(2, bucketIndex + this.unitMagnitude);
        };

        Histogram.prototype.valueFromIndex = function (index) {
            var bucketIndex = (index >> this.subBucketHalfCountMagnitude) - 1;
            var subBucketIndex = (index & (this.subBucketHalfCount - 1)) + this.subBucketHalfCount;
            if (bucketIndex < 0) {
                subBucketIndex -= this.subBucketHalfCount;
                bucketIndex = 0;
            }
            return this.valueFromIndex2(bucketIndex, subBucketIndex);
        };

        Histogram.prototype.lowestEquivalentValue = function (value) {
            var bucketIndex = this.getBucketIndex(value);
            var subBucketIndex = this.getSubBucketIndex(value, bucketIndex);
            var thisValueBaseLevel = this.valueFromIndex2(bucketIndex, subBucketIndex);
            return thisValueBaseLevel;
        };

        Histogram.prototype.highestEquivalentValue = function (value) {
            return this.nextNonEquivalentValue(value) - 1;
        };

        Histogram.prototype.highestEquivalentValue = function (value) {
            return this.lowestEquivalentValue(value) + this.sizeOfEquivalentValueRange(value);
        };

        Histogram.prototype.sizeOfEquivalentValueRange = function (value) {
            var bucketIndex = this.getBucketIndex(value);
            var subBucketIndex = this.getSubBucketIndex(value, bucketIndex);
            var distanceToNextValue =
                (1 << ( this.unitMagnitude + ((subBucketIndex >= this.subBucketCount) ? (bucketIndex + 1) : bucketIndex)));
            return distanceToNextValue;
        };

        Histogram.prototype.getBucketIndex = function (value) {
            return this.leadingZeroCountBase - (goog.math.Long.fromNumber(value).or(this.subBucketMask)).numberOfLeadingZeros();
        };

        Histogram.prototype.getSubBucketIndex = function (value, bucketIndex) {
            return  (value >>> (bucketIndex + this.unitMagnitude));
        };

        Histogram.prototype.getValueAtPercentile = function (percentile) {
            var requestedPercentile = Math.min(percentile, 100.0); // Truncate down to 100%
            var countAtPercentile = Math.floor(((percentile / 100.0) * this.totalCount) + 0.5); // round to nearest
            countAtPercentile = Math.max(countAtPercentile, 1); // Make sure we at least reach the first recorded entry
            var totalToCurrentIndex = 0;
            for (var i = 0; i < this.countsArrayLength; i++) {
                totalToCurrentIndex += this.getCountAtIndex(i);
                if (totalToCurrentIndex >= countAtPercentile) {
                    var valueAtIndex = this.valueFromIndex(i);
                    return (percentile == 0.0) ?
                        this.lowestEquivalentValue(valueAtIndex)/1000.0 :
                        this.highestEquivalentValue(valueAtIndex)/1000.0;
                }
            }
            return 0;
        };

        function read32(str) {
            var s1 = str.substring(0, 2);
            var s2 = str.substring(2, 4);
            var s3 = str.substring(4, 6);
            var s4 = str.substring(6, 8);
            return s4 + s3 + s2 + s1;
        }

        function read64(str) {
            var s1 = read32(str);
            var s2 = read32(str.substring(8, 16));
            return s2 + s1;
        }

        function convert2Histogram(str) {
            // Read lowestTrackableValue
            var lowestTrackableValue = parseInt(read64(str), 16);
            str = str.substring(16, str.length);

            // Read highestTrackableValue
            var highestTrackableValue = parseInt(read64(str), 16);
            str = str.substring(16, str.length);

            // Read numberOfSignificantValueDigits
            var nSVD = parseInt(read32(str), 16);
            str = str.substring(8, str.length);

            // Read totalCount
            var totalCount = parseInt(read64(str), 16);
            str = str.substring(16, str.length);

            var histogram = new Histogram(lowestTrackableValue, highestTrackableValue, nSVD, totalCount);

            var i = 0;
            while (str.length >= 16) {
                var value = parseInt(read64(str), 16);
                histogram.count[i] = value;
                str = str.substring(16, str.length);
                i++;
            }
            return histogram;
        }

        var getEmptyDataForView = function (view) {
            view = view != undefined ? view.toLowerCase() : "seconds";

            if (view == "minutes")
                return getEmptyDataForMinutesOptimized();
            else if (view == "days")
                return getEmptyDataForDaysOptimized();

            return getEmptyDataOptimized();
        };

        var getEmptyDataForPartitionView = function (view) {
            view = view != undefined ? view.toLowerCase() : "seconds";

            if (view == "minutes")
                return getEmptyDataForPartitionForMinutes();
            else if (view == "days")
                return getEmptyDataForPartitionForDay();

            return getEmptyDataForPartition();
        };

        this.AddGraph = function (view, cpuChartObj, ramChartObj, clusterChartObj, transactinoChartObj, partitionChartObj, drReplicationCharObj, cmdLogChartObj) {
            cpuChart = cpuChartObj;
            ramChart = ramChartObj;
            latencyChart = clusterChartObj;
            transactionChart = transactinoChartObj;
            partitionChart = partitionChartObj;
            drReplicationChart = drReplicationCharObj;
            cmdLogChart = cmdLogChartObj;            currentView = view;
            Monitors = {
                'latHistogram': {},
                'latData': getEmptyDataOptimized(),
                'latDataMin': getEmptyDataForMinutesOptimized(),
                'latDataDay': getEmptyDataForDaysOptimized(),
                'latFirstData': true,
                'latMaxTimeStamp': null,
                'tpsData': getEmptyDataOptimized(),
                'tpsDataMin': getEmptyDataForMinutesOptimized(),
                'tpsDataDay': getEmptyDataForDaysOptimized(),
                'tpsFirstData': true,
                'memData': getEmptyDataOptimized(),
                'memDataMin': getEmptyDataForMinutesOptimized(),
                'memDataDay': getEmptyDataForDaysOptimized(),
                'memFirstData': true,
                'memMaxTimeStamp': null,
                'cpuData': getEmptyDataOptimized(),
                'cpuDataMin': getEmptyDataForMinutesOptimized(),
                'cpuDataHrs': getEmptyDataForDaysOptimized(),
                'cpuFirstData': true,
                'cpuMaxTimeStamp':null,
                'partitionData': getEmptyDataForPartition(),
                'partitionDataMin': getEmptyDataForPartitionForMinutes(),
                'partitionDataDay': getEmptyDataForPartitionForDay(),
                'partitionFirstData': true,
                'partitionMaxTimeStamp':null,
                'cmdLogData': getEmptyDataOptimized(),
                'cmdLogDataMin': getEmptyDataForMinutesOptimized(),
                'cmdLogDataDay': getEmptyDataForDaysOptimized(),
                'cmdLogFirstData': true,
                'cmdLogMaxTimeStamp': null,
                'lastTimedTransactionCount': -1,
                'lastTimerTick': -1
            };

            dataCpu[0]["values"] = getEmptyDataForView(view);
            dataRam[0]["values"] = getEmptyDataForView(view);
            dataLatency[0]["values"] = getEmptyDataForView(view);
            dataTransactions[0]["values"] = getEmptyDataForView(view);
            dataPartitionIdleTime = getEmptyDataForPartitionView(view);
            dataCommandLog[0]["values"] = getEmptyDataForView(view);
            changeAxisTimeFormat(view);
        };

        this.InitializeDrData = function(){
            var chartList = VoltDbUI.drChartList;
            if(chartList != undefined && chartList.length > 0){
                for(var i = 0; i < chartList.length; i++){
                    dataDrReplication['dataDrReplication_' + chartList[i]] = [
                        {
                            "key": "Replication Rate",
                            "values": getEmptyDataOptimized(),
                            "color": "rgb(27, 135, 200)"
                        }
                    ];
                }
            }
        }

        this.AddDrGraph = function(view){
            currentViewDr = view;
            var chartList = VoltDbUI.drChartList;
            if(chartList != undefined && chartList.length > 0){
                for(var i = 0; i < chartList.length; i++){
                    drReplicationCharts['ChartDrReplicationRate_' + chartList[i]] = $('#ChartDrReplicationRate_' + chartList[i]);
                    Monitors['drReplicationData_' + chartList[i]] = getEmptyDataOptimized();
                    Monitors['drReplicationDataMin_' + chartList[i]] = getEmptyDataForMinutesOptimized();
                    Monitors['drReplicationDataDay_' + chartList[i]] = getEmptyDataForDaysOptimized();
                    Monitors['drFirstData_' + chartList[i]] = true;
                    Monitors['drMaxTimeStamp_' + chartList[i]] = null;
                    Monitors['drSecCount_' + chartList[i]] = 0;
                    Monitors['drMinCount_' + chartList[i]] = 0;
                    dataDrReplication['dataDrReplication_' + chartList[i]][0]["values"] = getEmptyDataForView();
                }
            }
            changeDrAxisTimeFormat(view)
        }

        this.AddImporterGraph = function (view, outTransChartObj, successRateChartObj, failureRateChartObj) {
            outTransChart = outTransChartObj;
            successRateChart = successRateChartObj;
            failureRateChart = failureRateChartObj;
            currentViewImporter = view;

            Monitors['outTransData'] = getEmptyDataOptimized();
            Monitors['outTransDataMin'] = getEmptyDataForMinutesOptimized();
            Monitors['outTransDataDay'] = getEmptyDataForDaysOptimized();
            Monitors['outTransFirstData'] = true;
            Monitors['outTransMaxTimeStamp'] = null;

            Monitors['successRateData'] = getEmptyDataOptimized();
            Monitors['successRateDataMin'] = getEmptyDataForMinutesOptimized();
            Monitors['successRateDataDay'] = getEmptyDataForDaysOptimized();
            Monitors['successRateFirstData'] = true;
            Monitors['successRateMaxTimeStamp'] = null;

            Monitors['failureRateData'] = getEmptyDataOptimized();
            Monitors['failureRateDataMin'] = getEmptyDataForMinutesOptimized();
            Monitors['failureRateDataDay'] = getEmptyDataForDaysOptimized();
            Monitors['failureRateFirstData'] = true;
            Monitors['failureRateMaxTimeStamp'] = null;

            dataOutTrans[0]["values"] = getEmptyDataForView(view);
            dataSuccessRate[0]["values"] = getEmptyDataForView(view);
            dataFailureRate[0]["values"] = getEmptyDataForView(view);
            changeAxisTimeFormat(view);
        };

        this.RefreshGraph = function (view) {
            currentView = view;
            if (view == 'Days') {
                dataCpu[0]["values"] = Monitors.cpuDataHrs;
                dataTransactions[0]["values"] = Monitors.tpsDataDay;
                dataRam[0]["values"] = Monitors.memDataDay;
                dataLatency[0]["values"] = Monitors.latDataDay;
                dataPartitionIdleTime = Monitors.partitionDataDay;
                dataCommandLog[0]["values"] = Monitors.cmdLogDataDay;
            } else if (view == 'Minutes') {
                dataCpu[0]["values"] = Monitors.cpuDataMin;
                dataTransactions[0]["values"] = Monitors.tpsDataMin;
                dataRam[0]["values"] = Monitors.memDataMin;
                dataLatency[0]["values"] = Monitors.latDataMin;
                dataPartitionIdleTime = Monitors.partitionDataMin;
                dataCommandLog[0]["values"] = Monitors.cmdLogDataMin;
            } else {
                dataCpu[0]["values"] = Monitors.cpuData;
                dataTransactions[0]["values"] = Monitors.tpsData;
                dataRam[0]["values"] = Monitors.memData;
                dataLatency[0]["values"] = Monitors.latData;
                dataPartitionIdleTime = Monitors.partitionData;
                dataCommandLog[0]["values"] = Monitors.cmdLogData;
            }

            nv.utils.windowResize(ChartCpu.update);
            changeImporterAxisTimeFormat(view);
        };

        this.RefreshDrGraph = function (view) {
            currentViewDr = view;
            var chartList = VoltDbUI.drChartList;
            if(chartList != undefined && chartList.length > 0){
                for(var i = 0; i < chartList.length; i++){
                    if (view == 'Days') {
                        dataDrReplication['dataDrReplication_' + chartList[i]][0]["values"] = Monitors['drReplicationDataDay_' + chartList[i]]
                    } else if (view == 'Minutes') {
                        dataDrReplication['dataDrReplication_' + chartList[i]][0]["values"] = Monitors['drReplicationDataMin_' + chartList[i]]
                    } else {
                        dataDrReplication['dataDrReplication_' + chartList[i]][0]["values"] = Monitors['drReplicationData_' + chartList[i]]
                    }
                }
            }

            changeDrAxisTimeFormat(view);
        };

        this.RefreshImporterGraph = function (view) {
            currentViewImporter = view;
            if (view == 'Days') {
                dataOutTrans[0]["values"] = Monitors.outTransDataDay;
                dataSuccessRate[0]["values"] = Monitors.successRateDataDay;
                dataFailureRate[0]["values"] = Monitors.failureRateDataDay;
            } else if (view == 'Minutes') {
                dataOutTrans[0]["values"] = Monitors.outTransDataMin;
                dataSuccessRate[0]["values"] = Monitors.failureRateDataMin;
                dataFailureRate[0]["values"] = Monitors.failureRateDataMin;
            } else {
                dataOutTrans[0]["values"] = Monitors.outTransData;
                dataSuccessRate[0]["values"] = Monitors.successRateData;
                dataFailureRate[0]["values"] = Monitors.failureRateData;
            }

            changeImporterAxisTimeFormat(view);
        };

        this.UpdateCharts = function () {
            if (ramChart.is(":visible"))
                ChartRam.update();

            if (cpuChart.is(":visible"))
                ChartCpu.update();

            if (latencyChart.is(":visible"))
                ChartLatency.update();

            if (transactionChart.is(":visible"))
                ChartTransactions.update();

            if (partitionChart.is(":visible"))
                ChartPartitionIdleTime.update();

            if (cmdLogChart.is(":visible"))
                ChartCommandlog.update();
        };

        this.UpdateImporterCharts = function () {
            if (outTransChart.is(":visible"))
                ChartOutTrans.update();

            if (successRateChart.is(":visible"))
                ChartSuccessRate.update();

            if (failureRateChart.is(":visible"))
                ChartFailureRate.update();
        };

        this.UpdateDrCharts = function () {
            var chartList = VoltDbUI.drChartList;
            if(chartList != undefined && chartList.length > 0 && !$.isEmptyObject(drReplicationCharts)){
                for(var i = 0; i < chartList.length; i++){
                    if(drReplicationCharts["ChartDrReplicationRate_" + chartList[i]].is(":visible")) {
                        drChartList['ChartDrReplicationRate_' + chartList[i]].update();
                    }
                }
            }
        };


        this.InitializeDRGraph = function (){
            var drChartIds = VoltDbUI.drChartList;
            if(drChartIds.length > 0) {
                for(var i = 0; i < drChartIds.length; i++){
                    initializeGraph(drChartIds[i])
                }
            }
        }

        var initializeGraph = function (i){
            drChartList['ChartDrReplicationRate_' +i] = nv.models.lineChart();

            nv.addGraph({
                generate:function() {
                    drChartList['ChartDrReplicationRate_' + i].xAxis
                        .tickFormat(function (d) {
                           return d3.time.format('%X')(new Date(d));
                        });

                    drChartList['ChartDrReplicationRate_' + i].xAxis.rotateLabels(-20);

                    drChartList['ChartDrReplicationRate_' + i].yAxis
                        .tickFormat(d3.format(',.2f'));

                    drChartList['ChartDrReplicationRate_' + i].yAxis
                        .axisLabel('(KBps)')
                        .axisLabelDistance(10);

                    drChartList['ChartDrReplicationRate_' + i].margin({ left: 100 });
                    drChartList['ChartDrReplicationRate_' + i].lines.forceY([0, 1]);
                    d3.select('#visualizationDrReplicationRate_' + i)
                        .datum(dataDrReplication['dataDrReplication_' + i])
                        .transition().duration(500)
                        .call(drChartList['ChartDrReplicationRate_' + i]);

                    nv.utils.windowResize(drChartList['ChartDrReplicationRate_' + i].update);
                },
                callback: function() {
                    drChartList['ChartDrReplicationRate_' + i].useInteractiveGuideline(true);
                    return drChartList['ChartDrReplicationRate_' + i];
                }
            });
        }

        var changeAxisTimeFormat = function (view) {
            var dateFormat = '%X';
            if (view == 'Days')
                dateFormat = '%d %b %X';

            ChartCpu.xAxis
                .tickFormat(function (d) {
                    return d3.time.format(dateFormat)(new Date(d));
                });
            ChartRam.xAxis
                .tickFormat(function (d) {
                    return d3.time.format(dateFormat)(new Date(d));
                });
            ChartLatency.xAxis
                .tickFormat(function (d) {
                    return d3.time.format(dateFormat)(new Date(d));
                });
            ChartTransactions.xAxis
                .tickFormat(function (d) {
                    return d3.time.format(dateFormat)(new Date(d));
                });
            ChartPartitionIdleTime.xAxis
                .tickFormat(function (d) {
                    return d3.time.format(dateFormat)(new Date(d));
                });
            ChartCommandlog.xAxis
                .tickFormat(function(d) {
                    return d3.time.format(dateFormat)(new Date(d));
                });

        };

        var changeDrAxisTimeFormat = function (view) {
            var dateFormat = '%X';
            if (view == 'Days')
                dateFormat = '%d %b %X';

            var chartIds = VoltDbUI.drChartList;
            if(chartIds.length > 0) {
                for(var i = 0; i < chartIds.length; i++){
                    drChartList['ChartDrReplicationRate_' + chartIds[i]].xAxis
                        .tickFormat(function (d) {
                            return d3.time.format(dateFormat)(new Date(d));
                        });
                }
            }
        };

        var changeImporterAxisTimeFormat = function (view) {
            var dateFormat = '%X';
            if (view == 'Days')
                dateFormat = '%d %b %X';

            ChartOutTrans.xAxis
                .tickFormat(function (d) {
                    return d3.time.format(dateFormat)(new Date(d));
                });
            ChartSuccessRate.xAxis
                .tickFormat(function (d) {
                    return d3.time.format(dateFormat)(new Date(d));
                });
            ChartFailureRate.xAxis
                .tickFormat(function (d) {
                    return d3.time.format(dateFormat)(new Date(d));
                });

        };

        var dataView = {
            'Seconds': 0,
            'Minutes': 1,
            'Days': 2
        };

        function sliceFirstData(dataArray, view) {
            var total = totalEmptyData;
            var refEmptyData = emptyData;

            if (view == dataView.Minutes) {
                total = totalEmptyDataForMinutes;
                refEmptyData = emptyDataForMinutes;
            } else if (view == dataView.Days) {
                total = totalEmptyDataForDays;
                refEmptyData = emptyDataForDays;
            }

            if (dataArray.length <= total)
                dataArray[0] = refEmptyData[dataArray.length - 1];
            else
                dataArray = dataArray.slice(1);

            return dataArray;
        }

        var currentTime = new Date();

        this.setStartTime = function(){
            currentTime = new Date()
        }

        this.RefreshLatency = function (latency, graphView, currentTab) {
            var monitor = Monitors;
            var dataLat = monitor.latData;
            var dataLatMin = monitor.latDataMin;
            var dataLatDay = monitor.latDataDay;
            var timeStamp;
            var maxLatency = 0;
            var latencyArr = []
            var latencyArrMin = []
            var latencyArrDay = []

            if(localStorage.latencyMin != undefined){
                latencyArrMin = getFormattedDataFromLocalStorage(JSON.parse(localStorage.latencyMin))
            } else {
                latencyArrMin = JSON.stringify(convertDataFormat(dataLatMin, 'timestamp', 'latency'))
                latencyArrMin = JSON.parse(latencyArrMin)
            }

            if(localStorage.latency != undefined){
                latencyArr = getFormattedDataFromLocalStorage(JSON.parse(localStorage.latency))
            } else {
                latencyArr = JSON.stringify(convertDataFormat(dataLat, 'timestamp', 'latency'))
                latencyArr = JSON.parse(latencyArr)
            }

            if(localStorage.latencyDay != undefined){
                latencyArrDay = getFormattedDataFromLocalStorage(JSON.parse(localStorage.latencyDay))
            } else {
                latencyArrDay = JSON.stringify(convertDataFormat(dataLatDay, 'timestamp', 'latency'))
                latencyArrDay = JSON.parse(latencyArrDay)
            }

            if(monitor.latFirstData){
                if(latencyArr.length > 0 && !(currentTime.getTime() - (new Date(latencyArr[latencyArr.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.secGraph)){
                    dataLat = []
                    for(var i = 0; i< latencyArr.length; i++){
                        dataLat = sliceFirstData(dataLat, dataView.Seconds);
                        dataLat.push({"x": new Date(latencyArr[i].timestamp),
                            "y": latencyArr[i].latency
                        })
                    }
                }
                if(latencyArrMin.length > 0 && !(currentTime.getTime() - (new Date(latencyArrMin[latencyArrMin.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.minGraph)){
                    dataLatMin = []
                    for(var j = 0; j< latencyArrMin.length; j++){
                        dataLatMin = sliceFirstData(dataLatMin, dataView.Minutes);
                        dataLatMin.push({"x": new Date(latencyArrMin[j].timestamp),
                            "y": latencyArrMin[j].latency
                        })
                    }
                }

                if(latencyArrDay.length > 0 && !(currentTime.getTime() - (new Date(latencyArrMin[latencyArrMin.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.dayGraph)){
                    dataLatDay = []
                    for(var k = 0; k < latencyArrDay.length; k++){
                        dataLatDay = sliceFirstData(dataLatDay, dataView.Days);
                        dataLatDay.push({"x": new Date(latencyArrDay[k].timestamp),
                            "y": latencyArrDay[k].latency
                        })
                    }
                }
            }

            // Compute latency statistics
            jQuery.each(latency, function (id, val) {
                var strLatStats = val["UNCOMPRESSED_HISTOGRAM"];
                timeStamp = val["TIMESTAMP"];
                var latStats = convert2Histogram(strLatStats);
                var singlelat = 0;
                if (!monitor.latHistogram.hasOwnProperty(id))
                    singlelat = latStats.getValueAtPercentile(99);
                else
                    singlelat = monitor.latHistogram[id].diff(latStats).getValueAtPercentile(99);
                singlelat = parseFloat(singlelat).toFixed(1) * 1;

                if (singlelat > maxLatency) {
                    maxLatency = singlelat;
                }

                monitor.latHistogram[id] = latStats;
            });

            var lat = maxLatency;
            if (lat < 0)
                lat = 0;
            if (monitor.latMaxTimeStamp <= timeStamp) {
                if (latSecCount >= 6 || monitor.latFirstData) {
                    dataLatMin = sliceFirstData(dataLatMin, dataView.Minutes);
                    if (monitor.latMaxTimeStamp == timeStamp) {
                        dataLatMin.push({ 'x': new Date(timeStamp), 'y': dataLatMin[dataLatMin.length - 1].y });
                        latencyArrMin = saveLocalStorageInterval(latencyArrMin, {"timestamp": new Date(timeStamp), "latency": dataLatMin[dataLatMin.length - 1].y })
                    } else {
                        dataLatMin.push({ 'x': new Date(timeStamp), 'y': lat });
                        latencyArrMin = saveLocalStorageInterval(latencyArrMin, {"timestamp": new Date(timeStamp), "latency": lat })
                    }
                    Monitors.latDataMin = dataLatMin;
                    latSecCount = 0;
                }

                if (latMinCount >= 60 || monitor.latFirstData) {
                    dataLatDay = sliceFirstData(dataLatDay, dataView.Days);
                    if (monitor.latMaxTimeStamp == timeStamp) {
                        dataLatDay.push({ 'x': new Date(timeStamp), 'y': dataLatDay[dataLatDay.length - 1].y });
                        latencyArrDay = saveLocalStorageInterval(latencyArrDay, {"timestamp": new Date(timeStamp), "latency": dataLatMin[dataLatMin.length - 1].y })
                    } else {
                        dataLatDay.push({ 'x': new Date(timeStamp), 'y': lat });
                        latencyArrDay = saveLocalStorageInterval(latencyArrDay, {"timestamp": new Date(timeStamp), "latency": lat })
                    }
                    Monitors.latDataDay = dataLatDay;
                    latMinCount = 0;
                }

                dataLat = sliceFirstData(dataLat, dataView.Seconds);
                if (monitor.latMaxTimeStamp == timeStamp) {
                    dataLat.push({ 'x': new Date(timeStamp), 'y': dataLat[dataLat.length - 1].y });
                    latencyArr = saveLocalStorageInterval(latencyArr, {"timestamp": new Date(timeStamp), "latency": dataLat[dataLat.length - 1].y })
                } else {
                    dataLat.push({ 'x': new Date(timeStamp), 'y': lat });
                    latencyArr = saveLocalStorageInterval(latencyArr, {"timestamp": new Date(timeStamp), "latency": lat })
                }
                Monitors.latData = dataLat;

                localStorage.latency = JSON.stringify(latencyArr)
                localStorage.latencyMin = JSON.stringify(latencyArrMin)
                localStorage.latencyDay = JSON.stringify(latencyArrDay)

                if (graphView == 'Minutes')
                    dataLatency[0]["values"] = dataLatMin;
                else if (graphView == 'Days')
                    dataLatency[0]["values"] = dataLatDay;
                else
                    dataLatency[0]["values"] = dataLat;

                if (currentTab == NavigationTabs.DBMonitor && currentView == graphView && latencyChart.is(":visible")) {
                    d3.select("#visualisationLatency")
                        .datum(dataLatency)
                        .transition().duration(500)
                        .call(ChartLatency);
                }
                monitor.latFirstData = false;
            }
            if(timeStamp > monitor.latMaxTimeStamp)
                monitor.latMaxTimeStamp = timeStamp;
            latSecCount++;
            latMinCount++;
            latency = null
        };

        this.RefreshMemory = function (memoryDetails, currentServer, graphView, currentTab) {
            var monitor = Monitors;
            var dataMem = monitor.memData;
            var dataMemMin = monitor.memDataMin;
            var dataMemDay = monitor.memDataDay;
            var memDetails = memoryDetails;
            var x = 0;
            var y = 0;
            var memoryDetailsArr = []
            var memoryDetailsArrMin = []
            var memoryDetailsArrDay = []

            if ($.isEmptyObject(memDetails) || memDetails == undefined || memDetails[currentServer].PHYSICALMEMORY == undefined || memDetails[currentServer].RSS == undefined || memDetails[currentServer].TIMESTAMP == undefined)
                return;

            if(localStorage.memoryDetailsMin != undefined){
                memoryDetailsArrMin = getFormattedDataFromLocalStorage(JSON.parse(localStorage.memoryDetailsMin))
            } else {
                memoryDetailsArrMin = JSON.stringify(convertDataFormat(dataMemMin, 'timestamp', 'physicalMemory'))
                memoryDetailsArrMin = JSON.parse(memoryDetailsArrMin)
            }


            if(localStorage.memoryDetails != undefined){
                memoryDetailsArr = getFormattedDataFromLocalStorage(JSON.parse(localStorage.memoryDetails))
            } else {
                memoryDetailsArr = JSON.stringify(convertDataFormat(dataMem, 'timestamp', 'physicalMemory'))
                memoryDetailsArr = JSON.parse(memoryDetailsArr)
            }

            if(localStorage.memoryDetailsDay != undefined){
                memoryDetailsArrDay = getFormattedDataFromLocalStorage(JSON.parse(localStorage.memoryDetailsDay))
            } else {
                memoryDetailsArrDay = JSON.stringify(convertDataFormat(dataMemDay, 'timestamp', 'physicalMemory'))
                memoryDetailsArrDay = JSON.parse(memoryDetailsArrDay)
            }

            if(monitor.memFirstData){
                if(memoryDetailsArr.length > 0 && !(currentTime.getTime() - (new Date(memoryDetailsArr[memoryDetailsArr.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.secGraph)){
                    dataMem = []
                    for(var i = 0; i< memoryDetailsArr.length; i++){
                        dataMem = sliceFirstData(dataMem, dataView.Seconds);
                        dataMem.push({"x": new Date(memoryDetailsArr[i].timestamp),
                            "y": memoryDetailsArr[i].physicalMemory
                        })
                    }
                }
                if(memoryDetailsArrMin.length > 0 && !(currentTime.getTime() - (new Date(memoryDetailsArrMin[memoryDetailsArrMin.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.minGraph)){
                    dataMemMin = []
                    for(var j = 0; j< memoryDetailsArrMin.length; j++){
                        dataMemMin = sliceFirstData(dataMemMin, dataView.Minutes);
                        dataMemMin.push({"x": new Date(memoryDetailsArrMin[j].timestamp),
                            "y": memoryDetailsArrMin[j].physicalMemory
                        })
                    }
                }

                if(memoryDetailsArrDay.length > 0 && !(currentTime.getTime() - (new Date(memoryDetailsArrDay[memoryDetailsArrDay.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.dayGraph)){
                    dataMemDay = []
                    for(var k = 0; k< memoryDetailsArrDay.length; k++){
                        dataMemDay = sliceFirstData(dataMemDay, dataView.Days);
                        dataMemDay.push({"x": new Date(memoryDetailsArrDay[k].timestamp),
                            "y": memoryDetailsArrDay[k].physicalMemory
                        })
                    }
                }
            }

            var memTimeStamp = new Date(memDetails[currentServer].TIMESTAMP);

            if (memTimeStamp >= monitor.memMaxTimeStamp) {
                var memRss = parseFloat(memDetails[currentServer].RSS * 1.0 / 1048576.0).toFixed(3) * 1;

                if (memDetails[currentServer].PHYSICALMEMORY != -1 && physicalMemory != memDetails[currentServer].PHYSICALMEMORY) {
                    physicalMemory = parseFloat(memDetails[currentServer].PHYSICALMEMORY * 1.0 / 1048576.0).toFixed(3) * 1;

                    ChartRam.yAxis.scale().domain([0, physicalMemory]);
                    ChartRam.lines.forceY([0, physicalMemory]);
                }

                if (memRss < 0)
                    memRss = 0;
                else if (physicalMemory != -1 && memRss > physicalMemory)
                    memRss = physicalMemory;

                if (memSecCount >= 6 || monitor.memFirstData) {
                    dataMemMin = sliceFirstData(dataMemMin, dataView.Minutes);
                    if (memTimeStamp == monitor.memMaxTimeStamp) {
                        dataMemMin.push({ "x": new Date(memTimeStamp), "y": dataMemMin[dataMemMin.length - 1].y });
                        memoryDetailsArrMin = saveLocalStorageInterval(memoryDetailsArrMin, {"timestamp": new Date(memTimeStamp), "physicalMemory": dataMemMin[dataMemMin.length - 1].y })
                    } else {
                        dataMemMin.push({ 'x': new Date(memTimeStamp), 'y': memRss });
                        memoryDetailsArrMin = saveLocalStorageInterval(memoryDetailsArrMin, {"timestamp": new Date(memTimeStamp), "physicalMemory": memRss })
                    }
                    Monitors.memDataMin = dataMemMin;
                    memSecCount = 0;
                }

                if (memMinCount >= 60 || monitor.memFirstData) {
                    dataMemDay = sliceFirstData(dataMemDay, dataView.Days);
                    if (memTimeStamp == monitor.memMaxTimeStamp) {
                        dataMemDay.push({ "x": new Date(memTimeStamp), "y": dataMemDay[dataMemDay.length - 1].y });
                        memoryDetailsArrDay = saveLocalStorageInterval(memoryDetailsArrDay, {"timestamp": new Date(memTimeStamp), "physicalMemory": dataMemDay[dataMemDay.length - 1].y})
                    } else {
                        dataMemDay.push({ 'x': new Date(memTimeStamp), 'y': memRss });
                        memoryDetailsArrDay = saveLocalStorageInterval(memoryDetailsArrDay, {"timestamp": new Date(memTimeStamp), "physicalMemory": memRss})
                    }
                    Monitors.memDataDay = dataMemDay;
                    memMinCount = 0;
                }

                dataMem = sliceFirstData(dataMem, dataView.Seconds);
                if (memTimeStamp == monitor.memMaxTimeStamp) {
                    dataMem.push({ "x": new Date(memTimeStamp), "y": dataMem[dataMem.length - 1].y });
                    memoryDetailsArr = saveLocalStorageInterval(memoryDetailsArr, {"timestamp": new Date(memTimeStamp), "physicalMemory": dataMem[dataMem.length - 1].y})
                } else {
                    dataMem.push({ 'x': new Date(memTimeStamp), 'y': memRss });
                    memoryDetailsArr = saveLocalStorageInterval(memoryDetailsArr, {"timestamp": new Date(memTimeStamp), "physicalMemory": memRss})
                }
                Monitors.memData = dataMem;


                localStorage.memoryDetails = JSON.stringify(memoryDetailsArr)
                localStorage.memoryDetailsMin = JSON.stringify(memoryDetailsArrMin)
                localStorage.memoryDetailsDay = JSON.stringify(memoryDetailsArrDay)

                if (graphView == 'Minutes')
                    dataRam[0]["values"] = dataMemMin;
                else if (graphView == 'Days')
                    dataRam[0]["values"] = dataMemDay;
                else
                    dataRam[0]["values"] = dataMem;

                if (currentTab == NavigationTabs.DBMonitor && currentView == graphView && ramChart.is(":visible")) {
                    d3.select('#visualisationRam')
                        .datum(dataRam)
                        .transition().duration(500)
                        .call(ChartRam);
                }
                monitor.memFirstData = false;
            }
            if (memTimeStamp > monitor.memMaxTimeStamp)
                monitor.memMaxTimeStamp = memTimeStamp;
            memSecCount++;
            memMinCount++;
        };

        this.RefreshTransaction = function (transactionDetails, graphView, currentTab) {
            var monitor = Monitors;
            var datatrans = monitor.tpsData;
            var datatransMin = monitor.tpsDataMin;
            var datatransDay = monitor.tpsDataDay;
            var transacDetail = transactionDetails;
            var transDetailsArr = [];
            var transDetailsArrMin = [];
            var transDetailsArrDay = [];

            if ($.isEmptyObject(transacDetail) || transacDetail == undefined || transacDetail["CurrentTimedTransactionCount"] == undefined || transacDetail["TimeStamp"] == undefined || transacDetail["currentTimerTick"] == undefined)
                return;

            if(localStorage.transDetailsMin != undefined){
                transDetailsArrMin = getFormattedDataFromLocalStorage(JSON.parse(localStorage.transDetailsMin))
            } else {
                transDetailsArrMin = JSON.stringify(convertDataFormat(datatransMin, 'timestamp', 'transaction'))
                transDetailsArrMin = JSON.parse(transDetailsArrMin)
            }

            if(localStorage.transDetails != undefined){
                transDetailsArr = getFormattedDataFromLocalStorage(JSON.parse(localStorage.transDetails))
            } else {
                transDetailsArr = JSON.stringify(convertDataFormat(datatrans, 'timestamp', 'transaction'))
                transDetailsArr = JSON.parse(transDetailsArr)
            }

            if(localStorage.transDetailsDay != undefined){
                transDetailsArrDay = getFormattedDataFromLocalStorage(JSON.parse(localStorage.transDetailsDay))
            } else {
                transDetailsArrDay = JSON.stringify(convertDataFormat(datatransDay, 'timestamp', 'transaction'))
                transDetailsArrDay = JSON.parse(transDetailsArrDay)
            }

            if(monitor.tpsFirstData){
                if(transDetailsArr.length > 0 && !(currentTime.getTime() - (new Date(transDetailsArr[transDetailsArr.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.secGraph)){
                    datatrans = []
                    for(var i = 0; i< transDetailsArr.length; i++){
                        datatrans = sliceFirstData(datatrans, dataView.Seconds);
                        datatrans.push({"x": new Date(transDetailsArr[i].timestamp),
                            "y": transDetailsArr[i].transaction
                        })
                    }
                }

                if(transDetailsArrMin.length > 0 && !(currentTime.getTime() - (new Date(transDetailsArrMin[transDetailsArrMin.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.minGraph)){
                    datatransMin = []
                    for(var j = 0; j< transDetailsArrMin.length; j++){
                        datatransMin = sliceFirstData(datatransMin, dataView.Minutes);
                        datatransMin.push({"x": new Date(transDetailsArrMin[j].timestamp),
                            "y": transDetailsArrMin[j].transaction
                        })
                    }
                }

                if(transDetailsArrDay.length > 0 && !(currentTime.getTime() - (new Date(transDetailsArrDay[transDetailsArrDay.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.dayGraph)){
                    datatransDay = []
                    for(var k = 0; k< transDetailsArrDay.length; k++){
                        datatransDay = sliceFirstData(datatransDay, dataView.Day);
                        datatransDay.push({"x": new Date(transDetailsArrDay[k].timestamp),
                            "y": transDetailsArrDay[k].transaction
                        })
                    }
                }
            }

            var currentTimedTransactionCount = transacDetail["CurrentTimedTransactionCount"];
            var currentTimerTick = transacDetail["currentTimerTick"];

            if (monitor.lastTimedTransactionCount > 0 && monitor.lastTimerTick > 0 && monitor.lastTimerTick != currentTimerTick) {
                var delta = currentTimedTransactionCount - monitor.lastTimedTransactionCount;
                var calculatedValue = parseFloat(delta * 1000.0 / (currentTimerTick - monitor.lastTimerTick)).toFixed(1) * 1;
                if (calculatedValue < 0 || isNaN(calculatedValue) || (currentTimerTick - monitor.lastTimerTick == 0))
                    calculatedValue = 0;

                if (tpsSecCount >= 6 || monitor.tpsFirstData) {
                    datatransMin = sliceFirstData(datatransMin, dataView.Minutes);
                    if (monitor.tpsFirstData || delta != 0 || (currentTimedTransactionCount == 0 && monitor.lastTimedTransactionCount == 0) || calculatedValue == 0) {
                        datatransMin.push({ "x": new Date(transacDetail["TimeStamp"]), "y": calculatedValue });
                        transDetailsArrMin = saveLocalStorageInterval(transDetailsArrMin, {"timestamp": new Date(transacDetail["TimeStamp"]), "transaction": calculatedValue })
                    } else {
                        datatransMin.push({ "x": new Date(transacDetail["TimeStamp"]), "y": datatransMin[datatransMin.length - 1].y });
                        transDetailsArrMin = saveLocalStorageInterval(transDetailsArrMin, {"timestamp": new Date(transacDetail["TimeStamp"]), "transaction": datatransMin[datatransMin.length - 1].y })
                    }
                    Monitors.tpsDataMin = datatransMin;
                    tpsSecCount = 0;
                }
                if (tpsMinCount >= 60 || monitor.tpsFirstData) {
                    datatransDay = sliceFirstData(datatransDay, dataView.Days);
                    if (monitor.tpsFirstData || delta != 0 || (currentTimedTransactionCount == 0 && monitor.lastTimedTransactionCount == 0)|| calculatedValue == 0) {
                        datatransDay.push({ "x": new Date(transacDetail["TimeStamp"]), "y": calculatedValue });
                        transDetailsArrDay = saveLocalStorageInterval(transDetailsArrDay, {"timestamp": new Date(transacDetail["TimeStamp"]), "transaction": calculatedValue })
                    } else {
                        datatransDay.push({ "x": new Date(transacDetail["TimeStamp"]), "y": datatransDay[datatransDay.length - 1].y });
                        transDetailsArrDay = saveLocalStorageInterval(transDetailsArrDay, {"timestamp": new Date(transacDetail["TimeStamp"]), "transaction": datatransDay[datatransDay.length - 1].y })
                    }
                    Monitors.tpsDataDay = datatransDay;
                    tpsMinCount = 0;
                }
                datatrans = sliceFirstData(datatrans, dataView.Seconds);
                if (monitor.tpsFirstData || delta != 0 || (currentTimedTransactionCount == 0 && monitor.lastTimedTransactionCount == 0)|| calculatedValue == 0) {
                    datatrans.push({ "x": new Date(transacDetail["TimeStamp"]), "y": calculatedValue });
                    transDetailsArr = saveLocalStorageInterval(transDetailsArr, {"timestamp": new Date(transacDetail["TimeStamp"]), "transaction": calculatedValue })
                } else {
                    datatrans.push({ "x": new Date(transacDetail["TimeStamp"]), "y": datatrans[datatrans.length - 1].y });
                    transDetailsArr = saveLocalStorageInterval(transDetailsArr, {"timestamp": new Date(transacDetail["TimeStamp"]), "transaction": datatrans[datatrans.length - 1].y })
                }
                Monitors.tpsData = datatrans;
                monitor.tpsFirstData = false;
            }
            else{
                var delta = currentTimedTransactionCount - monitor.lastTimedTransactionCount;

                if (tpsSecCount >= 6 || monitor.tpsFirstData) {
                    datatransMin = sliceFirstData(datatransMin, dataView.Minutes);
                    if (monitor.tpsFirstData || delta != 0 || (currentTimedTransactionCount == 0 && monitor.lastTimedTransactionCount == 0)) {
                        transDetailsArrMin = saveLocalStorageInterval(transDetailsArrMin, {"timestamp": new Date(transacDetail["TimeStamp"]), "transaction": 0 })
                        datatransMin.push({ "x": new Date(transacDetail["TimeStamp"]), "y": 0 });
                    }
                    Monitors.tpsDataMin = datatransMin;
                    tpsSecCount = 0;
                }

                if (tpsMinCount >= 60 || monitor.tpsFirstData) {
                    datatransDay = sliceFirstData(datatransDay, dataView.Days);
                    if (monitor.tpsFirstData || delta != 0 || (currentTimedTransactionCount == 0 && monitor.lastTimedTransactionCount == 0)) {
                        transDetailsArrDay = saveLocalStorageInterval(transDetailsArrDay, {"timestamp": new Date(transacDetail["TimeStamp"]), "transaction": 0 })
                        datatransDay.push({ "x": new Date(transacDetail["TimeStamp"]), "y": 0 });
                    }
                    Monitors.tpsDataDay = datatransDay;
                    tpsMinCount = 0;
                }

                if (monitor.tpsFirstData){
                    if(localStorage.transDetails == undefined){
                        datatrans.push({ "x": new Date(transacDetail["TimeStamp"]), "y": null });
                        Monitors.tpsData = datatrans;
                    }
                    else{
                        if (delta != 0 || (currentTimedTransactionCount == 0 && monitor.lastTimedTransactionCount == 0)) {
                            datatrans.push({ "x": new Date(transacDetail["TimeStamp"]), "y": datatrans[datatrans.length - 1].y });
                            transDetailsArr = saveLocalStorageInterval(transDetailsArr, {"timestamp": new Date(transacDetail["TimeStamp"]), "transaction": datatrans[datatrans.length - 1].y })
                            Monitors.tpsData = datatrans;
                        }
                    }
                }
                else{
                    if(localStorage.transDetails == undefined){
                        datatrans.push({ "x": new Date(transacDetail["TimeStamp"]), "y": 0 });
                        Monitors.tpsData = datatrans;
                    } else {
                        var calculatedValue = parseFloat(delta * 1000.0 / (currentTimerTick - monitor.lastTimerTick)).toFixed(1) * 1;
                        if (delta != 0 || (currentTimedTransactionCount == 0 && monitor.lastTimedTransactionCount == 0)) {
                            datatrans.push({ "x": new Date(transacDetail["TimeStamp"]), "y": calculatedValue });
                            transDetailsArr = saveLocalStorageInterval(transDetailsArr, {"timestamp": new Date(transacDetail["TimeStamp"]), "transaction": calculatedValue })
                            Monitors.tpsData = datatrans;
                        }
                    }
                }
                monitor.tpsFirstData = false;
            }

            localStorage.transDetails = JSON.stringify(transDetailsArr)
            localStorage.transDetailsMin = JSON.stringify(transDetailsArrMin)
            localStorage.transDetailsDay = JSON.stringify(transDetailsArrDay)

            if (graphView == 'Minutes')
                dataTransactions[0]["values"] = datatransMin;
            else if (graphView == 'Days')
                dataTransactions[0]["values"] = datatransDay;
            else
                dataTransactions[0]["values"] = datatrans;

            monitor.lastTimedTransactionCount = currentTimedTransactionCount;
            monitor.lastTimerTick = currentTimerTick;

            if (currentTab == NavigationTabs.DBMonitor && currentView == graphView && transactionChart.is(":visible")) {
                d3.select('#visualisationTransaction')
                    .datum(dataTransactions)
                    .transition().duration(500)
                    .call(ChartTransactions);
            }

            tpsSecCount++;
            tpsMinCount++;
        };

        this.timeUnit = {
            sec: 5,
            min: 30,
            day: 300
        }

        this.RefreshCpu = function (cpuDetails, currentServer, graphView, currentTab) {
            var monitor = Monitors;
            var cpuDetailsArr = []
            var cpuDetailsArrMin = []
            var cpuDetailsArrDay = []

            var cpuData = monitor.cpuData;
            var cpuDataMin = monitor.cpuDataMin;
            var cpuDataDay = monitor.cpuDataHrs;
            var cpuDetail = cpuDetails;

            if ($.isEmptyObject(cpuDetail) || cpuDetail == undefined || !cpuDetail.hasOwnProperty(currentServer) || cpuDetail[currentServer].PERCENT_USED == undefined || cpuDetail[currentServer].TIMESTAMP == undefined)
                return;

            if(localStorage.cpuDetailsMin != undefined)
                cpuDetailsArrMin = getFormattedDataFromLocalStorage(JSON.parse(localStorage.cpuDetailsMin))
            else {
                cpuDetailsArrMin = JSON.stringify(convertDataFormat(cpuDataMin, 'timestamp', 'percentUsed'))
                cpuDetailsArrMin = JSON.parse(cpuDetailsArrMin)
            }

            if(localStorage.cpuDetailsDay != undefined)
                cpuDetailsArrDay = getFormattedDataFromLocalStorage(JSON.parse(localStorage.cpuDetailsDay))
            else {
                cpuDetailsArrDay = JSON.stringify(convertDataFormat(cpuDataDay, 'timestamp', 'percentUsed'))
                cpuDetailsArrDay = JSON.parse(cpuDetailsArrDay)
            }

            if(localStorage.cpuDetails != undefined){
                cpuDetailsArr = getFormattedDataFromLocalStorage(JSON.parse(localStorage.cpuDetails))
            } else {
                cpuDetailsArr =  JSON.stringify(convertDataFormat(cpuData, 'timestamp', 'percentUsed'))
                cpuDetailsArr =  JSON.parse(cpuDetailsArr)
            }

            if(monitor.cpuFirstData){
                if(cpuDetailsArr.length > 0 && !(currentTime.getTime() - (new Date(cpuDetailsArr[cpuDetailsArr.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.secGraph)){
                    cpuData = []
                    for(var i = 0; i< cpuDetailsArr.length; i++){
                        cpuData = sliceFirstData(cpuData, dataView.Seconds);
                        cpuData.push({"x": new Date(cpuDetailsArr[i].timestamp),
                            "y": cpuDetailsArr[i].percentUsed
                        })
                    }
                }

                if(cpuDetailsArrMin.length > 0 && !(currentTime.getTime() - (new Date(cpuDetailsArrMin[cpuDetailsArrMin.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.minGraph)){
                    cpuDataMin = []
                    for(var j = 0; j< cpuDetailsArrMin.length; j++){
                        cpuDataMin = sliceFirstData(cpuDataMin, dataView.Minutes);
                        cpuDataMin.push({"x": new Date(cpuDetailsArrMin[j].timestamp),
                            "y": cpuDetailsArrMin[j].percentUsed
                        })
                    }
                }

                if(cpuDetailsArrDay.length > 0 && !(currentTime.getTime() - (new Date(cpuDetailsArrDay[cpuDetailsArrDay.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.dayGraph)){
                    cpuDataDay = []
                    for(var k = 0; k< cpuDetailsArrDay.length; k++){
                        cpuDataDay = sliceFirstData(cpuDataDay, dataView.Days );
                        cpuDataDay.push({"x": new Date(cpuDetailsArrDay[k].timestamp),
                            "y": cpuDetailsArrDay[k].percentUsed
                        })
                    }
                }
            }

            var percentageUsage = parseFloat(cpuDetail[currentServer].PERCENT_USED).toFixed(1) * 1;
            var timeStamp = cpuDetail[currentServer].TIMESTAMP;


            if (timeStamp >= monitor.cpuMaxTimeStamp) {
                if (percentageUsage < 0)
                    percentageUsage = 0;
                else if (percentageUsage > 100)
                    percentageUsage = 100;

                if (cpuSecCount >= 6 || monitor.cpuFirstData) {
                    cpuDataMin = sliceFirstData(cpuDataMin, dataView.Minutes);
                    if (timeStamp == monitor.cpuMaxTimeStamp) {
                        cpuDataMin.push({ "x": new Date(timeStamp), "y": cpuDataMin[cpuDataMin.length - 1].y });
                        cpuDetailsArrMin = saveLocalStorageInterval(cpuDetailsArrMin, {"timestamp": new Date(timeStamp), "percentUsed": cpuDataMin[cpuDataMin.length - 1].y}, MonitorGraphUI.timeUnit.min  )
                    } else {
                        cpuDataMin.push({ "x": new Date(timeStamp), "y": percentageUsage });
                        cpuDetailsArrMin = saveLocalStorageInterval(cpuDetailsArrMin, {"timestamp": new Date(timeStamp), "percentUsed": percentageUsage}, MonitorGraphUI.timeUnit.min  )
                    }
                    Monitors.cpuDataMin = cpuDataMin;
                    cpuSecCount = 0;
                }
                if (cpuMinCount >= 60 || monitor.cpuFirstData) {
                    cpuDataDay = sliceFirstData(cpuDataDay, dataView.Days);
                    if (timeStamp == monitor.cpuMaxTimeStamp) {
                        cpuDataDay.push({ "x": new Date(timeStamp), "y": cpuDataDay[cpuDataDay.length - 1].y });
                        cpuDetailsArrDay = saveLocalStorageInterval(cpuDetailsArrDay, {"timestamp": new Date(timeStamp), "percentUsed": cpuDataDay[cpuDataDay.length - 1].y}, MonitorGraphUI.timeUnit.day  )
                    } else {
                        cpuDataDay.push({ "x": new Date(timeStamp), "y": percentageUsage });
                        cpuDetailsArrDay = saveLocalStorageInterval(cpuDetailsArrDay, {"timestamp": new Date(timeStamp), "percentUsed": percentageUsage}, MonitorGraphUI.timeUnit.day )
                    }
                    Monitors.cpuDataHrs = cpuDataDay;
                    cpuMinCount = 0;
                }
                cpuData = sliceFirstData(cpuData, dataView.Seconds);
                if (timeStamp == monitor.cpuMaxTimeStamp) {
                    cpuData.push({ "x": new Date(timeStamp), "y": cpuData[cpuData.length - 1].y });
                    cpuDetailsArr = saveLocalStorageInterval(cpuDetailsArr, {"timestamp": new Date(timeStamp), "percentUsed": cpuData[cpuData.length - 1].y}, MonitorGraphUI.timeUnit.sec  )
                } else {
                    cpuData.push({ "x": new Date(timeStamp), "y": percentageUsage });
                    cpuDetailsArr = saveLocalStorageInterval(cpuDetailsArr, {"timestamp": new Date(timeStamp), "percentUsed": percentageUsage}, MonitorGraphUI.timeUnit.sec  )
                }
                try{
                    $(".errorMsgLocalStorageFull").hide();
                    localStorage.cpuDetails = JSON.stringify(cpuDetailsArr)
                    localStorage.cpuDetailsMin = JSON.stringify(cpuDetailsArrMin)
                    localStorage.cpuDetailsDay = JSON.stringify(cpuDetailsArrDay)
                } catch(e) {
                    $(".errorMsgLocalStorageFull").show();
                }
                Monitors.cpuData = cpuData;
                monitor.cpuFirstData = false;

                if (graphView == 'Minutes')
                    dataCpu[0]["values"] = cpuDataMin;
                else if (graphView == 'Days')
                    dataCpu[0]["values"] = cpuDataDay;
                else {
                    dataCpu[0]["values"] = cpuData;

                }

                if (currentTab == NavigationTabs.DBMonitor && currentView == graphView && cpuChart.is(":visible")) {
                    d3.select('#visualisationCpu')
                        .datum(dataCpu)
                        .transition().duration(500)
                        .call(ChartCpu);
                }
            }
            if (timeStamp > monitor.cpuMaxTimeStamp)
                monitor.cpuMaxTimeStamp = timeStamp;
            cpuSecCount++;
            cpuMinCount++;
        };

        var saveLocalStorageInterval = function(rawDataArr, newItem){
            var interval_end = new Date()
            var interval_start = new Date()
            interval_end.setMinutes(interval_end.getMinutes() - RETAINED_TIME_INTERVAL);
            var dataArr = [];
            for(var i = 0; i < rawDataArr.length; i++){
                var timeStamp =  new Date(rawDataArr[i].timestamp);
                if(timeStamp.getTime() >= interval_end.getTime() && timeStamp.getTime() <= interval_start.getTime()){
                    dataArr.push(rawDataArr[i])
                }
            }
            dataArr.push(newItem)
            return dataArr;
        }

        var getFormattedDataFromLocalStorage = function(rawDataArr){
            var interval_end = new Date()
            var interval_start = new Date()
            interval_end.setMinutes(interval_end.getMinutes() - RETAINED_TIME_INTERVAL);
            var dataArr = [];
            for(var i = 0; i < rawDataArr.length; i++){
                var timeStamp =  new Date(rawDataArr[i].timestamp);
                if(timeStamp.getTime() >= interval_end.getTime() && timeStamp.getTime() <= interval_start.getTime()){
                    dataArr.push(rawDataArr[i])
                }
            }
            return dataArr;
        }

        var getFormattedPartitionDataFromLocalStorage = function(rawDataArr){
            var interval_end = new Date()
            var interval_start = new Date()
            interval_end.setMinutes(interval_end.getMinutes() - RETAINED_TIME_INTERVAL);
            var partitionData = []
            for(var i = 0; i< rawDataArr.length; i++){
                var keyIndex =  i;
                partitionData[keyIndex] = {}
                partitionData[keyIndex]["values"] = []
                partitionData[keyIndex]["key"] = rawDataArr[keyIndex]["key"]
                partitionData[keyIndex]["color"] = rawDataArr[keyIndex]["color"]
                for(var b = 0; b < rawDataArr[i]["values"].length; b++){
                    var timeStamp =  new Date(rawDataArr[i]["values"][b].x);
                    if(timeStamp.getTime() >= interval_end.getTime() && timeStamp.getTime() <= interval_start.getTime()){
                        partitionData[keyIndex]["values"].push(rawDataArr[i]["values"][b])
                    }
                }
            }
            return partitionData;
        }

        var savePartitionDataToLocalStorage = function(data, newItem, keyIndex){
            var interval_end = new Date()
            var interval_start = new Date()
            interval_end.setMinutes(interval_end.getMinutes() - RETAINED_TIME_INTERVAL);
            var values = data[keyIndex].values
            var dataArr = [];
            for(var i = 0; i < values.length; i++){
                var timeStamp =  new Date(values[i].x);
                if(timeStamp.getTime() >= interval_end.getTime() && timeStamp.getTime() <= interval_start.getTime()){
                    dataArr.push(values[i])
                }
            }
            dataArr.push(newItem)
            data[keyIndex].values = dataArr
            return data;
        }

        function getPartitionData() {
            var monitor = Monitors;
            monitor.partitionData = getEmptyDataForPartition();
            monitor.partitionDataMin = getEmptyDataForPartitionForMinutes();
            monitor.partitionDataDay = getEmptyDataForPartitionForDay();
        }

        this.RefreshPartitionIdleTime = function (partitionDetails, currentServer, graphView, currentTab) {
            var monitor = Monitors;

            if (monitor.partitionData.length < 1 || monitor.partitionDataMin.length < 1 || monitor.partitionDataDay.length < 1) {
                getPartitionData();
            }

            if (dataMapperSec == undefined || $.isEmptyObject(dataMapperSec))
                return

            if (dataMapperDay == undefined || $.isEmptyObject(dataMapperDay))
                return

            if (dataMapperMin == undefined || $.isEmptyObject(dataMapperMin))
                return

            var partitionData = monitor.partitionData;
            var partitionDataMin = monitor.partitionDataMin;
            var partitionDataDay = monitor.partitionDataDay;
            var partitionDetail = partitionDetails;
            var partitionDetailsArr = [];
            var partitionDetailsArrMin = [];
            var partitionDetailsArrDay = [];

            if(localStorage.partitionDetailsMin != undefined){
                partitionDetailsArrMin = getFormattedPartitionDataFromLocalStorage(JSON.parse(localStorage.partitionDetailsMin))
            } else {
                partitionDetailsArrMin = JSON.stringify(convertDataFormatForPartition(partitionDataMin))
                partitionDetailsArrMin = JSON.parse(partitionDetailsArrMin)
            }

            if(localStorage.partitionDetailsDay != undefined){
                partitionDetailsArrDay = getFormattedPartitionDataFromLocalStorage(JSON.parse(localStorage.partitionDetailsDay))
            } else {
                partitionDetailsArrDay = JSON.stringify(convertDataFormatForPartition(partitionDataDay))
                partitionDetailsArrDay = JSON.parse(partitionDetailsArrDay)
            }
            if(localStorage.partitionDetails != undefined){
                partitionDetailsArr = getFormattedPartitionDataFromLocalStorage(JSON.parse(localStorage.partitionDetails))
            } else {
                partitionDetailsArr = JSON.stringify(convertDataFormatForPartition(partitionData))
                partitionDetailsArr = JSON.parse(partitionDetailsArr)
            }

            if(monitor.partitionFirstData){
                for(var i = 0; i< partitionDetailsArr.length; i++){
                    var keyIndexSec =  i;
                    if(partitionDetailsArr[i]["values"].length > 0 && !(currentTime.getTime() - (new Date(partitionDetailsArr[i]["values"][partitionDetailsArr[i]["values"].length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.secGraph)){
                        partitionData[keyIndexSec]["values"] = []
                        for(var b = 0; b < partitionDetailsArr[i]["values"].length; b++){
                            partitionData[keyIndexSec]["values"] = sliceFirstData(partitionData[keyIndexSec]["values"], dataView.Seconds);
                            partitionData[keyIndexSec]["values"].push({"x": new Date(partitionDetailsArr[i]["values"][b].x), "y": partitionDetailsArr[i]["values"][b].y})
                        }
                    }
                }

                for(var j = 0; j< partitionDetailsArrMin.length; j++){
                    var keyIndexMin =  j;
                    if(partitionDetailsArrMin[j]["values"].length > 0 && !(currentTime.getTime() - (new Date(partitionDetailsArrMin[j]["values"][partitionDetailsArrMin[j]["values"].length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.minGraph)){
                        partitionDataMin[keyIndexMin]["values"] = []
                        for(var a = 0; a < partitionDetailsArrMin[j]["values"].length; a++){
                            partitionDataMin[keyIndexMin]["values"] = sliceFirstData(partitionDataMin[keyIndexMin]["values"], dataView.Minutes)
                            partitionDataMin[keyIndexMin]["values"].push({"x": new Date(partitionDetailsArrMin[j]["values"][a].x), "y": partitionDetailsArrMin[j]["values"][a].y})
                        }
                    }
                }

                for(var k = 0; k< partitionDetailsArrDay.length; k++){
                    var keyIndexDay = k;
                    if(partitionDetailsArrDay[k]["values"].length > 0 && !(currentTime.getTime() - (new Date(partitionDetailsArrDay[k]["values"][partitionDetailsArrDay[k]["values"].length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.dayGraph)){
                        partitionDataDay[keyIndexMin]["values"] = []
                        for(var c = 0; c < partitionDetailsArrDay[k]["values"].length; c++){
                            partitionDataDay[keyIndexDay]["values"] = sliceFirstData(partitionDataDay[keyIndexDay]["values"], dataView.Days)
                            partitionDataDay[keyIndexDay]["values"].push({"x": new Date(partitionDetailsArrDay[k]["values"][c].x), "y": partitionDetailsArrDay[k]["values"][c].y})
                        }
                    }
                }
            }

            if ($.isEmptyObject(partitionDetail) || partitionDetail == undefined ||partitionDetail["partitionDetail"]["timeStamp"] == undefined)
                return;

            var timeStamp = partitionDetails["partitionDetail"]["timeStamp"];
            if (timeStamp >= monitor.partitionMaxTimeStamp) {
                $.each(partitionDetail["partitionDetail"], function(datatype, datavalue) {
                    $.each(datavalue, function(partitionKey, partitionValue) {
                        var keyValue = partitionKey;
                        var percentValue = partitionValue;

                        if (percentValue < 0)
                            percentValue = 0;
                        else if (percentValue > 100)
                            percentValue = 100;
                        if (partitionSecCount >= 6 || monitor.partitionFirstData) {
                            if (!partitionDataMin.hasOwnProperty(keyValue)) {
                                var keyIndex = dataMapperMin[keyValue];
                                partitionDataMin[keyIndex]["values"] = sliceFirstData(partitionDataMin[keyIndex]["values"], dataView.Minutes);
                                if (timeStamp == monitor.partitionMaxTimeStamp) {
                                    partitionDataMin[keyIndex]["values"].push({"x": new Date(timeStamp), "y": partitionDataMin[keyIndex]["values"][partitionDataMin[keyIndex]["values"].length - 1].y });
                                    partitionDetailsArrMin = savePartitionDataToLocalStorage(partitionDetailsArrMin, {"x": new Date(timeStamp), "y": partitionDataMin[keyIndex]["values"][partitionDataMin[keyIndex]["values"].length - 1].y }, keyIndex)
                                } else {
                                    partitionDataMin[keyIndex]["values"].push({ 'x': new Date(timeStamp), 'y': percentValue });
                                    partitionDetailsArrMin = savePartitionDataToLocalStorage(partitionDetailsArrMin, { 'x': new Date(timeStamp), 'y': percentValue }, keyIndex)
                                }
                                Monitors.partitionDataMin = partitionDataMin;
                            }
                        }

                        if (partitionMinCount >= 60 || monitor.partitionFirstData) {
                            var keyIndexDay = dataMapperDay[keyValue];
                            partitionDataDay[keyIndexDay]["values"] = sliceFirstData(partitionDataDay[keyIndexDay]["values"], dataView.Days);
                            if (timeStamp == monitor.partitionMaxTimeStamp) {
                                partitionDataDay[keyIndexDay]["values"].push({ "x": new Date(timeStamp), "y": partitionDataDay[keyIndexDay]["values"][partitionDataDay[keyIndexDay]["values"].length - 1].y });
                                partitionDetailsArrDay = savePartitionDataToLocalStorage(partitionDetailsArrDay, { "x": new Date(timeStamp), "y": partitionDataDay[keyIndexDay]["values"][partitionDataDay[keyIndexDay]["values"].length - 1].y }, keyIndexDay)
                            } else {
                                partitionDataDay[keyIndexDay]["values"].push({ 'x': new Date(timeStamp), 'y': percentValue });
                                partitionDetailsArrDay = savePartitionDataToLocalStorage(partitionDetailsArrDay, { 'x': new Date(timeStamp), 'y': percentValue }, keyIndexDay)
                            }
                            Monitors.partitionDataDay = partitionDataDay;
                        }

                        var keyIndexSec = dataMapperSec[keyValue];

                        partitionData[keyIndexSec]["values"] = sliceFirstData(partitionData[keyIndexSec]["values"], dataView.Seconds);
                        if (timeStamp == monitor.partitionMaxTimeStamp) {
                            partitionData[keyIndexSec]["values"].push({"x": new Date(timeStamp), "y": partitionData[keyIndexSec]["values"][partitionData[keyIndexSec]["values"].length - 1].y });
                            partitionDetailsArr = savePartitionDataToLocalStorage(partitionDetailsArr, {"x": new Date(timeStamp), "y": partitionData[keyIndexSec]["values"][partitionData[keyIndexSec]["values"].length - 1].y }, keyIndexSec)
                        } else {
                            partitionData[keyIndexSec].values.push({ 'x': new Date(timeStamp), 'y': percentValue });
                            partitionDetailsArr = savePartitionDataToLocalStorage(partitionDetailsArr, { 'x': new Date(timeStamp), 'y': percentValue }, keyIndexSec  )
                        }
                        Monitors.partitionData = partitionData;
                    });
                });

                localStorage.partitionDetails = JSON.stringify(partitionDetailsArr)
                localStorage.partitionDetailsMin = JSON.stringify(partitionDetailsArrMin)
                localStorage.partitionDetailsDay = JSON.stringify(partitionDetailsArrDay)
                if (monitor.partitionFirstData) {
                    $(".legend").css("display", "block");
                }
                monitor.partitionFirstData = false;
                if (partitionSecCount >= 6)
                    partitionSecCount = 0;
                if (partitionMinCount >= 60)
                    partitionMinCount = 0;

                if (graphView == 'Minutes')
                    dataPartitionIdleTime = partitionDataMin;
                else if (graphView == 'Days')
                    dataPartitionIdleTime = partitionDataDay;
                else {
                    dataPartitionIdleTime = partitionData;
                }

                if (currentTab == NavigationTabs.DBMonitor && currentView == graphView && partitionChart.is(":visible")) {
                    d3.select('#visualisationPartitionIdleTime')
                        .datum(dataPartitionIdleTime)
                        .transition().duration(500)
                        .call(ChartPartitionIdleTime);
                }
            }
            if (timeStamp > monitor.partitionMaxTimeStamp)
                monitor.partitionMaxTimeStamp = timeStamp;

            partitionSecCount++;
            partitionMinCount++;
        };

        this.RefreshDrReplicationGraph = function (drDetails, currentServer, graphView, currentTab) {
            var monitor = Monitors;
            var chartList = VoltDbUI.drChartList;
            if(chartList != undefined && chartList.length > 0){
                for(var i = 0; i < chartList.length; i++){
                    var drData = monitor['drReplicationData_' + chartList[i]];
                    var drDataMin = monitor['drReplicationDataMin_' + chartList[i]];
                    var drDataDay = monitor['drReplicationDataDay_' + chartList[i]];
                    var drDetail = drDetails;
                    var drDetailsArr = []
                    var drDetailsArrMin = []
                    var drDetailsArrDay = []

                    if ($.isEmptyObject(drDetail) || drDetail == undefined || drDetail["DR_GRAPH"][chartList[i]].REPLICATION_RATE_1M == undefined ||
                    drDetail["DR_GRAPH"][chartList[i]].TIMESTAMP == undefined)
                        return true;

                    if(localStorage["drDetailsMin_" + chartList[i]] != undefined){
                        drDetailsArrMin = getFormattedDataFromLocalStorage(JSON.parse(localStorage["drDetailsMin_" + chartList[i]]))
                    } else {
                        drDetailsArrMin =  JSON.stringify(convertDataFormat(drDataMin, 'timestamp', 'replicationRate'))
                        drDetailsArrMin = JSON.parse(drDetailsArrMin)
                    }

                    if(localStorage["drDetailsDay_" + chartList[i]] != undefined){
                        drDetailsArrDay = getFormattedDataFromLocalStorage(JSON.parse(localStorage["drDetailsDay_" + chartList[i]]))
                    } else {
                        drDetailsArrDay =  JSON.stringify(convertDataFormat(drDataDay, 'timestamp', 'replicationRate'))
                        drDetailsArrDay = JSON.parse(drDetailsArrDay)
                    }

                    if(localStorage["drDetails_" + chartList[i]] != undefined){
                        drDetailsArr = getFormattedDataFromLocalStorage(JSON.parse(localStorage["drDetails_" + chartList[i]]))
                    } else {
                        drDetailsArr =  JSON.stringify(convertDataFormat(drData, 'timestamp', 'replicationRate'))
                        drDetailsArr = JSON.parse(drDetailsArr)
                    }

                    if(monitor["drFirstData_" + chartList[i]]){
                        if(drDetailsArr.length > 0 && !(currentTime.getTime() - (new Date(drDetailsArr[drDetailsArr.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.secGraph)){
                            drData = []
                            for(var l = 0; l < drDetailsArr.length; l++){
                                drData = sliceFirstData(drData, dataView.Seconds);
                                drData.push({"x": new Date(drDetailsArr[l].timestamp),
                                    "y": drDetailsArr[l].replicationRate
                                })
                            }
                        }

                        if(drDetailsArrMin.length > 0 && !(currentTime.getTime() - (new Date(drDetailsArrMin[drDetailsArrMin.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.minGraph)){
                            drDataMin = []
                            for(var j = 0; j< drDetailsArrMin.length; j++){
                                drDataMin = sliceFirstData(drDataMin, dataView.Minutes);
                                drDataMin.push({"x": new Date(drDetailsArrMin[j].timestamp),
                                    "y": drDetailsArrMin[j].replicationRate
                                })
                            }
                        }

                        if(drDetailsArrDay.length > 0 && !(currentTime.getTime() - (new Date(drDetailsArrDay[drDetailsArrDay.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.dayGraph)){
                            drDataDay = []
                            for(var k = 0; k< drDetailsArrDay.length; k++){
                                drDataDay = sliceFirstData(drDataDay, dataView.Days );
                                drDataDay.push({"x": new Date(drDetailsArrDay[k].timestamp),
                                    "y": drDetailsArrDay[k].replicationRate
                                })
                            }
                        }
                    }

                    var timeStamp = drDetail["DR_GRAPH"][chartList[i]].TIMESTAMP;

                    if (timeStamp >= monitor["drMaxTimeStamp_" + chartList[i]]) {
                        var plottingPoint = parseFloat(drDetail["DR_GRAPH"][chartList[i]].REPLICATION_RATE_1M).toFixed(1) * 1;

                        if (monitor["drSecCount_" + chartList[i]] >= 6 || monitor["drFirstData_" + chartList[i]]) {
                            drDataMin = sliceFirstData(drDataMin, dataView.Minutes);
                            if (timeStamp == monitor["drMaxTimeStamp_" + chartList[i]]) {
                                drDataMin.push({ "x": new Date(timeStamp), "y": drDataMin[drDataMin.length - 1].y });
                                drDetailsArrMin = saveLocalStorageInterval(drDetailsArrMin, {"timestamp": new Date(timeStamp), "replicationRate": drDataMin[drDataMin.length - 1].y})
                            } else {
                                drDataMin.push({ "x": new Date(timeStamp), "y": plottingPoint });
                                drDetailsArrMin = saveLocalStorageInterval(drDetailsArrMin, {"timestamp": new Date(timeStamp), "replicationRate": plottingPoint})
                            }
                            monitor["drReplicationDataMin_" + chartList[i]] = drDataMin;
                            monitor["drSecCount_" + chartList[i]] = 0;
                        }
                        if (monitor["drMinCount_" + chartList[i]] >= 60 || monitor["drFirstData_" + chartList[i]]) {
                            drDataDay = sliceFirstData(drDataDay, dataView.Days);
                            if (timeStamp == monitor["drMaxTimeStamp_" + chartList[i]]) {
                                drDataDay.push({ "x": new Date(timeStamp), "y": drDataDay[drDataDay.length - 1].y });
                                drDetailsArrDay = saveLocalStorageInterval(drDetailsArrDay, {"timestamp": new Date(timeStamp), "replicationRate": drDataDay[drDataDay.length - 1].y})
                            } else {
                                drDataDay.push({ "x": new Date(timeStamp), "y": plottingPoint });
                                drDetailsArrDay = saveLocalStorageInterval(drDetailsArrDay, {"timestamp": new Date(timeStamp), "replicationRate": plottingPoint})
                            }
                            monitor["drReplicationDataDay_" + chartList[i]] = drDataDay;
                            monitor["drMinCount_" + chartList[i]] = 0;
                        }
                        drData = sliceFirstData(drData, dataView.Seconds);
                        if (timeStamp == monitor["drMaxTimeStamp_" + chartList[i]]) {
                            drData.push({ "x": new Date(timeStamp), "y": drData[drData.length - 1].y });
                            drDetailsArr = saveLocalStorageInterval(drDetailsArr, {"timestamp": new Date(timeStamp), "replicationRate": drData[drData.length - 1].y})
                        } else {
                            drData.push({ "x": new Date(timeStamp), "y": plottingPoint });
                            drDetailsArr = saveLocalStorageInterval(drDetailsArr, {"timestamp": new Date(timeStamp), "replicationRate": plottingPoint})
                        }

                        localStorage["drDetails_" + chartList[i]] = JSON.stringify(drDetailsArr)
                        localStorage["drDetailsMin_" + chartList[i]] = JSON.stringify(drDetailsArrMin)
                        localStorage["drDetailsDay_" + chartList[i]] = JSON.stringify(drDetailsArrDay)

                        monitor["drReplicationData_" + chartList[i]] = drData;
                        monitor["drFirstData_" + chartList[i]] = false;

                        if (graphView == 'Minutes')
                            dataDrReplication['dataDrReplication_' + chartList[i]][0]["values"]  = drDataMin;
                        else if (graphView == 'Days')
                            dataDrReplication['dataDrReplication_' + chartList[i]][0]["values"]  = drDataDay;
                        else {
                            dataDrReplication['dataDrReplication_' + chartList[i]][0]["values"]  = drData;
                        }
                        if (currentTab == NavigationTabs.DR && currentViewDr == graphView) {
                            d3.select("#visualizationDrReplicationRate_" + chartList[i])
                                .datum(dataDrReplication['dataDrReplication_' + chartList[i]])
                                .transition().duration(500)
                                .call(drChartList["ChartDrReplicationRate_" + chartList[i]]);
                        }
                    }

                    if (timeStamp > monitor["drMaxTimeStamp_" + chartList[i]])
                        monitor["drMaxTimeStamp_" + chartList[i]] = timeStamp;

                    monitor['drSecCount_' + chartList[i]]++;
                    monitor['drMinCount_' + chartList[i]]++;
                }
            }

        };

        this.RefreshCommandLog = function (cmdLogDetails, currentServer, graphView, currentTab) {
            var monitor = Monitors;
            var cmdLogData = monitor.cmdLogData;
            var cmdLogDataMin = monitor.cmdLogDataMin;
            var cmdLogDataDay = monitor.cmdLogDataDay;
            var cmdLogDetail = cmdLogDetails;
            var cmdLogArr = []
            var cmdLogArrMin = []
            var cmdLogArrDay = []
            var overlayDataArr = []
            var overlayDataArrMin = []
            var overlayDataArrDay = []

            if(localStorage.cmdLogMin != undefined)
                cmdLogArrMin = getFormattedDataFromLocalStorage(JSON.parse(localStorage.cmdLogMin))
            else{
                cmdLogArrMin =  JSON.stringify(convertDataFormat(cmdLogDataMin))
                cmdLogArrMin = JSON.parse(cmdLogArrMin)
            }

            if(localStorage.cmdLogDay != undefined)
                cmdLogArrDay = getFormattedDataFromLocalStorage(JSON.parse(localStorage.cmdLogDay))
            else {
                cmdLogArrDay = JSON.stringify(convertDataFormat(cmdLogDataDay))
                cmdLogArrDay = JSON.parse(cmdLogArrDay)
            }

            if(localStorage.cmdLog != undefined)
                cmdLogArr = getFormattedDataFromLocalStorage(JSON.parse(localStorage.cmdLog))
            else{
                cmdLogArr =  JSON.stringify(convertDataFormat(cmdLogData))
                cmdLogArr =  JSON.parse(cmdLogArr)
            }

            if(localStorage.SnapshotOverlayData != undefined)
                overlayDataArr =  JSON.parse(localStorage.SnapshotOverlayData)

            if(localStorage.SnapshotOverlayDataMin != undefined)
                overlayDataArrMin = JSON.parse(localStorage.SnapshotOverlayDataMin)

            if(localStorage.SnapshotOverlayDataDay != undefined)
                overlayDataArrDay = JSON.parse(localStorage.SnapshotOverlayDataDay)

            if(monitor.cmdLogFirstData){
                if(cmdLogArr.length > 0 && !(currentTime.getTime() - (new Date(cmdLogArr[cmdLogArr.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.secGraph)){
                    cmdLogData = []
                    for(var i = 0; i< cmdLogArr.length; i++){
                        cmdLogData = sliceFirstData(cmdLogData, dataView.Seconds);
                        cmdLogData.push({"x": new Date(cmdLogArr[i].timestamp),
                            "y": cmdLogArr[i].outstandingTxn
                        })
                    }
                }

                if(cmdLogArrMin.length > 0 && !(currentTime.getTime() - (new Date(cmdLogArrMin[cmdLogArrMin.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.minGraph)){
                    cmdLogDataMin = []
                    for(var j = 0; j< cmdLogArrMin.length; j++){
                        cmdLogDataMin = sliceFirstData(cmdLogDataMin, dataView.Minutes);
                        cmdLogDataMin.push({"x": new Date(cmdLogArrMin[j].timestamp),
                            "y": cmdLogArrMin[j].outstandingTxn
                        })
                    }
                }

                if(cmdLogArrDay.length > 0 && !(currentTime.getTime() - (new Date(cmdLogArrDay[cmdLogArrDay.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.dayGraph)){
                    cmdLogDataDay = []
                    for(var k = 0; k< cmdLogArrDay.length; k++){
                        cmdLogDataDay = sliceFirstData(cmdLogDataDay, dataView.Days);
                        cmdLogDataDay.push({"x": new Date(cmdLogArrDay[k].timestamp),
                            "y": cmdLogArrDay[k].outstandingTxn
                        })
                    }
                }
                var overlayData = GetSnapshotOverlay(overlayDataArr)
                if(overlayData.length != 0 && !(currentTime.getTime() - (new Date(overlayData[overlayData.length - 1].endTime)).getTime() > MonitorGraphUI.enumMaxTimeGap.secGraph)){
                    cmdLogOverlay = []
                    cmdLogOverlay = overlayData
                }

                var overlayDataMin = GetSnapshotOverlay(overlayDataArrMin)
                if(overlayDataMin.length != 0 && !(currentTime.getTime() - (new Date(overlayDataMin[overlayDataMin.length - 1].endTime)).getTime() > MonitorGraphUI.enumMaxTimeGap.minGraph)){
                    cmdLogOverlayMin = overlayDataMin
                    overlayDataMin = []
                }

                var overlayDataDay = GetSnapshotOverlay(overlayDataArrDay)
                if(overlayDataDay.length != 0 && !(currentTime.getTime() - (new Date(overlayDataDay[overlayDataDay.length - 1].endTime)).getTime() > MonitorGraphUI.enumMaxTimeGap.dayGraph)){
                    cmdLogOverlayDay = overlayDataDay
                    overlayDataDay = []
                }
            }

            if ($.isEmptyObject(cmdLogDetail) || cmdLogDetail == undefined || cmdLogDetail[currentServer].OUTSTANDING_TXNS == undefined || cmdLogDetail[currentServer].TIMESTAMP == undefined)
                return;

            var timeStamp = cmdLogDetail[currentServer].TIMESTAMP;
            if (timeStamp >= monitor.cmdLogMaxTimeStamp) {
                var outStandingTxn = parseFloat(cmdLogDetail[currentServer].OUTSTANDING_TXNS).toFixed(1) * 1;

                if (cmdLogSecCount >= 6 || monitor.cmdLogFirstData) {
                    cmdLogDataMin = sliceFirstData(cmdLogDataMin, dataView.Minutes);
                    if (timeStamp == monitor.cmdLogMaxTimeStamp) {
                        cmdLogDataMin.push({ "x": new Date(timeStamp), "y": cmdLogDataMin[cmdLogDataMin.length - 1].y });
                        cmdLogArrMin = saveLocalStorageInterval(cmdLogArrMin, {"timestamp": new Date(timeStamp), "outstandingTxn": cmdLogDataMin[cmdLogDataMin.length - 1].y})
                    } else {
                        cmdLogDataMin.push({ "x": new Date(timeStamp), "y": outStandingTxn });
                        cmdLogArrMin = saveLocalStorageInterval(cmdLogArrMin, {"timestamp": new Date(timeStamp), "outstandingTxn": outStandingTxn})
                    }
                    Monitors.cmdLogDataMin = cmdLogDataMin;

                    var isDuplicate = false;
                    if (!$.isEmptyObject(cmdLogDetail[currentServer].SNAPSHOTS)) {
                        for (var i = 0; i < cmdLogDetail[currentServer].SNAPSHOTS.length; i++) {
                            isDuplicate = false;
                            for(var j = 0;j < cmdLogOverlayMin.length;j++){
                                var x1 = cmdLogOverlayMin[j].startTime;
                                if (x1 == cmdLogDetail[currentServer].SNAPSHOTS[i].START_TIME){
                                    isDuplicate = true;
                                    break;
                                }
                            }
                            if (!isDuplicate){
                                cmdLogOverlayMin.push({ "startTime": cmdLogDetail[currentServer].SNAPSHOTS[i].START_TIME, "endTime": cmdLogDetail[currentServer].SNAPSHOTS[i].END_TIME });
                                overlayDataArrMin.push({ "startTime": cmdLogDetail[currentServer].SNAPSHOTS[i].START_TIME, "endTime": cmdLogDetail[currentServer].SNAPSHOTS[i].END_TIME })
                            }
                        }
                        cmdLogOverlayMin = GetSnapshotOverlay(cmdLogOverlayMin, 90)
                    }

                    localStorage.SnapshotOverlayDataMin = JSON.stringify(GetSnapshotOverlay(overlayDataArrMin))
                    overlayDataArrMin = []
                    cmdLogSecCount = 0;
                }

                if (cmdLogMinCount >= 60 || monitor.cmdLogFirstData) {
                    cmdLogDataDay = sliceFirstData(cmdLogDataDay, dataView.Days);
                    if (timeStamp == monitor.cmdLogMaxTimeStamp) {
                        cmdLogDataDay.push({ "x": new Date(timeStamp), "y": cmdLogDataDay[cmdLogDataDay.length - 1].y });
                        cmdLogArrDay = saveLocalStorageInterval(cmdLogArrDay, {"timestamp": new Date(timeStamp), "outstandingTxn": cmdLogDataDay[cmdLogDataDay.length - 1].y})
                    } else {
                        cmdLogDataDay.push({ "x": new Date(timeStamp), "y": outStandingTxn });
                        cmdLogArrDay = saveLocalStorageInterval(cmdLogArrDay, {"timestamp": new Date(timeStamp), "outstandingTxn": outStandingTxn})
                    }
                    Monitors.cmdLogDataDay = cmdLogDataDay;

                    var isDuplicate = false;
                    if (!$.isEmptyObject(cmdLogDetail[currentServer].SNAPSHOTS)) {
                        for (var i = 0; i < cmdLogDetail[currentServer].SNAPSHOTS.length; i++) {
                            isDuplicate = false
                            for(var j = 0;j < cmdLogOverlayDay.length;j++){
                                var x1 = cmdLogOverlayDay[j].startTime;
                                if (x1 == cmdLogDetail[currentServer].SNAPSHOTS[i].START_TIME){
                                    isDuplicate = true;
                                    break;
                                }
                            }
                            if (!isDuplicate){
                                cmdLogOverlayDay.push({ "startTime": cmdLogDetail[currentServer].SNAPSHOTS[i].START_TIME, "endTime": cmdLogDetail[currentServer].SNAPSHOTS[i].END_TIME });
                                overlayDataArrDay.push({ "startTime": cmdLogDetail[currentServer].SNAPSHOTS[i].START_TIME, "endTime": cmdLogDetail[currentServer].SNAPSHOTS[i].END_TIME })
                            }
                        }
                        cmdLogOverlayDay = GetSnapshotOverlay(cmdLogOverlayDay, 2400)
                    }
                    localStorage.SnapshotOverlayDataDay = JSON.stringify(GetSnapshotOverlay(overlayDataArrDay))
                    overlayDataArrDay = []
                    cmdLogMinCount = 0;
                }
                cmdLogData = sliceFirstData(cmdLogData, dataView.Seconds);
                if (timeStamp == monitor.cmdLogMaxTimeStamp) {
                    cmdLogData.push({ "x": new Date(timeStamp), "y": cmdLogData[cmdLogData.length - 1].y });
                    cmdLogArr = saveLocalStorageInterval(cmdLogArr, {"timestamp": new Date(timeStamp), "outstandingTxn": cmdLogData[cmdLogData.length - 1].y})

                } else {
                    cmdLogData.push({ "x": new Date(timeStamp), "y": outStandingTxn });
                    cmdLogArr = saveLocalStorageInterval(cmdLogArr, {"timestamp": new Date(timeStamp), "outstandingTxn": outStandingTxn})
                }
                Monitors.cmdLogData = cmdLogData;

                localStorage.cmdLog = JSON.stringify(cmdLogArr)
                localStorage.cmdLogMin = JSON.stringify(cmdLogArrMin)
                localStorage.cmdLogDay = JSON.stringify(cmdLogArrDay)

                var isDuplicate = false;
                if (!$.isEmptyObject(cmdLogDetail[currentServer].SNAPSHOTS)) {
                    for (var i = 0; i < cmdLogDetail[currentServer].SNAPSHOTS.length; i++) {
                        isDuplicate = false;
                        for(var j = 0;j < cmdLogOverlay.length;j++){
                            var x1 = cmdLogOverlay[j].startTime;
                            if (x1 == cmdLogDetail[currentServer].SNAPSHOTS[i].START_TIME){
                                isDuplicate = true;
                                break;
                            }
                        }
                        if (!isDuplicate){
                            cmdLogOverlay.push({ "startTime": cmdLogDetail[currentServer].SNAPSHOTS[i].START_TIME, "endTime": cmdLogDetail[currentServer].SNAPSHOTS[i].END_TIME });
                            overlayDataArr.push({ "startTime": cmdLogDetail[currentServer].SNAPSHOTS[i].START_TIME, "endTime": cmdLogDetail[currentServer].SNAPSHOTS[i].END_TIME });
                        }
                    }
                    cmdLogOverlay = GetSnapshotOverlay(cmdLogOverlay, 15)
                }
                localStorage.SnapshotOverlayData = JSON.stringify(GetSnapshotOverlay(overlayDataArr))

                if (monitor.cmdLogFirstData) {
                    $(".cmdLogLegend").css("display", "block");
                }
                monitor.cmdLogFirstData = false;

                dataOverlay = [];
                if (graphView == 'Minutes'){
                    dataCommandLog[0]["values"] = cmdLogDataMin;
                    dataOverlay = cmdLogOverlayMin;
                } else if (graphView == 'Days'){
                    dataCommandLog[0]["values"] = cmdLogDataDay;
                    dataOverlay = cmdLogOverlayDay;
                } else {
                    dataCommandLog[0]["values"] = cmdLogData;
                    dataOverlay = cmdLogOverlay;
                }

                if (currentTab == NavigationTabs.DBMonitor && currentView == graphView && cmdLogChart.is(":visible")) {
                    d3.select('#visualisationCommandLog')
                        .datum(dataCommandLog)
                        .transition().duration(500)
                        .call(ChartCommandlog);
                }

                $('.overlayGraph').detach()

                for(var i = 0; i < dataOverlay.length; i++){
                    var x1 = ChartCommandlog.xScale()(dataOverlay[i].startTime);
                    var x2 = ChartCommandlog.xScale()(dataOverlay[i].endTime);
                    var opacity = 1;
                    if (x1 > 3 && x1 < 560 && (x2 - x1 > 0)) {
                        opacity = ((x2 - x1) > 4) ? 0.2 : 1;
                        d3.select('#visualisationCommandLog .nv-y')
                            .append('rect')
                            .attr('x', x1)
                            .attr('width', (x2 - x1))
                            .style('fill', 'red')
                            .style('opacity', opacity)
                            .attr('y', 0)
                            .attr('class', 'overlayGraph')
                            .attr('height', ChartCommandlog.yAxis.range()[0]);
                    }
                }
            }
            if (timeStamp > monitor.cmdLogMaxTimeStamp) {
                monitor.cmdLogMaxTimeStamp = timeStamp;
            }
            cmdLogSecCount++;
            cmdLogMinCount++;
        };

        var convertDataFormat = function(rawData, key1, key2){
            var requiredFormat = []
            for(var i = 0; i < rawData.length; i++){
                var newObj = {};
                newObj[key1] = rawData[i].x;
                newObj[key2] = rawData[i].y;
                requiredFormat.push(newObj)
            }
            return requiredFormat;
        }

        var convertDataFormatForPartition = function(partitionData){
            var requiredFormat = []
            for(var i = 0; i < partitionData.length; i++){
                requiredFormat.push({"key": partitionData[i].key, "values": partitionData[i].values, "color": partitionData[i].color})
            }
            return requiredFormat;
        }

        var GetSnapshotOverlay = function(snapshotData, timeInterval){
            var interval_end = new Date()
            var interval_start = new Date()
            var interval = timeInterval == undefined ? RETAINED_TIME_INTERVAL : timeInterval;
            interval_end.setMinutes(interval_end.getMinutes() - interval);
            var snapshotDataArr = [];
            for(var i = 0; i < snapshotData.length; i++){
                var start_timeStamp =  snapshotData[i].startTime;
                var stop_timeStamp = snapshotData[i].endTime;
                if(start_timeStamp >= interval_end.getTime() && start_timeStamp <= interval_start.getTime()
                && start_timeStamp >= interval_end.getTime() && start_timeStamp <= interval_start.getTime()){
                    snapshotDataArr.push(snapshotData[i])
                }
            }
            return snapshotDataArr;
        }

        this.refreshGraphCmdLog = function () {
            if ($.isFunction(ChartCommandlog.update))
                ChartCommandlog.update();
        };

        this.refreshGraphDR = function () {
            var drChartIds = VoltDbUI.drChartList;
            if(drChartIds.length > 0 && !$.isEmptyObject(drChartList)) {
                for(var i = 0; i < drChartIds.length; i++){
                    if ($.isFunction(drChartList['ChartDrReplicationRate_' + drChartIds[i]].update))
                        drChartList['ChartDrReplicationRate_' + drChartIds[i]].update();
                }
            }
        };

        this.RefreshOutTransGraph = function (outTransDetails, graphView, currentTab) {
            debugger;
            var monitor = Monitors;
            var outTransDetailsArr = []
            var outTransDetailsArrMin = []
            var outTransDetailsArrDay = []

            var outTransData = monitor.outTransData;
            var outTransDataMin = monitor.outTransDataMin;
            var outTransDataDay = monitor.outTransDataDay;
            var outTransDetail = outTransDetails;

            if ($.isEmptyObject(outTransDetail) || outTransDetail == undefined || !outTransDetail.hasOwnProperty('DETAILS')
            || outTransDetail['DETAILS'].OUTSTANDING_REQUESTS == undefined || outTransDetail['DETAILS'].TIMESTAMP == undefined)
                return;

            if(localStorage.outTransDetailsMin != undefined)
                outTransDetailsArrMin = getFormattedDataFromLocalStorage(JSON.parse(localStorage.outTransDetailsMin))
            else {
                outTransDetailsArrMin = JSON.stringify(convertDataFormat(outTransDataMin, 'timestamp', 'outstandingRequest'))
                outTransDetailsArrMin = JSON.parse(outTransDetailsArrMin)
            }

            if(localStorage.outTransDetailsDay != undefined)
                outTransDetailsArrDay = getFormattedDataFromLocalStorage(JSON.parse(localStorage.outTransDetailsDay))
            else {
                outTransDetailsArrDay = JSON.stringify(convertDataFormat(outTransDataDay, 'timestamp', 'outstandingRequest'))
                outTransDetailsArrDay = JSON.parse(outTransDetailsArrDay)
            }

            if(localStorage.outTransDetails != undefined){
                outTransDetailsArr = getFormattedDataFromLocalStorage(JSON.parse(localStorage.outTransDetails))
            } else {
                outTransDetailsArr =  JSON.stringify(convertDataFormat(outTransData, 'timestamp', 'outstandingRequest'))
                outTransDetailsArr =  JSON.parse(outTransDetailsArr)
            }

            if(monitor.outTransFirstData){
                if(outTransDetailsArr.length > 0 && !(currentTime.getTime() - (new Date(outTransDetailsArr[outTransDetailsArr.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.secGraph)){
                    outTransData = []
                    for(var i = 0; i< outTransDetailsArr.length; i++){
                        outTransData = sliceFirstData(outTransData, dataView.Seconds);
                        outTransData.push({"x": new Date(outTransDetailsArr[i].timestamp),
                            "y": outTransDetailsArr[i].outstandingRequest
                        })
                    }
                }

                if(outTransDetailsArrMin.length > 0 && !(currentTime.getTime() - (new Date(outTransDetailsArrMin[outTransDetailsArrMin.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.minGraph)){
                    outTransDataMin = []
                    for(var j = 0; j< outTransDetailsArrMin.length; j++){
                        outTransDataMin = sliceFirstData(outTransDataMin, dataView.Minutes);
                        outTransDataMin.push({"x": new Date(outTransDetailsArrMin[j].timestamp),
                            "y": outTransDetailsArrMin[j].outstandingRequest
                        })
                    }
                }

                if(outTransDetailsArrDay.length > 0 && !(currentTime.getTime() - (new Date(outTransDetailsArrDay[outTransDetailsArrDay.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.dayGraph)){
                    outTransDataDay = []
                    for(var k = 0; k< outTransDetailsArrDay.length; k++){
                        outTransDataDay = sliceFirstData(outTransDataDay, dataView.Days );
                        outTransDataDay.push({"x": new Date(outTransDetailsArrDay[k].timestamp),
                            "y": outTransDetailsArrDay[k].outstandingRequest
                        })
                    }
                }
            }

            var outstandingRequest = outTransDetail["DETAILS"].OUTSTANDING_REQUESTS * 1;
            var timeStamp = outTransDetail["DETAILS"].TIMESTAMP;


            if (timeStamp >= monitor.outTransMaxTimeStamp) {
                if (outTransSecCount >= 6 || monitor.outTransFirstData) {
                    outTransDataMin = sliceFirstData(outTransDataMin, dataView.Minutes);
                    if (timeStamp == monitor.outTransMaxTimeStamp) {
                        outTransDataMin.push({ "x": new Date(timeStamp), "y": outTransDataMin[outTransDataMin.length - 1].y });
                        outTransDetailsArrMin = saveLocalStorageInterval(outTransDetailsArrMin, {"timestamp": new Date(timeStamp), "outstandingRequest": outTransDataMin[outTransDataMin.length - 1].y}, MonitorGraphUI.timeUnit.min  )
                    } else {
                        outTransDataMin.push({ "x": new Date(timeStamp), "y": outstandingRequest });
                        outTransDetailsArrMin = saveLocalStorageInterval(outTransDetailsArrMin, {"timestamp": new Date(timeStamp), "outstandingRequest": outstandingRequest}, MonitorGraphUI.timeUnit.min  )
                    }
                    Monitors.outTransDataMin = outTransDataMin;
                    outTransSecCount = 0;
                }
                if (outTransMinCount >= 60 || monitor.outTransFirstData) {
                    outTransDataDay = sliceFirstData(outTransDataDay, dataView.Days);
                    if (timeStamp == monitor.outTransMaxTimeStamp) {
                        outTransDataDay.push({ "x": new Date(timeStamp), "y": outTransDataDay[outTransDataDay.length - 1].y });
                        outTransDetailsArrDay = saveLocalStorageInterval(outTransDetailsArrDay, {"timestamp": new Date(timeStamp), "outstandingRequest": outTransDataDay[outTransDataDay.length - 1].y}, MonitorGraphUI.timeUnit.day  )
                    } else {
                        outTransDataDay.push({ "x": new Date(timeStamp), "y": outstandingRequest });
                        outTransDetailsArrDay = saveLocalStorageInterval(outTransDetailsArrDay, {"timestamp": new Date(timeStamp), "outstandingRequest": outstandingRequest}, MonitorGraphUI.timeUnit.day )
                    }
                    Monitors.outTransDataDay = outTransDataDay;
                    outTransMinCount = 0;
                }
                outTransData = sliceFirstData(outTransData, dataView.Seconds);
                if (timeStamp == monitor.outTransMaxTimeStamp) {
                    outTransData.push({ "x": new Date(timeStamp), "y": outTransData[outTransData.length - 1].y });
                    outTransDetailsArr = saveLocalStorageInterval(outTransDetailsArr, {"timestamp": new Date(timeStamp), "outstandingRequest": outTransData[outTransData.length - 1].y}, MonitorGraphUI.timeUnit.sec  )
                } else {
                    outTransData.push({ "x": new Date(timeStamp), "y": outstandingRequest });
                    outTransDetailsArr = saveLocalStorageInterval(outTransDetailsArr, {"timestamp": new Date(timeStamp), "outstandingRequest": outstandingRequest}, MonitorGraphUI.timeUnit.sec  )
                }
                try{
                    $(".errorImporterMsgLocalStorageFull").hide();
                    localStorage.outTransDetails = JSON.stringify(outTransDetailsArr)
                    localStorage.outTransDetailsMin = JSON.stringify(outTransDetailsArrMin)
                    localStorage.outTransDetailsDay = JSON.stringify(outTransDetailsArrDay)
                } catch(e) {
                    $(".errorImporterMsgLocalStorageFull").show();
                }
                Monitors.outTransData = outTransData;
                monitor.outTransFirstData = false;

                if (graphView == 'Minutes')
                    dataOutTrans[0]["values"] = outTransDataMin;
                else if (graphView == 'Days')
                    dataOutTrans[0]["values"] = outTransDataDay;
                else {
                    dataOutTrans[0]["values"] = outTransData;

                }

                if (currentTab == NavigationTabs.Importer && currentView == graphView && outTransChart.is(":visible")) {
                    d3.select('#visualisationOutTrans')
                        .datum(dataOutTrans)
                        .transition().duration(500)
                        .call(ChartOutTrans);
                }
            }
            if (timeStamp > monitor.outTransMaxTimeStamp)
                monitor.outTransMaxTimeStamp = timeStamp;
            outTransSecCount++;
            outTransMinCount++;
        };

        this.RefreshSuccessRateGraph = function (successRateDetails, graphView, currentTab) {
            var monitor = Monitors;
            var dataSuccessRateSec = monitor.successRateData;
            var dataSuccessRateMin = monitor.successRateDataMin;
            var dataSuccessRateDay = monitor.successRateDataDay;
            var successRateDetail = successRateDetails;
            var x = 0;
            var y = 0;
            var successRateDetailsArr = []
            var successRateDetailsArrMin = []
            var successRateDetailsArrDay = []

            if ($.isEmptyObject(successRateDetail) || successRateDetail == undefined || successRateDetail['DETAILS'].SUCCESSES == undefined
            || successRateDetail['DETAILS'].TIMESTAMP == undefined)
                return;

            if(localStorage.successRateDetailsMin != undefined){
                successRateDetailsArrMin = getFormattedDataFromLocalStorage(JSON.parse(localStorage.successRateDetailsMin))
            } else {
                successRateDetailsArrMin = JSON.stringify(convertDataFormat(dataSuccessRateMin, 'timestamp', 'successRate'))
                successRateDetailsArrMin = JSON.parse(successRateDetailsArrMin)
            }


            if(localStorage.successRateDetails != undefined){
                successRateDetailsArr = getFormattedDataFromLocalStorage(JSON.parse(localStorage.successRateDetails))
            } else {
                successRateDetailsArr = JSON.stringify(convertDataFormat(dataSuccessRateSec, 'timestamp', 'successRate'))
                successRateDetailsArr = JSON.parse(successRateDetailsArr)
            }

            if(localStorage.successRateDetailsDay != undefined){
                successRateDetailsArrDay = getFormattedDataFromLocalStorage(JSON.parse(localStorage.successRateDetailsDay))
            } else {
                successRateDetailsArrDay = JSON.stringify(convertDataFormat(dataSuccessRateDay, 'timestamp', 'successRate'))
                successRateDetailsArrDay = JSON.parse(successRateDetailsArrDay)
            }

            if(monitor.successRateFirstData){
                if(successRateDetailsArr.length > 0 && !(currentTime.getTime() - (new Date(successRateDetailsArr[successRateDetailsArr.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.secGraph)){
                    dataSuccessRateSec = []
                    for(var i = 0; i< successRateDetailsArr.length; i++){
                        dataSuccessRateSec = sliceFirstData(dataSuccessRateSec, dataView.Seconds);
                        dataSuccessRateSec.push({"x": new Date(successRateDetailsArr[i].timestamp),
                            "y": successRateDetailsArr[i].successRate
                        })
                    }
                }
                if(successRateDetailsArrMin.length > 0 && !(currentTime.getTime() - (new Date(successRateDetailsArrMin[successRateDetailsArrMin.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.minGraph)){
                    dataSuccessRateMin = []
                    for(var j = 0; j< successRateDetailsArrMin.length; j++){
                        dataSuccessRateMin = sliceFirstData(dataSuccessRateMin, dataView.Minutes);
                        dataSuccessRateMin.push({"x": new Date(successRateDetailsArrMin[j].timestamp),
                            "y": successRateDetailsArrMin[j].successRate
                        })
                    }
                }

                if(successRateDetailsArrDay.length > 0 && !(currentTime.getTime() - (new Date(successRateDetailsArrDay[successRateDetailsArrDay.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.dayGraph)){
                    dataSuccessRateDay = []
                    for(var k = 0; k< successRateDetailsArrDay.length; k++){
                        dataSuccessRateDay = sliceFirstData(dataSuccessRateDay, dataView.Days);
                        dataSuccessRateDay.push({"x": new Date(successRateDetailsArrDay[k].timestamp),
                            "y": successRateDetailsArrDay[k].successRate
                        })
                    }
                }
            }

            var successRateTimeStamp = new Date(successRateDetail['DETAILS'].TIMESTAMP);

            if (successRateTimeStamp >= monitor.successRateMaxTimeStamp) {
                var successRate = successRateDetail['DETAILS'].SUCCESSES * 1;

                if (successRateSecCount >= 6 || monitor.successRateFirstData) {
                    dataSuccessRateMin = sliceFirstData(dataSuccessRateMin, dataView.Minutes);
                    if (successRateTimeStamp == monitor.successRateMaxTimeStamp) {
                        dataSuccessRateMin.push({ "x": new Date(successRateTimeStamp), "y": dataSuccessRateMin[dataSuccessRateMin.length - 1].y });
                        successRateDetailsArrMin = saveLocalStorageInterval(successRateDetailsArrMin, {"timestamp": new Date(successRateTimeStamp), "successRate": dataSuccessRateMin[dataSuccessRateMin.length - 1].y })
                    } else {
                        dataSuccessRateMin.push({ 'x': new Date(successRateTimeStamp), 'y': successRate });
                        successRateDetailsArrMin = saveLocalStorageInterval(successRateDetailsArrMin, {"timestamp": new Date(successRateTimeStamp), "successRate": successRate })
                    }
                    Monitors.successRateDataMin = dataSuccessRateMin;
                    successRateSecCount = 0;
                }

                if (successRateMinCount >= 60 || monitor.successRateFirstData) {
                    dataSuccessRateDay = sliceFirstData(dataSuccessRateDay, dataView.Days);
                    if (successRateTimeStamp == monitor.successRateMaxTimeStamp) {
                        dataSuccessRateDay.push({ "x": new Date(successRateTimeStamp), "y": dataSuccessRateDay[dataSuccessRateDay.length - 1].y });
                        successRateDetailsArrDay = saveLocalStorageInterval(successRateDetailsArrDay, {"timestamp": new Date(successRateTimeStamp), "successRate": dataSuccessRateDay[dataSuccessRateDay.length - 1].y})
                    } else {
                        dataSuccessRateDay.push({ 'x': new Date(successRateTimeStamp), 'y': successRate });
                        successRateDetailsArrDay = saveLocalStorageInterval(successRateDetailsArrDay, {"timestamp": new Date(successRateTimeStamp), "successRate": successRate})
                    }
                    Monitors.successRateDataDay = dataSuccessRateDay;
                    successRateMinCount = 0;
                }

                dataSuccessRateSec = sliceFirstData(dataSuccessRateSec, dataView.Seconds);
                if (successRateTimeStamp == monitor.successRateMaxTimeStamp) {
                    dataSuccessRateSec.push({ "x": new Date(successRateTimeStamp), "y": dataSuccessRateSec[dataSuccessRateSec.length - 1].y });
                    successRateDetailsArr = saveLocalStorageInterval(successRateDetailsArr, {"timestamp": new Date(successRateTimeStamp), "successRate": dataSuccessRateSec[dataSuccessRateSec.length - 1].y})
                } else {
                    dataSuccessRateSec.push({ 'x': new Date(successRateTimeStamp), 'y': successRate });
                    successRateDetailsArr = saveLocalStorageInterval(successRateDetailsArr, {"timestamp": new Date(successRateTimeStamp), "successRate": successRate})
                }
                Monitors.successRateData = dataSuccessRateSec;


                localStorage.successRateDetails = JSON.stringify(successRateDetailsArr)
                localStorage.successRateDetailsMin = JSON.stringify(successRateDetailsArrMin)
                localStorage.successRateDetailsDay = JSON.stringify(successRateDetailsArrDay)

                if (graphView == 'Minutes')
                    dataSuccessRate[0]["values"] = dataSuccessRateMin;
                else if (graphView == 'Days')
                    dataSuccessRate[0]["values"] = dataSuccessRateDay;
                else
                    dataSuccessRate[0]["values"] = dataSuccessRateSec;

                if (currentTab == NavigationTabs.Importer && currentView == graphView && successRateChart.is(":visible")) {
                    d3.select('#visualisationSuccessRate')
                        .datum(dataSuccessRate)
                        .transition().duration(500)
                        .call(ChartSuccessRate);
                }
                monitor.successRateFirstData = false;
            }
            if (successRateTimeStamp > monitor.successRateMaxTimeStamp)
                monitor.successRateMaxTimeStamp = successRateTimeStamp;
            successRateSecCount++;
            successRateMinCount++;
        };

        this.RefreshFailureRateGraph = function (failureRateDetails, graphView, currentTab) {
            var monitor = Monitors;
            var dataFailureRateSec = monitor.failureRateData;
            var dataFailureRateMin = monitor.failureRateDataMin;
            var dataFailureRateDay = monitor.failureRateDataDay;
            var failureRateDetail = failureRateDetails;
            var x = 0;
            var y = 0;
            var failureRateDetailsArr = []
            var failureRateDetailsArrMin = []
            var failureRateDetailsArrDay = []

            if ($.isEmptyObject(failureRateDetail) || failureRateDetail == undefined || failureRateDetail['DETAILS'].FAILURES == undefined
            || failureRateDetail['DETAILS'].TIMESTAMP == undefined)
                return;

            if(localStorage.failureRateDetailsMin != undefined){
                failureRateDetailsArrMin = getFormattedDataFromLocalStorage(JSON.parse(localStorage.failureRateDetailsMin))
            } else {
                failureRateDetailsArrMin = JSON.stringify(convertDataFormat(dataFailureRateMin, 'timestamp', 'failureRate'))
                failureRateDetailsArrMin = JSON.parse(failureRateDetailsArrMin)
            }


            if(localStorage.failureRateDetails != undefined){
                failureRateDetailsArr = getFormattedDataFromLocalStorage(JSON.parse(localStorage.failureRateDetails))
            } else {
                failureRateDetailsArr = JSON.stringify(convertDataFormat(dataFailureRateSec, 'timestamp', 'failureRate'))
                failureRateDetailsArr = JSON.parse(failureRateDetailsArr)
            }

            if(localStorage.failureRateDetailsDay != undefined){
                failureRateDetailsArrDay = getFormattedDataFromLocalStorage(JSON.parse(localStorage.failureRateDetailsDay))
            } else {
                failureRateDetailsArrDay = JSON.stringify(convertDataFormat(dataFailureRateDay, 'timestamp', 'failureRate'))
                failureRateDetailsArrDay = JSON.parse(failureRateDetailsArrDay)
            }

            if(monitor.failureRateFirstData){
                if(failureRateDetailsArr.length > 0 && !(currentTime.getTime() - (new Date(failureRateDetailsArr[failureRateDetailsArr.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.secGraph)){
                    dataFailureRateSec = []
                    for(var i = 0; i< failureRateDetailsArr.length; i++){
                        dataFailureRateSec = sliceFirstData(dataFailureRateSec, dataView.Seconds);
                        dataFailureRateSec.push({"x": new Date(failureRateDetailsArr[i].timestamp),
                            "y": failureRateDetailsArr[i].failureRate
                        })
                    }
                }
                if(failureRateDetailsArrMin.length > 0 && !(currentTime.getTime() - (new Date(failureRateDetailsArrMin[failureRateDetailsArrMin.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.minGraph)){
                    dataFailureRateMin = []
                    for(var j = 0; j< failureRateDetailsArrMin.length; j++){
                        dataFailureRateMin = sliceFirstData(dataFailureRateMin, dataView.Minutes);
                        dataFailureRateMin.push({"x": new Date(failureRateDetailsArrMin[j].timestamp),
                            "y": failureRateDetailsArrMin[j].failureRate
                        })
                    }
                }

                if(failureRateDetailsArrDay.length > 0 && !(currentTime.getTime() - (new Date(failureRateDetailsArrDay[failureRateDetailsArrDay.length - 1].timestamp)).getTime() > MonitorGraphUI.enumMaxTimeGap.dayGraph)){
                    dataFailureRateDay = []
                    for(var k = 0; k< failureRateDetailsArrDay.length; k++){
                        dataFailureRateDay = sliceFirstData(dataFailureRateDay, dataView.Days);
                        dataFailureRateDay.push({"x": new Date(failureRateDetailsArrDay[k].timestamp),
                            "y": failureRateDetailsArrDay[k].failureRate
                        })
                    }
                }
            }

            var failureRateTimeStamp = new Date(failureRateDetail['DETAILS'].TIMESTAMP);

            if (failureRateTimeStamp >= monitor.failureRateMaxTimeStamp) {
                var failureRate = failureRateDetail['DETAILS'].FAILURES * 1;

                if (failureRateSecCount >= 6 || monitor.failureRateFirstData) {
                    dataFailureRateMin = sliceFirstData(dataFailureRateMin, dataView.Minutes);
                    if (failureRateTimeStamp == monitor.failureRateMaxTimeStamp) {
                        dataFailureRateMin.push({ "x": new Date(failureRateTimeStamp), "y": dataFailureRateMin[dataFailureRateMin.length - 1].y });
                        failureRateDetailsArrMin = saveLocalStorageInterval(failureRateDetailsArrMin, {"timestamp": new Date(failureRateTimeStamp), "failureRate": dataFailureRateMin[dataFailureRateMin.length - 1].y })
                    } else {
                        dataFailureRateMin.push({ 'x': new Date(failureRateTimeStamp), 'y': failureRate });
                        failureRateDetailsArrMin = saveLocalStorageInterval(failureRateDetailsArrMin, {"timestamp": new Date(failureRateTimeStamp), "failureRate": failureRate })
                    }
                    Monitors.failureRateDataMin = dataFailureRateMin;
                    failureRateSecCount = 0;
                }

                if (failureRateMinCount >= 60 || monitor.failureRateFirstData) {
                    dataFailureRateDay = sliceFirstData(dataFailureRateDay, dataView.Days);
                    if (failureRateTimeStamp == monitor.failureRateMaxTimeStamp) {
                        dataFailureRateDay.push({ "x": new Date(failureRateTimeStamp), "y": dataFailureRateDay[dataFailureRateDay.length - 1].y });
                        failureRateDetailsArrDay = saveLocalStorageInterval(failureRateDetailsArrDay, {"timestamp": new Date(failureRateTimeStamp), "failureRate": dataFailureRateDay[dataFailureRateDay.length - 1].y})
                    } else {
                        dataFailureRateDay.push({ 'x': new Date(failureRateTimeStamp), 'y': failureRate });
                        failureRateDetailsArrDay = saveLocalStorageInterval(failureRateDetailsArrDay, {"timestamp": new Date(failureRateTimeStamp), "failureRate": failureRate})
                    }
                    Monitors.failureRateDataDay = dataFailureRateDay;
                    failureRateMinCount = 0;
                }

                dataFailureRateSec = sliceFirstData(dataFailureRateSec, dataView.Seconds);
                if (failureRateTimeStamp == monitor.failureRateMaxTimeStamp) {
                    dataFailureRateSec.push({ "x": new Date(failureRateTimeStamp), "y": dataFailureRateSec[dataFailureRateSec.length - 1].y });
                    failureRateDetailsArr = saveLocalStorageInterval(failureRateDetailsArr, {"timestamp": new Date(failureRateTimeStamp), "failureRate": dataFailureRateSec[dataFailureRateSec.length - 1].y})
                } else {
                    dataFailureRateSec.push({ 'x': new Date(failureRateTimeStamp), 'y': failureRate });
                    failureRateDetailsArr = saveLocalStorageInterval(failureRateDetailsArr, {"timestamp": new Date(failureRateTimeStamp), "failureRate": failureRate})
                }
                Monitors.failureRateData = dataFailureRateSec;


                localStorage.failureRateDetails = JSON.stringify(failureRateDetailsArr)
                localStorage.failureRateDetailsMin = JSON.stringify(failureRateDetailsArrMin)
                localStorage.failureRateDetailsDay = JSON.stringify(failureRateDetailsArrDay)

                if (graphView == 'Minutes')
                    dataFailureRate[0]["values"] = dataFailureRateMin;
                else if (graphView == 'Days')
                    dataFailureRate[0]["values"] = dataFailureRateDay;
                else
                    dataFailureRate[0]["values"] = dataFailureRateSec;

                if (currentTab == NavigationTabs.Importer && currentView == graphView && successRateChart.is(":visible")) {
                    d3.select('#visualisationFailureRate')
                        .datum(dataFailureRate)
                        .transition().duration(500)
                        .call(ChartFailureRate);
                }
                monitor.failureRateFirstData = false;
            }
            if (failureRateTimeStamp > monitor.failureRateMaxTimeStamp)
                monitor.failureRateMaxTimeStamp = failureRateTimeStamp;
            failureRateSecCount++;
            failureRateMinCount++;
        };
    });

    window.MonitorGraphUI = new IMonitorGraphUI();
})(window);

