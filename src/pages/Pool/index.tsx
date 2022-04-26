// @ts-nocheck

import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import { ButtonGray, ButtonPrimary, ButtonText } from 'components/Button'
import { AutoColumn } from 'components/Column'
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
  width: 100%;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    max-width: 800px;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    max-width: 500px;
  `};
`
const TitleRow = styled(RowBetween)`
  color: ${({ theme }) => theme.text2};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
  `};
`
const ButtonRow = styled(RowFixed)`
  & > *:not(:last-child) {
    margin-left: 8px;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    flex-direction: row-reverse;
  `};
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
  border-radius: 12px;
  padding: 6px 8px;
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex: 1 1 auto;
    width: 100%;
  `};
`

const MainContentWrapper = styled.main`
  background-color: ${({ theme }) => theme.bg0};
  padding: 8px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
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
  const [openPositions, setOpenPositions] = useState([]);
  const [closedPositions, setClosedPositions] = useState([]);
  const [filteredPositions, setFilteredPositions] = useState([]);
  const [positionsLoading, setPositionsLoading] = useState(true);
  const [showLiquidityComponent, setShowLiquidityComponent] = useState(false)
  const params: any = useParams()
  const showConnectAWallet = Boolean(!account)
  const showV2Features = Boolean(chainId && V2_FACTORY_ADDRESSES[chainId])

  const loadPools = async (accountAddr, ammType) => {
    if (accountAddr != undefined) {
      const APIURL = 'https://api.thegraph.com/subgraphs/name/muranox/double2win'
      const tokensQuery = `
        query {
          bundleEntities(where: {id: "${accountAddr.toLowerCase()}"}) {
            id
            asset
            capital
            lpAmount
            ammType
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
      if (resp.data.bundleEntities) {
        console.log(resp);
        return resp.data.bundleEntities;
      }
    }
    return [];
  }

  useEffect(() => {
    async function fetchData() {
      // You can await here
      setPositionsLoading(true);
      const closed = [], opened = [];
      const pools = await loadPools(account, params.platform);
      for (let i = 0; i < pools.length; i++) {
        if (pools[i].lpAmount == 0) {
          closed.push(pools[i]);
        } else {
          opened.push(pools[i]);
        }
      }
      setOpenPositions(opened);
      setClosedPositions(closed);
      setFilteredPositions([...opened, ...(userHideClosedPositions ? [] : closed)])
      setPositionsLoading(false);
      // ...
    }
    fetchData();
  }, [params.platform, account])

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  const menuItems = [
    {
      content: (
        <MenuItem>
          Trisolaris
          {/* <ChevronsRight size={16} /> */}
        </MenuItem>
      ),
      link: '/pool/trisolaris',
      external: false,
    },
    {
      content: (
        <MenuItem>
          Uniswap V2
          {/* <Layers size={16} /> */}
        </MenuItem>
      ),
      link: '/pool/uniswap',
      external: false,
    },
  ]

  return (
    <>
      <PageWrapper>
        <SwapPoolTabs active={'pool'} />
        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%', justifyContent: "center" }}>
            <TitleRow style={{ marginTop: '1rem', display: showConnectAWallet ? "none" : "flex" }} padding={'0'}>
              {/* <ThemedText.Body fontSize={'20px'}>
                {params.platform ? capitalizeFirstLetter(params.platform) : ''} Pools Overview
              </ThemedText.Body> */}
              <ButtonRow className="test" style={{ justifyContent: "space-between", width: "100%" }}>
                {showV2Features && (
                  <Menu
                    menuItems={menuItems}
                    flyoutAlignment={FlyoutAlignment.LEFT}
                    selectedParam={params.platform}
                    ToggleUI={(props: any) => (
                      <MoreOptionsButton {...props} style={{ background: "linear-gradient(73.6deg, #85FFC4 2.11%, #5CC6FF 42.39%, #BC85FF 85.72%)" }}>
                        <ThemedText.Body style={{ alignItems: 'center', display: 'flex', color: "white" }}>
                          {!params.platform ? capitalizeFirstLetter(params.platform) : 'Uniswap V2'}
                          <ChevronDown size={15} />
                        </ThemedText.Body>
                      </MoreOptionsButton>
                    )}
                  />
                )}
                <ThemedText.Body fontSize={'20px'} color={'white'}>
                  {params.platform ? capitalizeFirstLetter(params.platform) : ''} Pools Overview
                </ThemedText.Body>
                <ResponsiveButtonPrimary id="join-pool-button" as={Link} to="/add/ETH" style={{ background: "linear-gradient(73.6deg, #85FFC4 2.11%, #5CC6FF 42.39%, #BC85FF 85.72%)" }}>
                  New Position
                </ResponsiveButtonPrimary>
              </ButtonRow>
            </TitleRow>
            {!showLiquidityComponent ? <div className="main-warrap" style={{ background: showConnectAWallet ? "transparent" : "linear-gradient(73.6deg, #85FFC4 2.11%, #5CC6FF 42.39%, #BC85FF 85.72%)" }}>
              <MainContentWrapper className='pool-body-NoLiquidity' style={{ background: showConnectAWallet ? "#09080c" : "#1E1E1E", width: "584px", height: "584px" }} >
                {positionsLoading ? (
                  <PositionsLoadingPlaceholder />
                ) : filteredPositions && closedPositions && filteredPositions.length > 0 ? (
                  <PositionList
                    positions={filteredPositions}
                    setUserHideClosedPositions={setUserHideClosedPositions}
                    userHideClosedPositions={userHideClosedPositions}
                  />

                ) : (
                  <NoLiquidity >
                    <ThemedText.Body color={theme.text3} textAlign="center">
                      <Inbox size={65} strokeWidth={1} style={{ marginBottom: '.5rem', display: showConnectAWallet ? "none" : "flex", color: "linear-gradient(73.6deg, #85FFC4 2.11%, #5CC6FF 42.39%, #BC85FF 85.72%)" }} />
                      {/* <FontAwesomeIcon icon="fa-light fa-inbox" /> */}
                      <img style={{ width: "250px", height: "175px", display: showConnectAWallet ? "flex" : "none" }} src="images/1.svg" />
                    </ThemedText.Body>
                    {!showConnectAWallet && (<>
                      <ButtonText
                        style={{ marginTop: '.5rem', color: "white", fontSize: "14px" }}
                        onClick={() => setUserHideClosedPositions(!userHideClosedPositions)}
                      >
                        Your Active Position will appear here
                      </ButtonText>
                      <button onClick={() => setShowLiquidityComponent(true)}>
                        show liquidity list component
                      </button>
                    </>
                    )}
                    {showConnectAWallet && (

                      <ButtonPrimary style={{ marginTop: '2em', padding: '8px 16px' }} className="pool-body-connect" onClick={toggleWalletModal}>
                        Connect a wallet
                      </ButtonPrimary>
                    )}
                  </NoLiquidity>

                )}
              </MainContentWrapper>
            </div> : <LiquidityList />}

            {/* <HideSmall>
              <CTACards />
            </HideSmall> */}
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
    </>
  )
}
