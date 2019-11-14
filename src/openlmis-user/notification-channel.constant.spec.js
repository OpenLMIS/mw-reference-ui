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

describe('NOTIFICATION_CHANNEL', function() {

    beforeEach(function() {
        module('openlmis-user');

        inject(function($injector) {
            this.NOTIFICATION_CHANNEL = $injector.get('NOTIFICATION_CHANNEL');
        });
    });

    describe('getLabel', function() {

        it('should return label for valid channel', function() {
            expect(
                this.NOTIFICATION_CHANNEL.getLabel('EMAIL')
            ).toEqual('openlmisUser.email');
        });

        it('should throw exception for invalid channel', function() {
            var NOTIFICATION_CHANNEL = this.NOTIFICATION_CHANNEL;

            expect(function() {
                NOTIFICATION_CHANNEL.getLabel('NON_EXISTENT_CHANNEL');
            }).toThrow('"NON_EXISTENT_CHANNEL" is not a valid channel');

            expect(function() {
                NOTIFICATION_CHANNEL.getLabel(undefined);
            }).toThrow('"undefined" is not a valid channel');

            expect(function() {
                NOTIFICATION_CHANNEL.getLabel(null);
            }).toThrow('"null" is not a valid channel');

            expect(function() {
                NOTIFICATION_CHANNEL.getLabel('');
            }).toThrow('"" is not a valid channel');

            // Malawi: for now, SMS channel is not supported
            expect(function () {
                NOTIFICATION_CHANNEL.getLabel('SMS')
            }).toThrow('"SMS" is not a valid channel');
            // --- ends here ---
        });

    });

    describe('getStatuses', function() {

        it('should return a list of channels', function() {
            expect(this.NOTIFICATION_CHANNEL.getChannels()).toEqual([
                'EMAIL'
            ]);
        });

    });

});
