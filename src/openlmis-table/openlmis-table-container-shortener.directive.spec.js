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

ddescribe('openlmisTableContainer', function() {
    var $scope, $compile, table;

    beforeEach(module('openlmis-table'));
    beforeEach(module('openlmis-config'));

    beforeEach(function() {
        inject(function(_$rootScope_, _$compile_) {
            $scope = _$rootScope_.$new();
            $compile = _$compile_;
        });

        var html = '<div class="openlmis-table-container"><table><tbody><tr><td>Test</td><td>Test</td><td>Test</td></tbody></table><</div>';
        table = compileMarkup(html);

        //make horizontal scrollbar visible
        table.css('width', 100 + 'px');
        table.find('.openlmis-flex-table').css('width', 400 + 'px');
    });

    it('should apply scrollbar', function() {
        expect(table.find('.ps__scrollbar-x-rail')).toBeDefined();
    });

    it('should initiate perfect scrollbar', function(){
        //todo
    });


    //todo - determine why is this test failing
    it('should call update method when resizing screen', function(){
        var flexTable = table.find('.openlmis-flex-table');
        spyOn(flexTable, 'perfectScrollbar');

        flexTable.triggerHandler('resize');
        $scope.$digest();

        expect(flexTable.perfectScrollbar).toHaveBeenCalled();
    });

    function compileMarkup(markup) {
        var element = $compile(markup)($scope);

        angular.element('body').append(element);
        $scope.$digest();

        return element;
    }
});