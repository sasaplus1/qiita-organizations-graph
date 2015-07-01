import 'c3/c3.css';

import _ from 'lodash';
import C3 from 'c3';
import Vue from 'vue';

import data from './index.json';

import { barConfig, pieConfig } from './graph.yaml';

// change directive prefix
Vue.config.prefix = 'data-v-';

// add special graph
data.organizations.unshift({
  name: '個人毎のグラフ',
  page: 'http://qiita.com/organizations',
  members: _(data.organizations).map(
    (organization) => organization.members
  ).flatten().value(),
}, {
  name: '会社毎のグラフ',
  page: 'http://qiita.com/organizations',
  members: _.map(data.organizations,
    (organization) => ({
      name: organization.name,
      post: _(organization.members).mapValues('post').reduce(
        (a, b) => a + b
      ),
      stock: _(organization.members).mapValues('stock').reduce(
        (a, b) => a + b
      ),
    })
  ),
});

// apply vue
new Vue({

  el: 'body',

  data: {
    graphType: 'stock',
    organizations: _(data.organizations).mapValues('name').toArray().value(),
    organization: {
      page: _.first(data.organizations).page,
      name: _.first(data.organizations).name,
    },
    lastUpdate: {
      text: String(new Date(data.lastUpdate)),
      datetime: (new Date(data.lastUpdate)).toJSON(),
    },
  },

  created() {
    this.generateGraph();
  },

  methods: {

    changeOrganization(event) {
      let organization = _.find(data.organizations, {
        name: event.target.dataset.organization,
      });

      this.organization.page = organization.page;
      this.organization.name = organization.name;

      this.generateGraph({
        organization,
      });
    },

    changeGraphType() {
      this.generateGraph();
    },

    generateGraph(organization = {}) {
      let members = organization.members || _.find(data.organizations, {
        name: this.organization.name,
      }).members;

      let sortMembers = members.sort(
        (a, b) => b[this.graphType] - a[this.graphType]
      ).slice(0, 20);

      let names = _.pluck(sortMembers, 'name'),
          values = _.pluck(sortMembers, this.graphType);

      let bar = {},
          pie = {};

      bar.bindto = '.bar';
      bar.axis = { y: { label: {} } };
      bar.axis.y.label.text = this.graphType;
      bar.data = { rows: [ names, values ] };

      pie.bindto = '.pie';
      pie.data = { rows: [ names, values ] };

      C3.generate(_.merge({}, barConfig, bar));
      C3.generate(_.merge({}, pieConfig, pie));
    },

  },

});

// set menu height
document.addEventListener('DOMContentLoaded', function(event) {
  let nav = document.querySelector('nav'),
      main = document.querySelector('main');

  nav.style.height = `${main.offsetHeight}px`;
}, false);
