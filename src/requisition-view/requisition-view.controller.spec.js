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

describe('RequisitionViewController', function() {

    var $scope, $q, $state, notificationService, alertService, confirmService, vm, requisition,
        loadingModalService, deferred, requisitionUrlFactoryMock, requisitionValidatorMock,
        fullSupplyItems, nonFullSupplyItems, authorizationServiceSpy, confirmSpy,
        REQUISITION_RIGHTS, accessTokenFactorySpy, $window, stateTrackerService, messageService,
        RequisitionStockCountDateModal, RequisitionWatcher, watcher;

    beforeEach(function() {
        module('requisition-view');

        module(function($provide) {

            confirmSpy = jasmine.createSpyObj('confirmService', ['confirm', 'confirmDestroy']);

            authorizationServiceSpy = jasmine.createSpyObj('authorizationService', ['hasRight', 'isAuthenticated']);
            accessTokenFactorySpy = jasmine.createSpyObj('accessTokenFactory', ['addAccessToken']);

            requisitionValidatorMock = jasmine.createSpyObj('requisitionValidator', [
                'areLineItemsValid',
                'validateRequisition',
                'areAllLineItemsSkipped'
            ]);
            requisitionUrlFactoryMock = jasmine.createSpy();

            $provide.service('confirmService', function() {
                return confirmSpy;
            });

            $provide.service('authorizationService', function() {
                return authorizationServiceSpy;
            });

            $provide.service('accessTokenFactory', function() {
                return accessTokenFactorySpy;
            });

            $provide.factory('requisitionUrlFactory', function() {
                return requisitionUrlFactoryMock;
            });

            $provide.factory('requisitionValidator', function() {
                return requisitionValidatorMock;
            });

            RequisitionStockCountDateModal = jasmine.createSpy('RequisitionStockCountDateModal');
            $provide.factory('RequisitionStockCountDateModal', function() {
                return RequisitionStockCountDateModal;
            });

            RequisitionWatcher = jasmine.createSpy('RequisitionWatcher').andCallFake(function() {
                watcher = {
                    enabled: true,
                    disableWatcher: jasmine.createSpy()
                };
                return watcher;
            });
            $provide.factory('RequisitionWatcher', function() {
                return RequisitionWatcher;
            });
        });

        inject(function($injector) {
            $scope = $injector.get('$rootScope').$new();
            $state = $injector.get('$state');
            $q = $injector.get('$q');
            $window = $injector.get('$window');
            notificationService = $injector.get('notificationService');
            alertService = $injector.get('alertService');
            confirmService = $injector.get('confirmService');
            loadingModalService = $injector.get('loadingModalService');
            REQUISITION_RIGHTS = $injector.get('REQUISITION_RIGHTS');
            stateTrackerService = $injector.get('stateTrackerService');
            messageService = $injector.get('messageService');

            confirmService.confirm.andCallFake(function() {
                return $q.when(true);
            });

            deferred = $q.defer();
            requisition = jasmine.createSpyObj('requisition',
                ['$skip', '$isInitiated', '$isSubmitted', '$isAuthorized', '$isInApproval', '$isReleased', '$isRejected', '$isSkipped', '$save', '$authorize', '$submit', '$remove', '$approve', '$reject']);
            requisition.id = '1';
            requisition.program = {
                id: '2',
                periodsSkippable: true,
                code: 'CODE',
                enableDatePhysicalStockCountCompleted: true
            };
            requisition.draftStatusMessage = 'New comment';
            requisition.$isInitiated.andReturn(true);
            requisition.$isReleased.andReturn(false);
            requisition.$isRejected.andReturn(false);
            requisition.$skip.andReturn(deferred.promise);
            requisition.$save.andReturn(deferred.promise);
            requisition.$authorize.andReturn(deferred.promise);
            spyOn(stateTrackerService, 'goToPreviousState');

            vm = $injector.get('$controller')('RequisitionViewController', {
                $scope: $scope,
                requisition: requisition
            });
        });

        requisitionUrlFactoryMock.andCallFake(function(url) {
            return 'http://some.url' + url;
        });

        fullSupplyItems = [{
            skipped: '',
            $program: {
                fullSupply: true
            }
        }];

        nonFullSupplyItems = [{
            skipped: '',
            $program: {
                fullSupply: false
            }
        }];

        requisition.requisitionLineItems = fullSupplyItems.concat(nonFullSupplyItems);
    });

    describe('$onInit', function() {

        it('should display skip button', function() {
            authorizationServiceSpy.hasRight.andReturn(true);

            vm.$onInit();

            expect(vm.canSkip).toBe(true);
        });

        it('should display skip button when requisition is rejected', function() {
            authorizationServiceSpy.hasRight.andReturn(true);
            requisition.$isInitiated.andReturn(false);
            requisition.$isRejected.andReturn(true);

            vm.$onInit();

            expect(vm.canSkip).toBe(true);
        });

        it('should not display skip button if user has no permission to create requisition', function() {
            authorizationServiceSpy.hasRight.andReturn(false);

            vm.$onInit();

            expect(vm.canSkip).toBe(false);
        });

        it('should not display skip button if program does not allow skipping periods', function() {
            authorizationServiceSpy.hasRight.andReturn(true);
            vm.requisition.program.periodsSkippable = false;

            vm.$onInit();

            expect(vm.canSkip).toBe(false);
        });

        it('should not display skip button if requisition has emergency type', function() {
            authorizationServiceSpy.hasRight.andReturn(true);
            vm.requisition.emergency = true;

            vm.$onInit();

            expect(vm.canSkip).toBe(false);
        });

        it('should display skip button if requisition is not in initiated status', function() {
            authorizationServiceSpy.hasRight.andReturn(true);
            vm.requisition.$isInitiated.andReturn(false);

            vm.$onInit();

            expect(vm.canSkip).toBe(false);
        });

        it('should display sync button when initiated', function() {
            authorizationServiceSpy.hasRight.andReturn(true);

            vm.requisition.$isInitiated.andReturn(true);
            vm.requisition.$isSubmitted.andReturn(false);
            vm.requisition.$isAuthorized.andReturn(false);
            vm.requisition.$isInApproval.andReturn(false);

            vm.$onInit();

            expect(vm.canSync).toBe(true);
        });

        it('should display sync button when rejected', function() {
            authorizationServiceSpy.hasRight.andReturn(true);

            vm.requisition.$isInitiated.andReturn(false);
            vm.requisition.$isSubmitted.andReturn(false);
            vm.requisition.$isAuthorized.andReturn(false);
            vm.requisition.$isInApproval.andReturn(false);
            vm.requisition.$isRejected.andReturn(true);

            vm.$onInit();

            expect(vm.canSync).toBe(true);
        });

        it('should display sync button when submitted', function() {
            authorizationServiceSpy.hasRight.andReturn(true);

            vm.requisition.$isInitiated.andReturn(false);
            vm.requisition.$isSubmitted.andReturn(true);
            vm.requisition.$isAuthorized.andReturn(false);
            vm.requisition.$isInApproval.andReturn(true);

            vm.$onInit();

            expect(vm.canSync).toBe(true);
        });

        it('should display sync button when authorized', function() {
            authorizationServiceSpy.hasRight.andReturn(true);

            vm.requisition.$isInitiated.andReturn(false);
            vm.requisition.$isSubmitted.andReturn(false);
            vm.requisition.$isAuthorized.andReturn(true);
            vm.requisition.$isInApproval.andReturn(true);

            vm.$onInit();

            expect(vm.canSync).toBe(true);
        });

        it('should display sync button in approval', function() {
            authorizationServiceSpy.hasRight.andReturn(true);

            vm.requisition.$isInitiated.andReturn(false);
            vm.requisition.$isSubmitted.andReturn(false);
            vm.requisition.$isAuthorized.andReturn(false);
            vm.requisition.$isInApproval.andReturn(true);

            vm.$onInit();

            expect(vm.canSync).toBe(true);
        });

        it('should not display sync button', function() {
            vm.requisition.$isInitiated.andReturn(false);
            vm.requisition.$isSubmitted.andReturn(false);
            vm.requisition.$isAuthorized.andReturn(false);
            vm.requisition.$isInApproval.andReturn(false);

            vm.$onInit();

            expect(vm.canSync).toBe(false);
        });

        it('should display delete button when initiated', function() {
            authorizationServiceSpy.hasRight.andReturn(true);

            vm.requisition.$isInitiated.andReturn(true);

            vm.$onInit();

            expect(vm.canDelete).toBe(true);
        });

        it('should display delete button when rejected', function() {
            authorizationServiceSpy.hasRight.andReturn(true);

            vm.requisition.$isInitiated.andReturn(false);
            vm.requisition.$isRejected.andReturn(true);

            vm.$onInit();

            expect(vm.canDelete).toBe(true);
        });


        it('should display delete button when submitted', function() {
            authorizationServiceSpy.hasRight.andReturn(true);

            vm.requisition.$isSubmitted.andReturn(true);

            vm.$onInit();

            expect(vm.canDelete).toBe(true);
        });

        it('should display delete button when skipped', function() {
            authorizationServiceSpy.hasRight.andReturn(true);

            vm.requisition.$isSkipped.andReturn(true);

            vm.$onInit();

            expect(vm.canDelete).toBe(true);
        });

        it('should not display delete button', function() {
            vm.$onInit();

            expect(vm.canDelete).toBe(false);
        });

    });

    it('should display message when successfully skipped requisition', function() {
        var notificationServiceSpy = jasmine.createSpy(),
            stateGoSpy = jasmine.createSpy(),
            loadingDeferred = $q.defer();


        spyOn(notificationService, 'success').andCallFake(notificationServiceSpy);
        spyOn(loadingModalService, 'open').andReturn(loadingDeferred.promise);
        spyOn($state, 'go').andCallFake(stateGoSpy);

        vm.skipRnr();

        deferred.resolve();
        $scope.$apply();
        loadingDeferred.resolve();
        $scope.$apply();

        expect(notificationServiceSpy).toHaveBeenCalledWith('requisitionView.skip.success');
        expect(stateTrackerService.goToPreviousState).toHaveBeenCalledWith('openlmis.requisitions.initRnr');
    });

    it('should display error message when skip requisition failed', function() {
        var notificationServiceSpy = jasmine.createSpy();

        spyOn(alertService, 'error').andCallFake(notificationServiceSpy);

        vm.skipRnr();

        deferred.reject();
        $scope.$apply();

        expect(notificationServiceSpy).toHaveBeenCalledWith('requisitionView.skip.failure');
    });

    it('getPrintUrl should prepare URL correctly', function() {
        expect(vm.getPrintUrl()).toEqual('http://some.url/api/requisitions/1/print');
    });

    describe('Sync error handling', function() {

        it('should reload requisition when conflict response received', function() {
            verifyReloadOnErrorAndNotificationSent(409, 'requisitionView.versionMismatch')
        });

        it('should reload requisition when forbidden response received', function() {
            verifyReloadOnErrorAndNotificationSent(403, 'requisitionView.updateForbidden')
        });

        it('should not reload requisition when bad request response received', function() {
            verifyNoReloadOnError(400);
        });

        it('should not reload requisition when internal server error request response received', function() {
            verifyNoReloadOnError(500);
        });

        function verifyReloadOnErrorAndNotificationSent(responseStatus, messageKey) {
            var notificationServiceSpy = jasmine.createSpy(),
                stateSpy = jasmine.createSpy(),
                conflictResponse = { status: responseStatus };

            spyOn(notificationService, 'error').andCallFake(notificationServiceSpy);
            spyOn($state, 'reload').andCallFake(stateSpy);

            vm.syncRnr();

            deferred.reject(conflictResponse);
            $scope.$apply();

            expect(notificationServiceSpy).toHaveBeenCalledWith(messageKey);
            expect(stateSpy).toHaveBeenCalled();
        }

        function verifyNoReloadOnError(responseStatus) {
            var notificationServiceSpy = jasmine.createSpy(),
                stateSpy = jasmine.createSpy(),
                conflictResponse = { status: responseStatus };

            spyOn(alertService, 'error').andCallFake(notificationServiceSpy);
            spyOn($state, 'reload').andCallFake(stateSpy);

            vm.syncRnr();

            deferred.reject(conflictResponse);
            $scope.$apply();

            expect(notificationServiceSpy).toHaveBeenCalledWith('requisitionView.sync.failure');
            expect(stateSpy).not.toHaveBeenCalled();
        }
    });

    describe('syncRnr', function() {

        it('should open loading modal once', function() {
            spyOn(loadingModalService, 'open');
            requisition.$save.andReturn($q.when(true));

            vm.syncRnr();
            $scope.$apply();

            expect(loadingModalService.open.calls.length).toEqual(1);
        });

    });

    describe('isFullSupplyTabValid', function() {

        var message;

        beforeEach(function() {
            message = 'some-message';
            spyOn(messageService, 'get').andReturn(message);
        });

        it('should return true if all line items are valid', function() {
            requisitionValidatorMock.areLineItemsValid.andCallFake(function(lineItems) {
                return lineItems[0] === fullSupplyItems[0];
            });

            expect(vm.isFullSupplyTabValid()).toBe(true);
            expect(requisitionValidatorMock.areLineItemsValid)
                .toHaveBeenCalledWith([fullSupplyItems[0]]);
            expect(vm.invalidFullSupply).toBe(undefined);
        });

        it('should return false if all line items are invalid', function() {
            requisitionValidatorMock.areLineItemsValid.andCallFake(function(lineItems) {
                return lineItems[0] !== fullSupplyItems[0];
            });

            expect(vm.isFullSupplyTabValid()).toBe(false);
            expect(requisitionValidatorMock.areLineItemsValid)
                .toHaveBeenCalledWith([fullSupplyItems[0]]);
            expect(vm.invalidFullSupply).toBe(message);
            expect(messageService.get).toHaveBeenCalledWith('requisitionView.requisition.error');
        });

    });

    describe('isNonFullSupplyTabValid', function() {

        var message;

        beforeEach(function() {
            message = 'some-message';
            spyOn(messageService, 'get').andReturn(message);
        });

        it('should return true if all line items are valid', function() {
            requisitionValidatorMock.areLineItemsValid.andCallFake(function(lineItems) {
                return lineItems[0] === nonFullSupplyItems[0];
            });

            expect(vm.isNonFullSupplyTabValid()).toBe(true);
            expect(requisitionValidatorMock.areLineItemsValid)
                .toHaveBeenCalledWith([nonFullSupplyItems[0]]);
            expect(vm.invalidNonFullSupply).toBe(undefined);
        });

        it('should return true if all line items are valid', function() {
            requisitionValidatorMock.areLineItemsValid.andCallFake(function(lineItems) {
                return lineItems[0] !== nonFullSupplyItems[0];
            });

            expect(vm.isNonFullSupplyTabValid()).toBe(false);
            expect(requisitionValidatorMock.areLineItemsValid)
                .toHaveBeenCalledWith([nonFullSupplyItems[0]]);
            expect(vm.invalidNonFullSupply).toBe(message);
            expect(messageService.get).toHaveBeenCalledWith('requisitionView.requisition.error');
        });
    });

    describe('authorize', function() {

        beforeEach(function() {
            confirmSpy.confirm.andReturn($q.when(true));
            requisition.$save.andReturn($q.when(true));
            requisition.$authorize.andReturn($q.when(true));

            requisitionValidatorMock.validateRequisition.andReturn(true);
            requisitionValidatorMock.areAllLineItemsSkipped.andReturn(false);
            RequisitionStockCountDateModal.andReturn($q.when());
        });

        it('should redirect to previous state', function() {
            authorizationServiceSpy.hasRight.andReturn(false);
            spyOn($state, 'go');

            vm.authorizeRnr();
            $scope.$apply();

            expect(stateTrackerService.goToPreviousState).toHaveBeenCalledWith('openlmis.requisitions.initRnr');
        });

        it('should show notification if requisition has error', function() {
            requisitionValidatorMock.validateRequisition.andReturn(false);
            spyOn(alertService, 'error');

            vm.authorizeRnr();
            $scope.$apply();

            expect(alertService.error).toHaveBeenCalledWith('requisitionView.rnrHasErrors');
        });

        it('should show notification if all line items are skipped', function() {
            requisitionValidatorMock.areAllLineItemsSkipped.andReturn(true);
            spyOn(alertService, 'error');

            vm.authorizeRnr();
            $scope.$apply();

            expect(alertService.error).toHaveBeenCalledWith('requisitionView.allLineItemsSkipped');
        });

        it('should call RequisitionStockCountDateModal if enabled', function() {
            vm.authorizeRnr();
            $scope.$apply();

            expect(RequisitionStockCountDateModal).toHaveBeenCalledWith(requisition);
        });

        it('should not call RequisitionStockCountDateModal if disabled', function() {
            vm.requisition.program.enableDatePhysicalStockCountCompleted = false;

            vm.authorizeRnr();
            $scope.$apply();

            expect(RequisitionStockCountDateModal).not.toHaveBeenCalled();
        });

        it('should disable RequisitionWatcher', function() {
            vm.authorizeRnr();
            $scope.$apply();

            expect(watcher.disableWatcher).toHaveBeenCalled();
        });
    });

    describe('submitRnr', function() {

        beforeEach(function() {
            confirmSpy.confirm.andReturn($q.when(true));
            requisition.$save.andReturn($q.when(true));
            requisition.$submit.andReturn($q.when(true));

            requisitionValidatorMock.validateRequisition.andReturn(true);
            requisitionValidatorMock.areAllLineItemsSkipped.andReturn(false);
            RequisitionStockCountDateModal.andReturn($q.when());
        });

        it('should redirect to previous state', function() {
            authorizationServiceSpy.hasRight.andReturn(false);
            spyOn($state, 'go');

            vm.submitRnr();
            $scope.$apply();

            expect(stateTrackerService.goToPreviousState).toHaveBeenCalledWith('openlmis.requisitions.initRnr');
        });

        it('should call RequisitionStockCountDateModal if enabled', function() {
            vm.submitRnr();
            $scope.$apply();

            expect(RequisitionStockCountDateModal).toHaveBeenCalledWith(requisition);
        });

        it('should not call RequisitionStockCountDateModal if disabled', function() {
            vm.requisition.program.enableDatePhysicalStockCountCompleted = false;

            vm.submitRnr();
            $scope.$apply();

            expect(RequisitionStockCountDateModal).not.toHaveBeenCalled();
        });

        it('should disable RequisitionWatcher', function() {
            vm.submitRnr();
            $scope.$apply();

            expect(watcher.disableWatcher).toHaveBeenCalled();
        });
    });

    describe('removeRnr', function() {

        beforeEach(function() {
            confirmSpy.confirmDestroy.andReturn($q.when(true));
            requisition.$save.andReturn($q.when(true));
            requisition.$remove.andReturn($q.when(true));

            requisitionValidatorMock.validateRequisition.andReturn(true);
            requisitionValidatorMock.areAllLineItemsSkipped.andReturn(false);
        });

        it('should redirect to previous state', function() {
            authorizationServiceSpy.hasRight.andReturn(false);
            spyOn($state, 'go');

            vm.removeRnr();
            $scope.$apply();

            expect(stateTrackerService.goToPreviousState).toHaveBeenCalledWith('openlmis.requisitions.initRnr');
        });

        it('should disable RequisitionWatcher', function() {
            vm.removeRnr();
            $scope.$apply();

            expect(watcher.disableWatcher).toHaveBeenCalled();
        });
    });

    describe('approveRnr', function() {

        beforeEach(function() {
            confirmSpy.confirmDestroy.andReturn($q.when(true));
            requisition.$save.andReturn($q.when(true));
            requisition.$approve.andReturn($q.when(true));

            requisitionValidatorMock.validateRequisition.andReturn(true);
            requisitionValidatorMock.areAllLineItemsSkipped.andReturn(false);
        });

        it('should redirect to previous state', function() {
            authorizationServiceSpy.hasRight.andReturn(false);
            spyOn($state, 'go');

            vm.approveRnr();
            $scope.$apply();

            expect(stateTrackerService.goToPreviousState).toHaveBeenCalledWith('openlmis.requisitions.approvalList');
        });

        it('should show notification if requisition has error', function() {
            requisitionValidatorMock.validateRequisition.andReturn(false);
            spyOn(alertService, 'error');

            vm.approveRnr();
            $scope.$apply();

            expect(alertService.error).toHaveBeenCalledWith('requisitionView.rnrHasErrors');
        });

        it('should disable RequisitionWatcher', function() {
            vm.approveRnr();
            $scope.$apply();

            expect(watcher.disableWatcher).toHaveBeenCalled();
        });
    });

    describe('rejectRnr', function() {

        var confirmDeferred, saveDeferred, alertService;

        beforeEach(inject(function(_alertService_) {
            alertService = _alertService_;
            spyOn(alertService, 'error');

            confirmDeferred = $q.defer();
            saveDeferred = $q.defer();

            confirmSpy.confirmDestroy.andReturn(confirmDeferred.promise);
            requisition.$save.andReturn(saveDeferred.promise);
            requisition.$reject.andReturn($q.when(true));

            requisitionValidatorMock.validateRequisition.andReturn(true);
            requisitionValidatorMock.areAllLineItemsSkipped.andReturn(false);
        }));

        it('should save requisition before rejecting', function() {
            vm.rejectRnr();
            confirmDeferred.resolve();
            $scope.$apply();

            expect(requisition.$save).toHaveBeenCalled();
            expect(requisition.$reject).not.toHaveBeenCalled();

            saveDeferred.resolve();
            $scope.$apply();

            expect(requisition.$reject).toHaveBeenCalled();
        });

        it('should show error when trying to reject requisition with no comment added', function() {
            vm.requisition.draftStatusMessage = null;
            vm.rejectRnr();
            $scope.$apply();

            expect(alertService.error).toHaveBeenCalled();
        });

        it('should not reject requisition with no comment added', function() {
            vm.requisition.draftStatusMessage = null;
            vm.rejectRnr();
            $scope.$apply();

            expect(requisition.$save).not.toHaveBeenCalled();
            expect(requisition.$reject).not.toHaveBeenCalled();
        });

        it('should redirect to previous state', function() {
            authorizationServiceSpy.hasRight.andReturn(false);
            spyOn($state, 'go');

            vm.rejectRnr();
            confirmDeferred.resolve();
            saveDeferred.resolve();
            $scope.$apply();

            expect(stateTrackerService.goToPreviousState)
                .toHaveBeenCalledWith('openlmis.requisitions.approvalList');
        });

        it('should disable RequisitionWatcher', function() {
            vm.rejectRnr();
            confirmDeferred.resolve();
            saveDeferred.resolve();
            $scope.$apply();

            expect(watcher.disableWatcher).toHaveBeenCalled();
        });
    });

    describe('syncAndPrint', function() {

        beforeEach(function() {
            spyOn($window, 'open').andCallThrough();
            authorizationServiceSpy.hasRight.andReturn(true);
            vm.requisition.$isInitiated.andReturn(true);
        });

        it('should open window with report when sync succeeded', function() {
            requisition.$save.andReturn($q.when(true));

            vm.syncRnrAndPrint();
            $scope.$apply();

            expect(accessTokenFactorySpy.addAccessToken)
                .toHaveBeenCalledWith('http://some.url/api/requisitions/1/print');
        });

        it('should not open report when sync failed', function() {
            requisition.$save.andReturn($q.reject());

            vm.syncRnrAndPrint();
            $scope.$apply();

            expect($window.open).toHaveBeenCalledWith('', '_blank');
            expect(accessTokenFactorySpy.addAccessToken).not.toHaveBeenCalled();
        });

        it('should display error message when sync failed', function() {
            requisition.$save.andReturn($q.reject({status: 400}));
            var notificationServiceSpy = jasmine.createSpy();
            spyOn(alertService, 'error').andCallFake(notificationServiceSpy);

            vm.syncRnrAndPrint();
            $scope.$apply();

            expect(notificationServiceSpy).toHaveBeenCalledWith('requisitionView.sync.failure');
        });

        it('should open window with report when has no right for sync', function() {
            accessTokenFactorySpy.addAccessToken.andReturn('token');
            authorizationServiceSpy.hasRight.andReturn(false);

            vm.syncRnrAndPrint();

            expect($window.open).toHaveBeenCalledWith('token', '_blank');
        });

        it('should open loading modal once', function() {
            spyOn(loadingModalService, 'open');
            requisition.$save.andReturn($q.when(true));

            vm.syncRnrAndPrint();
            $scope.$apply();

            expect(loadingModalService.open.calls.length).toEqual(1);
        });
    });

    describe('update requisition', function(){
        var offlineService, isOffline,
            requisitionService;

        beforeEach(inject(function(_offlineService_, _requisitionService_) {
            isOffline = false;
            offlineService = _offlineService_;
            spyOn(offlineService, 'isOffline').andCallFake(function(){
                return isOffline;
            });

            spyOn($state, 'reload');

            spyOn(alertService, 'error');

            confirmSpy.confirm.andReturn($q.resolve());

            requisitionService = _requisitionService_;
            spyOn(requisitionService, 'removeOfflineRequisition');
        }));

        it('will confirm with the user before removing the requisition', function() {
            confirmSpy.confirm.andReturn($q.reject());

            vm.updateRequisition();
            $scope.$apply();

            expect(confirmSpy.confirm).toHaveBeenCalled();
            expect(requisitionService.removeOfflineRequisition).not.toHaveBeenCalled();
            expect($state.reload).not.toHaveBeenCalled();

            confirmSpy.confirm.andReturn($q.resolve());

            vm.updateRequisition();
            $scope.$apply();

            // Was called in both function calls
            expect(confirmSpy.confirm.calls.length).toBe(2);

            expect(requisitionService.removeOfflineRequisition).toHaveBeenCalled();
            expect($state.reload).toHaveBeenCalled();

        });

        it('will not remove the requisition while offline', function(offlineService){
            isOffline = true;

            vm.updateRequisition();
            $scope.$apply();

            expect(alertService.error).toHaveBeenCalled();
            expect(requisitionService.removeOfflineRequisition).not.toHaveBeenCalled();

            isOffline = false;

            vm.updateRequisition();
            $scope.$apply();

            expect(alertService.error.calls.length).toBe(1);
            expect(requisitionService.removeOfflineRequisition).toHaveBeenCalled();
        });

    });
});
