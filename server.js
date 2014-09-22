var fs = require('fs'),
    Promise = require('bluebird'),
    cheerio = require('cheerio'),
    request = require('request');

Promise
  .resolve()
  .then(function() {
    var deferred = Promise.defer();
  
    request('http://qiita.com/organizations', function(err, res, body) {
      (err) ? deferred.reject(err) : deferred.resolve(body);
    });
  
    return deferred.promise;
  })
  .then(function(html) {
    var $ = cheerio.load(html);

    return $('.span1 a').map(function() {
      return cheerio(this).attr('href');
    });
  })
  .then(function(hrefs) {
    return Array.prototype.map.call(hrefs, function(href) {
      return 'http://qiita.com' + href + '/members';
    });
  })
  .then(function(urls) {
    return Promise.all(urls.map(function(url) {
      var deferred = Promise.defer();

      request(url, function(err, res, body) {
        (err) ? deferred.reject(err) : deferred.resolve(body);
      });

      return deferred.promise;
    }));
  })
  .then(function(htmls) {
    return htmls.map(function(html) {
      var $ = cheerio.load(html);

      return {
        name: $('.organization-header h1').text(),
        page: $('meta[property="og:url"]').attr('content'),
        members: $('.organization-members-list').html()
      };
    });
  })
  .then(function(results) {
    return results.map(function(result) {
      var $ = cheerio.load(result.members);

      return {
        name: result.name,
        page: result.page,
        members: $('.row').map(function(index, element) {
          var that = $(this),
              nameText = that.find('.span7 h3 a').text(),
              dataText = that.find('.span7 p').text(),
              regexp = /(\d+)\D*(\d+)/.exec(dataText) || {};

          return {
            name: nameText,
            post: parseInt(regexp[1], 10),
            stock: parseInt(regexp[2], 10)
          };
        })
      };
    });
  })
  .then(function(organizations) {
    return Array.prototype.map.call(organizations, function(organization) {
      return {
        name: organization.name,
        page: organization.page,
        members: Array.prototype.slice.call(organization.members)
      };
    });
  })
  .then(function(data) {
    return JSON.stringify({
      organizations: data,
      lastUpdate: Date.now()
    }, null, 2);
  })
  .then(function(json) {
    var deferred = Promise.defer();

    fs.writeFile('./index.json', json, function(err) {
      (err) ? deferred.reject(err) : deferred.resolve();
    });

    return deferred.promise;
  })
  .catch(function(err) {
    console.error(err);
  })
  .done(function() {
    console.log('done.');
  });
