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

(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name requisition-validation-override.requisitionValidator
     *
     * @description
     * Adds error message to totalRecievedQuantity field.
     */
    angular.module('requisition-validation-override')
        .config(config);

    config.$inject = ['$provide'];

    function config($provide) {
        $provide.decorator('requisitionValidator', decorator);
    }

    decorator.$inject = ['$delegate', 'TEMPLATE_COLUMNS', 'messageService'];

    function decorator($delegate, TEMPLATE_COLUMNS, messageService) {
        var originalValidateLineItem = $delegate.validateLineItem;

        $delegate.validateLineItem = validateLineItem;

        return $delegate;


        /**
         * @ngdoc method
         * @methodOf requisition-validation-override.requisitionValidator
         * @name  validateLineItem
         *
         * @description
         * Will set the error message to total recieved quantity if both stock on
         * hand and totalConsumedQuantity both have validation errors for
         * requisitionValidation.calculationMismatch.
         * 
         * @param  {Object} lineItem    Line item to validate
         * @param  {Array}  columns     Columns in line item that need validation
         * @param  {Object} requisition Requisition being validated
         * @return {Boolean}            True if lineItem is valid
         */
        function validateLineItem(lineItem, columns, requisition) {
            var response = originalValidateLineItem.apply($delegate, arguments),
                mismatchError = messageService.get('requisitionValidation.calculationMismatch'),
                stockOnHandError = (lineItem.$errors[TEMPLATE_COLUMNS.STOCK_ON_HAND] === mismatchError),
                totalConsumedQuantityError = (lineItem.$errors[TEMPLATE_COLUMNS.TOTAL_CONSUMED_QUANTITY] === mismatchError);
            
            if(!lineItem.$errors[TEMPLATE_COLUMNS.TOTAL_RECEIVED_QUANTITY] && stockOnHandError && totalConsumedQuantityError) {
                lineItem.$errors[TEMPLATE_COLUMNS.TOTAL_RECEIVED_QUANTITY] = mismatchError;
            }

            return response;
        }
    };

})();
