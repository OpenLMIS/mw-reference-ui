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

    factory.$inject = ['$q', '$http'];

    function factory($q, $http) {

        return batchApprove;

        /**
         * @ngdoc method
         * @methodOf requisition-batch-approval.requisitionBatchApprovalFactory
         * @name batchApprove
         *
         * @param {Array} requisitionObjects A list of requisition objects to approve
         *
         * @return {Promise} A promise that returns a list of errors on failure
         *
         * @description
         * Main function of factory, which takes a list of requisitionObjects
         * and tries to save then approve them all.
         * 
         */
        function batchApprove(requisitionObjects) {
            if(!Array.isArray(requisitionObjects) || requisitionObjects.length == 0){
                return $q.resolve(); //Sending an error would complicate the contract
            }

            var requisitionUUIDs = [];
            requisitionObjects.forEach(function(requisition){
                requisitionUUIDs.push(requisition.uuid);
            });

            var deferred = $q.defer();

            // HTTP Call
            deferred.resolve();

            return deferred.promise;
        }

    }

})();
