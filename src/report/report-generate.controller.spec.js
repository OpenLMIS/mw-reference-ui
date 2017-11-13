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

    var report = {'id': '86f7b7b6-41b2-4f5c-8c93-389cc4bdec65'};

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

        vm = $controller('ReportGenerateController', {
            $scope: $scope,
            report: report,
            reportParamsOptions: {}
        });
    });

    describe('onInit', function() {

        it('the default format should be pdf', function() {
            vm.$onInit();

            expect(vm.format).toEqual('pdf');
        });

        it('should set default format to csv for Pick Work Sheet report', function() {
            report.id = 'afbd56e8-bc66-446a-a947-810971f68aef';
            vm.report = report;
            vm.$onInit();

            expect(vm.format).toEqual('csv');
        });
    });

});
