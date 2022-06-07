// @ts-nocheck
import { ArrowLeft, HelpCircle } from 'react-feather'

import { Price, Token } from '@uniswap/sdk-core'
import { Position } from '@uniswap/v3-sdk'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { AddRemoveTabs } from '../../components/NavigationTabs'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import { utils } from "ethers"
import { useToken } from 'hooks/Tokens'
import { useVaultManagerContract } from 'hooks/useContract'
import { useCallback, useState, useEffect } from 'react'
import ReactGA from 'react-ga4'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'
import { MEDIA_WIDTHS } from 'theme'
import { PositionDetails } from 'types/position'
import { unwrappedToken } from 'utils/unwrappedToken'
import { DAI, USDC_MAINNET, USDT, WBTC, WRAPPED_NATIVE_CURRENCY } from '../../constants/tokens'
import Double from '../../sdk/Double'

const LinkRow = styled(Link)`
  align-items: center;
  border-radius: 20px;
  display: flex;
  cursor: pointer;
  user-select: none;
  display: flex;
  flex-direction: column;

  justify-content: space-between;
  color: ${({ theme }) => theme.text1};
  margin: 8px 0;
  padding: 16px;
  text-decoration: none;
  font-weight: 500;
  background-color: ${({ theme }) => theme.bg1};

  &:last-of-type {
    margin: 8px 0 0 0;
  }
  & > div:not(:first-child) {
    text-align: center;
  }
  :hover {
    background-color: ${({ theme }) => theme.bg2};
  }

  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    /* flex-direction: row; */
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    row-gap: 12px;
  `};
`

const BadgeText = styled.div`
  font-weight: 500;
  font-size: 14px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 12px;
  `};
`

const DataLineItem = styled.div`
  font-size: 14px;
`

const RangeLineItem = styled(DataLineItem)`
  display: flex;
  flex-direction: row;
  align-items: center;

  margin-top: 4px;
  width: 100%;

  ${({ theme }) => theme.mediaWidth.upToSmall`
  background-color: ${({ theme }) => theme.bg2};
    border-radius: 12px;
    padding: 8px 0;
`};
`

const DoubleArrow = styled.span`
  margin: 0 2px;
  color: ${({ theme }) => theme.text3};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 4px;
    padding: 20px;
  `};
`

const RangeText = styled.span`
  /* background-color: ${({ theme }) => theme.bg2}; */
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
`

const ExtentsText = styled.span`
  color: ${({ theme }) => theme.text3};
  font-size: 14px;
  margin-right: 4px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `};
`

const PrimaryPositionIdData = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  > * {
    margin-right: 8px;
  }
`

const DataText = styled.div`
  font-weight: 600;
  font-size: 18px;
  color:white;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 14px;
  `};
`

interface PositionListItemProps {
  setActiveKey:(value: bundleID) => void;
  activeKey: bundleID;
  key: number;
  positionDetails: PositionDetails;
  index:number;
 }

export function getPriceOrderingFromPositionForUI(position?: Position): {
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  quote?: Token
  base?: Token
} {
  if (!position) {
    return {}
  }

  const token0 = position.amount0.currency
  const token1 = position.amount1.currency

  // if token0 is a dollar-stable asset, set it as the quote token
  const stables = [DAI, USDC_MAINNET, USDT]
  if (stables.some((stable) => stable.equals(token0))) {
    return {
      priceLower: position.token0PriceUpper.invert(),
      priceUpper: position.token0PriceLower.invert(),
      quote: token0,
      base: token1,
    }
  }

  // if token1 is an ETH-/BTC-stable asset, set it as the base token
  const bases = [...Object.values(WRAPPED_NATIVE_CURRENCY), WBTC]
  if (bases.some((base) => base && base.equals(token1))) {
    return {
      priceLower: position.token0PriceUpper.invert(),
      priceUpper: position.token0PriceLower.invert(),
      quote: token0,
      base: token1,
    }
  }

  // if both prices are below 1, invert
  if (position.token0PriceUpper.lessThan(1)) {
    return {
      priceLower: position.token0PriceUpper.invert(),
      priceUpper: position.token0PriceLower.invert(),
      quote: token0,
      base: token1,
    }
  }

  // otherwise, just return the default
  return {
    priceLower: position.token0PriceLower,
    priceUpper: position.token0PriceUpper,
    quote: token1,
    base: token0,
  }
}

