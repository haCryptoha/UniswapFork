// @ts-nocheck
import { Percent, Price, Token } from '@uniswap/sdk-core'
import { Position } from '@uniswap/v3-sdk'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { RowBetween } from 'components/Row'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import { useToken } from 'hooks/Tokens'
import { useVaultManagerContract } from 'hooks/useContract'
import { useCallback, useMemo, useState } from 'react'
import ReactGA from 'react-ga4'
import { Link } from 'react-router-dom'
import { Bound } from 'state/mint/v3/actions'
import styled from 'styled-components/macro'
import { HideSmall, MEDIA_WIDTHS, SmallOnly } from 'theme'
import { PositionDetails } from 'types/position'
import { unwrappedToken } from 'utils/unwrappedToken'

import { DAI, USDC_MAINNET, USDT, WBTC, WRAPPED_NATIVE_CURRENCY } from '../../constants/tokens'

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

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 14px;
  `};
`

interface PositionListItemProps {
  positionDetails: PositionDetails
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

export default function PositionListItem({ positionDetails }: PositionListItemProps) {
  const {
    capital: token0Address,
    asset: token1Address,
    lpAmount: liquidity,
    capitalAmount: token0Amount,
    assetAmount: token1Amount,
    bundle: bundleID,
  } = positionDetails;

  const [collapse, setCollapse] = useState(true);
  const [removed, setRemoved] = useState(false);
  const [removeClicked, setRemoveClicked] = useState(false);
  const vaultManager = useVaultManagerContract();
  
  const removeOnClick = () => {
    if (removeClicked === false)
      setRemoveClicked(true);
    else setRemoveClicked(false);
  }
  const changeCollpase = () => {
    if (collapse === true)
      setCollapse(false);
    else setCollapse(true);
  }

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined
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
    setRemoved(true);
    if (vaultManager) {
      try {
        await vaultManager.removeLiquidity(token0Address, token1Address, bundleID, "1000000000000000");
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

  return (
    // <LinkRow to={positionSummaryLink}>
    <>
      <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={handleDismissConfirmation}
          attemptingTxn={attemptingTxn}
          hash={txHash}
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
        <>{!removeClicked ? <>{!removed ? <div className="single-liquidity">
            <a onClick={changeCollpase} style={{ cursor: "pointer" }}>
              <div className="single-liquidity-header">
                <div className="single-liquidity-header-left">
                <PrimaryPositionIdData>
                  <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={36} margin />
                  <DataText>
                    &nbsp;{currency0?.symbol}&nbsp;/&nbsp;{currency1?.symbol}
                  </DataText>
                  &nbsp;
                </PrimaryPositionIdData>
                </div>
                <div className="single-liquidity-header-right">
                  <img src="./images/up.png" style={{ width: "20px", height: "20px", display: collapse ? "none" : "block" }} />
                  <img src="./images/down.png" style={{ width: "20px", height: "20px", display: collapse ? "block" : "none" }} />
                </div>
              </div>
            </a>
            <div className="single-liquidity-content" style={{ height: collapse ? "0px" : "296px", overflow: 'hidden' }}>
              <div style={{ display: collapse ? "none" : "flex", justifyContent: "space-between" }}>
                <p className="single-token-left">Your total pool tokens</p>
                <p className="single-token-right">{liquidity}</p>
              </div>
              <div style={{ display: collapse ? "none" : "flex", justifyContent: "space-between" }}>
                <p className="single-token-left">Pooled {currency0?.symbol}</p>
                <p className="single-token-right">{token0Amount} {currency0?.symbol}</p>
              </div>
              <div style={{ display: collapse ? "none" : "flex", justifyContent: "space-between" }}>
                <p className="single-token-left">Pooled {currency1?.symbol}</p>
                <p className="single-token-right">{token1Amount} {currency1?.symbol}</p>
              </div>
              <div style={{ display: collapse ? "none" : "flex", justifyContent: "space-between" }}>
                <p className="single-token-left">Your pool share</p>
                <p className="single-token-right">0.14%</p>
              </div>
              <div className="description" style={{ display: collapse ? "none" : "flex", transition: "1s" }}>
                <p>View Accure Fees and Analytics</p>
              </div>
              <div style={{ display: collapse ? "none" : "flex", justifyContent: "center", transition: "1s" }}>
                <button onClick={() => setRemoveClicked(true)}><p>Remove</p></button>
              </div>
            </div>
          </div> : <></>}
        </>
          :
          <div className="remove-liquidity-warrap">
            <div className="remove-liquidity">
              {/* <div className="remove-header-top" style={{ display: "flex", justifyContent: "center" }}>
                                <p>Remove Liquidity</p>
                            </div> */}
              <div className="remove-header">
                <p >
                  Confirm to close your position
                </p>
              </div>
              <div className="remove-content">
                <div className="content-header">
                  <p>You will receive</p>
                </div>
                <div className="description2">
                  <div className="eth">
                    <div className="eth-left">
                      <p>{token0Amount}</p>
                    </div>
                    <div className="eth-right">
                      <CurrencyLogo currency={currency0} size={'32px'} style={{ marginRight: '12px' }} />
                      <p>{currency0?.symbol}</p>
                    </div>
                  </div>
                  <div className="eth">
                    <div className="eth-left">
                      <p>{token1Amount}</p>
                    </div>
                    <div className="eth-right">
                      <CurrencyLogo currency={currency1} size={'32px'} style={{ marginRight: '12px' }} />
                      <p>{currency1?.symbol}</p>
                    </div>
                  </div>
                  <div className="change-description">
                    <p>Output is estimated. If the price changes by more than 0.5% your transaction will revert.</p>
                  </div>
                  <div className="earned-table-header">
                    <p>{currency0?.symbol}&nbsp;/&nbsp;{currency1?.symbol}</p>
                  </div>
                  <div className="earned-table">
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div><p style={{ color: "#A6A0BB" }}>{currency1?.symbol} / {currency1?.symbol}</p></div>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <p style={{ color: "white" }}>{liquidity}</p>
                        <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={36} margin />
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div><p style={{ color: "#A6A0BB" }}>{currency1?.symbol} / {currency1?.symbol}</p></div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", justifyContent: "end" }}>
                          <p style={{ color: "white" }}>1 {currency0?.symbol}= {(token1Amount / token0Amount).toFixed(2)} {currency1?.symbol}</p>
                        </div>
                        <p style={{ color: "white" }}>1 {currency1?.symbol}={(token0Amount / token1Amount).toFixed(2)} {currency0?.symbol}</p>
                      </div>
                    </div>
                    <div style={{ width: "380", height: "71px", display: "flex", justifyContent: "center" }}>
                      <p style={{ color: "white", fontSize: "20px", fontWeight: "700" }}>You earned 15% APY with Double</p>
                    </div>

                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
                    <div className="cancel-button-warrap">
                      <button className="cancel-button" style={{ width: "199px", height: "46px", border: "0px" }} onClick={removeOnClick}><p>cancel</p></button>
                    </div>
                    <button className="confirm" style={{ width: "201px", height: "48px", border: "0px" }} onClick={confimrOnClick}><p>confirm</p></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        </>
      </RowBetween>
    </>
  )
}
