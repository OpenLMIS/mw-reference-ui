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

describe('requisitionService', function() {

    beforeEach(function() {
        module('requisition');
        module('referencedata-facility-type-approved-product');

        var context = this;
        module(function($provide) {

            $provide.service('Requisition', function() {
                return function(requisition) {
                    return requisition;
                };
            });

            context.statusMessagesStorage = jasmine
                .createSpyObj('statusMessagesStorage', ['search', 'put', 'getBy', 'removeBy']);

            var offlineFlag = jasmine.createSpyObj('offlineRequisitions', ['getAll']);
            offlineFlag.getAll.andReturn([false]);
            context.onlineOnlyRequisitions = jasmine.createSpyObj('onlineOnly', ['contains']);

            $provide.service('localStorageFactory', function() {
                return jasmine.createSpy('localStorageFactory').andCallFake(function(resourceName) {
                    if (resourceName === 'offlineFlag') {
                        return offlineFlag;
                    }
                    if (resourceName === 'onlineOnly') {
                        return context.onlineOnlyRequisitions;
                    }
                    if (resourceName === 'statusMessages') {
                        return context.statusMessagesStorage;
                    }
                });
            });
        });

        inject(function($injector) {
            this.FacilityDataBuilder = $injector.get('FacilityDataBuilder');
            this.ProgramDataBuilder = $injector.get('ProgramDataBuilder');
            this.PeriodDataBuilder = $injector.get('PeriodDataBuilder');
            this.RequisitionDataBuilder = $injector.get('RequisitionDataBuilder');
            this.StockAdjustmentReasonDataBuilder = $injector.get('StockAdjustmentReasonDataBuilder');
            this.RequisitionLineItemV2DataBuilder = $injector.get('RequisitionLineItemV2DataBuilder');
            this.RequisitionLineItemDataBuilder = $injector.get('RequisitionLineItemDataBuilder');
            this.OrderableDataBuilder = $injector.get('OrderableDataBuilder');
            this.FacilityTypeApprovedProductDataBuilder = $injector.get('FacilityTypeApprovedProductDataBuilder');
            this.VersionObjectReferenceDataBuilder =  $injector.get('VersionObjectReferenceDataBuilder');
            this.ProgramOrderableDataBuilder =  $injector.get('ProgramOrderableDataBuilder');

            this.$httpBackend = $injector.get('$httpBackend');
            this.$rootScope = $injector.get('$rootScope');
            this.requisitionService = $injector.get('requisitionService');
            this.allStatuses = $injector.get('REQUISITION_STATUS').$toList();
            this.dateUtils = $injector.get('dateUtils');
            this.requisitionUrlFactory = $injector.get('requisitionUrlFactory');
            this.offlineService = $injector.get('offlineService');
            this.$templateCache = $injector.get('$templateCache');
            this.PageDataBuilder = $injector.get('PageDataBuilder');
            this.requisitionCacheService = $injector.get('requisitionCacheService');
            this.$q = $injector.get('$q');
            this.OrderableResource = $injector.get('OrderableResource');
            this.FacilityTypeApprovedProductResource = $injector.get('FacilityTypeApprovedProductResource');
            this.periodService = $injector.get('periodService');
            // MW-949: Added entire facility object to requisition
            this.facilityService = $injector.get('facilityService');
            // MW-949: ends here
        });

        this.formatDatesInRequisition = formatDatesInRequisition;

        this.startDate = [2016, 4, 30, 16, 21, 33];
        this.startDate1 = new Date();

        this.endDate = [2016, 4, 30, 16, 21, 33];
        this.endDate1 = new Date();

        this.modifiedDate = [2016, 4, 30, 16, 21, 33];

        this.createdDate = [2016, 4, 30, 16, 21, 33];
        this.createdDate2 = [2016, 10, 30, 16, 21, 33];

        this.facility = new this.FacilityDataBuilder().build();

        this.program = new this.ProgramDataBuilder().build();

        this.period = new this.PeriodDataBuilder()
            .withStartDate(this.startDate)
            .withEndDate(this.endDate)
            .build();

        this.emergency = false;

        this.reasonNotHidden = new this.StockAdjustmentReasonDataBuilder().build();
        this.reasonHidden = new this.StockAdjustmentReasonDataBuilder().buildHidden();
        this.reasonWithoutHidden = new this.StockAdjustmentReasonDataBuilder()
            .withHidden(undefined)
            .build();

        this.availableProductsIdentities = [
            new this.VersionObjectReferenceDataBuilder()
                .build(),
            new this.VersionObjectReferenceDataBuilder()
                .build(),
            new this.VersionObjectReferenceDataBuilder()
                .build(),
            new this.VersionObjectReferenceDataBuilder()
                .build()
        ];

        this.lineItems = [
            new this.RequisitionLineItemV2DataBuilder()
                .fullSupplyForProgram(this.program)
                .buildJson(),
            new this.RequisitionLineItemV2DataBuilder()
                .fullSupplyForProgram(this.program)
                .buildJson()
        ];

        this.programs = [
            new this.ProgramOrderableDataBuilder()
                .withFullSupply()
                .buildJson(),
            new this.ProgramOrderableDataBuilder()
                .buildJson()
        ];

        this.orderables = [
            new this.OrderableDataBuilder()
                .withId(this.availableProductsIdentities[0].id)
                .withVersionNumber(this.availableProductsIdentities[0].versionNumber)
                .withPrograms([this.programs[0]])
                .buildJson(),
            new this.OrderableDataBuilder()
                .withId(this.availableProductsIdentities[0].id)
                .withVersionNumber(this.availableProductsIdentities[0].versionNumber)
                .withPrograms([this.programs[0]])
                .buildJson(),
            new this.OrderableDataBuilder()
                .withId(this.availableProductsIdentities[0].id)
                .withVersionNumber(this.availableProductsIdentities[0].versionNumber)
                .withPrograms([this.programs[1]])
                .buildJson(),
            new this.OrderableDataBuilder()
                .withId(this.availableProductsIdentities[0].id)
                .withVersionNumber(this.availableProductsIdentities[0].versionNumber)
                .withPrograms([this.programs[1]])
                .buildJson()
        ];

        this.approvedProducts = [
            new this.FacilityTypeApprovedProductDataBuilder()
                .withOrderable(this.lineItems[0].orderable)
                .buildJson(),
            new this.FacilityTypeApprovedProductDataBuilder()
                .withOrderable(this.lineItems[1].orderable)
                .buildJson()
        ];

        this.requisition = new this.RequisitionDataBuilder()
            .withCreatedDate(this.createdDate)
            .withProcessingPeriod(this.period)
            .withFacility(this.facility)
            .withProgram(this.program)
            .withAvailableProducts(this.availableProductsIdentities)
            .withRequisitionLineItems(this.lineItems)
            .withStockAdjustmentReasons([
                this.reasonNotHidden,
                this.reasonHidden,
                this.reasonWithoutHidden
            ])
            .buildJson();

        this.requisitionDto = new this.RequisitionDataBuilder()
            .withCreatedDate(this.createdDate)
            .withProcessingPeriod(this.period)
            .withFacility(this.facility)
            .withProgram(this.program)
            .buildJson();

        this.requisitionDto2 = new this.RequisitionDataBuilder()
            .withCreatedDate(this.createdDate)
            .withProcessingPeriod(this.period)
            .withFacility(this.facility)
            .withProgram(this.program)
            .buildJson();

        spyOn(this.offlineService, 'isOffline').andReturn(false);
        spyOn(this.requisitionCacheService, 'cacheRequisition').andReturn();
        spyOn(this.requisitionCacheService, 'cacheBatchRequisition').andReturn();
        spyOn(this.requisitionCacheService, 'getRequisition').andReturn();
        spyOn(this.requisitionCacheService, 'getBatchRequisition').andReturn();
        spyOn(this.requisitionCacheService, 'removeById').andReturn();
        spyOn(this.requisitionCacheService, 'search').andReturn();
        spyOn(this.OrderableResource.prototype, 'getByVersionIdentities');
        spyOn(this.FacilityTypeApprovedProductResource.prototype, 'getByVersionIdentities')
            .andReturn(this.approvedProducts);
        spyOn(this.periodService, 'get').andReturn(this.requisition.processingPeriod);
        // MW-949: Added entire facility object to requisition
        spyOn(this.facilityService, 'get').andReturn(this.requisition.facility);
        // MW-949: ends here

        this.OrderableResource.prototype.getByVersionIdentities.andCallFake(function(identities) {
            if (JSON.stringify(identities) === JSON.stringify(context.availableProductsIdentities)) {
                return context.orderables;
            } else if (JSON.stringify(identities) === JSON.stringify(
                convertLineItemsToIdentities(context.requisition.requisitionLineItems)
            )) {
                return context.requisition.requisitionLineItems;
            }
        });

    });

    describe('get', function() {

        var getRequisitionUrl,
            getStatusMessagesUrl,
            headers = {
                eTag: 'W/1'
            };

        beforeEach(function() {
            getStatusMessagesUrl = '/api/requisitions/' + this.requisition.id + '/statusMessages';
            getRequisitionUrl = '/api/v2/requisitions/' + this.requisition.id;
        });

        it('should return eTag for requisition', function() {
            this.$httpBackend
                .expectGET(this.requisitionUrlFactory(getRequisitionUrl))
                .respond(200, this.requisition, headers);
            this.$httpBackend
                .expectGET(this.requisitionUrlFactory(getStatusMessagesUrl))
                .respond(200, [this.statusMessage]);

            var data = {};
            this.requisitionService.get(this.requisition.id).then(function(response) {
                data = response;
            });

            this.$httpBackend.flush();
            this.$rootScope.$apply();

            expect(data.id).toBe(this.requisition.id);
            expect(data.eTag).toBe(headers['eTag']);
            expect(this.requisitionCacheService.cacheRequisition).toHaveBeenCalled();
            expect(this.statusMessagesStorage.put).toHaveBeenCalled();
        });

        it('should get requisition by id', function() {
            this.$httpBackend
                .expectGET(this.requisitionUrlFactory(getRequisitionUrl))
                .respond(200, this.requisition, headers);
            this.$httpBackend
                .expectGET(this.requisitionUrlFactory(getStatusMessagesUrl))
                .respond(200, [this.statusMessage]);

            var data = {};
            this.requisitionService.get(this.requisition.id).then(function(response) {
                data = response;
            });

            this.$httpBackend.flush();
            this.$rootScope.$apply();

            expect(data.id).toBe(this.requisition.id);
            expect(this.requisitionCacheService.cacheRequisition).toHaveBeenCalled();
            expect(this.statusMessagesStorage.put).toHaveBeenCalled();
        });

        it('should get requisition by id from offline resources', function() {
            this.offlineService.isOffline.andReturn(true);
            this.requisitionCacheService.getRequisition.andReturn(this.requisition);

            var data = {};
            this.requisitionService.get(this.requisition.id).then(function(response) {
                data = response;
            });

            this.$rootScope.$apply();

            expect(data.id).toBe(this.requisition.id);
            expect(this.requisitionCacheService.cacheRequisition).not.toHaveBeenCalled();
            expect(this.statusMessagesStorage.put).not.toHaveBeenCalled();
            expect(this.requisitionCacheService.getRequisition).toHaveBeenCalledWith(this.requisition.id);
        });

        it('should filter out hidden reasons', function() {
            this.$httpBackend
                .expectGET(this.requisitionUrlFactory(getRequisitionUrl))
                .respond(200, this.requisition, headers);
            this.$httpBackend
                .expectGET(this.requisitionUrlFactory(getStatusMessagesUrl))
                .respond(200, [this.statusMessage]);

            var data = {};
            this.requisitionService.get(this.requisition.id).then(function(response) {
                data = response;
            });

            this.$httpBackend.flush();
            this.$rootScope.$apply();

            expect(data.id).toBe(this.requisition.id);
            expect(data.stockAdjustmentReasons).toEqual([this.reasonNotHidden, this.reasonWithoutHidden]);
        });

        it('should try to fetch requisition from the backend if it is not stored in the local storage', function() {
            this.offlineService.isOffline.andReturn(true);
            this.requisitionCacheService.getRequisition.andReturn(undefined);
            this.$httpBackend
                .expectGET(this.requisitionUrlFactory(getRequisitionUrl))
                .respond(418, this.requisition);

            this.requisitionService.get(this.requisition.id);
            this.$rootScope.$apply();

            expect(this.offlineService.isOffline).toHaveBeenCalled();
            expect(this.requisitionCacheService.getRequisition).toHaveBeenCalledWith(this.requisition.id);
        });

        it('should retrieve requisition from the local storage if it was modified locally', function() {
            this.$httpBackend
                .expectGET(this.requisitionUrlFactory(getRequisitionUrl))
                .respond(200, this.requisition, headers);

            this.requisition.$modified = true;
            this.requisitionCacheService.getRequisition.andReturn(this.requisition);
            this.statusMessagesStorage.search.andReturn([this.statusMessage]);

            var result;
            this.requisitionService.get(this.requisition.id)
                .then(function(response) {
                    result = response;
                });
            this.$httpBackend.flush();
            this.$rootScope.$apply();

            expect(result.id).toEqual(this.requisition.id);
        });

        //eslint-disable-next-line jasmine/missing-expect
        it('should retrieve requisition from the server if it is not modified', function() {
            this.$httpBackend
                .expectGET(this.requisitionUrlFactory(getRequisitionUrl))
                .respond(200, this.requisition, headers);
            this.$httpBackend
                .expectGET(this.requisitionUrlFactory(getStatusMessagesUrl))
                .respond(200, [this.statusMessage]);

            this.requisition.$modified = false;
            this.requisitionCacheService.getRequisition.andReturn(this.requisition);

            this.requisitionService.get(this.requisition.id);
            this.$httpBackend.flush();
            this.$rootScope.$apply();
        });

        it('should retrieve requisition from the server to check if the cached one is outdated', function() {
            this.$httpBackend
                .expectGET(this.requisitionUrlFactory(getRequisitionUrl))
                .respond(200, this.requisition, headers);

            var offlineRequisition = angular.copy(this.requisition);
            offlineRequisition.modifiedDate = [2016, 4, 30, 15, 20, 33];
            offlineRequisition.$modified = true;
            this.requisitionCacheService.getRequisition.andReturn(offlineRequisition);

            this.requisition.modifiedDate = [2016, 4, 30, 16, 21, 33];

            var result;
            this.requisitionService.get(this.requisition.id)
                .then(function(requisition) {
                    result = requisition;
                });
            this.$httpBackend.flush();
            this.$rootScope.$apply();

            expect(result.$outdated).toBe(true);
        });

        it('should mark requisition as outdated if it does not have modified date', function() {
            this.$httpBackend
                .expectGET(this.requisitionUrlFactory(getRequisitionUrl))
                .respond(200, this.requisition, headers);

            var offlineRequisition = angular.copy(this.requisition);
            offlineRequisition.$modified = true;
            this.requisitionCacheService.getRequisition.andReturn(offlineRequisition);

            this.requisition.modifiedDate = [2016, 4, 30, 16, 21, 33];

            var result;
            this.requisitionService.get(this.requisition.id)
                .then(function(requisition) {
                    result = requisition;
                });
            this.$httpBackend.flush();
            this.$rootScope.$apply();

            expect(result.$outdated).toBe(true);
        });
    });

    it('should initiate requisition', function() {
        var data;

        this.$httpBackend
            .whenPOST(this.requisitionUrlFactory(
                '/api/v2/requisitions/initiate'
                + '?emergency=' + this.emergency
                + '&facility=' + this.facility.id
                + '&program=' + this.program.id
                + '&suggestedPeriod=' + this.period.id
            ))
            .respond(200, this.requisition);

        this.requisitionService
            .initiate(this.facility.id, this.program.id, this.period.id, this.emergency)
            .then(function(response) {
                data = response;
            });

        this.$httpBackend.flush();
        this.$rootScope.$apply();

        this.requisition.$modified = true;
        this.requisition.$availableOffline = true;

        expect(angular.toJson(data.id)).toEqual(angular.toJson(this.requisition.id));
        expect(this.requisitionCacheService.cacheRequisition).toHaveBeenCalled();
        expect(data.stockAdjustmentReasons).toEqual([this.reasonNotHidden, this.reasonWithoutHidden]);
    });

    it('should get requisitions for convert', function() {
        var data,
            requisitionCopy = this.formatDatesInRequisition(angular.copy(this.requisitionDto)),
            params = {
                filterBy: 'filterBy',
                filterValue: 'filterValue',
                sortBy: 'sortBy',
                descending: 'true'
            };

        this.$httpBackend.whenGET(this.requisitionUrlFactory('/api/requisitions/requisitionsForConvert?descending=' +
            params.descending + '&filterBy=' + params.filterBy + '&filterValue=' + params.filterValue + '&sortBy=' +
            params.sortBy))

            .respond(200, {
                content: [{
                    requisition: this.requisitionDto
                }]
            });

        this.requisitionService.forConvert(params).then(function(response) {
            data = response;
        });

        this.$httpBackend.flush();
        this.$rootScope.$apply();

        expect(angular.toJson(data)).toEqual(angular.toJson({
            content: [{
                requisition: requisitionCopy
            }]
        }));
    });

    it('should release a batch of requisitions with order', function() {
        var callback = jasmine.createSpy();

        this.$httpBackend.whenPOST(this.requisitionUrlFactory('/api/requisitions/batchReleases'))

            .respond(function() {
                return [200, angular.toJson({})];
            });

        this.requisitionService.convertToOrder([{
            requisition: this.requisition
        }]).then(callback);

        this.$rootScope.$apply();
        this.$httpBackend.flush();
        this.$rootScope.$apply();

        expect(callback).toHaveBeenCalled();
        expect(this.requisitionCacheService.removeById).toHaveBeenCalledWith(this.requisition.id);
    });

    it('should release a batch of requisitions without order', function() {
        var callback = jasmine.createSpy();

        this.$httpBackend.whenPOST(this.requisitionUrlFactory('/api/requisitions/batchReleases'))

            .respond(function() {
                return [200, angular.toJson({})];
            });

        this.requisitionService.releaseWithoutOrder([{
            requisition: this.requisition
        }]).then(callback);

        this.$rootScope.$apply();
        this.$httpBackend.flush();
        this.$rootScope.$apply();

        expect(callback).toHaveBeenCalled();
        expect(this.requisitionCacheService.removeById).toHaveBeenCalledWith(this.requisition.id);
    });

    it('should search requisitions with all params', function() {
        var data,
            params = {
                facility: this.facility.id,
                program: this.program.id,
                initiatedDateFrom: this.startDate1.toISOString(),
                initiatedDateTo: this.endDate1.toISOString(),
                requisitionStatus: [this.allStatuses[0].label, this.allStatuses[1].label],
                emergency: true,
                sort: 'createdDate,desc'
            },
            requisitionCopy = this.formatDatesInRequisition(angular.copy(this.requisitionDto));

        this.$httpBackend
            .whenGET(
                this.requisitionUrlFactory('/api/requisitions/search'
                    + '?initiatedDateFrom=' + this.startDate1.toISOString()
                    + '&initiatedDateTo=' + this.endDate1.toISOString()
                    + '&emergency=' + params.emergency
                    + '&facility=' + this.facility.id
                    + '&program=' + this.program.id
                    + '&requisitionStatus=' + this.allStatuses[0].label
                    + '&requisitionStatus=' + this.allStatuses[1].label
                    + '&sort=' + params.sort)
            )
            .respond(200, {
                content: [this.requisitionDto]
            });

        this.requisitionCacheService.getRequisition.andReturn(false);

        this.requisitionService.search(false, params).then(function(response) {
            data = response;
        }, function() {
        });

        this.$httpBackend.flush();
        this.$rootScope.$apply();

        expect(angular.toJson(data)).toEqual(angular.toJson({
            content: [
                requisitionCopy
            ]
        }));
    });

    it('should search requisitions only with facility paramter', function() {
        var data,
            requisitionCopy = this.formatDatesInRequisition(angular.copy(this.requisitionDto2)),
            params = {
                facility: this.facility.id
            };

        this.$httpBackend.whenGET(this.requisitionUrlFactory('/api/requisitions/search?facility=' + this.facility.id))

            .respond(200, {
                content: [this.requisitionDto2]
            });

        this.requisitionCacheService.getRequisition.andReturn(false);

        this.requisitionService.search(false, params).then(function(response) {
            data = response;
        });

        this.$httpBackend.flush();
        this.$rootScope.$apply();

        expect(angular.toJson(data)).toEqual(angular.toJson({
            content: [
                requisitionCopy
            ]
        }));
    });

    it('should search requisitions offline', function() {
        var data,
            params = {
                facility: this.facility.id,
                page: 0,
                size: 10,
                sort: 'createdDate,desc'
            };

        var expected = new this.PageDataBuilder()
            .withNumberOfElements(2)
            .withTotalElements(2)
            .withContent([this.requisitionDto2, this.requisitionDto])
            .withTotalPages(1)
            .withSort('createdDate,desc')
            .build();

        this.requisitionCacheService.search.andReturn(this.$q.resolve(expected));

        this.requisitionService.search(true, params).then(function(response) {
            data = response;
        });

        this.$rootScope.$apply();

        expect(data).toEqual(expected);
        expect(this.requisitionCacheService.search).toHaveBeenCalledWith(params);
    });

    describe('transformRequisition', function() {

        it('should not require createdDate to be set', function() {
            var data;

            this.requisition.createdDate = null;

            this.$httpBackend.when(
                'GET', this.requisitionUrlFactory('/api/requisitions/search?facility=' + this.facility.id)
            )
                .respond(200, {
                    content: [
                        this.requisition
                    ]
                });

            this.requisitionService.search(false, {
                facility: this.facility.id
            }).then(function(response) {
                data = response;
            });

            this.$httpBackend.flush();
            this.$rootScope.$apply();

            expect(data.content[0].createdDate).toEqual(null);
        });

        it('should not require processingSchedule to be set', function() {
            var data;

            this.requisition.processingPeriod.processingSchedule = null;

            this.$httpBackend.when(
                'GET', this.requisitionUrlFactory('/api/requisitions/search?facility=' + this.facility.id)
            )
                .respond(200, {
                    content: [
                        this.requisition
                    ]
                });

            this.requisitionService.search(false, {
                facility: this.facility.id
            }).then(function(response) {
                data = response;
            });

            this.$httpBackend.flush();
            this.$rootScope.$apply();

            expect(data.content[0].processingPeriod.processingSchedule).toEqual(null);
        });

        it('will mark the offline version of the requisition as $outdated, if modifiedDates do not match', function() {
            var offlineRequisition = {
                id: '1',
                modifiedDate: [2016, 4, 30, 16, 21, 33]
            };
            this.requisitionCacheService.getRequisition.andReturn(offlineRequisition);

            this.requisition.modifiedDate = [2016, 4, 30, 16, 21, 33];

            this.$httpBackend.whenGET(this.requisitionUrlFactory('/api/requisitions/search'))
                .respond(200, {
                    content: [
                        this.requisition
                    ]
                });

            this.requisitionService.search();
            this.$httpBackend.flush();
            this.$rootScope.$apply();

            expect(this.requisitionCacheService.getRequisition).toHaveBeenCalled();
            expect(offlineRequisition.$outdated).toBeUndefined();

            this.requisition.modifiedDate = [2000, 9, 1, 1, 1, 1];

            this.requisitionService.search();
            this.$httpBackend.flush();
            this.$rootScope.$apply();

            expect(offlineRequisition.$outdated).toBe(true);

            // The offline requisition should have been updated twice (once as $outdated, and once not)
            expect(this.requisitionCacheService.cacheRequisition.calls.length).toBe(2);
        });

        it('will put requisition to the batch requisitions storage if modifiedDates do not match', function() {
            this.requisition.modifiedDate = [2016, 4, 30, 16, 21, 33];

            this.requisitionCacheService.getBatchRequisition.andReturn(this.requisition);

            this.$httpBackend.whenGET(this.requisitionUrlFactory('/api/requisitions/search'))
                .respond(200, {
                    content: [
                        this.requisition
                    ]
                });

            this.requisitionService.search();
            this.$httpBackend.flush();
            this.$rootScope.$apply();

            expect(this.requisitionCacheService.cacheBatchRequisition).toHaveBeenCalled();
            expect(this.requisitionCacheService.cacheRequisition).not.toHaveBeenCalled();
        });

        it('will put requisition to the requisitions storage if modifiedDates do not match', function() {
            this.requisition.modifiedDate = [2016, 4, 30, 16, 21, 33];

            this.requisitionCacheService.getRequisition.andReturn(this.requisition);

            this.$httpBackend.whenGET(this.requisitionUrlFactory('/api/requisitions/search'))
                .respond(200, {
                    content: [
                        this.requisition
                    ]
                });

            this.requisitionService.search();
            this.$httpBackend.flush();
            this.$rootScope.$apply();

            expect(this.requisitionCacheService.cacheRequisition).toHaveBeenCalled();
            expect(this.requisitionCacheService.cacheBatchRequisition).not.toHaveBeenCalled();
        });

        it('will set requisition as available offline if was found the batch requisitions storage', function() {
            this.requisitionCacheService.getBatchRequisition.andReturn(this.requisition);

            var data = {};

            this.$httpBackend.whenGET(this.requisitionUrlFactory('/api/requisitions/search'))
                .respond(200, {
                    content: [
                        this.requisition
                    ]
                });

            this.requisitionService.search().then(function(response) {
                data = response;
            });

            this.$httpBackend.flush();
            this.$rootScope.$apply();

            expect(data.content[0].$availableOffline).toBe(true);
        });

        it('will set requisition as available offline if was found the requisitions storage', function() {
            this.requisitionCacheService.getRequisition.andReturn(this.requisition);

            var data = {};

            this.$httpBackend.whenGET(this.requisitionUrlFactory('/api/requisitions/search'))
                .respond(200, {
                    content: [
                        this.requisition
                    ]
                });

            this.requisitionService.search().then(function(response) {
                data = response;
            });

            this.$httpBackend.flush();
            this.$rootScope.$apply();

            expect(data.content[0].$availableOffline).toBe(true);
        });

        it('will not set requisition as available offline if was not found in any storage', function() {
            var data = {};

            this.$httpBackend.whenGET(this.requisitionUrlFactory('/api/requisitions/search'))
                .respond(200, {
                    content: [
                        this.requisition
                    ]
                });

            this.requisitionService.search().then(function(response) {
                data = response;
            });

            this.$httpBackend.flush();
            this.$rootScope.$apply();

            expect(this.requisitionCacheService.getRequisition).toHaveBeenCalled();
            expect(this.requisitionCacheService.getBatchRequisition).toHaveBeenCalled();
            expect(data.content[0].$availableOffline).toBe(undefined);
        });

    });

    function formatDatesInRequisition(requisition) {
        requisition.processingPeriod.processingSchedule.modifiedDate = this.dateUtils
            .toDate(requisition.processingPeriod.processingSchedule.modifiedDate);
        requisition.processingPeriod.endDate = this.dateUtils.toDate(requisition.processingPeriod.endDate);
        requisition.processingPeriod.startDate = this.dateUtils.toDate(requisition.processingPeriod.startDate);
        requisition.createdDate = this.dateUtils.toDate(requisition.createdDate);
        return requisition;
    }

    function convertLineItemsToIdentities(array) {
        var convertedArray = [];

        array.forEach(function(resource) {
            convertedArray.push(resource.orderable);
        });
        return convertedArray;
    }

});