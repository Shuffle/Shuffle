import { createContext, useState, useEffect } from 'react';
export const Context = createContext();

export const AppContext =(props) => {

    // Left side bar global states
    const [searchBarModalOpen, setSearchBarModalOpen] = useState(false);
    const [leftSideBarOpenByClick, setLeftSideBarOpenByClick] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);


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
