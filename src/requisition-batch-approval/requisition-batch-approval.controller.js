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
     * @name requisition-batch-approval.controller:RequisitionBatchApprovalController
     *
     * @description
     * Controller for approval list of requisitions.
     */

    angular
        .module('requisition-batch-approval')
        .controller('RequisitionBatchApprovalController', controller);

    controller.$inject = [
        '$stateParams', 'calculationFactory', 'stateTrackerService', 'loadingModalService', 'messageService',
            'alertService', 'confirmService', 'notificationService', 'requisitionBatchSaveFactory',
            'requisitionBatchApproveFactory', 'offlineService', 'RequisitionWatcher', '$scope',
            'requisitionService', '$q'
    ];

    function controller($stateParams, calculationFactory, stateTrackerService, loadingModalService,
                        messageService, alertService, confirmService, notificationService, requisitionBatchSaveFactory,
                        requisitionBatchApproveFactory, offlineService, RequisitionWatcher, $scope, requisitionService,
                        $q) {

        var vm = this;

        vm.$onInit = onInit;
        vm.updateLineItem = updateLineItem;
        vm.revert = revert;
        vm.sync = sync;
        vm.approve = approve;
        vm.isOffline = offlineService.isOffline;

        /**
         * @ngdoc property
         * @propertyOf requisition-batch-approval.controller:RequisitionBatchApprovalController
         * @name requisitions
         * @type {Array}
         *
         * @description
         * Holds requisitions that can be approved on the view.
         */
        vm.requisitions = undefined;

        /**
         * @ngdoc property
         * @propertyOf requisition-batch-approval.controller:RequisitionBatchApprovalController
         * @name errors
         * @type {Array}
         *
         * @description
         * Keeps a list of all current errors on the view.
         */
        vm.errors = [];

        /**
         * @ngdoc property
         * @propertyOf requisition-batch-approval.controller:RequisitionBatchApprovalController
         * @name products
         * @type {Array}
         *
         * @description
         * Holds all products that should be displayed as rows in table. Each product from array contains its code and name,
         * information about total cost and quantity of product for all facilities,
         * and array of ids of requisitions that contain line item of this product.
         */
        vm.products = undefined;

        /**
         * @ngdoc property
         * @propertyOf requisition-batch-approval.controller:RequisitionBatchApprovalController
         * @name lineItems
         * @type {Array}
         *
         * @description
         * Holds all line items from all requisitions - each line item is identified by requisition id and product id.
         */
        vm.lineItems = undefined;

        /**
         * @ngdoc property
         * @propertyOf requisition-batch-approval.controller:RequisitionBatchApprovalController
         * @name totalCost
         * @type {Number}
         *
         * @description
         * Holds total cost of all products from all requisitions.
         */
        vm.totalCost = undefined;

        /**
         * @ngdoc property
         * @propertyOf requisition-batch-approval.controller:RequisitionBatchApprovalController
         * @name requisitionsCopy
         * @type {Array}
         *
         * @description
         * Holds copy of original requisitions that can be approved on the view.
         * It is used to provide 'revert' functionality.
         */
        vm.requisitionsCopy = undefined;

        /**
         * @ngdoc method
         * @methodOf requisition-batch-approval.controller:RequisitionBatchApprovalController
         * @name $onInit
         *
         * @description
         * Initialization method called after the controller has been created. Responsible for
         * setting data to be available on the view.
         */
        function onInit() {
            loadingModalService.open();
            var promises = [];

            angular.forEach($stateParams.requisitions, function (requisition) {
                promises.push(requisitionService.get(requisition.id));
            });

            $q.all(promises).then(function(requisitions) {
                prepareDataToDisplay(requisitions);
            }).finally(loadingModalService.close);
        }

        function prepareDataToDisplay(requisitions) {
            vm.totalCost = 0;
            vm.requisitions = [];

            vm.products = {};
            vm.lineItems = [];
            vm.errors = [];

            angular.forEach(requisitions, function(requisition) {
                calculateRequisitionTotalCost(requisition);
                new RequisitionWatcher($scope, requisition);
                vm.requisitions.push(requisition);

                vm.lineItems[requisition.id] = [];
                angular.forEach(requisition.requisitionLineItems, function(lineItem) {
                    if (!(lineItem.skipped)) {
                        vm.totalCost += lineItem.totalCost;
                        vm.lineItems[requisition.id][lineItem.orderable.id] = lineItem;

                        if (vm.products[lineItem.orderable.id] !== undefined) {
                            vm.products[lineItem.orderable.id].requisitions.push(requisition.id);
                            vm.products[lineItem.orderable.id].totalCost += lineItem.totalCost;
                            vm.products[lineItem.orderable.id].totalQuantity += lineItem.approvedQuantity;
                        } else {
                            vm.products[lineItem.orderable.id] = {
                                code: lineItem.orderable.productCode,
                                name: lineItem.orderable.fullProductName,
                                totalCost: lineItem.totalCost,
                                totalQuantity: lineItem.approvedQuantity,
                                requisitions: [requisition.id]
                            };
                        }
                    }
                });
            });

            vm.requisitionsCopy = angular.copy(vm.requisitions);
        }

        /**
         * @ngdoc method
         * @methodOf requisition-batch-approval.controller:RequisitionBatchApprovalController
         * @name updateLineItem
         *
         * @description
         * Updates cost of line item, total cost of each product for all facilities
         * and total cost of all products for all facilities.
         */
        function updateLineItem(lineItem, requisition) {
            lineItem.totalCost = calculationFactory['totalCost'](lineItem, requisition);
            updateTotalValues(lineItem.orderable.id);
            calculateRequisitionTotalCost(requisition);
        }

        /**
         * @ngdoc method
         * @methodOf requisition-batch-approval.controller:RequisitionBatchApprovalController
         * @name revert
         *
         * @description
         * Replaces all values manually entered by user with the values the page displayed when originally loaded.
         */
        function revert() {
            confirmService.confirm('requisitionBatchApproval.revertConfirm', 'requisitionBatchApproval.revert').then(function() {
                prepareDataToDisplay(vm.requisitionsCopy);
            });

        }

        /**
         * @ngdoc method
         * @methodOf requisition-batch-approval.controller:RequisitionBatchApprovalController
         * @name sync
         *
         * @description
         * Responsible for syncing requisitions with the server.
         */
        function sync() {
            var requisitions = vm.requisitions;
            vm.errors = [];

            loadingModalService.open();

            requisitionBatchSaveFactory(requisitions)
            .then(function(response){
                vm.requisitions = response.requisitions;
                var successMessage = messageService.get("requisitionBatchApproval.syncSuccess");
                notificationService.success(successMessage);
            }, function(response) {
                var savedRequisitions = response.requisitions;
                var errors = response.errors;

                requisitions.forEach(function(requisition){
                    var requisitionIdx = savedRequisitions.indexOf(requisition.id);
                    if( requisitionIdx == -1) { // if not successful requisition
                        var error = errors[errors.indexOf({requisitionId: requisition.id})];
                        requisition.$error = error.message;
                    } else {
                        requisition = savedRequisitions[requisitionIdx];
                    }
                });

                // Display error message....
                var errorTitle = messageService.get("requisitionBatchApproval.syncError", {
                    errorCount: errors.length
                });
                alertService.error(errorTitle);
            })
            .finally(loadingModalService.close);
        }

        /**
         * @ngdoc method
         * @methodOf requisition-batch-approval.controller:RequisitionBatchApprovalController
         * @name approve
         *
         * @description
         * Approves all displayed requisitions.
         */
        function approve() {
            var errors = [],
                // successfulRequisitions will change, don't want to accidentally change original array
                successfulRequisitions = vm.requisitions.slice(),
                erroredRequisitions = [];

            loadingModalService.open();

            requisitionBatchSaveFactory(successfulRequisitions)
            .catch(manageErrors)
            .then(function(){
                return requisitionBatchApproveFactory(successfulRequisitions);
            })
            .catch(manageErrors)
            .finally(function(){
                loadingModalService.close();

                vm.requisitions = erroredRequisitions; // updating the list of requisitions

                if(errors.length > 0){
                    // Display error messages....
                    var errorTitle = messageService.get("requisitionBatchApproval.approvalError", {
                        errorCount: errors.length
                    });
                    alertService.error(errorTitle);
                } else {
                    var successMessage = messageService.get("requisitionBatchApproval.approvalSuccess", {
                        successCount: successfulRequisitions.length
                    });
                    notificationService.success(successMessage);
                    stateTrackerService.goToPreviousState('openlmis.requisitions.approvalList');
                }
            });

            function manageErrors(newErrors){
                // add errors to total errors
                errors = errors.concat(newErrors);

                var errorIds = [];
                errors.forEach(function(error){
                    errorIds.push(error.requisitionId);
                });

                // Rebuild success/error arrays
                successfulRequisitions = [];
                erroredRequisitions = [];

                vm.requisitions.forEach(function(requisition){
                    if(errorIds.indexOf(requisition.id) >= 0) {
                        erroredRequisitions.push(requisition);
                    } else {
                        successfulRequisitions.push(requisition);
                    }
                });
            }
        }

        function calculateRequisitionTotalCost(requisition) {
            requisition.$totalCost = 0;
            angular.forEach(requisition.requisitionLineItems, function(lineItem) {
                requisition.$totalCost += lineItem.totalCost;
            });
        }

        function updateTotalValues(productId) {
            vm.products[productId].totalCost = 0;
            vm.products[productId].totalQuantity = 0;
            vm.totalCost = 0;

            angular.forEach(vm.requisitions, function(requisition) {
                angular.forEach(requisition.requisitionLineItems, function(lineItem) {
                    vm.totalCost += lineItem.totalCost;
                    if (lineItem.orderable.id === productId) {
                        vm.products[productId].totalCost += lineItem.totalCost;
                        vm.products[productId].totalQuantity += lineItem.approvedQuantity;
                    }
                });
            });
        }

        function saveToStorage(requisition) {
            requisition.$modified = false;
            requisition.$availableOffline = true;
            offlineRequisitions.put(requisition);
        }
    }

})();