export default function PositionListItem({ setActiveKey, activeKey, key, positionDetails , index}: PositionListItemProps) {
  const {
    capital: token0Address,
    asset: token1Address,
    lpAmount: liquidityRaw,
    capitalAmount: token0AmountRaw,
    assetAmount: token1AmountRaw,
    bundle: bundleID,
  } = positionDetails;
  

  const [collapse, setCollapse] = useState(true);
  const [removeClicked, setRemoveClicked] = useState(false);
  const vaultManager = useVaultManagerContract();
  
  useEffect(()=>{
	  console.log("bundle:",bundleID, "activeKey:",activeKey);
	  if(bundleID===activeKey){
		  setCollapse(false)
	  }else{
		  setCollapse(true)
	  }
	  
  },[activeKey])

 
  const removeOnClick = () => {
    if (removeClicked === false)
      setRemoveClicked(true);
    else setRemoveClicked(false);
   
  }
  const changeCollpase = () => {
    if (collapse === true){
		
		setActiveKey(bundleID);
	}
	else{
		
		setActiveKey("");
	}
      
	  
   
  }

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  const token0Amount = utils.formatUnits(token0AmountRaw, currency0?.decimals);
  const token1Amount = utils.formatUnits(token1AmountRaw, currency1?.decimals);
  const liquidity = utils.formatUnits(liquidityRaw, 18);

  const positionSummaryLink = '/pool/detail/' + positionDetails.tokenId
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm
  const [txHash, setTxHash] = useState<string>('')
  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    setTxHash('')
  }, [txHash])

  const confimrOnClick = async () => {
    if (vaultManager) {
      try {
        await vaultManager.removeLiquidity(token0Address, token1Address, bundleID, token1AmountRaw);
        ReactGA.event({
          category: 'Liquidity',
          action: 'Remove',
          label: [currency0?.symbol, currency1?.symbol].join('/'),
        })
      }
      catch (error) {
        console.error('Failed to send transaction', error)
        setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        if (error?.code !== 4001) {
          console.error(error)
        }
      }
    }
    removeOnClick();
  }
  const StyledArrowLeft = styled(ArrowLeft)`

  color:white;
` 
  const StyledHelpCircle = styled(HelpCircle)`
    color:white;
  `
  return (
    // <LinkRow to={positionSummaryLink}>
    <>
     <Modal isOpen={removeClicked}  minHeight={false} maxHeight={100}>
       <div className="hideBackground">
          <div className="remove-liquidity-warrap">
            <div className="remove-liquidity">
              <RowBetween style={{    padding: "32px 28px 0px"}}>
                <button onClick = {removeOnClick} style={{ width: "0", height: "100%",background:'transparent', border: "0px" }} >
                  <StyledArrowLeft  />
                </button>
                <div className="remove-header-top" style={{ display: "flex", margin:'auto', justifyContent: "center" }}>
                    <p style={{margin:" 0px", fontSize:'24px'}} >Migrate Liquidity</p>
                </div>
              </RowBetween>
             
            <div className="single-liquidity-content" style={{ marginTop:'32px',overflow: 'hidden', padding:'0px 32px',width:'100%' }}>
              <div style={{ display: collapse ? "none" : "flex", justifyContent: "space-between" }}>
                <p className="single-token-left">Capital to receive</p>
                <p className="single-token-right " style={{ display:"flex", justifyContent: "space-between" }}>
                  <span className="value-num">{(+token0Amount).toFixed(2)}</span>
                  <span className="value-unit">   {"LP"}</span>                
                </p>
              </div>
              <div style={{ display: collapse ? "none" : "flex", justifyContent: "space-between" }}>
                <p className="single-token-left">Token to deposit</p>
                <p className="single-token-right" style={{ display:"flex", justifyContent: "space-between" }}>
                  <span className="value-num">{(+token0Amount).toFixed(2)}</span>
                  <span className="value-unit">   {currency0?.symbol}</span>                
                </p>
              </div>
              <div style={{ display: collapse ? "none" : "flex", justifyContent: "space-between" }}>
                <p className="single-token-left">Protocol fee deducted</p>
                <p className="single-token-right" style={{ display:"flex", justifyContent: "space-between" }}>
                  <span className="value-num">{(+token0Amount).toFixed(2)}</span>
                  <span className="value-unit">   {currency0?.symbol}</span>                
                </p>
              </div>
              <div style={{ display: collapse ? "none" : "flex", justifyContent: "space-between" }}>
                <p className="single-token-left">Capital imported</p>
                <p className="single-token-right" style={{ display:"flex", justifyContent: "space-between" }}>
                  <span className="value-num">{'1070'}</span>
                  <span className="value-unit">   {'DAI'}</span>                
                </p>
              </div>
              <div style={{ display: collapse ? "none" : "flex", justifyContent: "space-between" }}>
                <p className="single-token-left">Token imported</p>
                <p className="single-token-right" style={{ display:"flex", justifyContent: "space-between" }}>
                  <span className="value-num">{(+token0Amount).toFixed(2)}</span>
                  <span className="value-unit">    {currency0?.symbol}</span>                
                </p>
              </div>
              <div style={{ display: collapse ? "none" : "flex", justifyContent: "space-between" }}>
                <p className="single-token-left">Return</p>
                <p className="single-token-right" style={{ display:"flex", justifyContent: "space-between" }}>
                  <span className="value-num">{'110%'}</span>
                  <span className="value-unit">   {'APY'}</span>                
                </p>
              </div>
              
              <div style={{ marginTop:'50px', justifyContent: "center", transition: "1s" }}>
                <button onClick={() => setShowConfirm(true)}><p>Migrate</p></button>
              </div>
            </div>
            </div>
          </div>
       </div>
         
     </Modal>
      <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={handleDismissConfirmation}
          attemptingTxn={attemptingTxn}
          hash={0x4698e1e048d920e0551c927363ba9a4746dc72394484d9974b8a37eb075ba2e3}
          content={() => (
            <ConfirmationModalContent
              title={""}
              onDismiss={handleDismissConfirmation}
              bottomContent={() => (
                <button className='view-etherscan'>
                  <p>
                    View on Etherscan
                  </p>
                </button>
              )}
            />
          )}
        />
      <RowBetween>
        <>{!removeClicked ? 
        <>
         <div className="single-liquidity" style={index%2==0?{backgroundColor:'#2F2A3C'}:{backgroundColor:'#201D29'}}>
            <a onClick={changeCollpase} style={{ cursor: "pointer" }}>
              <div className="single-liquidity-header">
                <div className="single-liquidity-header-left">
                <PrimaryPositionIdData>
                  <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={36} margin />
                  <DataText>
                    &nbsp;{currency0?.symbol}&nbsp;/&nbsp;{currency1?.symbol}&nbsp;&nbsp;
                    (#{bundleID})&nbsp;&nbsp;
                    {liquidityRaw == 0 ? "(Closed)": ""}
                  </DataText>
                  &nbsp;
                </PrimaryPositionIdData>
                </div>
                <div className="single-liquidity-header-right">
                  <img src="./images/up2.png" style={{ width: "20px", height: "20px", display: collapse ? "none" : "block" }} />
                  <img src="./images/down2.png" style={{ width: "20px", height: "20px", display: collapse ? "block" : "none" }} />
                </div>
              </div>
            </a>
            
              
              {liquidityRaw == 0 ? 
              <div className="single-liquidity-content" style={{ height: collapse ? "0px" :"115px", overflow: 'hidden' }}>
                  <div style={{ display: collapse ? "none" : "flex", justifyContent: "space-between" }}>
                    <p className="single-token-left">Capital supplied</p>
                    <p className="single-token-right " style={{ display:"flex", justifyContent: "space-between" }}>
                      <span className="value-num">{(+token0Amount).toFixed(2)}</span>
                      <span className="value-unit">   {"WETH"}</span>                
                    </p>
                  </div>
                  <div style={{ display: collapse ? "none" : "flex", justifyContent: "space-between" }}>
                    <p className="single-token-left">Capital received</p>
                    <p className="single-token-right" style={{ display:"flex", justifyContent: "space-between" }}>
                      <span className="value-num">{(+token0Amount).toFixed(2)}</span>
                      <span className="value-unit">   {'WETH'}</span>                
                    </p>
                  </div>
                  <div style={{ display: collapse ? "none" : "flex", justifyContent: "space-between" }}>
                    <p className="single-token-left">Token received</p>
                    <p className="single-token-right" style={{ display:"flex", justifyContent: "space-between" }}>
                      <span className="value-num">{(+token0Amount).toFixed(2)}</span>
                      <span className="value-unit">   {'DBL'}</span>                
                    </p>
                  </div>
               </div>   
              : 
                <div className="single-liquidity-content" style={{ height: collapse ? "0px" :"288px", overflow: 'hidden' }}>
                  <div style={{ display: collapse ? "none" : "flex", justifyContent: "space-between" }}>
                    <p className="single-token-left">Capital supplied</p>
                    <p className="single-token-right " style={{ display:"flex", justifyContent: "space-between" }}>
                      <span className="value-num">{(+token0Amount).toFixed(2)}</span>
                      <span className="value-unit">   {"DAI"}</span>                
                    </p>
                  </div>
                  <div style={{ display: collapse ? "none" : "flex", justifyContent: "space-between" }}>
                    <p className="single-token-left">Token borrowed</p>
                    <p className="single-token-right" style={{ display:"flex", justifyContent: "space-between" }}>
                      <span className="value-num">{(+token0Amount).toFixed(2)}</span>
                      <span className="value-unit">   {'DBL'}</span>                
                    </p>
                  </div>
                  <div style={{ display: collapse ? "none" : "flex", justifyContent: "space-between" }}>
                    <p className="single-token-left">Pool Token amount</p>
                    <p className="single-token-right" style={{ display:"flex", justifyContent: "space-between" }}>
                      <span className="value-num">{(+token0Amount).toFixed(2)}</span>
                      <span className="value-unit">   {'LP'}</span>                
                    </p>
                  </div>              
                  <div style={{ display: collapse ? "none" : "flex", justifyContent: "space-between" }}>
                      <p className="single-token-left">Pool share</p>
                      <p className="single-token-right" style={{ display:"flex", justifyContent: "space-between" }}>
                        <span className="value-num">{'0.14%'}</span>
                        <span className="value-unit">   {'Pool'}</span>                
                      </p>
                  </div>
                  <div style={{ display: collapse ? "none" : "flex", justifyContent: "space-between" }}>
                      <p className="single-token-left">Pool capital amount</p>
                      <p className="single-token-right" style={{ display:"flex", justifyContent: "space-between" }}>
                        <span className="value-num">{(+token0Amount).toFixed(2)}</span>
                        <span className="value-unit">    {'DBL'}</span>                
                      </p>
                  </div>
                  <div style={{ display: collapse ? "none" : "flex", justifyContent: "space-between" }}>
                      <p className="single-token-left">Pool token amount</p>
                      <p className="single-token-right" style={{ display:"flex", justifyContent: "space-between" }}>
                        <span className="value-num">{(+token0Amount).toFixed(2)}</span>
                        <span className="value-unit">   {currency0?.symbol}</span>                
                      </p>
                  </div>
                  <div style={{ display: collapse ? "none" : "flex", justifyContent: "center", transition: "1s" }}>
                      <button onClick={() => setRemoveClicked(true)}><p style={{fontSize:'20px', fontWeight:'600'}}>Remove Liquidity</p></button>
                  </div>
                </div>  
                }
               
              
              
              
          </div> 
        </>
          :
          <div >
           
          </div>
        }
        </>
      </RowBetween>
    </>
  )
}
