import styled from "styled-components/macro";

export const Wrapper = styled.div`
  position: relative;
  background: linear-gradient(73.6deg, rgb(133, 255, 196) 2.11%, rgb(92, 198, 255) 42.39%, rgb(188, 133, 255) 85.72%)
  border-radius: 12px;
  padding: 6px 8px;
  width: -webkit-fit-content;
  width: -moz-fit-content;
  width: fit-content;
  margin-right:3px;
  padding:0px;
  border: none;
  height: 30px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
   
  `};
  `;

export const ActivatorButton = styled.button`
  align-items: center;
  background: linear-gradient(73.6deg, rgb(133, 255, 196) 2.11%, rgb(92, 198, 255) 42.39%, rgb(188, 133, 255) 85.72%);

  font-weight: 500;
  text-align: center;
  border-radius: 12px;
  outline: none;
  border: 1px solid transparent;
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
  width:100%;
  ${({ theme }) => theme.mediaWidth.upToSmall`

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
  height: 30px;
  &:after {
    content: "";
    border-bottom: 1px solid #fff;
    border-right: 1px solid #fff;
    height: 0.5em;
    margin-left: 0.75em;
    width: 0.5em;
    transform: rotate(45deg);
  }
`;

export const DropdownList = styled.ul<{ active: boolean }>`
  background-color: #1c1924;
  color: grey;
  display: ${props => (props.active ? "block" : "none")};
  margin: 0;
  margin-top:5px;
  border-radius:5px;
  min-width: 147px;
  padding: 0;
  position: absolute;
  border:1px;
  border-color:#888d9b;
  li {
    list-style: none;
    margin: 0;
    width:147px;
    button{
      background:transparent;
      color:#565A69;
      border:none;
      height: 37px;
      font-size: 16px;
      :hover {
        color: white;
        cursor: pointer;
        text-decoration: none;
    }
    }
  }
`;
