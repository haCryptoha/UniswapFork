import React from "react";

import { ActivatorButton, DropdownList, Wrapper } from "./styles";

interface IDropdownItem {
  id: number;
  text: string;
}

interface IProps {
  onUserClick: (value: string) => void
  activatorText?: string;
  items?: IDropdownItem[];
  
}

const dropdownItems = [
  {
    id: 1,
    text: "Trisolaris"
  },
  {
    id: 2,
    text: "Uniswap V2"
  }
  
];


export default function Dropdown({
  onUserClick,
  activatorText = '',
  items = dropdownItems
}: IProps)  {
  const activatorRef = React.useRef<HTMLButtonElement | null>(null);
  const listRef = React.useRef<HTMLUListElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [isTrisolaris, setTrisolaris] = React.useState(false)
  const handleClick = () => {
    setIsOpen(!isOpen);
  };
  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener("mouseup", handleClickOutside);
    } else {
      document.removeEventListener("mouseup", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mouseup", handleClickOutside);
    };
  }, [isOpen]);
  const keyHandler = (event: React.KeyboardEvent) => {
    if (isOpen) {
      switch (event.key) {
        case "Escape":
          setIsOpen(false);
          break;
        case "ArrowDown":
          const nodeList = listRef.current!.querySelectorAll("a");
          if (activeIndex === items.length - 1) return;
          nodeList[activeIndex + 1].focus();
          break;
        case "ArrowUp":
          const nodeList2 = listRef.current!.querySelectorAll("a");
          if (activeIndex === 0) return;
          nodeList2[activeIndex - 1].focus();
          break;
      }
    }
  };

  const handleClickOutside = (event: any) => {
    if (
      listRef.current!.contains(event.target) ||
      activatorRef.current!.contains(event.target)
    ) {
      return;
    }
    setIsOpen(false);
  };



  React.useEffect(() => {
    if (!isOpen) {
      setActiveIndex(-1);
    }
  }, [isOpen]);

  const focusHandler = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <Wrapper onKeyUp={keyHandler}>
      <ActivatorButton
        aria-haspopup="true"
        aria-controls="dropdown1"
        onClick={handleClick}
        ref={activatorRef}
        onFocus={() => setActiveIndex(-1)}
      >
        {isTrisolaris?'Trisolaris':'Uniswap V2'}
      </ActivatorButton>
      <DropdownList id="dropdown1" ref={listRef} active={isOpen} role="list">
       
          <li key={1}>
            <button onClick = {() =>{ setTrisolaris(true); onUserClick("Trisolaris");setIsOpen(false)}}>
             {"Trisolaris"}
            </button>
          </li>
          <li key={2}>
            <button onClick = {() => {setTrisolaris(false); onUserClick("Uniswap V2");setIsOpen(false)}}>
              {"Uniswap V2"}
            </button>
          </li>
       
      </DropdownList>
    </Wrapper>
  );
};
