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

describe('periodFactory', function() {

    var $rootScope, $q, periodServiceMock, periodFactory, periodOne, periodTwo;

    beforeEach(function() {
        module('requisition-initiate', function($provide){
            periodServiceMock = jasmine.createSpyObj('periodService', ['getPeriodsForInitiate']);
            $provide.service('periodService', function() {
                return periodServiceMock;
            });
        });

        inject(function(_$rootScope_, _$q_, _periodFactory_, _REQUISITION_STATUS_) {
            $rootScope = _$rootScope_;
            periodFactory = _periodFactory_;
            $q = _$q_;
            REQUISITION_STATUS = _REQUISITION_STATUS_;
        });

        // Malawi: check if the period is active
        periodOne = {
            id: '1',
            name: 'period1',
            startDate: new Date("January 1, 2017 00:00:00"),
            endDate: new Date("January 31, 2017 00:00:00"),
            isActive: false
        };

        periodTwo = {
            id: '2',
            name: 'period2',
            startDate: new Date("January 1, 2017 00:00:00"),
            endDate: new Date("January 31, 2017 00:00:00"),
            isActive: true,
            requisitionId: '05eb8040-66a9-4cd7-8da4-0735c9c44ab2',
            requisitionStatus: REQUISITION_STATUS.INITIATED
        };
        // --- ends here ---
    });

    describe('get emergency periods', function() {

        var programId = '1',
            facilityId = '2',
            emergency = true,
            data;

        beforeEach(function() {
            periodServiceMock.getPeriodsForInitiate.andCallFake(function() {
                return $q.when([periodOne, periodTwo]);
            });

            periodFactory.get(programId, facilityId, emergency).then(function(response) {
                data = response;
            });

            $rootScope.$apply();
        });

        it('should call periodService getPeriodsForInitiate method with proper params', function() {
            expect(periodServiceMock.getPeriodsForInitiate).toHaveBeenCalledWith(programId, facilityId, emergency);
        });

        it('should return proper periods', function() {
            // Malawi: check if the period is active
            expect(data[0]).toEqual({
                name: periodOne.name,
                startDate: periodOne.startDate,
                endDate: periodOne.endDate,
                rnrStatus: 'requisitionInitiate.notYetStarted',
                activeForRnr: true,
                rnrId: null
            });
            expect(data[1]).toEqual({
                name: periodTwo.name,
                startDate: periodTwo.startDate,
                endDate: periodTwo.endDate,
                rnrStatus: REQUISITION_STATUS.INITIATED,
                activeForRnr: true,
                rnrId: periodTwo.requisitionId
            });
            // --- ends here ---
        });
    });

    describe('get regular periods', function() {

        var programId = '1',
            facilityId = '2',
            emergency = false,
            data;

        beforeEach(function() {
            periodServiceMock.getPeriodsForInitiate.andCallFake(function() {
                return $q.when([periodOne, periodTwo]);
            });

            periodFactory.get(programId, facilityId, emergency).then(function(response) {
                data = response;
            });

            $rootScope.$apply();
        });

        it('should call periodService getPeriodsForInitiate method with proper params', function() {
            expect(periodServiceMock.getPeriodsForInitiate).toHaveBeenCalledWith(programId, facilityId, emergency);
        });

        // Malawi: check if the period is active
        it('should return only the active period', function() {
            expect(data.length).toEqual(1);
            expect(data[0]).toEqual({
                name: periodTwo.name,
                startDate: periodTwo.startDate,
                endDate: periodTwo.endDate,
                rnrStatus: REQUISITION_STATUS.INITIATED,
                activeForRnr: false,
                rnrId: periodTwo.requisitionId
            });
            // --- ends here ---
        });
    });
});
