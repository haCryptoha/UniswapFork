// @ts-nocheck

import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import { ButtonGray, ButtonPrimary, ButtonText } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Dropdown from 'components/Dropdown'
import { FlyoutAlignment, NewMenu } from 'components/Menu'
import { SwapPoolTabs } from 'components/NavigationTabs'
import PositionList from 'components/PositionList'
import { RowBetween, RowFixed } from 'components/Row'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useContext, useEffect, useState } from 'react'
import { ChevronDown, Inbox } from 'react-feather'
import { Link, useParams } from 'react-router-dom'
import { useWalletModalToggle } from 'state/application/hooks'
import { useUserHideClosedPositions } from 'state/user/hooks'
import styled, { ThemeContext } from 'styled-components/macro'
import { HideSmall, ThemedText } from 'theme'

import { V2_FACTORY_ADDRESSES } from '../../constants/addresses'
import CTACards from './CTACards'
import LiquidityList from './LiquidityList/LiquidityList'
import { LoadingRows } from './styleds'


require('./style.css');


const PageWrapper = styled(AutoColumn)`
  max-width: 870px;
  

  ${({ theme }) => theme.mediaWidth.upToMedium`
    max-width: 800px;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    max-width: 500px;
  `};
`
const TitleRow = styled(RowBetween)`
  color: ${({ theme }) => theme.text2};
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
`
const ButtonRow = styled(RowFixed)`
  & > *:not(:last-child) {
    margin-left: 0px;
  }
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
`
const Menu = styled(NewMenu)`
  
  margin-left: 0;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex: 1 1 auto;
    width: 49%;
    right: 0px;
  `};

  a {
    width: 100%;
  }
`
const MenuItem = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-weight: 500;
`
const MoreOptionsButton = styled(ButtonGray)`
  border-radius: 12px;
  flex: 1 1 auto;
  padding: 6px 8px;
  width: 100%;
  border: none;
  background-color: ${({ theme }) => theme.bg0};
  margin-right: 8px;
`
const NoLiquidity = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: auto;
  max-width: 300px;
  min-height: 25vh;
`
const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  border-radius: 100px;
  padding: 6px 8px;
  width: 184px;
  height:48px;
  border: none;
  font-size:20px;
  font-weight:400;
  ${({ theme }) => theme.mediaWidth.upToSmall`
        width: 48%;
  `};
`

const MainContentWrapper = styled.main`
  background-color: ${({ theme }) => theme.bg0};

  display: flex;
  flex-direction: column;
`
const ResponsiveTitle = styled.div`
   font-size : 20px;
   color: white;
   margin-bottom: -52px;
   text-align: center;
    width: 320px;
    margin-left: 5px;
   ${({ theme }) => theme.mediaWidth.upToSmall`
       margin-bottom:0px;


  `};

`

function PositionsLoadingPlaceholder() {
  return (
    <LoadingRows>
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
    </LoadingRows>
  )
}

