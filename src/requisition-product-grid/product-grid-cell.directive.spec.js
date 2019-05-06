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

    beforeEach(function() {
        this.getCompiledElement = getCompiledElement;

        module('requisition');
        module('requisition-product-grid', function($compileProvider, $provide) {
            $compileProvider.directive('lossesAndAdjustments', function() {
                var def = {
                    priority: 100,
                    terminal: true,
                    restrict: 'EAC',
                    template: '<a></a>'
                };
                return def;
            });

            $provide.value('openlmisCurrencyFilter', function(value) {
                return '$' + value;
            });
        });

        inject(function($injector) {
            this.$compile = $injector.get('$compile');
            this.$rootScope = $injector.get('$rootScope');
            this.requisitionValidator = $injector.get('requisitionValidator');
            this.authorizationService = $injector.get('authorizationService');
            this.RequisitionColumnDataBuilder = $injector.get('RequisitionColumnDataBuilder');
            this.COLUMN_TYPES = $injector.get('COLUMN_TYPES');
            this.COLUMN_SOURCES = $injector.get('COLUMN_SOURCES');
            this.RequisitionDataBuilder = $injector.get('RequisitionDataBuilder');
            // Malawi: override isReadOnly
            this.TEMPLATE_COLUMNS = $injector.get('TEMPLATE_COLUMNS');
            this.REQUISITION_RIGHTS = $injector.get('REQUISITION_RIGHTS');
            // --- ends here ---
        });

        this.scope = this.$rootScope.$new();

        this.fullSupplyColumns = [
            new this.RequisitionColumnDataBuilder().buildRequestedQuantityColumn()
        ];

        this.nonFullSupplyColumns = [
            new this.RequisitionColumnDataBuilder().build(),
            new this.RequisitionColumnDataBuilder().build()
        ];

        this.scope.requisition = new this.RequisitionDataBuilder().build();
        this.scope.column = this.fullSupplyColumns[0];
        this.scope.lineItem = this.scope.requisition.requisitionLineItems[0];

        spyOn(this.scope.lineItem, 'getFieldValue').andReturn('readOnlyFieldValue');
        spyOn(this.requisitionValidator, 'validateLineItem');
        spyOn(this.authorizationService, 'isAuthenticated').andReturn(true);
        spyOn(this.authorizationService, 'hasRight').andReturn(true);
        spyOn(this.scope.lineItem, 'canBeSkipped');
        spyOn(this.scope.lineItem, 'updateDependentFields');

        // Malawi: Added auto calculation and suggestion how much should be adjusted
        this.scope.lineItem.difference = {};
        // --- ends here ---
    });

    it('should produce losesAndAdjustment cell', function() {
        this.scope.requisition.$isApproved.andReturn(false);
        this.scope.requisition.$isReleased.andReturn(false);
        this.scope.requisition.$isAuthorized.andReturn(false);
        this.scope.column.name = 'totalLossesAndAdjustments';

        this.directiveElem = this.getCompiledElement();

        expect(this.directiveElem.html()).not.toContain('readOnlyFieldValue');
        expect(this.directiveElem.find('a').length).toEqual(1);
    });

    it('should produce read only for losesAndAdjustment and stock based requisition', function() {
        this.scope.requisition.$isApproved.andReturn(false);
        this.scope.requisition.$isReleased.andReturn(false);
        this.scope.requisition.$isAuthorized.andReturn(false);
        this.scope.column.name = 'totalLossesAndAdjustments';
        this.scope.requisition.template.populateStockOnHandFromStockCards = true;
        // Malawi: override isReadOnly
        this.authorizationService.hasRight.andReturn(false);
        // --- ends here ---

        this.directiveElem = this.getCompiledElement();

        expect(this.directiveElem.html()).toContain('readOnlyFieldValue');
        expect(this.directiveElem.find('input').length).toEqual(0);
    });

    it('should produce currency cell if column is of currency type', function() {
        this.scope.column = new this.RequisitionColumnDataBuilder().buildTotalCostColumn();
        this.scope.lineItem.getFieldValue.andReturn(123);

        this.directiveElem = this.getCompiledElement();

        expect(this.directiveElem.html()).toContain('$123');
    });

    it('should produce cell with integer input for numeric column that is not read only', function() {
        this.scope.column = new this.RequisitionColumnDataBuilder().buildTotalConsumedQuantityColumn();
        this.scope.userCanEdit = true;

        this.directiveElem = this.getCompiledElement();

        expect(this.directiveElem.html()).toContain('input');
        expect(this.directiveElem.html()).toContain('positive-integer');
    });

    it('should validate full supply line item columns after updating fields', function() {
        this.scope.requisition.template.getColumns.andReturn(this.fullSupplyColumns);
        this.scope.userCanEdit = true;
        this.scope.requisition.$isInitiated.andReturn(true);
        var element = this.getCompiledElement(),
            input = element.find('input');

        input.controller('ngModel').$setViewValue('1000');
        this.scope.$apply();

        expect(this.requisitionValidator.validateLineItem).toHaveBeenCalledWith(
            this.scope.lineItem, this.fullSupplyColumns, this.scope.requisition
        );

        expect(this.scope.lineItem.updateDependentFields).toHaveBeenCalledWith(
            this.scope.column, this.scope.requisition
        );
    });

    it('should not show error message if line item is skipped', function() {
        this.scope.lineItem.skipped = true;

        var elScope = angular.element(this.getCompiledElement().children()[0]).scope();

        expect(elScope.invalidMessage).toBeUndefined();

        this.scope.lineItem.$errors[this.scope.column.name] = 'Invalid entry';
        this.$rootScope.$apply();

        expect(elScope.invalidMessage).toBeUndefined();
    });

    it('should show error message if line item is not skipped', function() {
        var elScope = angular.element(this.getCompiledElement().children()[0]).scope();

        expect(elScope.invalidMessage).toBeUndefined();

        this.scope.lineItem.$errors[this.scope.column.name] = 'Invalid entry';
        this.$rootScope.$apply();

        expect(elScope.invalidMessage).toEqual('Invalid entry');
    });

    it('should validate non full supply line item columns after updating fields', function() {
        this.scope.userCanEdit = true;
        this.scope.requisition.template.getColumns.andReturn(this.nonFullSupplyColumns);
        this.scope.requisition.$isInitiated.andReturn(true);
        var element = this.getCompiledElement(),
            input = element.find('input');

        this.scope.lineItem.$program.fullSupply = false;

        input.controller('ngModel').$setViewValue('1000');
        this.scope.$apply();

        expect(this.requisitionValidator.validateLineItem).toHaveBeenCalledWith(
            this.scope.lineItem, this.nonFullSupplyColumns, this.scope.requisition
        );

        expect(this.scope.lineItem.updateDependentFields).toHaveBeenCalledWith(
            this.scope.column, this.scope.requisition
        );
    });

    it('should produce read only cell for approved requisition', function() {
        this.scope.requisition.$isApproved.andReturn(true);

        var cell = angular.element(this.getCompiledElement().children()[0]);

        expect(cell.text()).toEqual('readOnlyFieldValue');
    });

    it('should produce read only cell for released requisition', function() {
        this.scope.requisition.$isReleased.andReturn(true);

        var cell = angular.element(this.getCompiledElement().children()[0]);

        expect(cell.text()).toEqual('readOnlyFieldValue');
    });

    it('should produce editable cell for approval columns if user can approve', function() {
        this.scope.canApprove = true;
        this.scope.column = new this.RequisitionColumnDataBuilder().buildApprovedQuantityColumn(this.scope.requisition);

        var cell = angular.element(this.getCompiledElement().children()[0]);

        expect(cell.text()).not.toEqual('readOnlyFieldValue');

        this.scope.column = new this.RequisitionColumnDataBuilder().buildRemarksColumn(this.scope.requisition);

        cell = angular.element(this.getCompiledElement().children()[0]);

        expect(cell.text()).not.toEqual('readOnlyFieldValue');
    });

    it('should produce editable cell if user can edit and column is editable', function() {
        this.scope.userCanEdit = true;
        this.scope.column = new this.RequisitionColumnDataBuilder().buildTotalConsumedQuantityColumn();

        var cell = angular.element(this.getCompiledElement().children()[0]);

        expect(cell.text()).not.toEqual('readOnlyFieldValue');
    });

    it('should produce read only cell if user can not edit', function() {
        // Malawi: override isReadOnly
        this.authorizationService.hasRight.andReturn(false);
        // --- ends here ---
        this.scope.userCanEdit = false;
        this.scope.column = new this.RequisitionColumnDataBuilder().buildTotalConsumedQuantityColumn();

        var cell = angular.element(this.getCompiledElement().children()[0]);

        expect(cell.text()).toEqual('readOnlyFieldValue');
    });

    it('should produce real only cell if column is not editable', function() {
        this.scope.userCanEdit = true;
        this.scope.column = new this.RequisitionColumnDataBuilder().buildProductCodeColumn();

        var cell = angular.element(this.getCompiledElement().children()[0]);

        expect(cell.text()).toEqual('readOnlyFieldValue');
    });

    // Malawi: override isReadOnly
    describe('isReadOnly override', function() {

        beforeEach(function() {
            var context = this;
            this.userAlwaysHasRight = true;
            this.authorizationService.hasRight.andCallFake(function(right) {
                if (context.userAlwaysHasRight) {
                    return true;
                }
                if (context.userHasApprovedRight && right === context.REQUISITION_RIGHTS.REQUISITION_APPROVE) {
                    return true;
                }
                if (context.userHasAuthorizedRight && right === context.REQUISITION_RIGHTS.REQUISITION_AUTHORIZE) {
                    return true;
                }
                if (context.userHasCreateRight && right === context.REQUISITION_RIGHTS.REQUISITION_CREATE) {
                    return true;
                }
                return false;
            });
        });

        it('should produce read-only cell if approved', function() {
            this.scope.requisition.$isApproved.andReturn(true);
            this.scope.requisition.$isReleased.andReturn(false);

            var cell = angular.element(this.getCompiledElement().children()[0]);

            expect(cell.text()).toEqual('readOnlyFieldValue');
        });

        it('should produce read-only cell if released', function() {
            this.scope.requisition.$isApproved.andReturn(false);
            this.scope.requisition.$isReleased.andReturn(true);

            var cell = angular.element(this.getCompiledElement().children()[0]);

            expect(cell.text()).toEqual('readOnlyFieldValue');
        });

        it('should produce read-only cell if authorized', function() {
            this.scope.requisition.$isApproved.andReturn(false);
            this.scope.requisition.$isReleased.andReturn(false);
            this.scope.requisition.$isInApproval.andReturn(true);
            this.scope.requisition.$isAuthorized.andReturn(false);

            var cell = angular.element(this.getCompiledElement().children()[0]);

            expect(cell.text()).toEqual('readOnlyFieldValue');
        });

        it('should produce read-only cell if in approval', function() {
            this.scope.requisition.$isApproved.andReturn(false);
            this.scope.requisition.$isReleased.andReturn(false);
            this.scope.requisition.$isInitiated.andReturn(false);
            this.scope.requisition.$isRejected.andReturn(false);
            this.scope.requisition.$isInApproval.andReturn(false);
            this.scope.requisition.$isAuthorized.andReturn(true);

            var cell = angular.element(this.getCompiledElement().children()[0]);

            expect(cell.text()).toEqual('readOnlyFieldValue');
        });

        it('should produce editable cell if user has no right to approve', function() {
            this.scope.column.name = this.TEMPLATE_COLUMNS.APPROVED_QUANTITY;

            this.scope.requisition.$isSubmitted.andReturn(true);
            this.scope.requisition.$isApproved.andReturn(false);
            this.scope.requisition.$isReleased.andReturn(false);
            this.scope.requisition.$isInApproval.andReturn(false);
            this.scope.requisition.$isAuthorized.andReturn(false);

            var cell = angular.element(this.getCompiledElement().children()[0]);

            expect(cell.text()).not.toEqual('readOnlyFieldValue');
        });

        it('should produce editable cell', function() {
            this.scope.requisition.$isInitiated.andReturn(true);
            this.scope.requisition.$isRejected.andReturn(false);
            this.scope.requisition.$isApproved.andReturn(false);
            this.scope.requisition.$isReleased.andReturn(false);
            this.scope.requisition.$isAuthorized.andReturn(false);
            this.scope.requisition.$isInApproval.andReturn(false);

            var cell = angular.element(this.getCompiledElement().children()[0]);

            expect(cell.text()).not.toEqual('readOnlyFieldValue');
        });

        it('should return false if initiated and user can submit', function() {
            this.scope.requisition.$isInitiated.andReturn(true);
            this.scope.requisition.$isRejected.andReturn(false);
            this.scope.requisition.$isApproved.andReturn(false);
            this.scope.requisition.$isReleased.andReturn(false);
            this.scope.requisition.$isAuthorized.andReturn(false);
            this.scope.requisition.$isInApproval.andReturn(false);

            this.userAlwaysHasRight = false;
            this.userHasCreateRight = false;

            var cell = angular.element(this.getCompiledElement().children()[0]);

            expect(cell.text()).toEqual('readOnlyFieldValue');

            this.userHasCreateRight = true;

            cell = angular.element(this.getCompiledElement().children()[0]);

            expect(cell.text()).not.toEqual('readOnlyFieldValue');
        });

        it('should return false if rejected and user can submit', function() {
            this.scope.requisition.$isInitiated.andReturn(false);
            this.scope.requisition.$isRejected.andReturn(true);
            this.scope.requisition.$isApproved.andReturn(false);
            this.scope.requisition.$isReleased.andReturn(false);
            this.scope.requisition.$isAuthorized.andReturn(false);
            this.scope.requisition.$isInApproval.andReturn(false);

            this.userAlwaysHasRight = false;
            this.userHasCreateRight = false;

            var cell = angular.element(this.getCompiledElement().children()[0]);

            expect(cell.text()).toEqual('readOnlyFieldValue');

            this.userHasCreateRight = true;

            cell = angular.element(this.getCompiledElement().children()[0]);

            expect(cell.text()).not.toEqual('readOnlyFieldValue');
        });

        it('should return false if submitted and user can approve', function() {
            this.scope.requisition.$isInitiated.andReturn(false);
            this.scope.requisition.$isSubmitted.andReturn(true);
            this.scope.requisition.$isApproved.andReturn(false);
            this.scope.requisition.$isReleased.andReturn(false);
            this.scope.requisition.$isAuthorized.andReturn(false);
            this.scope.requisition.$isInApproval.andReturn(false);

            this.userAlwaysHasRight = false;

            var cell = angular.element(this.getCompiledElement().children()[0]);

            expect(cell.text()).toEqual('readOnlyFieldValue');

            this.userHasAuthorizedRight = true;

            cell = angular.element(this.getCompiledElement().children()[0]);

            expect(cell.text()).not.toEqual('readOnlyFieldValue');
        });

        it('should return true if column is beginning balance', function() {
            this.scope.column.name = this.TEMPLATE_COLUMNS.BEGINNING_BALANCE;

            this.scope.requisition.$isApproved.andReturn(false);
            this.scope.requisition.$isReleased.andReturn(false);
            this.scope.requisition.$isInApproval.andReturn(false);
            this.scope.requisition.$isAuthorized.andReturn(false);

            var cell = angular.element(this.getCompiledElement().children()[0]);

            expect(cell.text()).toEqual('readOnlyFieldValue');
        });

        it('should return true for non approval column if in approval and for tb program', function() {
            this.scope.column.name = this.TEMPLATE_COLUMNS.BEGINNING_BALANCE;

            this.scope.requisition.$isInApproval.andReturn(true);
            this.scope.requisition.program.code = 'tb';

            var cell = angular.element(this.getCompiledElement().children()[0]);

            expect(cell.text()).toEqual('readOnlyFieldValue');
        });

        it('should return false for approved quantity column if in approval and for tb program', function() {
            this.scope.column.name = this.TEMPLATE_COLUMNS.APPROVED_QUANTITY;

            this.scope.requisition.$isInApproval.andReturn(true);
            this.scope.requisition.program.code = 'tb';

            var cell = angular.element(this.getCompiledElement().children()[0]);

            expect(cell.text()).not.toEqual('readOnlyFieldValue');
        });

        it('should return false for remarks column if in approval and for tb program', function() {
            this.scope.column.name = this.TEMPLATE_COLUMNS.REMARKS;

            this.scope.requisition.$isInApproval.andReturn(true);
            this.scope.requisition.program.code = 'tb';

            var cell = angular.element(this.getCompiledElement().children()[0]);

            expect(cell.text()).not.toEqual('readOnlyFieldValue');
        });

    });
    // --- ends here ---

    describe('Skip Column', function() {

        var skipColumn, element;

        beforeEach(function() {
            skipColumn = new this.RequisitionColumnDataBuilder().buildSkipColumn();
            this.scope.column = skipColumn;
        });

        it('should be always disabled if user can not edit', function() {
            this.scope.userCanEdit = false;
            this.scope.lineItem.canBeSkipped.andReturn(true);
            this.authorizationService.hasRight.andReturn(false);

            element = this.getCompiledElement();

            expect(getSkipInput().attr('disabled')).toBe('disabled');

            this.scope.lineItem.canBeSkipped.andReturn(false);
            this.scope.$digest();

            expect(getSkipInput().attr('disabled')).toBe('disabled');

            this.scope.lineItem.canBeSkipped.andReturn(true);
            this.scope.$digest();

            expect(getSkipInput().attr('disabled')).toBe('disabled');
        });

        it('should change disabled state if lineItem changes its skipability and user has right to edit', function() {
            this.scope.userCanEdit = true;
            this.scope.lineItem.canBeSkipped.andReturn(true);

            element = this.getCompiledElement();

            expect(getSkipInput().attr('disabled')).toBe(undefined);

            this.scope.lineItem.canBeSkipped.andReturn(false);
            this.scope.$digest();

            expect(getSkipInput().attr('disabled')).toBe('disabled');

            this.scope.lineItem.canBeSkipped.andReturn(true);
            this.scope.$digest();

            expect(getSkipInput().attr('disabled')).toBe(undefined);
        });

        function getSkipInput() {
            return element.find('input.skip');
        }

    });

    function getCompiledElement() {
        var rootElement = angular.element('<div><div product-grid-cell requisition="requisition" column="column"' +
            ' line-item="lineItem" user-can-edit="userCanEdit" can-approve="canApprove"></div></div>');
        var compiledElement = this.$compile(rootElement)(this.scope);
        angular.element('body').append(compiledElement);
        this.scope.$digest();
        return compiledElement;
    }
});
