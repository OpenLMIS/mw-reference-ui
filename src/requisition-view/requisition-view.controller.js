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
     * @name requisition-view.controller:RequisitionViewController
     *
     * @description
     * Controller for managing requisitions.
     */
    angular
        .module('requisition-view')
        .controller('RequisitionViewController', RequisitionViewController);

    RequisitionViewController.$inject = [
        '$state', 'requisition', 'requisitionValidator', 'authorizationService',
        'requisitionService', 'loadingModalService', 'alertService', 'notificationService',
        'confirmService', 'REQUISITION_RIGHTS', 'FULFILLMENT_RIGHTS', 'offlineService', '$window',
        'requisitionUrlFactory', '$filter', '$scope', 'RequisitionWatcher',
        'accessTokenFactory', 'messageService', 'stateTrackerService', 'RequisitionStockCountDateModal',
        'localStorageFactory', 'canSubmit', 'canAuthorize',
        'canApproveAndReject', 'canDelete', 'canSkip', 'canSync',
        // Malawi: Display alternate warning message
        'REQUISITION_WARNING_PERIODS', 'REQUISITION_WARNING_PROGRAM_CODE',
        // Malawi: Disable skip button if there is data in user inputs
        'TEMPLATE_COLUMNS', 'COLUMN_SOURCES'
        // --- ends here ---
    ];

    function RequisitionViewController($state, requisition, requisitionValidator,
        authorizationService, requisitionService,
        loadingModalService, alertService, notificationService,
        confirmService, REQUISITION_RIGHTS, FULFILLMENT_RIGHTS,
        offlineService, $window, requisitionUrlFactory, $filter,
        $scope, RequisitionWatcher, accessTokenFactory,
        messageService, stateTrackerService, RequisitionStockCountDateModal,
        localStorageFactory, canSubmit, canAuthorize, canApproveAndReject, 
        canDelete, canSkip, canSync,
        // Malawi: Display alternate warning message
        REQUISITION_WARNING_PERIODS, REQUISITION_WARNING_PROGRAM_CODE,
        // Malawi: Disable skip button if there is data in user inputs
        TEMPLATE_COLUMNS, COLUMN_SOURCES) {
        // --- ends here ---

        var vm = this,
            watcher = new RequisitionWatcher($scope, requisition, localStorageFactory('requisitions'));
        /**
         * @ngdoc property
         * @propertyOf requisition-view.controller:RequisitionViewController
         * @name requisition
         * @type {Object}
         *
         * @description
         * Holds requisition.
         */
        vm.requisition = requisition;

        /**
         * @ngdoc property
         * @propertyOf requisition-view.controller:RequisitionViewController
         * @name requisitionType
         * @type {String}
         *
         * @description
         * Holds message key to display, depending on the requisition type (regular/emergency/report-only).
         */
        vm.requisitionType = undefined;

        /**
         * @ngdoc property
         * @propertyOf requisition-view.controller:RequisitionViewController
         * @name requisitionTypeClass
         * @type {String}
         *
         * @description
         * Holds CSS class to use, depending on the requisition type (regular/emergency/report-only).
         */
        vm.requisitionTypeClass = undefined;

        /**
         * @ngdoc property
         * @propertyOf requisition-view.controller:RequisitionViewController
         * @name invalidNonFullSupply
         * @type {Boolean}
         *
         * @description
         * False if non-full supply tab is valid, true otherwise.
         */
        vm.invalidNonFullSupply = undefined;

        /**
         * @ngdoc property
         * @propertyOf requisition-view.controller:RequisitionViewController
         * @name invalidFullSupply
         * @type {Boolean}
         *
         * @description
         * False if full supply tab is valid, true otherwise.
         */
        vm.invalidFullSupply = undefined;

        /**
         * ngdoc property
         * @propertyOf requisition-view.controller:RequisitionViewController
         * @name displaySubmitButton
         * @type {Boolean}
         *
         * @description
         * Flag defining whether current user should see the submit button.
         */
        vm.displaySubmitButton = undefined;

        /**
         * ngdoc property
         * @propertyOf requisition-view.controller:RequisitionViewController
         * @name displaySubmitAndAuthorizeButton
         * @type {Boolean}
         *
         * @description
         * Flag defining whether current user should see the submit and authorize button.
         */
        vm.displaySubmitAndAuthorizeButton = undefined;

        /**
         * ngdoc property
         * @propertyOf requisition-view.controller:RequisitionViewController
         * @name displayAuthorizeButton
         * @type {Boolean}
         *
         * @description
         * Flag defining whether current user should see the authorize button.
         */
        vm.displayAuthorizeButton = undefined;

        /**
         * ngdoc property
         * @propertyOf requisition-view.controller:RequisitionViewController
         * @name displayDeleteButton
         * @type {Boolean}
         *
         * @description
         * Flag defining whether current user should see the delete button.
         */
        vm.displayDeleteButton = undefined;

        /**
         * ngdoc property
         * @propertyOf requisition-view.controller:RequisitionViewController
         * @name displayApproveAndRejectButtons
         * @type {Boolean}
         *
         * @description
         * Flag defining whether current user should see the approve and reject buttons.
         */
        vm.displayApproveAndRejectButtons = undefined;

        /**
         * ngdoc property
         * @propertyOf requisition-view.controller:RequisitionViewController
         * @name displaySkipButton
         * @type {Boolean}
         *
         * @description
         * Flag defining whether current user should see the skip button.
         */
        vm.displaySkipButton = undefined;

        /**
         * ngdoc property
         * @propertyOf requisition-view.controller:RequisitionViewController
         * @name displaySyncButton
         * @type {Boolean}
         *
         * @description
         * Flag defining whether current user should see the sync to server button.
         */
        vm.displaySyncButton = undefined;

        // Functions
        vm.$onInit = onInit;
        vm.updateRequisition = updateRequisition;
        vm.syncRnr = syncRnr;
        vm.syncRnrAndPrint = syncRnrAndPrint;
        vm.submitRnr = submitRnr;
        vm.authorizeRnr = authorizeRnr;
        vm.removeRnr = removeRnr;
        vm.approveRnr = approveRnr;
        vm.rejectRnr = rejectRnr;
        vm.skipRnr = skipRnr;
        vm.isOffline = offlineService.isOffline;
        vm.getPrintUrl = getPrintUrl;
        vm.isFullSupplyTabValid = isFullSupplyTabValid;
        vm.isNonFullSupplyTabValid = isNonFullSupplyTabValid;
        // Malawi: display price info
        vm.displayPriceInfo = displayPriceInfo;
        // Malawi: set all to 0 button
        vm.setAllToZero = setAllToZero;
        // Malawi: disable skip if there is data in user inputs
        vm.enableSkip = enableSkip;
        // --- ends here ---


        /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name $onInit
         *
         * @description
         * Initialization method of the RequisitionViewController.
         */
        function onInit() {
            setTypeAndClass();
            vm.displaySubmitButton = canSubmit && !vm.requisition.program.skipAuthorization;
            vm.displaySubmitAndAuthorizeButton = canSubmit && vm.requisition.program.skipAuthorization;
            vm.displayAuthorizeButton = canAuthorize;
            vm.displayDeleteButton = canDelete;
            vm.displayApproveAndRejectButtons = canApproveAndReject;
            vm.displaySkipButton = canSkip;
            vm.displaySyncButton = canSync;
            // Malawi: set all to 0 button
            vm.displaySetAllTo0 = displaySetAllTo0();
            // --- ends here ---
        }

        function setTypeAndClass() {
            if (vm.requisition.emergency) {
                vm.requisitionType = 'requisitionView.emergency';
                vm.requisitionTypeClass = 'emergency';
            } else if (vm.requisition.reportOnly) {
                vm.requisitionType = 'requisitionView.reportOnly';
                vm.requisitionTypeClass = 'report-only';
            } else {
                vm.requisitionType = 'requisitionView.regular';
                vm.requisitionTypeClass = 'regular';
            }
        }

        /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name updateRequisition
         *
         * @description
         * After confirming with the user, the offline requisition is removed,
         * and the state is reloaded. This will fetch a fresh version of the
         * requisition.
         *
         * If the browser is offline, an error will be thrown, and nothing will
         * change.
         *
         */
        function updateRequisition() {
            if(offlineService.isOffline()) {
                alertService.error('requisitionView.updateOffline');
                return;
            }

            confirmService.confirm('requisitionView.updateWarning', 'requisitionView.update')
            .then(function(){
                requisitionService.removeOfflineRequisition(requisition.id);
                $state.reload();
            });
        }

         /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name syncRnr
         *
         * @description
         * Responsible for syncing requisition with the server. If the requisition fails to sync,
         * an error notification will be displayed. Otherwise, a success notification will be shown.
         * If the error status is 409 (conflict), the requisition will be reloaded, since this
         * indicates a version conflict.
         */
        function syncRnr() {
            var loadingPromise = loadingModalService.open();
            saveRnr().then(function() {
                loadingPromise.then(function() {
                    notificationService.success('requisitionView.sync.success');
                });
                reloadState();
            }, function(response) {
                handleSaveError(response.status);
            });
        }

         /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name syncRnrAndPrint
         *
         * @description
         * Responsible for syncing requisition with the server. If the requisition fails to sync,
         * an error notification will be displayed. Otherwise, a success notification will be shown
         * and the requisition will be printed.
         * If the error status is 409 (conflict), the requisition will be reloaded, since this
         * indicates a version conflict.
         */
        function syncRnrAndPrint() {
            if (vm.displaySyncButton) {
                var popup = $window.open('', '_blank');
                popup.document.write(messageService.get('requisitionView.sync.pending'));
                var loadingPromise = loadingModalService.open();
                saveRnr().then(function() {
                    watcher.disableWatcher();
                    loadingPromise.then(function() {
                        notificationService.success('requisitionView.sync.success');
                    });
                    popup.location.href = accessTokenFactory.addAccessToken(vm.getPrintUrl());
                    reloadState();
                }, function(response) {
                  handleSaveError(response.status);
                  popup.close();
              });
            } else {
                $window.open(accessTokenFactory.addAccessToken(vm.getPrintUrl()), '_blank');
            }
        }

        function saveRnr() {
            vm.requisition.$modified = false;
            return vm.requisition.$save();
        }

        /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name submitRnr
         *
         * @description
         * Responsible for submitting requisition. Displays confirmation dialog, and checks
         * requisition validity before submission. If the requisition is not valid, fails to save or
         * an error occurs during submission, an error notification modal will be displayed.
         * Otherwise, a success notification modal will be shown.
         */
        // Malawi: Display alternate warning message
        function submitRnr() {
            var isSubmissionWarningProgram = (requisition.program.code === REQUISITION_WARNING_PROGRAM_CODE);
            var isSubmissionWarningPeriod = false;

            if(requisition.processingPeriod) { // Wrapped IF statement so I didn't have to fork RequisitionViewController unit tests
                REQUISITION_WARNING_PERIODS.forEach(function(month){
                    if(requisition.processingPeriod.name.indexOf(month) >= 0){
                        isSubmissionWarningPeriod = true;
                    }
                });
            }

            var submitWarningMessage = 'requisitionView.submit.confirm';
            if(isSubmissionWarningPeriod && isSubmissionWarningProgram){
                submitWarningMessage = 'requisitionPeriodWarning.confirm';
            }

            confirmService.confirm(submitWarningMessage, 'requisitionView.submit.label')
            .then(doSubmitRnr);
        }

        /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name doSubmitRnr
         *
         * @description
         * Responsible for submitting requisition, checking requisition
         * validity beforesubmission. If the requisition is not valid, fails to
         * save or an error occurs during submission, an error notification
         * modal will be displayed. Otherwise, a success notification modal
         * will be shown.
         */
        function doSubmitRnr() {
            if (requisitionValidator.validateRequisition(requisition)) {
                var loadingPromise = loadingModalService.open();
                if (!requisitionValidator.areAllLineItemsSkipped(requisition.requisitionLineItems)) {
                    if (vm.requisition.program.enableDatePhysicalStockCountCompleted) {
                        var modal = new RequisitionStockCountDateModal(vm.requisition);
                        modal.then(saveThenSubmit);
                    } else {
                        saveThenSubmit();
                    }
                } else {
                    failWithMessage('requisitionView.allLineItemsSkipped')();
                }
            } else {
                failWithMessage('requisitionView.rnrHasErrors')();
            }

            function saveThenSubmit() {
                var loadingPromise = loadingModalService.open();
                vm.requisition.$save().then(function () {
                    vm.requisition.$submit().then(function (response) {
                        watcher.disableWatcher();
                        loadingPromise.then(function () {
                            notificationService.success('requisitionView.submit.success');
                        });
                        stateTrackerService.goToPreviousState('openlmis.requisitions.initRnr');
                    }, failWithMessage('requisitionView.submit.failure'));
                }, function(response) {
                    handleSaveError(response.status);
                });
            }
        }
        // --- ends here ---

        /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name authorizeRnr
         *
         * @description
         * Responsible for authorizing requisition. Displays confirmation dialog, and checks
         * requisition validity before authorization. If the requisition is not valid, fails to
         * save or an error occurs during authorization, an error notification modal will be
         * displayed.
         * Otherwise, a success notification modal will be shown.
         */
        function authorizeRnr() {
            confirmService.confirm(
                'requisitionView.authorize.confirm',
                'requisitionView.authorize.label'
            ).then(function() {
                if(requisitionValidator.validateRequisition(requisition)) {
                    if(!requisitionValidator.areAllLineItemsSkipped(requisition.requisitionLineItems)) {
                        if (vm.requisition.program.enableDatePhysicalStockCountCompleted) {
                            var modal = new RequisitionStockCountDateModal(vm.requisition);
                            modal.then(saveThenAuthorize);
                        } else {
                            saveThenAuthorize();
                        }
                    } else {
                        failWithMessage('requisitionView.allLineItemsSkipped')();
                    }
                } else {
                    $scope.$broadcast('openlmis-form-submit');
                    failWithMessage('requisitionView.rnrHasErrors')();
                }
            });

            function saveThenAuthorize() {
                var loadingPromise = loadingModalService.open();
                vm.requisition.$save().then(function () {
                    vm.requisition.$authorize().then(function (response) {
                        watcher.disableWatcher();
                        loadingPromise.then(function () {
                            notificationService.success('requisitionView.authorize.success');
                        });
                        stateTrackerService.goToPreviousState('openlmis.requisitions.initRnr');
                    }, loadingModalService.close);
                }, function (response) {
                    handleSaveError(response.status);
                });
            }
        }

        /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name removeRnr
         *
         * @description
         * Responsible for removing requisition. Displays confirmation dialog before deletion.
         * If an error occurs during authorization, it will display an error notification modal.
         * Otherwise, a success notification modal will be shown.
         */
        function removeRnr() {
            confirmService.confirmDestroy(
                'requisitionView.delete.confirm',
                'requisitionView.delete.label'
            ).then(function() {
                var loadingPromise = loadingModalService.open();
                vm.requisition.$remove().then(function(response) {
                    watcher.disableWatcher();
                    loadingPromise.then(function() {
                        notificationService.success('requisitionView.delete.success');
                    });
                    stateTrackerService.goToPreviousState('openlmis.requisitions.initRnr');
                }, loadingModalService.close);
            });
        }

        /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name approveRnr
         *
         * @description
         * Responsible for approving requisition. Displays confirmation dialog, and checks
         * requisition validity before approval. If the requisition is not valid or it fails to
         * save, an error notification modal will be displayed.
         * Otherwise, a success notification modal will be shown.
         */
        function approveRnr() {
            confirmService.confirm(
                'requisitionView.approve.confirm',
                'requisitionView.approve.label'
            ).then(function() {
                if(requisitionValidator.validateRequisition(requisition)) {
                    var loadingPromise = loadingModalService.open();
                    vm.requisition.$save().then(function() {
                        vm.requisition.$approve().then(function(response) {
                            watcher.disableWatcher();
                            loadingPromise.then(function() {
                                notificationService.success('requisitionView.approve.success');
                            });
                            stateTrackerService.goToPreviousState('openlmis.requisitions.approvalList');
                        }, loadingModalService.close);
                    }, function(response) {
                        handleSaveError(response.status);
                    });
                } else {
                    $scope.$broadcast('openlmis-form-submit');
                    failWithMessage('requisitionView.rnrHasErrors')();
                }
            });
        }

        /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name rejectRnr
         *
         * @description
         * Responsible for rejecting requisition. Displays confirmation dialog before rejection.
         * If an error occurs during rejecting it will display an error notification modal.
         * Otherwise, a success notification modal will be shown.
         */
        // Malawi: Rejecting LMIS form should require a reason
        function rejectRnr() {
            if (!(vm.requisition.draftStatusMessage)) {
                alertService.error('requisitionView.rejectMissingCommentError');
            } else {
                confirmService.confirmDestroy(
                    'requisitionView.reject.confirm',
                    'requisitionView.reject.label'
                ).then(function() {
                    var loadingPromise = loadingModalService.open();
                    vm.requisition.$save().then(function() {
                        vm.requisition.$reject()
                        .then(function() {
                            watcher.disableWatcher();
                            loadingPromise.then(function() {
                                notificationService.success('requisitionView.reject.success');
                            });
                            stateTrackerService.goToPreviousState('openlmis.requisitions.approvalList');
                        })
                        .catch(function() {
                            failWithMessage('requisitionView.reject.failure');
                        });
                    })
                    .catch(loadingModalService.close);
                });
            }
        }
        // --- ends here ---

        /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name skipRnr
         *
         * @description
         * Responsible for skipping requisition. Displays confirmation dialog before skipping.
         * If an error occurs during skipping it will display an error notification modal.
         * Otherwise, a success notification modal will be shown.
         */
        function skipRnr() {
            confirmService.confirm(
                'requisitionView.skip.confirm',
                'requisitionView.skip.label'
            ).then(function() {
                var loadingPromise = loadingModalService.open();
                vm.requisition.$skip().then(function(response) {
                    watcher.disableWatcher();
                    loadingPromise.then(function() {
                        notificationService.success('requisitionView.skip.success');
                    });
                    stateTrackerService.goToPreviousState('openlmis.requisitions.initRnr');
                }, failWithMessage('requisitionView.skip.failure'));
            });
        }
        /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name getPrintUrl
         *
         * @description
         * Prepares a print URL for the given requisition.
         *
         * @return {String} the prepared URL
         */
        // Malawi: link to the updated requisition printout
        function getPrintUrl() {
            return requisitionUrlFactory('/api/reports/requisitions/' + vm.requisition.id + '/print');
        }
        // --- ends here ---

        /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name isFullSupplyTabValid
         *
         * @description
         * Checks whether full supply tab has any errors. This method ignores skipped line items and
         * does not trigger validation.
         *
         * @return {Boolean} true if full supply tab has any errors, false otherwise
         */
        function isFullSupplyTabValid() {
            var fullSupplyItems = $filter('filter')(vm.requisition.requisitionLineItems, {
                    $program: {
                        fullSupply: true
                    }
                }, true),
                valid = requisitionValidator.areLineItemsValid(fullSupplyItems);

            vm.invalidFullSupply = valid ? undefined : messageService.get('requisitionView.requisition.error');

            return valid;
        }

        /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name isNonFullSupplyTabValid
         *
         * @description
         * Checks whether non full supply tab has any errors. This method ignores skipped line items
         * and does not trigger validation.
         *
         * @return {Boolean} true if non full supply tab has any errors, false otherwise
         */
        function isNonFullSupplyTabValid() {
            var nonFullSupplyItems = $filter('filter')(vm.requisition.requisitionLineItems, {
                    $program: {
                        fullSupply: false
                    }
                }, true),
                valid = requisitionValidator.areLineItemsValid(nonFullSupplyItems);

            vm.invalidNonFullSupply = valid ? undefined : messageService.get('requisitionView.requisition.error');

            return valid;
        }

        function handleSaveError(status) {
            if (status === 409) {
                // in case of conflict, use the server version
                notificationService.error('requisitionView.versionMismatch');
                reloadState();
            } else if (status === 403) {
                // 403 means user lost rights or requisition changed status
                notificationService.error('requisitionView.updateForbidden');
                reloadState();
            } else {
                failWithMessage('requisitionView.sync.failure')();
            }
        }

        function reloadState() {
            $state.reload();
        }

        function failWithMessage(message) {
            return function() {
                loadingModalService.close();
                alertService.error(message);
            };
        }

        // Malawi: display price info
        /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name displayPriceInfo
         *
         * @param {Object} requisition Requisition with status to check
         *
         * @return {boolean} true if requisition is in status IN_APPROVAL or AUTHORIZED, false otherwise
         *
         * @description
         * Determines whether requisition is IN_APPROVAL or AUTHORIZED status.
         */
        function displayPriceInfo(requisition) {
            return requisition.$isInApproval() || requisition.$isAuthorized();
        }
        // --- ends here ---

        // Malawi: set all to 0 button
        function hasRightForProgram(rightName) {
            return authorizationService.hasRight(rightName, {
                programId: vm.requisition.program.id
            });
        }

        /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name displaySetAllTo0
         *
         * @description
         * Determines whether to display the "Set all to 0" button. Returns true if
         * the approved quantity column is visible and user can approve or reject.
         *
         * @return {Boolean} should approve and reject buttons be displayed
         */
        function displaySetAllTo0() {
            var approvedQuantityColumn = requisition.template.getColumn(TEMPLATE_COLUMNS.APPROVED_QUANTITY);
            return approvedQuantityColumn.isDisplayed && vm.requisition.$isAuthorized() && hasRightForProgram(REQUISITION_RIGHTS.REQUISITION_APPROVE);
        }

        /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name setAllToZero
         *
         * @description
         * Sets approved quantities of all products to zero.
         */
        function setAllToZero() {
            angular.forEach(requisition.requisitionLineItems, function(lineItem) {
                lineItem.approvedQuantity = 0;
            })
        }
        // --- ends here ---

        // Malawi: disable skip button if user inputs are not empty
        /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name enableSkip
         *
         * @description
         * Determines whether to enable skip requisition button or not.
         *
         * @return {Boolean} true if skip button should be enabled, false otherwise
         */
        function enableSkip() {
            return vm.displaySkipButton && !hasDataInUserInputs();
        }

        function hasDataInUserInputs() {
            var userInputColumns = requisition.template.getColumns().filter(function(column) {
                return column.$display === true &&
                    column.source === COLUMN_SOURCES.USER_INPUT &&
                    column.name !== 'beginningBalance';
            });
            return requisition.requisitionLineItems.some(function(lineItem) {
                return userInputColumns.some(function(column) {
                    if (!isEmpty(lineItem[column.name])) {
                        return true
                    }
                });
            });
        }

        function isEmpty(value) {
            return (value === null || value === undefined || value === '');
        }
        // --- ends here ---
    }
})();
