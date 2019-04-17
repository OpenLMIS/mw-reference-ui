/*
 * This program is part of the OpenLMIS logistics management information system platform software.
 * Copyright © 2017 VillageReach
 *
 * This program is free software: you can redistribute it and/or modify it under the terms
 * of the GNU Affero General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *  
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU Affero General Public License for more details. You should have received a copy of
 * the GNU Affero General Public License along with this program. If not, see
 * http://www.gnu.org/licenses.  For additional information contact info@OpenLMIS.org. 
 */

(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name report.reportFactory
     *
     * @description
     * Responsible for grouping products into categories to be displayed on the Add Product modal.
     */
    angular
        .module('report')
        .factory('reportFactory', factory);

    factory.$inject = ['$http', '$q', 'openlmisUrlFactory', 'reportService', 'REPORTING_SERVICES',
        'authorizationService', 'REPORT_RIGHTS'];

    function factory($http, $q, openlmisUrlFactory, reportService, REPORTING_SERVICES,
                     authorizationService, REPORT_RIGHTS) {
        var factory = {
            getReport: getReport,
            getReports: getReports,
            getAllReports: getAllReports,
            getReportParamOptions: getReportParamOptions,
            getReportParamsOptions: getReportParamsOptions
        };
        return factory;

        /**
         * @ngdoc method
         * @methodOf report.reportFactory
         * @name getReport
         *
         * @description
         * Retrieves a report with the given ID for a module. Uses getReport() from the report
         * service.
         *
         * @param  {String}   module The module to retrieve the report from (for example
                                     requisitions).
         * @param  {String}   id     The ID of the report.
         * @return {Promise}         The promise for the report.
         */
        function getReport(module, id) {
            return reportService.getReport(module, id).then(function(report) {
                report.$module = module;
                return $q.resolve(report);
            });
        }

        /**
         * @ngdoc method
         * @methodOf report.reportFactory
         * @name getReports
         *
         * @description
         * Retrieves all reports for the given module. Uses getReport() from the report service.
         *
         * @param  {String}  module The module to retrieve the report from (for example requisitions).
         * @return {Promise}        The promise for the report array.
         */
        function getReports(module) {
            return reportService.getReports(module).then(function(reports) {
                reports.forEach(function(report) {
                    report.$module = module;
                });
                return $q.resolve(reports);
            });
        }

        /**
         * @ngdoc method
         * @methodOf report.reportFactory
         * @name getAllReports
         *
         * @description
         * Retrieves all reports, from all available modules. Currently 'requisitions' is the only
         * supported report module.
         *
         * @return {Promise} The promise for all the reports.
         */
        function getAllReports() {
            if (!authorizationService.hasRight(REPORT_RIGHTS.REPORTS_VIEW)) {
                return $q.resolve([]);
            }

            var promises = [],
                services = REPORTING_SERVICES;

            services.forEach(function(service) {
                promises.push(getReports(service));
            });

            return $q.all(promises).then(function(reportLists) {
                return reportLists.reduce(function(result, reportList) {
                    return result.concat(reportList);
                }, []);
            });
        }

        /**
         * @ngdoc method
         * @methodOf report.reportFactory
         * @name getReportParamsOptions
         *
         * @description
         * Retrieves parameter options for a report - each report gives the user an option to
         * select parameters that apply only this report. This returns options for all params of
         * the report.
         *
         * @param  {String}  report The report object for which params should be retrieved.
         * @return {Promise}        The promise for report params.
         */
        function getReportParamsOptions(report) {
            var promises = [],
                parameters = {};

            report.templateParameters.forEach(function(param) {
                var paramDeferred = $q.defer();

                if (param.dependencies && param.dependencies.length > 0) {
                    parameters[param.name] = [];
                    paramDeferred.resolve();
                } else if (param.selectExpression !== null && param.selectExpression !== undefined) {
                    promises.push(paramDeferred.promise);

                    getReportParamOptions(param).then(function(items) {
                        parameters[param.name] = items;
                        paramDeferred.resolve();
                    }, paramDeferred.reject);
                } else if (param.options !== null && param.options !== undefined) {
                    promises.push(paramDeferred.promise);

                    var items = param.options.map(function(option) {
                        return {
                            name: option,
                            value: option
                        };
                    });

                    parameters[param.name] = items;
                    paramDeferred.resolve();
                }
            });

            return $q.all(promises).then(function() {
                return $q.resolve(parameters);
            });
        }

        /**
         * @ngdoc method
         * @methodOf report.reportFactory
         * @name getReportParamsOptions
         *
         * @description
         * Retrieves parameter options for a report param - each report gives the user an option to
         * select parameters that apply only to this report. Uses getReportParamsOptions() from the
         * report service. This returns a list of items available as options for the param, each
         * with a 'value' and a 'displayName'
         * property.
         *
         * @param  {String}   parameter   The parameter for which the options will be retrieved.
         * @param  {String}   attributes  The optional mapping for parameter url placeholders.
         *
         * @return {Promise}              The promise for report params.
         */
        function getReportParamOptions(parameter, attributes) {
            var uri = getReportParamSelectExpressionUri(parameter, attributes);
            var property = parameter.selectProperty;
            var displayName = parameter.displayProperty;

            return reportService.getReportParamsOptions(uri, parameter.selectMethod, parameter.selectBody)
                .then(function(response) {
                    var items = [];

                    // Support paginated endpoints
                    var data = response.data;
                    if (data.content && data.totalElements > 0) {
                        data = data.content;
                    }

                    data.forEach(function(obj) {
                        var value = property ? obj[property] : obj;
                        var name = displayName ? obj[displayName] : value;

                        if (value) {
                            items.push({
                                name: name,
                                value: value
                            });
                        }
                    });

                    return $q.resolve(items);
                });
        }

        /**
         * @ngdoc method
         * @methodOf report.reportFactory
         * @name getReportParamSelectExpressionUri
         *
         * @description
         * Creates a select expression URI for parameter, including it's own expression
         * and dependent report parameters.
         *
         * @param  {String}   parameter   The parameter for which the uri will be retrieved.
         * @param  {String}   attributes  The optional mapping for parameter uri placeholders.
         *
         * @return {String}               The formed select expression uri.
         */
        function getReportParamSelectExpressionUri(parameter, attributes) {
            var uri = parameter.selectExpression;
            var dependencies = parameter.dependencies || [];

            if (attributes && dependencies.length > 0) {
                uri = uri + '?';
                angular.forEach(dependencies, function(param) {
                    if (attributes[param.dependency]) {
                        // Malawi: get single field from object
                        uri += param.placeholder + '=' + attributes[param.dependency][param.property] + '&&';
                        // --- ends here ---
                    }
                });
            }

            return uri;
        }
    }

})();
