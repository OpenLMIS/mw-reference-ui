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

    decorator.$inject = ['$delegate', 'calculationFactory', 'COLUMN_SOURCES', 'COLUMN_TYPES'];

    function decorator($delegate, calculationFactory, COLUMN_SOURCES, COLUMN_TYPES) {
        var delegatedLineItem = LineItem;

        delegatedLineItem.prototype.getFieldValue = $delegate.prototype.getFieldValue;
        delegatedLineItem.prototype.updateFieldValue = $delegate.prototype.updateFieldValue;
        delegatedLineItem.prototype.updateDependentFields = $delegate.prototype.updateDependentFields;
        delegatedLineItem.prototype.canBeSkipped = $delegate.prototype.canBeSkipped;
        delegatedLineItem.prototype.isNonFullSupply = $delegate.prototype.isNonFullSupply;
        delegatedLineItem.prototype.updateFieldValue = updateFieldValue;

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
            this.stockAdjustments = lineItem.stockAdjustments;
            this.skipped = lineItem.skipped;

            this.$errors = {};
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
                } else {
                    object[propertyName] = object[propertyName] ? object[propertyName] : '';
                }
            }
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
            var id = fullPath.lastIndexOf('.')
            return id > -1 ? fullPath.substr(id) : fullPath;
        }

        function checkIfNullOrZero(value) {
            if (value === 0) {
                value = 0;
            } else if (value === null) {
                value = null;
            }
        }
    };

})();
