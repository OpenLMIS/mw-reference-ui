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
     * @ngdoc directive
     * @restrict A
     * @name requisition-product-grid.productGridCell
     *
     * @description
     * Responsible for rendering the product grid cell based on the column source and requisitions type.
     * It also keeps track of the validation as well as changes made to the related cells.
     *
     * @example
     * Here we extend our product grid cell with the directive.
     * ```
     * <td ng-repeat="column in visibleColumns | orderBy : 'displayOrder'" product-grid-cell></td>
     * ```
     */
    angular
        .module('requisition-product-grid')
        .directive('productGridCell', productGridCell);

    productGridCell.$inject = [
        // Malawi: Zonal approver should be able to change requisitions IN_APPROVAL
        '$templateRequest', '$compile', 'requisitionValidator', 'TEMPLATE_COLUMNS', 'COLUMN_TYPES', 'COLUMN_SOURCES',
        'authorizationService', 'REQUISITION_RIGHTS'
        // --- ends here ---
    ];

    // Malawi: Zonal approver should be able to change requisitions IN_APPROVAL
    function productGridCell($templateRequest, $compile, requisitionValidator, TEMPLATE_COLUMNS, COLUMN_TYPES,
                             COLUMN_SOURCES, authorizationService, REQUISITION_RIGHTS) {
        // --- ends here ---

        return {
            restrict: 'A',
            link: link,
            scope: {
                requisition: '=',
                column: '=',
                lineItem: '=',
                userCanEdit: '=',
                canApprove: '='
            }
        };

        function link(scope, element) {
            var requisition = scope.requisition,
                column = scope.column,
                lineItem = scope.lineItem;

            scope.lineItem = lineItem;
            scope.column = column;
            scope.validate = validate;
            scope.update = update;
            scope.isReadOnly = isReadOnly(requisition, column);
            scope.canSkip = canSkip;

            if (!scope.isReadOnly) {
                setupValueWatcher(scope);
                // Malawi: Added auto calculation and suggestion how much should be adjusted
                setupDifferenceWatcher(scope);
                // --- ends here ---
            }

            setupErrorWatcher(scope);

            scope.$on('openlmisInvalid.update', validate);

            updateCellContents();

            function updateCellContents() {
                var templateUrl = '';
                if (column.name === TEMPLATE_COLUMNS.SKIPPED) {
                    templateUrl = 'requisition-product-grid/product-grid-cell-skip.html';
                } else if (column.name === TEMPLATE_COLUMNS.TOTAL_LOSSES_AND_ADJUSTMENTS &&
                    !requisition.template.populateStockOnHandFromStockCards) {
                    templateUrl = 'requisition-product-grid/product-grid-cell-total-losses-and-adjustments.html';
                } else if (column.$type === COLUMN_TYPES.NUMERIC && !scope.isReadOnly) {
                    templateUrl = 'requisition-product-grid/product-grid-cell-input-numeric.html';
                } else if (!scope.isReadOnly) {
                    templateUrl = 'requisition-product-grid/product-grid-cell-input-text.html';
                } else if (column.$type === COLUMN_TYPES.CURRENCY) {
                    templateUrl = 'requisition-product-grid/product-grid-cell-currency.html';
                } else {
                    templateUrl = 'requisition-product-grid/product-grid-cell-text.html';
                }
                $templateRequest(templateUrl).then(replaceCell);
            }

            function replaceCell(newTemplate) {
                var cellWrapperPath = 'requisition-product-grid/product-grid-cell.html';
                $templateRequest(cellWrapperPath).then(function(template) {
                    template = angular.element(template);
                    template.html(newTemplate);

                    var cell = $compile(template)(scope);
                    element.replaceWith(cell);

                    element = cell;

                    // Malawi: Made product-name column collapsable
                    if (column.name === TEMPLATE_COLUMNS.PRODUCT_NAME) {
                        element.wrapInner('<div class="collapsable"></div>');
                    }
                    // --- ends here ---
                });
            }

            function update() {
                lineItem.updateDependentFields(column, requisition);
                validate();
            }

            function validate() {
                return requisitionValidator.validateLineItem(
                    scope.lineItem,
                    requisition.template.getColumns(!scope.lineItem.$program.fullSupply),
                    requisition
                );
            }

            function isReadOnly(requisition, column) {
                // Malawi: override isReadOnly
                if ((requisition.$isInApproval() && !isTbProgram(requisition)) || requisition.$isApproved() || requisition.$isReleased()) {
                    return true;
                }
                if (requisition.$isAuthorized() || requisition.$isInApproval()) {
                    if (hasApproveRightForProgram(requisition) && isApprovalColumn(column)) {
                        return false;
                    }
                }
                if (column.name === TEMPLATE_COLUMNS.BEGINNING_BALANCE) {
                    return true;
                }
                if (column.source === COLUMN_SOURCES.USER_INPUT) {
                    if (hasAuthorizeRightForProgram(requisition) && requisition.$isSubmitted()) {
                        return false;
                    }
                    if (hasCreateRightForProgram(requisition) && (requisition.$isInitiated() || requisition.$isRejected())) {
                        return false;
                    }
                }
                // --- ends here ---

                // If we don't know that the field is editable, its read only
                return true;
            }

            function canEditColumn(column) {
                return column.source === COLUMN_SOURCES.USER_INPUT && scope.userCanEdit;
            }

            // Malawi: Zonal approver should be able to change requisitions IN_APPROVAL
            function hasAuthorizeRightForProgram() {
                return authorizationService.hasRight(REQUISITION_RIGHTS.REQUISITION_AUTHORIZE, {
                    programId: requisition.program.id
                });
            }

            function canSkip() {
                return (scope.userCanEdit || hasAuthorizeRightForProgram()) &&
                    lineItem.canBeSkipped(scope.requisition);
            }
            // --- ends here ---

        }

        function setupValueWatcher(scope) {
            scope.$watch(function() {
                return scope.lineItem[scope.column.name];
            }, function(newValue, oldValue) {
                if (newValue !== oldValue) {
                    scope.lineItem.updateDependentFields(scope.column, scope.requisition);
                }
            });
        }

        function setupErrorWatcher(scope) {
            scope.$watch(function() {
                if (scope.lineItem.skipped) {
                    return false;
                }
                return scope.lineItem.$errors[scope.column.name];
            }, function(error) {
                // Malawi: Added auto calculation and suggestion how much should be adjusted
                if (scope.lineItem.difference[scope.column.name]) {
                    scope.invalidMessage = displayError(error, scope.lineItem.difference[scope.column.name]);
                } else {
                    scope.invalidMessage = error ? error : undefined;
                }
                // --- ends here ---
            });
        }

        // Malawi: Added auto calculation and suggestion how much should be adjusted
        function setupDifferenceWatcher(scope) {
            scope.$watch(function() {
                if (scope.lineItem.skipped) {
                    return false;
                }
                return scope.lineItem.difference[scope.column.name];
            }, function(difference) {
                scope.invalidMessage = displayError(scope.lineItem.$errors[scope.column.name], difference);
            });
        }
        // --- ends here ---

        function isApprovalColumn(column) {
            return [TEMPLATE_COLUMNS.APPROVED_QUANTITY, TEMPLATE_COLUMNS.REMARKS]
                .indexOf(column.name) !== -1;
        }

        // Malawi: Added auto calculation and suggestion how much should be adjusted
        function displayError(error, difference) {
            if (!error) {
                return;
            }
            return difference ? error.concat(
                '. The difference between the calculated and entered value is ', difference, '.'
            ) : error;
        }
        // --- ends here ---

        // Malawi: override isReadOnly
        function hasApproveRightForProgram(requisition) {
            return authorizationService.hasRight(REQUISITION_RIGHTS.REQUISITION_APPROVE, {
                programId: requisition.program.id
            });
        }

        function hasCreateRightForProgram(requisition) {
            return authorizationService.hasRight(REQUISITION_RIGHTS.REQUISITION_CREATE, {
                programId: requisition.program.id
            });
        }

        function isTbProgram(requisition) {
            return requisition.program.code === 'tb';
        }
        // --- ends here ---
    }

})();
