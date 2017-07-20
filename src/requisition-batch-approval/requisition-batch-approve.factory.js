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

    factory.$inject = ['$q', '$http', 'requisitionUrlFactory', 'requisitionBatchSaveFactory', 'messageService', 'MAX_INTEGER_VALUE', 'TEMPLATE_COLUMNS', 'localStorageFactory'];

    function factory($q, $http, requisitionUrlFactory, requisitionBatchSaveFactory, messageService, MAX_INTEGER_VALUE, TEMPLATE_COLUMNS, localStorageFactory) {

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
            var requisitionsObject = {},
                offlineBatchRequisitions = localStorageFactory('batchApproveRequisitions');

            requisitions.forEach(function(requisition){
                requisitionsObject[requisition.id] = requisition;
            });

            var deferred = $q.defer();

            $http.post(requisitionUrlFactory('/api/requisitions/batch/approve'), Object.keys(requisitionsObject))
            .then(function(response){

                // All requisitions are approved so remove them from batchRequisitions storage
                angular.forEach(requisitions, function(requisition) {
                    removeFromStorage(requisition, offlineBatchRequisitions);
                });

                return deferred.resolve(response.data.requisitionDtos);
            })
            .catch(function(response){
                if(response.status === 400){
                    // Process errors
                    if(response.data.requisitionErrors) {
                        response.data.requisitionErrors.forEach(function(error){
                            if(requisitionsObject[error.requisitionId]){
                                requisitionsObject[error.requisitionId].$error = error.errorMessage.message ?
                                    error.errorMessage.message : messageService.get('requisitionBatchApproval.errorApprove');
                            }
                        });
                    }

                    // Process successful requisitions
                    var successfulRequisitions = [];
                    requisitions.forEach(function(requisition){
                        if(!requisition.$error){
                            // Remove successful requisitions from batchRequisitions storage
                            removeFromStorage(requisition, offlineBatchRequisitions);
                            successfulRequisitions.push(requisition);
                        }
                    });
                    
                    return deferred.resolve(successfulRequisitions);
                } else {
                    return deferred.reject([]);
                }
            });

            return deferred.promise;

        }

        function validateRequisitions(requisitions) {
            var successfulRequisitions = [];

            requisitions.forEach(function(requisition) {
                if(!validateRequisition(requisition)){
                    requisition.$error = messageService.get("requisitionBatchApproval.invalidRequisition");
                } else {
                    successfulRequisitions.push(requisition);
                }
            });

            if(successfulRequisitions.length < requisitions.length) {
                return $q.reject(successfulRequisitions);
            } else {
                return $q.resolve(successfulRequisitions);
            }
        }

        function validateRequisition(requisition) {
            var valid = true;
            angular.forEach(requisition.requisitionLineItems, function (lineItem) {
               valid = validateApprovedQuantity(lineItem) && valid;
            });

            return valid;
        }

        function validateApprovedQuantity(lineItem) {
            var column = TEMPLATE_COLUMNS.APPROVED_QUANTITY,
                error;

            if (lineItem.skipped) return true;
            if (isEmpty(lineItem.approvedQuantity)) {
                error = messageService.get('requisitionBatchApproval.required');
            } else if (lineItem.approvedQuantity > MAX_INTEGER_VALUE) {
                error = messageService.get('requisitionBatchApproval.numberTooLarge')
            }

            return isEmpty(error);
        }

        function isEmpty(value) {
            return value === null || value === undefined || value === '';
        }

        function removeFromStorage(requisition, storage) {
            storage.removeBy('id', requisition.id);
        }
    }

})();
