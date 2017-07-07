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
/*

describe('RequisitionBatchSaveFactory', function() {

    //variables
    var requisitions, dateUtilsMock;

    //injects
    var requisitionBatchSaveFactory, $rootScope, $httpBackend, openlmisUrlFactory, $http, $q;

    beforeEach(function() {
        module('requisition-batch-approval');

        var requisitionLineItems = [
            {
                id: 1,
                skipped: false,
                approvedQuantity: 10,
                totalCost: 100,
                orderable: {
                    id: 1,
                    productCode: 'Code 1',
                    fullProductName: 'Product name 1'
                }
            },
            {
                id: 2,
                skipped: false,
                approvedQuantity: 1,
                totalCost: 10,
                orderable: {
                    id: 2,
                    productCode: 'Code 2',
                    fullProductName: 'Product name 2'
                }
            }
        ];

        var requisitionLineItems2 = [
            {
                id: 3,
                skipped: false,
                approvedQuantity: 90,
                totalCost: 10000,
                orderable: {
                    id: 1,
                    productCode: 'Code 1',
                    fullProductName: 'Product name 1'
                }
            },
            {
                id: 4,
                skipped: false,
                approvedQuantity: 50,
                totalCost: 1000,
                orderable: {
                    id: 2,
                    productCode: 'Code 2',
                    fullProductName: 'Product name 2'
                }
            }
        ];

        var template = {
            columnsMap: [
                {
                    name: 'approvedQuantity',
                    source: 'USER_INPUT',
                    $type: 'NUMERIC',
                    $display: true
                },
                {
                    name: 'totalCost',
                    source: 'CALCULATED',
                    $type: 'CURRENCY',
                    $display: true
                }
            ]
        };

        var requisition = {
            id: 1,
            status: 'AUTHORIZED',
            requisitionLineItems: requisitionLineItems,
            processingPeriod: {
                name: 'Period name 1',
                startDate: 'Start date 1',
                endDate: 'End date 1'
            },
            facility: {
                name: 'Facility name 1'
            },
            template: template
        };

        var requisition2 = {
            id: 2,
            status: 'AUTHORIZED',
            requisitionLineItems: requisitionLineItems2,
            processingPeriod: {
                name: 'Period name 2',
                startDate: 'Start date 2',
                endDate: 'End date 2'
            },
            facility: {
                name: 'Facility name 1'
            },
            template: template
        };

        requisitions = [requisition, requisition2];

        var requisitionFactoryMock = jasmine.createSpy('Requisition').andCallFake(function(requisition) {
            return requisition;
        });
        dateUtilsMock = jasmine.createSpyObj('dateUtils', ['toStringDate']);
        dateUtilsMock.toStringDate.andCallFake(function(parameter) {
            return parameter;
        });

        module(function($provide){
            $provide.factory('Requisition', function() {
                return requisitionFactoryMock;
            });
            $provide.factory('dateUtils', function() {
                return dateUtilsMock;
            });
        });

        inject(function (_requisitionBatchSaveFactory_, _$rootScope_, _$httpBackend_, _openlmisUrlFactory_, _$http_, _$q_) {
            requisitionBatchSaveFactory = _requisitionBatchSaveFactory_;
            $rootScope = _$rootScope_;
            $httpBackend = _$httpBackend_;
            openlmisUrlFactory = _openlmisUrlFactory_;
            $http = _$http_;
            $q = _$q_;
        });
    });


    it('returns an empty array if input is invalid', function() {
        var data;

        requisitionBatchSaveFactory('invalid input').catch(function(response) {
            data = response;
        });

        $rootScope.$apply();
        expect(data).toEqual([]);
    });

    it('when successful, it returns an array of all requisitions', function() {
        var data;

        $httpBackend.when('PUT', openlmisUrlFactory('/api/requisitions/save')).respond(200, {requisitionDtos: requisitions});
        requisitionBatchSaveFactory(requisitions).then(function(response) {
            data = response;
        });

        $httpBackend.flush();
        $rootScope.$apply();

        expect(data).toEqual(requisitions);
    });

    it('when errors, it returns only requisitions that were successfully saved', function() {
        var data;

        $httpBackend.when('PUT', openlmisUrlFactory('/api/requisitions/save')).respond(400, {
            requisitionDtos: [requisitions[0]],
            requisitionErrors: [{
                requisitionId: requisitions[1].id,
                errorMessage: {
                    message: 'This requisition is invalid!'
                }
            }]
        });

        requisitionBatchSaveFactory(requisitions).catch(function(response) {
            data = response;
        });

        $httpBackend.flush();
        $rootScope.$apply();

        expect(data).toEqual([requisitions[0]]);

    });

    it('it adds errors to requisitions that cannot be saved', function() {
        var data;

        $httpBackend.when('PUT', openlmisUrlFactory('/api/requisitions/save')).respond(400, {
            requisitionDtos: [requisitions[0]],
            requisitionErrors: [{
                requisitionId: requisitions[1].id,
                errorMessage: {
                    message: 'This requisition is invalid!'
                }
            }]
        });

        requisitionBatchSaveFactory(requisitions).catch(function(response) {
            data = response;
        });

        $httpBackend.flush();
        $rootScope.$apply();

        expect(requisitions[0].$error).toBe(undefined);
        expect(requisitions[1].$error).toBe('This requisition is invalid!');
    });

    it ('it sets all calculated columns to null before sending request', function() {
        spyOn($http, 'put').andReturn($q.when({requisitionDtos: requisitions}));

        requisitionBatchSaveFactory(requisitions);

        requisitions[0].requisitionLineItems[0].totalCost = null;
        requisitions[0].requisitionLineItems[1].totalCost = null;
        requisitions[1].requisitionLineItems[0].totalCost = null;
        requisitions[1].requisitionLineItems[1].totalCost = null;

        expect($http.put).toHaveBeenCalledWith(openlmisUrlFactory('/api/requisitions/save'), requisitions);
    });

    it ('it calls toStringDates method to format dates', function() {
        requisitionBatchSaveFactory(requisitions);

        expect(dateUtilsMock.toStringDate).toHaveBeenCalledWith(requisitions[0].processingPeriod.startDate);
        expect(dateUtilsMock.toStringDate).toHaveBeenCalledWith(requisitions[0].processingPeriod.endDate);
        expect(dateUtilsMock.toStringDate).toHaveBeenCalledWith(requisitions[1].processingPeriod.startDate);
        expect(dateUtilsMock.toStringDate).toHaveBeenCalledWith(requisitions[1].processingPeriod.endDate);
    })
});*/
