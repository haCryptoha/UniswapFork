import styled from "styled-components/macro";

export const Wrapper = styled.div`
  position: relative;
  background: linear-gradient(73.6deg, rgb(133, 255, 196) 2.11%, rgb(92, 198, 255) 42.39%, rgb(188, 133, 255) 85.72%);
  padding:1px;
  border-radius: 48px;
  
  width: -webkit-fit-content;
  width: -moz-fit-content;
  width: fit-content;
  margin-right:4px;

  border: none;
  
  ${({ theme }) => theme.mediaWidth.upToSmall`
   
  `};
  `;

export const ActivatorButton = styled.button`
  width: 184px;
  height: 48px;
  background:transparent;
  align-items: center;
  font-weight: 400;
  font-size:20px;
  text-align: center;
  border-radius: 100px;
  outline: none;
  color: white;
  text-decoration: none;
  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  align-items: center;
  cursor: pointer;
  position: relative;
  z-index: 1;
  border:none;
  font-weight:500;
  font-size: 16px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
  max-width: 500px;
  width:100%;
  `};
  &:disabled {
    opacity: 50%;
    cursor: auto;
    pointer-events: none;
  }

  will-change: transform;
  transition: transform 450ms ease;
  transform: perspective(1px) translateZ(0);

  > * {
    user-select: none;
  }

  > a {
    text-decoration: none;
  }
  &:after {
    content: "";
    border-bottom: 1px solid #fff;
    border-right: 1px solid #fff;
    height: 8px;
    margin-left: 18px;
    margin-right: 16px;
    width: 8px;
    transform: rotate(45deg);
  }
`;

export const DropdownList = styled.ul<{ active: boolean }>`
  padding:0px;
  color: white;
  display: ${props => (props.active ? "block" : "none")};
  margin: 0;
  margin-top:10px;
  border-radius:8px;
  width:100%;
  padding: 1px;
  position: absolute;
  border:1px;
  border-color:#888d9b;
  z-index: 99;
  li {
    list-style: none;
    margin: 0;
    width:100%;
    button{
      background:transparent;
      color:white;
      border:none;
      height: 37px;
      font-size: 20px;
      font-weight:500;
      :hover {
        color: white;
        cursor: pointer;
        text-decoration: none;
    }
    }
  }
`;