export default function Pool() {
  const { account, chainId } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const theme = useContext(ThemeContext)
  const [userHideClosedPositions, setUserHideClosedPositions] = useUserHideClosedPositions()
  const [filteredPositions, setFilteredPositions] = useState([]);
  const [positionsLoading, setPositionsLoading] = useState(true);
  const params: any = useParams()
  const showConnectAWallet = Boolean(!account)

  const loadPools = async (accountAddr, ammType) => {
    if (accountAddr != undefined) {
      const APIURL = 'https://api.thegraph.com/subgraphs/name/muranox/double2win'
      const tokensQuery = `
        query {
          liquidities(where: {owner: "${accountAddr.toLowerCase()}", ammType : "${ammType}"}) {
            id
            asset
            capital
            lpAmount
            ammType
            capitalAmount
            assetAmount
            bundle
          }
        }
      `
      const client = new ApolloClient({
        uri: APIURL,
        cache: new InMemoryCache(),
      })

      const resp = await client
        .query({
          query: gql(tokensQuery),
        });

      if (resp.data.liquidities) {
        console.log(resp);
        return resp.data.liquidities;
      }
    }
    return [];
  }

  const [textContent, setContent] = useState('Uniswap V2')

  useEffect(() => {
    async function fetchData() {
      // You can await here
      console.log("first arrived");
      setPositionsLoading(true);
      const closed = [], opened = [];
      //fetch pool
      const pools = await loadPools(account, capitalizeFirstLetter(textContent));
      for (let i = 0; i < pools.length; i++) {
        if (pools[i].lpAmount == 0) {
          closed.push(pools[i]);
        } else {
          opened.push(pools[i]);
        }
      }
      console.log(userHideClosedPositions);
      console.log(closed);
      setFilteredPositions([...opened, ...(userHideClosedPositions ? [] : closed)])
      setPositionsLoading(false);

      // ...
    }
    fetchData();
  }, [textContent, account, userHideClosedPositions])

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }
  
  return (
    <>
      <PageWrapper>
        <SwapPoolTabs active={'pool'} />
        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%', justifyContent: "center" }}>
           {/* <TitleRow style={{ marginBottom: '1rem', display: "flex" }} padding={'0'}>
              
              <ButtonRow className="test" style={{ justifyContent: "space-between", width: "100%" }}>
                
                
                
              </ButtonRow>
            </TitleRow>
            */}
            <TitleRow style={{ marginBottom: '1rem', justifyContent: 'center' }} padding={'0'}>
                <ResponsiveTitle  >
                  {textContent} Pools Overview
                </ResponsiveTitle>
              
                <ButtonRow>  
                  <Dropdown  onUserClick={setContent} textContent={textContent}/>             
                  <ResponsiveButtonPrimary className = "gradientButton" id="join-pool-button" as={Link} to="/add/0x139F097A7693B9f2080b44D71818e3120c8fFeF0" style={{ background: "linear-gradient(73.6deg, #85FFC4 2.11%, #5CC6FF 42.39%, #BC85FF 85.72%)" }}>
                    New Position
                  </ResponsiveButtonPrimary>
                </ButtonRow>
            </TitleRow>

            <div style={(filteredPositions && filteredPositions.length > 0) ?{padding:'0px'}:{ background:  "linear-gradient(73.6deg, #85FFC4 2.11%, #5CC6FF 42.39%, #BC85FF 85.72%)", padding:'1px' }}>
              <MainContentWrapper  style={(filteredPositions && filteredPositions.length > 0) ?{background:"rgb(9, 8, 12)",minHeight: "586px"}:{ background:  "#1E1E1E", minHeight: "586px" }} >
                {positionsLoading ? (
                  <PositionsLoadingPlaceholder />
                ) : (filteredPositions && filteredPositions.length > 0) ? (
                  <PositionList
                    positions={filteredPositions}
                    setUserHideClosedPositions={setUserHideClosedPositions}
                    userHideClosedPositions={userHideClosedPositions}
                  />

                ) : (
                  <NoLiquidity >
                    <ThemedText.Body color={theme.text3} textAlign="center">
                      <svg width="75" height="75" viewBox="0 0 75 75" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display:"flex" }}>
                        <path d="M68.75 37.5H50L43.75 46.875H31.25L25 37.5H6.25" stroke="url(#paint0_linear_3832_13200)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M17.0313 15.9688L6.25 37.5V56.25C6.25 57.9076 6.90848 59.4973 8.08058 60.6694C9.25269 61.8415 10.8424 62.5 12.5 62.5H62.5C64.1576 62.5 65.7473 61.8415 66.9194 60.6694C68.0915 59.4973 68.75 57.9076 68.75 56.25V37.5L57.9688 15.9688C57.4513 14.9275 56.6537 14.0512 55.6655 13.4384C54.6773 12.8256 53.5378 12.5006 52.375 12.5H22.625C21.4622 12.5006 20.3227 12.8256 19.3345 13.4384C18.3463 14.0512 17.5487 14.9275 17.0313 15.9688V15.9688Z" stroke="url(#paint1_linear_3832_13200)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <defs>
                          <linearGradient id="paint0_linear_3832_13200" x1="7.95454" y1="46.875" x2="24.2825" y2="14.8373" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#85FFC4" />
                            <stop offset="0.411458" stopColor="#5CC6FF" />
                            <stop offset="0.854167" stopColor="#BC85FF" />
                          </linearGradient>
                          <linearGradient id="paint1_linear_3832_13200" x1="7.95454" y1="62.5" x2="77.7043" y2="36.8389" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#85FFC4" />
                            <stop offset="0.411458" stopColor="#5CC6FF" />
                            <stop offset="0.854167" stopColor="#BC85FF" />
                          </linearGradient>
                        </defs>
                      </svg>

                    </ThemedText.Body>
                    <ButtonText
                        style={{ marginTop: '.5rem', color: "white", fontSize: "14px" }}
                        onClick={() => setUserHideClosedPositions(!userHideClosedPositions)}
                      >
                        Your Active Position will appear here
                    </ButtonText>
                    {showConnectAWallet && (

                        <ButtonPrimary style={{ marginTop: '2em', padding: '8px 16px', width: "140%", height: "48px" }} className="pool-body-connect" onClick={toggleWalletModal}>
                          Connect Wallet
                        </ButtonPrimary>
                    )}
                  </NoLiquidity>

                )}
              </MainContentWrapper>
            </div>

            {/* <HideSmall>
              <CTACards />
            </HideSmall> */}
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
    </>
  )
}
