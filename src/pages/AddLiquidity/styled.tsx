import { AutoColumn } from 'components/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import Input from 'components/NumericalInput'
import { BodyWrapper } from 'pages/AppBody'
import styled from 'styled-components/macro'
import { AddRemoveTabs } from '../../components/NavigationTabs'

export const HeaderTabs = styled(AddRemoveTabs)`
   margin-bottom:30px;
`
export const PageWrapper = styled(BodyWrapper) <{ wide: boolean }>`
 
  width: 100% ;
 
  max-width:512px;
  height:512px;
  
  padding: ${({ wide }) => (wide ? '10px' : '0')};
  padding: 58px 48px 32px 48px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    max-width: 480px;
  `};
`

export const Wrapper = styled.div`
  position: relative;
  margin-bottom:64px;
  min-width: 400px;
  margin-top: 30px

  ${({ theme }) => theme.mediaWidth.upToMedium`
    min-width: 400px;
  `};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
  min-width: 340px;
`};
`

export const ScrollablePage = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  position: absolute;
 
  ${({ theme }) => theme.mediaWidth.upToMedium`
    max-width: 480px;
    margin: 0 auto;
  `};

`

export const DynamicSection = styled(AutoColumn) <{ disabled?: boolean }>`
opacity: 1 ;
    pointer-events: auto ;
`

export const CurrencyDropdown = styled(CurrencyInputPanel)`
  width: fit-content;
`

export const StyledInput = styled(Input)`
  background-color: ${({ theme }) => theme.bg0};
  text-align: left;
  font-size: 18px;
  width: 100%;
`

/* two-column layout where DepositAmount is moved at the very end on mobile. */
export const ResponsiveTwoColumns = styled.div<{ wide: boolean }>`
  display: grid;
  grid-column-gap: 50px;
  grid-row-gap: 15px;
  grid-template-columns: ${({ wide }) => (wide ? '1fr 1fr' : '1fr')};
  grid-template-rows: max-content;
  grid-auto-flow: row;

  padding-top: 20px;


  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;

    margin-top: 0;
  `};
`

export const RightContainer = styled(AutoColumn)`
  grid-row: 1 / 3;
  grid-column: 2;
  height: fit-content;

  ${({ theme }) => theme.mediaWidth.upToMedium`
  grid-row: 2 / 3;
  grid-column: 1;
  `};
`

export const StackedContainer = styled.div`
  display: grid;
`

export const StackedItem = styled.div<{ zIndex?: number }>`
  grid-column: 1;
  grid-row: 1;
  height: 100%;
  z-index: ${({ zIndex }) => zIndex};
`

export const MediumOnly = styled.div`
  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: none;
  `};
`

export const HideMedium = styled.div`
  display: none;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: block;
  `};
`
