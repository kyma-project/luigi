// import { auth } from './auth';
import { navigation } from './navigation';
import { routing } from './routing';
import { settings } from './settings';
import { search } from './search';
import {globalSearch} from "./globalSearch";
import {communication} from "./communication";






Luigi.setConfig({
  // auth,
  navigation,
  routing,
  settings,
  globalSearch,
  communication

  // lifecycleHooks: {
  //   luigiAfterInit: () => {
  //     search.init();
  //   }
  // }
});
