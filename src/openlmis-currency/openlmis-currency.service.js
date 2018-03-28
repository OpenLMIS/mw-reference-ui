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
     * @name openlmis-currency.currencyService
     *
     * @description
     * Responsible for retrieving currency settings from server.
     */
    angular
        .module('openlmis-currency')
        .service('currencyService', service);

    service.$inject = ['$q', '$resource', 'openlmisUrlFactory', 'localStorageService'];

    function service($q, $resource, openlmisUrlFactory, localStorageService) {

        var resource = $resource(openlmisUrlFactory('/api/currencySettings'));

        this.getFromStorage = getFromStorage;
        this.getCurrencySettings = getCurrencySettings;
        this.getCurrencySettingsFromConfig = getCurrencySettingsFromConfig;

        /**
         * @ngdoc method
         * @methodOf openlmis-currency.currencyService
         * @name getCurrencySettings
         *
         * @description
         * Retrieves currency settings from reference data.
         *
         * @return {Promise} promise that resolves when settings are taken.
         */
        function getCurrencySettings() {
            var deferred = $q.defer(), currencySettings = {};

            // Malawi: always get currency settings from config
            getCurrencySettingsFromConfig();
            deferred.resolve();
            // --- ends here ---

            return deferred.promise;
        }

        /**
         * @ngdoc method
         * @methodOf openlmis-currency.currencyService
         * @name getCurrencySettingsFromConfig
         *
         * @description
         * Retrieves currency settings from config file.
         */
        function getCurrencySettingsFromConfig () {
            var currencySettings = {};

            currencySettings['currencyCode'] = 'MWK';
            currencySettings['currencySymbol'] = 'MK';
            currencySettings['currencySymbolSide'] = 'right';
            currencySettings['currencyDecimalPlaces'] = parseInt('2');
            currencySettings['groupingSeparator'] = ',';
            currencySettings['groupingSize'] = parseInt('3');
            currencySettings['decimalSeparator'] = '.';
            localStorageService.add('currencySettings', angular.toJson(currencySettings));
        }

        /**
         * @ngdoc method
         * @methodOf openlmis-currency.currencyService
         * @name getFromStorage
         *
         * @description
         * Retrieves currency settings from the local storage.
         *
         * @return {Object} currency settings.
         */
        function getFromStorage() {
            return angular.fromJson(localStorageService.get('currencySettings'));
        }
    }

})();
