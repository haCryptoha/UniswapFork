import styled from "styled-components/macro";

export const Wrapper = styled.div`
  position: relative;
  background: linear-gradient(73.6deg, rgb(133, 255, 196) 2.11%, rgb(92, 198, 255) 42.39%, rgb(188, 133, 255) 85.72%)
  border-radius: 12px;
  padding: 6px 8px;
  width: -webkit-fit-content;
  width: -moz-fit-content;
  width: fit-content;
  margin-left:0px;
  padding:0px;
  border: none;
  `;

export const ActivatorButton = styled.button`
  align-items: center;
  background: linear-gradient(73.6deg, rgb(133, 255, 196) 2.11%, rgb(92, 198, 255) 42.39%, rgb(188, 133, 255) 85.72%);
  border-radius: 12px;
  font-weight:500;
  height: 38px;
  color: white;
  display: flex;
  font-size: inherit;
  max-width: 160px;
  padding: 1em;
  cursor: pointer;
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
        color: black;
        cursor: pointer;
        text-decoration: none;
    }
    }
  }
`;
