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
     * @name openlmis-rights.ADMINISTRATION_RIGHTS
     *
     * @description
     * This is constant for administration rights.
     */
    angular
        .module('openlmis-rights')
        .constant('ADMINISTRATION_RIGHTS', rights());

    function rights() {
        return {
            USERS_MANAGE: 'USERS_MANAGE',
            FACILITIES_MANAGE: 'FACILITIES_MANAGE',
            ORDERABLES_MANAGE: 'ORDERABLES_MANAGE',
            SUPERVISORY_NODES_MANAGE: 'SUPERVISORY_NODES_MANAGE',
            REQUISITION_GROUPS_MANAGE: 'REQUISITION_GROUPS_MANAGE',
            GEOGRAPHIC_ZONES_MANAGE: 'GEOGRAPHIC_ZONES_MANAGE',
            SUPPLY_LINES_MANAGE: 'SUPPLY_LINES_MANAGE',
            SUPPLY_PARTNERS_MANAGE: 'SUPPLY_PARTNERS_MANAGE',
            SYSTEM_IDEAL_STOCK_AMOUNTS_MANAGE: 'SYSTEM_IDEAL_STOCK_AMOUNTS_MANAGE',
            SERVICE_ACCOUNTS_MANAGE: 'SERVICE_ACCOUNTS_MANAGE',
            PROCESSING_SCHEDULES_MANAGE: 'PROCESSING_SCHEDULES_MANAGE',
            SYSTEM_NOTIFICATIONS_MANAGE: 'SYSTEM_NOTIFICATIONS_MANAGE',
            FACILITY_APPROVED_ORDERABLES_MANAGE: 'FACILITY_APPROVED_ORDERABLES_MANAGE'
        };
    }

})();
