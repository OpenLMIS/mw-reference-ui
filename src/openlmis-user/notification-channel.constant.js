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
     * @ngdoc object
     * @name openlmis-user.NOTIFICATION_CHANNEL
     *
     * @description
     * Stores the list of all available notification channels and a method to get their labels.
     */
    angular
        .module('openlmis-user')
        .constant('NOTIFICATION_CHANNEL', NOTIFICATION_CHANNEL());

    function NOTIFICATION_CHANNEL() {
        var NOTIFICATION_CHANNEL = {
                EMAIL: 'EMAIL',
                getLabel: getLabel,
                getChannels: getChannels
            },
            labels = {
                EMAIL: 'openlmisUser.email'
            };

        return NOTIFICATION_CHANNEL;

        /**
         * @ngdoc method
         * @methodOf openlmis-user.NOTIFICATION_CHANNEL
         * @name getLabel
         *
         * @description
         * Returns a label for the given channel. Throws an exception if the channel is not recognized.
         *
         * @param   {String}    channel  the notification channel
         * @return  {String}             the label
         */
        function getLabel(channel) {
            var label = labels[channel];

            if (!label) {
                throw '"' + channel + '" is not a valid channel';
            }

            return label;
        }

        /**
         * @ngdoc method
         * @methodOf openlmis-user.NOTIFICATION_CHANNEL
         * @name getChannels
         *
         * @description
         * Returns all available channels as a list.
         *
         * @return  {Array} the list of available channels
         */
        function getChannels() {
            return [
                NOTIFICATION_CHANNEL.EMAIL
            ];
        }

    }

})();
