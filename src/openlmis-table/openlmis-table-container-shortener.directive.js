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
     * @restrict C
     * @name openlmis-table.directive:openlmisTableContainerHorizontalScroll
     *
     * @description
     * Adds a fake horizontal scroll bar to the table container
     *
     */
    angular
        .module('openlmis-form')
        .directive('openlmisTableContainer', directive);

    directive.$inject = ['jQuery', '$window', 'perfectScrollbar'];

    function directive(jQuery, $window, perfectScrollbar) {
        var directive = {
            link: link,
            restrict: 'C',
            priority: 15
        };
        return directive;


        function link(scope, element) {
            var xScrollbar,
                flexTable,
                window = jQuery($window);

            flexTable = jQuery('.openlmis-flex-table', element);
            flexTable.perfectScrollbar({
                handlers: ['click-rail', 'drag-scrollbar', 'keyboard', 'wheel', 'touch'],
                surpressScrollY: true,
                wheelPropagation: true
            });

            xScrollbar = jQuery('.ps__scrollbar-x-rail', element);

            angular.element($window).on('scroll', blit);
            angular.element($window).on('resize', update);

            element.on('$destroy', function() {
                window.on('resize', update);
                window.on('scroll', blit);
            });

            function update(){
                flexTable.perfectScrollbar('update');
                blit();
            }

            function blit(){
                var bottomOffset = 0,
                    windowBottom = window.scrollTop() + window.height(),
                    flexTableBottom = flexTable.offset().top + flexTable.height(),
                    tableHeadHeight = jQuery('thead', flexTable).height(),
                    // Adding extra buffer
                    tableBodyStart = tableHeadHeight*2;

                bottomOffset = flexTableBottom - windowBottom;

                bottomOffset += xScrollbar.height();

                // remove height of floating toolbar
                jQuery('.openlmis-toolbar').each(function(){
                    var div = jQuery(this);
                    bottomOffset += div.height();
                });

                // don't go below the bottom border
                if(bottomOffset < 0){
                    bottomOffset = 0;
                }

                // don't put header above table heading
                if(bottomOffset > flexTable.height() - tableBodyStart) {
                    bottomOffset = flexTable.height() - tableBodyStart;
                }

                xScrollbar.css('bottom', bottomOffset + 'px');
            }
        }
    }


})();