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
     * @name requisition-initiate.periodFactory
     *
     * @description
     * Responsible for parse periods and requisitions for initiate screen.
     */
    angular
        .module('requisition-initiate')
        .config(function($provide) {
            $provide.decorator('periodFactory', decorator);
        });

    decorator.$inject = ['$delegate', 'periodService', 'messageService', '$q', 'REQUISITION_STATUS'];

    function decorator($delegate, periodService, messageService, REQUISITION_STATUS) {
        var periodFactory = $delegate;

        periodFactory.get = get;

        return periodFactory;

        /**
         * @ngdoc method
         * @methodOf requisition-initiate.periodFactory
         * @name get
         *
         * @description
         * Retrieves periods for initiate from server.
         *
         * @param  {String}  programId  program UUID
         * @param  {String}  facilityId facility UUID
         * @param  {Boolean} emergency  if searching for emergency periods
         * @return {Promise}            facility promise
         */
        function get(programId, facilityId, emergency) {
            return periodService.getPeriodsForInitiate(programId, facilityId, emergency)
                .then(function(response) {
                    var periods = getPeriodGridLineItems(response, emergency);
                    angular.forEach(periods, setStatus(emergency));
                    return periods;
                });
        }

        function getPeriodGridLineItems(periods, emergency) {
            var periodGridLineItems = [];

            angular.forEach(periods, function(period, id) {
                // Malawi: check if the period is active
                if (emergency || period.isActive === true) {
                    periodGridLineItems.push(createPeriodGridItem(period, emergency, id));
                }
                // --- ends here ---
            });

            return periodGridLineItems;
        }

        function createPeriodGridItem(period, emergency, id) {
            return {
                name: period.name,
                startDate: period.startDate,
                endDate: period.endDate,
                rnrStatus: messageService.get(getRnrStatus(period, emergency, id)),
                activeForRnr: (emergency || id === 0),
                rnrId: (period.requisitionId) ? period.requisitionId : null
            };
        }

        function setStatus(emergency) {
            return function(period) {
                if (isNotStarted(period, emergency)) {
                    period.rnrStatus = messageService.get('requisitionInitiate.notYetStarted');
                }
            };
        }

        function isNotStarted(period, emergency) {
            return emergency &&
                (period.rnrStatus === REQUISITION_STATUS.AUTHORIZED ||
                period.rnrStatus === REQUISITION_STATUS.IN_APPROVAL ||
                period.rnrStatus === REQUISITION_STATUS.APPROVED ||
                period.rnrStatus === REQUISITION_STATUS.RELEASED);
        }

        function getRnrStatus(period, emergency, id) {
            return period.requisitionStatus ?
                period.requisitionStatus :
                (
                    (emergency || id === 0) ?
                        'requisitionInitiate.notYetStarted' :
                        'requisitionInitiate.previousPending'
                );
        }
    }

})();
