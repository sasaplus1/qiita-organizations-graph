d3.json('index.json', function(err, data) {
  var barSetting, pieSetting;

  if (err) {
    throw err;
  }

  //----------------------------------------------------------------------------

  // append special link
  data.organizations.unshift({
    name: '個人毎のグラフ',
    page: 'http://qiita.com/organizations',
    members: _(data.organizations).map(function(organization) {
      return organization.members;
    }).flatten().value()
  }, {
    name: '会社毎のグラフ',
    page: 'http://qiita.com/organizations',
    members: _.map(data.organizations, function(organization) {
      var members = _(organization.members);

      function sum(a, b) {
        return a + b;
      }

      return {
        name: organization.name,
        post: members.mapValues('post').reduce(sum),
        stock: members.mapValues('stock').reduce(sum)
      };
    })
  });

  //----------------------------------------------------------------------------

  barSetting = {
    bindto: '.bar',
    bar: {
      width: {
        ratio: 0.98
      }
    },
    size: {
      height: 350
    },
    axis: {
      y: {
        label: {
          position: 'outer-middle'
        }
      }
    },
    grid: {
      y: {
        show: true
      }
    },
    data: {
      type: 'bar'
    }
  };

  pieSetting = {
    bindto: '.pie',
    size: {
      height: 350
    },
    data: {
      type: 'pie'
    }
  };

  //----------------------------------------------------------------------------

  // change prefix to "data-v" from "v"
  Vue.config({
    prefix: 'data-v'
  });

  new Vue({
    el: 'body',
    data: {
      type: 'stock',
      organizations: _(data.organizations).mapValues('name').toArray().value(),
      organization: {
        page: _.first(data.organizations).page,
        name: _.first(data.organizations).name
      },
      lastUpdate: {
        text: String(new Date(data.lastUpdate)),
        datetime: (new Date(data.lastUpdate)).toJSON()
      }
    },
    created: function() {
      this.generate({});
    },
    methods: {
      changeOrganization: function(event) {
        var organization = _.find(data.organizations, {
              name: event.target.dataset.organization
            });

        this.organization.page = organization.page;
        this.organization.name = organization.name;

        this.generate({
          organization: organization
        });
      },
      changeType: function(event) {
        this.generate({
          type: this.type
        });
      },
      generate: function(param) {
        var organization, members, sortedArray, names, value;

        organization = param.organization || {};

        members = organization.members || _.find(data.organizations, {
          name: this.organization.name
        }).members;

        sortedArray = members.sort(function(a, b) {
          return (a[this.type] < b[this.type]) ? 1 : -1;
        }.bind(this)).slice(0, 100);

        names = _.pluck(sortedArray, 'name');
        value = _.pluck(sortedArray, this.type);

        c3.generate(_.merge({}, barSetting, {
          axis: {
            y: {
              label: {
                text: this.type
              }
            }
          },
          data: {
            rows: [
              names,
              value
            ]
          }
        }));
        c3.generate(_.merge({}, pieSetting, {
          data: {
            rows: [
              names,
              value
            ]
          }
        }));
      }
    }
  });
});
