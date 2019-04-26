// Methods related to managing the view in the iframe.
// Please consider adding any new methods to 'iframe-helpers' if they don't require anything from this file.
import * as IframeHelpers from '../utilities/helpers/iframe-helpers';
import * as GenericHelpers from '../utilities/helpers/generic-helpers';
import * as RoutingHelpers from '../utilities/helpers/routing-helpers';
import { createIframe } from '../utilities/helpers/iframe-helpers';

const iframeNavFallbackTimeout = 2000;
let timeoutHandle;

export const getActiveIframe = node => {
  //TODO active ist das sichtbare => !display:none
  const children = [...node.children];
  let activeIframe = [];
  if (children.length > 0) {
    activeIframe = children.filter(child => child.style.display !== 'none');
  }
  return activeIframe[0];
};

export const getAllIframes = modalIframe => {
  const iframes = Array.from(
    document.querySelectorAll('.iframeContainer iframe')
  );
  if (modalIframe) iframes.push(modalIframe);
  return iframes;
};

export const setActiveIframeToPrevious = node => {
  const iframesInDom = getIframesInDom();
  const preservedViews = getPreservedViewsInDom(iframesInDom);
  if (preservedViews.length === 0) {
    return;
  } else if (preservedViews.length === 1) {
    iframesInDom[0].style.display = 'block';
    return;
  }
  IframeHelpers.hideElementChildren(node);
  //TODO first which is marked as pv second marked with pv display block
  node.removeChild(iframesInDom[0]);
  iframesInDom[1].style.display = 'block';
};

export const removeInactiveIframes = node => {
  const children = Array.from(node.children);
  children.forEach((child, index) => {
    if (child.style.display === 'none' && !child.vg) {
      node.removeChild(child);
    }
  });
};

function hasIsolatedView(isolateView, isSameViewGroup, isolateAllViews) {
  return (
    isolateView ||
    (isolateAllViews && !(isolateView === false) && !isSameViewGroup)
  );
}

function removeIframe(iframe, node) {
  const children = Array.from(node.children);
  children.forEach(child => {
    if (child === iframe) {
      node.removeChild(child);
    }
  });
}

function getIframesInDom() {
  return Array.from(document.querySelectorAll('.iframeContainer iframe'));
}

function getPreservedViewsInDom(iframes) {
  return iframes.filter(iframe => iframe.pv);
}

