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
     * @name requisition-batch-approval.requisitionBatchApprovalFactory
     *
     * @description
     * Takes a list of requisitions and will try to save/approve all of them.
     * The factory returns a promise that will either pass or return an error
     * array.
     *
     * This factory will implicitly modify any requisitions passed to it.
     * 
     */

    angular
        .module('requisition-batch-approval')
        .factory('requisitionBatchApproveFactory', factory);

    factory.$inject = ['$q', '$http', 'requisitionUrlFactory', 'requisitionValidator', 'requisitionBatchSaveFactory', 'messageService'];

    function factory($q, $http, requisitionUrlFactory, requisitionValidator, requisitionBatchSaveFactory, messageService) {

        return batchApprove;

        /**
         * @ngdoc method
         * @methodOf requisition-batch-approval.requisitionBatchApprovalFactory
         * @name batchApprove
         *
         * @param {Array} requisitions A list of requisition objects to approve
         *
         * @return {Promise} A promise that returns a list of errors on failure
         *
         * @description
         * Main function of factory, which takes a list of requisitions
         * and tries to save then approve them all.
         * 
         */
        function batchApprove(requisitions) {

            // Sending an error would complicate the contract, so we do
            // nothing (and pretend like it was a success)
            if(!Array.isArray(requisitions) || requisitions.length == 0){
                return $q.reject([]);
            }

            return requisitionBatchSaveFactory(requisitions)
            .then(validateRequisitions, validateRequisitions)
            .then(approveRequisitions, approveRequisitions);
        }

        function approveRequisitions(requisitions) {

            var requisitionsObject = {};
            requisitions.forEach(function(requisition){
                requisitionsObject[requisition.id] = requisition;
            });

            var deferred = $q.defer();

            $http.post(requisitionUrlFactory('/api/requisitions/approve'), Object.keys(requisitionsObject))
            .then(function(response){
                return deferred.resolve(requisitions);
            })
            .catch(function(response){
                if(response.status === 400){
                    // process errors
                    if(response.data.errors){
                        response.data.errors.forEach(function(error){
                            if(requisitionsObject[error.requisitionId]){
                                requisitionsObject[error.requisitionId].$error = error.errorMessage.message;
                            }
                        });
                    }

                    requisitions = _.filter(requisitions, function(requisition){
                        return requisition.$error;
                    });
                    
                    return deferred.resolve(requisitions);
                } else {
                    return deferred.reject([]);
                }
            });

            return deferred.promise;

        }

        function validateRequisitions(requisitions) {
            var successfulRequisitions = [];

            requisitions.forEach(function(requisition) {
                if(!requisitionValidator.validateRequisition(requisition)){
                    requisition.$error = messageService.get("requisitionBatchApproval.invalidRequisition");
                } else {
                    successfulRequisitions.push(requisition);
                }
            });

            if(successfulRequisitions.length < requisitions.length) {
                return $q.reject(requisitions);
            } else {
                return $q.resolve(requisitions);
            }
        }

    }

})();
