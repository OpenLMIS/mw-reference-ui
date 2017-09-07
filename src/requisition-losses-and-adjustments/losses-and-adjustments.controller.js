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
     * @name requisition-losses-and-adjustments.controller:LossesAndAdjustmentsController
     *
     * @description
     * Controller for the losses and adjustments directive.
     */
    angular
        .module('requisition-losses-and-adjustments')
        .controller('LossesAndAdjustmentsController', lossesAndAdjustmentsController);

    lossesAndAdjustmentsController.$inject = [
        '$scope', '$filter', 'requisitionValidator', 'calculationFactory',
        'adjustmentsModalService'
    ];

    function lossesAndAdjustmentsController($scope, $filter,
                                            requisitionValidator, calculationFactory,
                                            adjustmentsModalService) {

        var vm = this,
            reasons;

        vm.$onInit = onInit;
        vm.showModal = showModal;

        /**
         * @ngdoc property
         * @propertyOf requisition-losses-and-adjustments.controller:LossesAndAdjustmentsController
         * @type {Object}
         * @name lineItem
         *
         * @description
         * Line item to display the calculated value of total losses and adjustments.
         */
        vm.lineItem = undefined;

        /**
         * @ngdoc method
         * @methodOf requisition-losses-and-adjustments.controller:LossesAndAdjustmentsController
         * @name $onInit
         *
         * @description
         * Initialization method of the LossesAndAdjustmentsController.
         */
        function onInit() {
            vm.lineItem = $scope.lineItem;

            var first = true;
            $scope.$watch('lineItem.totalLossesAndAdjustments', function() {
                if(first) {
                    first = false;
                    return;
                }

                vm.lineItem.updateDependentFields(
                    $scope.requisition.template.columnsMap.totalLossesAndAdjustments,
                    $scope.requisition
                );

                requisitionValidator.validateLineItem(
                    vm.lineItem,
                    $scope.requisition.template.getColumns(!vm.lineItem.$program.fullSupply),
                    $scope.requisition
                );
            });

            reasons = $scope.requisition.stockAdjustmentReasons;
        }

        /**
         * @ngdoc method
         * @methodOf requisition-losses-and-adjustments.controller:LossesAndAdjustmentsController
         * @name showModal
         *
         * @description
         * Opens Total Losses and Adjustments modal.
         */
        function showModal() {
            adjustmentsModalService.open(
                getAdjustments(vm.lineItem.stockAdjustments),
                reasons,
                'requisitionLossesAndAdjustments.lossesAndAdjustments',
                'requisitionLossesAndAdjustments.addNewLossOrAdjustment',
                vm.isDisabled,
                {
                    'requisitionLossesAndAdjustments.total': function(adjustments) {
                        return calculationFactory.totalLossesAndAdjustments(
                            getSimpleAdjustments(adjustments),
                            $scope.requisition.stockAdjustmentReasons
                        );
                    }
                }
            ).then(function(adjustments) {
                vm.lineItem.stockAdjustments = getSimpleAdjustments(adjustments);
                
                vm.lineItem.totalLossesAndAdjustments = calculationFactory.totalLossesAndAdjustments(
                    vm.lineItem.stockAdjustments,
                    $scope.requisition.stockAdjustmentReasons
                ); 
            });
        }

        function getAdjustments(simpleAdjustments) {
            var adjustments = [];

            angular.forEach(simpleAdjustments, function(simpleAdjustment) {
                adjustments.push({
                    quantity: simpleAdjustment.quantity,
                    reason: $filter('filter')(reasons, {
                        id: simpleAdjustment.reasonId
                    })[0]
                });
            });

            return adjustments;
        }

        function getSimpleAdjustments(adjustments) {
            var simpleAdjustments = [];

            angular.forEach(adjustments, function(adjustment) {
                simpleAdjustments.push({
                    reasonId: adjustment.reason.id,
                    quantity: adjustment.quantity
                });
            });

            return simpleAdjustments;
        }
    }

})();
