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
     * @ngdoc controller
     * @name requisition-initiate.controller:RequisitionInitiateController
     *
     * @description
     * Controller responsible for actions connected with displaying available periods and
     * initiating or navigating to an existing requisition.
     */
    angular
        .module('requisition-initiate')
        .controller('RequisitionInitiateController', RequisitionInitiateController);

    RequisitionInitiateController.$inject = [
        'messageService', 'requisitionService', '$state', 'loadingModalService',
        'notificationService', 'REQUISITION_RIGHTS', 'userRightFactory', '$stateParams', 'periods'
    ];

    function RequisitionInitiateController(
        messageService, requisitionService, $state, loadingModalService, notificationService,
        REQUISITION_RIGHTS, userRightFactory, $stateParams, periods
    ) {
        var vm = this;

        vm.$onInit = onInit;
        vm.loadPeriods = loadPeriods;
        vm.initRnr = initRnr;

        /**
         * @ngdoc property
         * @propertyOf requisition-initiate.controller:RequisitionInitiateController
         * @name emergency
         * @type {Boolean}
         *
         * @description
         * Holds a boolean indicating if the currently selected requisition type is standard or emergency
         */
        vm.emergency = undefined;

        /**
         * @ngdoc property
         * @propertyOf requisition-initiate.controller:RequisitionInitiateController
         * @name periods
         * @type {List}
         *
         * @description
         * The list of all periods displayed in the table.
         */
        vm.periods = undefined;

        vm.isUpdated = false;

        /**
         * @ngdoc method
         * @methodOf requisition-initiate.controller:RequisitionInitiateController
         * @name $onInit
         *
         * @description
         * Initialization method of the RequisitionInitiateController controller.
         */
        function onInit() {
            vm.emergency = $stateParams.emergency === 'true';
            vm.periods = periods;
        }

        /**
         * @ngdoc method
         * @methodOf requisition-initiate.controller:RequisitionInitiateController
         * @name loadPeriods
         *
         * @description
         * Responsible for displaying and updating a grid, containing available periods for the
         * selected program, facility and type. It will set an error message if no periods have
         * been found for the given parameters. It will also filter out periods for which there
         * already exists a requisition with an AUTHORIZED, APPROVED, IN_APPROVAL or RELEASED
         * status.
         */
        function loadPeriods() {
            vm.isUpdated = false;
            $state.go('openlmis.requisitions.initRnr', {
                supervised: vm.isSupervised,
                program: vm.program.id,
                facility: vm.facility.id,
                emergency: vm.emergency
            }, {
                reload: true
            });
        }

        /**
         * @ngdoc method
         * @methodOf requisition-initiate.controller:RequisitionInitiateController
         * @name initRnr
         *
         * @description
         * Responsible for initiating and/or navigating to the requisition, based on the specified
         * period. If the provided period does not have a requisition associated with it, one
         * will be initiated for the currently selected facility, program, emergency status and
         * provided period. In case of a successful response, a redirect to the newly initiated
         * requisition is made. Otherwise an error about failed requisition initiate is shown. If
         * the provided period is already associated with a requisition, the function only
         * performs a redirect to that requisition.
         *
         * @param {Object} selectedPeriod a period to initiate or proceed with the requisition for
         */
        function initRnr(selectedPeriod) {
            vm.error = '';
            if (!selectedPeriod.rnrId || selectedPeriod.rnrStatus == messageService.get('requisitionInitiate.notYetStarted')) {
                loadingModalService.open();
                userRightFactory.checkRightForCurrentUser(REQUISITION_RIGHTS.REQUISITION_CREATE, vm.program.id, vm.facility.id).then(function(response) {
                    if(response) {
                        requisitionService.initiate(vm.facility.id,
                            vm.program.id,
                            selectedPeriod.id,
                            vm.emergency)
                        .then(function (data) {
                            $state.go('openlmis.requisitions.requisition.fullSupply', {
                                rnr: data.id
                            });
                        }, handleError('requisitionInitiate.couldNotInitiateRequisition'));
                    } else {
                        handleError('requisitionInitiate.noPermissionToInitiateRequisition')();
                    }
                }, handleError('requisitionInitiate.noPermissionToInitiateRequisition'));
            } else {
                $state.go('openlmis.requisitions.requisition.fullSupply', {
                    rnr: selectedPeriod.rnrId
                });
            }
        }

        function handleError(message) {
            return function() {
                vm.isUpdated = true;
                loadingModalService.close();
                notificationService.error(message);
            };
        }
    }
})();
