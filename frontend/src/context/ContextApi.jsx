import React, { createContext, useState, useEffect } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';

export const Context = createContext();

export const AppContext = (props) => {
	const { serverside } = props

	const currentLocation = serverside === true ? "" : window?.location?.pathname;

    // Left side bar global states
    const [searchBarModalOpen, setSearchBarModalOpen] = useState(false);
    const [isDocSearchModalOpen, setIsDocSearchModalOpen] = useState(false);
    const [leftSideBarOpenByClick, setLeftSideBarOpenByClick] = useState(currentLocation?.includes('/workflows/') ? false : true)
    const [windowWidth, setWindowWidth] = useState(serverside === true ? 100 : window.innerWidth);
    const [brandColor, setBrandColor] = useState(() => localStorage.getItem("brandColor") || "#ff8544");
    const [brandName, setBrandName] = useState(()=> localStorage.getItem("brandName") || "Shuffle");

    const [themeMode, setThemeMode] = useState(
      () => localStorage.getItem("theme") || "dark"
    );
    const [supportEmail, setSupportEmail] = useState("support@shuffler.io");
    const [logoutUrl, setLogoutUrl] = useState("");

    useEffect(() => {
		if (currentLocation?.includes('/workflows/') && leftSideBarOpenByClick === true) {
			setLeftSideBarOpenByClick(false)
		}
	}, [leftSideBarOpenByClick])

    //Calculate window width
    useEffect(() => {
		if (serverside === true) {
			return
		}

        const handleResize = () => {
            setWindowWidth(window?.innerWidth);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleThemeChange = (theme) => {
      if (!theme || theme === "null" || theme === "undefined") {
        localStorage.setItem("theme", "dark");
        setThemeMode("dark");
        return;
      }
    
      const darkMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
      const applySystemTheme = () => {
        const isDark = darkMediaQuery.matches;
        setThemeMode(isDark ? "dark" : "light");
        localStorage.setItem("theme", isDark ? "dark" : "light");
      };
    
      if (theme === "system") {
        applySystemTheme();
        darkMediaQuery.addEventListener("change", applySystemTheme);
        return () => {
          darkMediaQuery.removeEventListener("change", applySystemTheme);
        };
      } else {
        setThemeMode(theme);
        localStorage.setItem("theme", theme);
      }
    };
    
    
    useEffect(() => {
      if (serverside === true) return;
    
      const theme = localStorage.getItem("theme");
    
      if (!theme || theme === "null" || theme === "undefined") {
        localStorage.setItem("theme", "dark");
        setThemeMode("dark");
        return;
      }
    
      let cleanup;
      if (theme === "system") {
        cleanup = handleThemeChange("system");
      } else {
        handleThemeChange(theme);
      }
    
      return () => {
        if (cleanup) cleanup();
      };
    }, []);
       

    return (
        <Context.Provider value={{
            isDocSearchModalOpen,
            setIsDocSearchModalOpen,
            searchBarModalOpen,
            setSearchBarModalOpen,
            supportEmail,
            setSupportEmail,
            logoutUrl,
            setLogoutUrl,
            leftSideBarOpenByClick,
            setLeftSideBarOpenByClick,
            windowWidth,
            themeMode,
            setThemeMode,
            handleThemeChange,
            brandColor,
            setBrandColor,
            brandName,
            setBrandName,
        }}>
            {props.children}
        </Context.Provider>
    )
}
