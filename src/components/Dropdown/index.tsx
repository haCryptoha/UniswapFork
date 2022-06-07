import React from "react";

import { ActivatorButton, DropdownList, Wrapper } from "./styles";
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import styled from 'styled-components/macro'

const SelectorWrapper = styled.div`

  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    position: relative;
    
  }
`
const Logo = styled.img`
  height: 32px;
  width: 32px;
  margin-right: 8px;
`
const SelectorLogo = styled(Logo) <{ interactive?: boolean }>`
  margin-right: ${({ interactive }) => (interactive ? 8 : 0)}px;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    margin-right: 8px;
  }

`
const NetworkLabel = styled.div`
  flex: 1 1 auto;
  color: white;
  overflow: hidden;
  height: 24px;
  font-size:16px;
`
const SelectorLabel = styled(NetworkLabel)`
  display: none;
  font-size:20px;
  font-weight:400;
  color: white;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    display: block;
    margin-right: 8px;
  }
`
const FlyoutRow = styled.button<{ active: boolean }>`
  align-items: center;
 
  background-color: ${({ active, theme }) => (active ? 'rgb(60 60 60)' : 'transparent')};
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  font-weight: 500;
  justify-content: space-between;
  padding: 6px 8px;
  text-align: left;
  width: 100%;
  border:none;
`
const ActiveRowWrapper = styled.div`

  background-color: 'rgb(60 60 60)';
  
  border-radius: 8px;
  cursor: pointer;
  padding: 0px;
  width: 100%;
`
const FlyoutMenu = styled.div`
  background: linear-gradient(73.6deg, #85FFC4 2.11%, #5CC6FF 42.39%, #BC85FF 85.72%);
  border: none;
  padding:1px;
  position: absolute;
  border-radius: 20px;
  min-width: 184px;
  z-index: 99;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
  
  }
`
const FlyoutMenuContents = styled.div`
  align-items: flex-start;
  background-color: rgb(31 30 34);
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  font-size: 16px;
  overflow: auto;
  padding: 16px;
  & > *:not(:last-child) {
    margin-bottom: 12px;
  }
`
interface IDropdownItem {
  id: number;
  text: string;
}

interface IProps {
  onUserClick: (value: string) => void
  activatorText?: string;
  items?: IDropdownItem[];
  textContent:string;
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
  items = dropdownItems,
  textContent,
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
  const userClick = (text: string) =>{
    onUserClick(text);
    setIsOpen(false);
  }

  function Row({
    active,
    logoUrl,
    label    
  }: {
    active: boolean
    logoUrl:string
    label:string
  }) {      
    const rowContent = (
      <FlyoutRow  active={active} onClick={() => userClick(label)}>
        <Logo src={logoUrl}  />
        <NetworkLabel >{label}</NetworkLabel>
      </FlyoutRow>
    )
    if (active) {
      return (
        <ActiveRowWrapper>
          {rowContent}
        </ActiveRowWrapper>
      )
    }
    return rowContent
   }

  React.useEffect(() => {
    if (!isOpen) {
      setActiveIndex(-1);
    }
  }, [isOpen]);

  const focusHandler = (index: number) => {
    setActiveIndex(index);
  };
 const decreaseLong = (text:string) =>{
  return (text.substr(0,5)+"...")
 }
  return (
    <Wrapper onKeyUp={keyHandler}>
      <ActivatorButton
        aria-haspopup="true"
        aria-controls="dropdown1"
        onClick={handleClick}
        ref={activatorRef}
        onFocus={() => setActiveIndex(-1)}
      >
        <SelectorLogo interactive src={`/images/${textContent}.svg`} />
        <SelectorLabel>{decreaseLong(textContent)}</SelectorLabel>
        
      </ActivatorButton>

        <DropdownList id="dropdown1" ref={listRef} active={isOpen} role="list">
          
          
            <FlyoutMenu>
                <FlyoutMenuContents>
                <Row active={textContent=='Uniswap V2'} logoUrl={'/images/Uniswap V2.svg'} label={'Uniswap V2'}/>
                <Row active={textContent=='Trisolaris'} logoUrl={'/images/Trisolaris.svg'} label={'Trisolaris'} /> 
                <Row active={textContent=='PancakeSwap'} logoUrl={'/images/PancakeSwap.svg'} label={'PancakeSwap'}/> 
                <Row active={textContent=='SushiSwap'} logoUrl={'/images/SushiSwap.svg'} label={'SushiSwap'}/>
            
                
              
                </FlyoutMenuContents>
              </FlyoutMenu>
       
            
         
        </DropdownList>
      
    </Wrapper>
  );
};
