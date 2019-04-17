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

describe('ReportGenerateController', function() {

    var vm, $controller, $q, $scope;

    var report = {
        id: '86f7b7b6-41b2-4f5c-8c93-389cc4bdec65'
    };

    beforeEach(function() {
        module('report');

        module(function($provide) {
            accessTokenFactorySpy = jasmine.createSpyObj('accessTokenFactory', ['addAccessToken']);
            reportUrlFactorySpy = jasmine.createSpyObj('reportUrlFactory', ['buildUrl']);

            $provide.service('reportUrlFactory', function() {
                return reportUrlFactorySpy;
            });

            $provide.service('accessTokenFactory', function() {
                return accessTokenFactorySpy;
            });
        });

        inject(function($injector) {
            $controller = $injector.get('$controller');
            $q = $injector.get('$q');
            $scope = $injector.get('$rootScope').$new();
        });
    });

    describe('onInit', function() {

        it('should set formats to the ones that report supports', function() {
            report.supportedFormats = ['pdf', 'html', 'asd'];
            initiateController();

            expect(vm.formats).toEqual(['pdf', 'html']);
        });

        it('should set formats to defaults if none supported', function() {
            report.supportedFormats = [];
            initiateController();

            expect(vm.formats).toEqual(['pdf', 'csv', 'xls', 'html']);
        });

        it('the default selected format should be the first one supported', function() {
            report.supportedFormats = ['html', 'xls'];
            initiateController();

            expect(vm.format).toEqual('html');
        });
    });

    function initiateController() {
        vm = $controller('ReportGenerateController', {
            $scope: $scope,
            report: report,
            reportParamsOptions: {}
        });
        vm.$onInit();
    }

});
