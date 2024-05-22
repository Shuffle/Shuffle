import { useEffect } from "react";
//import { withRouter } from "react-router-dom";
import { useLocation } from "react-router-dom";

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

// ensures scrolling happens in the right way on different pages and when changing
function ScrollToTop({ getUserNotifications, curpath, setCurpath, history }) {
	let location = useLocation();

  useEffect(() => {
		// Custom handler for certain scroll mechanics
		//
		//console.log("OLD: ", curpath, "NeW: ", window.location.pathname)
		if (curpath === window.location.pathname && (curpath === "/usecases" || 
			(curpath === "/docs" && location.hash.length > 0))) {
		} else { 

			window.scroll({
				top: 0,
				left: 0,
				behavior: "smooth",
			});

			setCurpath(window.location.pathname);
			getUserNotifications();
		}
  }, [location]);

  return null;
}

// https://stackoverflow.com/questions/36904185/react-router-scroll-to-top-on-every-transition
//export default withRouter(ScrollToTop);
// https://v5.reactrouter.com/web/api/Hooks/uselocation
export default ScrollToTop;
