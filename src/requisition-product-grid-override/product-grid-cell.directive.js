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
     * @ngdoc directive
     * @restrict A
     * @name requisition-product-grid-override.directive:productGridCell
     *
     * @description
     * A requisition product gird cell is non-editable when it has status
     * IN_APPROVAL.
     */
    angular
        .module('requisition-product-grid-override')
        .config(config);


    config.$inject = ['$provide'];
    function config($provide) {
        $provide.decorator('productGridCellDirective', decorateDirective);
    }

    decorateDirective.$inject = ['$delegate'];
    function decorateDirective($delegate) {
        var directive = $delegate[0],
            originalLinkFn = directive.link;

        directive.link = newLink;

        return [directive];

        function newLink(scope, element, attrs){
            originalLinkFn.apply(directive, arguments);

            var originalIsReadOnly = scope.isReadOnly;
            scope.isReadOnly = newIsReadOnly;

            /**
             * @ngdoc method
             * @methodOf requisition-product-grid-override.directive:productGridCell
             * @name newIsReadOnly
             *
             * @description
             * Changes the isReadOnly scope property to be true if the
             * requisition is in the in approval state, no matter which column
             * or authorization rights the user has.
             */
            function newIsReadOnly() {
                if(scope.requisition.$isInApproval()) {
                    return true;
                } else {
                    return originalIsReadOnly();
                }
            }
        }
    }

})();
