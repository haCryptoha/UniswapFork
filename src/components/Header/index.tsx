// @ts-nocheck
import useScrollPosition from '@react-hook/window-scroll'
import { CHAIN_INFO } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useTheme from 'hooks/useTheme'
import { darken } from 'polished'
import { NavLink } from 'react-router-dom'
import { Text } from 'rebass'
import { useShowClaimPopup, useToggleSelfClaimModal } from 'state/application/hooks'
import { useUserHasAvailableClaim } from 'state/claim/hooks'
import { useUserHasSubmittedClaim } from 'state/transactions/hooks'
import { useDarkModeManager } from 'state/user/hooks'
import { useNativeCurrencyBalances } from 'state/wallet/hooks'
import styled from 'styled-components/macro'

import { ReactComponent as Logo } from '../../assets/svg/logo.svg'
import { ExternalLink, ThemedText } from '../../theme'
import ClaimModal from '../claim/ClaimModal'
import { CardNoise } from '../earn/styled'
import Row from '../Row'
import { Dots } from '../swap/styleds'
import Web3Status from '../Web3Status'
import HolidayOrnament from './HolidayOrnament'
import NetworkSelector from './NetworkSelector'
require('./style.css');

const HeaderFrame = styled.div<{ showBackground: boolean }>`
  display: grid;
  grid-template-columns: 120px 1fr 120px;
  align-items: center;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
  width: 100%;
  top: 0;
  position: relative;
  padding: 1rem;
  z-index: 21;
  position: relative;
  /* Background slide effect on scroll. */
  background-image: ${({ theme }) => `linear-gradient(to bottom, transparent 50%, ${theme.bg0} 50% )}}`};
  background-position: ${({ showBackground }) => (showBackground ? '0 0' : '0 0')};
  background-size: 100% 200%;
  box-shadow: 0px 0px 0px 1px ${({ theme, showBackground }) => (showBackground ? theme.bg2 : 'transparent;')};
  transition: background-position 0.1s, box-shadow 0.1s;
  background-blend-mode: hard-light;
  height 80px;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 48px 1fr 1fr;
  `};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding:  1rem;
    grid-template-columns: 1fr 1fr;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding:  1rem;
    grid-template-columns: 36px 1fr;
  `};
`

const HeaderControls = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-self: flex-end;
`

const HeaderElement = styled.div`
  display: flex;
  align-items: center;

  &:not(:first-child) {
    margin-left: 0.5em;
  }

  /* addresses safari's lack of support for "gap" */
  & > *:not(:first-child) {
    margin-left: 8px;
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    align-items: center;
  `};
`

const HeaderLinks = styled(Row)`
  justify-self: center;
 
  width: fit-content;
  border-radius: 100px;
  display: grid;
  grid-auto-flow: column;
  grid-gap: 7px;
  overflow: auto;
  align-items: center;
  background: #262231;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    justify-self: start;  
    margin-left: 130px;
    grid-gap: 7px;
    `};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    justify-self: center;
  `};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: row;
    justify-content: space-between;
    justify-self: center;
    z-index: 99;
    position: fixed;
    bottom: 0; right: 50%;
    transform: translate(50%,-50%);
    margin: 0 auto;
    grid-gap: 7px;
   
    box-shadow: 0px 6px 10px rgb(0 0 0 / 2%);
  `};
`

const AccountElement = styled.div<{ active: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  border-radius: 100px;
  white-space: nowrap;
  width: 160px;
  height: 30px;
  background: linear-gradient(73.6deg, #85FFC4 2.11%, #5CC6FF 42.39%, #BC85FF 85.72%);
  color:white;
  height:40px;
  margin-right: 34px;
  margin-left:16px ;
  padding:1px;
  :focus {
    border: 1px solid blue;
  }
  ${({ theme }) => theme.mediaWidth.upToLarge`
     margin-right: 34px;

    
    `};
  ${({ theme }) => theme.mediaWidth.upToSmall`
     margin-right: -9px;
     width: 120px;
  `};
`

