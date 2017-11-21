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

describe('LineItem decorator', function() {

    var LineItem, requisitionLineItem, requisition, program, calculationFactory, template;

    beforeEach(function() {
        module('requisition-line-item');

        calculationFactory = jasmine.createSpyObj('calculationFactory', ['totalCost', 'adjustedConsumption']);
        calculationFactory.totalCost.andReturn(20);

        module(function($provide) {
            $provide.factory('calculationFactory', function() {
                return calculationFactory;
            });
        });

        inject(function(_LineItem_) {
            LineItem = _LineItem_;
        });

        var template = jasmine.createSpyObj('template', ['getColumns']);
        template.columnsMap = [
            {
                name: 'requestedQuantity',
                source: 'USER_INPUT',
                $type: 'NUMERIC',
                $display: true
            },
            {
                name: 'requestedQuantityExplanation',
                source: 'USER_INPUT',
                $type: 'TEXT',
                $display: true
            },
            {
                name: 'totalCost',
                source: 'CALCULATED',
                $type: 'CURRENCY',
                $display: true
            },
            {
                name: 'adjustedConsumption',
                source: 'CALCULATED',
                $type: 'NUMERIC',
                $display: true
            },
            {
                name: 'columnWithoutCalculations',
                source: 'CALCULATED',
                $type: 'NUMERIC',
                $display: true
            },
            {
                name: 'pricePerPack',
                source: 'REFERENCE_DATA',
                $type: 'CURRENCY',
                $display: true
            },
            {
                name: 'approvedQuantity',
                source: 'USER_INPUT',
                $type: 'NUMERIC',
                $display: true
            },
            {
                name: 'beginningBalance',
                source: 'USER_INPUT',
                $type: 'NUMERIC',
                $display: true
            }

        ];
        template.getColumns.andCallFake(function (nonFullSupply) {
            return template.columnsMap;
        });

        facilityOperator = {
            id: 'operator1',
            code: 'CHAM'
        };

        facility = {
            id: 'facility1',
            operator: facilityOperator
        };

        program = {
            id: '1',
            name: 'program1'
        };

        requisitionLineItem = {
            $program: {
                fullSupply: true
            },
            orderable: {
                id: '1',
                fullProductName: 'product',
                productCode: 'P1',
                programs: [
                    {
                        programId: program.id
                    }
                ],
                netContent: 100
            },
            requestedQuantity: 10,
            requestedQuantityExplanation: 'explanation'
        };
        requisition = jasmine.createSpyObj('requisition', ['$isApproved', '$isAuthorized', '$isInApproval', '$isReleased']);
        requisition.$isApproved.andReturn(false);
        requisition.$isAuthorized.andReturn(false);
        requisition.$isReleased.andReturn(false);
        requisition.requisitionLineItems = [requisitionLineItem];
        requisition.program = program;
        requisition.status = 'SUBMITTED';
        requisition.template = template;
        requisition.facility = facility;
        requisition.emergency = false;
        requisition.processingPeriod = {
            startDate: [2016, 4, 1],
            endDate: [2016, 4, 30]
        };
    });

    it('should update full product name to contain product name and net content', function() {
        var lineItem = new LineItem(requisitionLineItem, requisition);

        expect(lineItem.orderable.fullProductName).toEqual('product (100)');
    });

    describe('updateFieldValue', function() {

        it('should update approved quantity in line item if it is undefined and facility operator is CHAM', function() {
            var lineItem = new LineItem(requisitionLineItem, requisition);

            lineItem.approvedQuantity = undefined;
            lineItem.updateFieldValue(requisition.template.columnsMap[6], requisition);

            expect(lineItem.approvedQuantity).toEqual(0);
        });

        it('should update approved quantity in line item if has value and facility operator is CHAM', function() {
            var lineItem = new LineItem(requisitionLineItem, requisition);

            lineItem.approvedQuantity = 100;
            lineItem.updateFieldValue(requisition.template.columnsMap[6], requisition);

            expect(lineItem.approvedQuantity).toEqual(0);
        });

        it('should not update approved quantity in line item if it is undefined and facility operator is different than CHAM', function() {
            facilityOperator.code = 'MOH';
            var lineItem = new LineItem(requisitionLineItem, requisition);

            lineItem.approvedQuantity = undefined;
            lineItem.updateFieldValue(requisition.template.columnsMap[6], requisition);

            expect(lineItem.approvedQuantity).toEqual(undefined);
        });

        it('should not update approved quantity in line item if it is skipped', function() {
            requisitionLineItem.skipped = true;
            var lineItem = new LineItem(requisitionLineItem, requisition);

            lineItem.approvedQuantity = undefined;
            lineItem.updateFieldValue(requisition.template.columnsMap[6], requisition);

            expect(lineItem.approvedQuantity).toEqual(undefined);
        });
    });

    describe('canBeSkipped', function() {

        it('should return true if input = 0', function() {
            var lineItem = new LineItem(requisitionLineItem, requisition);

            lineItem.requestedQuantity = 0;
            lineItem.requestedQuantityExplanation = '';

            var result = lineItem.canBeSkipped(requisition);

            expect(result).toBe(true);
        });

        it('should return false if input > 0', function() {
            var lineItem = new LineItem(requisitionLineItem, requisition);

            lineItem.requestedQuantity = 100;
            lineItem.requestedQuantityExplanation = 'we need more';

            var result = lineItem.canBeSkipped(requisition);

            expect(result).toBe(false);
        });

        it('should return false if input = 0 and beginningBalance > 0', function() {
            var lineItem = new LineItem(requisitionLineItem, requisition);

            lineItem.requestedQuantity = 0;
            lineItem.requestedQuantityExplanation = '';
            lineItem.beginningBalance = 100;

            var result = lineItem.canBeSkipped(requisition);

            expect(result).toBe(false);
        });


        it('should return true if input = 0, beginningBalance > 0 and requisition is emergency', function() {
            requisition.emergency = true;
            var lineItem = new LineItem(requisitionLineItem, requisition);

            lineItem.requestedQuantity = 0;
            lineItem.requestedQuantityExplanation = '';
            lineItem.beginningBalance = 100;

            var result = lineItem.canBeSkipped(requisition);

            expect(result).toBe(true);
        });

        it('should return false if requisition status is authorized', function() {
            var lineItem = new LineItem(requisitionLineItem, requisition);

            lineItem.requestedQuantity = 0;
            lineItem.requestedQuantityExplanation = '';
            requisition.$isAuthorized.andReturn(true);

            var result = lineItem.canBeSkipped(requisition);

            expect(result).toBe(false);
        });

        it('should return false if requisition status is in approval', function() {
            var lineItem = new LineItem(requisitionLineItem, requisition);

            lineItem.requestedQuantity = 0;
            lineItem.requestedQuantityExplanation = '';
            requisition.$isInApproval.andReturn(true);

            var result = lineItem.canBeSkipped(requisition);

            expect(result).toBe(false);
        });

        it('should return false if requisition status is approved', function() {
            var lineItem = new LineItem(requisitionLineItem, requisition);

            lineItem.requestedQuantity = 0;
            lineItem.requestedQuantityExplanation = '';
            requisition.$isApproved.andReturn(true);

            var result = lineItem.canBeSkipped(requisition);

            expect(result).toBe(false);
        });

        it('should return false if requisition status is released', function() {
            var lineItem = new LineItem(requisitionLineItem, requisition);

            lineItem.requestedQuantity = 0;
            lineItem.requestedQuantityExplanation = '';
            requisition.$isReleased.andReturn(true);

            var result = lineItem.canBeSkipped(requisition);

            expect(result).toBe(false);
        });
    });

 });
