import { createContext, useState, useEffect } from 'react';
export const Context = createContext();

export const AppContext =(props) => {

	const currentLocation = window?.location?.pathname;

    // Left side bar global states
    const [searchBarModalOpen, setSearchBarModalOpen] = useState(false);
    const [leftSideBarOpenByClick, setLeftSideBarOpenByClick] = useState(currentLocation?.includes('/workflows/') ? false : true)
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
		if (currentLocation?.includes('/workflows/') && leftSideBarOpenByClick === true) {
			setLeftSideBarOpenByClick(false)
		}
	}, [leftSideBarOpenByClick])

    //Calculate window width
    useEffect(() => {
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
