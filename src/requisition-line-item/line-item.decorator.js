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
     * @ngdoc service
     * @name requisition-line-item.LineItem
     *
     * @description
     * Decorates method to the LineItem, making it
     * so the approved quantity value is displayed as 0
     * and facility operator is CHAM.
     */
    angular.module('requisition-line-item')
        .config(config);

    config.$inject = ['$provide'];

    function config($provide) {
        $provide.decorator('LineItem', decorator);
    }

    decorator.$inject = ['$delegate', 'calculationFactory', 'authorizationService',
        'COLUMN_SOURCES', 'COLUMN_TYPES', 'TEMPLATE_COLUMNS', 'REQUISITION_RIGHTS'];

    function decorator($delegate, calculationFactory, authorizationService,
                       COLUMN_SOURCES, COLUMN_TYPES, TEMPLATE_COLUMNS, REQUISITION_RIGHTS) {
        var delegatedLineItem = LineItem;

        delegatedLineItem.prototype.getFieldValue = $delegate.prototype.getFieldValue;
        delegatedLineItem.prototype.updateDependentFields = $delegate.prototype.updateDependentFields;
        delegatedLineItem.prototype.canBeSkipped = canBeSkipped;
        delegatedLineItem.prototype.isNonFullSupply = $delegate.prototype.isNonFullSupply;
        delegatedLineItem.prototype.updateFieldValue = updateFieldValue;
        delegatedLineItem.prototype.isReadOnly = isReadOnly;

        return delegatedLineItem;

        /**
         * @ngdoc method
         * @methodOf requisition-line-item.LineItem
         * @name LineItem
         *
         * @description
         * Adds needed properties and methods to line items based on it and requisition parent.
         *
         * @param {Object} lineItem Requisition line item to be updated
         * @param {Object} requisition Requisition that has given line item
         */
        function LineItem(lineItem, requisition) {
            angular.copy(lineItem, this);

            this.orderable = lineItem.orderable;
            this.orderable.fullProductName = displayProductNameWithNetContent(lineItem.orderable.fullProductName, lineItem.orderable.netContent);
            this.stockAdjustments = lineItem.stockAdjustments;
            this.skipped = lineItem.skipped;

            this.$errors = {};
            this.difference = {};
            this.$program = this.orderable.$program ? this.orderable.$program : getProgramById(lineItem.orderable.programs, requisition.program.id);

            var newLineItem = this;
            requisition.template.getColumns(!this.$program.fullSupply).forEach(function(column) {
                newLineItem.updateFieldValue(column, requisition);
            });
        }

        /**
         * @ngdoc method
         * @methodOf requisition-line-item.LineItem
         * @name updateFieldValue
         *
         * @description
         * Updates column value in the line item based on column type and source.
         * Set 0 as default value of approved quantity.
         *
         * @param {Object} column Requisition template column
         * @param {Object} requisition Requisition to which line item belongs
         */
        function updateFieldValue(column, requisition) {
            var fullName = column.name,
                object = getObject(this, fullName),
                propertyName = getPropertyName(column.name);

            if(object) {
                if (column.source === COLUMN_SOURCES.CALCULATED) {
                    object[propertyName] = calculationFactory[fullName] ? calculationFactory[fullName](this, requisition) : null;
                } else if (column.$type === COLUMN_TYPES.NUMERIC || column.$type === COLUMN_TYPES.CURRENCY) {
                    if (requisition.facility.operator.code == 'CHAM' && fullName == 'approvedQuantity' && !this.skipped) {
                        object[propertyName] = 0;
                    } else {
                        checkIfNullOrZero(object[propertyName]);
                    }
                    if (calculationFactory[fullName] && fullName != 'totalLossesAndAdjustments') {
                        this.difference[fullName] = object[propertyName] ? calculationFactory[fullName](this, requisition) - object[propertyName]
                            : calculationFactory[fullName](this, requisition);
                    }
                } else {
                    object[propertyName] = object[propertyName] ? object[propertyName] : '';
                }
            }
        }

        /**
         * @ngdoc method
         * @methodOf requisition.LineItem
         * @name canBeSkipped
         *
         * @description
         * Determines whether the line item from given requisition can be marked as skipped.
         *
         * @param {Object} requisition Requisition to which line item belongs
         * @return {Boolean} true if line item can be skipped
         */
        function canBeSkipped(requisition) {
            var result = true,
                lineItem = this,
                columns = requisition.template.getColumns(!this.$program.fullSupply);

            if (requisition.$isApproved() || requisition.$isAuthorized() || requisition.$isInApproval() || requisition.$isReleased()) {
                return false;
            }

            columns.forEach(function (column) {
                if (isInputDisplayedAndNotEmpty(column, lineItem)) {
                    if (!requisition.emergency || column.name !== 'beginningBalance') {
                        result = false;
                    }
                }
            });
            return result;
        }

        /**
         * @ngdoc method
         * @methodOf requisition.LineItem
         * @name isReadOnly
         *
         * @description
         * Determines whether a column within this line item is read only.
         *
         * @param {Object} requisition Requisition to which line item belongs
         * @param {Object} column Requisition template column
         * @return {Boolean} true if line item is read only
         */
        function isReadOnly(requisition, column) {
            if ((requisition.$isInApproval() && !isTbProgram(requisition)) || requisition.$isApproved() || requisition.$isReleased()){
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

            // If we don't know that the field is editable, its read only
            return true;
        }

        function hasApproveRightForProgram(requisition) {
            return authorizationService.hasRight(REQUISITION_RIGHTS.REQUISITION_APPROVE, {
                programCode: requisition.program.code
            });
        }

        function hasAuthorizeRightForProgram(requisition) {
            return authorizationService.hasRight(REQUISITION_RIGHTS.REQUISITION_AUTHORIZE, {
                programCode: requisition.program.code
            });
        }

        function hasCreateRightForProgram(requisition) {
            return authorizationService.hasRight(REQUISITION_RIGHTS.REQUISITION_CREATE, {
                programCode: requisition.program.code
            });
        }

        function isApprovalColumn(column) {
            var approvalColumns = [TEMPLATE_COLUMNS.APPROVED_QUANTITY, TEMPLATE_COLUMNS.REMARKS];

            return approvalColumns.indexOf(column.name) !== -1;
        }

        function isInputDisplayedAndNotEmpty(column, lineItem) {
            return column.$display
                && column.source === COLUMN_SOURCES.USER_INPUT
                && column.$type !== COLUMN_TYPES.BOOLEAN
                && !isEmpty(lineItem[column.name]);
        }

        function isEmpty(value) {
            return !value || !value.toString().trim();
        }

        function getProgramById(programs, programId) {
            var match;
            programs.forEach(function(program) {
                if (program.programId === programId) {
                    match = program;
                }
            });
            return match;
        }

        function getObject(from, path) {
            var object = from;
            if (path.indexOf('.') > -1) {
                var properties = path.split('.');
                properties.pop();
                properties.forEach(function(property) {
                    object = object[property];
                });
            }
            return object;
        }

        function getPropertyName(fullPath) {
            var id = fullPath.lastIndexOf('.');
            return id > -1 ? fullPath.substr(id) : fullPath;
        }

        function checkIfNullOrZero(value) {
            if (value === 0) {
                value = 0;
            } else if (value === null) {
                value = null;
            }
        }

        function displayProductNameWithNetContent(fullProductName, netContent) {
            var bracket = ' (';
            var stringToAdd = bracket.concat(netContent, ')');
            return fullProductName.indexOf(stringToAdd) > -1 ? fullProductName : fullProductName.concat(stringToAdd);
        }

        function isTbProgram(requisition) {
            return requisition.program.code === 'tb';
        }
    }

})();
