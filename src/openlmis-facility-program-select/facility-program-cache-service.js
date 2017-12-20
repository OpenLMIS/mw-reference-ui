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
     * @name openlmis-facility-program-select.facilityProgramCacheService
     *
     * @description
     * Service responsible for retrieving cached data for openlmis-facility-program-select component.
     */
    angular
        .module('openlmis-facility-program-select')
        .service('facilityProgramCacheService', service);

    service.$inject = ['$q', 'programService', 'authorizationService', 'facilityService', 'referencedataUserService', 'permissionService'];

    function service($q, programService, authorizationService, facilityService, referencedataUserService, permissionService) {

        var modulesWithRights = {},
            facilities = [],
            programs = [],
            permissions = [],
            homeFacility;

        this.loadData = loadData;
        this.getUserHomeFacility = getUserHomeFacility;
        this.getUserPrograms = getUserPrograms;
        this.getSupervisedFacilities = getSupervisedFacilities;
        this.pushRightsForModule = pushRightsForModule;

        /**
         * @ngdoc method
         * @methodOf openlmis-facility-program-select.facilityProgramCacheService
         * @name getUserHomeFacility
         *
         * @description
         * Returns cached minimal representation of user home facility.
         *
         * @return {Object} user home facility
         */
        function getUserHomeFacility() {
            return homeFacility;
        }

        /**
         * @ngdoc method
         * @methodOf openlmis-facility-program-select.facilityProgramCacheService
         * @name getUserPrograms
         *
         * @description
         * Returns all cached user supervised programs.
         *
         * @return {Array} user supervised programs
         */
        function getUserPrograms() {
            return programs;
        }

        /**
         * @ngdoc method
         * @methodOf openlmis-facility-program-select.facilityProgramCacheService
         * @name getSupervisedFacilities
         *
         * @description
         * Returns all cached user supervised facilities
         * filtered by program and rights stored for current module.
         *
         * @param  {String} moduleName name of current module
         * @param  {String} programId  program id for filtering
         * @return {Array}             user supervised facilities
         */
        function getSupervisedFacilities(moduleName, programId) {
            var rights;

            if (modulesWithRights[moduleName]) {
                rights = modulesWithRights[moduleName];
            } else {
                rights = [];
                for (var module in modulesWithRights) {
                    rights = rights.concat(modulesWithRights[module]);
                }
            }

            var facilityIds = [];
            permissions.forEach(function(permission) {
                if (rights.indexOf(permission.right) !== -1 && programId === permission.programId) {
                    facilityIds.push(permission.facilityId);
                }
            });

            // undefined or null in this list indicates that user has right without defined facilityId,
            // so it means that he supervise all facilities
            if (facilityIds.indexOf(undefined) !== -1 || facilityIds.indexOf(null) !== -1) {
                return facilities;
            } else {
                var result = [];
                facilities.forEach(function(facility) {
                    if (facility.enabled && facility.active && facilityIds.indexOf(facility.id) !== -1) {
                        result.push(facility);
                    }
                });
                return result;
            }
        }

        /**
         * @ngdoc method
         * @methodOf openlmis-facility-program-select.facilityProgramCacheService
         * @name pushRightsForModule
         *
         * @description
         * Module can load set of rights that will be used to fetch supervised facilities.
         *
         * @param {String} moduleName name that will be used to get specified rights
         * @param {Array}  rightArray array of rights
         */
        function pushRightsForModule(moduleName, rightArray) {
            modulesWithRights[moduleName] = rightArray;
        }

        /**
         * @ngdoc method
         * @methodOf openlmis-facility-program-select.facilityProgramCacheService
         * @name loadData
         *
         * @description
         * Loads all cached data for this module, like facilities, programs and permission strings.
         * It have to be called before using other methods except pushRightsForModule.
         *
         * @return {Promise} promise that resolves after successful load
         */
        function loadData() {
            var userId = authorizationService.getUser().user_id;

            return $q.all([
                facilityService.getAllMinimal(),
                programService.getUserPrograms(),
                permissionService.load(userId)
            ])
                .then(function(responses) {
                    facilities = responses[0];
                    programs = responses[1];
                    permissions = responses[2];

                    return referencedataUserService.get(userId);
                })
                .then(function(user) {
                    homeFacility = getFacilityById(user.homeFacilityId);
                });
        }

        function getFacilityById(id) {
            return facilities.filter(function(facility) {
                return facility.enabled && facility.active && facility.id === id;
            })[0];
        }
    }

})();
