import { useEffect } from 'react';
import { withRouter } from 'react-router-dom';
import ReactGA from 'react-ga';

function ScrollToTop({setCurpath, history }) {
  useEffect(() => {
    const unlisten = history.listen(() => {
      window.scroll({
				top: 0, 
				left: 0,
				behavior: "smooth",
			});

			//ReactGA.event({
			//	category: "referral",
			//	action: "new_user_referral",
			//	label: "",
			//})

			ReactGA.pageview(window.location.pathname)
			setCurpath(window.location.pathname)
    });
    return () => {
      unlisten();
    }
  }, []);

  return (null);
}

// https://stackoverflow.com/questions/36904185/react-router-scroll-to-top-on-every-transition
export default withRouter(ScrollToTop);
