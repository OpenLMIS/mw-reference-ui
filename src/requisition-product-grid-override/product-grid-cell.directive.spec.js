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
ddescribe('ProductGridCell Override', function() {

    var scope, $compile, REQUISITION_STATUS;

    beforeEach(module('openlmis-templates'));
    beforeEach(module('requisition'));
    beforeEach(module('requisition-product-grid-override'));

    beforeEach(inject(function($rootScope, Requisition, COLUMN_TYPES, COLUMN_SOURCES, TEMPLATE_COLUMNS, _REQUISITION_STATUS_) {
        REQUISITION_STATUS = _REQUISITION_STATUS_;

        scope = $rootScope.$new();

        scope.requisition = new Requisition({
            template: {
                columnsMap: []
            },
            program: {
                code: 'example'
            },
            requisitionLineItems: []
        });

        // NOTE THIS IS AN APPROVAL COLUMN
        scope.column = {
            type: COLUMN_TYPES.NUMERIC,
            name: TEMPLATE_COLUMNS.APPROVED_QUANTITY,
            source: COLUMN_SOURCES.USER_INPUT
        };

        scope.lineItem = {
            $errors: {},
            getFieldValue: function() {
                return "readOnlyFieldValue";
            }
        };
    }));

    beforeEach(inject(function(authorizationService){
        spyOn(authorizationService, 'hasRight').andReturn(true);
    }));

    beforeEach(inject(function(_$compile_) {
        $compile = _$compile_;
    }));

    function makeElement() {
        var markup = '<div><div product-grid-cell requisition="requisition" column="column" line-item="lineItem"></div></div>',
            element = $compile(markup)(scope);
        scope.$apply();
        return element;
    }

    it('should produce read-only cell if requisition is in approval', function() {
        scope.requisition.status = REQUISITION_STATUS.IN_APPROVAL;

        var directiveElem = makeElement();

        expect(directiveElem.html()).toContain("readOnlyFieldValue");
        expect(directiveElem.find("input").length).toEqual(0);
    });

    it('makes editable cell if requisition status is submitted', function() {
        scope.requisition.status = REQUISITION_STATUS.SUBMITTED;

        var directiveElem = makeElement();

        expect(directiveElem.html()).not.toContain("readOnlyFieldValue");
        expect(directiveElem.find("input").length).toEqual(1);
    });

});