const UNIAmount = styled(AccountElement)`
  color: white;
  padding: 4px 8px;
  height: 36px;
  font-weight: 500;
  background-color: ${({ theme }) => theme.bg3};
  background: radial-gradient(174.47% 188.91% at 1.84% 0%, #ff007a 0%, #2172e5 100%), #edeef2;
`

const UNIWrapper = styled.span`
  width: fit-content;
  position: relative;
  cursor: pointer;

  :hover {
    opacity: 0.8;
  }

  :active {
    opacity: 0.9;
  }
`

const BalanceText = styled(Text)`
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `};
`

const Title = styled.a`
  display: flex;
  align-items: center;
  pointer-events: auto;
  justify-self: flex-start;
  margin-left: 20%;
  text-decoration: none;
  width:155px;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    justify-self: start;  
    margin-left: 40%;
    
    `};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-self: center;
    width:135px;
    margin-left:100px;
  `};
  :hover {
    cursor: pointer;
  }
`

const UniIcon = styled.div`
  transition: transform 0.3s ease;
  

  position: relative;
`

const activeClassName = 'ACTIVE'

const StyledNavLink = styled(NavLink).attrs({
  activeClassName,
})`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  font-size: 14ps;
  font-weight: 700;
  padding: 4px 16px;
  word-break: break-word;
  overflow: hidden;
  white-space: nowrap;
  background-color: #1C1924;
  border-radius: 100px;
  height:30px;
  box-sizing: content-box;
  &.${activeClassName} {
    font-weight: 600;
    justify-content: center;
    background: linear-gradient(73.6deg, #85FFC4 2.11%, #5CC6FF 42.39%, #BC85FF 85.72%);
    -webkit-text-fill-color: transparent;
    -webkit-background-clip: text;
    
  }
  :hover,
  :focus {
    font-weight: 600;
    justify-content: center;
    background: linear-gradient(73.6deg, #85FFC4 2.11%, #5CC6FF 42.39%, #BC85FF 85.72%);
    -webkit-text-fill-color: transparent;
    -webkit-background-clip: text;
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 4px 10px;
  `};


`



const StyledExternalLink = styled(ExternalLink).attrs({
  activeClassName,
}) <{ isActive?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text2};
  font-size: 1rem;
  width: fit-content;
  margin: 0 12px;
  font-weight: 500;

  &.${activeClassName} {
    border-radius: 14px;
    font-weight: 600;
    color: ${({ theme }) => theme.text1};
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
    text-decoration: none;
  }
`
const NavLinkOutLine = styled(NavLink).attrs({
  activeClassName,
})`
  background:#1C1924;
  text-decoration: none;
  padding:1px;
  border-radius:100px;
  &.${activeClassName} {
    padding:1px;
    background: linear-gradient(73.6deg,#85FFC4 2.11%,#5CC6FF 42.39%,#BC85FF 85.72%);
  }
  :hover,
  :focus {
    padding:1px;
    background: linear-gradient(73.6deg,#85FFC4 2.11%,#5CC6FF 42.39%,#BC85FF 85.72%);
  }
`
const NavLinkOutBack = styled.div`
  background: #1C1924;
  border-radius:100px;
`
export default function Header() {
  const { account, chainId } = useActiveWeb3React()

  const userEthBalance = useNativeCurrencyBalances(account ? [account] : [])?.[account ?? '']
  const [darkMode] = useDarkModeManager()
  const { white, black } = useTheme()

  const toggleClaimModal = useToggleSelfClaimModal()

  const availableClaim: boolean = useUserHasAvailableClaim(account)

  const { claimTxn } = useUserHasSubmittedClaim(account ?? undefined)

  const showClaimPopup = useShowClaimPopup()

  const scrollY = useScrollPosition()

  const {
    infoLink,
    nativeCurrency: { symbol: nativeCurrencySymbol },
  } = CHAIN_INFO[chainId ? chainId : SupportedChainId.MAINNET]

  return (
    <HeaderFrame showBackground={scrollY > 45} style={{ backgroundColor: "#09080C" }}>
      <ClaimModal />
      <Title href=".">
        <UniIcon>
          <Logo fill={!darkMode ? white : black} width="100%" height="100%" title="logo" />
          <HolidayOrnament />
        </UniIcon>
      </Title>
    
     
      <HeaderLinks>
        {/* <StyledNavLink id={`swap-nav-link`} to={'/swap'}>
          Swap
        </StyledNavLink> */}
        <NavLinkOutLine 
            to={'/pool/all'} 
            id={`pool-nav-link-out`}
            isActive={(match, { pathname }) =>
                Boolean(match) ||
                pathname.startsWith('/pool') ||
                pathname.startsWith('/remove') ||
                pathname.startsWith('/increase') ||
                pathname.startsWith('/find') ||
                pathname.startsWith('/add')
              } >
         <NavLinkOutBack>
            <StyledNavLink
              className="header-nav-link"
              id={`pool-nav-link`}
              to={'/pool/all'}
              isActive={(match, { pathname }) =>
                Boolean(match) ||
                pathname.startsWith('/pool') ||
                pathname.startsWith('/remove') ||
                pathname.startsWith('/increase') ||
                pathname.startsWith('/find') ||
                pathname.startsWith('/add')
              }
            >
              Capital
            </StyledNavLink>
         </NavLinkOutBack>
        </NavLinkOutLine>
        
        <NavLinkOutLine to={'/lend'} id={`pool-nav-link-out`}>
         <NavLinkOutBack>
          <StyledNavLink className="header-nav-link" id={`lend-nav-link`} to={'/lend'}>
            Token
          </StyledNavLink>
         </NavLinkOutBack>
        </NavLinkOutLine>
        <NavLinkOutLine to={'/migrate/v2'} id={`pool-nav-link-out`}>
         <NavLinkOutBack>
          <StyledNavLink 
          className="header-nav-link" 
          id={`migrate-nav-link`}
          to={'/migrate/v2'}
          isActive={(match, { pathname }) =>
                Boolean(match) ||
                pathname.startsWith('/migrate') ||
                pathname.startsWith('/import') 
              }>
            Pair
          </StyledNavLink>
         </NavLinkOutBack>
        </NavLinkOutLine>        

        <NavLinkOutLine to={'/join'} id={`pool-nav-link-out`}>
         <NavLinkOutBack>
          <StyledNavLink className="header-nav-link" id={`join-nav-link`} to={'/join'}>
            DDC
          </StyledNavLink>
         </NavLinkOutBack>
        </NavLinkOutLine>
        <NavLinkOutLine 
          to={'/claim'} 
          id={`pool-nav-link-out`}
          isActive={(match, { pathname }) =>
          Boolean(match) ||
          pathname.startsWith('/claim') }
        >
         <NavLinkOutBack>
          <StyledNavLink className="header-nav-link" id={`claim-nav-link`} to={'/claim'}>
            DDJ
          </StyledNavLink>
         </NavLinkOutBack>
        </NavLinkOutLine>
        
        
        
        
        
        {/* {(!chainId || chainId === SupportedChainId.MAINNET) && (
          <StyledNavLink id={`vote-nav-link`} to={'/vote'}>
            Vote
          </StyledNavLink>
        )} */}
        {/* <StyledExternalLink id={`charts-nav-link`} href={infoLink}>
          Charts
          <sup>↗</sup>
        </StyledExternalLink> */}
      </HeaderLinks>

      <HeaderControls>
        <HeaderElement>
          <NetworkSelector />
        </HeaderElement>
        <HeaderElement>
          {availableClaim && !showClaimPopup && (
            <UNIWrapper onClick={toggleClaimModal}>
              <UNIAmount active={!!account && !availableClaim} style={{ pointerEvents: 'auto' }}>
                <ThemedText.White padding="0 2px">
                  {claimTxn && !claimTxn?.receipt ? (
                    <Dots>
                      Claiming UNI
                    </Dots>
                  ) : (
                    <>Claim UNI</>
                  )}
                </ThemedText.White>
              </UNIAmount>
              <CardNoise />
            </UNIWrapper>
          )}
         
          <AccountElement active={!!account}>



        
            <Web3Status />
          </AccountElement>
        </HeaderElement>
        
      </HeaderControls>
    </HeaderFrame>
  )
}
