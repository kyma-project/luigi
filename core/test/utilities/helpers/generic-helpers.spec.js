const chai = require('chai');
const assert = chai.assert;
const sinon = require('sinon');
import { GenericHelpers } from '../../../src/utilities/helpers';

describe('Generic-helpers', () => {
  let windowLocationImplementation;
  before(() => {
    windowLocationImplementation = window.location;
    delete window.location;
    window.location = {
      search: function() {
        return '';
      }
    };
  });
  after(() => {
    window.location = windowLocationImplementation;
  });

  it('getUrlParameter', () => {
    const setLocationSearch = url => {
      sinon.stub(window.location, 'search').get(() => url);
    };
    const catName = 'spencer';

    setLocationSearch('?param=1&foo=bar&cat=' + catName);
    assert.equal(
      GenericHelpers.getUrlParameter('cat'),
      catName,
      'url with ? and multiple params'
    );

    setLocationSearch('#foo=bar&cat=' + catName + '&param=1');
    assert.equal(
      GenericHelpers.getUrlParameter('cat'),
      catName,
      'url with # and multiple params'
    );
  });

  describe('getUrlWithoutHashOrOrigin', () => {
    it('hash based', () => {
      const url = 'http://luigi.url.de/#hashsomething';
      const withoutHash = GenericHelpers.getUrlWithoutHashOrOrigin(url);
      assert.equal(withoutHash, 'http://luigi.url.de/');
    });
    it('path based', () => {
      const url = 'http://luigi.url.de/foobar/some/thing?param=true';
      const withoutHash = GenericHelpers.getUrlWithoutHashOrOrigin(url);
      assert.equal(withoutHash, 'http://luigi.url.de');
    });
  });

  it('hasHash', () => {
    const path = '#luigi/tets/something';
    const includingHash = GenericHelpers.hasHash(path);
    assert.isTrue(includingHash);
  });

  it('getPathWithoutHash', () => {
    const path = '#/tets';
    assert.equal(GenericHelpers.getPathWithoutHash(path), 'tets');
  });

  it('addLeadingSlash', () => {
    assert.equal(GenericHelpers.addLeadingSlash('luigi'), '/luigi');
  });

  it('trimLeadingSlash', () => {
    assert.equal(GenericHelpers.trimLeadingSlash('/luigi'), 'luigi');
  });
});
