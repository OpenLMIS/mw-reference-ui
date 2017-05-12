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

describe('RequisitionApprovalListController', function () {

    //injects
    var vm, $state, $stateParams, notificationService, $controller, offlineService, confirmService, $rootScope, $q;

    //variables
    var requisitions, programs, confirmDeferred;

    beforeEach(function() {
        module('requisition-approval');

        inject(function (_$controller_, _$state_, _$stateParams_, _notificationService_,
                         _offlineService_, _confirmService_, _$rootScope_, _$q_) {

            $controller = _$controller_;
            $state = _$state_;
            $stateParams = _$stateParams_;
            notificationService = _notificationService_;
            offlineService = _offlineService_;
            confirmService = _confirmService_;
            $rootScope = _$rootScope_;
            $q = _$q_;

            programs = [
                {
                    id: '1',
                    code: 'PRG001',
                    name: 'Family Planning'
                },
                {
                    id: '2',
                    code: 'PRG002',
                    name: 'Essential Meds'
                }
            ];

            requisitions = [
                {
                    id: 1,
                    facility: {
                        name: 'first facility',
                        code: 'first code'
                    },
                    program: programs[0]

                },
                {
                    id: 2,
                    facility: {
                        name: 'second facility',
                        code: 'second code'
                    },
                    program: programs[1]

                }
            ];
        });
    });

    describe('$onInit', function() {

        beforeEach(function() {
            initController();
        });

        it('should expose requisitions', function() {
            vm.$onInit();
            expect(vm.requisitions).toBe(requisitions);
        });

        it('should expose programs', function() {
            vm.$onInit();
            expect(vm.programs).toBe(programs);
        });

        it('should expose selected program', function() {
            vm.$onInit();
            expect(vm.selectedProgram).toBe(programs[0]);
        });

        it('should expose offline flag', function() {
            vm.$onInit();
            expect(vm.offline).toBe(false);
        });

    });

    describe ('search', function() {

        beforeEach(function() {
            initController();

            spyOn($state, 'go');
        });

        it('should set program', function() {
            vm.selectedProgram = programs[0];

            vm.search();

            expect($state.go).toHaveBeenCalledWith('openlmis.requisitions.approvalList', {
                program: vm.selectedProgram.id,
                offline: false
            }, {reload: true});
        });

        it('should set offline flag correctly', function() {
            vm.selectedProgram = programs[0];
            vm.offline = true;

            vm.search();

            expect($state.go).toHaveBeenCalledWith('openlmis.requisitions.approvalList', {
                program: vm.selectedProgram.id,
                offline: true
            }, {reload: true});
        });


        it('should reload state', function() {
            vm.search();

            expect($state.go).toHaveBeenCalled();
        });
    });


    describe ('openRnr', function() {

        beforeEach(function() {
            initController();

            spyOn($state, 'go');
        });

        it('should go to fullSupply state', function () {
            vm.openRnr(requisitions[0].id);

            expect($state.go).toHaveBeenCalledWith('openlmis.requisitions.requisition.fullSupply', {rnr: requisitions[0].id});
        });
    });

    describe('viewSelectedRequisitions', function() {

        beforeEach(function() {
            initController();

            spyOn($state, 'go');
            spyOn(notificationService, 'error');
        });

        it('should show error when trying to call with no requisition selected', function() {
            vm.viewSelectedRequisitions();

            expect($state.go).not.toHaveBeenCalled();
            expect(notificationService.error).toHaveBeenCalledWith('requisitionApproval.selectAtLeastOneRnr');
        });

        it('should not show error when trying to call with requisition selected', function() {
            vm.requisitions[0].$selected = true;

            vm.viewSelectedRequisitions();

            expect($state.go).toHaveBeenCalledWith('openlmis.requisitions.batchApproval', {
                requisitions: [ vm.requisitions[0] ]
            });
            expect(notificationService.error).not.toHaveBeenCalled();
        });
    });

    describe ('isOfflineDisabled', function() {

        beforeEach(function() {
            initController();
        });

        it('should return true if application is offline', function () {
            vm.offline = false;
            spyOn(offlineService, 'isOffline').andReturn(true);

            expect(vm.isOfflineDisabled()).toBe(true);
            expect(vm.offline).toBe(true);
        });

        it('should return false if application is online', function () {
            vm.offline = false;
            spyOn(offlineService, 'isOffline').andReturn(false);

            expect(vm.isOfflineDisabled()).toBe(false);
            expect(vm.offline).toBe(false);
        });
    });

    describe ('removeOfflineRequisition', function() {

        beforeEach(function() {
           initController();
           confirmDeferred = $q.defer();
           spyOn(confirmService, 'confirmDestroy').andReturn(confirmDeferred.promise);
        });

        it('should ask for confirmation before removing', function () {
            vm.removeOfflineRequisition(vm.requisitions[0]);

            confirmDeferred.resolve();
            $rootScope.$apply();

            expect(confirmService.confirmDestroy).toHaveBeenCalledWith('requisitionApproval.removeOfflineRequisitionConfirm');
        });

        it('should set false for requisition $availableOffline flag', function () {
            vm.requisitions[0].$availableOffline = true;
            vm.removeOfflineRequisition(vm.requisitions[0]);

            confirmDeferred.resolve();
            $rootScope.$apply();

            expect(vm.requisitions[0].$availableOffline).toBe(false);
        });

    });

    function initController() {
        vm = $controller('RequisitionApprovalListController', {
            requisitions: requisitions,
            programs: programs,
            selectedProgram: programs[0]
        });
        vm.$onInit();
    }
});
