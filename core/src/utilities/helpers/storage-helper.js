import { IframeHelpers } from './iframe-helpers';

class StorageHelperClass {

  constructor() {
    this.storage = window.localStorage
    this.browseSupported = this.supportLocalStorage();

  }

  supportLocalStorage(){
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch(e) {
      return false;
    }
  }

  checkStorageBrowserSupport(){
    if (!this.browseSupported){
      throw "Browser does not support local storage"
    }
  }


  process(microfrontendId, hostname, id, operation, params){
      try{
        this.checkStorageBrowserSupport();
        const operationFunction = this[operation];
        if (typeof operationFunction !== 'function'){
          throw operation + " is not a supported operation for the storage";
        }
        const result = operationFunction.bind(this, hostname, params)();
        //const result = operationFunction(microfrontendId, params);
        this.sendBackOperation(microfrontendId, id, 'OK', result);
      }catch(error){
        console.log(error);
        this.sendBackOperation(microfrontendId, id, 'ERROR', error);
      }
  }

  setItem(hostname, params) {
    this.checkKey(params);
    const value = this.stringifyValue(params.value);
    const key =  "Luigi#"+hostname + "#"+ params.key.trim();
    this.storage.setItem(key, value);
  }

  getItem(hostname, params){
    this.checkKey(params);
    const key =  "Luigi#"+hostname + "#"+ params.key.trim();
    const item = this.storage.getItem(key);
    if (item){
      return this.parseJsonIfPossible(item);
    }else{
      return undefined;
    }
  }

  removeItem(hostname, params){
    this.checkKey(params);
    const key =  "Luigi#"+hostname + "#"+ params.key.trim();
    const item = this.storage.getItem(key);
    if (item){
      this.storage.removeItem(key);
      return item;
    }else{
      return undefined;
    }
  }

  clear(hostname, params) {
    const keyPrefix =  "Luigi#"+hostname + "#";
    Object.keys(this.storage)
      .filter(key => key.startsWith(keyPrefix))
      .forEach(key => this.storage.removeItem(key));
  }

  has(hostname, params){
    this.checkKey(params);
    const key = "Luigi#"+hostname + "#"+ params.key.trim();
    const item = this.storage.getItem(key);
    if (item){
      return true;
    }else{
      return false;
    }
  }

  getAllKeys(hostname, params){
    const keyPrefix =  "Luigi#"+hostname + "#";
    return Object.keys(this.storage)
      .filter(key => key.startsWith(keyPrefix))
      .map(key=> key.substring(keyPrefix.length));
  }

  checkKey(params){
    if (!params.key || params.key.trim().length === 0){
      throw "Missing key, we cannot execute storage operation";
    }
  }

  isValueString(value) {
    return typeof value === 'string' || value instanceof String;
  }

  parseJsonIfPossible(text){
    try {
      return JSON.parse(text);
    } catch (e) {
      return text;
    }
  }

  stringifyValue(value){
    if (!value){
      throw "Value is empty";
    }
    if (this.isValueString(value)){
      return value;
    }
    try {
      return JSON.stringify(value);
    } catch (error) {
      throw "Value cannot be stringify, error: "+error;
    }
  }


  sendBackOperation(microfrontendId, id, status, result){
    let message = {
      msg: 'storage',
      data: {
        id,
        status,
        result
      }
    }
    IframeHelpers.getMicrofrontendsInDom()
      .filter(microfrontendObj => microfrontendObj.id === microfrontendId)
      .map(microfrontendObj => microfrontendObj.container)
      .map(mfContainer => IframeHelpers.sendMessageToIframe(mfContainer,message ));
  }

}


export const StorageHelper = new StorageHelperClass();
