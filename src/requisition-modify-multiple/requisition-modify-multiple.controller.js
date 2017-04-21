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
     * @ngdoc controller
     * @name requisition-modify-multiple.controller:RequisitionModifyMultipleController
     *
     * @description
     * Controller for approval list of requisitions.
     */

    angular
        .module('requisition-modify-multiple')
        .controller('RequisitionModifyMultipleController', controller);

    controller.$inject = [
        '$controller', '$state', '$stateParams', '$filter'
    ];

    function controller($controller, $state, $stateParams, $filter) {

        var vm = this;

        vm.$onInit = onInit;

        /**
         * @ngdoc property
         * @propertyOf requisition-modify-multiple.controller:RequisitionModifyMultipleController
         * @name requisitions
         * @type {Array}
         *
         * @description
         * Holds requisition that will be displayed on screen.
         */
        vm.requisitions = undefined;


        /**
         * @ngdoc method
         * @methodOf requisition-modify-multiple.controller:RequisitionModifyMultipleController
         * @name $onInit
         *
         * @description
         * Initialization method called after the controller has been created. Responsible for
         * setting data to be available on the view.
         */
        function onInit() {
            vm.requisitions = $stateParams.requisitions;
        }
    }

})();
