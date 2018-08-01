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
     * @name order-view.controller:OrderViewController
     *
     * @description
     * Responsible for managing Order View. Exposes facilities/programs to populate selects and
     * fetches data to populate grid.
     */
    angular
        .module('order-view')
        .controller('OrderViewController', controller);

    controller.$inject = [
        'supplyingFacilities', 'requestingFacilities', 'programs', 'requestingFacilityFactory',
        'loadingModalService', 'notificationService', 'fulfillmentUrlFactory', 'orders',
        'orderService', 'orderStatusFactory', 'canRetryTransfer', '$stateParams', '$filter', '$state', '$scope'
    ];

    function controller(supplyingFacilities, requestingFacilities, programs, requestingFacilityFactory,
                        loadingModalService, notificationService, fulfillmentUrlFactory, orders, orderService,
                        orderStatusFactory, canRetryTransfer, $stateParams, $filter, $state, $scope) {

        var vm = this;

        vm.$onInit = onInit;
        vm.loadOrders = loadOrders;
        vm.getPrintUrl = getPrintUrl;
        vm.getDownloadUrl = getDownloadUrl;
        vm.retryTransfer = retryTransfer;

        /**
         * @ngdoc property
         * @propertyOf order-view.controller:OrderViewController
         * @name supplyingFacilities
         * @type {Array}
         *
         * @description
         * The list of all supplying facilities available to the user.
         */
        vm.supplyingFacilities = undefined;

        /**
         * @ngdoc property
         * @propertyOf order-view.controller:OrderViewController
         * @name requestingFacilities
         * @type {Array}
         *
         * @description
         * The list of requesting facilities available to the user.
         */
        vm.requestingFacilities = undefined;

        /**
         * @ngdoc property
         * @propertyOf order-view.controller:OrderViewController
         * @name periodStartDate
         * @type {Object}
         *
         * @description
         * The beginning of the period to search for orders.
         */
        vm.periodStartDate = undefined;

        /**
         * @ngdoc property
         * @propertyOf order-view.controller:OrderViewController
         * @name periodEndDate
         * @type {Object}
         *
         * @description
         * The end of the period to search for orders.
         */
        vm.periodEndDate = undefined;

        /**
         * @ngdoc property
         * @propertyOf order-view.controller:OrderViewController
         * @name programs
         * @type {Array}
         *
         * @description
         * The list of all programs available to the user.
         */
        vm.programs = undefined;

        /**
         * @ngdoc property
         * @propertyOf order-view.controller:OrderViewController
         * @name orders
         * @type {Array}
         *
         * @description
         * Holds orders that will be displayed on screen.
         */
        vm.orders = undefined;

        /**
         * @ngdoc property
         * @propertyOf order-view.controller:OrderViewController
         * @name canRetryTransfer
         * @type {Boolean}
         *
         * @description
         * Becomes true if user has permission to retry transfer of failed order.
         */
        vm.canRetryTransfer = undefined;

        /**
         * @ngdoc property
         * @propertyOf order-view.controller:OrderViewController
         * @name orderStatuses
         * @type {Array}
         *
         * @description
         * Contains a list of possible order statuses to allow filtering.
         */
        vm.orderStatuses = undefined;

        /**
         * @ngdoc method
         * @methodOf order-view.controller:OrderViewController
         * @name $onInit
         *
         * @description
         * Initialization method called after the controller has been created. Responsible for
         * setting data to be available on the view.
         */
        function onInit() {
            vm.supplyingFacilities = supplyingFacilities;
            vm.requestingFacilities = requestingFacilities;
            vm.canRetryTransfer = canRetryTransfer;
            vm.programs = programs;
            vm.orderStatuses = orderStatusFactory.getAll();

            vm.orders = orders;

            if ($stateParams.supplyingFacilityId) {
                vm.supplyingFacility = $filter('filter')(vm.supplyingFacilities, {
                    id: $stateParams.supplyingFacilityId
                })[0];
            }

            if ($stateParams.requestingFacilityId) {
                vm.requestingFacility = $filter('filter')(vm.requestingFacilities, {
                    id: $stateParams.requestingFacilityId
                })[0];
            }

            if ($stateParams.programId) {
                vm.program = $filter('filter')(vm.programs, {
                    id: $stateParams.programId
                })[0];
            }

            if ($stateParams.periodStartDate) {
                vm.periodStartDate = $stateParams.periodStartDate;

            }

            if ($stateParams.periodEndDate) {
                vm.periodEndDate = $stateParams.periodEndDate;
            }

            if ($stateParams.status) {
                vm.status = $stateParams.status;
            }

            $scope.$watch(function() {
                return vm.supplyingFacility;
            }, function(newValue, oldValue) {
                if (newValue && hasSupplyingFacilityChange(newValue, oldValue)) {
                    loadRequestingFacilities(vm.supplyingFacility.id);
                }
                if (!newValue) {
                    vm.requestingFacilities = undefined;
                }
            }, true);
        }

        /**
         * @ngdoc method
         * @methodOf order-view.controller:OrderViewController
         * @name loadOrders
         *
         * @description
         * Retrieves the list of orders matching the selected supplying facility, requesting
         * facility and program.
         *
         * @return {Array} the list of matching orders
         */
        function loadOrders() {
            var stateParams = angular.copy($stateParams);

            stateParams.supplyingFacilityId = vm.supplyingFacility ? vm.supplyingFacility.id : null;
            stateParams.requestingFacilityId = vm.requestingFacility ? vm.requestingFacility.id : null;
            stateParams.programId = vm.program ? vm.program.id : null;
            stateParams.status = vm.status ? vm.status : null;
            stateParams.periodStartDate = vm.periodStartDate ? $filter('isoDate')(vm.periodStartDate) : null;
            stateParams.periodEndDate = vm.periodEndDate ? $filter('isoDate')(vm.periodEndDate) : null;
            stateParams.sort = 'createdDate,desc';

            $state.go('openlmis.orders.view', stateParams, {
                reload: true
            });
        }

        /**
         * @ngdoc method
         * @methodOf order-view.controller:OrderViewController
         * @name getPrintUrl
         *
         * @description
         * Prepares a print URL for the given order.
         *
         * @param  {Object} order the order to prepare the URL for
         * @return {String}       the prepared URL
         */
        function getPrintUrl(order) {
            // Malawi: custom order print url
            return fulfillmentUrlFactory('/api/reports/templates/malawi/3c9d1e80-1e45-4adb-97d9-208b6fdceeec/pdf?order=' + order.id);
            // --- ends here ---
        }

        /**
         * @ngdoc method
         * @methodOf order-view.controller:OrderViewController
         * @name getDownloadUrl
         *
         * @description
         * Prepares a download URL for the given order.
         *
         * @param  {Object} order the order to prepare the URL for
         * @return {String}       the prepared URL
         */
        function getDownloadUrl(order) {
            // Malawi: custom order download url
            return fulfillmentUrlFactory('/api/reports/templates/malawi/3c9d1e80-1e45-4adb-97d9-208b6fdceeec/csv?order=' + order.id);
            // --- ends here ---
        }

        /**
         * @ngdoc method
         * @methodOf order-view.controller:OrderViewController
         * @name retryTransfer
         *
         * @description
         * For an order that failed to transfer correctly, retry the transfer of order file.
         *
         * @param  {Object} order the order to retry the transfer for
         */
        function retryTransfer(order) {
            loadingModalService.open();
            orderService.retryTransfer(order.id).then(function(response) {
                if (response.result) {
                    notificationService.success('orderView.transferComplete');
                    $state.reload();
                } else {
                    notificationService.error('orderView.transferFailed');
                }
            })
                .catch(function(error) {
                    notificationService.error(error.description);
                })
                .finally(loadingModalService.close);
        }

        function loadRequestingFacilities(supplyingFacilityId) {
            loadingModalService.open();
            requestingFacilityFactory.loadRequestingFacilities(supplyingFacilityId).then(function(facilities) {
                vm.requestingFacilities = facilities;
            })
                .finally(loadingModalService.close);
        }

        function hasSupplyingFacilityChange(newValue, oldValue) {
            return newValue.id !== $stateParams.supplyingFacilityId
                || (newValue.id === $stateParams.supplyingFacilityId &&
                    oldValue && oldValue.id !== $stateParams.supplyingFacilityId);
        }

    }

})();