/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

/**
 * Logstash Overview
 */
import React from 'react';
import uiRoutes from'ui/routes';
import { ajaxErrorHandlersProvider } from 'plugins/monitoring/lib/ajax_error_handler';
import { routeInitProvider } from 'plugins/monitoring/lib/route_init';
import template from './index.html';
import { timefilter } from 'ui/timefilter';
import { I18nProvider } from '@kbn/i18n/react';
import { Overview } from '../../../components/logstash/overview';
import { MonitoringViewBaseController } from '../../base_controller';

function getPageData($injector) {
  const $http = $injector.get('$http');
  const globalState = $injector.get('globalState');
  const url = `../api/monitoring/v1/clusters/${globalState.cluster_uuid}/logstash`;
  const timeBounds = timefilter.getBounds();

  return $http.post(url, {
    ccs: globalState.ccs,
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    }
  })
    .then(response => response.data)
    .catch((err) => {
      const Private = $injector.get('Private');
      const ajaxErrorHandlers = Private(ajaxErrorHandlersProvider);
      return ajaxErrorHandlers(err);
    });
}

uiRoutes.when('/logstash', {
  template,
  resolve: {
    clusters: function (Private) {
      const routeInit = Private(routeInitProvider);
      return routeInit();
    },
    pageData: getPageData
  },
  controller: class extends MonitoringViewBaseController {
    constructor($injector, $scope) {
      super({
        title: 'Logstash',
        getPageData,
        reactNodeId: 'monitoringLogstashOverviewApp',
        $scope,
        $injector
      });

      $scope.$watch(() => this.data, data => {
        this.renderReact(
          <I18nProvider>
            <Overview
              stats={data.clusterStatus}
              metrics={data.metrics}
              onBrush={this.onBrush}
            />
          </I18nProvider>
        );
      });
    }
  }
});
