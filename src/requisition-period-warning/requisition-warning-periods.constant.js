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
     * @ngdoc object
     * @name requisition-constants.REQUISITION_SUBMISSION_WARNING_PROGRAM_CODE
     *
     * @description
     * This program code will show a different submission warning.
     */
    angular
    .module('requisition-constants')
    .constant('REQUISITION_WARNING_PERIODS', source());

    function source() {
        var months = [];
        var monthsStr = "@@REQUISITION_WARNING_PERIODS";
        if(monthsStr.substr(0,2) != '@@') {
            monthsStr.split(',').forEach(function(month){
                months.push(month);
            });
        }

        return months;
    }

})();