const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;

import { WebComponentService} from '../../src/services/web-components';

describe.only('WebComponentService', function() {

  describe('generate web component id', function() {
    const someRandomString = 'dsfgljhbakjdfngb,mdcn vkjrzwero78to4     wfoasb    f,asndbf';

    it('check determinism', () => {
      let wcId = WebComponentService.generateWCId(someRandomString);
      let wcId2 = WebComponentService.generateWCId(someRandomString);
      expect(wcId).to.equal(wcId2);
    });

    it('check uniqueness', () => {
      let wcId = WebComponentService.generateWCId(someRandomString);
      let wcId2 = WebComponentService.generateWCId('someOtherRandomString_9843utieuhfgiasdf');
      expect(wcId).to.not.equal(wcId2);
    });
  });

  describe('attach web component', function() {
    it('check dom injection', () => {
      const container = document.createElement('div');
      const ctx = { someValue: true};
      window.Luigi = { mario: 'luigi' };

      WebComponentService.attachWC('div', container, ctx);

      const expectedCmp = container.children[0];
      expect(expectedCmp.context).to.equal(ctx);
      expect(expectedCmp.luigi).to.equal(window.Luigi);
    });
  });

  describe('register web component from url', function() {
    it('check resolve', (done) => {
      let definedId;
      WebComponentService.dynamicImport = function() {
        return new Promise((resolve, reject) => {
          resolve({ default: {} });
        })
      }
      window.customElements = { define: (id, clazz)=>{
        definedId = id;
      }};

      WebComponentService.registerWCFromUrl('url', 'id').then(()=>{
        expect(definedId).to.equal('id');
        done();
      });
    });

    it('check reject', (done) => {
      let definedId;
      WebComponentService.dynamicImport = function() {
        return new Promise((resolve, reject) => {
          reject({ default: {} });
        })
      }
      window.customElements = { define: (id, clazz)=>{
        definedId = id;
      }};

      WebComponentService.registerWCFromUrl('url', 'id').then(()=>{
        assert(false, "should not be here");
        done();
      }).catch(err=>{
        expect(definedId).to.be.undefined;
        done();
      });
    });
  });

  describe('render web component', function() {
    const container = document.createElement('div');
    const ctx = { someValue: true};
    const viewUrl = 'someurl';
    window.Luigi = { mario: 'luigi' };
    WebComponentService.dynamicImport = function() {
      return new Promise((resolve, reject) => {
        resolve({ default: {} });
      });
    };

    it('check attachment of already existing wc', (done) => {
      window.customElements = {
        define: (id, clazz)=>{
          definedId = id;
        },
        get: () => {
          return true;
        }
      };

      WebComponentService.registerWCFromUrl = () => {
        assert(false, "should not be here");
      };

      WebComponentService.attachWC = (id, cnt, context) => {
        expect(cnt).to.equal(container);
        expect(context).to.equal(ctx);
        done();
      };

      WebComponentService.renderWebComponent(viewUrl, container, ctx);
    });

    it('check usage of custom function', (done) => {
      let definedId;

      window.customElements = {
        define: (id, clazz)=>{
          definedId = id;
        },
        get: () => {
          return false;
        }
      };

      WebComponentService.registerWCFromUrl = () => {
        assert(false, "should not be here");
      };

      WebComponentService.attachWC = (id, cnt, context) => {
        expect(cnt).to.equal(container);
        expect(context).to.equal(ctx);
        done();
      };

      window.luigiWCFn = (viewUrl, wc_id, wc_container, cb) => {
        cb();
      }

      WebComponentService.renderWebComponent(viewUrl, container, ctx);
    });

    it('check creation and attachment of new wc', (done) => {
      let definedId;

      window.customElements = {
        define: (id, clazz)=>{
          definedId = id;
        },
        get: () => {
          return false;
        }
      };

      WebComponentService.registerWCFromUrl = (viewUrl, wc_id) => {
        return {
          then: function(fn) {
            fn();
          }
        }
      };

      WebComponentService.attachWC = (id, cnt, context) => {
        expect(cnt).to.equal(container);
        expect(context).to.equal(ctx);
        done();
      };

      WebComponentService.renderWebComponent(viewUrl, container, ctx);
    });
  });
});

