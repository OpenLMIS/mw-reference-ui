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

    beforeEach(function() {
        var context = this;
        module('requisition-view', function($provide) {
            context.RequisitionStockCountDateModalMock = jasmine.createSpy('RequisitionStockCountDateModal');

            $provide.factory('RequisitionStockCountDateModal', function() {
                return context.RequisitionStockCountDateModalMock;
            });
        });

        var RequisitionDataBuilder, RequisitionLineItemDataBuilder, ProgramDataBuilder;
        inject(function($injector) {
            RequisitionDataBuilder = $injector.get('RequisitionDataBuilder');
            ProgramDataBuilder = $injector.get('ProgramDataBuilder');
            RequisitionLineItemDataBuilder = $injector.get('RequisitionLineItemDataBuilder');

            this.$rootScope = $injector.get('$rootScope');
            this.$scope = this.$rootScope.$new();
            this.$state = $injector.get('$state');
            this.$q = $injector.get('$q');
            this.$window = $injector.get('$window');
            this.notificationService = $injector.get('notificationService');
            this.alertService = $injector.get('alertService');
            this.confirmService = $injector.get('confirmService');
            this.loadingModalService = $injector.get('loadingModalService');
            this.stateTrackerService = $injector.get('stateTrackerService');
            this.messageService = $injector.get('messageService');
            this.requisitionUrlFactory = $injector.get('requisitionUrlFactory');
            this.$controller = $injector.get('$controller');
            this.requisitionValidator = $injector.get('requisitionValidator');
            this.RequisitionStockCountDateModal = $injector.get('RequisitionStockCountDateModal');
            this.authorizationService = $injector.get('authorizationService');
            this.RequisitionWatcher = $injector.get('RequisitionWatcher');
            this.accessTokenFactory = $injector.get('accessTokenFactory');
            this.requisitionService = $injector.get('requisitionService');
            this.offlineService = $injector.get('offlineService');
            // Malawi: Disable skip button if there is data in user inputs
            this.COLUMN_SOURCES = $injector.get('COLUMN_SOURCES');
            // --- ends here ---
        });

        var program = new ProgramDataBuilder()
            .withEnabledDatePhysicalStockCountCompleted()
            .build();

        this.requisition = new RequisitionDataBuilder()
            .withProgram(program)
            .withRequisitionLineItems([
                new RequisitionLineItemDataBuilder()
                    .fullSupplyForProgram(program)
                    .buildJson(),
                new RequisitionLineItemDataBuilder()
                    .nonFullSupplyForProgram(program)
                    .buildJson()
            ])
            .build();

        this.fullSupplyItems = [this.requisition.requisitionLineItems[0]];
        this.nonFullSupplyItems = [this.requisition.requisitionLineItems[1]];

        this.requisition.$isInitiated.andReturn(true);
        this.requisition.$isReleased.andReturn(false);
        this.requisition.$isRejected.andReturn(false);

        this.canSubmit = true;
        this.canAuthorize = false;
        this.canApproveAndReject = false;
        this.canDelete = true;
        this.canSkip = true;
        this.canSync = true;

        spyOn(this.stateTrackerService, 'goToPreviousState');
        spyOn(this.notificationService, 'success');
        spyOn(this.notificationService, 'error');
        spyOn(this.alertService, 'error');
        spyOn(this.$state, 'go');
        spyOn(this.$state, 'reload');
        spyOn(this.loadingModalService, 'open');
        spyOn(this.loadingModalService, 'close');
        spyOn(this.requisitionValidator, 'areLineItemsValid');
        spyOn(this.requisitionValidator, 'validateRequisition');
        spyOn(this.requisitionValidator, 'areAllLineItemsSkipped');
        spyOn(this.confirmService, 'confirm');
        spyOn(this.confirmService, 'confirmDestroy');
        spyOn(this.authorizationService, 'hasRight');
        spyOn(this.RequisitionWatcher.prototype, 'disableWatcher');
        spyOn(this.accessTokenFactory, 'addAccessToken');
        spyOn(this.offlineService, 'isOffline');
        spyOn(this.requisitionService, 'removeOfflineRequisition');
        // Malawi: set all to 0 button
        spyOn(this.requisition.template, 'getColumn').andReturn({});
        // --- ends here ---

        this.initController = initController;
    });

    describe('$onInit', function() {

        it('should display submit button when user can submit requisition and skip authorization is not configured',
            function() {
                this.canSubmit = true;
                this.requisition.program.skipAuthorization = false;

                this.initController();

                expect(this.vm.displaySubmitButton).toBe(true);
                expect(this.vm.displaySubmitAndAuthorizeButton).toBe(false);
            });

        it('should display submit and authorize button when user can submit requisition and skip authorization is' +
            ' configured', function() {
            this.canSubmit = true;
            this.requisition.program.skipAuthorization = true;

            this.initController();

            expect(this.vm.displaySubmitAndAuthorizeButton).toBe(true);
            expect(this.vm.displaySubmitButton).toBe(false);
        });

        it('should set requisition type label and class for regular requisition', function() {
            this.requisition.emergency = false;
            this.requisition.reportOnly = false;

            this.initController();

            expect(this.vm.requisitionType).toBe('requisitionView.regular');
            expect(this.vm.requisitionTypeClass).toBe('regular');
        });

        it('should set requisition type label and class for emergency requisition', function() {
            this.requisition.emergency = true;
            this.requisition.reportOnly = true;

            this.initController();

            expect(this.vm.requisitionType).toBe('requisitionView.emergency');
            expect(this.vm.requisitionTypeClass).toBe('emergency');
        });

        it('should set requisition type label and class for report-only requisition', function() {
            this.requisition.emergency = false;
            this.requisition.reportOnly = true;

            this.initController();

            expect(this.vm.requisitionType).toBe('requisitionView.reportOnly');
            expect(this.vm.requisitionTypeClass).toBe('report-only');
        });

        it('should make reject button visible if user can approve and reject and requisition is not split', function() {
            this.requisition.extraData = {
                originalRequisition: undefined
            };
            this.canApproveAndReject = true;

            this.initController();

            expect(this.vm.displayRejectButton).toEqual(true);
        });

        it('should make reject button hidden if user can not approve and reject', function() {
            this.requisition.extraData = {
                originalRequisition: undefined
            };
            this.canApproveAndReject = false;

            this.initController();

            expect(this.vm.displayRejectButton).toEqual(false);
        });

        it('should make reject button hidden if requisition is split', function() {
            this.requisition.extraData = {
                originalRequisition: 'original-requisition-id'
            };
            this.canApproveAndReject = true;

            this.initController();

            expect(this.vm.displayRejectButton).toEqual(false);
        });

        // Malawi: Disable skip button if there is data in user inputs
        it('should enable skip button if there is no data in user inputs', function() {
            // Malawi: disable skip button if user inputs are not empty
            this.requisition.template.getColumns.andReturn([{
                source: this.COLUMN_SOURCES.USER_INPUT,
                name: 'beginningBalance',
                $display: true
            }, {
                source: this.COLUMN_SOURCES.USER_INPUT,
                name: 'qtyUsed',
                $display: true
            }]);
            // --- ends here ---
            this.authorizationService.hasRight.andReturn(true);
            this.requisition.requisitionLineItems[0].beginningBalance = null;
            this.requisition.requisitionLineItems[0].qtyUsed = null;

            this.initController();

            expect(this.vm.enableSkip()).toBe(true);
        });

        it('should not disable skip button if there is data in beginningBalance column', function() {
            // Malawi: disable skip button if user inputs are not empty
            this.requisition.template.getColumns.andReturn([{
                source: this.COLUMN_SOURCES.USER_INPUT,
                name: 'beginningBalance',
                $display: true
            }, {
                source: this.COLUMN_SOURCES.USER_INPUT,
                name: 'qtyUsed',
                $display: true
            }]);
            // --- ends here ---
            this.authorizationService.hasRight.andReturn(true);
            this.requisition.requisitionLineItems[0].beginningBalance = 1;
            this.requisition.requisitionLineItems[0].qtyUsed = null;

            this.initController();

            expect(this.vm.enableSkip()).toBe(true);
        });

        it('should disable skip button if requisition has data in user inputs', function() {
            // Malawi: disable skip button if user inputs are not empty
            this.requisition.template.getColumns.andReturn([{
                source: this.COLUMN_SOURCES.USER_INPUT,
                name: 'beginningBalance',
                $display: true
            }, {
                source: this.COLUMN_SOURCES.USER_INPUT,
                name: 'qtyUsed',
                $display: true
            }]);
            // --- ends here ---

            this.authorizationService.hasRight.andReturn(true);
            this.requisition.requisitionLineItems[0].beginningBalance = 1;
            this.requisition.requisitionLineItems[0].qtyUsed = 2;

            this.initController();

            expect(this.vm.enableSkip()).toBe(false);
        });
        // --- ends here ---
    });

    describe('skipRnr', function() {

        beforeEach(function() {
            this.confirmService.confirm.andReturn(this.$q.resolve());
            this.initController();
        });

        it('should display message when successfully skipped requisition', function() {
            this.loadingModalService.open.andReturn(this.$q.resolve());
            this.requisition.$skip.andReturn(this.$q.resolve());

            this.vm.skipRnr();
            this.$rootScope.$apply();

            expect(this.notificationService.success).toHaveBeenCalledWith('requisitionView.skip.success');
            expect(this.stateTrackerService.goToPreviousState).toHaveBeenCalledWith('openlmis.requisitions.initRnr');
        });

        it('should display error message when skip requisition failed', function() {
            this.loadingModalService.open.andReturn(this.$q.resolve());
            this.requisition.$skip.andReturn(this.$q.reject());

            this.vm.skipRnr();
            this.$rootScope.$apply();

            expect(this.alertService.error).toHaveBeenCalledWith('requisitionView.skip.failure');
        });

    });

    describe('getPrintUrl', function() {

        it('getPrintUrl should prepare URL correctly', function() {
            this.initController();

            expect(this.vm.getPrintUrl())
                // Malawi: link to the updated requisition printout
                .toEqual(this.requisitionUrlFactory('/api/reports/requisitions/requisition-id-1/print'));
            // --- ends here ---
        });

    });

    describe('Sync error handling', function() {

        beforeEach(function() {
            this.verifyReloadOnErrorAndNotificationSent = verifyReloadOnErrorAndNotificationSent;
            this.verifyNoReloadOnError = verifyNoReloadOnError;
            this.initController();
        });

        //eslint-disable-next-line jasmine/missing-expect
        it('should reload requisition when conflict response received', function() {
            this.verifyReloadOnErrorAndNotificationSent(409, 'requisitionView.versionMismatch');
        });

        //eslint-disable-next-line jasmine/missing-expect
        it('should reload requisition when forbidden response received', function() {
            this.verifyReloadOnErrorAndNotificationSent(403, 'requisitionView.updateForbidden');
        });

        //eslint-disable-next-line jasmine/missing-expect
        it('should not reload requisition when bad request response received', function() {
            this.verifyNoReloadOnError(400);
        });

        //eslint-disable-next-line jasmine/missing-expect
        it('should not reload requisition when internal server error request response received', function() {
            this.verifyNoReloadOnError(500);
        });

        function verifyReloadOnErrorAndNotificationSent(responseStatus, messageKey) {
            var conflictResponse = {
                status: responseStatus
            };

            this.requisition.$save.andReturn(this.$q.reject(conflictResponse));

            this.vm.syncRnr();
            this.$rootScope.$apply();

            expect(this.notificationService.error).toHaveBeenCalledWith(messageKey);
            expect(this.$state.reload).toHaveBeenCalled();
        }

        function verifyNoReloadOnError(responseStatus) {
            var conflictResponse = {
                status: responseStatus
            };

            this.requisition.$save.andReturn(this.$q.reject(conflictResponse));

            this.vm.syncRnr();
            this.$rootScope.$apply();

            expect(this.alertService.error).toHaveBeenCalledWith('requisitionView.sync.failure');
            expect(this.$state.reload).not.toHaveBeenCalled();
        }
    });

    describe('syncRnr', function() {

        it('should open loading modal once', function() {
            this.requisition.$save.andReturn(this.$q.resolve());

            this.initController();
            this.vm.syncRnr();
            this.$rootScope.$apply();

            expect(this.loadingModalService.open).toHaveBeenCalled();
        });

        it('should reload state without requisition param', function() {
            this.requisition.$save.andReturn(this.$q.resolve(true));
            this.loadingModalService.open.andReturn(this.$q.resolve());

            this.initController();
            this.vm.syncRnr();
            this.$rootScope.$apply();

            expect(this.$state.go).toHaveBeenCalledWith(this.$state.current, {
                rnr: this.requisition.id,
                requisition: undefined
            }, {
                reload: true
            });
        });

    });

    describe('isFullSupplyTabValid', function() {

        beforeEach(function() {
            this.message = 'some-message';
            spyOn(this.messageService, 'get').andReturn(this.message);
            this.initController();
        });

        it('should return true if all line items are valid', function() {
            this.requisitionValidator.areLineItemsValid.andReturn(true);

            expect(this.vm.isFullSupplyTabValid()).toBe(true);
            expect(this.requisitionValidator.areLineItemsValid)
                .toHaveBeenCalledWith([this.fullSupplyItems[0]]);

            expect(this.vm.invalidFullSupply).toBe(undefined);
        });

        it('should return false if all line items are invalid', function() {
            this.requisitionValidator.areLineItemsValid.andReturn(false);

            expect(this.vm.isFullSupplyTabValid()).toBe(false);
            expect(this.requisitionValidator.areLineItemsValid)
                .toHaveBeenCalledWith([this.fullSupplyItems[0]]);

            expect(this.vm.invalidFullSupply).toBe(this.message);
            expect(this.messageService.get).toHaveBeenCalledWith('requisitionView.requisition.error');
        });

    });

    describe('isNonFullSupplyTabValid', function() {

        beforeEach(function() {
            this.message = 'some-message';
            spyOn(this.messageService, 'get').andReturn(this.message);
            this.initController();
        });

        it('should return true if all line items are valid', function() {
            this.requisitionValidator.areLineItemsValid.andReturn(true);

            expect(this.vm.isNonFullSupplyTabValid()).toBe(true);
            expect(this.requisitionValidator.areLineItemsValid)
                .toHaveBeenCalledWith([this.nonFullSupplyItems[0]]);

            expect(this.vm.invalidNonFullSupply).toBe(undefined);
        });

        it('should return false if any line item is invalid', function() {
            this.requisitionValidator.areLineItemsValid.andReturn(false);

            expect(this.vm.isNonFullSupplyTabValid()).toBe(false);
            expect(this.requisitionValidator.areLineItemsValid)
                .toHaveBeenCalledWith([this.nonFullSupplyItems[0]]);

            expect(this.vm.invalidNonFullSupply).toBe(this.message);
            expect(this.messageService.get).toHaveBeenCalledWith('requisitionView.requisition.error');
        });
    });

    describe('authorize', function() {

        beforeEach(function() {
            this.confirmService.confirm.andReturn(this.$q.resolve(true));
            this.requisition.$save.andReturn(this.$q.resolve(true));
            this.requisition.$authorize.andReturn(this.$q.resolve(true));

            this.requisitionValidator.validateRequisition.andReturn(true);
            this.requisitionValidator.areAllLineItemsSkipped.andReturn(false);
            this.RequisitionStockCountDateModalMock.andReturn(this.$q.resolve());
            this.loadingModalService.open.andReturn(this.$q.resolve());
            this.initController();
        });

        it('should redirect to previous state', function() {
            this.authorizationService.hasRight.andReturn(false);

            this.vm.authorizeRnr();
            this.$rootScope.$apply();

            expect(this.stateTrackerService.goToPreviousState).toHaveBeenCalledWith('openlmis.requisitions.initRnr');
        });

        it('should show notification if requisition has error', function() {
            this.requisitionValidator.validateRequisition.andReturn(false);

            this.vm.authorizeRnr();
            this.$rootScope.$apply();

            expect(this.alertService.error).toHaveBeenCalledWith('requisitionView.rnrHasErrors');
        });

        it('should show notification if all line items are skipped', function() {
            this.requisitionValidator.areAllLineItemsSkipped.andReturn(true);

            this.vm.authorizeRnr();
            this.$rootScope.$apply();

            expect(this.alertService.error).toHaveBeenCalledWith('requisitionView.allLineItemsSkipped');
        });

        it('should call RequisitionStockCountDateModal if enabled', function() {
            this.vm.authorizeRnr();
            this.$rootScope.$apply();

            expect(this.RequisitionStockCountDateModal).toHaveBeenCalledWith(this.requisition);
        });

        it('should not call RequisitionStockCountDateModal if disabled', function() {
            this.vm.requisition.program.enableDatePhysicalStockCountCompleted = false;

            this.vm.authorizeRnr();
            this.$rootScope.$apply();

            expect(this.RequisitionStockCountDateModal).not.toHaveBeenCalled();
        });

        it('should disable RequisitionWatcher', function() {
            this.vm.authorizeRnr();
            this.$rootScope.$apply();

            expect(this.RequisitionWatcher.prototype.disableWatcher).toHaveBeenCalled();
        });
    });

    describe('submitRnr', function() {

        beforeEach(function() {
            this.confirmService.confirm.andReturn(this.$q.resolve(true));
            this.requisition.$save.andReturn(this.$q.resolve(true));
            this.requisition.$submit.andReturn(this.$q.resolve(true));

            this.requisitionValidator.validateRequisition.andReturn(true);
            this.requisitionValidator.areAllLineItemsSkipped.andReturn(false);
            this.RequisitionStockCountDateModalMock.andReturn(this.$q.resolve());
            this.loadingModalService.open.andReturn(this.$q.resolve());
            this.initController();
        });

        it('should redirect to previous state', function() {
            this.authorizationService.hasRight.andReturn(false);

            this.vm.submitRnr();
            this.$rootScope.$apply();

            expect(this.stateTrackerService.goToPreviousState).toHaveBeenCalledWith('openlmis.requisitions.initRnr');
        });

        it('should call RequisitionStockCountDateModal if enabled', function() {
            this.vm.submitRnr();
            this.$rootScope.$apply();

            expect(this.RequisitionStockCountDateModal).toHaveBeenCalledWith(this.requisition);
        });

        it('should not call RequisitionStockCountDateModal if disabled', function() {
            this.vm.requisition.program.enableDatePhysicalStockCountCompleted = false;

            this.vm.submitRnr();
            this.$rootScope.$apply();

            expect(this.RequisitionStockCountDateModal).not.toHaveBeenCalled();
        });

        it('should disable RequisitionWatcher', function() {
            this.vm.submitRnr();
            this.$rootScope.$apply();

            expect(this.RequisitionWatcher.prototype.disableWatcher).toHaveBeenCalled();
        });
    });

    describe('removeRnr', function() {

        beforeEach(function() {
            this.confirmService.confirmDestroy.andReturn(this.$q.resolve(true));
            this.requisition.$save.andReturn(this.$q.resolve(true));
            this.requisition.$remove.andReturn(this.$q.resolve(true));

            this.requisitionValidator.validateRequisition.andReturn(true);
            this.requisitionValidator.areAllLineItemsSkipped.andReturn(false);
            this.loadingModalService.open.andReturn(this.$q.resolve());
            this.initController();
        });

        it('should redirect to previous state', function() {
            this.vm.removeRnr();
            this.$rootScope.$apply();

            expect(this.stateTrackerService.goToPreviousState).toHaveBeenCalledWith('openlmis.requisitions.initRnr');
        });

        it('should disable RequisitionWatcher', function() {
            this.vm.removeRnr();
            this.$rootScope.$apply();

            expect(this.RequisitionWatcher.prototype.disableWatcher).toHaveBeenCalled();
        });
    });

    describe('approveRnr', function() {

        beforeEach(function() {
            this.confirmService.confirm.andReturn(this.$q.resolve(true));
            this.requisition.$save.andReturn(this.$q.resolve(true));
            this.requisition.$approve.andReturn(this.$q.resolve(true));
            this.requisitionValidator.validateRequisition.andReturn(true);
            this.requisitionValidator.areAllLineItemsSkipped.andReturn(false);
            this.loadingModalService.open.andReturn(this.$q.resolve());
            this.initController();
        });

        it('should redirect to previous state', function() {
            this.authorizationService.hasRight.andReturn(false);

            this.vm.approveRnr();
            this.$rootScope.$apply();

            expect(this.stateTrackerService.goToPreviousState)
                .toHaveBeenCalledWith('openlmis.requisitions.approvalList');
        });

        it('should show notification if requisition has error', function() {
            this.requisitionValidator.validateRequisition.andReturn(false);

            this.vm.approveRnr();
            this.$rootScope.$apply();

            expect(this.alertService.error).toHaveBeenCalledWith('requisitionView.rnrHasErrors');
        });

        it('should disable RequisitionWatcher', function() {
            this.vm.approveRnr();
            this.$rootScope.$apply();

            expect(this.RequisitionWatcher.prototype.disableWatcher).toHaveBeenCalled();
        });
    });

    describe('rejectRnr', function() {

        beforeEach(function() {
            this.confirmService.confirmDestroy.andReturn(this.$q.resolve(true));
            this.requisition.$save.andReturn(this.$q.resolve());
            this.requisition.$reject.andReturn(this.$q.resolve());

            this.requisitionValidator.validateRequisition.andReturn(true);
            this.requisitionValidator.areAllLineItemsSkipped.andReturn(false);
            this.loadingModalService.open.andReturn(this.$q.resolve());
            this.initController();
        });

        it('should save requisition before rejecting', function() {
            var confirmDeferred = this.$q.defer(),
                saveDeferred = this.$q.defer();

            this.requisition.$save.andReturn(saveDeferred.promise);
            this.requisition.$reject.andReturn(confirmDeferred.promise);

            this.vm.rejectRnr();
            confirmDeferred.resolve();
            this.$rootScope.$apply();

            expect(this.requisition.$save).toHaveBeenCalled();
            expect(this.requisition.$reject).not.toHaveBeenCalled();

            saveDeferred.resolve();
            this.$rootScope.$apply();

            expect(this.requisition.$reject).toHaveBeenCalled();
        });

        it('should redirect to previous state', function() {
            this.vm.rejectRnr();
            this.$rootScope.$apply();

            expect(this.stateTrackerService.goToPreviousState)
                .toHaveBeenCalledWith('openlmis.requisitions.approvalList');
        });

        it('should disable RequisitionWatcher', function() {
            this.vm.rejectRnr();
            this.$rootScope.$apply();

            expect(this.RequisitionWatcher.prototype.disableWatcher).toHaveBeenCalled();
        });

        it('should close loading modal on failure', function() {
            this.requisition.$reject.andReturn(this.$q.reject());

            this.vm.rejectRnr();
            this.$rootScope.$apply();

            expect(this.loadingModalService.close).toHaveBeenCalled();
        });

        // Malawi: Rejecting LMIS form should require a reason
        it('should show error when trying to reject requisition with no comment added', function() {
            this.vm.requisition.draftStatusMessage = null;
            this.vm.rejectRnr();
            this.$scope.$apply();

            expect(this.alertService.error).toHaveBeenCalled();
        });

        it('should not reject requisition with no comment added', function() {
            this.vm.requisition.draftStatusMessage = null;
            this.vm.rejectRnr();
            this.$scope.$apply();

            expect(this.requisition.$save).not.toHaveBeenCalled();
            expect(this.requisition.$reject).not.toHaveBeenCalled();
        });
        // --- ends here ---
    });

    describe('syncAndPrint', function() {

        beforeEach(function() {
            spyOn(this.$window, 'open').andCallThrough();
            this.initController();
            this.loadingModalService.open.andReturn(this.$q.resolve());
            this.initController();
        });

        it('should open window with report when sync succeeded', function() {
            this.requisition.$save.andReturn(this.$q.resolve(true));

            this.vm.syncRnrAndPrint();
            this.$rootScope.$apply();

            expect(this.accessTokenFactory.addAccessToken)
                // Malawi: link to the updated requisition printout
                .toHaveBeenCalledWith(this.requisitionUrlFactory('/api/reports/requisitions/requisition-id-1/print'));
            // --- ends here ---
        });

        it('should not open report when sync failed', function() {
            this.requisition.$save.andReturn(this.$q.reject());

            this.vm.syncRnrAndPrint();
            this.$rootScope.$apply();

            expect(this.$window.open).toHaveBeenCalledWith('', '_blank');
            expect(this.accessTokenFactory.addAccessToken).not.toHaveBeenCalled();
        });

        it('should display error message when sync failed', function() {
            this.requisition.$save.andReturn(this.$q.reject({
                status: 400
            }));

            this.vm.syncRnrAndPrint();
            this.$rootScope.$apply();

            expect(this.alertService.error).toHaveBeenCalledWith('requisitionView.sync.failure');
        });

        it('should open window with report when has no right for sync', function() {
            this.accessTokenFactory.addAccessToken.andReturn('token');
            this.vm.displaySyncButton = false;

            this.vm.syncRnrAndPrint();

            expect(this.$window.open).toHaveBeenCalledWith('token', '_blank');
        });

        it('should open loading modal once', function() {
            this.requisition.$save.andReturn(this.$q.resolve(true));

            this.vm.syncRnrAndPrint();
            this.$rootScope.$apply();

            expect(this.loadingModalService.open.callCount).toEqual(1);
        });
    });

    describe('updateRequisition', function() {

        beforeEach(function() {
            this.initController();
        });

        it('will confirm with the user before removing the requisition', function() {
            this.confirmService.confirm.andReturn(this.$q.reject());

            this.vm.updateRequisition();
            this.$rootScope.$apply();

            expect(this.confirmService.confirm).toHaveBeenCalled();
            expect(this.requisitionService.removeOfflineRequisition).not.toHaveBeenCalled();
            expect(this.$state.reload).not.toHaveBeenCalled();

            this.confirmService.confirm.andReturn(this.$q.resolve());

            this.vm.updateRequisition();
            this.$rootScope.$apply();

            // Was called in both function calls
            expect(this.confirmService.confirm.callCount).toBe(2);

            expect(this.requisitionService.removeOfflineRequisition).toHaveBeenCalled();
            expect(this.$state.reload).toHaveBeenCalled();

        });

        it('will not remove the requisition while offline', function() {
            this.offlineService.isOffline.andReturn(true);
            this.confirmService.confirm.andReturn(this.$q.resolve());

            this.vm.updateRequisition();
            this.$rootScope.$apply();

            expect(this.alertService.error).toHaveBeenCalled();
            expect(this.requisitionService.removeOfflineRequisition).not.toHaveBeenCalled();

            this.offlineService.isOffline.andReturn(false);

            this.vm.updateRequisition();
            this.$rootScope.$apply();

            expect(this.alertService.error.callCount).toBe(1);
            expect(this.requisitionService.removeOfflineRequisition).toHaveBeenCalled();
        });

    });

    function initController() {
        this.vm = this.$controller('RequisitionViewController', {
            $scope: this.$scope,
            requisition: this.requisition,
            canSubmit: this.canSubmit,
            canAuthorize: this.canAuthorize,
            canApproveAndReject: this.canApproveAndReject,
            canDelete: this.canDelete,
            canSkip: this.canSkip,
            canSync: this.canSync
        });
        this.vm.$onInit();
    }

});