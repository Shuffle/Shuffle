import { useEffect } from 'react';
import { withRouter } from 'react-router-dom';

function ScrollToTop({getUserNotifications, setCurpath, history }) {
  useEffect(() => {
    const unlisten = history.listen(() => {
      window.scroll({
				top: 0, 
				left: 0,
				behavior: "smooth",
			});

			setCurpath(window.location.pathname)
			getUserNotifications()
    });
    return () => {
      unlisten();
    }
  }, []);

  return (null);
}

// https://stackoverflow.com/questions/36904185/react-router-scroll-to-top-on-every-transition
export default withRouter(ScrollToTop);
