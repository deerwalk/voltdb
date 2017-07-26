var latencyDetails = [];
function loadAnalysisPage(){
    VoltDbAnalysis.setDefaultAnalysisSettings();
    $("#tabProcedureBtn").trigger("click");
    $("#tabAnalysis li a").on("click", function(){
        VoltDbAnalysis.refreshChart();
    })

    $("#ulProcedure li a").on("click", function(){
        refreshLegend($($(this)[0]).text());
    })

    function refreshLegend(legendTitle){
        if(legendTitle == "Frequency"){
            $(".spnAnalysisLegend").html(VoltDbAnalysis.partitionStatus == "both" ?"Number Of Invocation(" : "Number Of Invocation");
            VoltDbAnalysis.currentTab =  "Frequency";
        } else if(legendTitle == "Total Processing Time"){
            $(".spnAnalysisLegend").html(VoltDbAnalysis.partitionStatus == "both" ?"Total Processing Time(" : "Total Processing Time");
            VoltDbAnalysis.currentTab = "Total Processing Time";
        } else {
            $(".spnAnalysisLegend").html(VoltDbAnalysis.partitionStatus == "both" ?"Average Execution Time(" : "Average Execution Time");
            VoltDbAnalysis.currentTab = "Average Execution Time";
        }
        //this method is called twice to ensure graph reloads properly
        VoltDbAnalysis.refreshChart();
        VoltDbAnalysis.refreshChart();
    }

    function calculateCombinedValue(profileData){
        var totalValue = 0;
        for(var j = 0; j < profileData.length; j++){
            totalValue += (profileData[j].AVG/1000000) * profileData[j].INVOCATIONS;
        }
        return totalValue;
    }

    function checkObjForLongStatementName(profileData){
        for(var j = 0; j < profileData.length; j++){
            if(profileData[j].STATEMENT.length > 14){
                return true;
            }
        }
        return false;
    }

    function formatAnalysisLegend(isMP, isP){
        if(isMP && isP){
            $("#legendAnalysisMP").hide();
            $("#legendAnalysisP").hide();
            $("#legendAnalysisBoth").show();
            VoltDbAnalysis.partitionStatus = "both"
        } else if(isMP){
            $("#legendAnalysisMP").show();
            $("#legendAnalysisP").hide();
            $("#legendAnalysisBoth").hide();
            VoltDbAnalysis.partitionStatus = "MP"
        } else {
            $("#legendAnalysisMP").hide();
            $("#legendAnalysisP").show();
            $("#legendAnalysisBoth").hide();
            VoltDbAnalysis.partitionStatus = "SP"
        }
        refreshLegend(VoltDbAnalysis.currentTab);
    }

    function fetchData (){
        $("#analysisLoader").show();
        $("#analysisRemarks").hide();
        $("#procedureWarning").html("");
        $("#tableWarning").html("");
        VoltDbAnalysis.refreshChart();

        voltDbRenderer.GetProcedureDetailInformation(function (procedureDetails){
            if(procedureDetails != undefined){
                if(!$.isEmptyObject(procedureDetails["PROCEDURE_DETAIL"])){
                    $(".analyzeNowContent").hide();
                    $(".dataContent").show();
                    $(".noDataContent").hide();
                } else {
                    $(".mainContentAnalysis").hide();
                    $(".dataContent").hide();
                    $(".noDataContent").show();

                }
                //For data section
                //$("#tblAnalyzeNowContent").hide();
                //$("#tblNoDataContent").show();
            }
            $("#analysisLoader").hide();
            //************need to determine count late****************//
            //VoltDbAnalysis.proceduresCount = profileData["PROCEDURE_PROFILE"].length;
            var dataLatencyProcedures = [];
            var dataLatencySysProcedures = [];
            var dataFrequencySysProcedures = [];
            var dataFrequencyProcedures = [];
            var dataTotalProcessingProcedures = [];
            var dataTotalProcessingSysProcedures = [];
            var timestamp;
            var isMPPresent = false;
            var isPPresent = false;
            var totalProcessingTime = VoltDbUI.getFromLocalStorage("totalProcessingTime");
            var averageExecutionTime = VoltDbUI.getFromLocalStorage("averageExecutionTime");
            var showHideSysProcedures = VoltDbUI.getFromLocalStorage("showHideSysProcedures");
            var procedureObj = {}
            var type = "Single Partitioned";
            for(var i = 0; i < procedureDetails["PROCEDURE_DETAIL"].length; i++ ){
                var statement = procedureDetails["PROCEDURE_DETAIL"][i].STATEMENT;
                var procedure = procedureDetails["PROCEDURE_DETAIL"][i].PROCEDURE;
                if(i == 0)
                    timestamp = procedureDetails["PROCEDURE_DETAIL"][i].TIMESTAMP;

                if(!procedureObj.hasOwnProperty(procedure)){
                    procedureObj[procedure] = {};
                    procedureObj[procedure]["COUNT"] = 0;
                    procedureObj[procedure]["AVG"] = 0;
                    procedureObj[procedure]["INVOCATION"] = 0;
                    procedureObj[procedure]["TYPE"] = "Single Partitioned"
                }

                if(statement == "<ALL>"){
                    procedureObj[procedure]["COUNT"]++;
                    procedureObj[procedure]["AVG"] += procedureDetails["PROCEDURE_DETAIL"][i].AVG_EXECUTION_TIME;
                    procedureObj[procedure]["INVOCATION"] += procedureDetails["PROCEDURE_DETAIL"][i].INVOCATIONS;
                }

                if(procedureObj[procedure]["TYPE"] != "Multi Partitioned"
                && procedureDetails["PROCEDURE_DETAIL"][i].PARTITION_ID == 16383){
                    procedureObj[procedure]["TYPE"] = "Multi Partitioned";
                }
            }

            var isSPresent = false;
            var isMPPresent = false;
            $.each(procedureObj, function(key, value){
                var avgExecTime = (value["AVG"] / value["COUNT"]) / 1000000;
                var calculatedProcessingTime = (avgExecTime * value["INVOCATION"]);
                var procedureName = key;
                var invocation = value["INVOCATION"];
                var type = value["TYPE"];
                var warningString = '';
                var warningToolTip = '';

                if((procedureName.indexOf("org.voltdb.sysprocs") > -1 && showHideSysProcedures)
                || procedureName.indexOf("org.voltdb.sysprocs") == -1){
                    if(type == "Single Partitioned"){
                        isSPresent = true;
                    } else {
                        isMPPresent = true;
                    }
                }

                if(calculatedProcessingTime > totalProcessingTime && totalProcessingTime != "") {
                    $("#analysisRemarks").show();
                    $("#procedureWarningSection").show();
                    warningString = "<p>" + procedureName + " has total processing time greater than "+ totalProcessingTime +"ms.</p>";
                    warningToolTip = procedureName + " <br> has total processing time greater <br> than "+ totalProcessingTime +"ms.";
                }

                if(averageExecutionTime != undefined && averageExecutionTime != ""){
                    if(avgExecTime > averageExecutionTime){
                        $("#analysisRemarks").show();
                        $("#procedureWarningSection").show();
                        warningString = warningString + "<p>" + procedureName + " has average execution time greater than "+ averageExecutionTime +"ms.</p>"
                        warningToolTip = warningToolTip + "<br/>"+ procedureName + " <br/>has average execution time greater<br/> than "+ averageExecutionTime +"ms.";
                    }
                }

                $("#procedureWarning").append(warningString);

                VoltDbAnalysis.procedureValue[procedureName] = {
                    AVG: avgExecTime,
                    INVOCATIONS: invocation,
                    TOTAL_PROCESSING_TIME: calculatedProcessingTime,
                    TYPE:type,
                    WARNING: warningToolTip
                }

                if(procedureName.indexOf("org.voltdb.sysprocs") > -1){
                    dataLatencySysProcedures.push({"label": procedureName , "value": avgExecTime, "index": calculatedProcessingTime});
                    dataFrequencySysProcedures.push({"label": procedureName, "value": invocation, "index": calculatedProcessingTime});
                    dataTotalProcessingSysProcedures.push({"label": procedureName, "value": calculatedProcessingTime, "index": calculatedProcessingTime});
                } else {
                    dataLatencyProcedures.push({"label": procedureName , "value": avgExecTime, "index": calculatedProcessingTime});
                    dataFrequencyProcedures.push({"label": procedureName, "value": invocation, "index": calculatedProcessingTime});
                    dataTotalProcessingProcedures.push({"label": procedureName, "value": calculatedProcessingTime, "index": calculatedProcessingTime});
                }
            });

            var formatDate = VoltDbAnalysis.formatDateTime(timestamp);
            $("#analysisDate").html(formatDate);
            formatAnalysisLegend(isMPPresent, isSPresent);
            MonitorGraphUI.initializeAnalysisGraph();

            if(showHideSysProcedures){
                dataLatencyProcedures = $.merge(dataLatencyProcedures, dataLatencySysProcedures);
                dataFrequencyProcedures = $.merge(dataFrequencyProcedures, dataFrequencySysProcedures);
                dataTotalProcessingProcedures = $.merge(dataTotalProcessingProcedures, dataTotalProcessingSysProcedures);
            }
            if($.isEmptyObject(dataLatencyProcedures))
                $("#visualiseLatencyAnalysis > text").css("margin")
            ////order the procedure by  their (avg_exec_time * invocation) value
            dataLatencyProcedures.sort(function(a,b) {return ((b.index) > (a.index)) ? 1 : (((a.index) > (b.index)) ? -1 : 0);});
            dataFrequencyProcedures.sort(function(a,b) {return ((b.index) > (a.index)) ? 1 : (((a.index) > (b.index)) ? -1 : 0);});
            dataTotalProcessingProcedures.sort(function(a,b) {return ((b.index) > (a.index)) ? 1 : (((a.index) > (b.index)) ? -1 : 0);});

            MonitorGraphUI.RefreshAnalysisLatencyGraph(dataLatencyProcedures);
            MonitorGraphUI.RefreshAnalysisFrequencyGraph(dataFrequencyProcedures);
            MonitorGraphUI.RefreshAnalysisCombinedGraph(dataTotalProcessingProcedures);
        });

        voltDbRenderer.GetProcedureDetailInformation(function (procedureDetails){
            var latencyDetails = [];
//            procedureDetails["PROCEDURE_DETAIL"].sort(function(a, b) {
//                return parseFloat(b.AVG_EXECUTION_TIME) - parseFloat(a.AVG_EXECUTION_TIME);
//            });


             //find procedure type

            procedureDetails["PROCEDURE_DETAIL"].forEach (function(item){
                var procedureName = item.PROCEDURE;
                var type = "Single Partitioned";
                procedureDetails["PROCEDURE_DETAIL"].forEach (function(item){
                    if(procedureName == item.PROCEDURE && item.PARTITION_ID == 16383){
                        type = "Multi Partitioned"
                        return false;
                    }
                });

                if(VoltDbAnalysis.combinedDetail[item.PROCEDURE] == undefined){
                    VoltDbAnalysis.combinedDetail[item.PROCEDURE] = [];
                }

                if(item.STATEMENT != "<ALL>"){
                    VoltDbAnalysis.combinedDetail[item.PROCEDURE].push({
                        AVG: item.AVG_EXECUTION_TIME/1000000,
                        INVOCATIONS: item.INVOCATIONS,
                        PARTITION_ID : item.PARTITION_ID,
                        STATEMENT: item.STATEMENT,
                        TIMESTAMP: item.TIMESTAMP,
                        PROCEDURE: item.PROCEDURE,
                        TYPE: type
                    })
                }

                VoltDbAnalysis.latencyDetail[item.STATEMENT] =
                    {
                        AVG: item.AVG_EXECUTION_TIME/1000000,
                        MIN: item.MIN_EXECUTION_TIME/1000000,
                        MAX: item.MAX_EXECUTION_TIME/1000000,
                        PARTITION_ID: item.PARTITION_ID,
                        INVOCATIONS: item.INVOCATIONS
                    }


                if(item.STATEMENT != "<ALL>"){
                    VoltDbAnalysis.latencyDetailValue.push({"type": type,  "STATEMENT": item.STATEMENT , "value": item.AVG_EXECUTION_TIME/1000000, "PROCEDURE": item.PROCEDURE, "TIMESTAMP": item.TIMESTAMP, "INVOCATION": item.INVOCATIONS, "MIN": item.MIN_EXECUTION_TIME, "MAX": item.MAX_EXECUTION_TIME});
                }
            });

            MonitorGraphUI.initializeFrequencyDetailGraph();
            MonitorGraphUI.initializeProcedureDetailGraph();
            MonitorGraphUI.initializeCombinedDetailGraph();
        });

    }

    $("#btnAnalyzeNow").on("click", function(){
        fetchData();
    })
}

