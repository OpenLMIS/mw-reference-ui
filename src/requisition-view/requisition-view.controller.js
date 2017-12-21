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
        'localStorageFactory', 'REQUISITION_WARNING_PROGRAM_CODE', 'REQUISITION_WARNING_PERIODS'
    ];

    function RequisitionViewController($state, requisition, requisitionValidator,
                                       authorizationService, requisitionService,
                                       loadingModalService, alertService, notificationService,
                                       confirmService, REQUISITION_RIGHTS, FULFILLMENT_RIGHTS,
                                       offlineService, $window, requisitionUrlFactory, $filter,
                                       $scope, RequisitionWatcher, accessTokenFactory,
                                       messageService, stateTrackerService, RequisitionStockCountDateModal,
                                       localStorageFactory, REQUISITION_WARNING_PROGRAM_CODE,
                                       REQUISITION_WARNING_PERIODS) {

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
         * Holds message key to display, depending on the requisition type (regular/emergency).
         */
        vm.requisitionType = vm.requisition.emergency ?
            'requisitionView.emergency' :
            'requisitionView.regular';

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

        // Functions

        vm.$onInit = onInit;
        vm.updateRequisition = updateRequisition;
        vm.syncRnr = syncRnr;
        vm.syncRnrAndPrint = syncRnrAndPrint;
        vm.syncRnrAndMalawiPrint = syncRnrAndMalawiPrint;
        vm.submitRnr = submitRnr;
        vm.authorizeRnr = authorizeRnr;
        vm.removeRnr = removeRnr;
        vm.approveRnr = approveRnr;
        vm.rejectRnr = rejectRnr;
        vm.skipRnr = skipRnr;
        vm.isOffline = offlineService.isOffline;
        vm.getPrintUrl = getPrintUrl;
        vm.getMalawiPrintUrl = getMalawiPrintUrl;
        vm.isFullSupplyTabValid = isFullSupplyTabValid;
        vm.isNonFullSupplyTabValid = isNonFullSupplyTabValid;
        vm.displayPriceInfo = displayPriceInfo;
        vm.setAllToZero = setAllToZero;

        /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name $onInit
         *
         * @description
         * Initialization method of the RequisitionViewController.
         */
        function onInit() {
            vm.canSubmit = displaySubmit();
            vm.canAuthorize = displayAuthorize();
            vm.canDelete = displayDelete();
            vm.canApproveAndReject = displayApproveAndReject();
            vm.canSkip = displaySkip();
            vm.canSync = displaySync();
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
            if (displaySync()) {
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

         /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name syncRnrAndMalawiPrint
         *
         * @description
         * Responsible for syncing requisition with the server. If the requisition fails to sync,
         * an error notification will be displayed. Otherwise, a success notification will be shown
         * and the requisition will be printed.
         * If the error status is 409 (conflict), the requisition will be reloaded, since this
         * indicates a version conflict.
         */
        function syncRnrAndMalawiPrint() {
            if (displaySync()) {
                var popup = $window.open('', '_blank');
                popup.document.write(messageService.get('requisitionView.sync.pending'));
                var loadingPromise = loadingModalService.open();
                saveRnr().then(function() {
                    loadingPromise.then(function() {
                        notificationService.success('requisitionView.sync.success');
                    });
                    popup.location.href = accessTokenFactory.addAccessToken(vm.getMalawiPrintUrl());
                    reloadState();
                }, function(response) {
                  handleSaveError(response.status);
                  popup.close();
              });
            } else {
                $window.open(accessTokenFactory.addAccessToken(vm.getMalawiPrintUrl()), '_blank');
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

            confirmService.confirm(submitWarningMessage, 'requisitionView.submit.label').then(function() {
                if (requisitionValidator.validateRequisition(requisition)) {
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
                    $scope.$broadcast('openlmis-form-submit');
                    failWithMessage('requisitionView.rnrHasErrors')();
                }
            });

            function saveThenSubmit() {
                var loadingPromise = loadingModalService.open();
                vm.requisition.$save().then(function () {
                    vm.requisition.$submit().then(function (response) {
                        watcher.disableWatcher();
                        loadingPromise.then(function () {
                            notificationService.success('requisitionView.submit.success');
                        });
                        stateTrackerService.goToPreviousState('openlmis.requisitions.initRnr');
                    }, loadingModalService.close);
                }, function(response) {
                    handleSaveError(response.status);
                });
            }
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
                    vm.requisition.$save().then(function () {
                        vm.requisition.$submit().then(function (response) {
                            loadingPromise.then(function () {
                                notificationService.success('requisitionView.submit.success');
                            });
                            stateTrackerService.goToPreviousState('openlmis.requisitions.initRnr');
                        }, failWithMessage('requisitionView.submit.failure'));
                    }, function(response) {
                        handleSaveError(response.status);
                    });
                } else {
                    failWithMessage('requisitionView.allLineItemsSkipped')();
                }
            } else {
                failWithMessage('requisitionView.rnrHasErrors')();
            }
        }

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
                        }, failWithMessage('requisitionView.approve.failure'));
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
        function rejectRnr() {
            if (!(vm.requisition.draftStatusMessage)) {
                alertService.error('requisitionView.rejectMissingCommentError');
            } else {
                confirmService.confirmDestroy(
                    'requisitionView.reject.confirm',
                    'requisitionView.reject.label'
                ).then(function () {
                    var loadingPromise = loadingModalService.open();
                    vm.requisition.$save().then(function () {
                        vm.requisition.$reject().then().then(function (response) {
                            watcher.disableWatcher();
                            loadingPromise.then(function () {
                                notificationService.success('requisitionView.reject.success');
                            });
                            stateTrackerService.goToPreviousState('openlmis.requisitions.approvalList');
                        }, failWithMessage('requisitionView.reject.failure'));
                    });

                });
            }
        }

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
         * @name displayAuthorize
         *
         * @description
         * Determines whether to display authorize button or not. Returns true only if requisition
         * is submitted and user has permission to authorize requisition.
         *
         * @return {Boolean} should authorize button be displayed
         */
        function displayAuthorize() {
            return vm.requisition.$isSubmitted() && hasRightForProgram(REQUISITION_RIGHTS.REQUISITION_AUTHORIZE);
        }

        /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name displaySubmit
         *
         * @description
         * Determines whether to display submit button or not. Returns true only if requisition
         * is initiated and user has permission to create requisition.
         *
         * @return {Boolean} should submit button be displayed
         */
        function displaySubmit() {
            return (vm.requisition.$isInitiated() || vm.requisition.$isRejected()) && hasRightForProgram(REQUISITION_RIGHTS.REQUISITION_CREATE);
        }

        /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name displayApproveAndReject
         *
         * @description
         * Determines whether to display approve and reject buttons or not. Returns true only if
         * requisition is authorized or in approval and user has permission to approve requisition.
         *
         * @return {Boolean} should approve and reject buttons be displayed
         */
        function displayApproveAndReject() {
            return (vm.requisition.$isAuthorized() || vm.requisition.$isInApproval()) && hasRightForProgram(REQUISITION_RIGHTS.REQUISITION_APPROVE);
        }

        /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name displayDelete
         *
         * @description
         * Determines whether to display delete button or not. Returns true only if
         * user has permission to delete requisition. User needs to have create right when
         * requisition is initiated and authorize right when requisition is in submitted state.
         *
         * @return {Boolean} should delete button be displayed
         */
        function displayDelete() {
            if (hasRightForProgram(REQUISITION_RIGHTS.REQUISITION_DELETE)) {
                if (vm.requisition.$isInitiated() || vm.requisition.$isRejected() || vm.requisition.$isSkipped()) {
                    return hasRightForProgram(REQUISITION_RIGHTS.REQUISITION_CREATE);
                }
                if (vm.requisition.$isSubmitted()) {
                    return hasRightForProgram(REQUISITION_RIGHTS.REQUISITION_AUTHORIZE);
                }
            }
            return false;
        }

        /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name displaySkip
         *
         * @description
         * Determines whether to display skip requisition button or not. Returns true only if
         * requisition program allows to skip requisition.
         *
         * @return {Boolean} true if skip button should be visible, false otherwise
         */
        function displaySkip() {
            return (vm.requisition.$isInitiated() || vm.requisition.$isRejected()) &&
                vm.requisition.program.periodsSkippable &&
                !vm.requisition.emergency &&
                hasRightForProgram(REQUISITION_RIGHTS.REQUISITION_CREATE);
        }

        /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name displaySync
         *
         * @description
         * Determines whether to display sync with server button or not. Returns true only if
         * requisition has status INITIATED, SUBMITTED or AUTHORIZED.
         *
         * @return {Boolean} true if sync button should be visible, false otherwise
         */
        function displaySync() {
            if (vm.requisition.$isInitiated() || vm.requisition.$isRejected()) {
                return hasRightForProgram(REQUISITION_RIGHTS.REQUISITION_CREATE);
            }
            if (vm.requisition.$isSubmitted()) {
                return hasRightForProgram(REQUISITION_RIGHTS.REQUISITION_AUTHORIZE);
            }
            if (vm.requisition.$isAuthorized() || vm.requisition.$isInApproval()) {
                return hasRightForProgram(REQUISITION_RIGHTS.REQUISITION_APPROVE);
            }
            return false;
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
        function getPrintUrl() {
            return requisitionUrlFactory('/api/requisitions/' + vm.requisition.id + '/print');
        }

        /**
         * @ngdoc method
         * @methodOf requisition-view.controller:RequisitionViewController
         * @name getMalawiPrintUrl
         *
         * @description
         * Prepares a print URL for the given requisition.
         *
         * @return {String} the prepared URL
         */
        function getMalawiPrintUrl() {
            return requisitionUrlFactory('/api/reports/requisitions/' + vm.requisition.id + '/print');
        }

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

        function hasRightForProgram(rightName) {
            return authorizationService.hasRight(rightName, {
                programCode: vm.requisition.program.code
            });
        }
    }
})();