import React, { createContext, useState, useEffect } from 'react';
export const Context = createContext();

export const AppContext = (props) => {
	const { serverside } = props

	const currentLocation = serverside === true ? "" : window?.location?.pathname;

    // Left side bar global states
    const [searchBarModalOpen, setSearchBarModalOpen] = useState(false);
    const [isDocSearchModalOpen, setIsDocSearchModalOpen] = useState(false);
    const [leftSideBarOpenByClick, setLeftSideBarOpenByClick] = useState(currentLocation?.includes('/workflows/') ? false : true)
    const [windowWidth, setWindowWidth] = useState(serverside === true ? 100 : window.innerWidth);

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


    return (
        <Context.Provider value={{
            isDocSearchModalOpen,
            setIsDocSearchModalOpen,
            searchBarModalOpen,
            setSearchBarModalOpen,
            leftSideBarOpenByClick,
            setLeftSideBarOpenByClick,
            windowWidth
        }}>
            {props.children}
        </Context.Provider>
    )
}