(function(window) {
    iVoltDbAnalysis = (function(){
        this.procedureValue = {};
        this.latencyDetailValue = [];
        this.latencyDetail = {};
        this.combinedDetail = {};
        this.partitionStatus = "SP"
        this.proceduresCount = 0;
        this.latencyDetailTest = {};
        this.currentTab = "Average Execution Time";
        this.formatDateTime = function(timestamp) {
            var dateTime = new Date(timestamp);
            //get date
            var days = dateTime.getDate();
            var months = dateTime.getMonth() + 1;
            var years = dateTime.getFullYear();

            days = days < 10 ? "0" + days : days;
            months = months < 10 ? "0" + months : months;

            //get time
            var timePeriod = "AM"
            var hours = dateTime.getHours();
            var minutes = dateTime.getMinutes();
            var seconds = dateTime.getSeconds();

            timePeriod = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            hours = hours < 10 ? "0" + hours : hours
            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;

            //get final date time
            var date = months + "/" + days + "/" + years;
            var time = hours + ":" + minutes + ":" + seconds + " " + timePeriod;
            return date + " " + time;
        };

        this.refreshChart= function(){
            setTimeout(function(){
                window.dispatchEvent(new Event('resize'));
            },200)
        }

        this.setDefaultAnalysisSettings = function(){
            if(VoltDbUI.getFromLocalStorage("totalProcessingTime") == undefined){
               saveInLocalStorage("totalProcessingTime", 3000)
            }
            if(VoltDbUI.getFromLocalStorage("averageExecutionTime") == undefined){
                saveInLocalStorage("averageExecutionTime", 500)
            }
            if(VoltDbUI.getFromLocalStorage("showHideSysProcedures") == undefined){
                saveInLocalStorage("showHideSysProcedures", false)
            }
        }
    });


    window.VoltDbAnalysis = new iVoltDbAnalysis();
})(window);