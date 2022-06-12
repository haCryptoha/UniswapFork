// @ts-nocheck
import Loader from 'components/Loader'
import ApeModeQueryParamReader from 'hooks/useApeModeQueryParamReader'
import { Suspense, useRef, useEffect, useCallback, useState } from 'react'
import { Route, Switch } from 'react-router-dom'
import styled from 'styled-components/macro'

import GoogleAnalyticsReporter from '../components/analytics/GoogleAnalyticsReporter'
import AddressClaimModal from '../components/claim/AddressClaimModal'
import ErrorBoundary from '../components/ErrorBoundary'
import Header from '../components/Header'
import Polling from '../components/Header/Polling'
import Popups from '../components/Popups'
import Web3ReactManager from '../components/Web3ReactManager'
import { useModalOpen, useToggleModal } from '../state/application/hooks'
import { ApplicationModal } from '../state/application/reducer'
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader'
import AddLiquidity from './AddLiquidity'
import { RedirectDuplicateTokenIds } from './AddLiquidity/redirects'
import { RedirectDuplicateTokenIdsV2 } from './AddLiquidityV2/redirects'
import AddToken from './AddToken'
import {RedirectMigrateTokenId} from './AddToken/redirects'
import Deposit from './Deposit'
import { RedirectDepositTokenId } from './Deposit/redirects'
import Manage from './Earn/Manage'
import Lend from './Lend'
import Pair from './MigrateV2'
import Pool from './Pool'
import { PositionPage } from './Pool/PositionPage'
import RemoveLiquidity from './RemoveLiquidity'
import RemoveLiquidityV3 from './RemoveLiquidity/V3'
import { OpenClaimAddressModalAndRedirectToSwap, RedirectPathToSwapOnly } from './Swap/redirects'


const AppWrapper = styled.div`
height: 100vh;
  display: flex;
  flex-flow: column;
  align-items: flex-start;
`

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 120px 16px 0px 16px;
  align-items: center;
  flex: 1;
  z-index: 1;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 4rem 8px 16px 8px;
  `};
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
  position: fixed;
  top: 0;
  z-index: 2;
`

const Marginer = styled.div`
  margin-top: 5rem;
`

function TopLevelModals() {
  const open = useModalOpen(ApplicationModal.ADDRESS_CLAIM)
  const toggle = useToggleModal(ApplicationModal.ADDRESS_CLAIM)
  return <AddressClaimModal isOpen={open} onDismiss={toggle} />
}
interface BodyContentProps {
  setBarState: (value:boolean) => void;
}
const BodyContent = ({setBarState}:BodyContentProps) => {  
  const node = useRef();
  const handleScroll = useCallback(() => {
    const { scrollTop, scrollHeight, clientHeight } = node.current;
    if (scrollTop + clientHeight === scrollHeight) {
      setBarState(true);
    } else {
      setBarState(false);
  
    }
  }, [node]);
  useEffect(() => {
    const instance = node.current;
     console.log(instance);
    if (instance !==null) {
      
      console.log(node.current);
      instance.addEventListener("scroll", handleScroll);
      return () =>{
        instance.removeEventListener("scroll", handleScroll);
      } 
    }
  }, [node, handleScroll]);
  return (
        <BodyWrapper ref={node} style={{ backgroundColor: "#09080C", overflow:"auto" }}>
            <Popups />
            <Polling />
            <TopLevelModals />
            <Suspense fallback={<Loader />}>
              <Switch>
                <Route exact strict path="/claim" component={Lend} />
                <Route exact strict path="/uni" component={Deposit} />
                <Route exact strict path="/uni/:currencyIdA/:currencyIdB" component={Manage} />

                {/* <Route exact strict path="/send" component={RedirectPathToSwapOnly} /> */}
                {/* <Route exact strict path="/swap/:outputCurrency" component={RedirectToSwap} /> */}
                <Route exact strict path="/lend" component={Lend} />
                <Route exact strict path="/pool" component={Pool} />
                <Route exact strict path="/join" component={Lend} />
                <Route exact strict path="/lend/deposit" component={Deposit} />
                <Route
                  exact
                  strict
                  path="/migrate/import/:currencyIdA?/:currencyIdB?/:feeAmount?"
                  component={RedirectMigrateTokenId}
                />
                <Route
                  exact
                  strict
                  path="/lend/deposit/:currencyIdA?/:currencyIdB?/:feeAmount?"
                  component={RedirectDepositTokenId}
                />
				      
                <Route exact strict path="/pool/:platform" component={Pool} />
                <Route exact strict path="/pool/detail/:tokenId" component={PositionPage} />

                <Route
                  exact
                  strict
                  path="/add/v2/:currencyIdA?/:currencyIdB?"
                  component={RedirectDuplicateTokenIdsV2}
                />
                <Route
                  exact
                  strict
                  path="/add/:currencyIdA?/:currencyIdB?/:feeAmount?"
                  component={RedirectDuplicateTokenIds}
                />

                <Route
                  exact
                  strict
                  path="/increase/:currencyIdA?/:currencyIdB?/:feeAmount?/:tokenId?"
                  component={AddLiquidity}
                />

                <Route exact strict path="/remove/v2/:currencyIdA/:currencyIdB" component={RemoveLiquidity} />
                <Route exact strict path="/remove/:tokenId" component={RemoveLiquidityV3} />

                <Route exact strict path="/migrate/v2" component={Pair} />
                <Route exact strict path="/migrate/:platform" component={Pair} />
                <Route exact strict path="/migrate_import" component={AddToken} />

                
		<Route component={RedirectPathToSwapOnly} />
              </Switch>
            </Suspense>
            <Marginer />
        </BodyWrapper>
  )
}
export default function App() {
  const [showBarState, setBarState] = useState(false);
  return (
    <ErrorBoundary>

      <Route component={GoogleAnalyticsReporter} />
      <Route component={DarkModeQueryParamReader} />
      <Route component={ApeModeQueryParamReader} />
      <Web3ReactManager>
        <AppWrapper >
          <HeaderWrapper style={showBarState?{borderBottom:'1px solid #61cdf9'}:{border:'none'}}>
            <Header />
          </HeaderWrapper>
          <BodyContent setBarState={setBarState}/>
        </AppWrapper>
      </Web3ReactManager>
    </ErrorBoundary>
  )
}
