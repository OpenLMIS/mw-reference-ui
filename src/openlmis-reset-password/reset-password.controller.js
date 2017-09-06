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
     * @name openlmis-reset-password.controller:ResetPasswordController
     *
     * @description
     * Controller that drives the forgot password form.
     */
    angular
        .module('openlmis-reset-password')
        .controller('ResetPasswordController', ResetPasswordController);

    ResetPasswordController.$inject = [
        '$stateParams', 'loginService', 'alertService', 'modalDeferred'
    ];

    function ResetPasswordController($stateParams, loginService, alertService, modalDeferred) {
        var vm = this;

        vm.changePassword = changePassword;
        vm.cancel = modalDeferred.reject;

        /**
         * @ngdoc method
         * @methodOf openlmis-reset-password.controller:ResetPasswordController
         * @name changePassword
         *
         * @description
         * Checks if both passwords are valid and sends change password request to server.
         */
        function changePassword() {
            if(arePasswordsValid()) {
                loginService.changePassword(vm.password, $stateParams.token).then(function() {
                    alertService.success('openlmisResetPassword.passwordReset.success')
                        .finally(modalDeferred.resolve);
                }, function() {
                    vm.error = 'openlmisResetPassword.passwordReset.failure';
                });
            }
        }

        function arePasswordsValid() {
            var regex = /\d/g;

            if(vm.password !== vm.reenteredPassword) {
                vm.error = 'openlmisResetPassword.passwordMismatch';
                return false;
            } else if(vm.password.length < 8) {
                vm.error = 'openlmisResetPassword.passwordTooShort';
                return false;
            } else if(!regex.test(vm.password)) {
                vm.error = 'openlmisResetPassword.passwordMustContainNumber';
                return false;
            }
            return true;
        }
    }
}());
