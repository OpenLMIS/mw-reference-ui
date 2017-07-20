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
     * @name requisition-approval.controller:RequisitionApprovalListController
     *
     * @description
     * Controller for approval list of requisitions.
     */

	angular
		.module('requisition-approval')
		.controller('RequisitionApprovalListController', controller);

	controller.$inject = [
		'$controller', '$state', 'requisitions',
        '$stateParams', 'programs', 'selectedProgram',
        'alertService', 'offlineService', 'localStorageFactory'
	];

	function controller($controller, $state, requisitions,
                        $stateParams, programs, selectedProgram,
                        alertService, offlineService, localStorageFactory) {

		var vm = this,
            offlineRequisitions = localStorageFactory('requisitions'),
            offlineBatchRequisitions = localStorageFactory('batchApproveRequisitions');

        vm.$onInit = onInit;
        vm.search = search;
		vm.openRnr = openRnr;
		vm.toggleSelectAll = toggleSelectAll;
		vm.viewSelectedRequisitions = viewSelectedRequisitions;
        vm.isFullRequisitionAvailable = isFullRequisitionAvailable;

        /**
         * @ngdoc property
         * @propertyOf requisition-approval.controller:RequisitionApprovalListController
         * @name requisitions
         * @type {Array}
         *
         * @description
         * Holds requisition that will be displayed on screen.
         */
		vm.requisitions = undefined;

        /**
         * @ngdoc property
         * @propertyOf requisition-approval.controller:RequisitionApprovalListController
         * @name programs
         * @type {Array}
         *
         * @description
         * List of programs to which user has access based on his role/permissions.
         */
        vm.programs = undefined;

        /**
         * @ngdoc property
         * @propertyOf requisition-approval.controller:RequisitionApprovalListController
         * @name selectedProgram
         * @type {Object}
         *
         * @description
         * The program selected by the user.
         */
        vm.selectedProgram = undefined;

        /**
         * @ngdoc property
         * @propertyOf requisition-approval.controller:RequisitionApprovalListController
         * @name offline
         * @type {Boolean}
         *
         * @description
         * Indicates if requisitions will be searched offline or online.
         */
        vm.offline = undefined;

        /**
         * @ngdoc method
         * @methodOf requisition-approval.controller:RequisitionApprovalListController
         * @name $onInit
         *
         * @description
         * Initialization method called after the controller has been created. Responsible for
         * setting data to be available on the view.
         */
        function onInit() {
            vm.requisitions = requisitions;
            vm.programs = programs;
            vm.selectedProgram = selectedProgram;
            vm.offline = $stateParams.offline === 'true' || offlineService.isOffline();
        }

        /**
         * @ngdoc method
         * @methodOf requisition-approval.controller:RequisitionApprovalListController
         * @name search
         *
         * @description
         * Searches requisitions by criteria selected in form.
         */
        function search() {
            var stateParams = angular.copy($stateParams);

            stateParams.program = vm.selectedProgram ? vm.selectedProgram.id : null;
            stateParams.offline = vm.offline;

            $state.go('openlmis.requisitions.approvalList', stateParams, {
                reload: true
            });
        }

        /**
         * @ngdoc method
         * @methodOf requisition-approval.controller:RequisitionApprovalListController
         * @name openRnr
         *
         * @description
         * Redirects to requisition page with given requisition UUID.
         */
		function openRnr(requisitionId) {
			$state.go('openlmis.requisitions.requisition.fullSupply', {
				rnr: requisitionId
			});
		}

        /**
         * @ngdoc method
         * @methodOf requisition-approval.controller:RequisitionApprovalListController
         * @name toggleSelectAll
         *
         * @description
         * Responsible for marking/unmarking all requisitions as selected.
         *
         * @param {Boolean} selectAll Determines if all requisitions should be selected or not
         */
        function toggleSelectAll(selectAll) {
            angular.forEach(vm.requisitions, function(requisition) {
                requisition.$selected = selectAll;
            });
        }

        /**
         * @ngdoc method
         * @methodOf requisition-approval.controller:RequisitionApprovalListController
         * @name viewSelectedRequisitions
         *
         * @description
         * Redirects to page for modyfing all selected requisitions.
         */
        function viewSelectedRequisitions() {
            var selectedRequisitionIds = [];
            angular.forEach(vm.requisitions, function(requisition) {
               if (requisition.$selected) {
                   selectedRequisitionIds.push(requisition.id);
               }
            });

            if(selectedRequisitionIds.length > 0) {

                angular.forEach(selectedRequisitionIds, function(id) {
                   if (!isBatchRequisitionAvailable(id)) {
                       var fullRequisitionDto = offlineRequisitions.getBy('id', id);
                       offlineBatchRequisitions.put(transformToBatchDto(angular.copy(fullRequisitionDto)));
                   }
                });

                $state.go('openlmis.requisitions.batchApproval', {
                    ids: selectedRequisitionIds.join(',')
                });
            } else {
                alertService.error('requisitionApproval.selectAtLeastOneRnr');
            }
        }

        function isFullRequisitionAvailable(requisitionId) {
            var offlineRequisition = offlineRequisitions.search({id: requisitionId});
            return !vm.offline || vm.offline && offlineRequisition.length > 0;
        }

        function isBatchRequisitionAvailable(requisitionId) {
            return !vm.offline || vm.offline && offlineBatchRequisitions.getBy('id', requisitionId);
        }

        function transformToBatchDto(requisition) {
            var batchRequisitioDto = {
                $outdated: requisition.$outdated,
                $modified: requisition.$modified,
                $availableOffline: requisition.$availableOffline,
                id: requisition.id,
                status : requisition.status,
                statusChanges: requisition.statusChanges,
                program: {
                    id: requisition.program.id,
                    code: requisition.program.code,
                    name: requisition.program.name
                },
                facility: {
                    id: requisition.facility.id,
                    code: requisition.facility.code,
                    name: requisition.facility.name
                },
                processingPeriod: {
                    id: requisition.processingPeriod.id,
                    name: requisition.processingPeriod.name,
                    startDate: requisition.processingPeriod.startDate,
                    endDate: requisition.processingPeriod.endDate
                },
                requisitionLineItems: []
            };
            angular.forEach(requisition.requisitionLineItems, function(lineItem) {
                var newLineItem = {
                    id: lineItem.id,
                    approvedQuantity: lineItem.approvedQuantity,
                    pricePerPack: lineItem.pricePerPack,
                    totalCost: lineItem.totalCost,
                    skipped: lineItem.skipped,
                    orderable: {
                        id: lineItem.orderable.id,
                        productCode: lineItem.orderable.productCode,
                        fullProductName: lineItem.orderable.fullProductName,
                        netContent: lineItem.orderable.netContent,
                        packRoundingThreshold: lineItem.orderable.packRoundingThreshold,
                        roundToZero: lineItem.orderable.roundToZero
                    }
                };
                batchRequisitioDto.requisitionLineItems.push(newLineItem);
            });

            return batchRequisitioDto;
        }

    }

})();
