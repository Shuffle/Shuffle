
import { createContext, useState } from 'react';

export const Context = createContext();

export const AppContext =(props) => {

    // Left side bar global states
    const [searchBarModalOpen, setSearchBarModalOpen] = useState(false);
    const [leftSideBarOpenByClick, setLeftSideBarOpenByClick] = useState(false);


    return (
        <Context.Provider value={{
            searchBarModalOpen,
            setSearchBarModalOpen,
            leftSideBarOpenByClick,
            setLeftSideBarOpenByClick
        }}>
            {props.children}
        </Context.Provider>
    )
}
