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
     * @name requisition-batch-approval.requisitionBatchSaveFactory
     *
     * @description
     * Takes a list of requisitions and will try to save them. The factory
     * returns a promise that will either resolve or return with a rejection.
     *
     * This factory will implicitly modify any requisitions passed to it.
     * 
     */

    angular
        .module('requisition-batch-approval')
        .factory('requisitionBatchSaveFactory', factory);

    factory.$inject = ['$q', '$http', '$filter', 'openlmisUrlFactory', 'Requisition', 'COLUMN_SOURCES', 'dateUtils'];

    function factory($q, $http, $filter, openlmisUrlFactory, Requisition, COLUMN_SOURCES, dateUtils) {
        return saveRequisitions;

        /**
         * @ngdoc method
         * @methodOf requisition-batch-approval.requisitionBatchSaveFactory
         * @name saveRequisitions
         *
         * @param {Array} requisitionObjects A list of requisition objects to save
         *
         * @return {Promise} A promise that returns a list of errors on failure
         *
         * @description
         * Takes a list of requisitionObjects and attempts to save them to the
         * OpenLMIS Server.
         * 
         */
        function saveRequisitions(requisitions){

            if(!Array.isArray(requisitions) || requisitions.length == 0){
                return $q.reject([]);
            }

            var deferred = $q.defer();

            var requisitionDtos = [];
            requisitions.forEach(function(requisition){
                requisitionDtos.push(transformRequisition(requisition));
            });

            $http.put(openlmisUrlFactory('/api/requisitions/save'), requisitionDtos)
            .then(function(response) {
                deferred.resolve(transformDtos(response.data.requisitionDtos, requisitions));
            }, function(response) {
                angular.forEach(requisitions, function(requisition) {
                    var requisitionError = $filter('filter')(response.data.requisitionErrors, {requisitionId: requisition.id});
                    if (requisitionError.length > 0) {
                        requisition.$error = requisitionError[0].errorMessage.message;
                    }
                });
                deferred.reject(transformDtos(response.data.requisitionDtos, requisitions));
            });

            return deferred.promise;
        }

        function transformDtos(dtos, requisitions){
            var newRequisitions = [];
            if(dtos && Array.isArray(dtos)){
                dtos.forEach(function(dto) {
                    requisitions.forEach(function(requisition){
                        if(requisition.id === dto.id){
                            dto.template = requisition.template;
                        }
                    });
                    newRequisitions.push(new Requisition(dto));
                });
            }
            return newRequisitions;
        }

        function transformRequisition(requisition) {
            var columns = requisition.template.columnsMap,
                requestBody = angular.copy(requisition);

            angular.forEach(requestBody.requisitionLineItems, function(lineItem) {
                transformLineItem(lineItem, columns);
            });

            requestBody.processingPeriod.startDate = dateUtils.toStringDate(
                requestBody.processingPeriod.startDate
            );
            requestBody.processingPeriod.endDate = dateUtils.toStringDate(
                requestBody.processingPeriod.endDate
            );

            return requestBody;
        }


        function transformLineItem(lineItem, columns) {
            angular.forEach(columns, function(column) {
                if (!column.$display || column.source === COLUMN_SOURCES.CALCULATED) {
                    lineItem[column.name] = null;
                }
            });
        }

    }

})();
