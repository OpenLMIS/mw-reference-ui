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

    var $rootScope, $httpBackend, requisitionService, dateUtils, confirm, q, allStatuses,
        requisitionUrlFactory, openlmisUrl, requisitionsStorage, batchRequisitionsStorage, onlineOnlyRequisitions, startDate,
        endDate, startDate1, endDate1, modifiedDate, createdDate, processingSchedule, facility,
        program, period, emergency, requisition, requisitionDto, requisitionDto2,
        requisitionToConvert, approvedProductsOffline, templateOffline, statusMessage,statusMessagesStorage;

    beforeEach(function() {
        module('requisition');

        startDate = [2016, 4, 30, 16, 21, 33];
        endDate = [2016, 4, 30, 16, 21, 33];
        startDate1 = new Date();
        endDate1 = new Date();
        modifiedDate = [2016, 4, 30, 16, 21, 33];
        createdDate = [2016, 4, 30, 16, 21, 33];
        processingSchedule = {
            modifiedDate: modifiedDate
        };
        facility = {
            id: '1',
            name: 'facility1'
        };
        program = {
            id: '1',
            name: 'program1'
        };
        period = {
            id: '1',
            startDate: startDate,
            endDate: endDate,
            processingSchedule: processingSchedule
        };
        emergency = false;
        requisition = {
            id: '1',
            name: 'requisition',
            status: 'INITIATED',
            facilityId: facility.id,
            programId: program.id,
            processingPeriod: period,
            createdDate: createdDate,
            supplyingFacility: '2',
            template: '1',
            program: {
                id: 'program-id'
            },
            facility: {
                id: 'facility-id'
            }
        };
        requisitionDto = {
            id: '2',
            name: 'requisitionDto',
            status: 'INITIATED',
            facility: facility,
            program: program,
            processingPeriod: period,
            createdDate: createdDate
        };
        requisitionDto2 = {
            id: '3',
            name: 'requisitionDto',
            status: 'INITIATED',
            facility: facility,
            program: program,
            processingPeriod: period,
            createdDate: createdDate
        };
        requisitionToConvert = {
            requisitionId: requisition.id,
            supplyingDepotId: requisition.supplyingFacility
        };
        statusMessage = {
            id: "123"
        };

        module(function($provide){
            var RequisitionSpy = jasmine.createSpy('Requisition').andReturn(requisition),
                confirmServiceMock = jasmine.createSpyObj('confirmService', ['confirm'])
                confirmServiceMock.confirm.andCallFake(function(argumentObject) {
                    return q.when(true);
                });

        	$provide.service('Requisition', function() {
                return RequisitionSpy;
            });

            $provide.service('confirmService', function() {
                return confirmServiceMock;
            });

            requisitionsStorage = jasmine.createSpyObj('requisitionsStorage', ['search', 'put', 'getBy', 'removeBy']);
            batchRequisitionsStorage = jasmine.createSpyObj('batchRequisitionsStorage', ['search', 'put', 'getBy', 'removeBy']);
            statusMessagesStorage = jasmine.createSpyObj('statusMessagesStorage', ['search', 'put', 'getBy', 'removeBy']);

            var offlineFlag = jasmine.createSpyObj('offlineRequisitions', ['getAll']);
            offlineFlag.getAll.andReturn([false]);
            onlineOnlyRequisitions = jasmine.createSpyObj('onlineOnly', ['contains']);
            templateOffline = jasmine.createSpyObj('templates', ['put']);
            approvedProducts = jasmine.createSpyObj('approvedProducts', ['put']);
            var localStorageFactorySpy = jasmine.createSpy('localStorageFactory').andCallFake(function(resourceName) {
                if (resourceName === 'offlineFlag') return offlineFlag;
                if (resourceName === 'onlineOnly') return onlineOnlyRequisitions;
                if (resourceName === 'batchApproveRequisitions') return batchRequisitionsStorage;
                if (resourceName === 'statusMessages') return statusMessagesStorage;
                return requisitionsStorage;
            });

            $provide.service('localStorageFactory', function() {
                return localStorageFactorySpy;
            });
        });

        inject(function(_$httpBackend_, _$rootScope_, _requisitionService_, _requisitionUrlFactory_,
                        openlmisUrlFactory, REQUISITION_STATUS, _dateUtils_, $q,
                        $templateCache) {

            httpBackend = _$httpBackend_;
            $rootScope = _$rootScope_;
            requisitionService = _requisitionService_;
            allStatuses = REQUISITION_STATUS.$toList();
            dateUtils = _dateUtils_;
            q = $q;
            requisitionUrlFactory = _requisitionUrlFactory_;
            openlmisUrl = openlmisUrlFactory;

            $templateCache.put('common/notification-modal.html', "something");
        });
    });

    it('should get requisition by id', function() {
        var getRequisitionUrl = '/api/requisitions/' + requisition.id;
        var getStatusMessagesUrl = '/api/requisitions/' + requisition.id + '/statusMessages';

        httpBackend.expect('GET', requisitionUrlFactory(getRequisitionUrl)).respond(200, requisition);
        httpBackend.expect('GET', requisitionUrlFactory(getStatusMessagesUrl)).respond(200, [statusMessage]);

        var data = {};
        requisitionService.get('1').then(function(response) {
            data = response;
        });

        httpBackend.flush();
        $rootScope.$apply();

        expect(data.id).toBe(requisition.id);
        expect(requisitionsStorage.put).toHaveBeenCalled();
        expect(statusMessagesStorage.put).toHaveBeenCalled();
    });

    it('should initiate requisition', function() {
        var data;

        httpBackend.when('POST', requisitionUrlFactory('/api/requisitions/initiate?emergency=' + emergency +
            '&facility=' + facility.id + '&program=' + program.id + '&suggestedPeriod=' + period.id))
        .respond(200, requisition);

        requisitionService.initiate(facility.id, program.id, period.id, emergency).then(function(response) {
            data = response;
        });

        httpBackend.flush();
        $rootScope.$apply();

        expect(angular.toJson(data)).toEqual(angular.toJson(requisition));
    });

    it('should get requisitions for convert', function() {
        var data,
            requisitionCopy = formatDatesInRequisition(angular.copy(requisitionDto)),
            params = {
                filterBy: 'filterBy',
                filterValue: 'filterValue',
                sortBy: 'sortBy',
                descending: 'true'
            };

        httpBackend.when('GET', requisitionUrlFactory('/api/requisitions/requisitionsForConvert?descending=' + params.descending +
            '&filterBy=' + params.filterBy + '&filterValue=' + params.filterValue + '&sortBy=' + params.sortBy))
        .respond(200, {content: [{requisition: requisitionDto}]});

        requisitionService.forConvert(params).then(function(response) {
            data = response;
        });

        httpBackend.flush();
        $rootScope.$apply();

        expect(angular.toJson(data)).toEqual(angular.toJson({
            content: [{
                requisition: requisitionCopy
            }]
        }));
    });

    it('should convert requisitions', function() {
        var callback = jasmine.createSpy();

        httpBackend.when('POST', requisitionUrlFactory('/api/requisitions/convertToOrder'))
        .respond(function(method, url, data){
          if(!angular.equals(data, angular.toJson([requisitionToConvert]))){
            return [404];
          } else {
            return [200, angular.toJson(requisition)];
          }
        });

        requisitionService.convertToOrder([{requisition: requisition}]).then(callback);

        $rootScope.$apply();
        httpBackend.flush();
        $rootScope.$apply();

        expect(callback).toHaveBeenCalled();
        expect(requisitionsStorage.removeBy).toHaveBeenCalledWith('id', '1');
    });

    it('should search requisitions with all params', function() {
        var data,
            params = {
                facility: facility.id,
                program: program.id,
                initiatedDateFrom: startDate1.toISOString(),
                initiatedDateTo: endDate1.toISOString(),
                requisitionStatus: [allStatuses[0].label, allStatuses[1].label],
                emergency: true
            },
            requisitionCopy = formatDatesInRequisition(angular.copy(requisitionDto));

        httpBackend.when('GET', requisitionUrlFactory('/api/requisitions/search?initiatedDateFrom=' + startDate1.toISOString() +
            '&initiatedDateTo=' + endDate1.toISOString() + '&emergency=' + params.emergency +
            '&facility=' + facility.id + '&program=' + program.id +
            '&requisitionStatus=' + allStatuses[0].label + '&requisitionStatus=' + allStatuses[1].label))
        .respond(200, {content: [requisitionDto]});

        requisitionsStorage.getBy.andReturn(false);

        requisitionService.search(false, params).then(function(response) {
            data = response;
        }, function(response) {
        });

        httpBackend.flush();
        $rootScope.$apply();

        expect(angular.toJson(data)).toEqual(angular.toJson({
            content: [
                requisitionCopy
            ]
        }));
    });

    it('should search requisitions only with facility paramter', function() {
        var data,
            requisitionCopy = formatDatesInRequisition(angular.copy(requisitionDto2)),
            params = {
                facility: facility.id
            };

        httpBackend.when('GET', requisitionUrlFactory('/api/requisitions/search?facility=' + facility.id))
        .respond(200, {content: [requisitionDto2]});

        requisitionsStorage.getBy.andReturn(false);

        requisitionService.search(false, params).then(function(response) {
            data = response;
        });

        httpBackend.flush();
        $rootScope.$apply();

        expect(angular.toJson(data)).toEqual(angular.toJson({
            content: [
                requisitionCopy
            ]
        }));
    });

    it('should search requisitions offline', function() {
        var data,
            params = {
                facility: facility.id,
                page: 0,
                size: 10
            };

        requisitionsStorage.search.andReturn([requisitionDto2]);

        requisitionService.search(true, params).then(function(response) {
            data = response;
        });

        $rootScope.$apply();

        expect(angular.toJson(data)).toEqual(angular.toJson({
            content: [requisitionDto2],
            number: 0,
            totalElements: 1,
            size: 10
        }));
        expect(requisitionsStorage.search).toHaveBeenCalledWith(params, 'requisitionSearch');
    });

    it('should count batch requisitions in search total elements if showBatchRequisitions is true', function() {
        var data,
            params = {
                showBatchRequisitions: true,
                program: program.id,
                page: 0,
                size: 10
            };

        requisitionsStorage.search.andReturn([requisitionDto]);
        batchRequisitionsStorage.search.andReturn([requisitionDto, requisitionDto2]);

        requisitionService.search(true, params).then(function(response) {
            data = response;
        });

        $rootScope.$apply();

        expect(angular.toJson(data)).toEqual(angular.toJson({
            content: [requisitionDto, requisitionDto2],
            number: 0,
            totalElements: 2,
            size: 10
        }));
        expect(batchRequisitionsStorage.search).toHaveBeenCalledWith(params.program, 'requisitionSearch');
    });

    it('should not count batch requisitions in search total elements if showBatchRequisitions is false', function() {
        var data,
            params = {
                showBatchRequisitions: false,
                program: program.id,
                page: 0,
                size: 10
            };

        requisitionsStorage.search.andReturn([requisitionDto]);
        batchRequisitionsStorage.search.andReturn([requisitionDto, requisitionDto2]);

        requisitionService.search(true, params).then(function(response) {
            data = response;
        });

        $rootScope.$apply();

        expect(angular.toJson(data)).toEqual(angular.toJson({
            content: [requisitionDto],
            number: 0,
            totalElements: 1,
            size: 10
        }));
        expect(batchRequisitionsStorage.search).not.toHaveBeenCalled();
    });

    describe('transformRequisition', function() {

        it('should not require createdDate to be set', function() {
            var expected, data;

            requisition.createdDate = null;

            httpBackend.when(
                'GET', requisitionUrlFactory('/api/requisitions/search?facility=' + facility.id)
            ).respond(200, {
                content: [
                    requisition
                ]
            });

            requisitionService.search(false, {
                facility: facility.id
            }).then(function(response) {
                data = response;
            });

            httpBackend.flush();
            $rootScope.$apply();

            expect(data.content[0].createdDate).toEqual(null);
        });

        it('should not require processingSchedule to be set', function() {
            var expected, data;

            requisition.processingPeriod.processingSchedule = null;

            httpBackend.when(
                'GET', requisitionUrlFactory('/api/requisitions/search?facility=' + facility.id)
            ).respond(200, {
                content: [
                    requisition
                ]
            });

            requisitionService.search(false, {
                facility: facility.id
            }).then(function(response) {
                data = response;
            });

            httpBackend.flush();
            $rootScope.$apply();

            expect(data.content[0].processingPeriod.processingSchedule).toEqual(null);
        });

        it('will mark the offline version of the requisition as $outdated, if modifiedDates do not match', function(){
            var offlineRequisition = {
                id: '1',
                modifiedDate: [2016, 4, 30, 16, 21, 33]
            };
            requisitionsStorage.getBy.andReturn(offlineRequisition);

            requisition.modifiedDate = [2016, 4, 30, 16, 21, 33];

            httpBackend.when('GET',
                requisitionUrlFactory('/api/requisitions/search')
            ).respond(200, {
                content: [
                    requisition
                ]
            });

            requisitionService.search();
            httpBackend.flush();
            $rootScope.$apply();

            expect(requisitionsStorage.getBy).toHaveBeenCalled();
            expect(offlineRequisition.$outdated).toBeUndefined();

            requisition.modifiedDate = [2000, 9, 1, 1, 1, 1];

            requisitionService.search();
            httpBackend.flush();
            $rootScope.$apply();

            expect(offlineRequisition.$outdated).toBe(true);

            // The offline requisition should have been updated twice (once as $outdated, and once not)
            expect(requisitionsStorage.put.calls.length).toBe(2);
        });

        it('will put requisition to the batch requisitions storage if modifiedDates do not match', function(){
            requisition.modifiedDate = [2016, 4, 30, 16, 21, 33];

            batchRequisitionsStorage.getBy.andReturn(requisition);

            httpBackend.when('GET',
                requisitionUrlFactory('/api/requisitions/search')
            ).respond(200, {
                content: [
                    requisition
                ]
            });

            requisitionService.search();
            httpBackend.flush();
            $rootScope.$apply();

            expect(batchRequisitionsStorage.put).toHaveBeenCalled();
            expect(requisitionsStorage.put).not.toHaveBeenCalled();
        });

        it('will put requisition to the requisitions storage if modifiedDates do not match', function(){
            requisition.modifiedDate = [2016, 4, 30, 16, 21, 33];

            requisitionsStorage.getBy.andReturn(requisition);

            httpBackend.when('GET',
                requisitionUrlFactory('/api/requisitions/search')
            ).respond(200, {
                content: [
                    requisition
                ]
            });

            requisitionService.search();
            httpBackend.flush();
            $rootScope.$apply();

            expect(requisitionsStorage.put).toHaveBeenCalled();
            expect(batchRequisitionsStorage.put).not.toHaveBeenCalled();
        });

        it('will set requisition as available offline if was found the batch requisitions storage', function(){
            batchRequisitionsStorage.getBy.andReturn(requisition);

            var data = {};

            httpBackend.when('GET',
                requisitionUrlFactory('/api/requisitions/search')
            ).respond(200, {
                content: [
                    requisition
                ]
            });

            requisitionService.search().then(function(response) {
                data = response;
            });

            httpBackend.flush();
            $rootScope.$apply();

            expect(data.content[0].$availableOffline).toBe(true);
        });

        it('will set requisition as available offline if was found the requisitions storage', function(){
            requisitionsStorage.getBy.andReturn(requisition);

            var data = {};

            httpBackend.when('GET',
                requisitionUrlFactory('/api/requisitions/search')
            ).respond(200, {
                content: [
                    requisition
                ]
            });

            requisitionService.search().then(function(response) {
                data = response;
            });

            httpBackend.flush();
            $rootScope.$apply();

            expect(data.content[0].$availableOffline).toBe(true);
        });

        it('will not set requisition as available offline if was not found in any storage', function(){
            var data = {};

            httpBackend.when('GET',
                requisitionUrlFactory('/api/requisitions/search')
            ).respond(200, {
                content: [
                    requisition
                ]
            });

            requisitionService.search().then(function(response) {
                data = response;
            });

            httpBackend.flush();
            $rootScope.$apply();

            expect(requisitionsStorage.getBy).toHaveBeenCalled();
            expect(batchRequisitionsStorage.getBy).toHaveBeenCalled();
            expect(data.content[0].$availableOffline).toBe(undefined);
        });

    });

    function formatDatesInRequisition(requisition) {
        requisition.processingPeriod.processingSchedule.modifiedDate = dateUtils.toDate(requisition.processingPeriod.processingSchedule.modifiedDate);
        requisition.processingPeriod.endDate = dateUtils.toDate(requisition.processingPeriod.endDate);
        requisition.processingPeriod.startDate = dateUtils.toDate(requisition.processingPeriod.startDate);
        requisition.createdDate = dateUtils.toDate(requisition.createdDate);
        return requisition;
    }

});
