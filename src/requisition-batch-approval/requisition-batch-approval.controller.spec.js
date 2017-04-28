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

describe('RequisitionBatchApprovalController', function () {

    //injects
    var vm, $stateParams, $rootScope, $q, confirmService, $controller, calculationFactory, confirmDeferred;

    //variables
    var requisition, products, lineItems;

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

        requisition = {
            id: 1,
            status: 'AUTHORIZED',
            requisitionLineItems: requisitionLineItems,
            processingPeriod: {
                name: 'Period name 1'
            },
            facility: {
                name: 'Facility name 1'
            }
        };

        products = {};
        products[requisitionLineItems[0].orderable.id] = {
            code: requisitionLineItems[0].orderable.productCode,
            name: requisitionLineItems[0].orderable.fullProductName,
            totalCost: requisitionLineItems[0].totalCost,
            totalQuantity: requisitionLineItems[0].approvedQuantity,
            requisitions: [requisition.id]
        };
        products[requisitionLineItems[1].orderable.id] = {
            code: requisitionLineItems[1].orderable.productCode,
            name: requisitionLineItems[1].orderable.fullProductName,
            totalCost: requisitionLineItems[1].totalCost,
            totalQuantity: requisitionLineItems[1].approvedQuantity,
            requisitions: [requisition.id]
        };

        lineItems = [];
        lineItems[requisition.id] = [];
        lineItems[requisition.id][requisitionLineItems[0].orderable.id] = requisitionLineItems[0];
        lineItems[requisition.id][requisitionLineItems[1].orderable.id] = requisitionLineItems[1];

        var requisitionFactoryMock = jasmine.createSpy('Requisition').andReturn(requisition);
        calculationFactory = jasmine.createSpyObj('calculationFactory', ['totalCost']);
        calculationFactory.totalCost.andReturn(100);

        module(function($provide){
            $provide.factory('Requisition', function() {
                return requisitionFactoryMock;
            });
        });

        inject(function (_$controller_, _$stateParams_, _confirmService_, _$rootScope_, _$q_) {
            $controller = _$controller_;
            $stateParams = _$stateParams_;
            confirmService = _confirmService_;
            $rootScope = _$rootScope_;
            $q = _$q_;
            $stateParams.requisitions = [requisition];

        });
    });

    describe('$onInit', function() {

        beforeEach(function() {
            vm = $controller('RequisitionBatchApprovalController', {
                $stateParams: $stateParams
            });
        });

        it('should expose requisitions', function() {
            vm.$onInit();
            expect(vm.requisitions).toEqual([requisition]);
        });

        it('should calculate total cost of requisition', function() {
            vm.$onInit();
            expect(vm.requisitions[0].$totalCost).toEqual(110);
        });

        it('should calculate total cost of all requisitions', function() {
            vm.$onInit();
            expect(vm.totalCost).toEqual(110);
        });

        it('should expose list of products', function() {
            vm.$onInit();
            expect(vm.products).toEqual(products);
        });

        it('should expose list of line items', function() {
            vm.$onInit();
            expect(vm.lineItems).toEqual(lineItems);
        });
    });

    describe('updateLineItem', function() {

        beforeEach(function() {
            initController();
        });

        it('should call calculation factory method', function() {
            vm.updateLineItem(lineItems[1][1], requisition);

            expect(calculationFactory.totalCost).toHaveBeenCalled();
            expect(lineItems[1][1].totalCost).toBe(100);
        });
    });

    describe('revert', function() {

        beforeEach(function() {
            initController();

            confirmDeferred = $q.defer();
            spyOn(confirmService, 'confirm').andReturn(confirmDeferred.promise);
            spyOn(vm, '$onInit');
        });

        it('should ask user for confirmation', function() {
            vm.revert();

            confirmDeferred.resolve();
            $rootScope.$apply();

            expect(confirmService.confirm).toHaveBeenCalledWith(
                'requisitionBatchApproval.revertConfirm', 'requisitionBatchApproval.revert');
        });

        it('should call onInit method', function() {
            vm.revert();

            confirmDeferred.resolve();
            $rootScope.$apply();

            expect(vm.$onInit).toHaveBeenCalled();
        });
    });

    function initController() {
        vm = $controller('RequisitionBatchApprovalController', {
            $stateParams: $stateParams,
            calculationFactory: calculationFactory
        });
        vm.$onInit();
    }
});
