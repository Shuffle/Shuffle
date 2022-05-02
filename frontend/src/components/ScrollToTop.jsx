import { useEffect } from "react";
//import { withRouter } from "react-router-dom";
import { useLocation } from "react-router-dom";

function ScrollToTop({ getUserNotifications, setCurpath, history }) {
	let location = useLocation();

  useEffect(() => {
    //const unlisten = history.listen(() => {
		window.scroll({
			top: 0,
			left: 0,
			behavior: "smooth",
		});

		setCurpath(window.location.pathname);
		getUserNotifications();
    //});
    //return () => {
    //  unlisten();
    //};
  }, [location]);

  return null;
}

// https://stackoverflow.com/questions/36904185/react-router-scroll-to-top-on-every-transition
//export default withRouter(ScrollToTop);
// https://v5.reactrouter.com/web/api/Hooks/uselocation
export default ScrollToTop;
