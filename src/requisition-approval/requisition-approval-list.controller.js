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
		'$controller', '$state', 'requisitions', 'messageService',
        '$stateParams', '$filter', 'programs', 'selectedProgram', 'notificationService'
	];

	function controller($controller, $state, requisitions, messageService,
                        $stateParams, $filter, programs, selectedProgram, notificationService) {

		var vm = this;

        vm.$onInit = onInit;
        vm.search = search;
		vm.openRnr = openRnr;
		vm.toggleSelectAll = toggleSelectAll;
		vm.viewSelectedRequisitions = viewSelectedRequisitions;

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
            var selectedRequisitions = [];
            angular.forEach(vm.requisitions, function(requisition) {
               if (requisition.$selected) {
                   selectedRequisitions.push(requisition);
               }
            });

            if(selectedRequisitions.length > 0) {
                $state.go('openlmis.requisitions.batchApproval', {
                    requisitions: selectedRequisitions
                });
            } else {
                notificationService.error('requisitionApproval.selectAtLeastOneRnr');
            }
        }
	}

})();
