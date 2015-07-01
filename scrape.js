'use strict';

let fs = require('fs'),
    cheerio = require('cheerio'),
    co = require('co'),
    request = require('request'),
    thunkify = require('thunkify');

co(function*() {
  console.log('get organizations page');

  let organizationsHTML = yield new Promise(function(resolve, reject) {
    request('http://qiita.com/organizations', function(err, res, body) {
      (err) ? reject(err) : resolve(body);
    });
  });

  console.log('get organization member pages');

  let $ = cheerio.load(organizationsHTML),
      relativeMemberPageURIs = $('.organizationsList_orgName a').map(
        () => cheerio(this).attr('href')
      ),
      absoluteMemberPageURIs = Array.prototype.map.call(relativeMemberPageURIs,
        (href) => `http://qiita.com${href}/members`
      );

  console.log('scrape member pages');

  let memberPageHTMLs = yield absoluteMemberPageURIs.map(
    (uri, index) => new Promise(function(resolve, reject) {
      setTimeout(function() {
        console.log('%s: get from %s', new Date(), uri);

        request(uri, function(err, res, body) {
          (err) ? reject(err) : resolve(body);
        });
      }, index * 1000);
    })
  );

  console.log('generate data');

  let organizationsData = memberPageHTMLs.map(
    (html) => {
      let $ = cheerio.load(html);

      return {
        name: $('.organizationProfileHeader_orgName').text(),
        page: $('meta[property="og:url"]').attr('content'),
        members: Array.prototype.slice.call($('.organizationMemberList_item').map(
          () => {
            let statsText = $(this).find('.organizationMemberList_memberStats').text(),
                stats = /(\d+)\D*(\d+)/.exec(statsText) || {};

            return {
              name: $(this).find('.organizationMemberList_userName').text(),
              post: parseInt(stats[1], 10),
              stock: parseInt(stats[2], 10),
            };
          }
        )),
      }
    }
  );

  console.log('convert to JSON');

  let json = JSON.stringify({
    organizations: organizationsData,
    lastUpdate: Date.now(),
  }, null, 2);

  console.log('save to file');

  yield thunkify(fs.writeFile).call(fs, './index.json', json);
}).then(function() {
  console.log('done');
}).catch(function(err) {
  console.error(err.stack);
});
