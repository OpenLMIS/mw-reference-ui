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

describe('requisition-validation-override.requisitionValidator', function() {
    var requisitionValidator, TEMPLATE_COLUMNS, requisition, columns, lineItem, presetErrors;

    beforeEach(module('requisition-validation-override'));

    beforeEach(inject(function($injector) {
        requisitionValidator = $injector.get('requisitionValidator');
        TEMPLATE_COLUMNS = $injector.get('TEMPLATE_COLUMNS');

        presetErrors = {};

        spyOn(requisitionValidator, 'validateLineItemField').andCallFake(function(lineItem, column) {
            if(presetErrors[column.name]) {
                lineItem.$errors[column.name] = presetErrors[column.name];
                return false;
            }
            return true;
        });
    }));

    beforeEach(function(){
        columns = [{
            name: TEMPLATE_COLUMNS.TOTAL_CONSUMED_QUANTITY
        }, {
            name: TEMPLATE_COLUMNS.TOTAL_RECEIVED_QUANTITY
        }, {
            name: TEMPLATE_COLUMNS.STOCK_ON_HAND
        }, {
            name: 'anotherField'
        }];

        lineItem = {
            $errors: {}
        }

        requisition = {};
    });

    it('validateLineItem adds error message to TOTAL_RECEIVED_QUANTITY if TOTAL_CONSUMED_QUANTITY and STOCK_ON_HAND are calculationMismatch', function() {
        presetErrors[TEMPLATE_COLUMNS.TOTAL_CONSUMED_QUANTITY] = 'requisitionValidation.calculationMismatch';
        presetErrors[TEMPLATE_COLUMNS.STOCK_ON_HAND] ='requisitionValidation.calculationMismatch';

        requisitionValidator.validateLineItem(lineItem, columns, requisition);

        expect(lineItem.$errors[TEMPLATE_COLUMNS.TOTAL_RECEIVED_QUANTITY]).toBe('requisitionValidation.calculationMismatch');
    });

    it('validateLineItem will not set TOTAL_RECEIVED_QUANTITY error if already set', function() {
        presetErrors[TEMPLATE_COLUMNS.TOTAL_CONSUMED_QUANTITY] = 'requisitionValidation.calculationMismatch';
        presetErrors[TEMPLATE_COLUMNS.STOCK_ON_HAND] ='requisitionValidation.calculationMismatch';
        presetErrors[TEMPLATE_COLUMNS.TOTAL_RECEIVED_QUANTITY] = 'fakeError';

        requisitionValidator.validateLineItem(lineItem, columns, requisition);

        expect(lineItem.$errors[TEMPLATE_COLUMNS.TOTAL_RECEIVED_QUANTITY]).toBe('fakeError');
    });


 });
