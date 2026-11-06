import { useEffect } from 'react';
//import { withRouter } from 'react-router-dom';
import { useLocation } from "react-router-dom";
import ReactGA from 'react-ga4';
import { isCloud } from "../context/ContextApi.jsx";

export const removeQuery = (query) => {
	const urlSearchParams = new URLSearchParams(window.location.search)
	const params = Object.fromEntries(urlSearchParams.entries())
	if	(params[query] !== undefined) {
		delete params[query]
	} else {
		return
	}

	const queryString = Object.keys(params).map(key => key + '=' + params[key]).join('&')
	const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + queryString
	window.history.pushState({path:newurl},'',newurl)
}

function ScrollToTop({getUserNotifications, curpath, setCurpath, history, isLoggedIn,}) {
	let location = useLocation()
    useEffect(() => {

		if (isCloud) {
			ReactGA.send({
				hitType: "pageview",
				page: window.location.pathname,
			});
		}

		if (curpath === window.location.pathname && curpath === "/usecases") {
		} else if (curpath.includes("/search")) {
		} else if (curpath.includes("/docs") && location.hash.length !== 0) {
			// Skip docs
		} else if (curpath.includes("/pricing")) {
		} else { 

			window.scroll({
				top: 0,
				left: 0,
				behavior: "smooth",
			});

			setCurpath(window.location.pathname);

			if (isLoggedIn === true) {
				//getUserNotifications();
			}
		}
  }, [location]);

  return (null);
}

// https://stackoverflow.com/questions/36904185/react-router-scroll-to-top-on-every-transition
//export default withRouter(ScrollToTop);
export default ScrollToTop;