export const navigateIframe = (config, component, node) => {
  clearTimeout(timeoutHandle);
  const componentData = component.get();
  let viewUrl = componentData.viewUrl;
  if (viewUrl) {
    viewUrl = RoutingHelpers.substituteViewUrl(viewUrl, componentData);
  }

  const isSameViewGroup = IframeHelpers.isSameViewGroup(config, component);
  const previousViewIsolated = hasIsolatedView(
    componentData.previousNodeValues.isolateView,
    isSameViewGroup,
    config.isolateAllViews
  );
  const nextViewIsolated = hasIsolatedView(
    componentData.isolateView,
    isSameViewGroup,
    config.isolateAllViews
  );
  const canReuseIframe = IframeHelpers.canReuseIframe(config, component);
  let activeIframe = getActiveIframe(node);

  const iframes = getIframesInDom();
  const goBackStack = getPreservedViewsInDom(iframes);
  let firstInGoBackStack = undefined;
  if (goBackStack.length > 0) {
    firstInGoBackStack = goBackStack[0];
    activeIframe = undefined;
    //config.iframe = undefined;
  }
  //active iframe = undefined when pv da ist
  //config.iframe = undefined

  // if previous view must be isolated
  if (activeIframe && previousViewIsolated) {
    removeIframe(activeIframe, node);
    activeIframe = undefined;
  }

  // if next view must be isolated
  if (activeIframe && nextViewIsolated) {
    if (activeIframe.vg) {
      activeIframe.style.display = 'none';
    } else {
      removeIframe(activeIframe, node);
    }
    activeIframe = undefined;
  }

  // if next view is not isoltaed we can pick a iframe with matching viewGroup from the pool
  let targetIframe;
  if (!nextViewIsolated && componentData.viewGroup) {
    const iframes = getIframesInDom();
    const sameViewGroupIframes = iframes.filter(iframe => {
      return iframe.vg === componentData.viewGroup;
    });
    if (sameViewGroupIframes.length > 0) {
      targetIframe = sameViewGroupIframes[0];

      // make the targetIframe the new active iframe
      if (activeIframe && activeIframe !== targetIframe) {
        if (activeIframe.vg) {
          activeIframe.style.display = 'none';
        } else {
          removeIframe(activeIframe, node);
        }
      }
      activeIframe = targetIframe;
      activeIframe.style.display = 'block';
    }
  }

  if (activeIframe && !targetIframe) {
    if (activeIframe.vg) {
      activeIframe.style.display = 'none';
    } else if (!canReuseIframe) {
      removeIframe(activeIframe, node);
    }
    activeIframe = undefined;
  }

  config.iframe = activeIframe;

  if (!config.iframe) {
    const componentData = component.get();
    // preserveView, hide other frames, else remove
    if (firstInGoBackStack) {
      //wahrscheinlich ihr noch umhängen.. pv stack von 1 auf 2
      IframeHelpers.hideElementChildren(node);
    } else {
      IframeHelpers.removeElementChildren(node);
    }
    if (componentData.viewUrl) {
      if (
        GenericHelpers.getConfigValueFromObject(
          componentData,
          'currentNode.loadingIndicator.enabled'
        ) !== false
      ) {
        component.set({ showLoadingIndicator: true });
      } else {
        component.set({ showLoadingIndicator: false });
      }
      config.navigateOk = undefined;
      config.iframe = createIframe(viewUrl);
      if (componentData.viewGroup && !nextViewIsolated) {
        config.iframe['vg'] = componentData.viewGroup;
      }

      node.insertBefore(config.iframe, node.firstChild);

      if (config.builderCompatibilityMode) {
        config.iframe.addEventListener('load', () => {
          const message = ['init', JSON.stringify(componentData.context)];
          IframeHelpers.sendMessageToIframe(config.iframe, message);
        });
      }
    }
  } else {
    const goBackContext = component.get().goBackContext;
    config.iframe.style.display = 'block';
    config.iframe.luigi.nextViewUrl = viewUrl;
    config.iframe['vg'] = componentData.viewGroup;
    const message = {
      msg: 'luigi.navigate',
      viewUrl: viewUrl,
      context: JSON.stringify(
        Object.assign({}, componentData.context, { goBackContext })
      ),
      nodeParams: JSON.stringify(Object.assign({}, componentData.nodeParams)),
      pathParams: JSON.stringify(Object.assign({}, componentData.pathParams)),
      internal: JSON.stringify(component.prepareInternalData())
    };
    IframeHelpers.sendMessageToIframe(config.iframe, message);
    // clear goBackContext and reset navigateBack after sending it to the client
    component.set({ goBackContext: undefined, isNavigateBack: false });

    /**
     * check if luigi responded
     * if not, callback again to replace the iframe
     */
    timeoutHandle = setTimeout(() => {
      if (config.navigateOk) {
        config.navigateOk = undefined;
      } else {
        config.iframe = undefined;
        console.info(
          'navigate: luigi-client did not respond, using fallback by replacing iframe'
        );
        navigateIframe(config, component, node);
      }
    }, iframeNavFallbackTimeout);
  }
};

export const reloadActiveIframe = () => {
  const visibleIframe = IframeHelpers.getVisibleIframes().pop();

  if (visibleIframe) {
    if (
      visibleIframe.contentDocument &&
      visibleIframe.contentDocument.location
    ) {
      visibleIframe.contentDocument.location.reload(true);
    } else {
      visibleIframe.src = visibleIframe.src;
    }
  }
};
