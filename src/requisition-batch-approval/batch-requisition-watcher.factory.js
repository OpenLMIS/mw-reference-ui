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
     * @name requisition-batch-approval.BatchRequisitionWatcher
     *
     * @description
     * Provides auto-save feature to the requisition. Notifies when changes are being made to the
     * watched requisition - this can be avoided by silencing the watcher.
     */
    angular
        .module('requisition-batch-approval')
        .factory('BatchRequisitionWatcher', factory);

    factory.$inject = ['$timeout', 'localStorageFactory'];

    function factory($timeout, localStorageFactory) {

        return BatchRequisitionWatcher;

        /**
         * @ngdoc method
         * @methodOf requisition-batch-approval.BatchRequisitionWatcher
         * @name BatchRequisitionWatcher
         *
         * @description
         * Creates batch requisition watcher for changes in requisition approved quantity.
         *
         * @param  {Scope}              scope       scope that requisition is in
         * @param  {Object}             requisition requisition to set watcher on
         * @return {BatchRequisitionWatcher}             watcher object
         */
        function BatchRequisitionWatcher(scope, requisition) {
            var watcher = this,
                storage = localStorageFactory('batchApproveRequisitions');

            addWatcher(scope, requisition, 'requisitionLineItems', watcher, storage);
        }

        function addWatcher(scope, requisition, valueToWatch, watcher, storage) {
            scope.$watch(function() {
                return requisition[valueToWatch];
            }, function(oldValue, newValue) {
                if (oldValue !== newValue) {
                    $timeout.cancel(watcher.syncTimeout);
                    watcher.syncTimeout = $timeout(function() {
                        requisition.$modified = true;
                        storage.put(requisition);
                        watcher.syncTimeout = undefined;
                    }, 500);
                }
            }, true);
        }
    }

})();
