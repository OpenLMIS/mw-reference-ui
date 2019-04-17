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

describe('OrderViewController', function() {

    beforeEach(function() {
        module('order-view');
        module('referencedata-facility');
        module('referencedata-program');

        var ProgramDataBuilder, FacilityDataBuilder;
        inject(function($injector) {
            this.$controller = $injector.get('$controller');
            this.$stateParams = $injector.get('$stateParams');
            this.$q = $injector.get('$q');
            this.$state = $injector.get('$state');
            this.$rootScope = $injector.get('$rootScope');
            this.scope = this.$rootScope.$new();
            this.requestingFacilityFactory = $injector.get('requestingFacilityFactory');
            this.BasicOrderResponseDataBuilder = $injector.get('BasicOrderResponseDataBuilder');
            ProgramDataBuilder = $injector.get('ProgramDataBuilder');
            FacilityDataBuilder = $injector.get('FacilityDataBuilder');
            this.orderService = $injector.get('orderService');
            this.notificationService = $injector.get('notificationService');
            this.loadingModalService = $injector.get('loadingModalService');
            this.ORDER_STATUS = $injector.get('ORDER_STATUS');
            this.orderStatusFactory = $injector.get('orderStatusFactory');
        });

        this.supplyingFacilities = [
            new FacilityDataBuilder().withId('facility-one')
                .build(),
            new FacilityDataBuilder().withId('facility-two')
                .build()
        ];

        this.requestingFacilities = [
            new FacilityDataBuilder().withId('facility-three')
                .build(),
            new FacilityDataBuilder().withId('facility-four')
                .build(),
            new FacilityDataBuilder().withId('facility-five')
                .build()
        ];

        this.programs = [
            new ProgramDataBuilder().withId('program-one')
                .build()
        ];

        this.orders = [
            new this.BasicOrderResponseDataBuilder()
                .withStatus(this.ORDER_STATUS.ORDERED)
                .withId('order-one')
                .build(),
            new this.BasicOrderResponseDataBuilder()
                .withStatus(this.ORDER_STATUS.FULFILLING)
                .withId('order-two')
                .build()
        ];
        this.canRetryTransfer = true;

        this.initController = initController;
        this.orderStatuses = this.orderStatusFactory.getAll();
    });

    describe('initialization', function() {

        beforeEach(function() {
            this.vm = this.$controller('OrderViewController', {
                supplyingFacilities: this.supplyingFacilities,
                requestingFacilities: this.requestingFacilities,
                programs: this.programs,
                orders: this.orders,
                canRetryTransfer: this.canRetryTransfer,
                notificationService: this.notificationService,
                loadingModalService: this.loadingModalService,
                orderStatusFactory: this.orderStatusFactory,
                $scope: this.scope
            });

            spyOn(this.scope, '$watch').andCallThrough();
            var vm = this.vm,
                requestingFacilities = this.requestingFacilities,
                $q = this.$q;
            spyOn(this.requestingFacilityFactory, 'loadRequestingFacilities')
                .andCallFake(function(supplyingFacilityId) {
                    if (supplyingFacilityId === 'facility-one') {
                        vm.requestingFacilities = [requestingFacilities[0], requestingFacilities[1]];
                        return $q.when([requestingFacilities[0], requestingFacilities[1]]);
                    }
                    vm.requestingFacilities = [requestingFacilities[2]];
                    return $q.when([requestingFacilities[2]]);

                });
        });

        it('should expose supplying facilities', function() {
            this.vm.$onInit();

            expect(this.vm.supplyingFacilities).toEqual(this.supplyingFacilities);
        });

        it('should expose requesting facilities', function() {
            this.vm.$onInit();

            expect(this.vm.requestingFacilities).toEqual(this.requestingFacilities);
        });

        it('should expose this.programs', function() {
            this.vm.$onInit();

            expect(this.vm.programs).toEqual(this.programs);
        });

        it('should set periodStartDate if period start date from was passed through the URL', function() {
            this.$stateParams.periodStartDate = '2017-01-31';

            this.vm.$onInit();

            expect(this.vm.periodStartDate).toEqual('2017-01-31');
        });

        it('should not set periodStartDate if period start date from not passed through the URL', function() {
            this.$stateParams.periodStartDate = undefined;

            this.vm.$onInit();

            expect(this.vm.periodStartDate).toBeUndefined();
        });

        it('should set periodEndDate if period end date to was passed through the URL', function() {
            this.$stateParams.periodEndDate = '2017-01-31';

            this.vm.$onInit();

            expect(this.vm.periodEndDate).toEqual('2017-01-31');
        });

        it('should not set periodEndDate if period end date to not passed through the URL', function() {
            this.$stateParams.periodEndDate = undefined;

            this.vm.$onInit();

            expect(this.vm.periodEndDate).toBeUndefined();
        });

        it('should set status if it was selected', function() {
            this.$stateParams.status = this.orderStatuses[2].value;

            this.vm.$onInit();

            expect(this.vm.status).toBe(this.vm.orderStatuses[2]);
        });

        it('should call watch', function() {
            this.vm.$onInit();

            this.vm.supplyingFacility = this.supplyingFacilities[0];
            this.$rootScope.$apply();

            expect(this.scope.$watch).toHaveBeenCalled();
            expect(this.vm.requestingFacilities).toEqual([this.requestingFacilities[0], this.requestingFacilities[1]]);
            expect(this.requestingFacilityFactory.loadRequestingFacilities)
                .toHaveBeenCalledWith(this.supplyingFacilities[0].id);

            this.vm.supplyingFacility = this.supplyingFacilities[1];
            this.$rootScope.$apply();

            expect(this.scope.$watch).toHaveBeenCalled();
            expect(this.vm.requestingFacilities).toEqual([this.requestingFacilities[2]]);
            expect(this.requestingFacilityFactory.loadRequestingFacilities)
                .toHaveBeenCalledWith(this.supplyingFacilities[1].id);
        });

    });

    describe('loadOrders', function() {

        beforeEach(function() {
            this.initController();
            this.vm.$onInit();
            spyOn(this.$state, 'go').andReturn();
        });

        it('should set program', function() {
            this.vm.program = {
                id: 'program-one'
            };

            this.vm.loadOrders();

            expect(this.$state.go).toHaveBeenCalledWith('openlmis.orders.view', {
                supplyingFacilityId: null,
                requestingFacilityId: null,
                programId: this.vm.program.id,
                status: null,
                periodStartDate: null,
                periodEndDate: null,
                sort: 'createdDate,desc'
            }, {
                reload: true
            });
        });

        it('should set supplying facility', function() {
            this.vm.supplyingFacility = {
                id: 'facility-one'
            };

            this.vm.loadOrders();

            expect(this.$state.go).toHaveBeenCalledWith('openlmis.orders.view', {
                supplyingFacilityId: this.vm.supplyingFacility.id,
                programId: null,
                requestingFacilityId: null,
                status: null,
                periodStartDate: null,
                periodEndDate: null,
                sort: 'createdDate,desc'
            }, {
                reload: true
            });
        });

        it('should set requesting facility', function() {
            this.vm.requestingFacility = {
                id: 'facility-one'
            };

            this.vm.loadOrders();

            expect(this.$state.go).toHaveBeenCalledWith('openlmis.orders.view', {
                supplyingFacilityId: null,
                programId: null,
                requestingFacilityId: this.vm.requestingFacility.id,
                status: null,
                periodStartDate: null,
                periodEndDate: null,
                sort: 'createdDate,desc'
            }, {
                reload: true
            });
        });

        it('should set periodStartDate', function() {
            this.vm.periodStartDate = new Date('2017-01-31T23:00:00.000Z');

            this.vm.loadOrders();

            expect(this.$state.go).toHaveBeenCalledWith('openlmis.orders.view', {
                supplyingFacilityId: null,
                programId: null,
                requestingFacilityId: null,
                status: null,
                periodStartDate: '2017-01-31',
                periodEndDate: null,
                sort: 'createdDate,desc'
            }, {
                reload: true
            });
        });

        it('should set periodEndDate', function() {
            this.vm.periodEndDate = new Date('2017-01-31T23:00:00.000Z');

            this.vm.loadOrders();

            expect(this.$state.go).toHaveBeenCalledWith('openlmis.orders.view', {
                supplyingFacilityId: null,
                programId: null,
                requestingFacilityId: null,
                status: null,
                periodStartDate: null,
                periodEndDate: '2017-01-31',
                sort: 'createdDate,desc'
            }, {
                reload: true
            });
        });

        it('should set status', function() {
            this.vm.status = this.vm.orderStatuses[1];

            this.vm.loadOrders();

            expect(this.$state.go).toHaveBeenCalledWith('openlmis.orders.view', {
                supplyingFacilityId: null,
                programId: null,
                requestingFacilityId: null,
                status: this.vm.orderStatuses[1].value,
                periodStartDate: null,
                periodEndDate: null,
                sort: 'createdDate,desc'
            }, {
                reload: true
            });
        });

        it('should reload state', function() {
            this.vm.loadOrders();

            expect(this.$state.go).toHaveBeenCalled();
        });

    });

    describe('getPrintUrl', function() {

        beforeEach(function() {
            this.fulfillmentUrlFactoryMock = jasmine.createSpy();
            this.fulfillmentUrlFactoryMock.andCallFake(function(url) {
                return 'http://some.url' + url;
            });

            this.vm = this.$controller('OrderViewController', {
                supplyingFacilities: this.supplyingFacilities,
                requestingFacilities: this.requestingFacilities,
                programs: this.programs,
                orders: this.orders,
                canRetryTransfer: this.canRetryTransfer,
                fulfillmentUrlFactory: this.fulfillmentUrlFactoryMock,
                orderStatusFactory: this.orderStatusFactory,
                $scope: this.scope
            });
        });

        it('should prepare print URL correctly', function() {
            // Malawi: custom order print url
            expect(this.vm.getPrintUrl(this.orders[0]))
                .toEqual('http://some.url/api/reports/templates/malawi/3c9d1e80-1e45-4adb-97d9-208b6fdceeec/pdf?order=order-one');
            // --- ends here ---
        });
    });

    describe('getDownloadUrl', function() {

        beforeEach(function() {
            this.fulfillmentUrlFactoryMock = jasmine.createSpy();
            this.fulfillmentUrlFactoryMock.andCallFake(function(url) {
                return 'http://some.url' + url;
            });

            this.vm = this.$controller('OrderViewController', {
                supplyingFacilities: this.supplyingFacilities,
                requestingFacilities: this.requestingFacilities,
                programs: this.programs,
                orders: this.orders,
                fulfillmentUrlFactory: this.fulfillmentUrlFactoryMock,
                canRetryTransfer: this.canRetryTransfer,
                orderStatusFactory: this.orderStatusFactory,
                $scope: this.scope
            });
        });

        it('should prepare download URL correctly', function() {
            // Malawi: custom order download url
            expect(this.vm.getDownloadUrl(this.orders[1]))
                .toEqual('http://some.url/api/reports/templates/malawi/3c9d1e80-1e45-4adb-97d9-208b6fdceeec/csv?order=order-two');
            // --- ends here ---
        });
    });

    describe('retryTransfer', function() {
        beforeEach(function() {
            this.retryTransferDeferred = this.$q.defer();
            spyOn(this.loadingModalService, 'open').andReturn();
            spyOn(this.loadingModalService, 'close').andReturn();
            spyOn(this.notificationService, 'error').andReturn();
            spyOn(this.notificationService, 'success').andReturn();
            spyOn(this.orderService, 'retryTransfer').andReturn(this.retryTransferDeferred.promise);

            this.vm = this.$controller('OrderViewController', {
                supplyingFacilities: this.supplyingFacilities,
                requestingFacilities: this.requestingFacilities,
                programs: this.programs,
                orders: this.orders,
                canRetryTransfer: this.canRetryTransfer,
                orderService: this.orderService,
                notificationService: this.notificationService,
                loadingModalService: this.loadingModalService,
                fulfillmentUrlFactory: this.fulfillmentUrlFactoryMock,
                orderStatusFactory: this.orderStatusFactory,
                $scope: this.scope
            });
            this.order = new this.BasicOrderResponseDataBuilder()
                .withStatus(this.ORDER_STATUS.TRANSFER_FAILED)
                .withId('order-one')
                .build();
        });

        it('should call retry transfer service', function() {
            this.vm.retryTransfer(this.order);

            expect(this.orderService.retryTransfer).toHaveBeenCalledWith(this.order.id);
        });

        it('should show successful message when transfer is complete', function() {
            this.vm.retryTransfer(this.order);
            this.retryTransferDeferred.resolve({
                result: true
            });
            this.$rootScope.$apply();

            expect(this.notificationService.success).toHaveBeenCalledWith('orderView.transferComplete');
        });

        it('should show error message when server responded with OK but transfer was not complete', function() {
            this.vm.retryTransfer(this.order);
            this.retryTransferDeferred.resolve({
                result: false
            });
            this.$rootScope.$apply();

            expect(this.notificationService.error).toHaveBeenCalledWith('orderView.transferFailed');
        });

        it('should show error message when server responded with error message', function() {
            this.vm.retryTransfer(this.order);
            this.retryTransferDeferred.reject({
                description: 'some-other-error'
            });
            this.$rootScope.$apply();

            expect(this.notificationService.error).toHaveBeenCalledWith('some-other-error');
        });
    });

    function initController() {
        this.vm = this.$controller('OrderViewController', {
            supplyingFacilities: this.supplyingFacilities,
            requestingFacilities: this.requestingFacilities,
            programs: this.programs,
            orders: this.orders,
            canRetryTransfer: this.canRetryTransfer,
            notificationService: this.notificationService,
            loadingModalService: this.loadingModalService,
            orderService: this.orderService,
            orderStatusFactory: this.orderStatusFactory,
            $scope: this.scope
        });
        this.vm.$onInit();
    }
});
