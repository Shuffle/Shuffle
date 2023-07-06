import { createBrowserHistory } from "history";

var localExport;
if (typeof window !== "undefined") {
  localExport = createBrowserHistory({ forceRefresh: true });
}

export default localExport;
