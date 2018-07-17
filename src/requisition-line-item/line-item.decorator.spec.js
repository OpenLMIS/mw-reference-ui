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

    var LineItem, requisitionLineItem, authorizationServiceSpy, requisition, program,
        calculationFactory, column, lineItem, TEMPLATE_COLUMNS, REQUISITION_RIGHTS,
        userAlwaysHasRight, userHasCreateRight, userHasAuthorizedRight, userHasApprovedRight;

    beforeEach(function() {
        module('requisition-line-item');

        calculationFactory = jasmine.createSpyObj('calculationFactory', ['totalCost', 'adjustedConsumption']);
        calculationFactory.totalCost.andReturn(20);

        module(function($provide) {
            $provide.factory('calculationFactory', function() {
                return calculationFactory;
            });
        });

        module('openlmis-templates', function($provide) {

            authorizationServiceSpy = jasmine.createSpyObj('authorizationService', ['hasRight', 'isAuthenticated']);
            $provide.service('authorizationService', function() {
                return authorizationServiceSpy;
            });

            userAlwaysHasRight = true;
            authorizationServiceSpy.hasRight.andCallFake(function(right) {
                if (userAlwaysHasRight) {
                    return true;
                }
                if (userHasApprovedRight && right == REQUISITION_RIGHTS.REQUISITION_APPROVE) {
                    return true;
                }
                if (userHasAuthorizedRight && right == REQUISITION_RIGHTS.REQUISITION_AUTHORIZE) {
                    return true;
                }
                if (userHasCreateRight && right == REQUISITION_RIGHTS.REQUISITION_CREATE) {
                    return true;
                }
                return false;
            });

            authorizationServiceSpy.isAuthenticated.andReturn(true);
        });

        inject(function(_LineItem_, _TEMPLATE_COLUMNS_, _REQUISITION_RIGHTS_, _COLUMN_TYPES_, _COLUMN_SOURCES_) {
            TEMPLATE_COLUMNS = _TEMPLATE_COLUMNS_;
            REQUISITION_RIGHTS = _REQUISITION_RIGHTS_;
            LineItem = _LineItem_;
            column = {
                type: _COLUMN_TYPES_.NUMERIC,
                name: 'requestedQuantity',
                source: _COLUMN_SOURCES_.USER_INPUT
            };
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
        requisition = jasmine.createSpyObj('requisition', ['$isApproved', '$isAuthorized', '$isInApproval', '$isReleased', '$isInitiated', '$isSubmitted', '$isRejected']);
        requisition.$isApproved.andReturn(false);
        requisition.$isAuthorized.andReturn(false);
        requisition.$isInitiated.andReturn(false);
        requisition.$isReleased.andReturn(false);
        requisition.$isSubmitted.andReturn(false);
        requisition.$isRejected.andReturn(false);
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
        lineItem = new LineItem(requisitionLineItem, requisition);
    });

    it('should update full product name to contain product name and net content', function() {
        expect(lineItem.orderable.fullProductName).toEqual('product (100)');
    });

    describe('updateFieldValue', function() {

        it('should update approved quantity in line item if it is undefined and facility operator is CHAM', function() {
            lineItem.approvedQuantity = undefined;
            lineItem.updateFieldValue(requisition.template.columnsMap[6], requisition);

            expect(lineItem.approvedQuantity).toEqual(0);
        });

        it('should update approved quantity in line item if has value and facility operator is CHAM', function() {
            lineItem.approvedQuantity = 100;
            lineItem.updateFieldValue(requisition.template.columnsMap[6], requisition);

            expect(lineItem.approvedQuantity).toEqual(0);
        });

        it('should not update approved quantity in line item if it is undefined and facility operator is different than CHAM', function() {
            facilityOperator.code = 'MOH';
            lineItem = new LineItem(requisitionLineItem, requisition);

            lineItem.approvedQuantity = undefined;
            lineItem.updateFieldValue(requisition.template.columnsMap[6], requisition);

            expect(lineItem.approvedQuantity).toEqual(undefined);
        });

        it('should not update approved quantity in line item if it is skipped', function() {
            requisitionLineItem.skipped = true;
            lineItem = new LineItem(requisitionLineItem, requisition);

            lineItem.approvedQuantity = undefined;
            lineItem.updateFieldValue(requisition.template.columnsMap[6], requisition);

            expect(lineItem.approvedQuantity).toEqual(undefined);
        });
    });

    describe('canBeSkipped', function() {

        it('should return true if input = 0', function() {
            lineItem.requestedQuantity = 0;
            lineItem.requestedQuantityExplanation = '';

            var result = lineItem.canBeSkipped(requisition);

            expect(result).toBe(true);
        });

        it('should return false if input > 0', function() {
            lineItem.requestedQuantity = 100;
            lineItem.requestedQuantityExplanation = 'we need more';

            var result = lineItem.canBeSkipped(requisition);

            expect(result).toBe(false);
        });

        it('should return false if input = 0 and beginningBalance > 0', function() {
            lineItem.requestedQuantity = 0;
            lineItem.requestedQuantityExplanation = '';
            lineItem.beginningBalance = 100;

            var result = lineItem.canBeSkipped(requisition);

            expect(result).toBe(false);
        });


        it('should return true if input = 0, beginningBalance > 0 and requisition is emergency', function() {
            requisition.emergency = true;
            lineItem = new LineItem(requisitionLineItem, requisition);

            lineItem.requestedQuantity = 0;
            lineItem.requestedQuantityExplanation = '';
            lineItem.beginningBalance = 100;

            var result = lineItem.canBeSkipped(requisition);

            expect(result).toBe(true);
        });

        it('should return false if requisition status is authorized', function() {
            lineItem.requestedQuantity = 0;
            lineItem.requestedQuantityExplanation = '';
            requisition.$isAuthorized.andReturn(true);

            var result = lineItem.canBeSkipped(requisition);

            expect(result).toBe(false);
        });

        it('should return false if requisition status is in approval', function() {
            lineItem.requestedQuantity = 0;
            lineItem.requestedQuantityExplanation = '';
            requisition.$isInApproval.andReturn(true);

            var result = lineItem.canBeSkipped(requisition);

            expect(result).toBe(false);
        });

        it('should return false if requisition status is approved', function() {
            lineItem.requestedQuantity = 0;
            lineItem.requestedQuantityExplanation = '';
            requisition.$isApproved.andReturn(true);

            var result = lineItem.canBeSkipped(requisition);

            expect(result).toBe(false);
        });

        it('should return false if requisition status is released', function() {
            lineItem.requestedQuantity = 0;
            lineItem.requestedQuantityExplanation = '';
            requisition.$isReleased.andReturn(true);

            var result = lineItem.canBeSkipped(requisition);

            expect(result).toBe(false);
        });
    });


    describe('isReadOnly', function() {

        it('should return true if approved', function() {
            requisition.$isApproved.andReturn(true);
            requisition.$isReleased.andReturn(false);

            var result = lineItem.isReadOnly(requisition, column);

            expect(result).toBe(true);
        });

        it('should return true if released', function() {
            requisition.$isApproved.andReturn(false);
            requisition.$isReleased.andReturn(true);

            var result = lineItem.isReadOnly(requisition, column);

            expect(result).toBe(true);
        });

        it('should return true if authorized', function() {
            requisition.$isApproved.andReturn(false);
            requisition.$isReleased.andReturn(false);
            requisition.$isInApproval.andReturn(true);
            requisition.$isAuthorized.andReturn(false);

            var result = lineItem.isReadOnly(requisition, column);

            expect(result).toBe(true);
        });

        it('should return true if in approval', function() {
            requisition.$isApproved.andReturn(false);
            requisition.$isReleased.andReturn(false);
            requisition.$isInApproval.andReturn(false);
            requisition.$isAuthorized.andReturn(true);

            var result = lineItem.isReadOnly(requisition, column);

            expect(result).toBe(true);
        });

        it('should return false if user has no right to approve', function() {
            column.name = TEMPLATE_COLUMNS.APPROVED_QUANTITY;

            requisition.$isSubmitted.andReturn(true);
            requisition.$isApproved.andReturn(false);
            requisition.$isReleased.andReturn(false);
            requisition.$isInApproval.andReturn(false);
            requisition.$isAuthorized.andReturn(false);

            var result = lineItem.isReadOnly(requisition, column);

            expect(result).toBe(false);
        });

        it('should return false', function() {
            requisition.$isInitiated.andReturn(true);
            requisition.$isRejected.andReturn(false);
            requisition.$isApproved.andReturn(false);
            requisition.$isReleased.andReturn(false);
            requisition.$isAuthorized.andReturn(false);
            requisition.$isInApproval.andReturn(false);

            var result = lineItem.isReadOnly(requisition, column);

            expect(result).toBe(false);
        });

        it('should return false if initiated and user can submit', function(){
            requisition.$isInitiated.andReturn(true);
            requisition.$isRejected.andReturn(false);
            requisition.$isApproved.andReturn(false);
            requisition.$isReleased.andReturn(false);
            requisition.$isAuthorized.andReturn(false);
            requisition.$isInApproval.andReturn(false);

            userAlwaysHasRight = false;
            userHasCreateRight = false;

            var result = lineItem.isReadOnly(requisition, column);

            expect(result).toBe(true);

            userHasCreateRight = true;

            result = lineItem.isReadOnly(requisition, column);

            expect(result).toBe(false);
        });

        it('should return false if rejected and user can submit', function(){
            requisition.$isInitiated.andReturn(false);
            requisition.$isRejected.andReturn(true);
            requisition.$isApproved.andReturn(false);
            requisition.$isReleased.andReturn(false);
            requisition.$isAuthorized.andReturn(false);
            requisition.$isInApproval.andReturn(false);

            userAlwaysHasRight = false;
            userHasCreateRight = false;

            var result = lineItem.isReadOnly(requisition, column);

            expect(result).toBe(true);

            userHasCreateRight = true;

            result = lineItem.isReadOnly(requisition, column);

            expect(result).toBe(false);
        });

        it('should return false if submitted and user can approve', function(){
            requisition.$isInitiated.andReturn(false);
            requisition.$isSubmitted.andReturn(true);
            requisition.$isApproved.andReturn(false);
            requisition.$isReleased.andReturn(false);
            requisition.$isAuthorized.andReturn(false);
            requisition.$isInApproval.andReturn(false);

            userAlwaysHasRight = false;

            result = lineItem.isReadOnly(requisition, column);

            expect(result).toBe(true);

            userHasAuthorizedRight = true;

            result = lineItem.isReadOnly(requisition, column);

            expect(result).toBe(false);
        });

        it('should return true if column is beginning balance', function() {
            column.name = TEMPLATE_COLUMNS.BEGINNING_BALANCE;

            requisition.$isApproved.andReturn(false);
            requisition.$isReleased.andReturn(false);
            requisition.$isInApproval.andReturn(false);
            requisition.$isAuthorized.andReturn(false);

            result = lineItem.isReadOnly(requisition, column);

            expect(result).toBe(true);
        });

        it('should return true for non approval column if in approval and for tb program', function() {
            column.name = TEMPLATE_COLUMNS.BEGINNING_BALANCE;

            requisition.$isInApproval.andReturn(true);
            requisition.program.code = 'tb';

            result = lineItem.isReadOnly(requisition, column);

            expect(result).toBe(true);
        });

        it('should return false for approved quantity column if in approval and for tb program', function() {
            column.name = TEMPLATE_COLUMNS.APPROVED_QUANTITY;

            requisition.$isInApproval.andReturn(true);
            requisition.program.code = 'tb';

            result = lineItem.isReadOnly(requisition, column);

            expect(result).toBe(false);
        });

        it('should return false for remarks column if in approval and for tb program', function() {
            column.name = TEMPLATE_COLUMNS.REMARKS;

            requisition.$isInApproval.andReturn(true);
            requisition.program.code = 'tb';

            result = lineItem.isReadOnly(requisition, column);

            expect(result).toBe(false);
        });
    })

 });
