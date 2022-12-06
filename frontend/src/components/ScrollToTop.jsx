import { useEffect } from "react";
//import { withRouter } from "react-router-dom";
import { useLocation } from "react-router-dom";

// ensures scrolling happens in the right way on different pages and when changing
function ScrollToTop({ getUserNotifications, curpath, setCurpath, history }) {
	let location = useLocation();

  useEffect(() => {
		// Custom handler for certain scroll mechanics
		//
		console.log("OLD: ", curpath, "NeW: ", window.location.pathname)
		if (curpath === window.location.pathname && curpath === "/usecases") {
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
