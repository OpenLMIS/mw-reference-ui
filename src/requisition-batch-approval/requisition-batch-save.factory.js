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

    factory.$inject = ['$q', '$http', '$filter', 'openlmisUrlFactory'];

    function factory($q, $http, $filter, openlmisUrlFactory) {

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

            $http.put(openlmisUrlFactory('/api/requisitions/save'), requisitions)
            .then(function(response) {
                deferred.resolve(response.data.requisitionDtos);
            }, function(response) {
                angular.forEach(requisitions, function(requisition) {
                    var requisitionError = $filter('filter')(response.data.requisitionErrors, {requisitionId: requisition.id});
                    if (requisitionError !== undefined) {
                        requisition.$error = requisitionError[0].errorMessage.message;
                    }
                });
                deferred.reject(response.data.requisitionDtos);
            });

            return deferred.promise;
        }
    }

})();
