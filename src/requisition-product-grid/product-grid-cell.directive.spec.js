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
describe('ProductGridCell', function() {

    var $compile, scope, requisition, directiveElem, requisitionValidatorMock,
        authorizationServiceSpy, fullSupplyColumns, nonFullSupplyColumns,
        REQUISITION_RIGHTS, userAlwaysHasRight, userHasAuthorizedRight,
        RequisitionColumnDataBuilder;

    beforeEach(function() {
        module('requisition-product-grid', function($compileProvider) {
            $compileProvider.directive('lossesAndAdjustments', function() {
                var def = {
                    priority: 100,
                    terminal: true,
                    restrict: 'EAC',
                    template: '<a></a>',
                };
                return def;
            });
        });

        module('openlmis-templates', function($provide) {

            requisitionValidatorMock = jasmine.createSpyObj('requisitionValidator',
                ['validateLineItem']);
            $provide.service('requisitionValidator', function() {
                return requisitionValidatorMock;
            });

            authorizationServiceSpy = jasmine.createSpyObj('authorizationService', ['hasRight', 'isAuthenticated']);
            $provide.service('authorizationService', function() {
                return authorizationServiceSpy;
            });

            userAlwaysHasRight = true;
            authorizationServiceSpy.hasRight.andCallFake(function(right) {
                if (userAlwaysHasRight) {
                    return true;
                }
                if (userHasAuthorizedRight && right == REQUISITION_RIGHTS.REQUISITION_AUTHORIZE) {
                    return true;
                }
                return false;
            });

            authorizationServiceSpy.isAuthenticated.andReturn(true);
        });

        inject(function($injector) {
            $compile = $injector.get('$compile');
            scope = $injector.get('$rootScope').$new();
            RequisitionColumnDataBuilder = $injector.get('RequisitionColumnDataBuilder');

            REQUISITION_RIGHTS = $injector.get('REQUISITION_RIGHTS');

            fullSupplyColumns = [{
                type: $injector.get('COLUMN_TYPES').NUMERIC,
                name: "beginningBalance",
                source: $injector.get('COLUMN_SOURCES').USER_INPUT
            }];

            nonFullSupplyColumns = [{
                name: 'col3'
            }, {
                name: 'col4'
            }];

            requisition = jasmine.createSpyObj('requisition', [
                '$getStockAdjustmentReasons',
                '$isInitiated',
                '$isRejected',
                '$isSubmitted',
                '$isApproved',
                '$isReleased',
                '$isAuthorized',
                '$isInApproval'
            ]);
            requisition.template = jasmine.createSpyObj('template', ['getColumns']);
            requisition.template.getColumns.andCallFake(function(nonFullSupply) {
                return nonFullSupply ? nonFullSupplyColumns : fullSupplyColumns;
            });
            requisition.program = {
                id: '1'
            };
            requisition.facility = {
                id: '2'
            };

            scope.requisition = requisition;

            scope.column = fullSupplyColumns[0];

            scope.lineItem = jasmine.createSpyObj('lineItem', [
                'getFieldValue','updateDependentFields', 'canBeSkipped', 'isReadOnly'
            ]);

            scope.lineItem.$program = {
                fullSupply: true
            };

            scope.lineItem.getFieldValue.andCallFake(function() {
                return "readOnlyFieldValue";
            });

            scope.lineItem.$errors = {};

            // Malawi: Added auto calculation and suggestion how much should be adjusted
            scope.lineItem.difference = {};
            // --- ends here ---
        });
    });

    it('should produce read-only cell if line item is readonly', function() {
        scope.lineItem.isReadOnly.andReturn(true);

        directiveElem = getCompiledElement();

        expect(directiveElem.html()).toContain("readOnlyFieldValue");
        expect(directiveElem.find("input").length).toEqual(0);
    });

    it('should produce editable cell if line item is not readonly', function() {
        scope.lineItem.isReadOnly.andReturn(false);

        directiveElem = getCompiledElement();

        expect(directiveElem.html()).not.toContain("readOnlyFieldValue");
        expect(directiveElem.find("input").length).toEqual(1);
    });

    it('should produce losesAndAdjustment cell', function() {
        scope.requisition.$isApproved.andReturn(false);
        scope.requisition.$isReleased.andReturn(false);
        scope.requisition.$isAuthorized.andReturn(false);
        scope.column.name = "totalLossesAndAdjustments";

        directiveElem = getCompiledElement();

        expect(directiveElem.html()).not.toContain("readOnlyFieldValue");
        expect(directiveElem.find("a").length).toEqual(1);
    });

    it('should validate full supply line item columns after updating fields', function() {
        scope.requisition.$isInitiated.andReturn(true);
        var element = getCompiledElement(),
            input = element.find('input');

        input.controller('ngModel').$setViewValue("1000");
        scope.$apply();

        expect(requisitionValidatorMock.validateLineItem).toHaveBeenCalledWith(
            scope.lineItem, fullSupplyColumns, requisition);
        expect(scope.lineItem.updateDependentFields).toHaveBeenCalledWith(
            scope.column, requisition);
    });

    it('should validate non full supply line item columns after updating fields', function() {
        scope.requisition.$isInitiated.andReturn(true);
        var element = getCompiledElement(),
            input = element.find('input');

        scope.lineItem.$program.fullSupply = false;

        input.controller('ngModel').$setViewValue("1000");
        scope.$apply();

        expect(requisitionValidatorMock.validateLineItem).toHaveBeenCalledWith(
            scope.lineItem, nonFullSupplyColumns, requisition);
        expect(scope.lineItem.updateDependentFields).toHaveBeenCalledWith(
            scope.column, requisition);
    });

    describe('Skip Column', function() {

        var skipColumn, element;

        beforeEach(function() {
            skipColumn = new RequisitionColumnDataBuilder().buildSkipColumn();
            scope.column = skipColumn;
        });

        it('should change disabled state if lineItem changes its skipability and user has right to edit', function() {
            scope.userCanEdit = true;
            scope.lineItem.canBeSkipped.andReturn(true);

            element = getCompiledElement();

            expect(getSkipInput().attr('disabled')).toBe(undefined);

            scope.lineItem.canBeSkipped.andReturn(false);
            scope.$digest();

            expect(getSkipInput().attr('disabled')).toBe('disabled');

            scope.lineItem.canBeSkipped.andReturn(true);
            scope.$digest();

            expect(getSkipInput().attr('disabled')).toBe(undefined);
        });

        function getSkipInput() {
            return element.find('input.skip');
        }

    });

    function getCompiledElement() {
        var rootElement = angular.element('<div><div product-grid-cell requisition="requisition" column="column" line-item="lineItem" user-can-edit="userCanEdit"></div></div>');
        var compiledElement = $compile(rootElement)(scope);
        angular.element('body').append(compiledElement);
        scope.$digest();
        return compiledElement;
    }
});
